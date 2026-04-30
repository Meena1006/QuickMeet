import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import LandingPage from "./pages/landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/home";
import History from "./pages/history";
import VideoMeet from "./pages/VideoMeet";
import MeetingDashboard from "./pages/MeetingDashboard";
import MeetingDetails from "./pages/MeetingDetails";

function InviteRedirect() {
  const { user } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const room = params.get("room");

  if (room) {
    if (user) {
      return <Navigate to={`/room/${room}`} replace />;
    } else {
      return <Navigate to={`/login?redirect=/room/${room}`} replace />;
    }
  }
  return <LandingPage />;
}

function LoginRedirect() {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  return <Login redirectTo={redirect} />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<InviteRedirect />} />
          <Route path="/login" element={<LoginRedirect />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth" element={<Navigate to="/login" replace />} />

          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history/:meetingId"
            element={
              <ProtectedRoute>
                <MeetingDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/room/:roomId"
            element={
              <ProtectedRoute>
                <VideoMeet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/:roomId"
            element={
              <ProtectedRoute>
                <MeetingDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meeting/:roomId"
            element={
              <ProtectedRoute>
                <MeetingDetails />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

