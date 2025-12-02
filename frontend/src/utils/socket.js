import { io } from 'socket.io-client';

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

let socketInstance = null;

const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(BACKEND_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket'],
    });
  }
  return socketInstance;
};

export default getSocket;
