import express from "express";
import {
    createBooking,
    getAgencyBookings,
} from "../controllers/booking.controller.js";
import { protect, agencyOnly } from "../middleware/auth.middleware.js";

import { completeBooking, startBooking } from "../controllers/driver.controller.js";
import { assignDriver } from "../controllers/agency.controller.js";

const router = express.Router();

// Passenger
router.post("/create", protect, createBooking);

// Agency
router.get("/agency", protect, agencyOnly, getAgencyBookings);
router.post("/assign-driver", protect, agencyOnly, assignDriver);

// Driver
router.post("/start", protect, startBooking);
router.post("/complete", protect, completeBooking);
// router.post("/calculate-fare", createBooking);


export default router;