import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: "*", // allow all or specific client URL
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Client requests to join a board room
    socket.on("joinBoard", (boardId: string) => {
      if (boardId) {
        socket.join(`board_${boardId}`);
        console.log(`Socket ${socket.id} joined room: board_${boardId}`);
      }
    });

    socket.on("leaveBoard", (boardId: string) => {
      if (boardId) {
        socket.leave(`board_${boardId}`);
        console.log(`Socket ${socket.id} left room: board_${boardId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
