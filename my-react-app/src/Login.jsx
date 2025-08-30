import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (res.status === 200) {
        const data = await res.json();

        localStorage.setItem('token', data.token);

        const payload = JSON.parse(atob(data.token.split('.')[1]));

        const user = {
          id: payload.id,
          username: payload.name,
          role: payload.role,
          memberId: payload.memberId || null,
        };

        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('role', payload.role);
        localStorage.setItem('userId', String(payload.id));
        localStorage.setItem('username', payload.name);
        if (user.memberId) localStorage.setItem('memberId', String(user.memberId));

        if (typeof onLogin === 'function') onLogin(user);

        navigate('/');
        return;
      }

      if (res.status === 401) return alert('Incorrect password. Please try again.');
      if (res.status === 404) {
        alert('User not found. Please sign up first.');
        navigate('/signin');
        return;
      }
      alert('Login failed. Please try again later.');
    } catch (err) {
      console.error('Error logging in:', err);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <p className="login-header">Login</p>
      <input
        type="text"
        name="username"
        placeholder="Email/Username"
        className="login-detail"
        value={formData.username}
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        className="login-detail"
        value={formData.password}
        onChange={handleChange}
        required
      />
      <input type="submit" value="Login" className="login-button" />
      <p>Not Registered? <Link to="/signin">Sign Up Here</Link></p>
    </form>
  );
}

export default Login;
