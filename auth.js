import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Please log in first." });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "development_only_secret");
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message: "Account not found." });
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired login. Please log in again." });
  }
}
export function adminOnly(req, res, next) {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ message: "Admin access required." });
  next();
}
