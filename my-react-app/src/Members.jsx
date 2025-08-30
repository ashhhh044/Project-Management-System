import { useState } from 'react';
import Footer from './Footer';
import NavBar from './NavBar';
import './AddTaskCard.css'; 
function Members() {
  const [memberName, setMemberName] = useState('');
  const [designation, setDesignation] = useState('');
  const [title, setTitle] = useState('');

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (!memberName || memberName.trim() === "") {
    alert("Member name is required");
    return;
  }

  const newMember = {
    member_name: memberName.trim(),
    designation: designation.trim() || null,
    title: title.trim() || null,
  };

  try {
    const res = await fetch("http://localhost:5000/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMember),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    const data = await res.json();
    alert("Member added successfully");
    setMemberName("");
    setDesignation("");
    setTitle("");
  } catch (error) {
    alert("Error adding member: " + error.message);
    console.error(error);
  }
};
  return (
    <>
      <NavBar />
      <form className="add-task-form" onSubmit={handleSubmit}>
        <p className="login-header">Add Member</p>

        <input
          type="text"
          placeholder="Full Name"
          className="add-task-detail"
          value={memberName}
          onChange={(e) => setMemberName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Designation"
          className="add-task-detail"
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Title (Role)"
          className="add-task-detail"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <input
          type="submit"
          value="Add Member"
          className="add-task-button"
        />
      </form>
      <Footer />
    </>
  );
}

export default Members;
