import { Router } from "express";
import {
  createMeeting,
  getMeetingById,
  validateMeeting,
  getMyMeetings,
  getAttendanceReport,
  endMeeting,
  getMeetingInfo,
} from "../controllers/meeting.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/create", protect, createMeeting);
router.get("/my-meetings", protect, getMyMeetings);
router.get("/validate/:meetingId", validateMeeting);
// Public endpoint for getting meeting info (used by dashboard)
router.get("/info/:meetingId", getMeetingInfo);
// Public endpoint for checking if meeting exists by ID
router.get("/check/:meetingId", validateMeeting);
router.get("/attendance/:meetingId", protect, getAttendanceReport);
router.get("/:meetingId", protect, getMeetingById);
router.post("/end/:meetingId", protect, endMeeting);

export default router;

