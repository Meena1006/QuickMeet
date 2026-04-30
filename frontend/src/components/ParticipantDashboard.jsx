import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Typography,
} from "@mui/material";
import { Mic, MicOff, Videocam, VideocamOff } from "@mui/icons-material";
import { getSocket } from "../services/socket";

export default function ParticipantDashboard() {
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit("get-live-participants", (data) => {
      setParticipants(data || []);
    });

    socket.on("participants-update", (users) => {
      setParticipants(users || []);
    });

    return () => {
      socket.off("participants-update");
    };
  }, []);

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const presentDuration = (joinedAt) => {
    return Math.floor((Date.now() - new Date(joinedAt)) / 1000);
  };

  return (
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
                  {p.mic !== false ? (
                    <Mic fontSize="small" color="success" />
                  ) : (
                    <MicOff fontSize="small" color="error" />
                  )}
                </TableCell>
                <TableCell>
                  {p.camera !== false ? (
                    <Videocam fontSize="small" color="success" />
                  ) : (
                    <VideocamOff fontSize="small" color="error" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

