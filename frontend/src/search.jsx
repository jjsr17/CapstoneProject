import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./search.css";
import LoginBG from "./assets/mainmenu.jpg";

const GRAPHQL_URL = "http://localhost:5000/graphql";

export default function Search() {
    const [query, setQuery] = useState("");
    const [type, setType] = useState("");
    const [courses, setCourses] = useState([]);

    // ✅ educatorId -> "First Last"
    const [educatorNames, setEducatorNames] = useState({});

    const navigate = useNavigate();

    async function fetchSubjectCourses(subjects) {
        try {
            const list = Array.isArray(subjects) ? subjects : [subjects];

            const subjectParams = list.map((s) => `subject=${encodeURIComponent(s)}`).join("&");

            const t = type ? `&type=${encodeURIComponent(type)}` : "";
            const res = await fetch(`/api/courses?${subjectParams}${t}`);

            if (!res.ok) throw new Error("Failed to fetch");
            setCourses(await res.json());
        } catch (err) {
            console.error(err);
        }
    }

    async function searchCourses(value, newType = type) {
        try {
            const q = encodeURIComponent(value || "");
            const t = newType ? `&type=${encodeURIComponent(newType)}` : "";
            const res = await fetch(`/api/courses?query=${q}${t}`);

            if (!res.ok) throw new Error("Failed");
            setCourses(await res.json());
        } catch (err) {
            console.error(err);
        }
    }

    function goBack() {
        navigate("/mainmenu");
    }

    function book(id) {
        console.log("NAVIGATING TO BOOKING WITH ID:", id);
        navigate(`/booking?id=${id}`);
    }

    function formatSlot(slot) {
  const days = Array.isArray(slot.days) ? slot.days.join(", ") : "";

  // ✅ support BOTH old + new field names
  const startTime = slot.startTime ?? slot.start ?? "";
  const endTime = slot.endTime ?? slot.end ?? "";
  const startAmPm = (slot.startAmPm ?? slot.startAMPM ?? "").trim();
  const endAmPm = (slot.endAmPm ?? slot.endAMPM ?? "").trim();

  // If you stored 24-hour times (like "18:00"), AM/PM is optional.
  const time = `${startTime}${startAmPm ? ` ${startAmPm}` : ""} – ${endTime}${endAmPm ? ` ${endAmPm}` : ""}`;

  const mode =
    slot.mode === "IRL"
      ? `In Person${slot.location ? ` · ${slot.location}` : ""}`
      : "Online";

  return `${days} · ${time} · ${mode}`;
}

    //ducator name resolve helpers
    function getEducatorIdFromCourse(c) {
        const v = c?.educatorId;
        if (!v) return "";
        if (typeof v === "object") return v._id || "";
        return String(v);
    }

    async function fetchEducatorName(educatorId) {
        try {
            const query = `
        query ($id: ID!) {
          userById(id: $id) {
            _id
            firstName
            lastName
          }
        }
      `;

            const res = await fetch(GRAPHQL_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, variables: { id: educatorId } }),
            });

            const json = await res.json();
            const u = json?.data?.userById;
            const name = u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "";
            return name || "Unknown";
        } catch (e) {
            console.error("Failed to fetch educator name:", e);
            return "Unknown";
        }
    }

    //whenever courses list changes, resolve missing educator names
    useEffect(() => {
        if (!courses || courses.length === 0) return;

        const ids = Array.from(new Set(courses.map(getEducatorIdFromCourse).filter(Boolean)));
        const missing = ids.filter((id) => educatorNames[id] == null);
        if (missing.length === 0) return;

        (async () => {
            const updates = {};
            for (const id of missing) {
                updates[id] = await fetchEducatorName(id);
            }
            setEducatorNames((prev) => ({ ...prev, ...updates }));
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courses]);

    return (
        <>
            <style>{`
        body {
          background-image: url(${LoginBG});
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
      `}</style>

            <header>
                <button className="back-btn" onClick={goBack}>
                    ← Back
                </button>
                <h1>Noesis</h1>
            </header>

            {/* SEARCH BAR */}
            <div className="search-wrapper">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search subjects (Math, Science, History...)"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            searchCourses(e.target.value);
                        }}
                    />

                    <select
                        value={type}
                        onChange={(e) => {
                            setType(e.target.value);
                            searchCourses(query, e.target.value);
                        }}
                    >
                        <option value="">All Offerings</option>
                        <option value="tutoring">Course Tutoring</option>
                        <option value="discussion">Course Discussion</option>
                    </select>
                </div>
            </div>

            {/* SUBJECT GRID */}
            <div className="subjects">
                <div className="subject-card" onClick={() => fetchSubjectCourses("Mathematics")}>
                    <h2>Mathematics</h2>
                    <p>Algebra, Calculus, Geometry</p>
                </div>

                <div
                    className="subject-card"
                    onClick={() => fetchSubjectCourses(["Science", "Physics", "Chemistry", "Biology"])}
                >
                    <h2>Science</h2>
                    <p>Biology, Chemistry, Physics</p>
                </div>

                <div className="subject-card" onClick={() => fetchSubjectCourses(["History", "Philosophy"])}>
                    <h2>History</h2>
                    <p>World & U.S. History</p>
                </div>

                <div className="subject-card" onClick={() => fetchSubjectCourses("English")}>
                    <h2>English</h2>
                    <p>Writing, Literature, Grammar</p>
                </div>

                <div className="subject-card" onClick={() => fetchSubjectCourses("Computer Science")}>
                    <h2>Computer Science</h2>
                    <p>Programming, Algorithms</p>
                </div>

                <div
                    className="subject-card"
                    onClick={() => fetchSubjectCourses(["Electrical", "Power", "Electronics"])}
                >
                    <h2>Electrical</h2>
                    <p>Circuits, Power, Electronics</p>
                </div>

                <div className="subject-card" onClick={() => fetchSubjectCourses("Spanish")}>
                    <h2>Spanish</h2>
                    <p>Writing, Literature, Grammar</p>
                </div>

                <div className="subject-card" onClick={() => fetchSubjectCourses("Architecture")}>
                    <h2>Architecture</h2>
                    <p>Design, History</p>
                </div>
            </div>

            {/* SEARCH RESULTS */}
            <div style={{ width: "80%", margin: "30px auto" }}>
                {courses.length === 0 ? (
                    <p className="empty-text">No course offerings found.</p>
                ) : (
                    courses.map((c) => {
                        const educatorId = getEducatorIdFromCourse(c);
                        const educatorName = educatorId ? educatorNames[educatorId] : "";

                        return (
                            <div key={c._id} className="subject-result">
                                <h3>{c.courseName}</h3>

                                <p>
                                    <strong>{c.subject}</strong> · {c.type}
                                </p>

                                {/* Show educator name */}
                                <p className="muted" style={{ marginTop: "-6px" }}>
                                    <strong>Educator:</strong> {educatorName || "Loading..."}
                                </p>

                                <p>{c.description}</p>

                                {/* Availability */}
                                {Array.isArray(c.availability) && c.availability.length > 0 ? (
                                    <div className="availability-preview">
                                        <strong>Available:</strong>
                                        <ul>
                                            {c.availability.map((slot, idx) => (
                                                <li key={idx}>{formatSlot(slot)}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className="muted">No availability posted.</p>
                                )}

                                <button onClick={() => book(c._id)}>Book</button>
                            </div>
                        );
                    })
                )}
            </div>
        </>
    );
}