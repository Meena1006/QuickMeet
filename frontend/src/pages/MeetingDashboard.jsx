import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  Card,
  CardContent,
  Stack,
  CircularProgress,
} from "@mui/material";
import {
  People,
  TrendingUp,
  AccessTime,
  Login,
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
} from "@mui/icons-material";
import { getSocket } from "../services/socket";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

export default function MeetingDashboard() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [meetingStart, setMeetingStart] = useState(null);
  const [duration, setDuration] = useState(0);
  const [peakParticipants, setPeakParticipants] = useState(0);
  const [totalJoined, setTotalJoined] = useState(0);
  const [isHost, setIsHost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleUpdate = (users) => {
      setParticipants(users || []);
    };

    const joinRoom = () => {
      socket.emit("watch-room", { roomId });
    };

    socket.on("participants-update", handleUpdate);
    socket.on("connect", joinRoom);

    // Join immediately if already connected
    if (socket.connected) {
      joinRoom();
    }

    return () => {
      socket.off("participants-update", handleUpdate);
      socket.off("connect", joinRoom);
    };
  }, [roomId]);

  // Compute duration from first participant join or now
  useEffect(() => {
    if (participants.length > 0 && !meetingStart) {
      const earliest = new Date(Math.min(...participants.map((p) => new Date(p.joinedAt))));
      setMeetingStart(earliest);
    }
  }, [participants, meetingStart]);

  useEffect(() => {
    if (!meetingStart) return;
    const timer = setInterval(() => {
      setDuration(Math.floor((Date.now() - meetingStart) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [meetingStart]);

  useEffect(() => {
    if (participants.length > peakParticipants) {
      setPeakParticipants(participants.length);
    }
    // Total joined approximation via length + those who left (we don't have exact total from socket alone)
    setTotalJoined(Math.max(totalJoined, participants.length));
  }, [participants, peakParticipants, totalJoined]);

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

const presentDuration = (joinedAt) => {
    return Math.floor((Date.now() - new Date(joinedAt)) / 1000);
  };

// Check if current user is the host of this meeting
  useEffect(() => {
    const verifyHost = async () => {
      try {
        const res = await api.get("/meetings/" + roomId);
        const meeting = res.data;
        
        // Check if current user is the host (owner) of this meeting
        // Support both REST API created meetings (with hostId) and Socket.IO created meetings (hostId may be null)
        let isHostUser = false;
        
        if (meeting.hostId && user) {
          // Primary check: hostId is set (REST API created meeting)
          isHostUser = meeting.hostId.toString() === user._id.toString();
        } else if (meeting.hostName && user && user.name) {
          // Fallback check: Compare hostName for socket-created meetings
          // Also check if the meeting is still active (not ended)
          // Case-insensitive comparison to handle different casing
          isHostUser = meeting.hostName.toLowerCase().trim() === user.name.toLowerCase().trim() && 
                      meeting.status === "active";
        }
        
        // Debug logging for troubleshooting
        console.log("Host verification:", {
          meetingHostId: meeting.hostId,
          meetingHostName: meeting.hostName,
          userId: user?._id,
          userName: user?.name,
          meetingStatus: meeting.status,
          isHostUser
        });
        
        setIsHost(isHostUser);
        if (!isHostUser) {
          // Non-hosts get redirected to history page
          console.log("User is not host, redirecting to history");
          navigate("/history");
        }
      } catch (err) {
        console.error("Error verifying host:", err);
        // In case of API error, we'll show an error state but allow retry
        // This handles temporary network issues
        setIsHost(false);
      } finally {
        setLoading(false);
      }
    };
    verifyHost();
  }, [roomId, user, navigate]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isHost) {
    return null;
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6f8" }}>
      <Container sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
          Host Live Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Meeting ID: {roomId}
        </Typography>

        {/* Analytics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <People sx={{ fontSize: 36, color: "#ff7a00" }} />
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{participants.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Current Participants</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Login sx={{ fontSize: 36, color: "#ff7a00" }} />
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{totalJoined}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Joined</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <AccessTime sx={{ fontSize: 36, color: "#ff7a00" }} />
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{formatTime(duration)}</Typography>
                    <Typography variant="body2" color="text.secondary">Meeting Duration</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <TrendingUp sx={{ fontSize: 36, color: "#ff7a00" }} />
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{peakParticipants}</Typography>
                    <Typography variant="body2" color="text.secondary">Peak Participants</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Participants Table */}
        <Paper elevation={2} sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Box sx={{ p: 2, bgcolor: "#1a1a2e", color: "#fff" }}>
            <Typography variant="h6" fontWeight={700}>
              Live Participants
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f4f6f8" }}>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Joined At</strong></TableCell>
                  <TableCell><strong>Present For</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Mic</strong></TableCell>
                  <TableCell><strong>Camera</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {participants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No participants yet
                    </TableCell>
                  </TableRow>
                )}
                {participants.map((p) => (
                  <TableRow key={p.socketId} hover>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{new Date(p.joinedAt).toLocaleTimeString()}</TableCell>
                    <TableCell>{formatTime(presentDuration(p.joinedAt))}</TableCell>
                    <TableCell>
                      <Chip size="small" label="Active" color="success" />
                    </TableCell>
                    <TableCell>
                      {p.mic !== false ? <Mic fontSize="small" color="success" /> : <MicOff fontSize="small" color="error" />}
                    </TableCell>
                    <TableCell>
                      {p.camera !== false ? <Videocam fontSize="small" color="success" /> : <VideocamOff fontSize="small" color="error" />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </Box>
  );
}

