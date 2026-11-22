import { Router } from "express";
import { creatingMeeting,joiningMeeting } from "../controllers/meeting.controller.js";
import authMiddleware from "../auth.middleware.js";

const router = Router();

router.post("/create", authMiddleware, creatingMeeting);
router.post("/join", authMiddleware, joiningMeeting);
export default router;