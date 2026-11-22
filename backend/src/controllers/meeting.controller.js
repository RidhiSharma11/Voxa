import crypto from "node:crypto";
import { Meeting } from "../models/meeting.model.js";
const creatingMeeting = async (req, res) => {
    try {
        const meetingCode = crypto.randomBytes(4)
            .toString("hex")
            .toUpperCase();

        const newMeeting = new Meeting({
            user_id: req.user.id,
            meetingCode: meetingCode,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        await newMeeting.save();

        res.status(201).json({
            meetingCode: meetingCode
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error creating meeting",
            error: error.message
        });
    }
};

const joiningMeeting = async(req,res)=>{
    try{
        const meetingCode = req.body.meetingCode?.trim();
        const meeting = await Meeting.findOne({
          meetingCode: meetingCode,
          expiresAt: { $gt: new Date() }
        });
        if (!meeting) {
            return res.status(404).json({
                message: "Meeting not found"
            });
        }
        meeting.participants.addToSet(req.user.id);
        await meeting.save();

        return res.status(200).json({
            message: "Meeting found",
            meetingCode: meeting.meetingCode
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error joining meeting",
            error: error.message
        });
    }
};

export { creatingMeeting, joiningMeeting };