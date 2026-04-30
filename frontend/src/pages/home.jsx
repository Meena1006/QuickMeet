import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  TextField,
  Typography,
  Stack,
  Chip,
} from "@mui/material";
import {
  VideoCall,
  Login,
  History,
  People,
  AccessTime,
} from "@mui/icons-material";
import { AuthContext } from "../contexts/AuthContext";
import api from "../services/api";
import Navbar from "../components/Navbar";

export default function Home() {
  const { user, getHistoryOfUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [meetings, setMeetings] = useState([]);
  const [stats, setStats] = useState({ total: 0, totalDuration: 0, totalParticipants: 0 });

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const data = await getHistoryOfUser();
      setMeetings(data || []);
      const total = data && data.length ? data.length : 0;
      const totalDuration = data && data.length ? data.reduce((sum, m) => sum + (m.duration || 0), 0) : 0;
      const totalParticipants = data && data.length ? data.reduce((sum, m) => sum + (m.participants && m.participants.length ? m.participants.length : 0), 0) : 0;
      setStats({ total, totalDuration, totalParticipants });
    } catch {
      // silent
    }
  };

  const createMeeting = async () => {
    try {
      const res = await api.post("/meetings/create", { title: user && user.name ? user.name + "'s Meeting" : "Meeting" });
      const meetingId = res.data.meeting.meetingId;
      navigate("/room/" + meetingId + "?host=true");
    } catch {
      alert("Failed to create meeting");
    }
  };

  const joinMeeting = () => {
    if (!code.trim()) return;
    navigate("/room/" + code.trim());
  };

  const formatDuration = (sec) => {
    if (!sec) return "0m";
    const m = Math.floor(sec / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return h + "h " + (m % 60) + "m";
    return m + "m";
  };

  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString();
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6f8" }}>
      <Navbar />
      <Container sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
          Welcome back, {user && user.name ? user.name : ""}
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <VideoCall sx={{ fontSize: 40, color: "#ff7a00" }} />
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{stats.total}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Meetings</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <AccessTime sx={{ fontSize: 40, color: "#ff7a00" }} />
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{formatDuration(stats.totalDuration)}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Time</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <People sx={{ fontSize: 40, color: "#ff7a00" }} />
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{stats.totalParticipants}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Participants</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, p: 2, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Start a Meeting
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<VideoCall />}
                  sx={{ bgcolor: "#ff7a00", fontWeight: 700, py: 1.5 }}
                  onClick={createMeeting}
                >
                  Create New Meeting
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, p: 2, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Join a Meeting
                </Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    placeholder="Enter meeting code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && joinMeeting()}
                  />
                  <Button
                    variant="contained"
                    startIcon={<Login />}
                    sx={{ bgcolor: "#1a1a2e", fontWeight: 700, px: 3 }}
                    onClick={joinMeeting}
                  >
                    Join
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <History sx={{ color: "#ff7a00" }} />
            <Typography variant="h5" fontWeight={700}>
              Meeting History
            </Typography>
          </Stack>
        </Box>

        {meetings.length === 0 ? (
          <Card sx={{ borderRadius: 3, p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">No meetings yet. Start your first meeting above!</Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {meetings.map((m) => (
              <Grid item xs={12} sm={6} md={4} key={m._id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: 2,
                    cursor: "pointer",
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-4px)" },
                  }}
                  onClick={() => navigate("/history/" + m.meetingId)}
                >
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>
                      {m.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      ID: {m.meetingId ? m.meetingId.slice(0, 8) : ""}...
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                      <Chip
                        size="small"
                        label={m.status}
                        color={m.status === "active" ? "success" : "default"}
                      />
                      <Chip size="small" icon={<AccessTime />} label={formatDuration(m.duration)} />
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <People fontSize="small" color="action" />
                      <Typography variant="body2">{(m.participants && m.participants.length) || 0} participants</Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(m.startedAt)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}

