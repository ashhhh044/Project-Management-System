import { useEffect, useState } from 'react'; 
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaEdit } from 'react-icons/fa'; 
import './styles.css'; 
import AddProject from './AddProject'; 
import Footer from './Footer';

function ViewProjects({ user }) {
  const [projects, setProjects] = useState([]); 
  const [filteredProjects, setFilteredProjects] = useState([]); 
  const [sortBy, setSortBy] = useState(""); 
  const [showModal, setShowModal] = useState(false); // NEW: modal state
  const [upcomingProject, setUpcomingProject] = useState(null); // NEW: project with approaching deadline
  const navigate = useNavigate(); 

  useEffect(() => {
    if (!user) return;

    const fetchProjects = async () => {
      try {
        const res = await fetch('http://localhost:5000/projects', { credentials: 'include' });
        const data = await res.json();

        let assignedProjects = data;
        if (user.role !== 'admin') {
          if (user.memberId) {
            const filtered = await Promise.all(
              data.map(async (project) => {
                const resMembers = await fetch(`http://localhost:5000/projects/${project.id}/members`, { credentials: 'include' });
                const members = await resMembers.json();
                return members.some(m => String(m.id) === String(user.memberId)) ? project : null;
              })
            );
            assignedProjects = filtered.filter(p => p !== null);
          } else {
            assignedProjects = [];
          }
        }

        setProjects(data);
        setFilteredProjects(assignedProjects);

        // NEW: check for upcoming deadline
        const today = new Date();
        const approaching = assignedProjects.find(p => {
          if (!p.due_date) return false;
          const deadline = new Date(p.due_date);
          const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7; // within next 7 days
        });

        if (approaching) {
          setUpcomingProject(approaching);
          setShowModal(true);
        }

      } catch (err) {
        console.error('Error fetching projects:', err);
        setProjects([]);
        setFilteredProjects([]);
      }
    };

    fetchProjects();
  }, [user]);

  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortBy(value);

    const sorted = [...filteredProjects];
    if (value === "deadline") {
      sorted.sort((a, b) => {
        const da = a.due_date ? new Date(a.due_date) : new Date(0);
        const db = b.due_date ? new Date(b.due_date) : new Date(0);
        return da - db;
      });
    } else if (value === "creation") {
      sorted.sort((a, b) => new Date(a.creation_date) - new Date(b.creation_date));
    }
    setFilteredProjects(sorted);
  };

  const handleDelete = async (id) => { 
    if (!window.confirm('Are you sure you want to delete this project?')) return; 
    try { 
      const res = await fetch(`http://localhost:5000/projects/${id}`, { method: 'DELETE' }); 
      if (res.ok) setFilteredProjects(filteredProjects.filter(t => t.id !== id)); 
    } catch (error) { 
      console.error(error); 
      alert('Error deleting project'); 
    } 
  }; 

  const handleEdit = (id) => navigate(`/edit-project/${id}`); 
  const handleViewMembers = (projectId) => navigate(`/projects/${projectId}/members`);

  if (!user) return <p>Loading user info...</p>;
  if (!projects) return <p>Loading projects...</p>;
  if (filteredProjects.length === 0) {
    if (user.role === "admin") return <AddProject user={user} />;
    return <p style={{ textAlign: "center", marginTop: 40 }}>No projects assigned to you yet!</p>;
  }

  const daysLeft = (date) => {
    const today = new Date();
    const d = new Date(date);
    return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  };

  return ( 
    <>
    {showModal && upcomingProject && (
      <div className="modal-overlay" style={{
        position: 'fixed', top:0, left:0, width:'100%', height:'100%',
        background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center',
        zIndex: 1000
      }}>
        <div className="modal-content" style={{
          background:'#fff', padding:'20px', borderRadius:'8px', width:'300px', textAlign:'center', color: '#1d3557'
        }}>
          <p>Upcoming Deadline!</p>
          <p><strong>{upcomingProject.project_name}</strong></p>
          <p>Deadline: {new Date(upcomingProject.due_date).toISOString().split('T')[0]}</p>
          <p>Days Left: {daysLeft(upcomingProject.due_date)}</p>
          <button onClick={() => setShowModal(false)} style={{
            marginTop:'10px', padding:'8px 12px', border:'none', background:'#dff5e3', color:'#1d3557', borderRadius:'5px', cursor:'pointer'
          }}>Close</button>
        </div>
      </div>
    )}

    <div style={{ maxWidth: 700, margin: '20px auto' }}>
      {filteredProjects.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="sortProjects" style={{ marginRight: '10px', color:'#1d3557' }}>Sort Projects By:</label>
          <select id="sortProjects" value={sortBy} onChange={handleSortChange} style={{ border: '1px solid #1d3557', borderRadius: '5px', padding: '5px', color: '#1d3557' }}>
            <option value="">-- Select --</option>
            <option value="deadline">Deadline</option>
            <option value="creation">Creation Date</option>
          </select>
        </div>
      )}

      {filteredProjects.map(({ id, project_name, due_date, creation_date }) => ( 
        <div key={id} className="view-task" style={{ marginBottom: '10px' }}> 
          <div className="task-details"> 
            <div className="task-pri-details"> 
              <label className="task-name">Project: {project_name}</label> 
            </div> 
            <div className="task-sec-details"> 
              <div className="deadline-badge"><Link to={`/projects/${id}/resources`}>View Resources</Link></div> 
              <div className="deadline-badge"><Link to={`/projects/${id}/tasks`}>View Tasks</Link></div> 
              <div className="deadline-badge" style={{ cursor: 'pointer' }} onClick={() => handleViewMembers(id)}>View Members</div>
              <div className="priority-badge">{due_date ? new Date(due_date).toISOString().split('T')[0] : 'No due date'}</div>
            </div> 
          </div> 

          {user.role === "admin" && ( 
            <div className="task-icons"> 
              <FaTrash onClick={() => handleDelete(id)} title="Delete project" style={{ cursor: 'pointer', color: '#e63946' }} /> 
              <FaEdit onClick={() => handleEdit(id)} title="Edit project" style={{ cursor: 'pointer', color: '#1d3557' }} /> 
            </div> 
          )}
        </div> 
      ))} 
    </div> 

    {user.role === "admin" && ( 
      <div id="add-task" className="add-task"> 
        <Link to="/add-project-form"> 
          <button className="add-project-btn">Add Projects</button> 
        </Link> 
      </div> 
    )}
    {/* <Footer /> */}
    </>
  ); 
} 

export default ViewProjects;
