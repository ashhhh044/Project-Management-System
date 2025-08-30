import './styles.css';
import './TaskForm.css';
import plusCircle from './assets/plus-circle-dotted.svg';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

function TaskForm({ projectId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch logged-in user
    fetch("http://localhost:5000/me", { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data))
      .catch(() => setUser(null));
  }, []);

  if (!projectId) return null;

  return (
    <div id="add-task" className="add-task" style={{ textAlign: 'center', marginTop: '50px' }}>
      {user?.role === "admin" ? (
        <>
          <Link to={`/projects/${projectId}/add-task-card`}>
            <img 
              src={plusCircle} 
              alt="add-task-button" 
              style={{ width: '40px', cursor: 'pointer', marginBottom: '10px' }} 
            />
          </Link>
          <p>No tasks in this project<br />Click + to add</p>
        </>
      ) : (
        <p>No tasks in this project.</p>
      )}
    </div>
  );
}

export default TaskForm;
