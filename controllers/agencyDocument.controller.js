import fs from "fs";
import Agency from "../models/Agency.js";
import AgencyDocument from "../models/AgencyDocument.js";

import {
  extractText,
  validateGST,
  validateMSME,
  validatePAN,
  extractAadhaarNumber,
  extractGSTNumber,
} from "../utils/agencyValidateDocs.js";

// DELETE FILE
const deleteFile = (path) => {
  if (path && fs.existsSync(path)) {
    fs.unlinkSync(path);
    console.log("🗑 Deleted:", path);
  }
};

export const uploadAgencyDocuments = async (req, res) => {
  try {
    const agency = await Agency.findById(req.user.id);
    if (!agency) {
      return res.status(404).json({ message: "Agency not found" });
    }

    const files = req.files || {};
    const errors = [];

    // OCR

    const gstText = files?.gst?.[0] ? await extractText(files.gst[0].path) : "";

    const msmeText = files?.msme?.[0]
      ? await extractText(files.msme[0].path)
      : "";

    const panText = files?.pan?.[0] ? await extractText(files.pan[0].path) : "";

    const aadharFrontText = files?.aadharFront?.[0]
      ? await extractText(files.aadharFront[0].path)
      : "";

    const aadharBackText = files?.aadharBack?.[0]
      ? await extractText(files.aadharBack[0].path)
      : "";

    // GST

    let gstData;

    if (files?.gst) {
      const gstValid = validateGST(gstText);
      const gstNumber = extractGSTNumber(gstText);

      if (!gstValid) {
        deleteFile(files.gst[0].path);
        errors.push({
          field: "gst",
          message: "Invalid GST ❌ (Try clear image)",
        });
      } else {
        gstData = {
          certificate: files.gst[0].path,
          gstNumber: gstNumber || null,
          verified: true,
          adminVerified: "PENDING",
        };
      }
    }

    // MSME

    let msmeData;

    if (files?.msme) {
      if (!validateMSME(msmeText)) {
        deleteFile(files.msme[0].path);
        errors.push({
          field: "msme",
          message: "Invalid MSME ❌",
        });
      } else {
        msmeData = {
          certificate: files.msme[0].path,
          verified: true,
          adminVerified: "PENDING",
        };
      }
    }

    // PAN

    let panData;

    if (files?.pan) {
      if (!validatePAN(panText)) {
        deleteFile(files.pan[0].path);
        errors.push({
          field: "pan",
          message: "Invalid PAN ❌",
        });
      } else {
        panData = {
          image: files.pan[0].path,
          verified: true,
          adminVerified: "PENDING",
        };
      }
    }

    // AADHAAR

    let aadhaarData;

    if (files?.aadharFront && files?.aadharBack) {
      const frontNum = extractAadhaarNumber(aadharFrontText);
      const backNum = extractAadhaarNumber(aadharBackText);

      if (!frontNum || !backNum || frontNum !== backNum) {
        deleteFile(files.aadharFront[0].path);
        deleteFile(files.aadharBack[0].path);

        errors.push({
          field: "aadhaar",
          message: "Aadhaar mismatch ❌",
        });
      } else {
        aadhaarData = {
          frontImage: files.aadharFront[0].path,
          backImage: files.aadharBack[0].path,
          verified: true,
          adminVerified: "PENDING",
        };
      }
    }

    // SHOP PHOTO

    let shopData;

    if (files?.shopPhoto) {
      shopData = {
        image: files.shopPhoto[0].path,
        verified: true,
        adminVerified: "PENDING",
      };
    }

    // SAVE

    const updateData = {
      agencyId: agency._id,
      agencyCode: agency.code,
    };

    if (gstData) updateData.gst = gstData;
    if (msmeData) updateData.msme = msmeData;
    if (panData) updateData.companyPan = panData;
    if (aadhaarData) updateData.ownerAadhaar = aadhaarData;
    if (shopData) updateData.shopPhoto = shopData;

    if (Object.keys(updateData).length > 2) {
      await AgencyDocument.findOneAndUpdate(
        { agencyId: agency._id },
        updateData,
        { upsert: true, new: true },
      );
    }

    // ERRORS

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // SUCCESS

    agency.documentsUploaded = true;
    agency.status = "PENDING";
    await agency.save();

    return res.json({
      message: "Documents uploaded successfully ✅",
    });
  } catch (err) {
    console.log("❌ ERROR:", err);
    res.status(500).json({
      message: "Upload failed ❌",
    });
  }
};

export const getAgencyDocuments = async (req, res) => {
  try {
    const agency = await Agency.findById(req.user.id);

    const docs = await AgencyDocument.findOne({
      agencyId: agency._id,
    });
    return res.json({
      createdAt: docs?.createdAt,

      gst: !!docs?.gst?.certificate,
      gstStatus: docs?.gst?.adminVerified || "PENDING",
      gstReason: docs?.gst?.reason || "",

      msme: !!docs?.msme?.certificate,
      msmeStatus: docs?.msme?.adminVerified || "PENDING",
      msmeReason: docs?.msme?.reason || "",

      pan: !!docs?.companyPan?.image,
      panStatus: docs?.companyPan?.adminVerified || "PENDING",
      panReason: docs?.companyPan?.reason || "",

      aadharFront: !!docs?.ownerAadhaar?.frontImage,
      aadharBack: !!docs?.ownerAadhaar?.backImage,
      aadharStatus: docs?.ownerAadhaar?.adminVerified || "PENDING",
      aadharReason: docs?.ownerAadhaar?.reason || "",

      shopPhoto: !!docs?.shopPhoto?.image,
      shopPhotoStatus: docs?.shopPhoto?.adminVerified || "PENDING",
      shopPhotoReason: docs?.shopPhoto?.reason || "",
    });
  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
};
