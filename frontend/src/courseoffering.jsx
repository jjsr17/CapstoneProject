import { useState } from "react";
import "./courseoffering.css";

export default function CourseOffering() {
    const [type, setType] = useState("");
    const [subject, setSubject] = useState("Math");
    const [otherCategory, setOtherCategory] = useState("");
    const [courseName, setCourseName] = useState("");
    const [courseCode, setCourseCode] = useState("");
    const [description, setDescription] = useState("");

    const [availability, setAvailability] = useState([
        {
            days: [],
            start: "",
            startAMPM: "AM",
            end: "",
            endAMPM: "AM",
            mode: "Online",
            location: ""
        }
    ]);

    function goBack() {
        window.history.back();
    }

    function updateAvailability(index, field, value) {
        setAvailability(prev =>
            prev.map((a, i) =>
                i === index ? { ...a, [field]: value } : a
            )
        );
    }

    function toggleDay(index, day) {
        setAvailability(prev =>
            prev.map((a, i) =>
                i === index
                    ? {
                        ...a,
                        days: a.days.includes(day)
                            ? a.days.filter(d => d !== day)
                            : [...a.days, day]
                    }
                    : a
            )
        );
    }

    function addAvailability() {
        setAvailability(prev => [
            ...prev,
            {
                days: [],
                start: "",
                startAMPM: "AM",
                end: "",
                endAMPM: "AM",
                mode: "Online",
                location: ""
            }
        ]);
    }

    function removeAvailability(index) {
        if (availability.length === 1) {
            alert("You must have at least one availability.");
            return;
        }
        setAvailability(prev => prev.filter((_, i) => i !== index));
    }

    async function createOffering() {
        if (!type) {
            alert("Please select Course Tutoring or Course Discussion.");
            return;
        }

        if (!courseName.trim()) {
            alert("Please enter a course name.");
            return;
        }

        const payload = {
            type,
            subject: subject === "Other" ? otherCategory || "Other" : subject,
            courseName,
            courseCode,
            description,
            availability,
            educatorId: localStorage.getItem("userId") || null,
            createdAt: new Date().toISOString()
        };

        try {
            const res = await fetch("http://localhost:5173/api/courses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to create offering");

            window.location.href = "/educatoraccount";
        } catch (err) {
            console.error(err);
            alert("Failed to create offering.");
        }
    }

    return (
        <>
            <div className="top-bar">
                <button className="back-btn" onClick={goBack}>← Back</button>
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
                                /> Course Tutoring
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    checked={type === "discussion"}
                                    onChange={() => setType("discussion")}
                                /> Course Discussion
                            </label>
                        </div>
                    </div>

                    {/* Subject */}
                    <div className="offer-item">
                        <label>Subject Category</label>
                        <select value={subject} onChange={e => setSubject(e.target.value)}>
                            <option>Math</option>
                            <option>History</option>
                            <option>English</option>
                            <option>Spanish</option>
                            <option>Physics</option>
                            <option>Other</option>
                        </select>
                    </div>

                    {subject === "Other" && (
                        <div className="offer-item">
                            <label>Course Category</label>
                            <input
                                value={otherCategory}
                                onChange={e => setOtherCategory(e.target.value)}
                                placeholder="Enter category name"
                            />
                        </div>
                    )}

                    <div className="offer-item">
                        <label>Course Name</label>
                        <input value={courseName} onChange={e => setCourseName(e.target.value)} />
                    </div>

                    <div className="offer-item">
                        <label>Course Code</label>
                        <input value={courseCode} onChange={e => setCourseCode(e.target.value)} />
                    </div>

                    <div className="offer-item">
                        <label>Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} />
                    </div>

                    {/* Availability */}
                    <div className="offer-item">
                        <label>Availability</label>

                        {availability.map((a, i) => (
                            <div className="availability-block" key={i}>
                                {availability.length > 1 && (
                                    <button className="remove-btn" onClick={() => removeAvailability(i)}>×</button>
                                )}

                                <div className="days-group">
                                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                                        <label key={d}>
                                            <input
                                                type="checkbox"
                                                checked={a.days.includes(d)}
                                                onChange={() => toggleDay(i, d)}
                                            /> {d}
                                        </label>
                                    ))}
                                </div>

                                <div className="time-group">
                                    <input className="time-input" placeholder="Start"
                                        value={a.start}
                                        onChange={e => updateAvailability(i, "start", e.target.value)}
                                    />
                                    <select value={a.startAMPM}
                                        onChange={e => updateAvailability(i, "startAMPM", e.target.value)}>
                                        <option>AM</option><option>PM</option>
                                    </select>
                                    <span>to</span>
                                    <input className="time-input" placeholder="End"
                                        value={a.end}
                                        onChange={e => updateAvailability(i, "end", e.target.value)}
                                    />
                                    <select value={a.endAMPM}
                                        onChange={e => updateAvailability(i, "endAMPM", e.target.value)}>
                                        <option>AM</option><option>PM</option>
                                    </select>
                                </div>

                                <div className="online-irl-group">
                                    <label>
                                        <input type="radio" checked={a.mode === "Online"}
                                            onChange={() => updateAvailability(i, "mode", "Online")}
                                        /> Online
                                    </label>
                                    <label>
                                        <input type="radio" checked={a.mode === "IRL"}
                                            onChange={() => updateAvailability(i, "mode", "IRL")}
                                        /> IRL
                                    </label>
                                </div>

                                {a.mode === "IRL" && (
                                    <input
                                        className="location-input"
                                        placeholder="Location"
                                        value={a.location}
                                        onChange={e => updateAvailability(i, "location", e.target.value)}
                                    />
                                )}
                            </div>
                        ))}

                        <button className="add-btn" onClick={addAvailability}>+ Add Availability</button>
                    </div>

                    <div className="action-buttons">
                        <button className="btn btn-secondary" onClick={goBack}>Cancel</button>
                        <button className="btn btn-primary" onClick={createOffering}>
                            Create Offering
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
