import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AddTaskCard.css';

function TaskForm({ onTaskAdded }) {
  const [taskName, setTaskName] = useState('');
  const [priority, setPriority] = useState('--');
  const [duration, setDuration] = useState('');
  const [deadline, setDeadline] = useState('');
  const [stage, setStage] = useState('todo'); 
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [allTasks, setAllTasks] = useState([]);
  const [selectedDependencies, setSelectedDependencies] = useState([]);
  const navigate = useNavigate();
const { id: projectId } = useParams();
  useEffect(() => {
    fetch('http://localhost:5000/members')
      .then(res => res.json())
      .then(data => setMembers(data))
      .catch(err => console.error('Failed to fetch members:', err));
    if (projectId) {
      fetch(`http://localhost:5000/projects/${projectId}/tasks`)
        .then(res => res.json())
        .then(data => setAllTasks(data))
        .catch(err => setAllTasks([]));
    }
  }, [projectId]);
  const toggleDependency = (id) => {
    setSelectedDependencies(prev =>
      prev.includes(id) ? prev.filter(did => did !== id) : [...prev, id]
    );
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMember = (id) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskName.trim()) return alert('Please enter a task name.');
    if (priority === '--') return alert('Please select priority.');
    if (!duration || isNaN(duration) || duration <= 0) return alert('Please enter a valid duration.');
    if (!deadline) return alert('Please select a deadline.');

    try {
      const res = await fetch(`http://localhost:5000/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: taskName.trim(),
          priority,
          duration: Number(duration),
          deadline,
          assigned_to: selectedMembers,
          stage,
          dependencies: selectedDependencies,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Task added successfully!');
        onTaskAdded?.(data);
        navigate(`/projects/${projectId}/tasks`);
      } else {
        alert(data.error || 'Failed to add task.');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding task.');
    }
  };

  return (
    <form className="add-task-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter Task Name"
        className="add-task-detail"
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
      />

      <select
        className="add-task-detail"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      >
        <option value="--">-- Select Priority --</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>

      <input
        type="number"
        placeholder="Duration (hours)"
        className="add-task-detail"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        min="1"
      />

      <input
        type="date"
        className="add-task-detail"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        min={new Date().toISOString().split('T')[0]}
      />

      <div ref={dropdownRef} style={{ position: 'relative', cursor: 'pointer' }} className="add-task-detail">
        <div
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            padding: '8px',
            borderRadius: '4px',
            minHeight: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {selectedMembers.length > 0
            ? selectedMembers.map(id => members.find(m => m.id === id)?.member_name).join(', ')
            : 'Assign Members'}
          <span style={{ marginLeft: '8px' }}>▼</span>
        </div>

        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              border: '1px solid #ccc',
              background: '#fff',
              maxHeight: '150px',
              overflowY: 'auto',
              zIndex: 1000,
            }}
          >
            {members.map(member => (
              <div
                key={member.id}
                style={{
                  padding: '8px',
                  backgroundColor: selectedMembers.includes(member.id) ? '#d0ebff' : 'transparent',
                }}
                onClick={() => toggleMember(member.id)}
              >
                {member.title} {member.member_name} ({member.designation})
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ margin: '10px 0' }}>
        <label><b>Dependencies:</b></label>
        <div style={{ border: '1px solid #ccc', borderRadius: 4, padding: 8, maxHeight: 120, overflowY: 'auto' }}>
          {allTasks.length === 0 && <div style={{ color: '#888' }}>No other tasks to depend on.</div>}
          {allTasks.filter(t => t.name && t.id !== undefined).map(task => (
            <div key={task.id}>
              <input
                type="checkbox"
                checked={selectedDependencies.includes(task.id)}
                onChange={() => toggleDependency(task.id)}
                id={`dep-${task.id}`}
              />
              <label htmlFor={`dep-${task.id}`}>{task.name}</label>
            </div>
          ))}
        </div>
      </div>
      <select
        className="add-task-detail"
        value={stage}
        onChange={(e) => setStage(e.target.value)}
      >
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
      </select>

      <input type="submit" value="Add Task" className="add-task-button" />
    </form>
  );
}

export default TaskForm;
