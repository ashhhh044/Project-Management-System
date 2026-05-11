import express from "express";
import mysql from "mysql2";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();

//  Middleware
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(bodyParser.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uploads Folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// DB Connection 
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// Use promise wrapper
const db = pool.promise();

// Auth Helpers 
function authenticateJWT(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    req.user = null;
    return next();
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      req.user = null;
      return next();
    }
    req.user = decoded;
    next();
  });
}
app.use(authenticateJWT);

function isAuthenticated(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  next();
}

function isAdmin(req, res, next) {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden - Admins only" });
  next();
}

// Auth Routes
app.post("/signin", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password are required" });
  if (password.length < 8)
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters long" });

  const hashed = await bcrypt.hash(password, 10);

  try {
    await db.query("INSERT INTO users (username, password) VALUES (?, ?)", [
      username,
      hashed,
    ]);
    res.json({ message: "User registered successfully" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(400).json({ error: "Username already exists" });
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [results] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (results.length === 0)
      return res.status(401).json({ error: "User not found" });

    const match = await bcrypt.compare(password, results[0].password);
    if (!match) return res.status(401).json({ error: "Incorrect password" });

    // Find corresponding member ID
    const [memberRows] = await db.query(
      "SELECT id FROM members WHERE member_name = ? LIMIT 1",
      [username]
    );

    const memberId = memberRows.length ? memberRows[0].id : null;

    const token = jwt.sign(
      {
        id: results[0].id, // user id
        name: results[0].username,
        role: results[0].role,
        memberId,           // include member ID in JWT
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not logged in" });
  // Include memberId in the response for normal users
  res.json({
    id: req.user.id,
    name: req.user.name,
    role: req.user.role,
    memberId: req.user.memberId || null
  });
});

app.post("/logout", (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
  res.json({ message: "Logged out" });
});

//File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Project Routes
app.post(
  "/add-project",
  isAuthenticated,
  isAdmin,
  upload.single("resource"),
  async (req, res) => {
    try {
      const { project_name, due_date, members } = req.body;
      if (!project_name)
        return res.status(400).json({ error: "Project name is required" });

      const resources = req.file
        ? JSON.stringify([`/uploads/${req.file.filename}`])
        : JSON.stringify([]);

      const [result] = await db.query(
        "INSERT INTO projects (project_name, due_date, resources) VALUES (?, ?, ?)",
        [project_name, due_date, resources]
      );

      const projectId = result.insertId;

      if (members) {
        let parsedMembers = [];
        try {
          parsedMembers = JSON.parse(members);
        } catch (e) {
          console.error("Failed to parse members JSON:", e.message);
        }

        if (parsedMembers.length > 0) {
          const values = parsedMembers.map((m) => [projectId, m]);
          await db.query(
            "INSERT INTO project_members (project_id, member_id) VALUES ?",
            [values]
          );
        }
      }

      res.json({ message: "Project added successfully", id: projectId });
    } catch (error) {
      console.error("Error in /add-project:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

app.get("/projects", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM projects");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/projects/:id/resources", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT resources FROM projects WHERE id = ?",
      [req.params.id]
    );
    if (!rows.length) return res.json([]);

    let resources = rows[0].resources;
    if (!resources) return res.json([]);

    if (typeof resources === "string") {
      try {
        resources = JSON.parse(resources);
      } catch {
        resources = [resources];
      }
    }
    res.json(resources);
  } catch (error) {
    console.error("Error in /projects/:id/resources:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// get full project details including members and tasks
app.get('/projects/:id/details', async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch project
    const [projectRows] = await db.query(
      "SELECT id, project_name, due_date, creation_date, resources FROM projects WHERE id = ?",
      [id]
    );
    if (projectRows.length === 0) return res.status(404).json({ error: "Project not found" });
    const project = projectRows[0];

    // parse resources to always be an array
    try {
      project.resources = project.resources
        ? JSON.parse(project.resources)
        : [];
      if (!Array.isArray(project.resources)) {
        project.resources = [project.resources];
      }
    } catch {
      project.resources = [project.resources];
    }

    //fetch project members
    const [memberRows] = await db.query(`
      SELECT m.id, m.member_name, m.designation, m.title
      FROM project_members pm
      JOIN members m ON pm.member_id = m.id
      WHERE pm.project_id = ?
    `, [id]);
    project.members = memberRows;

    //fetch tasks for the project
    const [taskRows] = await db.query(`
      SELECT id, name, stage, assigned_to
      FROM tasks
      WHERE project_id = ?
    `, [id]);

    // Parse assigned_to JSON and optionally fetch member names
    for (let task of taskRows) {
      if (task.assigned_to) {
        let memberIds = [];
        try { memberIds = JSON.parse(task.assigned_to); } catch(e){ memberIds = [] }
        if (memberIds.length > 0) {
          const [assignedMembers] = await db.query(
            `SELECT id, member_name, designation, title FROM members WHERE id IN (?)`,
            [memberIds]
          );
          task.assigned_members = assignedMembers;
        } else task.assigned_members = [];
      } else task.assigned_members = [];
    }

    project.tasks = taskRows;

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch project details" });
  }
});

// Update project by ID
app.put("/projects/:id", upload.single("resource"), async (req, res) => {
  try {
    const { id } = req.params;
    const { project_name, due_date, members } = req.body;
    const file = req.file;

    // Debug logs removed for production

    // Fetch existing project to keep old resources if no new file uploaded
    const [existingRows] = await db.query("SELECT resources FROM projects WHERE id = ?", [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    let resources = existingRows[0].resources || "[]";
    try {
      resources = JSON.parse(resources);
    } catch {
      resources = [];
    }

    if (file) {
      // add new resource
      resources.push(`/uploads/${file.filename}`);
    }

    // Update project
    const updateQuery = `
      UPDATE projects 
      SET project_name = ?, due_date = ?, resources = ? 
      WHERE id = ?
    `;
    await db.query(updateQuery, [
      project_name,
      due_date,
      JSON.stringify(resources), 
      id,
    ]);

    // Update members
    if (members) {
      let memberIds;
      try {
        memberIds = JSON.parse(members);
      } catch (e) {
        console.error("Members JSON parse error:", e);
        return res.status(400).json({ error: "Invalid members format" });
      }

      await db.query("DELETE FROM project_members WHERE project_id = ?", [id]);

      if (memberIds.length > 0) {
        const values = memberIds.map((m) => [id, m]);
        await db.query(
          "INSERT INTO project_members (project_id, member_id) VALUES ?",
          [values]
        );
      }
    }

    res.json({ message: "Project updated successfully" });
  } catch (err) {
    console.error(" Error updating project:", err);
    res.status(500).json({ error: "Failed to update project" });
  }
});

//Delete project by id
app.delete('/projects/:id', async (req, res) => {
  const projectId = req.params.id;

  try {
    // 1. Delete project members
    await db.query('DELETE FROM project_members WHERE project_id = ?', [projectId]);

    // 2. Delete project tasks (optional if tasks are linked)
    await db.query('DELETE FROM tasks WHERE project_id = ?', [projectId]);

    // 3. Delete project itself
    const [result] = await db.query('DELETE FROM projects WHERE id = ?', [projectId]);

    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Project not found' });

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Database error deleting project' });
  }
});


// ================== Member Routes ==================
app.get("/members", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM members");
    res.json(results);
  } catch {
    res.status(500).json({ error: "DB error fetching members" });
  }
});

app.get("/members/:id", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM members WHERE id = ?", [
      req.params.id,
    ]);
    if (results.length === 0)
      return res.status(404).json({ error: "Member not found" });
    res.json(results[0]);
  } catch {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/members", async (req, res) => {
  const { member_name, designation, title } = req.body;

  if (!member_name || member_name.trim() === "")
    return res.status(400).json({ error: "Member name is required" });

  try {
    const [result] = await db.query(
      "INSERT INTO members (member_name, designation, title) VALUES (?, ?, ?)",
      [member_name, designation || null, title || null] // use null if empty
    );
    res.json({ message: "Member added successfully", memberId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/members/:id", async (req, res) => {
  const { member_name, designation, title } = req.body;
  if (!member_name || !designation || !title)
    return res.status(400).json({ error: "All fields are required" });

  try {
    await db.query(
      "UPDATE members SET member_name = ?, designation = ?, title = ? WHERE id = ?",
      [member_name, designation, title, req.params.id]
    );
    res.json({ message: "Member updated successfully" });
  } catch {
    res.status(500).json({ error: "DB error updating member" });
  }
});

app.delete("/members/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM members WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Member not found" });
    res.json({ message: "Member deleted" });
  } catch {
    res.status(500).json({ error: "DB error deleting member" });
  }
});

// ================== Task Routes ==================
app.get("/tasks", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT id, name, priority, duration, deadline, assigned_to, stage, dependencies FROM tasks"
    );
    res.json(results.map(task => {
      let assigned = [];
      if (task.assigned_to) {
        try {
          assigned = JSON.parse(task.assigned_to);
        } catch (e) {
          console.error("Invalid JSON in assigned_to for task id", task.id, ":", task.assigned_to);
          assigned = [];
        }
      }
      let dependencies = [];
      if (task.dependencies) {
        try {
          dependencies = JSON.parse(task.dependencies);
        } catch (e) {
          console.error("Invalid JSON in dependencies for task id", task.id, ":", task.dependencies);
          dependencies = [];
        }
      }
      return { ...task, assigned_to: assigned, dependencies };
    }));
  } catch (err) {
    console.error("Error in /tasks endpoint:", err);
    res.status(500).json({ error: "DB error fetching tasks", message: err.message });
  }
});

