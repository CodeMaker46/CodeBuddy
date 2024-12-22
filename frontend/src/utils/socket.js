// src/utils/socket.js
import { io } from 'socket.io-client';

// Create socket connection
const socket = io('https://codebuddy-rwfi.onrender.com');

export default socket;
