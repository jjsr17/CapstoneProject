import { useEffect, useMemo, useState } from "react";
import "./courseoffering.css";

const API_BASE = "http://localhost:5000";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const emptyAvailability = () => ({
  days: [],
  start: "",
  startAMPM: "AM",
  end: "",
  endAMPM: "AM",
  mode: "Online",
  location: "",
});

function trimStr(v) {
  return typeof v === "string" ? v.trim() : "";
}

export default function CourseOffering() {
  // ===== Subjects (Mongo via REST) =====
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState("");

  // We store selected subject by NAME (simpler for your current course payload)
  const [subject, setSubject] = useState("");
  const [otherCategory, setOtherCategory] = useState("");

  // ===== Offering fields =====
  const [type, setType] = useState(""); // "tutoring" | "discussion"
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");

  const [availability, setAvailability] = useState([emptyAvailability()]);
  const [submitting, setSubmitting] = useState(false);

  // ===== Load subjects once =====
  useEffect(() => {
    let alive = true;

    async function loadSubjects() {
      setSubjectsLoading(true);
      setSubjectsError("");

      try {
        const res = await fetch(`${API_BASE}/api/subjects`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!alive) return;

        const list = Array.isArray(data) ? data : [];
        setSubjects(list);

        // Default selection: first subject if none chosen yet
        if (!subject && list.length > 0) {
          setSubject(list[0]?.subject_name ?? "");
        }
      } catch (err) {
        if (!alive) return;
        console.error("Subject load failed:", err);
        setSubjects([]);
        setSubjectsError("Failed to load subjects. Is backend running on :5000?");
      } finally {
        if (alive) setSubjectsLoading(false);
      }
    }

    loadSubjects();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finalSubject = useMemo(() => {
    if (subject === "Other") return trimStr(otherCategory) || "Other";
    return subject;
  }, [subject, otherCategory]);

  // ===== Availability helpers =====
  function updateAvailability(index, field, value) {
    setAvailability((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  }

  function toggleDay(index, day) {
    setAvailability((prev) =>
      prev.map((a, i) => {
        if (i !== index) return a;
        const days = a.days.includes(day)
          ? a.days.filter((d) => d !== day)
          : [...a.days, day];
        return { ...a, days };
      })
    );
  }

  function addAvailability() {
    setAvailability((prev) => [...prev, emptyAvailability()]);
  }

  function removeAvailability(index) {
    setAvailability((prev) => {
      if (prev.length === 1) {
        alert("You must have at least one availability.");
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  }

  function goBack() {
    window.history.back();
  }

  // ===== Validation =====
  function validate() {
    if (!type) return "Please select Course Tutoring or Course Discussion.";
    if (!trimStr(courseName)) return "Please enter a course name.";
    if (!finalSubject) return "Please select a subject.";

    for (let i = 0; i < availability.length; i++) {
      const a = availability[i];

      if (!a.days?.length) return `Availability #${i + 1}: pick at least one day.`;
      if (!trimStr(a.start) || !trimStr(a.end))
        return `Availability #${i + 1}: start and end time are required.`;

      if (a.mode === "IRL" && !trimStr(a.location))
        return `Availability #${i + 1}: location is required for IRL.`;
    }

    return null;
  }

  // ===== Create offering =====
  async function createOffering() {
    const err = validate();
    if (err) {
      alert(err);
      return;
    }

    const educatorId =
      localStorage.getItem("mongoUserId") || localStorage.getItem("userId") || null;

    const payload = {
      type,
      subject: finalSubject,
      courseName: trimStr(courseName),
      courseCode: trimStr(courseCode),
      description: trimStr(description),
      availability: availability.map((a) => ({
        days: a.days,
        start: trimStr(a.start),
        startAMPM: a.startAMPM,
        end: trimStr(a.end),
        endAMPM: a.endAMPM,
        mode: a.mode,
        location: trimStr(a.location),
      })),
      educatorId,
      createdAt: new Date().toISOString(),
    };

    try {
      setSubmitting(true);

      // ✅ Your backend should now have /api/courses
      const res = await fetch(`${API_BASE}/api/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to create offering (${res.status}) ${text}`);
      }

      window.location.href = "/educatoraccount";
    } catch (e) {
      console.error(e);
      alert("Failed to create offering. Check console for details.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="top-bar">
        <button className="back-btn" onClick={goBack}>
          ← Back
        </button>
        <div className="site-title">Noesis</div>
      </div>

      <div className="container">
        <div className="box">
          <h2>Create Course Offering</h2>

          {/* Type */}
          <div className="offer-item">
            <label>Type of Offering</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  checked={type === "tutoring"}
                  onChange={() => setType("tutoring")}
                />{" "}
                Course Tutoring
              </label>
              <label>
                <input
                  type="radio"
                  checked={type === "discussion"}
                  onChange={() => setType("discussion")}
                />{" "}
                Course Discussion
              </label>
            </div>
          </div>

          {/* Subject (Mongo-driven) */}
          <div className="offer-item">
            <label>Subject Category</label>

            {subjectsLoading ? (
              <p className="empty-text">Loading subjects…</p>
            ) : subjectsError ? (
              <p className="empty-text" style={{ color: "crimson" }}>
                {subjectsError}
              </p>
            ) : (
              <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                {subjects.length === 0 ? (
                  <option value="">No subjects found</option>
                ) : (
                  subjects.map((s) => (
                    <option key={s._id} value={s.subject_name}>
                      {s.subject_name}
                    </option>
                  ))
                )}
                <option value="Other">Other</option>
              </select>
            )}
          </div>

          {subject === "Other" && (
            <div className="offer-item">
              <label>Course Category</label>
              <input
                value={otherCategory}
                onChange={(e) => setOtherCategory(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
          )}

          <div className="offer-item">
            <label>Course Name</label>
            <input value={courseName} onChange={(e) => setCourseName(e.target.value)} />
          </div>

          <div className="offer-item">
            <label>Course Code</label>
            <input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} />
          </div>

          <div className="offer-item">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* Availability */}
          <div className="offer-item">
            <label>Availability</label>

            {availability.map((a, i) => (
              <div className="availability-block" key={i}>
                {availability.length > 1 && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeAvailability(i)}
                  >
                    ×
                  </button>
                )}

                <div className="days-group">
                  {DAYS.map((d) => (
                    <label key={d}>
                      <input
                        type="checkbox"
                        checked={a.days.includes(d)}
                        onChange={() => toggleDay(i, d)}
                      />{" "}
                      {d}
                    </label>
                  ))}
                </div>

                <div className="time-group">
                  <input
                    className="time-input"
                    placeholder="Start"
                    value={a.start}
                    onChange={(e) => updateAvailability(i, "start", e.target.value)}
                  />
                  <select
                    value={a.startAMPM}
                    onChange={(e) => updateAvailability(i, "startAMPM", e.target.value)}
                  >
                    <option>AM</option>
                    <option>PM</option>
                  </select>

                  <span>to</span>

                  <input
                    className="time-input"
                    placeholder="End"
                    value={a.end}
                    onChange={(e) => updateAvailability(i, "end", e.target.value)}
                  />
                  <select
                    value={a.endAMPM}
                    onChange={(e) => updateAvailability(i, "endAMPM", e.target.value)}
                  >
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                </div>

                <div className="online-irl-group">
                  <label>
                    <input
                      type="radio"
                      checked={a.mode === "Online"}
                      onChange={() => updateAvailability(i, "mode", "Online")}
                    />{" "}
                    Online
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={a.mode === "IRL"}
                      onChange={() => updateAvailability(i, "mode", "IRL")}
                    />{" "}
                    IRL
                  </label>
                </div>

                {a.mode === "IRL" && (
                  <input
                    className="location-input"
                    placeholder="Location"
                    value={a.location}
                    onChange={(e) => updateAvailability(i, "location", e.target.value)}
                  />
                )}
              </div>
            ))}

            <button type="button" className="add-btn" onClick={addAvailability}>
              + Add Availability
            </button>
          </div>

          <div className="action-buttons">
            <button className="btn btn-secondary" onClick={goBack} disabled={submitting}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={createOffering} disabled={submitting}>
              {submitting ? "Creating…" : "Create Offering"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
