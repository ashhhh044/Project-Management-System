import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';

function Signin() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    // Password length check first
    if (formData.password.length < 8) {
      return setError('Password must be at least 8 characters long');
    }

    // Password match check second
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      const res = await fetch('http://localhost:5000/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      const data = await res.json();
      if (res.status === 200) {
        alert('Registration successful! Please login.');
        navigate('/login');
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      console.error('Error signing up:', err);
      setError('Something went wrong. Please try again.');
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
        <p className="login-header">Sign Up</p>
        
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
        
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          className="login-detail"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <input type="submit" value="Register" className="login-button" />

        <p>Already Registered? <a href="/">Login Here</a></p>
      </form>
    </>
  );
}

export default Signin;
