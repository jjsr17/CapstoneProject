// backend/server.js
console.log("✅ BACKEND server.js loaded");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const { ApolloServer, gql } = require("apollo-server-express");

const connectDB = require("./config/db");

// REST routes
const userRoutes = require("./routes/userRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const courseRoutes = require("./routes/courseRoutes");
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const messageRoutes = require("./routes/messageRoutes");

// Mongoose models
const User = require("./models/User");
const Booking = require("./models/Booking");
const TutorProfile = require("./models/TutorProfile");


const app = express();
const PORT = process.env.PORT || 5000;

/* ---------------- Middleware ---------------- */
app.use(express.json());

const allowedOrigins = [
  "http://localhost:8081",
  "http://localhost:19006",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:19006",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const corsOptions = {
  origin(origin, callback) {
    // allow non-browser tools (no Origin header)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS blocked: " + origin));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* ---------------- REST Routes ---------------- */
app.use("/api/users", userRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/messages", messageRoutes);



console.log(
  "✅ /api/courses routes:",
  courseRoutes.stack
    .filter((l) => l.route)
    .map((l) => Object.keys(l.route.methods)[0].toUpperCase() + " " + l.route.path)
);

app.use("/auth", authRoutes);

/* ---------------- DB ---------------- */
connectDB();

/* ---------------- Health ---------------- */
app.get("/", (req, res) => res.send("API running"));

/* ---------------- Helpers ---------------- */
function getMsClaims(authHeader) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);

  // TEMP: decode without verifying (fine for wiring; verify later via JWKS)
  return jwt.decode(token) || null;
}

/* ---------------- GraphQL ---------------- */
console.log("✅ GRAPHQL TYPEDEFS LOADING");

const typeDefs = gql`
  type EducatorInfo {
    collegeName: String
    degree: String
    concentration: String
    credentialsFileName: String
  }

  type StudentInfo {
    schoolName: String
    educationLevel: String
    grade: String
    collegeYear: String
    concentration: String
    degreeType: String
  }

  type User {
    _id: ID!
    firstName: String
    middleName: String
    lastName: String
    user_email: String
    accountType: String
    educator: EducatorInfo
    student: StudentInfo
    msUpn: String
    msOid: String
    profileComplete: Boolean!
    authProvider: String
  }

  type TutorProfile {
    _id: ID!
    userId: ID!
    subjects: [Int!]!
    tutor_rate: String
    tutor_rating: Float
  }

  type BookingEvent {
    _id: ID!
    title: String!
    start: String!
    end: String!
    studentId: ID
    tutorId: ID
    iscompleted: Boolean
  }

  type Query {
    ping: String!
    schemaCanary: String!
    debugSchemaVersion: String!

    me: User

    bookingsByStudent(studentId: ID!): [BookingEvent!]!
    bookingsByTutor(tutorId: ID!): [BookingEvent!]!
    userById(id: ID!): User
    tutorProfileByUserId(userId: ID!): TutorProfile
  }
`;

const resolvers = {
  Query: {
    ping: () => "pong",
    schemaCanary: () => "schema-canary-v1",
    debugSchemaVersion: () => "sso-v1",

 me: async (_, __, { authHeader }) => {
  const claims = getMsClaims(authHeader);
  if (!claims?.oid) return null;

  const msOid = claims.oid;
  const email =
    (claims.preferred_username || claims.upn || "").toLowerCase() || null;

  const fullName = claims.name || "";
  const parts = fullName.trim().split(/\s+/);
  const firstName = claims.given_name || parts[0] || null;
  const lastName = claims.family_name || parts.slice(1).join(" ") || null;

  // 1) Try match by msOid (best)
  let user = await User.findOne({ msOid }).lean();
  if (user) {
    return { ...user, profileComplete: !!user.profileComplete };
  }

  // 2) If not found, try match by email (this is the missing link)
  if (email) {
    const existingByEmail = await User.findOne({ user_email: email });
    if (existingByEmail) {
      // Link the account to Microsoft
      existingByEmail.msOid = msOid;
      existingByEmail.authProvider = "microsoft";

      // If the user already filled out the profile earlier, keep it complete
      // (or compute it; simplest: set true if they have accountType + names)
      if (existingByEmail.profileComplete !== true) {
        const looksComplete =
          !!existingByEmail.accountType &&
          !!existingByEmail.firstName &&
          !!existingByEmail.lastName &&
          !!existingByEmail.user_email;
        existingByEmail.profileComplete = looksComplete;
      }

      // Fill names if missing
      if (!existingByEmail.firstName && firstName) existingByEmail.firstName = firstName;
      if (!existingByEmail.lastName && lastName) existingByEmail.lastName = lastName;

      await existingByEmail.save();
      return { ...existingByEmail.toObject(), profileComplete: !!existingByEmail.profileComplete };
    }
  }

  // 3) No match at all -> create shell user
  const created = await User.create({
    authProvider: "microsoft",
    msOid,
    user_email: email,
    firstName,
    lastName,
    profileComplete: false,
  });

  return created.toObject();
},

    userById: async (_, { id }) => User.findById(id).lean(),

    tutorProfileByUserId: async (_, { userId }) =>
      TutorProfile.findOne({ userId }).lean(),

    bookingsByStudent: async (_, { studentId }) => {
      const bookings = await Booking.find({ studentId }).lean();
      return bookings
        .filter((b) => b.start && b.end)
        .map((b) => ({
          _id: String(b._id),
          title: b.iscompleted ? "Tutoring (Completed)" : "Tutoring",
          start: new Date(b.start).toISOString(),
          end: new Date(b.end).toISOString(),
          studentId: b.studentId?.toString(),
          tutorId: b.tutorId?.toString(),
          iscompleted: !!b.iscompleted,
        }));
    },

    bookingsByTutor: async (_, { tutorId }) => {
      const bookings = await Booking.find({ tutorId }).lean();
      return bookings
        .filter((b) => b.start && b.end)
        .map((b) => ({
          _id: String(b._id),
          title: b.iscompleted ? "Tutoring (Completed)" : "Tutoring",
          start: new Date(b.start).toISOString(),
          end: new Date(b.end).toISOString(),
          studentId: b.studentId?.toString(),
          tutorId: b.tutorId?.toString(),
          iscompleted: !!b.iscompleted,
        }));
    },
  },
};

/* ---------------- Server Start ---------------- */
async function startServer() {
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: false,
    context: ({ req }) => ({
      authHeader: req.headers.authorization || "",
    }),
  });

  await apolloServer.start();

  // We already configured Express CORS, so disable Apollo middleware CORS
  apolloServer.applyMiddleware({ app, path: "/graphql", cors: false });

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`🚀 GraphQL at http://localhost:${PORT}/graphql`);
  });
}

startServer();