app.get("/projects/:id/tasks", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT id, name, priority, duration, deadline, assigned_to, stage FROM tasks WHERE project_id = ?",
      [req.params.id]
    );

    const safeResults = results.map(task => {
  let assigned = [];
  if (task.assigned_to) {
    try {
      assigned = JSON.parse(task.assigned_to);
    } catch (e) {
      // If it's a single number (common mistake), wrap in array
      if (!isNaN(task.assigned_to)) {
        assigned = [Number(task.assigned_to)];
      } else {
        assigned = [];
      }
    }
  }
  // If assigned is a number (bad data), wrap as array
  if (typeof assigned === "number") assigned = [assigned];
  if (!Array.isArray(assigned)) assigned = [];
  return { ...task, assigned_to: assigned };
});

    res.json(safeResults);
  } catch (err) {
    console.error("Error fetching tasks for project:", err);
    res.status(500).json({ error: "DB error fetching tasks for project" });
  }
});

app.post("/projects/:id/tasks", async (req, res) => {
  const { name, priority, duration, deadline, assigned_to, stage, dependencies } = req.body;
  const projectId = req.params.id;

  if (!name || !priority || !duration || !deadline)
    return res.status(400).json({ error: "All required fields must be filled" });

  try {
    const [result] = await db.query(
      "INSERT INTO tasks (name, priority, duration, deadline, assigned_to, stage, project_id, dependencies) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        priority,
        duration,
        deadline,
        JSON.stringify(assigned_to || []),
        stage,
        projectId,
        JSON.stringify(dependencies || [])
      ]
    );

    res.json({
      id: result.insertId,
      projectId,
      name,
      priority,
      duration,
      deadline,
      stage,
      assigned_to: assigned_to || [],
      dependencies: dependencies || []
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error adding task" });
  }
});

app.get("/projects/:projectId/tasks/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Task not found" });

    const task = rows[0];

    // Parse assigned_to JSON and fetch member details
    let assignedMembers = [];
    if (task.assigned_to) {
      let memberIds = [];
      try { memberIds = JSON.parse(task.assigned_to); } catch(e){ memberIds = [] }
      if (memberIds.length > 0) {
        const [members] = await db.query("SELECT id, member_name, designation, title FROM members WHERE id IN (?)", [memberIds]);
        assignedMembers = members;
      }
    }

    task.assigned_members = assignedMembers;
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch task details" });
  }
});

