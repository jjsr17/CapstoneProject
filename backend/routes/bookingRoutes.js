const express = require("express");
const mongoose = require("mongoose");
const { DateTime } = require("luxon");

const Booking = require("../models/Booking");
const User = require("../models/User");
const { createTeamsMeetingEvent } = require("../services/teamsMeetings");

const router = express.Router();

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function parseDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Graph /events with timeZone expects local time *without offset*
 * Example: "2026-02-05T13:00:00" + timeZone "America/Puerto_Rico"
 */
function toLocalNoOffset(dateObj, timeZone) {
  return DateTime.fromJSDate(dateObj, { zone: "utc" })
    .setZone(timeZone)
    .toFormat("yyyy-MM-dd'T'HH:mm:ss");
}

/**
 * Choose who should be the Teams meeting organizer.
 * Policy:
 * 1) tutor if teamsEnabled
 * 2) student if teamsEnabled
 * 3) none
 */
function pickTeamsOrganizer({ tutor, student }) {
  const candidates = [tutor, student];

  for (const u of candidates) {
    if (!u) continue;
    if (!u.teamsEnabled) continue;

    // organizer identifier Graph accepts: UPN/email OR AAD id
    const organizer = u.msUpn || u.msUserId || u.user_email || null;
    if (!organizer) continue;

    return {
      organizer,
      organizerUser: u,
      timeZone: u.timeZone || "America/Puerto_Rico",
    };
  }

  return null;
}

// GET /api/bookings
router.get("/", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 }).lean();
    res.json(bookings);
  } catch (err) {
    console.error("GET /api/bookings error:", err);
    res.status(500).json({ error: "Failed to load bookings" });
  }
});

// POST /api/bookings
router.post("/", async (req, res) => {
  try {
    const { tenantId, studentId, tutorId, start, end } = req.body || {};

    if (!studentId || !tutorId) {
      return res.status(400).json({ error: "studentId and tutorId are required" });
    }
    if (!isValidObjectId(studentId) || !isValidObjectId(tutorId)) {
      return res.status(400).json({ error: "Invalid studentId or tutorId" });
    }

    const startDate = parseDate(start);
    const endDate = parseDate(end);

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "start/end must be valid date strings (ISO recommended)" });
    }
    if (endDate <= startDate) {
      return res.status(400).json({ error: "end must be after start" });
    }

    // Prevent double booking
    const conflict = await Booking.findOne({
      tutorId,
      start: { $lt: endDate },
      end: { $gt: startDate },
    }).lean();

    if (conflict) {
      return res.status(409).json({ error: "This time slot is already booked." });
    }

    // Load both users (tutor + student) to decide organizer
    const [tutor, student] = await Promise.all([
      User.findById(tutorId).lean(),
      User.findById(studentId).lean(),
    ]);

    // Create booking first (so Teams failure doesn't cancel booking)
    const booking = await Booking.create({
      tenantId: tenantId ?? null,
      studentId,
      tutorId,
      start: startDate,
      end: endDate,
      iscompleted: false,
      teamsMeetingId: null,
      teamsJoinUrl: null,

      // optional metadata
      teamsOrganizerId: null,
      teamsOrganizerUpn: null,
    });

    // If either person is Teams-enabled, create Teams meeting event
    const picked = pickTeamsOrganizer({ tutor, student });

    if (picked) {
      const { organizer, organizerUser, timeZone } = picked;

      try {
        const startLocal = toLocalNoOffset(startDate, timeZone);
        const endLocal = toLocalNoOffset(endDate, timeZone);

        const meeting = await createTeamsMeetingEvent({
          organizer,
          startLocal,
          endLocal,
          timeZone,
        });

        await Booking.findByIdAndUpdate(
          booking._id,
          {
            $set: {
              teamsMeetingId: meeting.eventId,
              teamsJoinUrl: meeting.joinUrl,
              teamsOrganizerId: organizerUser?._id || null,
              teamsOrganizerUpn: organizer,
            },
          },
          { new: true }
        );
      } catch (e) {
        console.error("Teams event creation failed:", e?.message || e);
        // continue: booking remains valid without Teams link
      }
    }

    const saved = await Booking.findById(booking._id).lean();
    return res.status(201).json(saved);
  } catch (err) {
    console.error("POST /api/bookings error:", err);
    return res.status(500).json({
      error: err?.message || "Server error",
    });
  }
});

module.exports = router;
