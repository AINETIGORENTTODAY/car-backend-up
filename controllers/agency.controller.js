import Agency from "../models/Agency.js";
import Driver from "../models/Driver.js";

import Vehicle from "../models/Vehicle.js";
import Booking from "../models/Booking.js";

import jwt from "jsonwebtoken";
import crypto from "crypto";
import { generateAgencyCode } from "../utils/generateAgencyCode.js";
import AgencyDocument from "../models/AgencyDocument.js";

export const registerAgency = async (req, res) => {
  try {
    const { mobile, name, address, location } = req.body;

    const existing = await Agency.findOne({ mobile });

    if (existing) {
      return res.status(400).json({
        message: "Agency already exists",
      });
    }

    const code = await generateAgencyCode("AGENCY");

    const agency = await Agency.create({
      mobile,
      name,
      address,
      city: location,
      state: "Gujarat",
      profileCompleted: true,
      status: "INCOMPLETE",
      code,
    });

    const token = jwt.sign(
      { id: agency._id, role: "AGENCY" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      agencyId: agency._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Registration failed",
    });
  }
};

export const addDriver = async (req, res) => {
  try {
    const { name, mobile, experience } = req.body;

    const agency = await Agency.findById(req.user.id);
    if (!agency) {
      return res.status(404).json({
        message: "Agency not found",
      });
    }

    const exists = await Driver.findOne({ mobile });

    if (exists) {
      return res.status(409).json({
        message: "Driver already exists",
      });
    }

    agency.driverCounter += 1;
    await agency.save();

    const driverEmployeeId = `${agency.code}-DR-${String(
      agency.driverCounter,
    ).padStart(3, "0")}`;

    const inviteKey = crypto.randomBytes(3).toString("hex").toUpperCase();

    await Driver.create({
      agencyId: agency._id,
      agencyCode: agency.code,
      name,
      mobile,
      experience,
      driverEmployeeId,
      inviteKey,
      status: "INVITED",
    });

    res.status(201).json({
      message: "Driver invited successfully",
      driverEmployeeId,
      inviteKey,
      name,
      mobile,
      experience,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({
      agencyId: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(drivers);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching drivers",
    });
  }
};

export const assignDriver = async (req, res) => {
  try {
    const { bookingId, driverId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (booking.status !== "CREATED") {
      return res.status(400).json({
        message: "Booking not assignable",
      });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    if (driver.agencyId.toString() !== booking.agencyId.toString()) {
      return res.status(400).json({
        message: "Driver does not belong to this agency",
      });
    }

    booking.driverId = driver._id;
    booking.driverEmployeeId = driver.driverEmployeeId;
    booking.status = "DRIVER_ASSIGNED";

    await booking.save();

    res.json({
      message: "Driver assigned successfully",
      booking,
    });
  } catch (err) {
    res.status(500).json({
      message: "Assign failed",
    });
  }
};

export const getAgencyDriverStats = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await Driver.findOne({
      _id: driverId,
      agencyId: req.user.id,
    });

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    const stats = await Booking.aggregate([
      { $match: { driverId: driver._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json(stats);
  } catch (err) {
    res.status(500).json({
      message: "Stats error",
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const agencyId = req.user.id;

    const drivers = await Driver.countDocuments({ agencyId });
    const vehicles = await Vehicle.countDocuments({ agencyId });
    const bookings = await Booking.countDocuments({ agencyId });

    //  today bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayBookings = await Booking.find({
      agencyId,
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    }).limit(5);

    res.json({
      drivers,
      vehicles,
      bookings,
      todayBookings,
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ message: "Dashboard error" });
  }
};

export const getAgencyProfile = async (req, res) => {
  try {
    const agency = await Agency.findById(req.user.id);

    const docs = await AgencyDocument.findOne({
      agencyId: agency._id,
    });

    return res.json({
      name: agency.name,
      mobile: agency.mobile,
      city: agency.city,
      code: agency.code,
      status: agency.status,
      documents: {
        gst: docs?.gst?.adminVerified || "pending",
        pan: docs?.companyPan?.adminVerified || "pending",
        aadhaar: docs?.ownerAadhaar?.adminVerified || "pending",
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
};

export const checkVehicle = async (req, res) => {
  try {
    const { vehicleNumber } = req.body;
    const agency = await Agency.findById(req.user.id);

    if (!vehicleNumber) {
      return res.status(400).json({
        message: "Vehicle number required",
      });
    }
    let vehicle = await Vehicle.findOne({
      vehicleNumber: vehicleNumber,
    });

    if (vehicle && vehicle.agencyId.toString() !== agency._id.toString()) {
      return res.status(403).json({
        message: "This vehicle belongs to another agency",
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

export const addVehicle = async (req, res) => {
  try {
    const data = req.body;

    const agency = await Agency.findById(req.user.id);

    if (!agency) {
      return res.status(404).json({
        message: "Agency not found",
      });
    }

    let vehicle = await Vehicle.findOne({
      vehicleNumber: data.vehicleNumber,
    });

    if (vehicle && vehicle.agencyId.toString() !== agency._id.toString()) {
      return res.status(403).json({
        message: "This vehicle belongs to another agency",
      });
    }

    if (!vehicle) {
      vehicle = new Vehicle({
        vehicleNumber: data.vehicleNumber,
        agencyId: agency._id,
        agencyCode: agency.code,
      });
    }

    //  BASIC FIELDS
    vehicle.type = data.type;
    vehicle.category = data.category;
    vehicle.make = data.make;
    vehicle.model = data.model;

    vehicle.transmission = data.transmission || null;
    vehicle.fuelType = data.fuelType || null;

    vehicle.ownerNumber = data.ownerNumber;
    vehicle.minimumKm = data.minimumKm;

    vehicle.seatingCapacity = data.seatingCapacity;
    vehicle.acType = data.acType;
    vehicle.year = data.year;

    //  PRICING
    vehicle.pricing = {
      baseFare: data.baseFare || 0,
      perKmRate: data.perKmRate,
      perHourRate: data.perHourRate || 0,
      driverAllowancePerDay: data.driverAllowancePerDay || 0,
      nightCharge: data.nightCharge || 0,
      platformFeePercent: data.platformFeePercent || 15,
    };

    vehicle.isDetailsCompleted = true;

    //  STATUS AUTO
    if (vehicle.isDocumentsCompleted) {
      vehicle.status = "ACTIVE";
    } else {
      vehicle.status = "PENDING";
    }

    await vehicle.save();

    res.json({
      message: "Vehicle details saved",
      vehicle,
    });
  } catch (err) {
    console.error("ADD ERROR", err);
    res.status(500).json({
      message: err.message || "Vehicle save failed",
    });
  }
};

export const checkDriver = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ message: "Mobile required" });
    }

    const driver = await Driver.findOne({ mobile });

    //  NOT EXISTS
    if (!driver) {
      return res.json({ exists: false });
    }

    //  INDIVIDUAL (sabse pehle check)
    if (!driver.agencyId) {
      return res.json({
        exists: true,
        type: "INDIVIDUAL",
        name: driver.name,
        mobile: driver.mobile,
      });
    }

    //  SAME AGENCY
    if (driver.agencyId.toString() === req.user.id.toString()) {
      return res.json({
        exists: true,
        type: "SAME_AGENCY",
        name: driver.name,
        mobile: driver.mobile,
        driverEmployeeId: driver.driverEmployeeId,
        inviteKey: driver.inviteKey,
        status: driver.status,
        experience: driver.experience,
      });
    }

    //  OTHER AGENCY
    return res.json({
      exists: true,
      type: "OTHER_AGENCY",
    });
  } catch (err) {
    console.error("CHECK DRIVER ERROR", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAgencyVehicles = async (req, res) => {
  try {
    const agencyId = req.user.id;

    const vehicles = await Vehicle.find({ agencyId }).sort({
      createdAt: -1,
    });

    res.json({ vehicles });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateAvailabilityStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { availabilityStatus } = req.body;

    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      { availabilityStatus },
      { new: true },
    );

    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateVehiclePricing = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      minimumKm,
      baseFare,
      perKmRate,
      driverAllowancePerDay,
      nightCharge,
    } = req.body;

    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      {
        minimumKm,
        "pricing.baseFare": baseFare,
        "pricing.perKmRate": perKmRate,
        "pricing.driverAllowancePerDay": driverAllowancePerDay,
        "pricing.nightCharge": nightCharge,
      },
      { new: true },
    );

    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
