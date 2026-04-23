import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: false,
    },
    agencyCode: {
      type: String,
      default: null,
    },

    name: String,
    mobile: {
      type: String,
      required: true,
      unique: true,
    },
    experience: Number,

    driverEmployeeId: {
      type: String,
      unique: true,
      required: true,
    },

    photo: {
      type: String,
    },
    photoStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    photoUpload: {
      type: Boolean,
      default: false,
    },

    photoVerified: {
      type: Boolean,
      default: false,
    },
    photoReason: {
      reason: String,
    },
    inviteKey: {
      type: String,
      sparse: true,
    },
    inviteUsed: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["INVITED", "PENDING", "ACTIVE", "BLOCKED"],
      default: "INVITED",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Driver", driverSchema);