app.put("/projects/:projectId/tasks/:id", async (req, res) => {
  const { name, priority, duration, deadline, stage, assigned_to } = req.body;

  try {
    // Fetch current task
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Task not found" });

    const current = rows[0];

    // Prepare updated values
    const updatedName = name ?? current.name;
    const updatedPriority = priority ?? current.priority;
    const updatedDuration =
      duration !== undefined && duration !== "" ? Number(duration) : current.duration;
    const updatedDeadline = deadline ?? current.deadline;
    const updatedStage = stage ?? current.stage;
    const updatedMembers = assigned_to
      ? JSON.stringify(assigned_to)
      : current.assigned_to;

    // Update task
    await db.query(
      "UPDATE tasks SET name = ?, priority = ?, duration = ?, deadline = ?, stage = ?, assigned_to = ? WHERE id = ?",
      [updatedName, updatedPriority, updatedDuration, updatedDeadline, updatedStage, updatedMembers, req.params.id]
    );

    res.json({
      message: "Task updated successfully",
      task: {
        id: req.params.id,
        name: updatedName,
        priority: updatedPriority,
        duration: updatedDuration,
        deadline: updatedDeadline,
        stage: updatedStage,
        assigned_to: assigned_to || (current.assigned_to ? JSON.parse(current.assigned_to) : [])
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error updating task" });
  }
});

app.delete("/projects/:projectId/tasks/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM tasks WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Task not found" });

    res.json({ message: "Task deleted successfully", taskId: req.params.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error deleting task" });
  }
});

app.get("/projects/:id/members", async (req, res) => {
  const projectId = req.params.id;

  const sql = `
    SELECT m.id, m.member_name, m.title, m.designation
    FROM project_members pm
    JOIN members m ON pm.member_id = m.id
    WHERE pm.project_id = ?
  `;

  try {
    const [rows] = await db.query(sql, [projectId]);

    const sanitized = rows.map((m) => ({
      id: m.id,
      member_name: m.member_name || "Unnamed",
      title: m.title || "",
      designation: m.designation || "",
    }));
    res.json(sanitized);
  } catch (err) {
    console.error("Error fetching project members:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/users/:memberId/projects", async (req, res) => {
  const memberId = req.params.memberId;
  try {
    const [rows] = await db.query(`
      SELECT p.* 
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.member_id = ?
    `, [memberId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

// Server 
app.listen(5000, () =>
  console.log("✅ Backend running on http://localhost:5000")
);
