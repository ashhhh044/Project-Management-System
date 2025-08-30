import { Link, useNavigate } from "react-router-dom";
import "./NavBar.css";
import "./styles.css";
import { useEffect, useState } from "react";

function NavBar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    fetch("http://localhost:5000/me", { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error("Not logged in");
        return res.json();
      })
      .then(data => setUser(data))
      .catch(() => navigate("/login"));
  }, [navigate]);

  const handleLogout = async () => {
    localStorage.removeItem("token");
    await fetch("http://localhost:5000/logout", {
      method: "POST",
      credentials: "include",
    });
    navigate("/login");
  };

  return (
    <nav id="navbar" className="navbar">
      <div id="logo" className="logo">
        <Link to="/">PlanEase</Link>
      </div>
      <ul>
        {user?.role === "admin" && (
          <li className="nav-item">
            <Link to="/view-members">Members</Link>
          </li>
        )}
        <li className="nav-item">
          <Link to={user?.role === "admin" ? "/" : "/"}>Projects</Link>
        </li>
        <li className="nav-item">
          <Link to="/user-profile">Profile</Link>
        </li>
        {isLoggedIn && (
          <li className="nav-item">
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default NavBar;