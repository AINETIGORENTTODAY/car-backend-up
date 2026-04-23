import Booking from "../models/Booking.js";
import Driver from "../models/Driver.js";
import Otp from "../models/Otp.js";
import jwt from "jsonwebtoken";
import Vehicle from "../models/Vehicle.js";
import Agency from "../models/Agency.js";

export const verifyInviteKey = async (req, res) => {
  const { mobile, inviteKey } = req.body;

  if (!mobile || !inviteKey) {
    return res.status(400).json({
      message: "Mobile and invite key required",
    });
  }

  const driver = await Driver.findOne({ mobile, inviteKey });

  if (!driver) {
    return res.status(400).json({
      message: "Invalid invite key",
    });
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  await Otp.deleteMany({ mobile, role: "DRIVER" });

  await Otp.create({
    mobile,
    role: "DRIVER",
    otp,
    expiresAt: new Date(Date.now() + 5 * 60000),
  });

  console.log("DRIVER OTP:", otp);

  res.json({
    success: true,
    message: "OTP sent successfully",
  });
};

export const registerIndividualDriver = async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { name, mobile, experience } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({
        message: "Name and mobile required",
      });
    }

    let driver = await Driver.findOne({ mobile });

    const count = await Driver.countDocuments({
      agencyId: null,
    });

    const driverEmployeeId = `IND-${String(count + 1).padStart(4, "0")}`;

    if (!driver) {
      driver = await Driver.create({
        name,
        mobile,
        experience,
        driverEmployeeId,
        agencyId: null,
        agencyCode: null,
        status: "PENDING",
      });
    } else {
      driver.name = name;
      driver.experience = experience;
      await driver.save();
    }

    //  TOKEN GENERATE
    const token = jwt.sign(
      { id: driver._id, role: "DRIVER" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Driver profile saved",
      driverId: driver._id,
      driverEmployeeId,
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const startBooking = async (req, res) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (
    booking.status !== "DRIVER_ASSIGNED" ||
    booking.driverId.toString() !== req.user.id
  ) {
    return res.status(403).json({ message: "Not allowed" });
  }

  booking.status = "ONGOING";
  await booking.save();

  res.json({
    message: "Trip started",
    booking,
  });
};

export const completeBooking = async (req, res) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (
    booking.status !== "ONGOING" ||
    booking.driverId.toString() !== req.user.id
  ) {
    return res.status(403).json({ message: "Not allowed" });
  }

  booking.status = "COMPLETED";
  await booking.save();

  res.json({
    message: "Trip completed",
    booking,
  });
};

export const getDriverStats = async (req, res) => {
  try {
    const driverId = req.user.id;

    const totalTrips = await Booking.countDocuments({
      driverId,
    });

    const completedTrips = await Booking.countDocuments({
      driverId,
      status: "COMPLETED",
    });

    const cancelledTrips = await Booking.countDocuments({
      driverId,
      status: "CANCELLED",
    });

    const ongoingTrips = await Booking.countDocuments({
      driverId,
      status: { $in: ["DRIVER_ASSIGNED", "ONGOING"] },
    });

    res.json({
      totalTrips,
      completedTrips,
      cancelledTrips,
      ongoingTrips,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const checkDriver = async (req, res) => {
  const { mobile } = req.body;

  const driver = await Driver.findOne({ mobile });

  if (!driver) {
    return res.json({
      type: "INDIVIDUAL",
    });
  }

  if (driver.status === "INVITED") {
    return res.json({
      type: "INVITED",
    });
  }

  return res.json({
    type: "EXISTING",
  });
};

export const uploadDriverPhoto = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.id);
    if (!req.file) {
      return res.status(400).json({
        message: "Photo not uploaded",
      });
    }

    console.log("FILE:", req.file);

    const driverEmployeeId = driver.driverEmployeeId;

    driver.photoUpload = true;
    driver.photo = `/uploads/drivers/${driverEmployeeId}/photo.jpg`;

    await driver.save();

    res.json({
      valid: true,
      message: "Photo uploaded successfully",
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Upload failed",
    });
  }
};

export const dashboard = async (req, res) => {
  try {
    const driverId = req.use.id;

    const vehicles = await Vehicle.countDocuments({ driverId });
    const bookings = await Booking.countDocuments({ driverId });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayBookings = await Booking.find({
      driverId,
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    }).limit(5);

    res.json({
      vehicles,
      bookings,
      todayBookings,
    });
  } catch (error) {
    console.error("ERROR", err);
    res.status(500).json({ message: "Error" });
  }
};

export const checkVehicle = async (req, res) => {
  try {
    const { vehicleNumber } = req.body;
    const driver = await Driver.findById(req.user.id);

    if (!vehicleNumber) {
      return res.status(400).json({
        message: "Vehicle number required",
      });
    }
    let vehicle = await Vehicle.findOne({
      vehicleNumber: vehicleNumber,
    });

    if (vehicle && vehicle.driverId.toString() != driver._id.toString()) {
      return res.status(403).json({
        message: "This vehicle belongs to another agency or induvisal add",
      });
    }
    const vehicles = await Vehicle.findOne({ vehicleNumber });

    if (!vehicles) {
      return res.json({ exists: false });
    }

    return res.json({
      exists: true,
      isDetailsCompleted: vehicles.isDetailsCompleted,
      isDocumentsCompleted: vehicles.isDocumentsCompleted,
      vehicleId: vehicle._id,
    });
  } catch (err) {
    console.error("CHECK ERROR", err);
    res.status(500).json({ message: "Server error" });
  }
};
