
import { io } from 'socket.io-client';
// const socket = io('https://codebuddy-rwfi.onrender.com'); 
const socket = io('http://localhost:4000'); 

socket.on("connect", () => {
  
});

socket.on("disconnect", () => {
  
});


export default socket;
