const jwt = require("jsonwebtoken");

// Mongoose models (adjust paths/names)
const User = require("./models/User");
const TutorProfile = require("./models/TutorProfile");
const Booking = require("./models/Booking");
const Subject = require("./models/Subject");


// -----------------------
// Helpers
// -----------------------
const getMsClaims = (authHeader) => {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);
  return jwt.decode(token) || null; // TEMP decode only
};

const toId = (v) => (v ? String(v) : null);

const toISO = (d) => {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  return isNaN(dt.getTime()) ? null : dt.toISOString();
};

const mapBookingToEvent = (b) => {
  const start = toISO(b.start);
  const end = toISO(b.end);
  if (!start || !end) return null;

  return {
    _id: String(b._id),
    title: b.iscompleted ? "Tutoring (Completed)" : "Tutoring",
    start,
    end,
    studentId: toId(b.studentId),
    tutorId: toId(b.tutorId),
    iscompleted: !!b.iscompleted,
  };
};

const buildCourseFilter = ({ query, subject, type }) => {
  const filter = {};

  if (subject) {
    // exact match ignoring case
    filter.subject = new RegExp(`^${escapeRegExp(subject)}$`, "i");
  }

  if (type) filter.type = type;

  if (query && query.trim()) {
    const q = query.trim();
    filter.$or = [
      { subject: new RegExp(q, "i") },
      { courseName: new RegExp(q, "i") },
      { description: new RegExp(q, "i") },
    ];
  }

  return filter;
};

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// -----------------------
// Resolvers
// -----------------------
const resolvers = {
  Query: {
    ping: () => "pong",
    debugSchemaVersion: () => "sso-v1",

    me: async (_, __, { authHeader }) => {
  const claims = getMsClaims(authHeader);
  
  if (!claims?.oid) return null;

  const msOid = String(claims.oid);
  
  const tokenEmail = String(
    claims.preferred_username || claims.upn || claims.email || ""
  )
    .trim()
    .toLowerCase();

  // 1) Fast path: already linked
  let user = await User.findOne({ msOid }).lean();
  if (user) return { ...user, profileComplete: !!user.profileComplete };

  // 2) Link path: match an existing local user by email (case-insensitive)
  if (tokenEmail) {
    const existing = await User.findOne({
      user_email: new RegExp(`^${escapeRegExp(tokenEmail)}$`, "i"),
    });

    if (existing) {
      // ✅ Link this account to MS identity
      existing.msOid = msOid;
      existing.msUpn = tokenEmail;

      // Don't clobber local auth — keep it "local" if they already have a password
      // (Optional) if you prefer to mark that MS is now linked:
      // existing.authProvider = "microsoft";

      await existing.save();

      const linked = existing.toObject();
      return { ...linked, profileComplete: !!linked.profileComplete };
          }
        }

        // 3) Not found -> no user yet (signup flow)
        return null;
      },


    userById: async (_, { id }) => User.findById(id).lean(),

    tutorProfileByUserId: async (_, { userId }) =>
      TutorProfile.findOne({ userId }).lean(),

    bookingsByStudent: async (_, { studentId }) => {
      const bookings = await Booking.find({ studentId }).lean();
      return bookings.map(mapBookingToEvent).filter(Boolean);
    },

    bookingsByTutor: async (_, { tutorId }) => {
      const bookings = await Booking.find({ tutorId }).lean();
      return bookings.map(mapBookingToEvent).filter(Boolean);
    },

    // -----------------------
    // Courses (NEW)
    // -----------------------
          courseById: async (_, { id }) => {
        return Subject.findById(id).lean();
      },

      courses: async (_, args) => {
        const filter = buildCourseFilter(args);
        return Subject.find(filter).lean();
      },

        },

  Mutation: {
   completeProfile: async (_, { input }, { authHeader }) => {
  const claims = getMsClaims(authHeader);
  if (!claims?.oid) throw new Error("Not authenticated");

  const msOid = String(claims.oid);

  const email = String(
    claims.preferred_username || claims.upn || claims.email || ""
  )
    .trim()
    .toLowerCase();

  if (!email) throw new Error("Microsoft token missing email/UPN");

  // 1) find by msOid
  let user = await User.findOne({ msOid });

  // 2) else link by email
  if (!user) {
    user = await User.findOne({
      user_email: new RegExp(`^${escapeRegExp(email)}$`, "i"),
    });
  }

  // 3) else create shell
  if (!user) user = new User({ user_email: email });

  // Link MS identity
  user.msOid = msOid;
  user.msUpn = email;
  user.teamsEnabled = true;
  user.timeZone = "America/Puerto_Rico";

  // If they already had local auth, keep it; otherwise mark microsoft
  user.authProvider = user.passwordHash ? "local" : "microsoft";

  // Apply submitted profile fields
  user.accountType = input.accountType;
  user.firstName = input.firstName;
  user.lastName = input.lastName;
  user.phone = input.phone || "";

  user.profileComplete = true;

  await user.save();
  return user.toObject();
},
  },
};

module.exports = resolvers;
