import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  autoConnect: false,
  auth: {
    token: localStorage.getItem('token'),
  },
});

export const joinRoom = (roomId) => {
  socket.emit('join-room', { roomId });
};

export const onPresenceList = (callback) => {
  socket.on('presence-list', callback);
};

export const onUserOnline = (callback) => {
  socket.on('user-online', callback);
};

export const onUserOffline = (callback) => {
  socket.on('user-offline', callback);
};

export default socket;