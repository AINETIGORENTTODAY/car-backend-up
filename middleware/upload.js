import multer from "multer";
import fs from "fs";
import path from "path";
import Driver from "../models/Driver.js";

const storage = multer.diskStorage({

    destination: async (req, file, cb) => {
        try {
            const driver = await Driver.findById(req.user.id);

            if (!driver) {
                return cb(new Error("Driver not found"));
            }

            const folder = `uploads/drivers/${driver.driverEmployeeId}`;

            // folder auto create
            fs.mkdirSync(folder, { recursive: true });

            cb(null, folder);

        } catch (err) {
            console.log("TOKEN RECEIVED:", token);
            console.log("DECODED:", decoded);
            cb(err);
        }
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `photo${ext}`);
    }
});

export const uploadDriverPhotoMiddleware = multer({
    storage,
    fileFilter: (req, file, cb) => {

        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files allowed"));
        }

        cb(null, true);
    }
});
