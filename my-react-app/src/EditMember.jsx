import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './styles.css';

function EditMember() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [memberName, setMemberName] = useState('');
  const [designation, setDesignation] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/members/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Member not found');
        return res.json();
      })
      .then(data => {
        setMemberName(data.member_name);
        setDesignation(data.designation);
        setTitle(data.title);
        setLoading(false);
      })
      .catch(err => {
        alert(err.message);
        navigate('/view-members'); // redirect on error
      });
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!memberName || !designation || !title) {
      alert('Fill all fields');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_name: memberName, designation, title }),
      });
      if (res.ok) {
        alert('Member updated!');
        navigate('/view-members');
      } else {
        const data = await res.json();
        alert(data.error || 'Update failed');
      }
    } catch (err) {
      alert('Error updating member');
      console.error(err);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <form onSubmit={handleSubmit} className="edit-member-form">
    <h2>Edit Member</h2>
    <input
        type="text"
        placeholder="Member Name"
        value={memberName}
        onChange={(e) => setMemberName(e.target.value)}
        required
    />
    <input
        type="text"
        placeholder="Designation"
        value={designation}
        onChange={(e) => setDesignation(e.target.value)}
        required
    />
    <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
    />
    <button type="submit">Update Member</button>
    </form>

  );
}

export default EditMember;
