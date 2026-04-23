import fs from "fs";

import Driver from "../models/Driver.js";
import DriverDocument from "../models/DriverDocument.js";

import {
    extractText,
    validateAadhaar,
    validatePAN,
    validateDL,
    extractAadhaarNumber,
    extractPAN,
    extractDLNumber
} from "../utils/validateDocs.js";

//  delete helper
const deleteFile = (path) => {
    if (path && fs.existsSync(path)) {
        fs.unlinkSync(path);
        console.log(" Deleted:", path);
    }
};

export const uploadDriverDocuments = async (req, res) => {

    try {

        const driver = await Driver.findById(req.user.id);

        if (!driver) {
            return res.status(404).json({
                message: "Driver not found"
            });
        }

        const driverEmployeeId = driver.driverEmployeeId;
        const files = req.files;

        const existingDocs = await DriverDocument.findOne({
            driverId: driver._id
        });

        const errors = [];


        // OCR


        const aadhaarFrontText = files?.aadhaarFront?.[0]
            ? await extractText(files.aadhaarFront[0].path)
            : "";

        const aadhaarBackText = files?.aadhaarBack?.[0]
            ? await extractText(files.aadhaarBack[0].path)
            : "";

        const panText = files?.pancard?.[0]
            ? await extractText(files.pancard[0].path)
            : "";

        const dlFrontText = files?.licenseFront?.[0]
            ? await extractText(files.licenseFront[0].path)
            : "";

        const dlBackText = files?.licenseBack?.[0]
            ? await extractText(files.licenseBack[0].path)
            : "";


        //  AADHAAR


        let aadhaarData;

        if (!existingDocs?.aadhaar?.verified && files?.aadhaarFront && files?.aadhaarBack) {

            if (!validateAadhaar(aadhaarFrontText)) {
                deleteFile(files.aadhaarFront[0].path);
                errors.push({ field: "aadhaarFront", message: "Invalid Aadhaar Front ❌" });
            }

            if (!validateAadhaar(aadhaarBackText)) {
                deleteFile(files.aadhaarBack[0].path);
                errors.push({ field: "aadhaarBack", message: "Invalid Aadhaar Back ❌" });
            }

            const frontNumber = extractAadhaarNumber(aadhaarFrontText);
            const backNumber = extractAadhaarNumber(aadhaarBackText);

            if (!frontNumber || !backNumber || frontNumber !== backNumber) {
                errors.push({ field: "aadhaar", message: "Aadhaar mismatch ❌" });
            }

            if (errors.length === 0) {
                aadhaarData = {
                    number: frontNumber,
                    frontImage: `/uploads/drivers/${driverEmployeeId}/aadhaar-front.jpg`,
                    backImage: `/uploads/drivers/${driverEmployeeId}/aadhaar-back.jpg`,
                    verified: true,
                    adminVerified: "pending"
                };
            }
        }


        //  PAN


        let panData;

        if (!existingDocs?.panCard?.verified && files?.pancard) {

            const panNumber = extractPAN(panText);

            if (!panNumber) {
                deleteFile(files.pancard[0].path);
                errors.push({ field: "pan", message: "Invalid PAN ❌" });
            } else {
                panData = {
                    number: panNumber,
                    image: `/uploads/drivers/${driverEmployeeId}/pancard.jpg`,
                    verified: true,
                    adminVerified: "pending"
                };
            }
        }


        //  DL


        let dlData;

        if (!existingDocs?.drivingLicense?.verified && files?.licenseFront) {

            const dlNumber = extractDLNumber(dlFrontText);

            if (!dlNumber && !validateDL(dlFrontText)) {
                deleteFile(files.licenseFront[0].path);
                errors.push({ field: "licenseFront", message: "Invalid DL ❌" });
            } else {
                dlData = {
                    number: dlNumber,
                    frontImage: `/uploads/drivers/${driverEmployeeId}/license-front.jpg`,
                    backImage: `/uploads/drivers/${driverEmployeeId}/license-back.jpg`,
                    verified: true,
                    adminVerified: "pending"
                };
            }
        }


        //  IF ERRORS → RETURN BUT SAVE VALID


        const updateData = {
            driverId: driver._id,
            agencyCode: driver.agencyCode,
            driverEmployeeId: driver.driverEmployeeId
        };

        if (aadhaarData) updateData.aadhaar = aadhaarData;
        if (panData) updateData.panCard = panData;
        if (dlData) updateData.drivingLicense = dlData;

        //  ALWAYS SAVE VALID DATA
        if (aadhaarData || panData || dlData) {
            await DriverDocument.findOneAndUpdate(
                { driverId: driver._id },
                updateData,
                { upsert: true, new: true }
            );
        }

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        return res.json({
            message: "Documents saved successfully ✅"
        });

    } catch (err) {

        console.log("❌ ERROR:", err);

        res.status(500).json({
            message: "Upload failed ❌"
        });

    }

};

export const getDriverDocuments = async (req, res) => {
    try {
        const driver = await Driver.findById(req.user.id);

        const docs = await DriverDocument.findOne({
            driverId: driver._id
        });

        return res.json({

            createdAt: docs?.createdAt || driver?.createdAt || new Date(),

            //  PHOTO
            photo: driver?.photoUpload || false,
            photoStatus: driver?.photoStatus || "pending",
            photoReason: driver?.photoReason || "",

            // ================= DL =================
            // dlFront:
            //     docs?.drivingLicense?.frontImage &&
            //     docs?.drivingLicense?.frontVerified === "approved",

            // dlBack:
            //     docs?.drivingLicense?.backImage &&
            //     docs?.drivingLicense?.backVerified === "approved",
            dlFront: !!docs?.drivingLicense?.frontImage,
            dlBack: !!docs?.drivingLicense?.backImage,

            // ================= AADHAAR =================
            // aadhaarFront:
            //     docs?.aadhaar?.frontImage &&
            //     docs?.aadhaar?.frontVerified === "approved",

            // aadhaarBack:
            //     docs?.aadhaar?.backImage &&
            //     docs?.aadhaar?.backVerified === "approved",
            aadhaarFront: !!docs?.aadhaar?.frontImage,
            aadhaarBack: !!docs?.aadhaar?.backImage,

            // ================= PAN =================
            // pan:
            //     docs?.panCard?.image &&
            //     docs?.panCard?.adminVerified === "approved",
            pan: !!docs?.panCard?.image,

            // ================= STATUS =================
            dlStatus: docs?.drivingLicense?.adminVerified || "pending",
            aadhaarStatus: docs?.aadhaar?.adminVerified || "pending",
            panStatus: docs?.panCard?.adminVerified || "pending",

            // ================= REASON =================
            dlReason: docs?.drivingLicense?.reason || "",
            aadhaarReason: docs?.aadhaar?.reason || "",
            panReason: docs?.panCard?.reason || ""
        });

    } catch (err) {
        res.status(500).json({ message: "Failed" });
    }
};

