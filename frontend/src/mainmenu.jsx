// src/mainmenu.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./mainmenu.css";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function MainMenu() {
  const navigate = useNavigate();

  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLatestOfferings = useCallback(async () => {
    try {
      setLoading(true);

      // Prefer env base; if empty, fall back to same-origin "/api/..."
      const url = API_BASE
        ? `${API_BASE}/api/courses?limit=10`
        : `/api/courses?limit=10`;

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load courses");

      const data = await res.json();
      setOfferings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setOfferings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLatestOfferings();
  }, [loadLatestOfferings]);

  const goToPage = useCallback(
    (path) => {
      navigate(path);
    },
    [navigate]
  );

  const openCard = useCallback((type) => {
    alert("Opening: " + type + " section");
  }, []);

  const bookCourse = useCallback(
    (id) => {
      navigate(`/booking?id=${id}`);
    },
    [navigate]
  );

  // ✅ Uses your ACTUAL routes from App.jsx:
  // student -> /account
  // educator -> /educatoraccount
  const openAccount = useCallback(() => {
    const at = (localStorage.getItem("accountType") || "").trim().toLowerCase();

    if (at === "educator") {
      navigate("/educatoraccount");
      return;
    }

    if (at === "student") {
      navigate("/account");
      return;
    }

    // fallback if missing/unknown
    navigate("/login");
  }, [navigate]);

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
        <button onClick={openAccount}>Account</button>
        <button onClick={() => goToPage("/messages")}>Messages</button>
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
          <p>
            The Freelance Tutoring Platform is a web-based academic support system
            designed to connect students with qualified tutors and professors
            through a secure, user-friendly digital environment. The website serves
            as the central access point for users to register, manage profiles,
            search for tutoring services, schedule sessions, and communicate in
            real time. Its primary goal is to facilitate structured, reliable, and
            accessible tutoring services for learners at various educational levels.
            The website provides an intuitive interface that allows students to
            search for tutors based on subject, availability, and qualifications,
            while tutors can manage their profiles, schedules, and sessions
            efficiently. Core features include user authentication, role-based
            access control, session scheduling, integrated messaging, and payment
            processing. The platform is designed to support live tutoring sessions
            through Microsoft Teams integration, enabling video conferencing,
            calendar synchronization, and real-time communication within a unified
            system. From a technical perspective, the website follows a modern web
            architecture, utilizing a React-based frontend, a Node.js and Express
            backend, and a MongoDB database for data management. Security and
            reliability are central to the system design, with secure authentication
            mechanisms, encrypted communication, and structured database schemas to
            ensure data integrity and user privacy.
          </p>
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      bookCourse(c._id);
                    }}
                  >
                    Book
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
