import mongoose from "mongoose";
const slotSchema = new mongoose.Schema({
  slotNumber: { type: String, required: true, unique: true },
  type: { type: String, enum: ["CAR", "BIKE"], default: "CAR" },
  location: { type: String, default: "Main Parking" },
  active: { type: Boolean, default: true }
}, { timestamps: true });
export default mongoose.model("Slot", slotSchema);
