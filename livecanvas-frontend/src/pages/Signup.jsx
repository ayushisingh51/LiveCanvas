import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api/auth';
import { motion } from 'framer-motion';

export default function Signup() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

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
      const res = await signup(form.name, form.email, form.password);

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userName', res.data.user.name);

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Signup failed');
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
        <h2>Create your account</h2>

        {error && <p className="error-text">{error}</p>}

        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
        />

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
          minLength={6}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign up'}
        </button>

        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </motion.form>
    </div>
  );
}