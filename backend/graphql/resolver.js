const resolvers = {
  Query: {
    ping: () => "pong",

    userById: async (_, { id }) => {
      return User.findById(id).lean();
    },

    tutorProfileByUserId: async (_, { userId }) => {
      return TutorProfile.findOne({ userId }).lean();
    },

    bookingsByStudent: async (_, { studentId }) => {
      const bookings = await Booking.find({ studentId }).sort({ start: 1 }).lean();
      return bookings
        .filter((b) => b.start && b.end)
        .map((b) => ({
          _id: String(b._id),
          title: b.iscompleted ? "Tutoring (Completed)" : "Tutoring",
          start: new Date(b.start).toISOString(),
          end: new Date(b.end).toISOString(),
          studentId: b.studentId ? String(b.studentId) : null,
          tutorId: b.tutorId ? String(b.tutorId) : null,
          iscompleted: !!b.iscompleted,
        }));
    },

    bookingsByTutor: async (_, { tutorId }) => {
      const bookings = await Booking.find({ tutorId }).sort({ start: 1 }).lean();
      return bookings
        .filter((b) => b.start && b.end)
        .map((b) => ({
          _id: String(b._id),
          title: b.iscompleted ? "Tutoring (Completed)" : "Tutoring",
          start: new Date(b.start).toISOString(),
          end: new Date(b.end).toISOString(),
          studentId: b.studentId ? String(b.studentId) : null,
          tutorId: b.tutorId ? String(b.tutorId) : null,
          iscompleted: !!b.iscompleted,
        }));
    },
  },
};
