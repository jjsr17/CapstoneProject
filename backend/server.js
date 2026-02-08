// backend/server.js
console.log("✅ BACKEND server.js loaded");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { ApolloServer, gql } = require("apollo-server-express");

const connectDB = require("./config/db");

// Models
const User = require("./models/User");
const Session = require("./models/Session");
const Booking = require("./models/Booking");

// Routes
const userRoutes = require("./routes/userRoutes");
const tutorProfileRoutes = require("./routes/tutorProfileRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const messageRoutes = require("./routes/messageRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const locationRoutes = require("./routes/locationRoutes");
const authRoutes = require("./routes/authRoutes");



const app = express();
const PORT = process.env.PORT || 5000;

/** ---------------------------------------------------
 * Middleware
 * -------------------------------------------------- */
app.use(express.json({ limit: "2mb" }));
app.use("/auth", authRoutes);

// Helpful debug header
app.use((req, res, next) => {
  res.setHeader("X-Inov8r-Backend", "serverjs");
  next();
});

// CORS (allow Expo web, Vite, and local dev ports)
const allowedOrigins = new Set([
  "http://localhost:5173",  // Vite
  "http://localhost:8081",  // your older web port
  "http://localhost:19006", // Expo web default sometimes
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:19006",
]);

app.use(
  cors({
    origin: (origin, cb) => {
      // allow curl/postman (no origin) + same-origin
      if (!origin) return cb(null, true);

      // allow exact matches
      if (allowedOrigins.has(origin)) return cb(null, true);

      // allow LAN origins in dev (Expo Go/device webview)
      // e.g. http://192.168.86.240:19006 or :8081
      if (/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/.test(origin)) {
        return cb(null, true);
      }

      return cb(new Error(`CORS blocked origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false, // set true only if you use cookies
  })
);

// Preflight
app.options("*", cors());

/** ---------------------------------------------------
 * DB
 * -------------------------------------------------- */
connectDB();

/** ---------------------------------------------------
 * Health
 * -------------------------------------------------- */
app.get("/", (req, res) => res.status(200).send("API running..."));
app.get("/health", (req, res) => res.json({ ok: true }));

/** ---------------------------------------------------
 * Microsoft SSO login
 * -------------------------------------------------- */
/**
 * IMPORTANT NOTE:
 * This decodes the ID token but does NOT verify signature.
 * For production you should verify using MS JWKS.
 */
function decodeJwtPayload(idToken) {
  const parts = String(idToken).split(".");
  if (parts.length < 2) return null;
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "===".slice((base64.length + 3) % 4);
  const json = Buffer.from(padded, "base64").toString("utf8");
  return JSON.parse(json);
}

function splitName(displayName) {
  const name = String(displayName || "").trim();
  if (!name) return { firstName: "Microsoft", lastName: "User" };
  const parts = name.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "User" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

app.post("/auth/ms-login", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) return res.status(401).json({ ok: false, message: "Missing Bearer token" });

    const idToken = m[1];
    const payload = decodeJwtPayload(idToken);
    if (!payload) return res.status(400).json({ ok: false, message: "Invalid ID token" });

    // These commonly exist in MS ID tokens
    const email =
      payload.preferred_username ||
      payload.email ||
      payload.upn ||
      (Array.isArray(payload.emails) ? payload.emails[0] : null);

    const displayName = payload.name || payload.given_name || "Microsoft User";

    if (!email) {
      return res.status(400).json({
        ok: false,
        message: "Token missing email/preferred_username",
        tokenKeys: Object.keys(payload),
      });
    }

    // Try to find user by your schema field: user_email
    let user = await User.findOne({ user_email: String(email).toLowerCase().trim() });

    // If not found, create a minimal user (accountType required by your schema)
    if (!user) {
      const { firstName, lastName } = splitName(displayName);

      user = await User.create({
        accountType: "student", // default; you can change later via profile
        firstName,
        lastName,
        user_email: String(email).toLowerCase().trim(),
        // optional: store tenantId or ms oid if you add it later
      });
    }

    return res.json({
      ok: true,
      user: {
        _id: user._id.toString(),
        accountType: user.accountType,
        user_email: user.user_email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error("❌ ms-login error:", err);
    return res.status(500).json({ ok: false, message: "ms-login crashed", error: err.message });
  }
});

/** ---------------------------------------------------
 * REST routes
 * -------------------------------------------------- */
app.use("/api/users", userRoutes);
app.use("/api/tutorprofiles", tutorProfileRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/locations", locationRoutes);

/** ---------------------------------------------------
 * GraphQL
 * -------------------------------------------------- */
const typeDefs = gql`
  type SessionEvent {
    _id: ID!
    title: String!
    start: String!
    end: String!
    bookingId: ID!
    roomId: String
    mode: Int
  }

  type Query {
    ping: String!
    sessionsByStudent(studentId: ID!): [SessionEvent!]!
    sessionsByTutor(tutorId: ID!): [SessionEvent!]!
  }
`;

const resolvers = {
  Query: {
    ping: () => "pong",

    sessionsByTutor: async (_, { tutorId }) => {
      const bookings = await Booking.find({ tutorId }).select("_id").lean();
      const bookingIds = bookings.map((b) => b._id);
      if (!bookingIds.length) return [];

      const sessions = await Session.find({ bookingId: { $in: bookingIds } })
        .sort({ createdAt: -1 })
        .lean();

      return sessions.map((s) => {
        const start = new Date(s.createdAt);
        const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour placeholder
        return {
          _id: String(s._id),
          title: "Tutoring Session",
          start: start.toISOString(),
          end: end.toISOString(),
          bookingId: String(s.bookingId),
          roomId: s.roomId || null,
          mode: s.mode ?? null,
        };
      });
    },

    sessionsByStudent: async (_, { studentId }) => {
      const bookings = await Booking.find({ studentId }).select("_id").lean();
      const bookingIds = bookings.map((b) => b._id);
      if (!bookingIds.length) return [];

      const sessions = await Session.find({ bookingId: { $in: bookingIds } })
        .sort({ createdAt: -1 })
        .lean();

      return sessions.map((s) => {
        const start = new Date(s.createdAt);
        const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour placeholder
        return {
          _id: String(s._id),
          title: "Tutoring Session",
          start: start.toISOString(),
          end: end.toISOString(),
          bookingId: String(s.bookingId),
          roomId: s.roomId || null,
          mode: s.mode ?? null,
        };
      });
    },
  },
};

async function startServer() {
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({
    app,
    path: "/graphql",
    cors: false, // we already handle CORS globally
  });

  // 404 after everything is registered
  app.use((req, res) => res.status(404).json({ message: "Route not found" }));

  // Error handler
  app.use((err, req, res, next) => {
    console.error("❌ Express error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🚀 GraphQL ready at http://localhost:${PORT}${apolloServer.graphqlPath}`);
  });
}

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
