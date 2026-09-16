require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const Room = require('./models/Room');
const Page = require('./models/Page');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

app.use(express.json());
app.use(cors());

connectDB();

app.use('/api/auth', require('./routes/auth'));
app.use('/api/pages', require('./routes/Pages'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/rooms', require('./routes/rooms'));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Track online users per room
// { roomId: { socketId: userId } }
const roomPresence = {};

// Authenticate Socket.IO connections using JWT
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.data.userId = decoded.id;

    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // ==========================================
  // JOIN COLLABORATION ROOM
  // ==========================================

  socket.on('join-room', async ({ roomId }) => {
    try {
      const room = await Room.findById(roomId);

      if (!room) {
        return socket.emit('room-error', {
          message: 'Room not found',
        });
      }

      const isMember = room.members.some(
        (member) =>
          member.user.toString() === socket.data.userId
      );

      if (!isMember) {
        return socket.emit('room-error', {
          message: 'You are not a member of this room',
        });
      }

      // Join Socket.IO room
      socket.join(roomId);

      socket.data.roomId = roomId;

      // Initialize presence tracking for this room
      if (!roomPresence[roomId]) {
        roomPresence[roomId] = {};
      }

      // Store socket -> user mapping
      roomPresence[roomId][socket.id] = socket.data.userId;

      // Get unique users currently online
      const onlineUserIds = [
        ...new Set(
          Object.values(roomPresence[roomId])
        ),
      ];

      // Send current online users to the newly joined user
      socket.emit('presence-list', onlineUserIds);

      // Tell everyone else this user came online
      socket.to(roomId).emit(
        'user-online',
        socket.data.userId
      );

    } catch (err) {
      console.error('join-room error:', err);

      socket.emit('room-error', {
        message: 'Could not join room',
      });
    }
  });

  // ==========================================
  // JOIN PAGE
  // ==========================================

  socket.on('join-page', async ({ pageId }) => {
    try {
      const page = await Page.findById(pageId);

      if (!page || !page.roomId) {
        return socket.emit('room-error', {
          message: 'Page or room not found',
        });
      }

      const room = await Room.findById(page.roomId);

      if (!room) {
        return socket.emit('room-error', {
          message: 'Room not found',
        });
      }

      // Verify user belongs to the room
      const isMember = room.members.some(
        (member) =>
          member.user.toString() === socket.data.userId
      );

      if (!isMember) {
        return socket.emit('room-error', {
          message: 'You are not a member of this room',
        });
      }

      // Join page-specific Socket.IO room
      socket.join(pageId);

      socket.data.pageId = pageId;

      // Tell other users someone joined the page
      socket.to(pageId).emit('user-joined', {
        userId: socket.data.userId,
      });

    } catch (err) {
      console.error('join-page error:', err);

      socket.emit('room-error', {
        message: 'Could not join page',
      });
    }
  });

  // ==========================================
  // BLOCK UPDATE
  // ==========================================

  socket.on(
    'block-update',
    ({ pageId, blockId, content }) => {
      socket.to(pageId).emit('block-updated', {
        blockId,
        content,
      });
    }
  );

  // ==========================================
  // BLOCK ADD
  // ==========================================

  socket.on(
    'block-add',
    ({ pageId, page }) => {
      socket.to(pageId).emit(
        'block-added',
        page
      );
    }
  );

  // ==========================================
  // BLOCK DELETE
  // ==========================================

  socket.on(
    'block-delete',
    ({ pageId, page }) => {
      socket.to(pageId).emit(
        'block-deleted',
        page
      );
    }
  );

  // ==========================================
  // BLOCK REORDER
  // ==========================================

  socket.on(
    'block-reorder',
    ({ pageId, page }) => {
      socket.to(pageId).emit(
        'block-reordered',
        page
      );
    }
  );

  // ==========================================
  // LIVE EDITING INDICATOR
  // ==========================================

  socket.on(
    'editing-block',
    ({ pageId, blockId }) => {
      socket.to(pageId).emit(
        'block-being-edited',
        {
          blockId,
          userId: socket.data.userId,
        }
      );
    }
  );

  // ==========================================
  // DISCONNECT
  // ==========================================

  socket.on('disconnect', () => {
    console.log(
      'User disconnected:',
      socket.id
    );

    const { roomId, userId } = socket.data;

    if (
      roomId &&
      roomPresence[roomId]
    ) {
      // Remove this socket
      delete roomPresence[roomId][socket.id];

      // Check whether the same user still has
      // another socket connected to this room
      const stillOnline = Object.values(
        roomPresence[roomId]
      ).includes(userId);

      // Only mark user offline if all their
      // connections to this room are gone
      if (!stillOnline) {
        socket.to(roomId).emit(
          'user-offline',
          userId
        );
      }

      // Delete empty room presence object
      if (
        Object.keys(roomPresence[roomId]).length === 0
      ) {
        delete roomPresence[roomId];
      }
    }
  });
});

// ==========================================
// START SERVER
// ==========================================

server.listen(
  process.env.PORT,
  () =>
    console.log(
      `Server on ${process.env.PORT}`
    )
);