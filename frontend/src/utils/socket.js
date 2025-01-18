
import { io } from 'socket.io-client';
<<<<<<< HEAD
//const socket = io('https://codebuddy-backend-uxv9.onrender.com'); // for deployment
 const socket = io('http://localhost:4000'); // for localhost
=======
const socket = io('https://codebuddy-backend-uxv9.onrender.com'); // for deployment
// const socket = io('http://localhost:4000'); // for localhost
>>>>>>> origin/main

socket.on("connect", () => {
  
});

socket.on("disconnect", () => {
  
});


export default socket;