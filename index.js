import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
import cors from "cors";

app.use(
  cors({
    origin: "*",
  })
);

import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.use((socket, next) => {
  const token = socket.handshake.query.token;

  if (!token) {
    return next(new Error("Token missing"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Replace with your secret or public key
    socket.user = decoded; // Attach user information to the Socket.IO connection

    console.log(decoded);
    next();
  } catch (err) {
    return next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(socket.id);
  console.log("a user connected");

  socket.on("leaderboard", (data) => {
    console.log(data);
    io.emit("leaderboard", data);
  });

  socket.on("contest:problem", (data) => {
    console.log(data);
    if (data.result === "Passed") {
      io.emit("contest:problem", data);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Listening to ${PORT} port`);
});
