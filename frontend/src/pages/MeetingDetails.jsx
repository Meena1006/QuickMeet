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
  Button,
  CircularProgress,
} from "@mui/material";
import {
  People,
  TrendingUp,
  AccessTime,
  CalendarToday,
  Person,
  ArrowBack,
} from "@mui/icons-material";
import api from "../services/api";
import Navbar from "../components/Navbar";

export default function MeetingDetails() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (meetingId) fetchReport();
  }, [meetingId]);

const fetchReport = async () => {
    try {
      const res = await api.get("/meetings/attendance/" + meetingId);
      setReport(res.data);
    } catch (error) {
      alert("Failed to load meeting details");
      navigate("/home");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (sec) => {
    if (!sec) return "0s";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return h + "h " + m + "m " + s + "s";
    if (m > 0) return m + "m " + s + "s";
    return s + "s";
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleString();
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!report) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Typography>Meeting not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6f8" }}>
      <Navbar />
      <Container sx={{ py: 4 }}>
        <Button startIcon={<ArrowBack />} sx={{ mb: 2 }} onClick={() => navigate("/home")}>
          Back to Dashboard
        </Button>

        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
          Meeting Details
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {report.title} &bull; {report.meetingId}
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <CalendarToday sx={{ fontSize: 36, color: "#ff7a00" }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Start Time</Typography>
                    <Typography variant="subtitle2" fontWeight={700}>{formatDate(report.startedAt)}</Typography>
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
                    <Typography variant="body2" color="text.secondary">Duration</Typography>
                    <Typography variant="h6" fontWeight={700}>{formatDuration(report.duration)}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Person sx={{ fontSize: 36, color: "#ff7a00" }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Host</Typography>
                    <Typography variant="h6" fontWeight={700}>{report.hostName || "N/A"}</Typography>
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
                    <Typography variant="body2" color="text.secondary">Avg Attendance</Typography>
                    <Typography variant="h6" fontWeight={700}>{report.averageAttendance}%</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <People sx={{ fontSize: 40, color: "#ff7a00" }} />
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{report.peakParticipants}</Typography>
                    <Typography variant="body2" color="text.secondary">Peak Participants</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <People sx={{ fontSize: 40, color: "#ff7a00" }} />
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{report.totalJoined}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Joined</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

<Paper elevation={2} sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Box sx={{ p: 2, bgcolor: "#1a1a2e", color: "#fff" }}>
            <Typography variant="h6" fontWeight={700}>
              Attendance Report
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f4f6f8" }}>
                  <TableCell><strong>Name</strong></TableCell>
                  {report.isHost && <TableCell><strong>Email</strong></TableCell>}
                  <TableCell><strong>Joined At</strong></TableCell>
                  <TableCell><strong>Left At</strong></TableCell>
                  <TableCell><strong>Time Present</strong></TableCell>
                  <TableCell><strong>Attendance %</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.participants && report.participants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={report.isHost ? 6 : 5} align="center">
                      No participant data
                    </TableCell>
                  </TableRow>
                )}
                {report.participants && report.participants.map((p, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>{p.name}</TableCell>
                    {report.isHost && <TableCell>{p.email || "N/A"}</TableCell>}
                    <TableCell>{formatDate(p.joinedAt)}</TableCell>
                    <TableCell>{p.leftAt ? formatDate(p.leftAt) : "\u2014"}</TableCell>
                    <TableCell>{formatDuration(p.duration)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={p.attendancePercent + "%"}
                        color={p.attendancePercent >= 80 ? "success" : p.attendancePercent >= 50 ? "warning" : "error"}
                      />
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
