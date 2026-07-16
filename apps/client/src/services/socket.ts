import { io } from "socket.io-client";

// Adjust URL to match backend port. Typically it's localhost:5000 in dev.
export const socket = io("http://localhost:5000", {
  autoConnect: false, // We'll connect when needed
});
