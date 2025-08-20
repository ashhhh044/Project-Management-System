import './styles.css'
import './TaskForm.css';
import plusCircle from './assets/plus-circle-dotted.svg';
import { Link } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';
import { useEffect, useState } from 'react';

function AddProject(){
    const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/me", { credentials: "include" })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => console.error("Failed to fetch user:", err));
  }, []);

  if (!user) return null;
    return(
        <>
        {user?.role === "admin" ? (
        <div id="add-task" className="add-task">
            <Link to="/add-project-form">
                <img src={plusCircle} alt="add-task-button"/>
            </Link>
            <p>No Projects Yet!<br/>Click + To Add</p>
        </div>
        ) : (
            <div id="add-task" className="add-task">
            <p>You have no project assigned yet!!</p>
        </div>)}
        </>
    )
}

export default AddProject;