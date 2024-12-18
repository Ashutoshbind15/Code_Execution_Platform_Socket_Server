import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
import cors from "cors";

app.use(
  cors({
    origin: "*",
  }),
);

import http from "http";
import { Server } from "socket.io";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const userSocketMap = new Map();

io.use((socket, next) => {
  const token = socket.handshake.query.token;
  if (!token) {
    return next(new Error("Authentication error"));
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return next(new Error("Authentication error"));
    }
    socket.user = decoded;
    next();
  });
});

io.on("connection", (socket) => {
  console.log(socket.id);
  console.log(userSocketMap);
  console.log("a user connected");

  const userId = socket.user.sub;

  let sockets = userSocketMap.get(userId) || new Set();
  sockets.add(socket.id);
  userSocketMap.set(userId, sockets);

  socket.broadcast.emit("joincontest", {
    uid: userId,
  });

  socket.on("leaderboard", (data) => {
    socket.broadcast.emit(data);
  });

  socket.on("disconnect", () => {
    const userId = Array.from(userSocketMap.entries()).find(([key, value]) =>
      value.has(socket.id),
    )?.[0];
    userSocketMap.forEach((sockets, userId) => {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSocketMap.delete(userId);
        } else {
          userSocketMap.set(userId, sockets);
        }
      }
    });
    console.log(`Socket disconnected: ${socket.id}`);

    socket.broadcast.emit("leavecontest", {
      uid: userId,
    });
  });
});

app.get("/users", (req, res) => {
  res.status(200).json({ users: Array.from(userSocketMap.keys()) });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Listening to ${PORT} port`);
});
