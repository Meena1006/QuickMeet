import httpStatus from "http-status";
import { Meeting } from "../models/meeting.model.js";
import { User } from "../models/user.model.js";
import { v4 as uuidv4 } from "uuid";

const createMeeting = async (req, res) => {
  try {
    const { title } = req.body;
    const user = req.user;

    const meetingId = uuidv4();

    const meeting = new Meeting({
      meetingId,
      title: title || "Untitled Meeting",
      hostId: user._id,
      hostName: user.name,
      status: "active",
      startedAt: new Date(),
      participants: [],
      chat: [],
    });

    await meeting.save();

    res.status(httpStatus.CREATED).json({
      message: "Meeting created",
      meeting: {
        meetingId: meeting.meetingId,
        title: meeting.title,
        hostName: meeting.hostName,
        status: meeting.status,
        startedAt: meeting.startedAt,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const getMeetingById = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "Meeting not found" });
    }

    res.json(meeting);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const validateMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return res.json({ valid: false, message: "Meeting does not exist" });
    }

    if (meeting.status === "completed") {
      return res.json({ valid: false, message: "Meeting has ended" });
    }

    res.json({ valid: true, meeting });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const getMyMeetings = async (req, res) => {
  try {
    const userId = req.user._id;
    const meetings = await Meeting.find({
      $or: [
        { hostId: userId },
        { "participants.userId": userId },
        { "participants.name": req.user.name },
      ],
    }).sort({ createdAt: -1 });

    res.json(meetings);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const getAttendanceReport = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "Meeting not found" });
    }

    // Check if current user is the host (owner) of this meeting
    const isHost = meeting.hostId && req.user && meeting.hostId.toString() === req.user._id.toString();

    const totalDuration = meeting.duration || Math.floor((new Date() - meeting.startedAt) / 1000);

    // If host, return full attendance report with all participant details
    if (isHost) {
      const report = meeting.participants.map((p) => {
        const presence = p.duration || 0;
        const percent = totalDuration > 0 ? Math.round((presence / totalDuration) * 100) : 0;
        
        return {
          name: p.name,
          email: p.email,
          joinedAt: p.joinedAt,
          leftAt: p.leftAt,
          duration: presence,
          attendancePercent: percent,
        };
      });

      const avgAttendance =
        report.length > 0
          ? Math.round(report.reduce((sum, r) => sum + r.attendancePercent, 0) / report.length)
          : 0;

      return res.json({
        meetingId: meeting.meetingId,
        title: meeting.title,
        hostName: meeting.hostName,
        startedAt: meeting.startedAt,
        endedAt: meeting.endedAt,
        duration: totalDuration,
        peakParticipants: meeting.peakParticipants,
        totalJoined: meeting.totalJoined,
        averageAttendance: avgAttendance,
        isHost: isHost,
        participants: report,
      });
    }

    // For participants, return basic meeting info only (no participant details)
    res.json({
      meetingId: meeting.meetingId,
      title: meeting.title,
      hostName: meeting.hostName,
      startedAt: meeting.startedAt,
      endedAt: meeting.endedAt,
      duration: totalDuration,
      peakParticipants: meeting.peakParticipants,
      totalJoined: meeting.totalJoined,
      averageAttendance: 0,
      isHost: isHost,
      participants: [],
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const endMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "Meeting not found" });
    }

    if (meeting.hostId && meeting.hostId.toString() !== req.user._id.toString()) {
      return res.status(httpStatus.FORBIDDEN).json({ message: "Only host can end the meeting" });
    }

    const now = new Date();
    const duration = Math.floor((now - meeting.startedAt) / 1000);

    // Finalize all participants durations
    meeting.participants.forEach((p) => {
      if (!p.leftAt) {
        p.leftAt = now;
        const joined = new Date(p.joinedAt);
        p.duration = Math.floor((now - joined) / 1000);
        p.attendancePercent = duration > 0 ? Math.round((p.duration / duration) * 100) : 0;
      }
    });

    meeting.status = "completed";
    meeting.endedAt = now;
    meeting.duration = duration;
    await meeting.save();

res.json({ message: "Meeting ended", meeting });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Public endpoint for getting meeting info without auth - used by host dashboard
const getMeetingInfo = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return res.status(httpStatus.NOT_FOUND).json({ 
        valid: false, 
        message: "Meeting not found",
        meetingId 
      });
    }

    res.json({
      valid: true,
      meetingId: meeting.meetingId,
      title: meeting.title,
      status: meeting.status,
      hostId: meeting.hostId,
      hostName: meeting.hostName,
      startedAt: meeting.startedAt,
      peakParticipants: meeting.peakParticipants,
      totalJoined: meeting.totalJoined,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export {
  createMeeting,
  getMeetingById,
  validateMeeting,
  getMyMeetings,
  getAttendanceReport,
  endMeeting,
  getMeetingInfo,
};

