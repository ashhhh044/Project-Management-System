import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import NavBar from './NavBar';
import './AddTaskCard.css';

function AddProjectCard() {
  const [projectName, setProjectName] = useState('');
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [file, setFile] = useState(null);
  const [dueDate, setDueDate] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/members')
      .then(res => res.json())
      .then(data => setMembers(data))
      .catch(err => console.error('Failed to fetch members:', err));
  }, []);

  // Close dropdown if clicked outside
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
    if (!projectName.trim()) return alert('Project name is required');
    if (selectedMembers.length === 0) return alert('Please select at least one member');

    const formData = new FormData();
    formData.append('project_name', projectName);
    formData.append('due_date', dueDate);
    if (file) formData.append('resource', file);
    formData.append('members', JSON.stringify(selectedMembers));

    try {
      const res = await fetch('http://localhost:5000/add-project', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        navigate(`/`);
      } else {
        alert(data.error || 'Failed to add project');
      }
    } catch (err) {
      console.error('Error adding project:', err);
      alert('Error adding project');
    }
    
  };

  return (
    <>
      <NavBar />
      <form className="add-task-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter Project Name"
          className="add-task-detail"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          required
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
              : 'Select Team Members'}
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

        <input
          type="file"
          className="add-task-detail"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <input
          type="date"
          className="add-task-detail"
          min={new Date().toISOString().split('T')[0]}
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <input type="submit" value="Add Project" className="add-task-button" />
      </form>
      <Footer />
    </>
  );
}

export default AddProjectCard;
