
import { io } from 'socket.io-client';
<<<<<<< HEAD
// const socket = io('https://codebuddy-rwfi.onrender.com'); 
const socket = io('http://localhost:4000'); 
=======
const socket = io('https://codebuddy-backend-uxv9.onrender.com'); 
>>>>>>> origin

socket.on("connect", () => {
  
});

socket.on("disconnect", () => {
  
});


export default socket;
