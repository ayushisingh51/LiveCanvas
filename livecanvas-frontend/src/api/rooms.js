import api from './axios';

export const createRoom = (name) =>
  api.post('/rooms', { name });

export const joinRoom = (joinCode) =>
  api.post('/rooms/join', { joinCode });

export const getMyRooms = () =>
  api.get('/rooms/mine');

export const getRoom = (roomId) =>
  api.get(`/rooms/${roomId}`);