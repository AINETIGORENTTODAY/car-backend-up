import mongoose from "mongoose";

const pricingSchema = new mongoose.Schema({
    agencyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Agency"
    },

    vehicleCategory: {
        type: String,
        enum: ["CAB", "URBANIA", "BUS"]
    },

    priceType: {
        type: String,
        enum: ["PER_KM", "PER_DAY"]
    },

    basePrice: Number,
    minimumCharge: Number
});

export default mongoose.model("Pricing", pricingSchema);