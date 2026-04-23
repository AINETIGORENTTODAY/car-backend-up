import multer from "multer";
import fs from "fs";
import path from "path";
import Driver from "../models/Driver.js";

const storage = multer.diskStorage({

    destination: async (req, file, cb) => {

        const driver = await Driver.findById(req.user.id);

        if (!driver) {
            return cb(new Error("Driver not found"));
        }

        const folder = `uploads/drivers/${driver.driverEmployeeId}`;

        // auto create folder
        fs.mkdirSync(folder, { recursive: true });

        cb(null, folder);
    },

    filename: (req, file, cb) => {

        let name = "";

        if (file.fieldname === "photo") name = "photo";
        if (file.fieldname === "licenseFront") name = "license-front";
        if (file.fieldname === "licenseBack") name = "license-back";
        if (file.fieldname === "aadhaarFront") name = "aadhaar-front";
        if (file.fieldname === "aadhaarBack") name = "aadhaar-back";
        if (file.fieldname === "pancard") name = "pancard";

        const ext = path.extname(file.originalname);

        cb(null, `${name}${ext}`);
    }

});

export const uploadDriverDocs = multer({
    storage,
    fileFilter: (req, file, cb) => {

        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files allowed"));
        }

        cb(null, true);
    }
});