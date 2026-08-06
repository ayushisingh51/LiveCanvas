import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { getGreeting } from '../utils/greeting';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export default function Dashboard() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'there';

  useEffect(() => {
    api.get('/pages').then((res) => setPages(res.data)).finally(() => setLoading(false));
  }, []);

  const createPage = async () => {
    const title = prompt('Page title:');
    if (!title) return;
    const slug = title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4);
    const res = await api.post('/pages', { title, slug });
    navigate(`/editor/${res.data._id}`);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const totalBlocks = pages.reduce((sum, p) => sum + p.blocks.length, 0);

  if (loading) return <div className="loading">Loading your workspace...</div>;

  return (
    <motion.div className="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <motion.div
        className="dashboard-top"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <p className="greeting-eyebrow">{getGreeting()}</p>
          <h1 className="greeting-name">{userName}</h1>
        </div>
        <div>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={createPage}>
            + New Page
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={logout} className="logout-btn">
            Logout
          </motion.button>
        </div>
      </motion.div>

      <motion.div className="stats-row" variants={container} initial="hidden" animate="show">
        <motion.div className="stat-card" variants={item}>
          <span className="stat-number">{pages.length}</span>
          <span className="stat-label">Pages</span>
        </motion.div>
        <motion.div className="stat-card" variants={item}>
          <span className="stat-number">{totalBlocks}</span>
          <span className="stat-label">Total blocks</span>
        </motion.div>
        <motion.div className="stat-card" variants={item}>
          <span className="stat-number">{pages.length > 0 ? 'Active' : '—'}</span>
          <span className="stat-label">Workspace status</span>
        </motion.div>
      </motion.div>

      <h2 className="section-label">Your pages</h2>

      {pages.length === 0 ? (
        <motion.div className="empty-state" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <p className="empty-title">No pages yet</p>
          <p className="empty-sub">Create your first page and start building — it goes live instantly.</p>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={createPage}>
            + Create your first page
          </motion.button>
        </motion.div>
      ) : (
        <motion.div className="page-grid" variants={container} initial="hidden" animate="show">
          {pages.map((page) => (
            <motion.div
              key={page._id}
              className="page-card"
              variants={item}
              whileHover={{ y: -6, borderColor: 'var(--coral)' }}
              onClick={() => navigate(`/editor/${page._id}`)}
            >
              <h3>{page.title}</h3>
              <span>{page.blocks.length} blocks · /{page.slug}</span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}