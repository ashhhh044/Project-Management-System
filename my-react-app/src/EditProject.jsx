import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Footer from "./Footer";
import NavBar from "./NavBar";
import "./AddTaskCard.css";

function EditProject({ user }) {
  const { id } = useParams();
  const [projectName, setProjectName] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [file, setFile] = useState(null);
  const [existingResources, setExistingResources] = useState([]);
  const [dueDate, setDueDate] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const membersRes = await fetch("http://localhost:5000/members", {
          credentials: "include",
        });
        const membersData = await membersRes.json();
        setMembers(membersData);

        const projectRes = await fetch(
          `http://localhost:5000/projects/${id}/details`,
          { credentials: "include" }
        );
        const projectData = await projectRes.json();

        setProjectName(projectData.project_name);
        setDueDate(projectData.due_date ? projectData.due_date.split("T")[0] : "");
        setSelectedMembers(projectData.members.map((m) => m.id));
        setExistingResources(projectData.resources || []);
      } catch (err) {
        console.error(err);
        alert("Could not load project details");
      }
    };
    fetchData();
  }, [id, user, navigate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMember = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("project_name", projectName);
    formData.append("due_date", dueDate);
    if (file) formData.append("resource", file);
    formData.append("members", JSON.stringify(selectedMembers));

    try {
      const res = await fetch(`http://localhost:5000/projects/${id}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        navigate("/");
      } else {
        alert(data.error || "Failed to update project");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <NavBar />
      <form className="add-task-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          required
          className="add-task-detail"
          placeholder="Enter Project Name"
        />

        {/* Team Members Dropdown */}
        <div
          ref={dropdownRef}
          className="add-task-detail"
          style={{ position: "relative", cursor: "pointer" }}
        >
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              padding: "8px",
              borderRadius: "4px",
              minHeight: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {selectedMembers.length
              ? selectedMembers
                  .map((id) => members.find((m) => m.id === id)?.member_name)
                  .join(", ")
              : "Select Team Members"}
            <span style={{ marginLeft: "8px" }}>▼</span>
          </div>
          {dropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                border: "1px solid #ccc",
                background: "#fff",
                maxHeight: "150px",
                overflowY: "auto",
                zIndex: 1000,
              }}
            >
              {members.map((member) => (
                <div
                  key={member.id}
                  style={{
                    padding: "8px",
                    backgroundColor: selectedMembers.includes(member.id)
                      ? "#d0ebff"
                      : "transparent",
                  }}
                  onClick={() => toggleMember(member.id)}
                >
                  {member.title} {member.member_name} ({member.designation})
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Existing Resources */}
        {existingResources.map((res, idx) => {
  // Ensure res is a string before calling .split
  const fileName = typeof res === "string" ? res.split("/").pop() : "Resource";
  return (
    <a
      key={idx}
      href={`http://localhost:5000${typeof res === "string" ? res : ""}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        textDecoration: "none",
        fontSize: "0.9rem",
        marginRight: "10px",
      }}
    >
      {fileName}
    </a>
  );
})}


        <input
          type="file"
          className="add-task-detail"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <input
          type="date"
          min={new Date().toISOString().split("T")[0]}
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="add-task-detail"
        />
        <input type="submit" value="Update" className="add-task-button" />
      </form>
      <Footer />
    </>
  );
}

export default EditProject;
