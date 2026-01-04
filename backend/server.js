// backend/server.js
console.log("✅ BACKEND server.js loaded");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

// Routes
const userRoutes = require("./routes/userRoutes");
const tutorProfileRoutes = require("./routes/tutorProfileRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const messageRoutes = require("./routes/messageRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const locationRoutes = require("./routes/locationRoutes");

const app = express();

// Parse JSON
app.use(express.json());

// ✅ CORS: allow your actual frontend origins
const corsOptions = {
  origin: ["http://localhost:8081", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false, // set true only if you use cookies
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));


// DB
connectDB();

// Health
app.get("/", (req, res) => res.status(200).send("API running..."));
app.get("/health", (req, res) => res.json({ ok: true }));

// ✅ TODO: add the route you're calling (temporary stub)
app.post("/auth/ms-login", (req, res) => {
  // You'll verify token here later
  res.json({ ok: true, user: { from: "ms-login stub" } });
});

// API routes
app.use("/api/users", userRoutes);
app.use("/api/tutorprofiles", tutorProfileRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/locations", locationRoutes);

// 404
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error", error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
