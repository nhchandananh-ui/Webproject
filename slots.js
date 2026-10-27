import { Router } from "express";
import Slot from "../models/Slot.js";
import Booking from "../models/Booking.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();
router.get("/", async (_req, res, next) => {
  try {
    const slots = await Slot.find({ active: true }).sort({ slotNumber: 1 });
    const now = new Date();
    const busyBookings = await Booking.find({
      status: "BOOKED", startTime: { $lte: now }, endTime: { $gt: now }
    }).select("slot");
    const busy = new Set(busyBookings.map((b) => String(b.slot)));
    res.json(slots.map((s) => ({ ...s.toObject(), availableNow: !busy.has(String(s._id)) })));
  } catch (err) { next(err); }
});

router.post("/", protect, adminOnly, async (req, res, next) => {
  try {
    const { slotNumber, type, location } = req.body;
    if (!slotNumber?.trim()) return res.status(400).json({ message: "Slot number is required." });
    const slot = await Slot.create({ slotNumber: slotNumber.trim().toUpperCase(), type, location });
    res.status(201).json({ slot });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "That slot number already exists." });
    next(err);
  }
});

router.patch("/:id", protect, adminOnly, async (req, res, next) => {
  try {
    const slot = await Slot.findByIdAndUpdate(req.params.id, { active: Boolean(req.body.active) }, { new: true });
    if (!slot) return res.status(404).json({ message: "Slot not found." });
    res.json({ slot });
  } catch (err) { next(err); }
});
export default router;
