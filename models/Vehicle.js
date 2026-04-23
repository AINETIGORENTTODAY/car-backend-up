import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
    },

    agencyCode: String,

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
    },

    // BASIC INFO
    type: {
      type: String,
      enum: ["CAR", "BUS"],
      required: true,
    },

    category: {
      type: String,
      enum: [
        "SUV",
        "HATCHBACK",
        "SEDAN",
        "MPV",
        "COUPE",
        "ELECTRIC",
        "LUXURY",
        "COMMERCIAL",
        "MINI_BUS",
        "CITY_BUS",
        "SLEEPER",
        "SEATER",
        "LUXURY_AC",
        "SCHOOL_BUS",
        "ELECTRIC_BUS",
      ],
      required: true,
    },
    make: String,
    model: String,

    transmission: {
      type: String,
      enum: ["MANUAL", "AUTOMATIC"],
    },

    fuelType: {
      type: String,
      enum: ["PETROL", "DIESEL", "CNG", "EV"],
    },
    // ownerNumber: {
    //     type: Number,
    //     enum: [1, 2, 3, 4],
    //     default: 1
    // },

    minimumKm: {
      type: Number,
      default: 0,
    },

    seatingCapacity: Number,
    acType: String,
    year: Number,

    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
    },

    // PRICING
    pricing: {
      baseFare: { type: Number, default: 0 },
      perKmRate: { type: Number, required: true },
      driverAllowancePerDay: { type: Number, default: 0 },
      nightCharge: { type: Number, default: 0 },
      platformFeePercent: { type: Number, default: 15 },
    },
    isDetailsCompleted: {
      type: Boolean,
      default: false,
    },

    isDocumentsCompleted: {
      type: Boolean,
      default: false,
    },
    // STATUS
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "BLOCKED"],
      default: "PENDING",
    },

    availabilityStatus: {
      type: String,
      enum: ["AVAILABLE", "IN_SERVICE", "ON_TRIP", "MAINTENANCE"],
      default: "AVAILABLE",
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Vehicle", vehicleSchema);
