import multer from "multer";
import fs from "fs";
import path from "path";
import Agency from "../models/Agency.js";

const storage = multer.diskStorage({

    destination: async (req, file, cb) => {
        try {
            const agency = await Agency.findById(req.user.id);

            if (!agency) return cb(new Error("Agency not found"));

            const dir = path.join(
                process.cwd(),
                "uploads",
                "agency",
                agency.code
            );

            fs.mkdirSync(dir, { recursive: true });

            console.log(" Saving to:", dir);

            cb(null, dir);

        } catch (err) {
            cb(err);
        }
    },

    filename: (req, file, cb) => {
        const ext = file.originalname.split(".").pop();
        cb(null, `${file.fieldname}.${ext}`);
    }
});

export const agencyupload = multer({ storage });