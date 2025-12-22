const express = require("express");
require("dotenv").config();
const connectDB = require("./config/db");

// Import routes
const userRoutes = require("./routes/userRoutes");
const tutorProfileRoutes = require("./routes/tutorProfileRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const messageRoutes = require("./routes/messageRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const locationRoutes = require("./routes/locationRoutes");

// Initialize Express FIRST
const app = express();
app.use(express.json());

// Connect to database
connectDB();

// Test route
app.get("/", (req, res) => {
  res.send("API running...");
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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
