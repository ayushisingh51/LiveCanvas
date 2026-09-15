import { io } from 'socket.io-client';

const socket = io('https://livecanvas-jzl6.onrender.com', {
  autoConnect: false,
});

export default socket;