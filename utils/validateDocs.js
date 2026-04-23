import vision from "@google-cloud/vision";

const client = new vision.ImageAnnotatorClient();

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


//  Aadhaar

export const extractAadhaarNumber = (text) => {
    const match = text.match(/\d{4}\s?\d{4}\s?\d{4}/);
    return match ? match[0] : null;
};

export const validateAadhaar = (text) => {

    const hasGov =
        text.includes("government of india") ||
        text.includes("भारत सरकार");

    const hasAadhaar =
        text.includes("aadhaar") ||
        text.includes("aadhar") ||
        text.includes("आधार");

    const hasNumber = /\d{4}\s?\d{4}\s?\d{4}/.test(text);

    console.log("AADHAAR CHECK:", {
        hasGov,
        hasAadhaar,
        hasNumber
    });

    return hasNumber && (hasGov || hasAadhaar);
};


//  PAN

export const extractPAN = (text) => {

    const cleanText = text
        .replace(/\s+/g, "")
        .replace(/o/g, "0")
        .replace(/i/g, "1");

    const match = cleanText.match(/[a-z]{5}[0-9]{4}[a-z]{1}/i);

    return match ? match[0].toUpperCase() : null;
};

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


// DL

export const extractDLNumber = (text) => {
    const match = text.match(/[A-Z]{2}[0-9]{2}\s?[0-9]{11}/i);
    return match ? match[0].toUpperCase() : null;
};

export const validateDL = (text) => {

    const hasKeyword =
        text.includes("driving licence") ||
        text.includes("driving license") ||
        text.includes("indian union");

    const dlNumber = extractDLNumber(text);

    console.log("DL CHECK:", {
        hasKeyword,
        dlNumber
    });

    return hasKeyword || dlNumber;
};