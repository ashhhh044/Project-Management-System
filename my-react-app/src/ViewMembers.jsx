import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaEdit } from 'react-icons/fa';
import Footer from './Footer';
import NavBar from './NavBar';
import './styles.css';

function ViewMembers() {
  const [members, setMembers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/members')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch members');
        return res.json();
      })
      .then(data => setMembers(data))
      .catch(err => {
        console.error('Failed to fetch members:', err);
        setMembers([]);
      });
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;

    try {
      const res = await fetch(`http://localhost:5000/members/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMembers(members.filter(m => m.id !== id));
      } else {
        alert('Failed to delete member');
      }
    } catch (error) {
      alert('Error deleting member');
      console.error(error);
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-member/${id}`);
  };

  if (members.length === 0) {
    return (
      <>
        <NavBar />
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <p>No members found.</p>
          <button className="login-button" onClick={() => navigate('/add-member')}>
            Add Member
          </button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div style={{ maxWidth: 700, margin: '20px auto' }}>
        {members.map(({ id, member_name, designation, title }) => (
          <div key={id} className="view-task" style={{ marginBottom: '10px' }}>
            <div className="task-details">
              <div className="task-pri-details">
                <label className="task-name">{member_name}</label>
              </div>
              <div className="task-sec-details">
                <div className="priority-badge">{designation}</div>
                <div className="deadline-badge">{title}</div>
              </div>
            </div>
            <div className="task-icons">
              <FaTrash
                onClick={() => handleDelete(id)}
                title="Delete member"
                style={{ cursor: 'pointer', color: '#e63946' }}
              />
              <FaEdit
                onClick={() => handleEdit(id)}
                title="Edit member"
                style={{ cursor: 'pointer', color: '#1d3557' }}
              />
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </>
  );
}

export default ViewMembers;
