export function calculateAmount(startTime, endTime) {
  const milliseconds = new Date(endTime) - new Date(startTime);
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) throw new Error("End time must be after start time.");
  const hours = Math.max(1, Math.ceil(milliseconds / (1000 * 60 * 60)));
  return hours * 30; // Demo price: ₹30 per started hour
}
