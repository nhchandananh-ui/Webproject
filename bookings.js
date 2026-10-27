import { Router } from "express";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Slot from "../models/Slot.js";
import { protect } from "../middleware/auth.js";
import { calculateAmount } from "../utils/pricing.js";

const router = Router();
router.use(protect);

router.get("/mine", async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("slot", "slotNumber type location").sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { slotId, vehicleNumber, startTime, endTime } = req.body;
    if (!mongoose.isValidObjectId(slotId)) return res.status(400).json({ message: "Choose a valid parking slot." });
    if (!vehicleNumber?.trim()) return res.status(400).json({ message: "Vehicle number is required." });
    const start = new Date(startTime), end = new Date(endTime);
    if (Number.isNaN(+start) || Number.isNaN(+end) || start <= new Date() || end <= start) {
      return res.status(400).json({ message: "Choose a future start time and an end time after the start." });
    }
    if (end - start > 7 * 24 * 60 * 60 * 1000) return res.status(400).json({ message: "Bookings are limited to 7 days." });
    const slot = await Slot.findOne({ _id: slotId, active: true });
    if (!slot) return res.status(404).json({ message: "This parking slot is not available for booking." });

    const overlap = await Booking.findOne({
      slot: slotId, status: "BOOKED",
      startTime: { $lt: end }, endTime: { $gt: start }
    });
    if (overlap) return res.status(409).json({ message: "This slot is already booked during that time. Please choose another slot or time." });

    const amount = calculateAmount(start, end);
    const booking = await Booking.create({
      user: req.user._id, slot: slotId, vehicleNumber: vehicleNumber.trim().toUpperCase(),
      startTime: start, endTime: end, amount
    });
    await booking.populate("slot", "slotNumber type location");
    res.status(201).json({ booking, message: "Booking created. Complete the demo payment to mark it as paid." });
  } catch (err) { next(err); }
});

router.post("/:id/pay-demo", async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.status === "CANCELLED") return res.status(400).json({ message: "Cancelled bookings cannot be paid." });
    booking.paymentStatus = "PAID";
    await booking.save();
    res.json({ booking, message: "Demo payment recorded. No real money was charged." });
  } catch (err) { next(err); }
});

router.post("/:id/cancel", async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.status !== "BOOKED") return res.status(400).json({ message: "Only active bookings can be cancelled." });
    if (new Date(booking.startTime) <= new Date()) return res.status(400).json({ message: "A booking cannot be cancelled after its start time." });
    booking.status = "CANCELLED";
    await booking.save();
    res.json({ booking, message: "Booking cancelled." });
  } catch (err) { next(err); }
});
export default router;
