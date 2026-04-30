import React, { useState, useContext } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
} from "@mui/material";
import { Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { handleRegister } = useContext(AuthContext);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await handleRegister(name, email, password);
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor: "#0f0f1a",
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "#1a1a2e",
          color: "#fff",
          p: 6,
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
          QuickMeet Pro
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.8 }}>
          Join the future of video collaboration
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 3,
        }}
      >
        <Paper elevation={6} sx={{ p: 5, width: "100%", maxWidth: 420, borderRadius: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, textAlign: "center" }}>
            Create Account
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={submit} sx={{ display: "grid", gap: 2.5 }}>
            <TextField
              label="Full Name"
              type="text"
              required
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Email"
              type="email"
              required
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              required
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{ bgcolor: "#ff7a00", fontWeight: 700, mt: 1 }}
            >
              Sign Up
            </Button>
          </Box>

          <Typography sx={{ mt: 3, textAlign: "center" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#ff7a00", fontWeight: 600 }}>
              Login
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}

