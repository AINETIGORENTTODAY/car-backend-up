import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import agencyRoutes from "./routes/agency.routes.js";
import adminRoutes from "./routes/admin.routes.js";

import driverRoutes from "./routes/driver.routes.js";
import faceValidateRoute from "./api/face-validate.js";

connectDB();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/api", faceValidateRoute);
app.use("/api/auth", authRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/agency", agencyRoutes);
app.use("/api/driver", driverRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("Backend Running ||A>");
});

// app.listen(process.env.PORT, () =>
//     console.log(`Server running on port ${process.env.PORT}`)
// );

app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});
