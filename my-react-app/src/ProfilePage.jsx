import { useEffect, useState } from "react";
import NavBar from "./NavBar";
import Footer from "./Footer";
import "./ProfilePage.css"; // your custom CSS

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:5000/me", { credentials: "include" });
        if (!res.ok) throw new Error("Not logged in");
        const userData = await res.json();
        setUser(userData);

        const memberId = userData.memberId;
        if (!memberId) {
          setProjects([]);
          setTasks([]);
          setLoading(false);
          return;
        }
        const projectRes = await fetch(`http://localhost:5000/users/${memberId}/projects`);
        const assignedProjects = await projectRes.json();
        setProjects(assignedProjects);
        const taskRes = await fetch("http://localhost:5000/tasks");
        const allTasks = await taskRes.json();

        const assignedTasks = allTasks.filter(task => {
          let assigned = task.assigned_to;
          if (typeof assigned === "string") {
            try {
              assigned = JSON.parse(assigned);
            } catch {
              assigned = [];
            }
          }
          if (typeof assigned === "number") assigned = [assigned];
          if (!Array.isArray(assigned)) assigned = [];
          return assigned.includes(Number(memberId));
        });

        setTasks(assignedTasks);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <p className="profile-loading">Loading profile...</p>;
  if (!user) return <p className="profile-loading">User not found or not logged in.</p>;

  return (
    <>
      <NavBar />
      <div className="profile-page-container">
        <div className="profile-card">
          <h2>{user.name}'s Profile</h2>
          <p><strong>Role:</strong> {user.role}</p>
        </div>

        <div className="profile-section">
          <h3>Projects Assigned</h3>
          {projects.length > 0 ? (
            <ul className="project-list">
              {projects.map(p => (
                <li key={p.id} className="project-item">{p.project_name}</li>
              ))}
            </ul>
          ) : (
            <p>No projects assigned.</p>
          )}
        </div>

        <div className="profile-section">
          <h3>Tasks Assigned</h3>
          {tasks.length > 0 ? (
            tasks.map(task => (
              <div key={task.id} className="task-card">
                <p><strong>Name:</strong> {task.name}</p>
                <p><strong>Priority:</strong> {task.priority}</p>
                <p><strong>Deadline:</strong> {task.deadline ? new Date(task.deadline).toISOString().split("T")[0] : "No deadline"}</p>
                <p><strong>Stage:</strong> {task.stage}</p>
              </div>
            ))
          ) : (
            <p>No tasks assigned.</p>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default ProfilePage;