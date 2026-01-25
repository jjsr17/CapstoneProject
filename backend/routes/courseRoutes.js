const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Simple Course schema (inline or move to models later)
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


module.exports = router;
