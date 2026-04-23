import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    mobile: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["AGENCY", "DRIVER", "PASSENGER", "ADMIN"],
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, { timestamps: true });

export default mongoose.model("Otp", otpSchema);