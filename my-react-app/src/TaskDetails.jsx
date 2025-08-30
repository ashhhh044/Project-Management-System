import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";
import "./TaskDetails.css"; 

function TaskDetails() {
  const { id, taskId } = useParams(); 
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    // fetch task
    fetch(`http://localhost:5000/projects/${id}/tasks/${taskId}`)
      .then(res => res.json())
      .then(data => setTask(data))
      .catch(err => console.error("Failed to fetch task:", err))
      .finally(() => setLoading(false));

    // fetch all members
    fetch("http://localhost:5000/members")
      .then(res => res.json())
      .then(data => setMembers(data))
      .catch(err => console.error("Failed to fetch members:", err));
  }, [id, taskId]);

  if (loading) return <p>Loading task...</p>;
  if (!task) return <p>Task not found.</p>;

  return (
    <>
      <NavBar />
      <div className="task-details-container">
        <h2>Task Details</h2>
        <ul>
          <li><strong>Name:</strong> {task.name}</li>
          <li><strong>Priority:</strong> {task.priority}</li>
          <li><strong>Duration:</strong> {task.duration} days</li>
          <li>
            <strong>Deadline:</strong>{" "}
            {task.deadline
              ? new Date(task.deadline).toISOString().split("T")[0]
              : "No deadline"}
          </li>
          <li>
            <strong>Assigned To:</strong>{" "}
            {task.assigned_to && task.assigned_to.length > 0
              ? task.assigned_to
                  .map(id => members.find(m => m.id === id)?.member_name)
                  .filter(Boolean)
                  .join(", ")
              : "Not assigned"}
          </li>
          <li><strong>Stage:</strong> {task.stage}</li>
        </ul>

        <Link to={`/projects/${id}/tasks`} className="back-btn">
          Back to Tasks
        </Link>
      </div>
      <Footer />
    </>
  );
}

export default TaskDetails;
