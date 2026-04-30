import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
} from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    navigate("/");
    logout();
  };

  return (
    <AppBar position="static" sx={{ bgcolor: "#1a1a2e" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
<Typography
          variant="h6"
          sx={{ fontWeight: 700, cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          QuickMeet Pro
        </Typography>

        {user && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button color="inherit" onClick={() => navigate("/")}>
              Dashboard
            </Button>
            <Button color="inherit" onClick={() => navigate("/history")}>
              History
            </Button>

            <IconButton
              size="large"
              edge="end"
              color="inherit"
              onClick={handleMenu}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: "#ff7a00" }}>
                {user.name?.charAt(0)?.toUpperCase() || <AccountCircle />}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem disabled>{user.name}</MenuItem>
              <MenuItem disabled>{user.email}</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
