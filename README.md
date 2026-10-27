# Smart Parking Management System (MERN)

A beginner-friendly college mini-project built with MongoDB, Express, React, and Node.js.

## Features
- Register and log in with JWT authentication
- Browse parking slots and book an available slot
- Automatic parking fee calculation based on duration
- View your booking history and cancel upcoming bookings
- Admin dashboard to view totals and manage parking slots
- Demo payment status only (no real payment gateway)

## Requirements
- Node.js 18+ (20+ recommended)
- MongoDB Community Server running locally, or a MongoDB Atlas connection string
- npm

## 1. Start the backend
Open a terminal:
```bash
cd server
npm install
```
Copy `.env.example` to `.env`, then edit `MONGO_URI` if necessary.
```bash
npm run seed
npm run dev
```
The API runs at `http://localhost:5000`.

Seed admin account:
- Email: `admin@parking.com`
- Password: `Admin123!`

Seed user account:
- Email: `user@parking.com`
- Password: `User123!`

Change these demo passwords before using the app outside a local demo.

## 2. Start the frontend
Open a second terminal:
```bash
cd client
npm install
npm run dev
```
Open the URL printed by Vite (usually `http://localhost:5173`).

## How pricing works
The app charges ₹30 per started hour, with a minimum charge of one hour. Example: 90 minutes costs ₹60. This is a demo estimate; no real payment is collected.

## Notes
- The project uses a simple booking time window. The backend checks overlapping bookings to prevent two users booking the same slot at the same time.
- A booking is marked `PAID` only when the user presses the demo “Confirm demo payment” button. This is not connected to a bank or payment provider.
- Keep `.env` private and never commit real secrets.
