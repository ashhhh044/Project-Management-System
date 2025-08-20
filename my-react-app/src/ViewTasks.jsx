import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaEdit } from 'react-icons/fa';
import Footer from './Footer';
import NavBar from './NavBar';
import plusCircle from './assets/plus-circle-dotted.svg';
import './styles.css';
import TaskForm from './TaskForm';

function ViewTasks() {
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/tasks')  // Adjust endpoint to your tasks API
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch tasks');
        return res.json();
      })
      .then(data => setTasks(data))
      .catch(err => {
        console.error('Failed to fetch tasks:', err);
        setTasks([]);
      });
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await fetch(`http://localhost:5000/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks(tasks.filter(t => t.id !== id));
      } else {
        alert('Failed to delete task');
      }
    } catch (error) {
      alert('Error deleting task');
      console.error(error);
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-task/${id}`); // Adjust route to your edit task page
  };

  if (tasks.length === 0) {
    return (
      <>
        <TaskForm />
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div style={{ maxWidth: 700, margin: '20px auto' }}>
        {tasks.length > 0 ? (
          tasks.map(({ id, name, priority, deadline }) => (
            <div key={id} className="view-task">
              <div className="task-details">
                <div className="task-pri-details">
                  <label className="task-name">{name}</label>
                </div>
                <div className="task-sec-details">
                  <div className="priority-badge">{priority}</div>
                  <div className="deadline-badge">
                    {deadline ? new Date(deadline).toISOString().split('T')[0] : 'No deadline'}
                  </div>
                </div>
              </div>
              <div className="task-icons">
                <FaTrash onClick={() => handleDelete(id)} />
                <FaEdit onClick={() => handleEdit(id)} />
              </div>
            </div>
          ))
        ) : (
          <p>No tasks found</p>
        )}

      </div>
      <Footer />
    </>
  );
}

export default ViewTasks;
