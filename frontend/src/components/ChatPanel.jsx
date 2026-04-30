import React, { useRef, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
} from "@mui/material";
import { Send } from "@mui/icons-material";

export default function ChatPanel({ messages, message, setMessage, sendMessage, socketId }) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Paper
      elevation={2}
      sx={{
        width: 320,
        borderLeft: "1px solid #333",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#1a1a2e",
        color: "#fff",
        height: "100%",
      }}
    >
      <Box sx={{ p: 2, borderBottom: "1px solid #333" }}>
        <Typography variant="subtitle1" fontWeight={700}>
          Chat
        </Typography>
      </Box>
      <Box sx={{ flex: 1, p: 2, overflowY: "auto" }}>
        {messages.map((m, i) => (
          <Box
            key={i}
            sx={{
              mb: 1.5,
              display: "flex",
              justifyContent: m.senderId === socketId ? "flex-end" : "flex-start",
            }}
          >
            <Box
              sx={{
                maxWidth: "80%",
                bgcolor: m.senderId === socketId ? "#ff7a00" : "#2a2a3e",
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
    </Paper>
  );
}

