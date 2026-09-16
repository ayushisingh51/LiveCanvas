import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getGreeting } from '../utils/greeting';
import {
  createRoom,
  joinRoom,
  getMyRooms,
} from '../api/rooms';
import socket, {
  joinRoom as joinSocketRoom,
  onPresenceList,
  onUserOnline,
  onUserOffline,
} from '../api/socket';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

export default function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'there';

  useEffect(() => {
    getMyRooms()
      .then((res) => setRooms(res.data))
      .catch((err) => {
        console.error('Failed to load rooms:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handlePresenceList = (userIds) => {
      setOnlineUsers(new Set(userIds));
    };

    const handleUserOnline = (userId) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    };

    const handleUserOffline = (userId) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.connect();

    onPresenceList(handlePresenceList);
    onUserOnline(handleUserOnline);
    onUserOffline(handleUserOffline);

    return () => {
      socket.off('presence-list', handlePresenceList);
      socket.off('user-online', handleUserOnline);
      socket.off('user-offline', handleUserOffline);
      socket.disconnect();
    };
  }, []);

  const handleCreateRoom = async () => {
    const name = prompt('Room name:');

    if (!name) return;

    try {
      const res = await createRoom(name);

      setRooms((prev) => [res.data, ...prev]);

      alert(`Room created!\nJoin code: ${res.data.joinCode}`);
    } catch (err) {
      console.error('Failed to create room:', err);
      alert('Could not create room.');
    }
  };

  const handleJoinRoom = async () => {
    const joinCode = prompt('Enter room join code:');

    if (!joinCode) return;

    try {
      const res = await joinRoom(joinCode.trim());

      setRooms((prev) => {
        const alreadyExists = prev.some(
          (room) => room._id === res.data._id
        );

        return alreadyExists ? prev : [...prev, res.data];
      });

      alert(`Joined ${res.data.name}!`);
    } catch (err) {
      console.error('Failed to join room:', err);

      const message =
        err.response?.data?.msg || 'Could not join room.';

      alert(message);
    }
  };

  const logout = () => {
    socket.disconnect();
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="loading">
        Loading your rooms...
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
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCreateRoom}
          >
            + Create Room
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleJoinRoom}
          >
            Join Room
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={logout}
            className="logout-btn"
          >
            Logout
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        className="stats-row"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div className="stat-card" variants={item}>
          <span className="stat-number">{rooms.length}</span>
          <span className="stat-label">Rooms</span>
        </motion.div>

        <motion.div className="stat-card" variants={item}>
          <span className="stat-number">
            {rooms.reduce(
              (total, room) => total + room.members.length,
              0
            )}
          </span>
          <span className="stat-label">Members</span>
        </motion.div>

        <motion.div className="stat-card" variants={item}>
          <span className="stat-number">
            {onlineUsers.size}
          </span>
          <span className="stat-label">Online</span>
        </motion.div>
      </motion.div>

      <h2 className="section-label">Your rooms</h2>

      {rooms.length === 0 ? (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <p className="empty-title">No rooms yet</p>

          <p className="empty-sub">
            Create a room or join one using an invite code.
          </p>

          <div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCreateRoom}
            >
              + Create Room
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleJoinRoom}
            >
              Join Room
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="page-grid"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {rooms.map((room) => (
            <motion.div
              key={room._id}
              className="page-card"
              variants={item}
              whileHover={{
                y: -6,
                borderColor: 'var(--coral)',
              }}
              onClick={() => navigate(`/room/${room._id}`)}
            >
              <h3>{room.name}</h3>

              <span>
                {room.members.length}{' '}
                {room.members.length === 1
                  ? 'member'
                  : 'members'}
              </span>

              <div className="room-members">
                {room.members.map((member) => {
                  const memberId =
                    member.user?._id || member.user;

                  const memberName =
                    member.user?.name || 'Member';

                  const isOnline =
                    onlineUsers.has(memberId);

                  return (
                    <div
                      key={memberId}
                      className="room-member"
                    >
                      <span
                        className={`online-dot ${
                          isOnline ? 'online' : ''
                        }`}
                      />

                      <span>{memberName}</span>
                    </div>
                  );
                })}
              </div>

              <small>
                Join code: {room.joinCode}
              </small>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}