import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./booking.css";
const studentId = localStorage.getItem("mongoUserId");
const accountType = (localStorage.getItem("accountType") || "").trim().toLowerCase();

console.log("studentId:", studentId);
console.log("accountType:", accountType);

function formatDateTimeRange(startISO, endISO) {
  const start = new Date(startISO);
  const end = new Date(endISO);

  const date = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const startTime = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const endTime = end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return { date, time: `${startTime} – ${endTime}` };
}

export default function Booking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("id");

  const [course, setCourse] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);

  // TODO: Replace this with your real logged-in student id (from your auth/me query)
const studentId = localStorage.getItem("mongoUserId");
const accountType = localStorage.getItem("accountType"); // optional


  useEffect(() => {
    if (!courseId) {
      alert("No course selected.");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);

        // 1) Load course
        const courseRes = await fetch(`/api/courses/${courseId}`);
        if (!courseRes.ok) throw new Error("Failed to load course");
        const courseData = await courseRes.json();
        setCourse(courseData);

        // 2) Load computed 60-min slots (real-time)
        const slotsRes = await fetch(`/api/courses/${courseId}/available-slots?daysAhead=14`);
        if (!slotsRes.ok) throw new Error("Failed to load availability");
        const slotsData = await slotsRes.json();
        setAvailableSlots(slotsData.availableSlots || []);
      } catch (err) {
        console.error(err);
        alert("Failed to load course.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [courseId]);

  function goBack() {
    navigate(-1);
  }

  async function refreshSlots() {
    const slotsRes = await fetch(`/api/courses/${courseId}/available-slots?daysAhead=14`);
    const slotsData = await slotsRes.json();
    setAvailableSlots(slotsData.availableSlots || []);
  }

  async function bookSession() {
    if (!selectedSlot || !course) return;

    // You MUST have a studentId to book (wire this from auth)
        if (!studentId) {
    alert("You must be logged in to book.");
    return;
    }

    if (accountType !== "student") {
    alert("You must be logged in as a student to book.");
    return;
    }


    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          tutorId: course.educatorId, // your course schema uses educatorId as tutor
          start: selectedSlot.start,
          end: selectedSlot.end,
        }),
      });

      if (res.status === 409) {
        alert("That slot was just booked by someone else. Refreshing...");
        setSelectedSlot(null);
        await refreshSlots();
        return;
      }

        if (!res.ok) {
    let payload = null;
    const text = await res.text();
    try { payload = JSON.parse(text); } catch {}
    console.error("Booking failed status:", res.status);
    console.error("Booking failed response:", payload || text);
    throw new Error(payload?.error || payload?.message || text || "Booking failed");
    }


      alert("Session booked successfully!");
      navigate("/mainmenu");
    } catch (err) {
      console.error(err);
      alert("Failed to book session.");
    }
  }

  // Optional: group slots by date for nicer UI
  const slotsByDate = useMemo(() => {
    const groups = new Map();
    for (const s of availableSlots) {
      const { date } = formatDateTimeRange(s.start, s.end);
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date).push(s);
    }
    return Array.from(groups.entries()); // [ [date, slots], ... ]
  }, [availableSlots]);

  return (
    <>
      <div className="top-bar">
        <button className="back-btn" onClick={goBack}>← Back</button>
        <div className="site-title">Inov8r</div>
      </div>

      <div className="container">
        <div className="box">
          {loading ? (
            <h2>Loading...</h2>
          ) : !course ? (
            <h2>Course not found.</h2>
          ) : (
            <>
              <h2>{course.courseName}</h2>

              <div className="course-meta">
                {course.subject} ·{" "}
                {course.type === "tutoring" ? "Course Tutoring" : "Course Discussion"}
              </div>

              <p>{course.description}</p>

              <h3>Available Sessions (60 min)</h3>

              {availableSlots.length === 0 ? (
                <p>No open time slots right now.</p>
              ) : (
                slotsByDate.map(([date, slots]) => (
                  <div key={date} style={{ marginBottom: 14 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{date}</div>

                    {slots.map((slot, index) => {
                      const { time } = formatDateTimeRange(slot.start, slot.end);
                      const selected = selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;

                      return (
                        <div
                          key={index}
                          className={`availability-option ${selected ? "selected" : ""}`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          <div className="availability-days">{time}</div>
                          <div className="availability-details">
                            {slot.mode === "IRL"
                              ? `In Person · ${slot.location || ""}`
                              : "Online"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}

              {selectedSlot && (
                <button className="book-btn" onClick={bookSession}>
                  Book Session
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
