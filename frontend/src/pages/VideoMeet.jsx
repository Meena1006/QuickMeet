import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  IconButton,
  Typography,
  Stack,
  Paper,
  TextField,
  Grid,
  Chip,
  Tooltip,
  Badge,
} from "@mui/material";
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  ScreenShare,
  StopScreenShare,
  Chat,
  CallEnd,
  Dashboard,
  Send,
  ContentCopy,
} from "@mui/icons-material";
import { getSocket, disconnectSocket } from "../services/socket";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeet() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isHostParam = searchParams.get("host") === "true";

  const [joined, setJoined] = useState(false);
  const [userName, setUserName] = useState(user?.name || "");
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
const [videoOn, setVideoOn] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const [waitingForHost, setWaitingForHost] = useState(false);
  const [meetingExpired, setMeetingExpired] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [chatOpen, setChatOpen] = useState(true);
const [isHost, setIsHost] = useState(isHostParam);
  const [hostSocketId, setHostSocketId] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const chatEndRef = useRef(null);

  // Timer
  useEffect(() => {
    if (!joined) return;
    const timer = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, [joined]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    Object.values(peersRef.current).forEach((pc) => pc.close());
    peersRef.current = {};
    if (socketRef.current) {
      socketRef.current.emit("leave-call");
      disconnectSocket();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

const startMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      
      // Disable video and audio by default (privacy - user chooses to enable)
      stream.getVideoTracks().forEach(track => track.enabled = false);
      stream.getAudioTracks().forEach(track => track.enabled = false);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch {
      alert("Camera/Mic permission denied");
    }
  };

const connectSocket = () => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.emit("join-call", {
      roomId,
      userId: user?._id || null,
      name: userName,
      email: user?.email || null,
      isHost: isHostParam,
    });

    socket.on("existing-users", (users) => {
      users.forEach((u) => {
        createPeer(u.socketId, true);
      });
    });

    socket.on("user-joined", (id, name) => {
      createPeer(id, false);
    });

    socket.on("signal", ({ from, signal }) => {
      handleSignal(from, signal);
    });

    socket.on("user-left", (id) => {
      if (peersRef.current[id]) {
        peersRef.current[id].close();
        delete peersRef.current[id];
      }
      setParticipants((prev) => prev.filter((p) => p.socketId !== id && p.id !== id));
      const el = document.getElementById(`video-${id}`);
      if (el) el.srcObject = null;
    });

    socket.on("participants-update", (users) => {
      setParticipants(users || []);
    });

    socket.on("chat-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("load-old-messages", (msgs) => {
      setMessages(msgs || []);
    });

    socket.on("host-assigned", (hostId) => {
      setHostSocketId(hostId);
      setIsHost(socket.id === hostId);
    });

    socket.on("host-update", (hostId) => {
      setHostSocketId(hostId);
      setIsHost(socket.id === hostId);
    });

    socket.on("meeting-ended", () => {
      alert("Meeting ended by host");
      cleanup();
      navigate(`/history/${roomId}`);
    });

socket.on("user-started-screen-share", (id) => {
      // UI can be updated if needed
    });

    socket.on("user-stopped-screen-share", (id) => {
      // UI can be updated if needed
    });

    // Handle meeting expired
    socket.on("meeting-expired", () => {
      setMeetingExpired(true);
      cleanup();
    });

    // Handle host joined - auto join waiting participants
    socket.on("host-joined-auto", () => {
      setWaitingForHost(false);
      if (!localStreamRef.current) {
        startMedia();
      }
    });
  };

  const createPeer = (peerId, isInitiator) => {
    if (peersRef.current[peerId]) return;

    const pc = new RTCPeerConnection(rtcConfig);
    peersRef.current[peerId] = pc;

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit("signal", {
          to: peerId,
          signal: { ice: e.candidate },
        });
      }
    };

    pc.ontrack = (e) => {
      let el = document.getElementById(`video-${peerId}`);
      if (el) {
        el.srcObject = e.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        pc.close();
        delete peersRef.current[peerId];
      }
    };

    if (isInitiator) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          socketRef.current?.emit("signal", {
            to: peerId,
            signal: { sdp: pc.localDescription },
          });
        })
        .catch(console.error);
    }
  };

  const handleSignal = (fromId, signal) => {
    let pc = peersRef.current[fromId];
    if (!pc) {
      createPeer(fromId, false);
      pc = peersRef.current[fromId];
    }

    if (signal.ice) {
      pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(console.error);
      return;
    }

    if (signal.sdp) {
      const remoteDesc = new RTCSessionDescription(signal.sdp);
      pc.setRemoteDescription(remoteDesc)
        .then(() => {
          if (signal.sdp.type === "offer") {
            return pc
              .createAnswer()
              .then((answer) => pc.setLocalDescription(answer))
              .then(() => {
                socketRef.current?.emit("signal", {
                  to: fromId,
                  signal: { sdp: pc.localDescription },
                });
              });
          }
        })
        .catch(console.error);
    }
  };

  const joinMeeting = async () => {
    if (!userName.trim()) return;
    setJoined(true);
    await startMedia();
    connectSocket();
  };

  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setAudioOn(track.enabled);
    socketRef.current?.emit("toggle-mic", { status: track.enabled });
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setVideoOn(track.enabled);
    socketRef.current?.emit("toggle-camera", { status: track.enabled });
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(screenTrack);
        });

        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        screenTrack.onended = () => stopScreenShare();
        setScreenSharing(true);
        socketRef.current?.emit("screen-share-start");
      } catch {
        // cancelled
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    Object.values(peersRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) sender.replaceTrack(camTrack);
    });
    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    setScreenSharing(false);
    socketRef.current?.emit("screen-share-stop");
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    socketRef.current?.emit("chat-message", {
      sender: userName,
      message: message.trim(),
    });
    setMessage("");
  };

  const leaveMeeting = () => {
    cleanup();
    navigate(`/history/${roomId}`);
  };

