import { io } from "socket.io-client";
import server from "../environment";

// For Socket.IO, we need to ensure we're connecting to the correct endpoint
// In production, Socket.IO runs on the same server as the HTTP API
let socketUrl = server;

// If the server URL doesn't already include the socket path, add it
// Socket.IO client automatically connects to the default /socket.io path
// But we need to make sure we're not adding duplicate paths
if (!socketUrl.includes("/socket.io")) {
  // Remove any trailing slashes
  socketUrl = server.replace(/\/$/, "");
}

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const resetSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

