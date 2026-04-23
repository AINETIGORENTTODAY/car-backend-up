import Booking from "../models/Booking.js";
import Vehicle from "../models/Vehicle.js";
import { calculateFare } from "../utils/calculateFare.js";
import Agency from "../models/Agency.js";

export const createBooking = async (req, res) => {
    const {
        vehicleId,
        pickupLocation,
        dropLocation,
        distance,
        hours,
        days
    } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
    }

    //  Fetch agency to get code
    const agency = await Agency.findById(vehicle.agencyId);

    const fare = calculateFare({
        vehicle,
        distance,
        hours,
        days
    });

    const booking = await Booking.create({
        passengerId: req.user.id,
        agencyId: agency._id,
        agencyCode: agency.code,
        vehicleId,
        pickupLocation,
        dropLocation,
        distance,
        hours,
        days,
        fare
    });

    res.status(201).json({
        message: "Booking created",
        booking
    });
};

export const getAgencyBookings = async (req, res) => {
    console.log("REQ USER:", req.user);

    const bookings = await Booking.find({
        agencyId: req.user.id
    });

    console.log("FOUND BOOKINGS:", bookings.length);

    res.json(bookings);
};