const goToDashboard = () => {

    window.open(`/#/dashboard/${roomId}`, "_blank");

  };

const copyLink = async () => {
    try {
      const meetingLink = `${window.location.origin}/room/${roomId}`;
      await navigator.clipboard.writeText(meetingLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = `${window.location.origin}/room/${roomId}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  // Handle meeting expired
  if (meetingExpired) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "#0f0f1a",
          color: "#fff",
        }}
      >
        <Paper sx={{ p: 5, width: "100%", maxWidth: 420, borderRadius: 3, textAlign: "center" }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }} color="error">
            Meeting Expired
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            This meeting link has expired (24 hours limit reached). Please ask the host for a new link.
          </Typography>
          <Button variant="contained" onClick={() => navigate("/home")}>
            Go to Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  // Waiting for host screen (for participants when host hasn't joined yet)
  if (waitingForHost && !isHostParam) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "#0f0f1a",
          color: "#fff",
        }}
      >
        <Paper sx={{ p: 5, width: "100%", maxWidth: 420, borderRadius: 3, textAlign: "center" }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
            Waiting for Host
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            The host hasn't joined yet. You'll be automatically joined when they start the meeting.
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => {
              setWaitingForHost(false);
              navigate("/home");
            }}
          >
            Leave Wait
          </Button>
        </Paper>
      </Box>
    );
  }

  if (!joined) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "#0f0f1a",
          color: "#fff",
        }}
      >
        <Paper sx={{ p: 5, width: "100%", maxWidth: 420, borderRadius: 3, textAlign: "center" }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            Ready to join?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Meeting ID: <strong>{roomId}</strong>
          </Typography>
          <TextField
            fullWidth
            label="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Button
            variant="contained"
            fullWidth
            size="large"
            sx={{ bgcolor: "#ff7a00", fontWeight: 700 }}
            onClick={joinMeeting}
            disabled={!userName.trim()}
          >
            Join Meeting
          </Button>
          <Button sx={{ mt: 2 }} onClick={() => navigate("/home")}>
            Cancel
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "#0f0f1a" }}>
      {/* Top Bar */}
      <Box sx={{ px: 2, py: 1, display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff" }}>
        <Typography variant="subtitle1" fontWeight={700}>
          {roomId}
        </Typography>
        <Chip label={formatTime(duration)} sx={{ color: "#fff", borderColor: "#fff" }} variant="outlined" />
<Stack direction="row" spacing={1}>
          <Tooltip title={linkCopied ? "Link Copied!" : "Copy Meeting Link"}>
            <IconButton color="inherit" onClick={copyLink}>
              <ContentCopy />
            </IconButton>
          </Tooltip>
          {isHost && (
            <Tooltip title="Host Dashboard">
              <IconButton color="warning" onClick={goToDashboard}>
                <Dashboard />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Toggle Chat">
            <IconButton color="inherit" onClick={() => setChatOpen((c) => !c)}>
              <Chat />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Video Area */}
        <Box sx={{ flex: 1, p: 2, overflowY: "auto" }}>
          <Grid container spacing={2} justifyContent="center">
            {/* Local Video */}
            <Grid item xs={12} sm={participants.length === 0 ? 12 : 6} md={participants.length === 0 ? 12 : 4}>
              <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden", bgcolor: "#1a1a2e", aspectRatio: "16/9" }}>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <Box sx={{ position: "absolute", bottom: 8, left: 8, display: "flex", gap: 1 }}>
                  <Chip size="small" label={`${userName} (You)`} sx={{ color: "#fff", bgcolor: "rgba(0,0,0,0.6)" }} />
                  {!audioOn && <Chip size="small" icon={<MicOff />} sx={{ color: "#fff", bgcolor: "rgba(0,0,0,0.6)" }} />}
                </Box>
              </Box>
            </Grid>

            {/* Remote Videos */}
            {participants
              .filter((p) => p.socketId !== socketRef.current?.id)
              .map((p) => (
                <Grid item xs={12} sm={6} md={4} key={p.socketId}>
                  <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden", bgcolor: "#1a1a2e", aspectRatio: "16/9" }}>
                    <video
                      id={`video-${p.socketId}`}
                      autoPlay
                      playsInline
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <Box sx={{ position: "absolute", bottom: 8, left: 8, display: "flex", gap: 1 }}>
                      <Chip size="small" label={p.name} sx={{ color: "#fff", bgcolor: "rgba(0,0,0,0.6)" }} />
                      {p.mic === false && (
                        <Chip size="small" icon={<MicOff />} sx={{ color: "#fff", bgcolor: "rgba(0,0,0,0.6)" }} />
                      )}
                    </Box>
                  </Box>
                </Grid>
              ))}
          </Grid>
        </Box>

        {/* Chat Panel */}
        {chatOpen && (
          <Box sx={{ width: 320, borderLeft: "1px solid #333", display: "flex", flexDirection: "column", bgcolor: "#1a1a2e", color: "#fff" }}>
            <Box sx={{ p: 2, borderBottom: "1px solid #333" }}>
              <Typography variant="subtitle1" fontWeight={700}>Chat</Typography>
            </Box>
            <Box sx={{ flex: 1, p: 2, overflowY: "auto" }}>
              {messages.map((m, i) => (
                <Box
                  key={i}
                  sx={{
                    mb: 1.5,
                    display: "flex",
                    justifyContent: m.senderId === socketRef.current?.id ? "flex-end" : "flex-start",
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: "80%",
                      bgcolor: m.senderId === socketRef.current?.id ? "#ff7a00" : "#2a2a3e",
                      color: "#fff",
                      p: 1,
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="caption" sx={{ opacity: 0.8, display: "block" }}>
                      {m.sender}
                    </Typography>
                    <Typography variant="body2">{m.message}</Typography>
                  </Box>
                </Box>
              ))}
              <div ref={chatEndRef} />
            </Box>
            <Box sx={{ p: 2, borderTop: "1px solid #333", display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                sx={{
                  input: { color: "#fff" },
                  "& .MuiOutlinedInput-root": { bgcolor: "#2a2a3e", borderRadius: 2 },
                }}
              />
              <IconButton color="primary" onClick={sendMessage}>
                <Send />
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>

      {/* Controls */}
      <Box sx={{ p: 2, display: "flex", justifyContent: "center", gap: 2, bgcolor: "#1a1a2e" }}>
        <IconButton
          onClick={toggleAudio}
          sx={{ bgcolor: audioOn ? "#2a2a3e" : "#d32f2f", color: "#fff", "&:hover": { bgcolor: audioOn ? "#333" : "#b71c1c" } }}
        >
          {audioOn ? <Mic /> : <MicOff />}
        </IconButton>
        <IconButton
          onClick={toggleVideo}
          sx={{ bgcolor: videoOn ? "#2a2a3e" : "#d32f2f", color: "#fff", "&:hover": { bgcolor: videoOn ? "#333" : "#b71c1c" } }}
        >
          {videoOn ? <Videocam /> : <VideocamOff />}
        </IconButton>
        <IconButton
          onClick={toggleScreenShare}
          sx={{ bgcolor: screenSharing ? "#ff7a00" : "#2a2a3e", color: "#fff", "&:hover": { bgcolor: screenSharing ? "#e66a00" : "#333" } }}
        >
          {screenSharing ? <StopScreenShare /> : <ScreenShare />}
        </IconButton>
        <IconButton onClick={leaveMeeting} sx={{ bgcolor: "#d32f2f", color: "#fff", "&:hover": { bgcolor: "#b71c1c" } }}>
          <CallEnd />
        </IconButton>
      </Box>
    </Box>
  );
}

