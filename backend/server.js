import express from 'express';
import mysql from 'mysql2';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import cookieParser from 'cookie-parser';

dotenv.config();
const app = express();

app.use(cookieParser());

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

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// Signup Route
app.post('/signin', async (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  // Hash password
  const hashed = await bcrypt.hash(password, 10);

  // Insert into DB
  db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashed], (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Username already exists' });
      }
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'User registered successfully' });
  });
});

// Login Route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (results.length === 0) return res.status(401).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, results[0].password);
    if (!match) return res.status(401).json({ error: 'Incorrect password' });

    res.header('Access-Control-Allow-Credentials', 'true');
    // Add name and role to the token payload
    const token = jwt.sign(
      { id: results[0].id, name: results[0].username, role: results[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('JWT token:', token);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    res.status(200).json({ token });
  });
});

// Middleware to check authentication
function isAuthenticated(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Middleware to check admin role
function isAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden - Admins only" });
  }
  next();
}

// Middleware to extract user role from JWT
app.get("/me", (req, res) => {
  console.log('Cookies:', req.cookies);
  console.log('User:', req.user);
  if (!req.user) {
    return res.status(401).json({ error: "Not logged in" });
  }
  res.json({ id: req.user.id, name: req.user.name, role: req.user.role });
});

// Multer setup: store uploads in 'uploads' folder with unique names
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // make sure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  }
});
const upload = multer({ storage });

//adding projects
app.post("/add-project", isAuthenticated, isAdmin, upload.single("resource"), (req, res) => {
  try {
    const { project_name, due_date, members } = req.body;
    const file = req.file;

    if (!project_name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    // Resource path (if file uploaded)
    const resources = file ? `/uploads/${file.filename}` : null;

    // Insert project
    db.query(
      "INSERT INTO projects (project_name, due_date, resources) VALUES (?, ?, ?)",
      [project_name, due_date, resources || null],
      (err, result) => {
        if (err) {
          console.error("DB insert error:", err.message);
          return res.status(500).json({ error: "Database insert error", details: err.message });
        }

        const projectId = result.insertId;

        // Insert members into junction table (if you already created one)
        if (members) {
          let parsedMembers = [];
          try {
            parsedMembers = JSON.parse(members);
          } catch (parseErr) {
            console.error("Failed to parse members JSON:", parseErr.message);
          }

          if (parsedMembers.length > 0) {
            const values = parsedMembers.map(memberId => [projectId, memberId]);
            db.query(
              "INSERT INTO project_members (project_id, member_id) VALUES ?",
              [values],
              (memberErr) => {
                if (memberErr) {
                  console.error("DB member insert error:", memberErr.message);
                  return res.status(500).json({ error: "Failed to assign members", details: memberErr.message });
                }
                return res.json({ message: "Project added successfully with members", id: projectId });
              }
            );
          } else {
            return res.json({ message: "Project added successfully (no members assigned)", id: projectId });
          }
        } else {
          return res.json({ message: "Project added successfully", id: projectId });
        }
      }
    );
  } catch (error) {
    console.error("Server crash in /add-project:", error.message);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Get all projects
app.get('/projects', (req, res) => {
  db.query('SELECT * FROM projects', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});


// Get all members
app.get('/members', (req, res) => {
  db.query('SELECT * FROM members', (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error fetching members' });
    res.json(results);
  });
});

// Get a member by ID
app.get('/members/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM members WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'Member not found' });
    res.json(results[0]);
  });
});

// Add a new member
app.post('/members', (req, res) => {
  const { member_name, designation, title } = req.body;
  if (!member_name || !designation || !title) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  db.query(
    'INSERT INTO members (member_name, designation, title) VALUES (?, ?, ?)',
    [member_name, designation, title],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ message: 'Member added successfully', memberId: result.insertId });
    }
  );
});

// Update a member by ID
app.put('/members/:id', (req, res) => {
  const { id } = req.params;
  const { member_name, designation, title } = req.body;
  if (!member_name || !designation || !title) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  db.query(
    'UPDATE members SET member_name = ?, designation = ?, title = ? WHERE id = ?',
    [member_name, designation, title, id],
    (err) => {
      if (err) return res.status(500).json({ error: 'DB error updating member' });
      res.json({ message: 'Member updated successfully' });
    }
  );
});

// Delete a member by ID
app.delete('/members/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM members WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'DB error deleting member' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Member not found' });
    res.json({ message: 'Member deleted' });
  });
});

// GET all tasks
app.get('/tasks', (req, res) => {
  db.query('SELECT id, name, priority, duration, deadline FROM tasks', (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error fetching tasks' });
    res.json(results);
  });
});

// GET task by id
app.get('/tasks/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT id, name, priority, duration, deadline FROM tasks WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error fetching task' });
    if (results.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(results[0]);
  });
});

// POST add a new task
app.post('/tasks', (req, res) => {
  const { name, priority, duration, deadline } = req.body;
  if (!name || !priority || !duration || !deadline) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  db.query(
    'INSERT INTO tasks (name, priority, duration, deadline) VALUES (?, ?, ?, ?)',
    [name, priority, duration, deadline],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'DB error adding task' });
      res.json({ message: 'Task added successfully', taskId: result.insertId });
    }
  );
});

// PUT update a task
app.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { name, priority, duration, deadline } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    const current = rows[0];

    const updatedName     = name       !== undefined ? name       : current.name;
    const updatedPriority = priority   !== undefined ? priority   : current.priority;
    const updatedDuration = duration   !== undefined && duration !== '' ? Number(duration) : current.duration;
    const updatedDeadline = deadline   !== undefined ? deadline   : current.deadline;

    console.log('Updating task:', { updatedName, updatedPriority, updatedDuration, updatedDeadline, id });

    await pool.query(
      'UPDATE tasks SET name = ?, priority = ?, duration = ?, deadline = ? WHERE id = ?',
      [updatedName, updatedPriority, updatedDuration, updatedDeadline, id]
    );

    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    console.error('PUT /tasks/:id error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


// DELETE a task
app.delete('/tasks/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM tasks WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'DB error deleting task' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted successfully' });
  });
});




app.listen(5000, () => console.log('✅ Backend running on http://localhost:5000'));
