import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './styles.css';
import NavBar from './NavBar';
import Footer from './Footer';

function EditTask() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Use backend keys exactly
  const [name, setTaskName] = useState('');
  const [priority, setPriority] = useState('');
  const [duration, setDuration] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/tasks/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Task not found');
        return res.json();
      })
      .then(data => {
        setTaskName(data.name || '');
        setPriority(data.priority || '');
        setDuration(data.duration ? String(data.duration) : '');
        setDeadline(data.deadline ? data.deadline.split('T')[0] : '');
        setLoading(false);
      })
      .catch(err => {
        alert(err.message);
        navigate('/view-tasks');
      });
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Task Name is required');
      return;
    }
    if (!priority) {
      alert('Priority is required');
      return;
    }
    if (!duration || Number(duration) <= 0) {
      alert('Duration must be a positive number');
      return;
    }
    if (!deadline) {
      alert('Deadline is required');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, priority, duration, deadline }),
      });

      if (res.ok) {
        alert('Task updated successfully!');
        navigate('/view-tasks');
      } else {
        const data = await res.json();
        alert(data.error || 'Update failed');
      }
    } catch (err) {
      alert('Error updating task');
      console.error(err);
    }
  };

  if (loading) return <p>Loading task data...</p>;

  return (
    <>
    <NavBar/>
    <form onSubmit={handleSubmit} className="edit-task-form" style={{ maxWidth: 400, margin: '20px auto' }}>
      <h2>Edit Task</h2>
      <input
        type="text"
        placeholder="Task Name"
        value={name}
        onChange={(e) => setTaskName(e.target.value)}
        required
      />
      <select value={priority} onChange={(e) => setPriority(e.target.value)} required>
        <option value="">-- Select Priority --</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>
      <input
        type="number"
        placeholder="Duration (hours)"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        min="1"
        required
      />
      <input
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        min={new Date().toISOString().split('T')[0]}
        required
      />
      <button type="submit">Update Task</button>
    </form>
    <Footer />
    </>
  );
}

export default EditTask;
