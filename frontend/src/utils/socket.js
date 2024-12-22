// src/utils/socket.js
import { io } from 'socket.io-client';

// Create socket connection
const socket = io('http://localhost:4000');

export default socket;
