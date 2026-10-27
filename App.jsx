import React, { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { CarFront, Bike, ParkingCircle, CalendarClock, History, LayoutDashboard, LogIn, LogOut, UserPlus, CircleDollarSign, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const localInputDate = (date) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};
const defaultStart = () => { const d = new Date(Date.now() + 60 * 60 * 1000); d.setMinutes(0, 0, 0); return localInputDate(d); };
const defaultEnd = () => { const d = new Date(Date.now() + 3 * 60 * 60 * 1000); d.setMinutes(0, 0, 0); return localInputDate(d); };

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("parkingUser") || "null"); } catch { return null; }
  });
  const [page, setPage] = useState("slots");
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [adminBookings, setAdminBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [selectedSlot, setSelectedSlot] = useState("");
  const [bookingForm, setBookingForm] = useState({ vehicleNumber: "", startTime: defaultStart(), endTime: defaultEnd() });
  const [newSlot, setNewSlot] = useState({ slotNumber: "", type: "CAR", location: "Main Parking" });

  const say = (text, type = "success") => setNotice({ text, type });
  const clearNotice = () => setNotice({ text: "", type: "" });
  const setSession = (data) => {
    localStorage.setItem("parkingToken", data.token);
    localStorage.setItem("parkingUser", JSON.stringify(data.user));
    setUser(data.user);
    setPage("slots");
    say(`Welcome, ${data.user.name}!`);
  };
  const logout = () => {
    localStorage.removeItem("parkingToken"); localStorage.removeItem("parkingUser");
    setUser(null); setBookings([]); setSummary(null); setPage("slots"); say("You have logged out.");
  };

  async function loadSlots() {
    try { const data = await api("/slots"); setSlots(data); }
    catch (e) { say(e.message, "error"); }
  }
  async function loadBookings() {
    if (!user) return;
    try { const data = await api("/bookings/mine"); setBookings(data.bookings); }
    catch (e) { say(e.message, "error"); }
  }
  async function loadAdmin() {
    try { const data = await api("/admin/summary"); setSummary(data.summary); setAdminBookings(data.bookings); }
    catch (e) { say(e.message, "error"); }
  }
  useEffect(() => { loadSlots(); }, []);
  useEffect(() => { if (user) { loadBookings(); if (user.role === "ADMIN") loadAdmin(); } }, [user]);
  useEffect(() => { clearNotice(); }, [page]);

  const durationHours = useMemo(() => {
    const diff = new Date(bookingForm.endTime) - new Date(bookingForm.startTime);
    return diff > 0 ? Math.max(1, Math.ceil(diff / 3600000)) : 0;
  }, [bookingForm.startTime, bookingForm.endTime]);
  const estimate = durationHours * 30;

  async function submitAuth(e) {
    e.preventDefault(); clearNotice(); setLoading(true);
    try {
      const data = await api(`/auth/${authMode}`, { method: "POST", body: JSON.stringify(authForm) });
      setSession(data);
    } catch (e) { say(e.message, "error"); }
    finally { setLoading(false); }
  }
  async function createBooking(e) {
    e.preventDefault(); clearNotice();
    if (!selectedSlot) return say("Please select a parking slot.", "error");
    setLoading(true);
    try {
      const data = await api("/bookings", { method: "POST", body: JSON.stringify({ slotId: selectedSlot, ...bookingForm }) });
      say(`Booking created. Estimated fee: ${money(data.booking.amount)}. You can now record demo payment in Booking History.`);
      setPage("history"); await loadBookings(); await loadSlots();
    } catch (e) { say(e.message, "error"); }
    finally { setLoading(false); }
  }
  async function payDemo(id) {
    try { const data = await api(`/bookings/${id}/pay-demo`, { method: "POST" }); say(data.message); await loadBookings(); if (user?.role === "ADMIN") loadAdmin(); }
    catch (e) { say(e.message, "error"); }
  }
  async function cancelBooking(id) {
    try { const data = await api(`/bookings/${id}/cancel`, { method: "POST" }); say(data.message); await loadBookings(); await loadSlots(); }
    catch (e) { say(e.message, "error"); }
  }
  async function addSlot(e) {
    e.preventDefault();
    try { await api("/slots", { method: "POST", body: JSON.stringify(newSlot) }); setNewSlot({ slotNumber: "", type: "CAR", location: "Main Parking" }); say("Parking slot added."); await loadSlots(); await loadAdmin(); }
    catch (e) { say(e.message, "error"); }
  }
  async function toggleSlot(slot) {
    try { await api(`/slots/${slot._id}`, { method: "PATCH", body: JSON.stringify({ active: !slot.active }) }); say(`Slot ${slot.slotNumber} updated.`); await loadSlots(); await loadAdmin(); }
    catch (e) { say(e.message, "error"); }
  }

  const nav = [
    { id: "slots", label: "Parking slots", icon: ParkingCircle },
    ...(user ? [{ id: "history", label: "Booking history", icon: History }] : []),
    ...(user?.role === "ADMIN" ? [{ id: "admin", label: "Admin dashboard", icon: LayoutDashboard }] : [])
  ];

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setPage("slots")}><span className="brand-icon"><ParkingCircle size={23}/></span><span>Park<span className="brand-accent">Smart</span><small>SMART PARKING MANAGEMENT</small></span></button>
      <nav className="desktop-nav">{nav.map(n => <button key={n.id} className={page === n.id ? "nav-link active" : "nav-link"} onClick={() => setPage(n.id)}><n.icon size={17}/>{n.label}</button>)}</nav>
      <div className="account-area">{user ? <><span className="user-chip">{user.name} <b>{user.role}</b></span><button className="icon-button" title="Log out" onClick={logout}><LogOut size={18}/></button></> : <><button className="btn btn-light btn-small" onClick={() => { setAuthMode("login"); setPage("auth"); }}><LogIn size={16}/> Login</button><button className="btn btn-primary btn-small" onClick={() => { setAuthMode("register"); setPage("auth"); }}><UserPlus size={16}/> Register</button></>}</div>
    </header>

    <main className="container">
      {notice.text && <div className={`notice ${notice.type}`}><span>{notice.text}</span><button onClick={clearNotice}>×</button></div>}
      {page === "slots" && <>
        <section className="hero">
          <div><div className="eyebrow"><span className="live-dot"></span> PARKING MADE SIMPLE</div><h1>Find your spot.<br/><span>Park with ease.</span></h1><p>Reserve a parking space before you arrive. No circling around, no wasted time.</p><div className="hero-actions"><button className="btn btn-primary" onClick={() => document.getElementById("slot-grid")?.scrollIntoView({ behavior: "smooth" })}>Explore parking <span>→</span></button><span className="hero-note"><CheckCircle2 size={16}/> Easy booking · Clear pricing</span></div></div>
          <div className="hero-art"><div className="art-circle"></div><div className="art-card"><div className="art-label">PARKING STATUS <span className="live-pill">LIVE DEMO</span></div><div className="art-slots"><div className="art-slot free"><CarFront/><span>P01</span></div><div className="art-slot busy"><CarFront/><span>P02</span></div><div className="art-slot free"><CarFront/><span>P03</span></div><div className="art-slot free"><Bike/><span>P09</span></div></div><div className="art-legend"><span><i className="legend-free"></i> Available</span><span><i className="legend-busy"></i> Booked now</span></div></div><div className="floating-badge"><CheckCircle2 size={17}/> Your spot awaits</div></div>
        </section>
        <section className="stats-strip"><div><strong>{slots.length}</strong><span>Total active slots</span></div><div><strong>{slots.filter(s => s.availableNow).length}</strong><span>Available right now</span></div><div><strong>₹30</strong><span>Per started hour</span></div><div><strong>24/7</strong><span>Booking access</span></div></section>
        <section id="slot-grid" className="section-block"><div className="section-heading"><div><div className="eyebrow">CHOOSE YOUR SPACE</div><h2>Available parking slots</h2><p>Select a slot to continue with your booking.</p></div><button className="btn btn-light" onClick={loadSlots}><RefreshCw size={16}/> Refresh</button></div>
          <div className="legend-row"><span><i className="legend-free"></i> Available now</span><span><i className="legend-busy"></i> Occupied now</span><span><i className="legend-off"></i> Inactive</span></div>
          {slots.length === 0 ? <div className="empty-state">No active parking slots. Start the server and run the seed command.</div> : <div className="slot-grid">{slots.map(slot => <button key={slot._id} disabled={!slot.active} onClick={() => { setSelectedSlot(slot._id); if (!user) { setAuthMode("login"); setPage("auth"); say("Log in to complete your booking.", "info"); } else { document.getElementById("booking-panel")?.scrollIntoView({ behavior: "smooth", block: "center" }); } }} className={`slot-card ${!slot.active ? "inactive" : slot.availableNow ? "available" : "occupied"} ${selectedSlot === slot._id ? "selected" : ""}`}><div className="slot-top"><span className="slot-icon">{slot.type === "BIKE" ? <Bike/> : <CarFront/>}</span><span className="slot-status">{!slot.active ? "Inactive" : slot.availableNow ? "Available" : "Occupied now"}</span></div><strong>{slot.slotNumber}</strong><span className="slot-location">{slot.location || "Main Parking"}</span><div className="slot-bottom"><span>{slot.type === "BIKE" ? "Bike" : "Car"} parking</span><span>{slot.active ? "Select →" : "Unavailable"}</span></div></button>)}</div>}
        </section>
        <section id="booking-panel" className="booking-panel"><div className="booking-intro"><div className="booking-icon"><CalendarClock size={24}/></div><div className="eyebrow">QUICK RESERVATION</div><h2>Book your parking</h2><p>Choose your time and enter your vehicle registration number. Fee is calculated automatically.</p><div className="price-note"><CircleDollarSign size={19}/><span><b>Simple pricing</b><small>₹30 per started hour · Minimum 1 hour</small></span></div></div>
          <form className="booking-form" onSubmit={createBooking}><label>Selected slot<select value={selectedSlot} onChange={e => setSelectedSlot(e.target.value)} required><option value="">Choose a slot</option>{slots.filter(s => s.active).map(s => <option key={s._id} value={s._id}>{s.slotNumber} · {s.type} · {s.location}</option>)}</select></label><label>Vehicle number<input value={bookingForm.vehicleNumber} onChange={e => setBookingForm({ ...bookingForm, vehicleNumber: e.target.value.toUpperCase() })} placeholder="e.g. KA01AB1234" required maxLength={20}/></label><div className="form-two"><label>Start time<input type="datetime-local" min={localInputDate(new Date())} value={bookingForm.startTime} onChange={e => setBookingForm({ ...bookingForm, startTime: e.target.value })} required/></label><label>End time<input type="datetime-local" min={bookingForm.startTime} value={bookingForm.endTime} onChange={e => setBookingForm({ ...bookingForm, endTime: e.target.value })} required/></label></div><div className="estimate-row"><span>Estimated fee <small>{durationHours ? `${durationHours} hour${durationHours > 1 ? "s" : ""}` : "Check selected time"}</small></span><strong>{money(estimate)}</strong></div><button className="btn btn-primary btn-wide" disabled={loading || !user}>{loading ? "Please wait..." : user ? "Confirm booking →" : "Log in to book →"}</button>{!user && <p className="form-hint">Please log in or register before booking a slot.</p>}</form>
        </section>
      </>}

      {page === "auth" && <section className="auth-wrap"><div className="auth-side"><div className="auth-mark"><ParkingCircle size={34}/></div><div className="eyebrow">WELCOME TO PARKSMART</div><h1>Your parking,<br/>simplified.</h1><p>Book a space in a few clicks and keep all your parking details in one place.</p><div className="auth-benefit"><CheckCircle2/> Easy slot booking</div><div className="auth-benefit"><CheckCircle2/> Transparent price estimate</div><div className="auth-benefit"><CheckCircle2/> Booking history</div></div><form className="auth-form" onSubmit={submitAuth}><div className="eyebrow">{authMode === "login" ? "WELCOME BACK" : "GET STARTED"}</div><h2>{authMode === "login" ? "Log in to your account" : "Create your account"}</h2><p>{authMode === "login" ? "Enter your details to continue." : "A few details and you're ready to park."}</p>{authMode === "register" && <label>Full name<input value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} placeholder="Your name" required/></label>}<label>Email address<input type="email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} placeholder="you@example.com" required/></label><label>Password<input type="password" minLength={6} value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} placeholder="At least 6 characters" required/></label><button className="btn btn-primary btn-wide" disabled={loading}>{loading ? "Please wait..." : authMode === "login" ? "Log in →" : "Create account →"}</button><p className="switch-auth">{authMode === "login" ? "New to ParkSmart?" : "Already registered?"} <button type="button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>{authMode === "login" ? "Create an account" : "Log in"}</button></p><p className="form-hint">Demo admin: admin@parking.com / Admin123!</p></form></section>}

      {page === "history" && <section className="section-block page-section"><div className="section-heading"><div><div className="eyebrow">YOUR ACTIVITY</div><h2>Booking history</h2><p>Review your reservations, fees and payment status.</p></div><button className="btn btn-light" onClick={loadBookings}><RefreshCw size={16}/> Refresh</button></div>{bookings.length === 0 ? <div className="empty-state"><History size={28}/><h3>No bookings yet</h3><p>Your parking reservations will appear here.</p><button className="btn btn-primary" onClick={() => setPage("slots")}>Browse slots</button></div> : <div className="booking-list">{bookings.map(b => <article className="history-card" key={b._id}><div className="history-main"><div className="history-slot-icon">{b.slot?.type === "BIKE" ? <Bike/> : <CarFront/>}</div><div><h3>{b.slot?.slotNumber || "Parking slot"} <span className={`status-tag ${b.status.toLowerCase()}`}>{b.status}</span></h3><p>{b.vehicleNumber} · {b.slot?.location || "Main Parking"}</p><div className="history-dates"><span>From: {new Date(b.startTime).toLocaleString()}</span><span>To: {new Date(b.endTime).toLocaleString()}</span></div></div></div><div className="history-pay"><strong>{money(b.amount)}</strong><span className={`payment-tag ${b.paymentStatus.toLowerCase()}`}>{b.paymentStatus === "PAID" ? "Paid (demo)" : "Payment pending"}</span>{b.paymentStatus !== "PAID" && b.status === "BOOKED" && <button className="btn btn-primary btn-small" onClick={() => payDemo(b._id)}>Confirm demo payment</button>}{b.status === "BOOKED" && new Date(b.startTime) > new Date() && <button className="text-button danger-text" onClick={() => cancelBooking(b._id)}>Cancel booking</button>}</div></article>)}</div>}<p className="form-hint">Demo payment only: this project does not collect real money.</p></section>}

      {page === "admin" && user?.role === "ADMIN" && <section className="section-block page-section"><div className="section-heading"><div><div className="eyebrow">CONTROL CENTER</div><h2>Admin dashboard</h2><p>Overview of parking activity and recent reservations.</p></div><button className="btn btn-light" onClick={loadAdmin}><RefreshCw size={16}/> Refresh</button></div>{summary && <><div className="admin-stats"><div className="admin-stat"><span>Total slots</span><strong>{summary.totalSlots}</strong><small>{summary.activeSlots} active</small></div><div className="admin-stat"><span>Registered users</span><strong>{summary.totalUsers}</strong><small>Customer accounts</small></div><div className="admin-stat"><span>Bookings</span><strong>{summary.totalBookings}</strong><small>{summary.pending} active · {summary.cancelled} cancelled</small></div><div className="admin-stat"><span>Demo revenue</span><strong>{money(summary.revenue)}</strong><small>{summary.paid} paid bookings</small></div></div><div className="admin-layout"><div className="admin-box"><h3>Manage parking slots</h3><form className="add-slot-form" onSubmit={addSlot}><label>Slot ID<input placeholder="e.g. P13" value={newSlot.slotNumber} onChange={e => setNewSlot({ ...newSlot, slotNumber: e.target.value.toUpperCase() })} required/></label><label>Vehicle type<select value={newSlot.type} onChange={e => setNewSlot({ ...newSlot, type: e.target.value })}><option value="CAR">Car</option><option value="BIKE">Bike</option></select></label><label>Location<input value={newSlot.location} onChange={e => setNewSlot({ ...newSlot, location: e.target.value })} required/></label><button className="btn btn-primary">Add slot</button></form><div className="manage-slots">{slots.map(s => <div key={s._id} className="manage-slot"><span><b>{s.slotNumber}</b><small>{s.type} · {s.location}</small></span><button className={`toggle-btn ${s.active ? "on" : ""}`} onClick={() => toggleSlot(s)}>{s.active ? "Active" : "Inactive"}</button></div>)}</div></div><div className="admin-box"><h3>Recent bookings</h3>{adminBookings.length === 0 ? <p className="muted">No bookings yet.</p> : <div className="table-wrap"><table><thead><tr><th>Customer</th><th>Slot</th><th>Fee</th><th>Status</th></tr></thead><tbody>{adminBookings.map(b => <tr key={b._id}><td>{b.user?.name || "User"}<small>{b.user?.email}</small></td><td>{b.slot?.slotNumber || "—"}</td><td>{money(b.amount)}</td><td><span className={`status-tag ${b.status.toLowerCase()}`}>{b.status}</span><small>{b.paymentStatus}</small></td></tr>)}</tbody></table></div>}</div></div></>}</section>}
      {page === "admin" && user?.role !== "ADMIN" && <section className="empty-state"><h2>Admin access only</h2><p>Log in with the demo administrator account to view this page.</p><button className="btn btn-primary" onClick={() => { setAuthMode("login"); setPage("auth"); }}>Log in as admin</button></section>}
    </main>
    <footer><div className="footer-brand"><ParkingCircle size={20}/> Park<span>Smart</span></div><p>Smart Parking Management System · BCA Mini Project</p><p className="footer-small">Demo project · Payment is simulated · © {new Date().getFullYear()}</p></footer>
  </div>;
}
