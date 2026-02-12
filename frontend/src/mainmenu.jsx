// src/mainmenu.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./mainmenu.css";

const API_BASE = import.meta.env.VITE_API_BASE || "";
const GRAPHQL_URL = "http://localhost:5000/graphql";

export default function MainMenu() {
    const navigate = useNavigate();

    const [offerings, setOfferings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [displayName, setDisplayName] = useState("");

    // educatorId -> name map
    const [educatorNames, setEducatorNames] = useState({});

    const loadLatestOfferings = useCallback(async () => {
        try {
            setLoading(true);

            const url = API_BASE ? `${API_BASE}/api/courses?limit=10` : `/api/courses?limit=10`;

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

    //Welcome name display per mongoUserId
    useEffect(() => {
        const mongoUserId = localStorage.getItem("mongoUserId") || "";
        const at = (localStorage.getItem("accountType") || "").trim().toLowerCase();

        // If not logged in yet
        if (!mongoUserId) {
            setDisplayName("");
            return;
        }

        const key = (baseKey) => `user:${mongoUserId}:${baseKey}`;

        // Try to read per-user saved names first (matches your other pages)
        const educatorFullName = (localStorage.getItem(key("educatorFullName")) || "").trim();

        const studentFirst = (localStorage.getItem(key("profileFirstName")) || "").trim();
        const studentLast = (localStorage.getItem(key("profileLastName")) || "").trim();
        const studentFull = `${studentFirst} ${studentLast}`.trim();

        // Pick based on account type, with sensible fallbacks
        const localPicked =
            at === "educator"
                ? educatorFullName || studentFull
                : studentFull || educatorFullName;

        if (localPicked) {
            setDisplayName(localPicked);
            return;
        }

        // Fallback: ask backend for the user's real name (works even if localStorage is empty)
        (async () => {
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
                    body: JSON.stringify({ query, variables: { id: mongoUserId } }),
                });

                const json = await res.json();
                const u = json?.data?.userById;
                const name = u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "";
                setDisplayName(name || "");
            } catch (e) {
                console.error("Failed to resolve displayName:", e);
                setDisplayName("");
            }
        })();
    }, []);

    const openCard = useCallback((type) => {
        alert("Opening: " + type + " section");
    }, []);

    const bookCourse = useCallback(
        (id) => {
            navigate(`/booking?id=${id}`);
        },
        [navigate]
    );

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

        navigate("/login");
    }, [navigate]);

    // ===== Helpers to resolve educator names =====
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

    // After offerings load, resolve educator names (cached)
    useEffect(() => {
        if (!offerings || offerings.length === 0) return;

        const ids = Array.from(new Set(offerings.map(getEducatorIdFromCourse).filter(Boolean)));

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
    }, [offerings]);

    return (
        <div className="page-background">
            <header>
                <h1>Noesis</h1>
            </header>

            <nav>
                <button onClick={() => goToPage("/mainmenu")}>Home</button>
                <button onClick={() => goToPage("/search")}>Search</button>
                <button onClick={openAccount}>Account</button>
                <button onClick={() => goToPage("/messages")}>Messages</button>
            </nav>

            <div className="container">
                <p>
                    Welcome <strong>{displayName || "User"}</strong> to our website! Here you will find many
                    tutors ready to help you succeed in your classes.
                </p>

                <div className="card" onClick={() => openCard("news")}>
                    <h2>Latest News</h2>
                    <p>
                        <strong>Update Patch Notes Ver. 0.8.2:</strong>
                        <br /><br />

                        <strong>New Features:</strong>
                        <br />
                        - Teams integration added to messages
                        <br />
                        - Professor ID appears in Course Offering components
                        <br /><br />

                        <strong>Improvements:</strong>
                        <br />
                        - UI design is cleaner and lively
                        <br /><br />

                        <strong>Bug Fixes:</strong>
                        <br />
                        - Welcome ID displayed incorrectly
                        <br />
                        - Search filtering was not filtering every subject
                        <br />
                        - Profile changes are local to 1 account
                    </p>
                </div>

                <div className="card" onClick={() => openCard("info")}>
                    <h2>Information</h2>
                    <p>
                        Noesis is a tutoring platform and a secure web-based system that connects students with qualified tutors and professors.
                        <br />
                        It provides an intuitive environment for discovering tutoring services, scheduling sessions, and communicating in real time.
                        <br />
                        Designed for reliability and ease of use, the platform supports structured academic assistance across multiple subjects while
                        <br />
                        ensuring data security and user privacy. The platform also provides a mobile version for quick on the go use and learning.
                    </p>
                </div>

                <div className="card">
                    <h2>Latest Course Offerings</h2>

                    {loading && <p>Loading...</p>}

                    {!loading && offerings.length === 0 && <p className="empty-text">No offerings yet.</p>}

                    {!loading &&
                        offerings.map((c) => {
                            const educatorId = getEducatorIdFromCourse(c);
                            const educatorName = educatorId ? educatorNames[educatorId] : "";

                            return (
                                <div className="offering-card" key={c._id}>
                                    <strong>{c.courseName}</strong> — {c.subject}

                                    <div style={{ marginTop: "6px", fontSize: "14px", color: "#555" }}>
                                        <strong>Educator:</strong> {educatorName || "Loading..."}
                                    </div>

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
                            );
                        })}
                </div>
            </div>
        </div>
    );
}