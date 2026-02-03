import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./search.css";

export default function Search() {
    const [query, setQuery] = useState("");
    const [type, setType] = useState("");
    const [courses, setCourses] = useState([]);

    const navigate = useNavigate();

    async function fetchSubjectCourses(subject) {
        try {
            const q = encodeURIComponent(subject);
            const t = type ? `&type=${encodeURIComponent(type)}` : "";
            const res = await fetch(`/api/courses?subject=${q}${t}`);

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

    function book(id) {
        navigate(`/booking?id=${id}`);
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
  const time = `${slot.start} ${slot.startAMPM} – ${slot.end} ${slot.endAMPM}`;
  const mode =
    slot.mode === "IRL" ? `In Person${slot.location ? ` · ${slot.location}` : ""}` : "Online";

  return `${days} · ${time} · ${mode}`;
}

    return (
        <>
            <header>
                <button className="back-btn" onClick={goBack}>← Back</button>
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
                <div className="subject-card" onClick={() => fetchSubjectCourses("Math")}>
                    <h2>Mathematics</h2>
                    <p>Algebra, Calculus, Geometry</p>
                </div>

                <div className="subject-card" onClick={() => fetchSubjectCourses("Science")}>
                    <h2>Science</h2>
                    <p>Biology, Chemistry, Physics</p>
                </div>

                <div className="subject-card" onClick={() => fetchSubjectCourses("History")}>
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

                <div className="subject-card" onClick={() => fetchSubjectCourses("Electrical")}>
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
                    courses.map((c) => (
        <div key={c._id} className="subject-result">
            <h3>{c.courseName}</h3>

            <p>
            <strong>{c.subject}</strong> · {c.type}
            </p>

            <p>{c.description}</p>

            {/* ✅ Availability */}
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
        ))

                )}
            </div>
        </>
    );
}