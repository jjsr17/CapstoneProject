const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Booking = require("../models/Booking");

console.log("✅ courseRoutes loaded from:", __filename);
// Simple Course schema (inline or move to models later)

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function to24Hour(hourStr, ampm) {
  let h = Number(hourStr);
  const A = (ampm || "").toUpperCase();

  if (A === "AM") {
    if (h === 12) h = 0;
  } else if (A === "PM") {
    if (h !== 12) h += 12;
  }
  return h;
}

function generateSlotsFromTemplate(course, daysAhead, slotMinutes) {
  const template = Array.isArray(course.availability) ? course.availability : [];
  if (template.length === 0) return [];

  const now = new Date();
  const results = [];

  for (let d = 0; d <= daysAhead; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() + d);

    const dow = dayNames[date.getDay()];

    for (const block of template) {
      const days = Array.isArray(block.days) ? block.days : [];
      if (!days.includes(dow)) continue;

      const startHour = to24Hour(block.start, block.startAMPM);
      const endHour = to24Hour(block.end, block.endAMPM);

      // build start/end for that date
      const blockStart = new Date(date);
      blockStart.setHours(startHour, 0, 0, 0);

      const blockEnd = new Date(date);
      blockEnd.setHours(endHour, 0, 0, 0);

      // If end is earlier than start, assume it crosses midnight (optional)
      if (blockEnd <= blockStart) blockEnd.setDate(blockEnd.getDate() + 1);

      // Split into slotMinutes chunks
      let cursor = new Date(blockStart);
      while (cursor.getTime() + slotMinutes * 60000 <= blockEnd.getTime()) {
        const slotStart = new Date(cursor);
        const slotEnd = new Date(cursor.getTime() + slotMinutes * 60000);

        results.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          mode: block.mode || "Online",
          location: block.location || "",
          days: block.days || [],
        });

        cursor = slotEnd;
      }
    }
  }

  // sort by time
  results.sort((a, b) => new Date(a.start) - new Date(b.start));
  return results;
}

const CourseSchema = new mongoose.Schema(
  {
    educatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: String,
    subject: String,
    courseName: String,
    courseCode: String,
    description: String,
    availability: Array,
    createdAt: Date,
  },
  { timestamps: true }
);

const Course = mongoose.models.Course || mongoose.model("Course", CourseSchema);

