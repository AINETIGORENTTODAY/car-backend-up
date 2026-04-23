import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Agency from "../models/Agency.js";
import Driver from "../models/Driver.js";
import DriverDocument from "../models/DriverDocument.js";
import AgencyDocument from "../models/AgencyDocument.js";
export const createAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email & password required",
      });
    }

    // already exist check
    const existing = await Admin.findOne({ email });

    if (existing) {
      return res.status(400).json({
        message: "Admin already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      email,
      password: hashedPassword,
    });

    res.json({
      message: "Admin created successfully",
      adminId: admin._id,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error creating admin",
    });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({
        message: "Admin not found",
      });
    }

    //  PASSWORD CHECK
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    //  TOKEN
    const token = jwt.sign(
      { id: admin._id, role: "ADMIN" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      role: "ADMIN",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};

export const updateDocumentStatus = async (req, res) => {
  try {
    const { driverId, type, side, status, reason } = req.body;

    const doc = await DriverDocument.findOne({ driverId });

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    //  PAN CARD

    if (type === "panCard") {
      doc.panCard.adminVerified = status;

      //  ADD THIS

      if (status === "rejected") {
        doc.panCard.verified = false;
        doc.panCard.reason = reason || "Invalid PAN";
      } else if (status === "approved") {
        doc.panCard.verified = true;
        doc.panCard.reason = "";
      }
    }

    //  DL / AADHAAR (front/back)
    else {
      if (!side) {
        return res.status(400).json({
          message: "Side required (front/back)",
        });
      }

      doc[type][`${side}Verified`] = status;

      if (status === "rejected") {
        doc[type][`${side}Reason`] = reason || "Invalid document";
      } else {
        doc[type][`${side}Reason`] = "";
      }

      const front = doc[type].frontVerified;
      const back = doc[type].backVerified;

      //  BOTH APPROVED
      if (front === "approved" && back === "approved") {
        doc[type].adminVerified = "approved";
        doc[type].verified = true;
        doc[type].reason = "";
      }

      //  ANY REJECTED
      else if (front === "rejected" || back === "rejected") {
        doc[type].adminVerified = "rejected";
        doc[type].verified = false;
        doc[type].reason =
          doc[type].frontReason || doc[type].backReason || "Rejected";
      }

      // OTHERWISE PENDING
      else {
        doc[type].adminVerified = "pending";
      }
    }

    await doc.save();

    return res.json({
      message: `${type} ${side || ""} ${status} successfully`,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error updating document" });
  }
};

export const updatePhotoStatus = async (req, res) => {
  try {
    const { driverId, status, reason } = req.body;

    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    driver.photoStatus = status;

    if (status === "rejected") {
      driver.photoReason = reason || "Face not clear";
    } else {
      driver.photoReason = "";
    }
    driver.photoVerified = true;
    await driver.save();

    res.json({
      message: `Photo ${status} successfully`,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error updating photo" });
  }
};

export const getPendingDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find();

    const result = [];

    for (let driver of drivers) {
      const docs = await DriverDocument.findOne({
        driverId: driver._id,
      });

      // SKIP if no photo AND no docs
      if (!driver.photo && !docs) continue;

      result.push({
        driverId: driver._id,
        name: driver.name,

        photo: driver.photo,
        photoStatus: driver.photoStatus,

        dlFront: docs?.drivingLicense?.frontImage,
        dlBack: docs?.drivingLicense?.backImage,
        dlStatus: docs?.drivingLicense?.adminVerified,

        aadhaarFront: docs?.aadhaar?.frontImage,
        aadhaarBack: docs?.aadhaar?.backImage,
        aadhaarStatus: docs?.aadhaar?.adminVerified,

        pan: docs?.panCard?.image,
        panStatus: docs?.panCard?.adminVerified,
      });
    }

    res.json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error" });
  }
};

// ========================= AGENCY DOCUMENTS (ADMIN) =========================

export const verifyAgencyDocument = async (req, res) => {
  try {
    const { agencyId, type, status, reason } = req.body;

    // validation
    if (!agencyId || !type || !status) {
      return res.status(400).json({
        message: "agencyId, type, status required",
      });
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const doc = await AgencyDocument.findOne({ agencyId });

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    // SWITCH LOGIC
    switch (type) {
      case "gst":
        doc.gst.adminVerified = status;
        doc.gst.reason = reason || "";
        break;

      case "msme":
        doc.msme.adminVerified = status;
        doc.msme.reason = reason || "";
        break;

      case "pan":
        doc.companyPan.adminVerified = status;
        doc.companyPan.reason = reason || "";
        break;

      case "aadhar":
        doc.ownerAadhaar.adminVerified = status;
        doc.ownerAadhaar.frontVerified = status;
        doc.ownerAadhaar.backVerified = status;
        doc.ownerAadhaar.reason = reason || "";
        break;

      case "shop":
        doc.shopPhoto.adminVerified = status;
        doc.shopPhoto.reason = reason || "";
        break;

      default:
        return res.status(400).json({ message: "Invalid type" });
    }

    await doc.save();

    // CHECK ALL APPROVED

    const allApproved =
      doc.gst?.adminVerified === "APPROVED" &&
      doc.msme?.adminVerified === "APPROVED" &&
      doc.companyPan?.adminVerified === "APPROVED" &&
      doc.ownerAadhaar?.adminVerified === "APPROVED" &&
      doc.shopPhoto?.adminVerified === "APPROVED";

    if (allApproved) {
      await Agency.findByIdAndUpdate(agencyId, {
        status: "APPROVED",
      });
    }

    return res.json({
      message: `Document ${status} successfully`,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// export const verifyAgencyDocument = async (req, res) => {
//   try {
//     const { agencyId, type, side, status, reason } = req.body;

//     // validation
//     if (!agencyId || !type || !status) {
//       return res.status(400).json({
//         message: "agencyId, type, status required",
//       });
//     }

//     if (!["APPROVED", "REJECTED"].includes(status)) {
//       return res.status(400).json({
//         message: "Invalid status",
//       });
//     }

//     const doc = await AgencyDocument.findOne({ agencyId });

//     if (!doc) {
//       return res.status(404).json({ message: "Document not found" });
//     }

//     if (type === "companyPan") {
//       doc.companyPan.adminVerified = status;

//       //  ADD THIS

//       if (status === "REJECTED") {
//         doc.companyPan.verified = false;
//         doc.companyPan.reason = reason || "Invalid PAN";
//       } else if (status === "APPROVED") {
//         doc.companyPan.verified = true;
//         doc.companyPan.reason = "";
//       }
//     } else if (type === "shopPhoto") {
//       doc.shopPhoto.adminVerified = status;

//       if (status === "REJECTED") {
//         doc.shopPhoto.verified = false;
//         doc.shopPhoto.reason = reason || "Invalid Shop Photo";
//       } else if (status === "APPROVED") {
//         doc.shopPhoto.verified = true;
//         doc.shopPhoto.reason = "";
//       }
//     } else {
//       if (!side) {
//         return res.status(400).json({
//           message: "Side required (front/back)",
//         });
//       }

//       doc[type][`${side}Verified`] = status;

//       if (status === "REJECTED") {
//         doc[type][`${side}Reason`] = reason || "Invalid document";
//       } else {
//         doc[type][`${side}Reason`] = "";
//       }

//       const front = doc[type].frontVerified;
//       const back = doc[type].backVerified;

//       if (front === "APPROVED" && back === "APPROVED") {
//         doc[type].adminVerified = "APPROVED";
//         doc[type].verified = true;
//         doc[type].reason = "";
//       } else if (front === "REJECTED" || back === "REJECTED") {
//         doc[type].adminVerified = "REJECTED";
//         doc[type].verified = false;
//         doc[type].reason =
//           doc[type].frontReason || doc[type].backReason || "REJECTED";
//       } else {
//         doc[type].adminVerified = "PENDING";
//       }
//     }

//     await doc.save();

//     return res.json({
//       message: `${type} ${side || ""} ${status} successfully`,
//     });

//     const allApproved =
//       doc.gst?.adminVerified === "APPROVED" &&
//       doc.msme?.adminVerified === "APPROVED" &&
//       doc.companyPan?.adminVerified === "APPROVED" &&
//       doc.ownerAadhaar?.adminVerified === "APPROVED" &&
//       doc.shopPhoto?.adminVerified === "APPROVED";

//     if (allApproved) {
//       await Agency.findByIdAndUpdate(agencyId, {
//         status: "APPROVED",
//       });
//     }

//     return res.json({
//       message: `Document ${status} successfully`,
//     });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const getAgenciesForAdmin = async (req, res) => {
  try {
    const agencies = await AgencyDocument.aggregate([
      {
        $lookup: {
          from: "agencies",
          localField: "agencyId",
          foreignField: "_id",
          as: "agency",
        },
      },

      { $unwind: "$agency" },

      {
        $project: {
          agencyId: 1,
          agencyCode: 1,

          name: "$agency.name",
          mobile: "$agency.mobile",
          city: "$agency.city",
          status: "$agency.status",

          gstStatus: "$gst.adminVerified",
          msmeStatus: "$msme.adminVerified",
          panStatus: "$companyPan.adminVerified",
          aadharStatus: "$ownerAadhaar.adminVerified",
          shopStatus: "$shopPhoto.adminVerified",

          createdAt: 1,
        },
      },

      { $sort: { createdAt: -1 } },
    ]);

    res.json(agencies);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed" });
  }
};

export const getAgenciesWithDocs = async (req, res) => {
  try {
    const agencies = await AgencyDocument.aggregate([
      // JOIN AGENCY DATA
      {
        $lookup: {
          from: "agencies",
          localField: "agencyId",
          foreignField: "_id",
          as: "agency",
        },
      },

      {
        $unwind: "$agency",
      },

      // ONLY those who uploaded docs
      {
        $match: {
          "agency.documentsUploaded": true,
        },
      },

      {
        $project: {
          //  AGENCY INFO
          agencyId: 1,
          agencyCode: 1,

          name: "$agency.name",
          mobile: "$agency.mobile",
          city: "$agency.city",
          status: "$agency.status",

          //  DOC STATUS
          gstStatus: "$gst.adminVerified",
          msmeStatus: "$msme.adminVerified",
          panStatus: "$companyPan.adminVerified",
          aadharStatus: "$ownerAadhaar.adminVerified",
          shopStatus: "$shopPhoto.adminVerified",

          createdAt: 1,
        },
      },

      {
        $sort: { createdAt: -1 },
      },
    ]);

    return res.json(agencies);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed" });
  }
};
