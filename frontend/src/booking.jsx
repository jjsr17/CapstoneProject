import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./booking.css";

export default function Booking() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const courseId = searchParams.get("id");

    const [course, setCourse] = useState(null);
    const [selectedAvailability, setSelectedAvailability] = useState(null);

    useEffect(() => {
        if (!courseId) {
            alert("No course selected.");
            return;
        }

        async function loadCourse() {
            try {
                const res = await fetch(`/api/courses/${courseId}`);
                const data = await res.json();
                setCourse(data);
            } catch (err) {
                console.error(err);
                alert("Failed to load course.");
            }
        }

        loadCourse();
    }, [courseId]);

    function goBack() {
        navigate(-1);
    }

    function bookSession() {
        if (!selectedAvailability) return;
        alert("Session booked successfully!");
        navigate("/mainmenu");
    }

    return (
        <>
            {/* Top Bar */}
            <div className="top-bar">
                <button className="back-btn" onClick={goBack}>← Back</button>
                <div className="site-title">Inov8r</div>
            </div>

            <div className="container">
                <div className="box">
                    {!course ? (
                        <h2>Loading...</h2>
                    ) : (
                        <>
                            <h2>{course.courseName}</h2>

                            <div className="course-meta">
                                {course.subject} ·{" "}
                                {course.type === "tutoring"
                                    ? "Course Tutoring"
                                    : "Course Discussion"}
                            </div>

                            <p>{course.description}</p>

                            <h3>Available Sessions</h3>

                            {course.availability.map((slot, index) => (
                                <div
                                    key={index}
                                    className={`availability-option ${selectedAvailability === slot ? "selected" : ""
                                        }`}
                                    onClick={() => setSelectedAvailability(slot)}
                                >
                                    <div className="availability-days">
                                        {slot.days.join(", ")}
                                    </div>
                                    <div className="availability-details">
                                        {slot.startTime} {slot.startAmPm} – {slot.endTime} {slot.endAmPm}
                                        <br />
                                        {slot.mode === "IRL"
                                            ? `In Person · ${slot.location}`
                                            : "Online"}
                                    </div>
                                </div>
                            ))}

                            {selectedAvailability && (
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
