import { useState } from "react";
import "./search.css";

export default function Search() {
    const [query, setQuery] = useState("");
    const [type, setType] = useState("");
    const [courses, setCourses] = useState([]);

    async function fetchSubjectCourses(subject) {
        try {
            const q = encodeURIComponent(subject);
            const t = type ? `&type=${encodeURIComponent(type)}` : "";
           const res = await fetch(
            `http://localhost:5000/api/subjects?query=${encodeURIComponent(query)}`
            );

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
            const res = await fetch(
                `http://localhost:5173/api/courses?query=${q}${t}`
            );
            if (!res.ok) throw new Error("Failed");
            setCourses(await res.json());
        } catch (err) {
            console.error(err);
        }
    }

    function book(id) {
        alert("Booking flow for course ID: " + id);
    }

    return (
        <>
            <header>
                <h1>Noesis</h1>
            </header>

            {/* SEARCH BAR � identical structure */}
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


            {/* SUBJECT GRID � untouched */}
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

            {/* SEARCH RESULTS � SAME WIDTH & POSITION */}
            <div style={{ width: "80%", margin: "30px auto" }}>
                {courses.length === 0 ? (
                    <p className="empty-text">No course offerings found.</p>
                ) : (
                    courses.map((c) => (
                        <div key={c._id} className="subject-result">
                            <h3>{c.courseName}</h3>
                            <p>
                                <strong>{c.subject}</strong> � {c.type}
                            </p>
                            <p>{c.description}</p>
                            <button onClick={() => book(c._id)}>Book</button>
                        </div>
                    ))
                )}
            </div>
        </>
    );
}
