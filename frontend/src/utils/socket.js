// src/utils/socket.js
import { io } from 'socket.io-client';

// Create socket connection
const socket = io('https://codebuddy-rwfi.onrender.com');  // replace with the correct backend URL if deployed elsewhere

socket.on("connect", () => {
  console.log("Socket connected", socket.id);  // This should log the socket ID when the connection is successful
});

socket.on("disconnect", () => {
  console.log("Socket disconnected");
});


export default socket;
