import mongoose from "mongoose";

const agencySchema = new mongoose.Schema({

    //  BASIC
    mobile: {
        type: String,
        required: true,
        unique: true
    },

    code: {
        type: String,
        unique: true
    },

    //  PROFILE
    name: {
        type: String
    },

    address: {
        type: String
    },

    city: {
        type: String
    },

    state: {
        type: String,
        default: "Gujarat"
    },

    pincode: {
        type: String
    },

    //  PROFILE STATUS
    profileCompleted: {
        type: Boolean,
        default: false
    },

    //  DOCUMENTS
    gstNumber: String,
    msmeCertificate: String,
    companyPan: String,
    ownerAadhar: String,
    ownerPhoto: String,

    documentsUploaded: {
        type: Boolean,
        default: false
    },

    //  STATUS FLOW
    status: {
        type: String,
        enum: ["INCOMPLETE", "PENDING", "APPROVED", "REJECTED", "BLOCKED"],
        default: "INCOMPLETE"
    },

    //  DRIVER SYSTEM
    driverCounter: {
        type: Number,
        default: 0
    },

}, { timestamps: true });

export default mongoose.model("Agency", agencySchema);