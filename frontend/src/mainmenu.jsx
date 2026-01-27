import { useEffect, useState } from "react";
import "./mainmenu.css";

export default function MainMenu() {
    const [offerings, setOfferings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLatestOfferings();
    }, []);

    async function loadLatestOfferings() {
        try {
            const res = await fetch("http://localhost:5173/api/courses?limit=10");
            if (!res.ok) throw new Error("Failed to load courses");
            const data = await res.json();
            setOfferings(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function goToPage(path) {
        window.location.href = path;
    }

    function openCard(type) {
        alert("Opening: " + type + " section");
    }

    function bookCourse(id) {
        alert("Booking flow for course: " + id);
    }

    return (
        <>
            {/* Title */}
            <header>
                <h1>Noesis</h1>
            </header>

            {/* Navigation */}
            <nav>
                <button onClick={() => goToPage("/mainmenu")}>Home</button>
                <button onClick={() => goToPage("/search")}>Search</button>
                <button onClick={() => goToPage("/account")}>Account</button>
            </nav>

            {/* Main Content */}
            <div className="container">
                <p>
                    Welcome [username] to our website! Here you will find many tutors ready
                    to help you succeed in your classes.
                </p>

                <div className="card" onClick={() => openCard("news")}>
                    <h2>Latest News</h2>
                    <p>Click to view the latest updates.</p>
                </div>

                <div className="card" onClick={() => openCard("info")}>
                    <h2>Information</h2>
                    <p>The Freelance Tutoring Platform is a web-based academic support system designed to connect students with qualified tutors and professors through a secure, user-friendly digital environment.
                        The website serves as the central access point for users to register, manage profiles, search for tutoring services, schedule sessions, and communicate in real time.
                        Its primary goal is to facilitate structured, reliable, and accessible tutoring services for learners at various educational levels.
                        The website provides an intuitive interface that allows students to search for tutors based on subject, availability, and qualifications, while tutors can manage their profiles, schedules, and sessions efficiently.
                        Core features include user authentication, role-based access control, session scheduling, integrated messaging, and payment processing.
                        The platform is designed to support live tutoring sessions through Microsoft Teams integration, enabling video conferencing, calendar synchronization, and real-time communication within a unified system.
                        From a technical perspective, the website follows a modern web architecture, utilizing a React-based frontend, a Node.js and Express backend, and a MongoDB database for data management.
                        Security and reliability are central to the system design, with secure authentication mechanisms, encrypted communication, and structured database schemas to ensure data integrity and user privacy.</p>
                </div>

                {/* Latest Offerings */}
                <div className="card">
                    <h2>Latest Course Offerings</h2>

                    {loading && <p>Loading...</p>}

                    {!loading && offerings.length === 0 && (
                        <p className="empty-text">No offerings yet.</p>
                    )}

                    {!loading &&
                        offerings.map((c) => (
                            <div className="offering-card" key={c._id}>
                                <strong>{c.courseName}</strong> — {c.subject}
                                {c.description && <div>{c.description}</div>}

                                <div style={{ marginTop: "8px" }}>
                                    <button onClick={() => bookCourse(c._id)}>Book</button>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </>
    );
}
