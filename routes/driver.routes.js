import express from "express";
import {
  checkDriver,
  dashboard,
  getDriverStats,
  registerIndividualDriver,
  verifyInviteKey,
} from "../controllers/driver.controller.js";
import { protect, driverOnly } from "../middleware/auth.middleware.js";
import {
  getDriverDocuments,
  uploadDriverDocuments,
} from "../controllers/driverDocument.controller.js";
import { uploadDriverDocs } from "../middleware/uploadDriverDocs.js";
import { uploadDriverPhotoMiddleware } from "../middleware/upload.js";
import { uploadDriverPhoto as uploadPhotoController } from "../controllers/driver.controller.js";

const router = express.Router();

// DRIVER → verify invite key
router.post("/verify-invite", verifyInviteKey);

router.get("/stats", protect, driverOnly, getDriverStats);
router.post("/registerIndividual", registerIndividualDriver);
router.post("/check", checkDriver);

router.post(
  "/upload-photo",
  protect,
  driverOnly,
  uploadDriverPhotoMiddleware.single("photo"),
  uploadPhotoController,
);

router.get("/documents", protect, driverOnly, getDriverDocuments);

router.post(
  "/upload-documents",
  protect,
  driverOnly,
  uploadDriverDocs.fields([
    { name: "photo", maxCount: 1 },

    { name: "licenseFront", maxCount: 1 },
    { name: "licenseBack", maxCount: 1 },

    { name: "aadhaarFront", maxCount: 1 },
    { name: "aadhaarBack", maxCount: 1 },

    { name: "pancard", maxCount: 1 },
  ]),
  uploadDriverDocuments,
);

router.get("dashboard", protect, driverOnly, dashboard);
// router.post("/vehicle/check", protect, driverOnly, checkVehicle);
export default router;
