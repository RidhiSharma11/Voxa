import mongoose, { Schema } from "mongoose";
const meetingSchema = new Schema(
    {
        user_id: {
            type: String
        },

        meetingCode: {
            type: String,
            required: true
        },

        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        date: {
            type: Date,
            default: Date.now,
            required: true
        },

        expiresAt: {
            type: Date,
            required: true
        }
    }
);

const Meeting = mongoose.model("Meeting", meetingSchema);

export { Meeting };
