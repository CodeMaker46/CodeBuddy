
import { io } from 'socket.io-client';
const socket = io('https://codebuddy-backend-uxv9.onrender.com'); 

socket.on("connect", () => {
  
});

socket.on("disconnect", () => {
  
});


export default socket;
