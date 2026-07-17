import { io } from "socket.io-client";

// Adjust URL to match backend port. Typically it's localhost:5000 in dev.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  autoConnect: false, // We'll connect when needed
});
