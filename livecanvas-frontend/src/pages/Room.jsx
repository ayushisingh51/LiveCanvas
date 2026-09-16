import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreatePage, setShowCreatePage] = useState(false);
  const [pageTitle, setPageTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.get(`/rooms/${roomId}`)
      .then((res) => {
        setRoom(res.data.room);
        setPages(res.data.pages);
      })
      .catch((err) => {
        console.error('Failed to load room:', err);

        if (err.response?.status === 403) {
          alert('You are not a member of this room.');
          navigate('/dashboard');
        }
      })
      .finally(() => setLoading(false));
  }, [roomId, navigate]);

  const createPage = async (e) => {
    e.preventDefault();

    const title = pageTitle.trim();

    if (!title) return;

    try {
      setCreating(true);

      const slug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') +
        '-' +
        Math.floor(1000 + Math.random() * 9000);

      const res = await api.post('/pages', {
        title,
        slug,
        roomId,
      });

      setPages((prev) => [res.data, ...prev]);
      setPageTitle('');
      setShowCreatePage(false);

      navigate(`/room/${roomId}/editor/${res.data._id}`);
    } catch (err) {
      console.error('Failed to create page:', err);

      alert(
        err.response?.data?.msg ||
        'Failed to create page.'
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        Loading room...
      </div>
    );
  }

  if (!room) {
    return (
      <div className="loading">
        Room not found.
      </div>
    );
  }

  return (
    <motion.div
      className="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <motion.div
        className="dashboard-top"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <p className="greeting-eyebrow">
            ROOM
          </p>

          <h1 className="greeting-name">
            {room.name}
          </h1>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/dashboard')}
        >
          ← Dashboard
        </motion.button>
      </motion.div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-number">
            {pages.length}
          </span>

          <span className="stat-label">
            Pages
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-number">
            {room.members.length}
          </span>

          <span className="stat-label">
            Members
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-number">
            {room.joinCode}
          </span>

          <span className="stat-label">
            Join code
          </span>
        </div>
      </div>

      {/* Members */}
      <h2 className="section-label">
        Members
      </h2>

      <div className="page-grid">
        {room.members.map((member) => (
          <motion.div
            key={member.user._id}
            className="page-card"
            whileHover={{ y: -4 }}
          >
            <h3>
              {member.user.name}
            </h3>

            <span>
              {member.role === 'owner'
                ? 'Owner'
                : 'Editor'}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Pages header */}
      <div className="pages-section-header">
        <h2 className="section-label">
          Pages
        </h2>

        <motion.button
          className="create-page-button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() =>
            setShowCreatePage((prev) => !prev)
          }
        >
          {showCreatePage
            ? 'Cancel'
            : '+ New Page'}
        </motion.button>
      </div>

      {/* Create page form */}
      {showCreatePage && (
        <motion.form
          className="create-page-form"
          onSubmit={createPage}
          initial={{
            opacity: 0,
            y: -8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          <input
            type="text"
            placeholder="Enter page title..."
            value={pageTitle}
            onChange={(e) =>
              setPageTitle(e.target.value)
            }
            autoFocus
          />

          <button
            type="submit"
            disabled={
              creating ||
              !pageTitle.trim()
            }
          >
            {creating
              ? 'Creating...'
              : 'Create Page'}
          </button>
        </motion.form>
      )}

      {/* Pages */}
      {pages.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">
            No pages yet
          </p>

          <p className="empty-sub">
            Create a page inside this room
            to start collaborating.
          </p>
        </div>
      ) : (
        <motion.div
          className="page-grid"
          initial="hidden"
          animate="show"
        >
          {pages.map((page) => (
            <motion.div
              key={page._id}
              className="page-card"
              whileHover={{
                y: -6,
                borderColor: 'var(--coral)',
              }}
              onClick={() =>
                navigate(
                  `/room/${roomId}/editor/${page._id}`
                )
              }
            >
              <h3>
                {page.title}
              </h3>

              <span>
                {page.blocks.length} blocks · /
                {page.slug}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}