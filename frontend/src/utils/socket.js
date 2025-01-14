
import { io } from 'socket.io-client';
const socket = io('https://codebuddy-backend-uxv9.onrender.com'); // for deployment
// const socket = io('http://localhost:4000'); // for localhost

socket.on("connect", () => {
  
});

socket.on("disconnect", () => {
  
});


export default socket;