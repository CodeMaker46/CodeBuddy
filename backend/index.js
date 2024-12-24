import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  },
});

app.use(cors());
app.use(express.json());

// Room Management
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User Connected", socket.id);
  let currentRoom = null;
  let currentUser = null;

  socket.on("join", ({ roomId, userName }) => {
    if (currentRoom) {
      socket.leave(currentRoom);
      rooms.get(currentRoom).delete(userName);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom).keys()));
    }

    currentRoom = roomId;
    currentUser = userName;

    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }

    const roomUsers = rooms.get(roomId);

    if (roomUsers.has(userName)) {
      socket.emit("usernameTaken", "This username is already taken in this room.");
      return;
    }

    roomUsers.set(userName, socket.id);
    io.to(currentRoom).emit("userJoined", Array.from(roomUsers.keys()));
    console.log(`User: ${userName} has joined the room: ${roomId}`);

    // Real-time code collaboration
    socket.on("codeChange", ({ roomId, code }) => {
      socket.to(roomId).emit("codeUpdate", code);
    });

    socket.on("typing", ({ roomId, userName }) => {
      socket.to(roomId).emit("userTyping", userName);
    });

    socket.on("languageChange", ({ roomId, language }) => {
      io.to(roomId).emit("languageUpdate", language);
    });

    // Real-time whiteboard
    socket.on("draw", (data) => {
      //console.log("Draw event received from user", socket.id);
      const { roomId, x1, y1, x2, y2, color, width, isEraser } = data;

      // Broadcast drawing or erasing data to all clients in the same room except the sender
      socket.to(roomId).emit("draw", {
        x1,
        y1,
        x2,
        y2,
        color,
        width,
        isEraser,
      });
    });

    socket.on("leaveRoom", () => {
      if (currentRoom && currentUser) {
        rooms.get(currentRoom).delete(currentUser);
        io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom).keys()));
      }
      socket.leave(currentRoom);
      currentRoom = null;
      currentUser = null;
    });

    socket.on("disconnect", () => {
      if (currentRoom && currentUser) {
        rooms.get(currentRoom).delete(currentUser);
        io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom).keys()));
      }
      console.log("User disconnected");
    });
  });
});

// Serve frontend files
const port = process.env.PORT || 4000;
const __dirname = path.resolve();

app.use(express.static(path.join(__dirname, "/frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

server.listen(port, () => {
  console.log(`Server live at port ${port}`);
});