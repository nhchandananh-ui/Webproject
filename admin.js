import { Router } from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import User from "../models/User.js";
import Slot from "../models/Slot.js";
import Booking from "../models/Booking.js";

const router = Router();
router.use(protect, adminOnly);

router.get("/summary", async (_req, res, next) => {
  try {
    const [totalSlots, activeSlots, totalUsers, totalBookings, pending, paid, cancelled, revenue] = await Promise.all([
      Slot.countDocuments(), Slot.countDocuments({ active: true }), User.countDocuments({ role: "USER" }),
      Booking.countDocuments(), Booking.countDocuments({ status: "BOOKED" }),
      Booking.countDocuments({ paymentStatus: "PAID" }), Booking.countDocuments({ status: "CANCELLED" }),
      Booking.aggregate([{ $match: { paymentStatus: "PAID", status: { $ne: "CANCELLED" } } }, { $group: { _id: null, total: { $sum: "$amount" } } }])
    ]);
    const bookings = await Booking.find().populate("user", "name email").populate("slot", "slotNumber type").sort({ createdAt: -1 }).limit(30);
    res.json({ summary: { totalSlots, activeSlots, totalUsers, totalBookings, pending, paid, cancelled, revenue: revenue[0]?.total || 0 }, bookings });
  } catch (err) { next(err); }
});
export default router;