// POST /api/courses
router.post("/", async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (err) {
    console.error("Create course error:", err);
    res.status(400).json({ message: err.message });
  }
});
router.get("/:id/available-slots", async (req, res) => {
  try {
    const { id } = req.params;

    const daysAhead = Number(req.query.daysAhead || 14);
    const slotMinutes = 60;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(id).lean();
    if (!course) return res.status(404).json({ message: "Course not found" });

    const allSlots = generateSlotsFromTemplate(course.availability || [], daysAhead, slotMinutes);

    // If no template, return empty list
    if (allSlots.length === 0) {
      return res.json({ courseId: String(course._id), slotMinutes, availableSlots: [] });
    }

    // Query bookings for the tutor across the generated time window
    const rangeStart = new Date(allSlots[0].start);
    const rangeEnd = new Date(allSlots[allSlots.length - 1].end);

    const bookings = await Booking.find({
      tutorId: course.educatorId, // your Course schema uses educatorId
      start: { $lt: rangeEnd },
      end: { $gt: rangeStart },
    }).lean();

    // Filter out overlaps: slotStart < bookingEnd && slotEnd > bookingStart
    const availableSlots = allSlots.filter((s) => {
      const sStart = new Date(s.start).getTime();
      const sEnd = new Date(s.end).getTime();
      return !bookings.some((b) => {
        const bStart = new Date(b.start).getTime();
        const bEnd = new Date(b.end).getTime();
        return sStart < bEnd && sEnd > bStart;
      });
    });

    return res.json({
      courseId: String(course._id),
      tutorId: String(course.educatorId),
      slotMinutes,
      availableSlots,
    });
  } catch (err) {
    console.error("available-slots error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/courses/:id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Course.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Course not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ message: "Invalid id", error: err.message });
  }
});

// GET /api/courses
// GET /api/courses/:id  ✅ Needed by Booking page
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const course = await Course.findById(id).lean();
    if (!course) return res.status(404).json({ message: "Course not found" });

    res.json(course);
  } catch (err) {
    console.error("GET /api/courses/:id failed:", err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/:id/available-slots", async (req, res) => {
  try {
    const { id } = req.params;
    const daysAhead = Number(req.query.daysAhead || 14);
    const slotMinutes = Number(req.query.slotMinutes || 60);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(id).lean();
    if (!course) return res.status(404).json({ message: "Course not found" });

    // 1) generate candidate slots from course.availability (template)
    const slots = generateSlotsFromTemplate(course, daysAhead, slotMinutes);

    // 2) fetch existing bookings that overlap this date range
    const rangeStart = slots.length ? new Date(slots[0].start) : new Date();
    const rangeEnd = slots.length ? new Date(slots[slots.length - 1].end) : new Date();

    const bookings = await Booking.find({
      tutorId: course.educatorId,               // tutor is educatorId
      start: { $lt: rangeEnd },
      end: { $gt: rangeStart },
      iscompleted: false,
    }).lean();

    // 3) filter out slots that overlap existing bookings
    const available = slots.filter((s) => {
      const sStart = new Date(s.start).getTime();
      const sEnd = new Date(s.end).getTime();
      return !bookings.some((b) => {
        const bStart = new Date(b.start).getTime();
        const bEnd = new Date(b.end).getTime();
        return sStart < bEnd && sEnd > bStart; // overlap
      });
    });

    res.json({
      courseId: String(course._id),
      tutorId: String(course.educatorId),
      slotMinutes,
      availableSlots: available,
    });
  } catch (err) {
    console.error("available-slots error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/courses
router.get("/", async (req, res) => {
  try {
    const { educatorId, subject, query, type } = req.query;
    let filter = {};

    // educator filter
    if (educatorId && educatorId !== "all") {
      if (!mongoose.Types.ObjectId.isValid(educatorId)) {
        return res.status(400).json({ message: "Invalid educatorId" });
      }
      filter.educatorId = educatorId;
    }

    // subject filter (from buttons)
    if (subject) {
      filter.subject = subject;
    }

    // tutoring / discussion filter
    if (type) {
      filter.type = type;
    }

    // text search (course name)
    if (query) {
      filter.courseName = { $regex: query, $options: "i" };
    }

    const courses = await Course.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json(courses);
  } catch (err) {
    console.error("GET /api/courses failed:", err);
    res.status(500).json({ message: "Server error" });
  }
});
function to24Hour(hourStr, ampm) {
  let h = Number(hourStr);
  const A = (ampm || "").toUpperCase();

  if (A === "AM") {
    if (h === 12) h = 0;
  } else if (A === "PM") {
    if (h !== 12) h += 12;
  }
  return h;
}

function generateSlotsFromTemplate(template, daysAhead, slotMinutes) {
  const results = [];
  const now = new Date();

  for (let d = 0; d <= daysAhead; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() + d);

    const dow = dayNames[date.getDay()];

    for (const block of template) {
      const days = Array.isArray(block.days) ? block.days : [];
      if (!days.includes(dow)) continue;

      // Your DB fields: start, startAMPM, end, endAMPM (as strings like "12", "AM")
      const startHour = to24Hour(block.start, block.startAMPM);
      const endHour = to24Hour(block.end, block.endAMPM);

      const blockStart = new Date(date);
      blockStart.setHours(startHour, 0, 0, 0);

      const blockEnd = new Date(date);
      blockEnd.setHours(endHour, 0, 0, 0);

      // If end is <= start, assume it crosses midnight
      if (blockEnd <= blockStart) blockEnd.setDate(blockEnd.getDate() + 1);

      // Split into 60-minute chunks
      let cursor = new Date(blockStart);
      while (cursor.getTime() + slotMinutes * 60000 <= blockEnd.getTime()) {
        const slotStart = new Date(cursor);
        const slotEnd = new Date(cursor.getTime() + slotMinutes * 60000);

        results.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          mode: block.mode || "Online",
          location: block.location || "",
        });

        cursor = slotEnd;
      }
    }
  }

  results.sort((a, b) => new Date(a.start) - new Date(b.start));
  return results;
}

module.exports = router;
