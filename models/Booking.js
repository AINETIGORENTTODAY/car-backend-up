import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    passengerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Passenger",
        required: true
    },

    agencyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Agency",
        required: true
    },
    agencyCode: {
        type: String,
        default: null
    },

    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
        required: true
    },

    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
        default: null
    },
    driverEmployeeId: {
        type: String,
        default: null
    },

    // Trip details
    pickupLocation: String,
    dropLocation: String,
    distance: Number,
    hours: Number,
    days: {
        type: Number,
        default: 1
    },

    // Fare breakup
    fare: {
        baseFare: Number,
        bookingFee: Number,
        agencyEarning: Number,
        platformEarning: Number,
        totalFare: Number
    },

    status: {
        type: String,
        enum: [
            "CREATED",
            "DRIVER_ASSIGNED",
            "ONGOING",
            "COMPLETED",
            "CANCELLED"
        ],
        default: "CREATED"
    }

}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);