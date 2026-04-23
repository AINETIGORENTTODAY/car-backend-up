import mongoose from "mongoose";

const driverDocumentSchema = new mongoose.Schema({

    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
        required: true
    },

    agencyCode: String,
    driverEmployeeId: String,


    drivingLicense: {
        number: String,
        expiryDate: Date,

        frontImage: String,
        backImage: String,
        frontVerified: {
            type: String,
            default: "pending" // approved / rejected / pending
        },
        backVerified: {
            type: String,
            default: "pending"
        },

        frontReason: String,
        backReason: String,

        verified: {
            type: Boolean,
            default: false
        },
        adminVerified: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },

        reason: String
    },

    aadhaar: {
        maskedNumber: String,

        frontImage: String,
        backImage: String,

        frontVerified: {
            type: String,
            default: "pending"
        },
        backVerified: {
            type: String,
            default: "pending"
        },

        frontReason: String,
        backReason: String,

        verified: {
            type: Boolean,
            default: false
        },
        adminVerified: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },

        reason: String
    },

    panCard: {
        number: String,

        image: String,

        verified: {
            type: Boolean,
            default: false
        },
        adminVerified: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },

        reason: String
    }

}, { timestamps: true });

export default mongoose.model("DriverDocument", driverDocumentSchema);