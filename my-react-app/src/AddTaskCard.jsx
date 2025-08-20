import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import NavBar from './NavBar';
import './AddTaskCard.css';

function AddTaskCard() {
  const [taskName, setTaskName] = useState('');
  const [priority, setPriority] = useState('--');
  const [duration, setDuration] = useState('');
  const [deadline, setDeadline] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskName.trim()) return alert('Please enter a task name.');
    if (priority === '--') return alert('Please select priority.');
    if (!duration || isNaN(duration) || duration <= 0)
      return alert('Please enter a valid duration in hours.');
    if (!deadline) return alert('Please select a deadline.');

    try {
      // Assuming your backend expects: name, priority, deadline (as date)
      // and maybe duration, adjust accordingly
      const res = await fetch('http://localhost:5000/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: taskName.trim(),
          priority,
          deadline,
          duration: Number(duration), // if your backend supports this
        }),
      });

      if (res.ok) {
        alert('Task added successfully!');
        navigate('/view-tasks'); // go to the list page after add
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add task.');
      }
    } catch (error) {
      alert('Error adding task.');
      console.error(error);
    }
  };

  return (
    <>
      <NavBar />
      <form className="add-task-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter Task"
          className="add-task-detail"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
        />
        <select
          id="priority"
          className="add-task-detail"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="--">--</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input
          type="number"
          placeholder="Enter Duration (In Hours)"
          className="add-task-detail"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          min="1"
          step="1"
        />
        <input
          type="date"
          className="add-task-detail"
          min={new Date().toISOString().split('T')[0]}
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
        <button type="submit" className="add-task-button">
          Add Task
        </button>
      </form>
      <Footer />
    </>
  );
}

export default AddTaskCard;
