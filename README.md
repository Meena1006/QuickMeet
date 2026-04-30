# Real-Time Video Collaboration Platform with Attendance Analytics

A full-stack production-grade web application for real-time video meetings with live attendance tracking, host analytics dashboard, and post-meeting reports.

## Tech Stack

**Frontend:**
- React (CRA)
- React Router
- Material UI (MUI)
- Socket.IO Client
- WebRTC
- Context API

**Backend:**
- Node.js
- Express
- Socket.IO
- MongoDB + Mongoose
- JWT Authentication
- bcrypt

## Features

- **Authentication:** JWT-based login/register with persistent sessions
- **Meeting Management:** Create instant meetings with unique codes, join via code
- **Multi-user Video Calls:** WebRTC mesh peer-to-peer via Socket.IO signaling
- **Real-time Chat:** In-meeting messaging with sender alignment
- **Screen Sharing:** Share your screen with all participants
- **Host Dashboard:** Live participant monitoring with analytics (current count, peak, duration, mic/camera status)
- **Attendance Tracking:** Automatic join/leave time tracking with attendance percentage
- **Meeting History & Details:** Post-meeting reports with participant tables and average attendance
- **Invite Links:** Deep link support (`/?room=ROOM_ID`) — redirects to login if unauthenticated, then to the meeting
- **Responsive UI:** Zoom/Google Meet inspired dark-themed interface

## Project Structure

```
client/
  src/
    components/
      Navbar.jsx
      ProtectedRoute.jsx
    pages/
      Landing.jsx
      Login.jsx
      Register.jsx
      home.jsx
      VideoMeet.jsx
      MeetingDashboard.jsx
      MeetingDetails.jsx
      history.jsx
    contexts/
      AuthContext.js
    services/
      api.js
      socket.js
    App.js
server/
  src/
    controllers/
      user.controller.js
      meeting.controller.js
      socketManager.js
    models/
      user.model.js
      meeting.model.js
    routes/
      users.routes.js
      meetings.routes.js
    middleware/
      auth.middleware.js
    app.js
```

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster or local MongoDB

### 1. Clone & Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```


### 3. Run the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

The frontend runs on `http://localhost:3000` and the backend on `http://localhost:8000`.

## API Endpoints

### Users
- `POST /api/v1/users/register` — Register new user
- `POST /api/v1/users/login` — Login user
- `GET /api/v1/users/profile` — Get current user profile (protected)

### Meetings
- `POST /api/v1/meetings/create` — Create new meeting (protected)
- `GET /api/v1/meetings/my-meetings` — Get user's meeting history (protected)
- `GET /api/v1/meetings/validate/:meetingId` — Validate meeting code
- `GET /api/v1/meetings/attendance/:meetingId` — Get attendance report (protected)
- `GET /api/v1/meetings/:meetingId` — Get meeting details (protected)
- `POST /api/v1/meetings/end/:meetingId` — End meeting (host only, protected)

## Socket.IO Events

### Client → Server
- `join-call` — Join a meeting room
- `signal` — WebRTC signaling (offer/answer/ICE)
- `chat-message` — Send chat message
- `toggle-mic` — Update mic status
- `toggle-camera` — Update camera status
- `screen-share-start` / `screen-share-stop` — Screen sharing state
- `leave-call` — Leave meeting
- `end-meeting` — Host ends meeting
- `get-live-participants` — Request live participant list

### Server → Client
- `existing-users` — List of users already in room
- `user-joined` — New user joined
- `user-left` — User left
- `signal` — WebRTC signaling relay
- `chat-message` — New chat message
- `load-old-messages` — Chat history
- `participants-update` — Updated participant list with status
- `host-assigned` / `host-update` — Host socket ID updates
- `meeting-ended` — Meeting terminated by host

## Important Notes

- The backend uses MongoDB Atlas by default. Update `MONGO_URI` in `backend/.env` to use your own database.
- WebRTC requires HTTPS in production for camera/mic access on some browsers.
- Mesh topology is used for simplicity (each peer connects to every other peer). For large meetings (>6 people), consider an SFU like Mediasoup.

## License

MIT

