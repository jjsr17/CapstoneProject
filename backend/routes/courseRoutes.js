// routes/courseRoutes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Booking = require("../models/Booking");

console.log("✅ courseRoutes loaded from:", __filename);

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Parse "HH:MM" (24-hour) into minutes since midnight.
 * Returns null if invalid.
 */
function parseHHMMToMinutes(hhmm) {
  const m = String(hhmm || "")
    .trim()
    .match(/^(\d{1,2}):([0-5]\d)$/);
  if (!m) return null;

  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23) return null;

  return h * 60 + min;
}

/**
 * Generate ISO slots from course.availability template for the next N days.
 * Expects DB fields (24-hour):
 *  - startTime: "12:00"
 *  - endTime:   "18:00"
 * AM/PM fields may exist but are ignored since times are already 24-hour.
 */
function generateSlotsFromTemplate(course, daysAhead, slotMinutes) {
  const template = Array.isArray(course?.availability) ? course.availability : [];
  if (!template.length) return [];

  const now = new Date();
  const results = [];

  for (let d = 0; d <= daysAhead; d++) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(now.getDate() + d);

    const dow = dayNames[date.getDay()];

    for (const block of template) {
      const days = Array.isArray(block?.days) ? block.days : [];
      if (!days.includes(dow)) continue;

      const startMin = parseHHMMToMinutes(block.startTime);
      const endMin = parseHHMMToMinutes(block.endTime);
      if (startMin == null || endMin == null) continue;

      const blockStart = new Date(date);
      blockStart.setHours(0, 0, 0, 0);
      blockStart.setMinutes(startMin);

      const blockEnd = new Date(date);
      blockEnd.setHours(0, 0, 0, 0);
      blockEnd.setMinutes(endMin);

      // Do not allow overnight blocks in this version
      if (blockEnd <= blockStart) continue;

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

  results.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  return results;
}

// ---------------------
// Course Model (inline)
// ---------------------
const CourseSchema = new mongoose.Schema(
  {
    educatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: String,
    subject: String,
    courseName: String,
    courseCode: String,
    description: String,
    availability: Array, // stores objects with startTime/endTime (24-hour), etc.
    createdAt: Date,
  },
  { timestamps: true }
);

const Course = mongoose.models.Course || mongoose.model("Course", CourseSchema);

// ---------------------
// Routes
// ---------------------

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

// GET /api/courses
router.get("/", async (req, res) => {
  try {
    const { educatorId, subject, query, type } = req.query;
    const filter = {};

    if (educatorId && educatorId !== "all") {
      if (!mongoose.Types.ObjectId.isValid(educatorId)) {
        return res.status(400).json({ message: "Invalid educatorId" });
      }
      filter.educatorId = educatorId;
    }

    if (subject) filter.subject = subject;
    if (type) filter.type = type;

    if (query) {
      filter.courseName = { $regex: query, $options: "i" };
    }

    const courses = await Course.find(filter).sort({ createdAt: -1 }).lean();
    res.json(courses);
  } catch (err) {
    console.error("GET /api/courses failed:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/courses/:id  (used by Booking page)
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

// GET /api/courses/:id/available-slots?daysAhead=14&slotMinutes=60
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

    // 1) generate candidate slots from course.availability
    const slots = generateSlotsFromTemplate(course, daysAhead, slotMinutes);

    if (!slots.length) {
      return res.json({
        courseId: String(course._id),
        tutorId: String(course.educatorId),
        slotMinutes,
        availableSlots: [],
      });
    }

    // 2) fetch existing bookings that overlap this date range
    const rangeStart = new Date(slots[0].start);
    const rangeEnd = new Date(slots[slots.length - 1].end);

    const bookings = await Booking.find({
      tutorId: course.educatorId,
      start: { $lt: rangeEnd },
      end: { $gt: rangeStart },
      iscompleted: false,
    }).lean();

    // 3) filter out slots that overlap existing bookings
    const available = slots.filter((s) => {
      const sStart = Date.parse(s.start);
      const sEnd = Date.parse(s.end);

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

module.exports = router;