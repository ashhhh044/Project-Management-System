import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Index from './Index';
import Login from './Login';
import Signin from './Signin';
import AddProject from './AddProject';
import AddProjectCard from './AddProjectCard';
import TaskForm from './TaskForm';
import AddTaskCard from './AddTaskCard';
import ViewTasks from './ViewTasks';
import EditTask from './EditTask';
import ViewProjects from './ViewProjects';
import Members from './Members';
import ViewMembers from './ViewMembers';
import EditMember from './EditMember';
import ResourcePage from './ResourcePage';
import ProfilePage from './ProfilePage';
import EditProject from './EditProject';
import TaskDetails from './TaskDetails';
import ViewProjectMembers from './ViewProjectMembers';

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (!user) {
      fetch('http://localhost:5000/me', { credentials: 'include' })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(u => {
          const normalized = { id: u.id, username: u.name, role: u.role };
          localStorage.setItem('user', JSON.stringify(normalized));
          setUser(normalized);
        })
        .catch(() => {/* ignore; stay logged out */});
    }
  }, [user]);
  
  const handleLogin = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/signin" element={<Signin onLogin={handleLogin} />} />

        <Route path="/user-profile" element={user ? <ProfilePage user={user} /> : <Navigate to="/login" />} />
        <Route path="/add-project" element={user ? <AddProject user={user} /> : <Navigate to="/login" />} />
        <Route path="/add-project-form" element={user ? <AddProjectCard user={user} /> : <Navigate to="/login" />} />
        <Route path="/projects/:id/tasks" element={user ? <ViewTasks user={user} /> : <Navigate to="/login" />} />
        <Route path="/projects/:id/add-task-form" element={user ? <TaskForm user={user} /> : <Navigate to="/login" />} />
        <Route path="/projects/:id/add-task-card" element={user ? <AddTaskCard user={user} /> : <Navigate to="/login" />} />
        <Route path="/projects/:id/edit-task/:taskId" element={user ? <EditTask user={user} /> : <Navigate to="/login" />} />
        <Route path="/view-projects" element={user ? <ViewProjects user={user} /> : <Navigate to="/login" />} />
        <Route path="/add-member" element={user ? <Members user={user} /> : <Navigate to="/login" />} />
        <Route path="/view-members" element={user ? <ViewMembers user={user} /> : <Navigate to="/login" />} />
        <Route path="/edit-member/:id" element={user ? <EditMember user={user} /> : <Navigate to="/login" />} />
        <Route path="/projects/:id/resources" element={user ? <ResourcePage user={user} /> : <Navigate to="/login" />} />
        <Route path="/edit-project/:id" element={user ? <EditProject user={user} /> : <Navigate to="/login" />} />
        <Route path="/projects/:id/tasks/:taskId" element={user ? <TaskDetails user={user} /> : <Navigate to="/login" />} />
        <Route path="/projects/:id/members" element={user ? <ViewProjectMembers user={user} /> : <Navigate to="/login" />} />
        <Route path="/add-member" element={<Members />} />
      </Routes>
    </Router>
  );
}

export default App;
