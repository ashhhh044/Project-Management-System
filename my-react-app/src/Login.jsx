import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.status === 200) {
        const data = await res.json();
        localStorage.setItem('token', data.token); // store JWT
        console.log('Login successful');
        navigate('/')
      } else {
        // Login failed → redirect to signup
        alert('Login failed. Please sign in first.');
        navigate('/signin');
      }
    } catch (err) {
      console.error('Error logging in:', err);
    }
  };

  return (
    <>
      {/* <section className="background">
        <div className="circle-first"></div>
        <div className="circle-second"></div>
        <div className="circle-third"></div>
        <div className="circle-fourth"></div>
      </section> */}

      <form className="login-form" onSubmit={handleSubmit}>
        <p className="login-header">Login</p>
        <input type="text" name="username" placeholder="Email/Username"
          className="login-detail" value={formData.username} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password"
          className="login-detail" value={formData.password} onChange={handleChange} required />
        <input type="submit" value="Login" className="login-button" />
        <p><a href="#">Forgot Password?</a></p>
        <p>Not Registered? <Link to="/signup">Sign Up Here</Link></p>
      </form>
    </>
  );
}

export default Login;
