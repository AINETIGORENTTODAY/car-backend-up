import mongoose from "mongoose";
const passengerSchema = new mongoose.Schema({
    name: String,
    mobile: String
});

export default mongoose.model("Passenger", passengerSchema);