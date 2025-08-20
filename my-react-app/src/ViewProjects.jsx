import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaEdit } from 'react-icons/fa';
import './styles.css';
import AddProject from './AddProject';
import plusCircle from './assets/plus-circle-dotted.svg';

function ViewProjects() {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/projects')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch projects');
        return res.json();
      })
      .then(data => setProjects(data))
      .catch(err => {
        console.error('Failed to fetch projects:', err);
        setProjects([]);
      });
    fetch('http://localhost:5000/me', { credentials: "include" }) 
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => console.error("Failed to fetch user:", err));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`http://localhost:5000/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects(projects.filter(t => t.id !== id));
      } else {
        alert('Failed to delete project');
      }
    } catch (error) {
      alert('Error deleting project');
      console.error(error);
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-project/${id}`);
  };

  // Handle empty project lists
  if (projects.length === 0) {
    if (user?.role === "admin") {
      // Optionally show alert ONCE
      alert('No projects found. Please add a project.');
      return <AddProject />;
    } else {
      return (
        <div id="add-task" className="add-task">
          <p>You have no project assigned yet!!</p>
        </div>
      );
    }
  }

  // Main render
  return (
    <>   
      <div style={{ maxWidth: 700, margin: '20px auto' }}>
        {projects.map(({ id, project_name, resource_path, due_date }) => (
          <div key={id} className="view-task" style={{ marginBottom: '10px' }}>
            <div className="task-details">
              <div className="task-pri-details">
                <label className="task-name">{project_name}</label>
              </div>
              <div className="task-sec-details">
                <div className="priority-badge">
                  <Link to={`/projects/${id}/resources`}>View Resources</Link>
                </div>
                <div className="deadline-badge">{due_date
                  ? new Date(due_date).toISOString().split('T')[0]
                  : 'No due date'}
                </div>
              </div>
            </div>
            <div className="task-icons">
              <FaTrash
                onClick={() => handleDelete(id)}
                title="Delete task"
                style={{ cursor: 'pointer', color: '#e63946' }}
              />
              <FaEdit
                onClick={() => handleEdit(id)}
                title="Edit task"
                style={{ cursor: 'pointer', color: '#1d3557' }}
              />
            </div>
          </div>
        ))}
        {user?.role === "admin" && (
          <div id="add-task" className="add-task">
            <Link to="/add-project-form">
              <button className="add-project-btn">Add Projects</button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

export default ViewProjects;