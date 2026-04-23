import jwt from "jsonwebtoken";
import Otp from "../models/Otp.js";
import Agency from "../models/Agency.js";
import Driver from "../models/Driver.js";
import Passenger from "../models/Passenger.js";
import { generateAgencyCode } from "../utils/generateAgencyCode.js";
import DriverDocument from "../models/DriverDocument.js";

export const sendOtp = async (req, res) => {
  const { mobile, role } = req.body;

  if (!mobile || !role) {
    return res.status(400).json({ message: "Mobile & role required" });
  }

  // MOBILE VALIDATION
  if (!/^[6-9][0-9]{9}$/.test(mobile)) {
    return res.status(400).json({
      message: "Invalid mobile number",
    });
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  await Otp.deleteMany({ mobile, role });

  await Otp.create({
    mobile,
    role,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  // SMS integration yahin aayega
  console.log(`OTP (${role}):`, otp);

  res.json({ success: true });
};

export const verifyOtp = async (req, res) => {
  const { mobile, otp, role } = req.body;

  const record = await Otp.findOne({ mobile, otp, role });

  if (!record || record.expiresAt < new Date()) {
    return res.status(400).json({
      message: "Invalid or expired OTP",
    });
  }

  let user;

  // ---------------- AGENCY ----------------

  if (role === "AGENCY") {
    user = await Agency.findOne({ mobile });

    // New Agency
    if (!user) {
      return res.json({
        isNewAgency: true,
      });
    }

    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      token,
      role,
      userId: user._id,

      profileCompleted: user.profileCompleted || false,
      documentsUploaded: user.documentsUploaded || false,
      status: user.status || "INCOMPLETE",
    });
  }

  // _____________ADMIN________________

  // ---------------- DRIVER ----------------
  if (role === "DRIVER") {
    user = await Driver.findOne({ mobile });

    if (!user) {
      return res.json({
        newDriver: true,
      });
    }

    if (user.status === "BLOCKED") {
      return res.status(403).json({
        message: "Driver blocked",
      });
    }

    // Agency invite accept
    if (user.status === "INVITED") {
      user.status = "PENDING";
      user.inviteUsed = true;
      user.inviteKey = undefined;

      await user.save();
    }

    // PHOTO CHECK
    const photoUploaded = user.photoUpload;

    // DOCUMENT CHECK
    const docs = await DriverDocument.findOne({
      driverId: user._id,
    });

    const documentsUploaded = !!docs;

    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      token,
      role,
      userId: user._id,
      status: user.status,
      photoUploaded,
      documentsUploaded,
    });
  }

  // ---------------- PASSENGER ----------------
  if (role === "PASSENGER") {
    user = await Passenger.findOne({ mobile });

    if (!user) {
      user = await Passenger.create({ mobile });
    }
  }

  // ---------------- TOKEN ----------------
  const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({
    token,
    role,
    userId: user._id,
    status: user?.status,
  });
};
