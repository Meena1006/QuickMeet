import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Container, Typography, Box, Stack } from "@mui/material";
import { VideoCall, Security, Speed } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import "../App.css";

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/home", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="landingPageContainer">
      <nav>
        <div className="navHeader">
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#fff" }}>
            QuickMeet Pro
          </Typography>
        </div>
        <div className="navlist">
          <Button
            variant="outlined"
            sx={{ color: "#fff", borderColor: "#fff", textTransform: "none" }}
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: "#ff7a00", textTransform: "none" }}
            onClick={() => navigate("/register")}
          >
            Register
          </Button>
        </div>
      </nav>

      <Container sx={{ mt: 8, color: "#fff" }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={6} alignItems="center">
          <Box flex={1}>
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 2 }}>
              <span style={{ color: "#ff7a00" }}>Connect</span> with anyone, anywhere
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Real-time video collaboration with live attendance analytics, screen sharing, and secure meetings.
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 6 }}>
              <Button
                variant="contained"
                size="large"
                sx={{ bgcolor: "#ff7a00", fontWeight: 700, px: 4 }}
                onClick={() => navigate("/register")}
              >
                Get Started
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{ color: "#fff", borderColor: "#fff", px: 4 }}
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
            </Stack>

            <Stack direction="row" spacing={4}>
              <Box textAlign="center">
                <VideoCall sx={{ fontSize: 40, color: "#ff7a00" }} />
                <Typography variant="body2">HD Video</Typography>
              </Box>
              <Box textAlign="center">
                <Security sx={{ fontSize: 40, color: "#ff7a00" }} />
                <Typography variant="body2">Secure</Typography>
              </Box>
              <Box textAlign="center">
                <Speed sx={{ fontSize: 40, color: "#ff7a00" }} />
                <Typography variant="body2">Low Latency</Typography>
              </Box>
            </Stack>
          </Box>

          <Box flex={1} display={{ xs: "none", md: "block" }}>
            <img src="/mobile.png" alt="QuickMeet" style={{ width: "100%", maxWidth: 400 }} />
          </Box>
        </Stack>
      </Container>
    </div>
  );
}

