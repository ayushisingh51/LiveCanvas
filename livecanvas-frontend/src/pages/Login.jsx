import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { login } from '../api/auth';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(form.email, form.password);

      console.log(res.data);

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userName', res.data.user.name);

      console.log("Saved:", localStorage.getItem("userName"));

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.form
        onSubmit={handleSubmit}
        className="auth-form"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <h2>Welcome back</h2>

        {error && <p className="error-text">{error}</p>}

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        <p>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </motion.form>
    </div>
  );
}