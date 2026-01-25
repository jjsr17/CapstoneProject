// backend/server.js
console.log("✅ BACKEND server.js loaded");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { ApolloServer, gql } = require("apollo-server-express");
const connectDB = require("./config/db");

// Routes (✅ ADD THIS BACK)
const userRoutes = require("./routes/userRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const courseRoutes = require("./routes/courseRoutes");
const authRoutes = require("./routes/authRoutes");



const User = require("./models/User");
const Booking = require("./models/Booking");
const TutorProfile = require("./models/TutorProfile");

const app = express();
const PORT = process.env.PORT || 5000;

/* ---------------- Middleware ---------------- */
app.use(express.json());

// IMPORTANT: if you use Vite on 5173, allow it
const allowedOrigins = [
  "http://localhost:8081",
  "http://localhost:19006",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:19006",

  // keep Vite too if you still use it
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow non-browser tools / mobile apps (no Origin header)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error("CORS blocked: " + origin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// handle OPTIONS preflight for all routes
app.options("*", cors());

/* ---------------- REST Routes (✅ ADD THIS BACK) ---------------- */
app.use("/api/users", userRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/courses", courseRoutes);
app.use("/auth", authRoutes);

/* ---------------- DB ---------------- */
connectDB();

/* ---------------- Health ---------------- */
app.get("/", (req, res) => res.send("API running"));

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
    userById(id: ID!): User
    tutorProfileByUserId(userId: ID!): TutorProfile
    bookingsByStudent(studentId: ID!): [BookingEvent!]!
    bookingsByTutor(tutorId: ID!): [BookingEvent!]!
  }
`;

const resolvers = {
  Query: {
    ping: () => "pong",

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
  const apolloServer = new ApolloServer({ typeDefs, resolvers });
  await apolloServer.start();

  apolloServer.applyMiddleware({ app, path: "/graphql" });

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`🚀 GraphQL at http://localhost:${PORT}/graphql`);
  });
}

startServer();
