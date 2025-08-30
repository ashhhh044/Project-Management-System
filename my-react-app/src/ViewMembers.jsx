import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaEdit, FaUserPlus } from 'react-icons/fa'; // import icon
import Footer from './Footer';
import NavBar from './NavBar';
import './styles.css';

function ViewMembers({ user, projectId }) {
  const [members, setMembers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch('http://localhost:5000/members');
        let data = await res.json();

        if (user.role !== "admin" && projectId) {
          const resProjMembers = await fetch(`http://localhost:5000/projects/${projectId}/members`);
          const projectMembers = await resProjMembers.json();
          data = data.filter(member => projectMembers.some(m => m.id === member.id));
        }

        setMembers(data);
      } catch (err) {
        console.error(err);
        setMembers([]);
      }
    };

    fetchMembers();
  }, [user, projectId]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      const res = await fetch(`http://localhost:5000/members/${id}`, { method: 'DELETE' });
      if (res.ok) setMembers(members.filter(m => m.id !== id));
    } catch (err) {
      console.error(err);
      alert('Error deleting member');
    }
  };

  const handleEdit = (id) => navigate(`/edit-member/${id}`);
  const handleAdd = () => navigate('/add-member'); // 👈 navigate to your Members form

  if (members.length === 0) return <p>No members found.</p>;

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
            {user.role === "admin" && (
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
            )}
          </div>
        ))}
        {user.role === "admin" && (
          <button 
            onClick={handleAdd} 
            className="add-task-button" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}
          >
           Add Member
          </button>
        )}
      </div>
      <Footer />
    </>
  );
}

export default ViewMembers;
