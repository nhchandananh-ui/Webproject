import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Slot from "./models/Slot.js";

await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smart_parking");
const adminHash = await bcrypt.hash("Admin123!", 10);
const userHash = await bcrypt.hash("User123!", 10);
await User.updateOne({ email: "admin@parking.com" }, { $set: { name: "Parking Admin", password: adminHash, role: "ADMIN" } }, { upsert: true });
await User.updateOne({ email: "user@parking.com" }, { $set: { name: "Demo User", password: userHash, role: "USER" } }, { upsert: true });

for (let i = 1; i <= 12; i++) {
  await Slot.updateOne(
    { slotNumber: `P${String(i).padStart(2, "0")}` },
    { $setOnInsert: { slotNumber: `P${String(i).padStart(2, "0")}`, type: i <= 8 ? "CAR" : "BIKE", location: "Main Parking", active: true } },
    { upsert: true }
  );
}
console.log("Seed complete. Admin: admin@parking.com / Admin123! | User: user@parking.com / User123!");
await mongoose.disconnect();
