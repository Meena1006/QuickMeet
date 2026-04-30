import { Server } from "socket.io";
import { Meeting } from "../models/meeting.model.js";

/**
 * In-memory room state for fast real-time operations.
 * Persisted to MongoDB for history and analytics.
 */
const rooms = {};           // { roomId: [ { socketId, userId, name, joinedAt, mic, camera } ] }
const chatStore = {};       // { roomId: [ { sender, senderId, message, timestamp } ] }
const hostSockets = {};     // { roomId: hostSocketId }
const roomCreated = {};      // { roomId: createdAt } - for meeting expiration
const waitingParticipants = {}; // { roomId: [ socketIds ] } - participants waiting for host

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

// ======================= JOIN CALL =======================
    socket.on("join-call", async ({ roomId, userId, name, email, isHost, isRejoin }) => {
      socket.join(roomId);
      socket.roomId = roomId;
      socket.userId = userId || null;
      socket.userName = name;
      socket.userEmail = email || null;
      socket.joinedAt = new Date();
      
      // Track if this is a rejoin (returning after disconnection)
      const wasInRoom = socket.wasInRoom === true;
      socket.wasInRoom = true;

      // Meeting expiration: 24 hours
      const MEETING_EXPIRY_MS = 24 * 60 * 60 * 1000;
      if (!roomCreated[roomId]) {
        roomCreated[roomId] = new Date();
      }
      // Check if meeting expired
      if (new Date() - roomCreated[roomId] > MEETING_EXPIRY_MS) {
        socket.emit("meeting-expired");
        socket.leave(roomId);
        return;
      }

      if (!rooms[roomId]) {
        rooms[roomId] = [];
      }

      // Track host
      if (isHost) {
        hostSockets[roomId] = socket.id;
        
        // Auto-join waiting participants when host joins
        if (waitingParticipants[roomId] && waitingParticipants[roomId].length > 0) {
          waitingParticipants[roomId].forEach((waiterSocketId) => {
            const waiter = io.sockets.sockets.get(waiterSocketId);
            if (waiter) {
              waiter.emit("host-joined-auto");
            }
          });
          waitingParticipants[roomId] = [];
        }
      }

      // Remove any existing entry for this socket (clean reconnect)
      rooms[roomId] = rooms[roomId].filter((u) => u.socketId !== socket.id);
      
      // Add participant with video/mic OFF by default
      rooms[roomId].push({
        socketId: socket.id,
        userId,
        name,
        email: email || null,
        joinedAt: new Date(),
        mic: false,       // Start muted by default
        camera: false,    // Start video off by default
        isScreenSharing: false,
        isWaitingForHost: false,
      });

      // Update or create meeting in DB
      try {
        let meeting = await Meeting.findOne({ meetingId: roomId });
        if (!meeting) {
          // If host creates via socket before REST API, create a fallback meeting
          meeting = new Meeting({
            meetingId: roomId,
            title: `Meeting ${roomId.slice(0, 8)}`,
            hostName: name,
            status: "active",
            startedAt: new Date(),
            participants: [],
            chat: [],
          });
        }

        // Mark as active if previously completed
        if (meeting.status === "completed") {
          meeting.status = "active";
        }

        // Add new participant record (fresh join resets their participation)
        // DO NOT check for existing record - treat every join as new participation
        // This ensures rejoin gets fresh state
        const participant = {
          socketId: socket.id,
          userId: userId || null,
          name,
          email: email || null,
          joinedAt: new Date(),
          micOn: false,     // Start muted by default
          cameraOn: false,  // Start video off by default
        };
        meeting.participants.push(participant);

        meeting.totalJoined = (meeting.totalJoined || 0) + 1;
        if (rooms[roomId].length > (meeting.peakParticipants || 0)) {
          meeting.peakParticipants = rooms[roomId].length;
        }
        await meeting.save();
      } catch (err) {
        console.error("DB error on join:", err);
      }

      // Send existing users to the newcomer
      const existingUsers = rooms[roomId].filter((u) => u.socketId !== socket.id);
      socket.emit("existing-users", existingUsers);

      // Only send chat history for new joins, NOT for rejoins
      // This clears chat when rejoin happens
      if (!isRejoin && chatStore[roomId] && chatStore[roomId].length > 0) {
        // Limit to last 50 messages for performance
        const recentChat = chatStore[roomId].slice(-50);
        socket.emit("load-old-messages", recentChat);
      } else {
        // Clear chat on rejoin
        socket.emit("load-old-messages", []);
      }

      // Notify room of updated participants
      io.to(roomId).emit("participants-update", rooms[roomId]);

      // Notify others a new user joined for WebRTC init
      socket.to(roomId).emit("user-joined", socket.id, name);

      // If host exists, notify newcomer
      if (hostSockets[roomId]) {
        socket.emit("host-assigned", hostSockets[roomId]);
        io.to(roomId).emit("host-update", hostSockets[roomId]);
      }

      console.log(`User ${name} (${socket.id}) joined room ${roomId} (rejoin: ${isRejoin || wasInRoom})`);
    });

    // ======================= WEBRTC SIGNALING =======================
    socket.on("signal", (payload) => {
      // payload: { to, signal: { sdp | ice } }
      io.to(payload.to).emit("signal", {
        from: socket.id,
        signal: payload.signal,
      });
    });

    // ======================= CHAT =======================
    socket.on("chat-message", async (payload) => {
      const roomId = socket.roomId;
      if (!roomId) return;

      const messageData = {
        sender: payload.sender || socket.userName || "Unknown",
        senderId: socket.id,
        message: payload.message,
        timestamp: new Date().toISOString(),
      };

      if (!chatStore[roomId]) {
        chatStore[roomId] = [];
      }
      chatStore[roomId].push(messageData);

      // Persist to DB
      try {
        const meeting = await Meeting.findOne({ meetingId: roomId });
        if (meeting) {
          meeting.chat.push({
            sender: messageData.sender,
            senderId: messageData.senderId,
            message: messageData.message,
            timestamp: new Date(),
          });
          if (meeting.chat.length > 200) {
            meeting.chat = meeting.chat.slice(-200);
          }
          await meeting.save();
        }
      } catch (err) {
        console.error("DB chat save error:", err);
      }

      io.to(roomId).emit("chat-message", messageData);
    });

    // ======================= SCREEN SHARE =======================
    socket.on("screen-share-start", () => {
      const roomId = socket.roomId;
      if (!roomId) return;
      const user = rooms[roomId]?.find((u) => u.socketId === socket.id);
      if (user) user.isScreenSharing = true;
      socket.to(roomId).emit("user-started-screen-share", socket.id);
      io.to(roomId).emit("participants-update", rooms[roomId]);
    });

    socket.on("screen-share-stop", () => {
      const roomId = socket.roomId;
      if (!roomId) return;
      const user = rooms[roomId]?.find((u) => u.socketId === socket.id);
      if (user) user.isScreenSharing = false;
      socket.to(roomId).emit("user-stopped-screen-share", socket.id);
      io.to(roomId).emit("participants-update", rooms[roomId]);
    });

    // ======================= TOGGLES =======================
    socket.on("toggle-mic", ({ status }) => {
      const roomId = socket.roomId;
      if (!roomId || !rooms[roomId]) return;
      const user = rooms[roomId].find((u) => u.socketId === socket.id);
      if (user) {
        user.mic = status;
      }
      io.to(roomId).emit("participants-update", rooms[roomId]);
    });

    socket.on("toggle-camera", ({ status }) => {
      const roomId = socket.roomId;
      if (!roomId || !rooms[roomId]) return;
      const user = rooms[roomId].find((u) => u.socketId === socket.id);
      if (user) {
        user.camera = status;
      }
      io.to(roomId).emit("participants-update", rooms[roomId]);
    });

    // ======================= LEAVE / END =======================
    socket.on("leave-call", () => {
      handleUserLeave(socket, io, false);
    });

    socket.on("end-meeting", async () => {
      const roomId = socket.roomId;
      if (!roomId) return;

      // Only host can end
      if (hostSockets[roomId] !== socket.id) {
        socket.emit("error-message", "Only host can end the meeting");
        return;
      }

      // Finalize DB meeting
      try {
        const meeting = await Meeting.findOne({ meetingId: roomId });
        if (meeting) {
          const now = new Date();
          const duration = Math.floor((now - meeting.startedAt) / 1000);
          meeting.status = "completed";
          meeting.endedAt = now;
          meeting.duration = duration;

          meeting.participants.forEach((p) => {
            if (!p.leftAt) {
              p.leftAt = now;
              const joined = new Date(p.joinedAt);
              p.duration = Math.floor((now - joined) / 1000);
              p.attendancePercent = duration > 0 ? Math.round((p.duration / duration) * 100) : 0;
            }
          });

          await meeting.save();
        }
      } catch (err) {
        console.error("End meeting DB error:", err);
      }

      // Kick everyone
      io.to(roomId).emit("meeting-ended");

      // Cleanup
      if (rooms[roomId]) {
        rooms[roomId].forEach((u) => {
          const sock = io.sockets.sockets.get(u.socketId);
          if (sock) {
            sock.leave(roomId);
          }
        });
        delete rooms[roomId];
      }
      delete chatStore[roomId];
      delete hostSockets[roomId];
    });

    // ======================= WATCH ROOM (for host dashboard) =======================
    socket.on("watch-room", ({ roomId }) => {
      socket.join(roomId);
      socket.roomId = roomId;
      socket.emit("participants-update", rooms[roomId] || []);
    });

    // ======================= GET LIVE PARTICIPANTS (for host dashboard) =======================
    socket.on("get-live-participants", (callback) => {
      const roomId = socket.roomId;
      if (!roomId || !rooms[roomId]) return callback([]);
      callback(rooms[roomId]);
    });

    // ======================= DISCONNECT =======================
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      handleUserLeave(socket, io, true);
    });
  });

  // ======================= HELPERS =======================

  async function handleUserLeave(socket, io, isDisconnect) {
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = rooms[roomId];
    if (!room) return;

    const user = room.find((u) => u.socketId === socket.id);
    if (user) {
      user.leftAt = new Date();
      user.duration = Math.floor((user.leftAt - user.joinedAt) / 1000);
    }

    // Remove from room array
    rooms[roomId] = room.filter((u) => u.socketId !== socket.id);

    // Update DB participant record
    try {
      const meeting = await Meeting.findOne({ meetingId: roomId });
      if (meeting) {
        const p = meeting.participants.find(
          (x) => x.socketId === socket.id && !x.leftAt
        );
        if (p) {
          p.leftAt = new Date();
          const joined = new Date(p.joinedAt);
          const now = new Date();
          const durationSec = Math.floor((now - joined) / 1000);
          p.duration = durationSec;
          const totalDur = Math.floor((now - meeting.startedAt) / 1000);
          p.attendancePercent = totalDur > 0 ? Math.round((durationSec / totalDur) * 100) : 0;
          p.micOn = user?.mic ?? true;
          p.cameraOn = user?.camera ?? true;
        }
        await meeting.save();
      }
    } catch (err) {
      console.error("DB leave error:", err);
    }

    // Notify room
    io.to(roomId).emit("user-left", socket.id, socket.userName);
    io.to(roomId).emit("participants-update", rooms[roomId]);

    // Cleanup empty room
    if (rooms[roomId].length === 0) {
      try {
        const meeting = await Meeting.findOne({ meetingId: roomId });
        if (meeting && meeting.status === "active") {
          const now = new Date();
          meeting.status = "completed";
          meeting.endedAt = now;
          meeting.duration = Math.floor((now - meeting.startedAt) / 1000);
          await meeting.save();
        }
      } catch (err) {
        console.error("Empty room cleanup error:", err);
      }
      delete rooms[roomId];
      delete chatStore[roomId];
      delete hostSockets[roomId];
    }

    if (!isDisconnect) {
      socket.leave(roomId);
    }

    console.log(`User ${socket.userName} (${socket.id}) left room ${roomId}`);
  }

  return io;
};

