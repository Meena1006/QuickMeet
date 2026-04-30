import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  CircularProgress,
} from "@mui/material";
import { AccessTime, People, Home } from "@mui/icons-material";
import { IconButton } from "@mui/material";

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getHistoryOfUser();
        setMeetings(data || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const formatDuration = (sec) => {
    if (!sec) return "0m";
    const m = Math.floor(sec / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m`;
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6f8" }}>
      <Navbar />
      <Container sx={{ py: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <IconButton onClick={() => navigate("/home")}>
            <Home />
          </IconButton>
          <Typography variant="h4" fontWeight={700}>
            Meeting History
          </Typography>
        </Stack>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : meetings.length === 0 ? (
          <Card sx={{ borderRadius: 3, p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">No meeting history found.</Typography>
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
                  onClick={() => navigate(`/history/${m.meetingId}`)}
                >
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>
                      {m.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Code: {m.meetingId?.slice(0, 12)}...
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
                      <Typography variant="body2">{m.participants?.length || 0} participants</Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
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

