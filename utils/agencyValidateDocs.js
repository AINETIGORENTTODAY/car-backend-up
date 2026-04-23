import vision from "@google-cloud/vision";

const client = new vision.ImageAnnotatorClient();

// OCR TEXT

export const extractText = async (filePath) => {
    try {
        const [result] = await client.textDetection(filePath);

        const detections = result.textAnnotations;

        if (!detections || detections.length === 0) {
            console.log(" No text detected");
            return "";
        }

        const text = detections[0].description.toLowerCase();

        console.log(" OCR TEXT:\n", text);

        return text;

    } catch (err) {
        console.log(" OCR ERROR:", err);
        return "";
    }
};


// GST EXTRACT 

export const extractGSTNumber = (text) => {

    const clean = text.toUpperCase().replace(/\s+/g, "");

    const match = clean.match(
        /\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}/
    );

    return match ? match[0] : null;
};


// GST VALIDATION 


export const validateGST = (text) => {

    const clean = text.toLowerCase();


    const hasGSTKeyword =
        clean.includes("gst") ||
        clean.includes("gst reg-06");

    const hasCertificate =
        clean.includes("registration certificate");

    const hasGov =
        clean.includes("government of india");


    const gstNumber = extractGSTNumber(text);

    // MUST NOT HAVE (MSME BLOCK)
    const isMSME =
        clean.includes("udyam") ||
        clean.includes("msme") ||
        clean.includes("micro small");

    console.log("GST CHECK:", {
        hasGSTKeyword,
        hasCertificate,
        hasGov,
        gstNumber,
        isMSME
    });


    return (
        hasGSTKeyword &&
        hasCertificate &&
        hasGov &&
        !isMSME &&
        (gstNumber || hasGSTKeyword)
    );
};


// MSME VALIDATION

export const validateMSME = (text) => {

    const clean = text.toLowerCase();

    const hasUdyam =
        clean.includes("udyam registration certificate");

    const hasMSME =
        clean.includes("micro small and medium enterprises") ||
        clean.includes("msme");

    return hasUdyam && hasMSME;
};


// PAN


export const validatePAN = (text) => {

    const cleanText = text
        .replace(/\s+/g, "")
        .replace(/o/g, "0")
        .replace(/i/g, "1");

    const panRegex = /[a-z]{5}[0-9]{4}[a-z]{1}/i;

    const hasPAN = panRegex.test(cleanText);

    console.log("PAN CHECK:", {
        hasPAN,
        cleanText
    });

    return hasPAN;
};


// AADHAAR

export const extractAadhaarNumber = (text) => {
    const match = text.match(/\d{4}\s?\d{4}\s?\d{4}/);
    return match ? match[0] : null;
};