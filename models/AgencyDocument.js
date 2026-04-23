import mongoose from "mongoose";

const agencyDocumentSchema = new mongoose.Schema(
  {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
    },

    agencyCode: String,

    // ================= GST =================
    gst: {
      number: String,

      certificate: String,

      verified: {
        type: Boolean,
        default: false,
      },
      adminVerified: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING",
      },
      reason: String,
    },

    // ================= MSME =================
    msme: {
      certificate: String,

      verified: {
        type: Boolean,
        default: false,
      },

      adminVerified: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING",
      },

      reason: String,
    },

    // ================= COMPANY PAN =================
    companyPan: {
      number: String,

      image: String,

      verified: {
        type: Boolean,
        default: false,
      },

      adminVerified: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING",
      },

      reason: String,
    },

    // ================= OWNER AADHAAR =================
    ownerAadhaar: {
      maskedNumber: String,

      frontImage: String,
      backImage: String,

      frontVerified: {
        type: String,
        default: "PENDING",
      },
      backVerified: {
        type: String,
        default: "PENDING",
      },

      frontReason: String,
      backReason: String,

      verified: {
        type: Boolean,
        default: false,
      },

      adminVerified: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING",
      },

      reason: String,
    },
    shopPhoto: {
      image: String,

      verified: {
        type: Boolean,
        default: false,
      },

      adminVerified: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING",
      },

      reason: String,
    },

    // ownerPhoto: {
    //     image: String,

    //     verified: {
    //         type: Boolean,
    //         default: false
    //     },

    //     adminVerified: {
    //         type: String,
    //         enum: ["PENDING", "approved", "rejected"],
    //         default: "pending"
    //     },

    //     reason: String
    // }
  },
  { timestamps: true },
);

export default mongoose.model("AgencyDocument", agencyDocumentSchema);
