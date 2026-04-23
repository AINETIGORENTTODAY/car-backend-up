import jwt from "jsonwebtoken";
export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log("AUTH HEADER:", authHeader);

    const token = authHeader?.split(" ")[1];

    console.log("TOKEN:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("DECODED:", decoded);

    req.user = decoded;

    next();
  } catch (err) {
    console.log("JWT ERROR:", err.message);

    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

export const agencyOnly = (req, res, next) => {
  if (req.user.role !== "AGENCY") {
    return res.status(403).json({ message: "Agency only" });
  }
  next();
};

export const driverOnly = (req, res, next) => {
  if (req.user.role !== "DRIVER") {
    return res.status(403).json({ message: "Driver access only" });
  }
  next();
};

export const adminOnly = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      message: "Admin only access",
    });
  }
  next();
};
