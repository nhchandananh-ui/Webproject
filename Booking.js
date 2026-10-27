import mongoose from "mongoose";
const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  slot: { type: mongoose.Schema.Types.ObjectId, ref: "Slot", required: true },
  vehicleNumber: { type: String, required: true, trim: true, uppercase: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["BOOKED", "CANCELLED", "COMPLETED"], default: "BOOKED" },
  paymentStatus: { type: String, enum: ["PENDING", "PAID"], default: "PENDING" }
}, { timestamps: true });
export default mongoose.model("Booking", bookingSchema);
