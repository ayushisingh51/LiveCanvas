require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
app.use(express.json());
app.use(cors());
connectDB();

app.use('/api/auth', require('./routes/auth'));
app.use('/api/pages', require('./routes/pages'));
app.use('/api/ai', require('./routes/ai'));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }, // tighten this to your frontend URL in production
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a room for a specific page
  socket.on('join-page', ({ pageId, userName }) => {
  socket.join(pageId);
  socket.to(pageId).emit('user-joined', { userName });
});

  // Broadcast block updates to everyone else in the room
  socket.on('block-update', ({ pageId, blockId, content }) => {
    socket.to(pageId).emit('block-updated', { blockId, content });
  });

  // Broadcast block add
  socket.on('block-add', ({ pageId, page }) => {
    socket.to(pageId).emit('block-added', page);
  });

  // Broadcast block delete
  socket.on('block-delete', ({ pageId, page }) => {
    socket.to(pageId).emit('block-deleted', page);
  });

  // Broadcast reorder
  socket.on('block-reorder', ({ pageId, page }) => {
    socket.to(pageId).emit('block-reordered', page);
  });

  // Optional: live "who's editing" indicator
  socket.on('editing-block', ({ pageId, blockId, userName }) => {
    socket.to(pageId).emit('block-being-edited', { blockId, userName });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(process.env.PORT, () => console.log(`Server on ${process.env.PORT}`));