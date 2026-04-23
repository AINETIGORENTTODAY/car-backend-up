import express from "express";
import {
  adminLogin,
  createAdmin,
  getAgenciesForAdmin,
  getAgenciesWithDocs,
  getPendingDrivers,
  updateDocumentStatus,
  updatePhotoStatus,
  verifyAgencyDocument,
} from "../controllers/admin.controller.js";
import { adminOnly, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create", adminOnly, createAdmin);
router.post("/login", adminOnly, adminLogin);
router.post("/update-photo", adminOnly, updatePhotoStatus);
router.post("/update-document", adminOnly, updateDocumentStatus);
router.post("/verify-document", verifyAgencyDocument);
router.get("/drivers", adminOnly, getPendingDrivers);
router.get("/agencies", getAgenciesForAdmin);
router.get("/agencies-with-docs", adminOnly, getAgenciesWithDocs);
export default router;
