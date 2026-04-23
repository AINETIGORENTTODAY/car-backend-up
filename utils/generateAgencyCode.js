import Counter from "../models/Counter.js";

export const generateAgencyCode = async (name = "AGENCY") => {
  const prefix = name.substring(0, 3).toUpperCase();

  const counter = await Counter.findOneAndUpdate(
    { key: "AGENCY_CODE" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  const number = String(counter.seq).padStart(4, "0");

  return `${prefix}${number}`;
};
