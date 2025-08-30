import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';

function EditTask() {
  const { id: projectId, taskId } = useParams();
  const navigate = useNavigate();

  const [taskData, setTaskData] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [priority, setPriority] = useState('');
  const [duration, setDuration] = useState('');
  const [deadline, setDeadline] = useState('');
  const [stage, setStage] = useState('todo');
  const [assignedTo, setAssignedTo] = useState([]); 

  const [allTasks, setAllTasks] = useState([]);
  const [selectedDependencies, setSelectedDependencies] = useState([]);

  useEffect(() => {
    if (projectId) {
      fetch(`http://localhost:5000/projects/${projectId}/tasks`)
        .then(res => res.json())
        .then(data => setAllTasks(data))
        .catch(() => setAllTasks([]));
    }
  }, [projectId]);

  const toggleDependency = (id) => {
    setSelectedDependencies(prev =>
      prev.includes(id) ? prev.filter(did => did !== id) : [...prev, id]
    );
  };
  useEffect(() => {
    if (!projectId) return;
    fetch(`http://localhost:5000/projects/${projectId}/members`)
      .then(res => res.json())
      .then(data => setProjectMembers(data))
      .catch(err => console.error('Failed to fetch members:', err));
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !taskId) return;
    fetch(`http://localhost:5000/projects/${projectId}/tasks/${taskId}`)
      .then(res => {
        if (!res.ok) throw new Error('Task not found');
        return res.json();
        // Set dependencies
        if (Array.isArray(data.dependencies)) {
          setSelectedDependencies(data.dependencies);
        } else if (typeof data.dependencies === 'string') {
          try {
            setSelectedDependencies(JSON.parse(data.dependencies));
          } catch {
            setSelectedDependencies([]);
          }
        } else {
          setSelectedDependencies([]);
        }
      })
      .then(data => {
        setTaskData(data);
        setName(data.name || '');
        setPriority(data.priority || '');
        setDuration(data.duration ? String(data.duration) : '');
        setDeadline(data.deadline ? data.deadline.split('T')[0] : '');
        setStage(data.stage || 'todo');

        if (Array.isArray(data.assigned_members)) {
          setAssignedTo(data.assigned_members.map(m => m.id));
        } else if (Array.isArray(data.assigned_to)) {
          setAssignedTo(data.assigned_to);
        } else {
          setAssignedTo([]);
        }
      })
      .catch(err => {
        alert('Task not found');
        navigate(`/projects/${projectId}/tasks`);
      })
      .finally(() => setLoading(false));
  }, [projectId, taskId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !priority || !duration || Number(duration) <= 0 || !deadline) {
      return alert('Please fill all required fields.');
    }

    try {
      const res = await fetch(`http://localhost:5000/projects/${projectId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          priority,
          duration: Number(duration),
          deadline,
          stage,
          assigned_to: assignedTo,
          dependencies: selectedDependencies
        }),
      });

      if (res.ok) {
        alert('Task updated successfully!');
        navigate(`/projects/${projectId}/tasks`); 
      } else {
        const data = await res.json();
        alert(data.error || 'Update failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating task.');
    }
  };

  if (loading) return <p>Loading task data...</p>;

  return (
    <>
      <NavBar />
  <form onSubmit={handleSubmit} style={{ maxWidth: 500, margin: '20px auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Dependencies selection */}
        <div style={{ margin: '10px 0' }}>
          <label><b>Dependencies:</b></label>
          <div style={{ border: '1px solid #ccc', borderRadius: 4, padding: 8, maxHeight: 120, overflowY: 'auto' }}>
            {allTasks.filter(t => t.id !== Number(taskId)).length === 0 && <div style={{ color: '#888' }}>No other tasks to depend on.</div>}
            {allTasks.filter(t => t.id !== Number(taskId)).map(task => (
              <div key={task.id}>
                <input
                  type="checkbox"
                  checked={selectedDependencies.includes(task.id)}
                  onChange={() => toggleDependency(task.id)}
                  id={`dep-edit-${task.id}`}
                />
                <label htmlFor={`dep-edit-${task.id}`}>{task.name}</label>
              </div>
            ))}
          </div>
        </div>
        <h2>Edit Task</h2>

        <input
          type="text"
          placeholder="Task Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <select value={stage} onChange={e => setStage(e.target.value)}>
          <option value="todo">To Do</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>

        <input
          type="number"
          placeholder="Duration (hours)"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          min="1"
          required
        />

        <input
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          required
        />

        <select value={priority} onChange={e => setPriority(e.target.value)} required>
          <option value="">-- Select Priority --</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <label>Assign Members:</label>
        <select
          multiple
          value={assignedTo.map(String)}
          onChange={e => {
            const selectedIds = Array.from(e.target.selectedOptions, opt => Number(opt.value));
            setAssignedTo(selectedIds);
          }}
        >
          {projectMembers.map(m => (
            <option key={m.id} value={m.id}>
              {m.title ? `${m.title} ` : ''}{m.member_name}{m.designation ? ` (${m.designation})` : ''}
            </option>
          ))}
        </select>

        <button type="submit">Update Task</button>
      </form>
      <Footer />
    </>
  );
}

export default EditTask;
