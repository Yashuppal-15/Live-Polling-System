import { io } from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

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

    socketInstance.on('connect', () => {
      console.log('✅ Connected to server:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from server');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error.message || error);
    });
  }

  return socketInstance;
};

export default getSocket;
