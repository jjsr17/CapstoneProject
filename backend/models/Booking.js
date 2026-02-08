const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    tenantId: { type: Number },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    tutorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    start: { type: Date, required: true },
    end: { type: Date, required: true },

    teamsMeetingId: { type: String },
    teamsJoinUrl: { type: String },
    teamsOrganizerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    teamsOrganizerUpn: { type: String },


    iscompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", BookingSchema);
