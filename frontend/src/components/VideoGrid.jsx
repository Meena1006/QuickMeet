import React from "react";
import { Box, Grid, Chip } from "@mui/material";
import { MicOff } from "@mui/icons-material";

export default function VideoGrid({ localVideoRef, localName, localAudioOn, participants, socketId }) {
  return (
    <Grid container spacing={2} justifyContent="center">
      {/* Local Video */}
      <Grid item xs={12} sm={participants.length === 0 ? 12 : 6} md={participants.length === 0 ? 12 : 4}>
        <Box
          sx={{
            position: "relative",
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: "#1a1a2e",
            aspectRatio: "16/9",
          }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <Box sx={{ position: "absolute", bottom: 8, left: 8, display: "flex", gap: 1 }}>
            <Chip
              size="small"
              label={`${localName} (You)`}
              sx={{ color: "#fff", bgcolor: "rgba(0,0,0,0.6)" }}
            />
            {!localAudioOn && (
              <Chip size="small" icon={<MicOff />} sx={{ color: "#fff", bgcolor: "rgba(0,0,0,0.6)" }} />
            )}
          </Box>
        </Box>
      </Grid>

      {/* Remote Videos */}
      {participants
        .filter((p) => p.socketId !== socketId)
        .map((p) => (
          <Grid item xs={12} sm={6} md={4} key={p.socketId}>
            <Box
              sx={{
                position: "relative",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#1a1a2e",
                aspectRatio: "16/9",
              }}
            >
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
  );
}

