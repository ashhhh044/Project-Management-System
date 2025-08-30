import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaTrash, FaEdit, FaSort } from 'react-icons/fa';
import Footer from './Footer';
import NavBar from './NavBar';
import TaskForm from './TaskForm';
import plusCircle from './assets/plus-circle-dotted.svg';
import { topologicalSortTasks } from './utils/topoSort';

const priorityMap = { high: 1, medium: 2, low: 3 };
function sortByPriorityAndDeadline(tasks) {
  return [...tasks].sort((a, b) => {
    const pA = priorityMap[a.priority.toLowerCase()] || 4;
    const pB = priorityMap[b.priority.toLowerCase()] || 4;
    const priorityDiff = pA - pB;
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.deadline) - new Date(b.deadline);
  });
}

function ViewTasks({ user }) {
  const { id } = useParams(); 
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rawTasks, setRawTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:5000/projects/${id}/tasks`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setRawTasks(data); 
        let filteredTasks = data;

        if (user.role !== 'admin') {
          if (!user.memberId) {
            filteredTasks = [];
          } else {
            filteredTasks = data.filter(task => {
              let assigned = task.assigned_to;
              if (typeof assigned === "string") {
                try {
                  assigned = JSON.parse(assigned);
                } catch {
                  assigned = [];
                }
              }
              if (!Array.isArray(assigned)) assigned = [];
              return assigned.includes(Number(user.memberId));
            });
          }
        }
        let sorted = topologicalSortTasks(filteredTasks);
        if (sorted.length === 0 && filteredTasks.length > 0) {
          sorted = sortByPriorityAndDeadline(filteredTasks);
        }
        setTasks(sorted);
      })
      .catch(err => {
        console.error("Failed to fetch tasks:", err);
        setTasks([]);
      })
      .finally(() => setLoading(false));
  }, [id, user]);

  const handleDelete = async (taskId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`http://localhost:5000/projects/${id}/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error(error);
      alert('Error deleting task.');
    }
  };

  const handleEdit = (taskId, e) => {
    e.stopPropagation();
    navigate(`/projects/${id}/edit-task/${taskId}`);
  };

  const handleTaskAdded = (newTask) => {
    setTasks(prev => sortByPriorityAndDeadline([...prev, newTask]));
  };

  const handleSortClick = () => {
    setTasks(prev => sortByPriorityAndDeadline([...prev]));
  };

  if (loading) return <p>Loading tasks...</p>;

  const showAssignWarning = !tasks.length && rawTasks.some(
    t => Array.isArray(t.assigned_to) && t.assigned_to.length > 0
  );

  return (
    <>
      <NavBar />
      <div style={{ maxWidth: 700, margin: '20px auto' }}>
        <div style={{ textAlign: 'right', marginBottom: 10 }}>
          <button 
            onClick={handleSortClick} 
            style={{ cursor: 'pointer', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: 5, color: '#1d3557', background: 'transparent', border: '1px solid #1d3557', borderRadius: 4 }}
          >
            <FaSort /> Sort Tasks
          </button>
        </div>
        {showAssignWarning && (
          <div style={{background:'#fffbe6',border:'1px solid #ffe58f',color:'#ad8b00',padding:'10px',borderRadius:'6px',marginBottom:'15px',textAlign:'center'}}>
            No tasks are assigned to you. Ask an admin to assign you to tasks.
          </div>
        )}

        {tasks.length > 0 ? (
          tasks.map(({ id: taskId, name, priority, deadline, stage }) => (
            <div 
              key={taskId} 
              className="view-task"
              onClick={() => navigate(`/projects/${id}/tasks/${taskId}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="task-details">
                <div className="task-pri-details">
                  <label className="task-name">{name}</label>
                </div>
                <div className="task-sec-details">
                  <div className="priority-badge">{priority}</div>
                  <div className="deadline-badge">
                    {deadline ? new Date(deadline).toISOString().split('T')[0] : 'No deadline'}
                  </div>                    
                  <div className="deadline-badge">{stage}</div>
                </div>
              </div>
              <div className="task-icons">
                <FaTrash onClick={(e) => handleDelete(taskId, e)} />
                <FaEdit onClick={(e) => handleEdit(taskId, e)} />
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', marginTop: 50 }}>
            <TaskForm projectId={id} onTaskAdded={handleTaskAdded} />
          </div>
        )}

        {tasks.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to={`/projects/${id}/add-task-card`}>
              <img src={plusCircle} alt="Add Task" style={{ width: 40, cursor: 'pointer' }} />
            </Link>
          </div>
        )}
      </div>
      {/* <Footer /> */}
    </>
  );
}

export default ViewTasks;