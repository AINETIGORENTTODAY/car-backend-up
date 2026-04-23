import express from "express";
import vision from "@google-cloud/vision";

const router = express.Router();

const client = new vision.ImageAnnotatorClient();

router.post("/validate-face", async (req, res) => {
  try {
    let { base64 } = req.body;

    if (!base64) {
      return res.status(400).json({
        error: "Base64 image required",
      });
    }

    //  CLEAN BASE64
    base64 = base64.replace(/^data:image\/\w+;base64,/, "");

    //  VALIDATE BASE64
    const buffer = Buffer.from(base64, "base64");

    const [result] = await client.faceDetection({
      image: { content: buffer },
    });

    const faces = result.faceAnnotations || [];

    console.log("Faces detected:", faces.length);

    return res.json({
      faceDetected: faces.length === 1,
      faceCount: faces.length,
    });
  } catch (err) {
    console.error("Google Vision Error:", err);

    return res.status(500).json({
      error: "Face validation failed",
      message: err.message,
    });
  }
});

export default router;
