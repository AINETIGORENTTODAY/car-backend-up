import express from "express";
import {
  addVehicle,
  addDriver,
  getDrivers,
  getAgencyDriverStats,
  registerAgency,
  getDashboardStats,
  getAgencyProfile,
  checkVehicle,
  checkDriver,
  updateAvailabilityStatus,
  getAgencyVehicles,
  updateVehiclePricing,
} from "../controllers/agency.controller.js";

import { protect, agencyOnly } from "../middleware/auth.middleware.js";

import { agencyupload } from "../middleware/agencyupload.js";
import {
  getAgencyDocuments,
  uploadAgencyDocuments,
} from "../controllers/agencyDocument.controller.js";

const router = express.Router();
router.post("/register", registerAgency);

// Vehicle
router.post("/vehicle/add", protect, agencyOnly, addVehicle);
router.post("/vehicle/check", protect, agencyOnly, checkVehicle);
router.get("/vehicle/my", protect, agencyOnly, getAgencyVehicles);
router.patch("/vehicle/:id/pricing", protect, agencyOnly, updateVehiclePricing);
// Driver
router.post("/driver/add", protect, agencyOnly, addDriver);
router.get("/drivers", protect, agencyOnly, getDrivers);
router.post("/driver/check", protect, agencyOnly, checkDriver);
router.get("/driver/:driverId", protect, agencyOnly, getAgencyDriverStats);

router.get("/documents", protect, agencyOnly, getAgencyDocuments);

router.post(
  "/upload-docs",
  protect,
  agencyOnly,
  agencyupload.fields([
    { name: "gst", maxCount: 1 },
    { name: "msme", maxCount: 1 },
    { name: "pan", maxCount: 1 },
    { name: "aadharFront", maxCount: 1 },
    { name: "aadharBack", maxCount: 1 },
    { name: "shopPhoto", maxCount: 1 },
  ]),
  uploadAgencyDocuments,
);

router.get("/dashboard-stats", protect, agencyOnly, getDashboardStats);
router.get("/profile", protect, agencyOnly, getAgencyProfile);
router.patch(
  "/vehicle/:id/availability",
  protect,
  agencyOnly,
  updateAvailabilityStatus,
);

export default router;
