const express = require("express");
const Booking = require("../models/Booking");
const { createTeamsMeeting } = require("../services/teamsMeetings");

const router = express.Router();

router.get("/", async (req, res) => {
  const bookings = await Booking.find();
  res.json(bookings);
});

router.post("/", async (req, res) => {
  try {
    const { tenantId, studentId, tutorId, start, end, iscompleted } = req.body;

    if (!studentId || !tutorId) {
      return res.status(400).json({ error: "studentId and tutorId are required" });
    }
    if (!start || !end) {
      return res.status(400).json({ error: "start and end are required for a scheduled booking" });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "start/end must be valid date strings (ISO recommended)" });
    }
    if (endDate <= startDate) {
      return res.status(400).json({ error: "end must be after start" });
    }

    // ✅ Create Teams meeting FIRST
    const meeting = await createTeamsMeeting({
      subject: "Noesis Tutoring Session",
      startISO: startDate.toISOString(),
      endISO: endDate.toISOString(),
    });

    // ✅ Save booking with meeting info
    const booking = await Booking.create({
      tenantId,
      studentId,
      tutorId,
      start: startDate,
      end: endDate,
      iscompleted: !!iscompleted,

      teamsMeetingId: meeting.meetingId,
      teamsJoinUrl: meeting.joinUrl,
    });

    return res.status(201).json(booking);
  } catch (err) {
    console.error("Create booking error:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
