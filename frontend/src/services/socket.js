import { io } from "socket.io-client";
import server from "../environment";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(server, {
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

