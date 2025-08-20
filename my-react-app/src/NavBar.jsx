import { Link, Navigate } from 'react-router-dom';
import './NavBar.css';
import './styles.css';

function NavBar(){
  const isLoggedIn = !!localStorage.getItem('token');
  const handleLogout = () => {
    localStorage.removeItem('token'); // remove token from localStorage
    Navigate('/login'); // redirect to login
  };
  return(
    
    <nav id="navbar" className="navbar">
      <div id="logo" className="logo"><Link to="/">PlanEase</Link></div>
      <ul>
        <li className="nav-item">
          <Link to="/view-tasks">Tasks</Link>
        </li>
        <li className="nav-item">
          <Link to="/view-members">Members</Link>
        </li>
        <li className="nav-item">
          <Link to="/user-profile">Profile</Link>
        </li>
        {isLoggedIn && (
        <li className="nav-item">
          <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
        </li>
        )}
      </ul>
    </nav>
  )
}

export default NavBar;
