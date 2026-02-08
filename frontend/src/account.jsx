import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./account.css";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const BASE = {
    bannerImage: "bannerImage",
    profileImage: "profileImage",
    firstName: "profileFirstName",
    lastName: "profileLastName",
    education: "profileEducation",
    description: "profileDescription",
};

export default function Account() {
    const menuRef = useRef(null);

    const [events, setEvents] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [student, setStudent] = useState(null);

    const mongoUserId = useMemo(() => localStorage.getItem("mongoUserId") || "", []);
    const k = useCallback((baseKey) => `user:${mongoUserId}:${baseKey}`, [mongoUserId]);

    const clean = useCallback((v) => {
        const s = v == null ? "" : String(v).trim();
        return s.length ? s : null;
    }, []);

    const closeMenu = useCallback(() => {
        if (menuRef.current) menuRef.current.style.display = "none";
    }, []);

    const toggleMenu = useCallback(
        (e) => {
            e.stopPropagation();
            if (!menuRef.current) return;

            menuRef.current.style.display =
                menuRef.current.style.display === "block" ? "none" : "block";
        },
        []
    );

    const goHome = useCallback(() => {
        window.location.href = "/mainmenu";
    }, []);

    const goEditProfile = useCallback(() => {
        window.location.href = "/editprofile";
    }, []);

    const goSettings = useCallback(() => {
        window.location.href = "/settings";
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("mongoUserId");
        localStorage.removeItem("accountType");
        window.location.href = "/login";
    }, []);

    useEffect(() => {
        if (!mongoUserId) return;

        Object.values(BASE).forEach((baseKey) => {
            const namespacedKey = k(baseKey);
            if (localStorage.getItem(namespacedKey) == null) {
                const oldVal = localStorage.getItem(baseKey);
                if (oldVal != null) localStorage.setItem(namespacedKey, oldVal);
            }
        });
    }, [mongoUserId, k]);

    const [bannerSrc, setBannerSrc] = useState(() => (mongoUserId ? localStorage.getItem(k(BASE.bannerImage)) || "" : ""));
    const [profileSrc, setProfileSrc] = useState(() => (mongoUserId ? localStorage.getItem(k(BASE.profileImage)) || "" : ""));
    const [localFirstName, setLocalFirstName] = useState(() => (mongoUserId ? localStorage.getItem(k(BASE.firstName)) || "" : ""));
    const [localLastName, setLocalLastName] = useState(() => (mongoUserId ? localStorage.getItem(k(BASE.lastName)) || "" : ""));
    const [localEducation, setLocalEducation] = useState(() => (mongoUserId ? localStorage.getItem(k(BASE.education)) || "" : ""));
    const [localDescription, setLocalDescription] = useState(() => (mongoUserId ? localStorage.getItem(k(BASE.description)) || "" : ""));

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest(".dropdown")) closeMenu();
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [closeMenu]);

    useEffect(() => {
        if (!mongoUserId) return;

        const sync = () => {
            setBannerSrc(localStorage.getItem(k(BASE.bannerImage)) || "");
            setProfileSrc(localStorage.getItem(k(BASE.profileImage)) || "");
            setLocalFirstName(localStorage.getItem(k(BASE.firstName)) || "");
            setLocalLastName(localStorage.getItem(k(BASE.lastName)) || "");
            setLocalEducation(localStorage.getItem(k(BASE.education)) || "");
            setLocalDescription(localStorage.getItem(k(BASE.description)) || "");
        };

        sync();
        window.addEventListener("storage", sync);
        return () => window.removeEventListener("storage", sync);
    }, [mongoUserId, k]);

    // Load student profile
    useEffect(() => {
        (async () => {
            try {
                if (!mongoUserId) return;

                const query = `
          query ($id: ID!) {
            userById(id: $id) {
              _id
              firstName
              middleName
              lastName
              student { schoolName concentration }
            }
          }
        `;

                const res = await fetch("http://localhost:5000/graphql", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query, variables: { id: mongoUserId } }),
                });

                const json = await res.json();
                setStudent(json.data?.userById ?? null);
            } catch (err) {
                console.error("Failed to load student profile:", err);
                setStudent(null);
            }
        })();
    }, [mongoUserId]);

    // Load bookings
    useEffect(() => {
        (async () => {
            try {
                if (!mongoUserId) {
                    setEvents([]);
                    return;
                }

                const query = `
          query ($studentId: ID!) {
            bookingsByStudent(studentId: $studentId) {
              _id
              title
              start
              end
              iscompleted
            }
          }
        `;

                const res = await fetch("http://localhost:5000/graphql", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query, variables: { studentId: mongoUserId } }),
                });

                const json = await res.json();

                const mapped = (json.data?.bookingsByStudent ?? []).map((b) => ({
                    id: b._id,
                    title: b.title,
                    start: b.start,
                    end: b.end,
                    extendedProps: { iscompleted: b.iscompleted },
                }));

                setEvents(mapped);
            } catch (err) {
                console.error("Failed to load student bookings:", err);
                setEvents([]);
            }
        })();
    }, [mongoUserId]);

    const displayName = useMemo(() => {
        const lf = clean(localFirstName);
        const ll = clean(localLastName);
        if (lf || ll) return [lf, ll].filter(Boolean).join(" ");

        if (!student) return "Student";
        return [clean(student.firstName), clean(student.middleName), clean(student.lastName)]
            .filter(Boolean)
            .join(" ");
    }, [student, clean, localFirstName, localLastName]);

    const schoolName = useMemo(() => clean(student?.student?.schoolName) || "", [student, clean]);
    const concentration = useMemo(() => clean(student?.student?.concentration) || "", [student, clean]);

    const educationLine = useMemo(() => {
        const le = clean(localEducation);
        if (le) return le;
        return [schoolName, concentration].filter(Boolean).join(" · ");
    }, [localEducation, schoolName, concentration, clean]);

    const descriptionLine = useMemo(() => clean(localDescription) || "", [localDescription, clean]);

    const handleEventClick = useCallback((clickInfo) => {
        const ev = clickInfo.event;
        setSelectedBooking({
            id: ev.id,
            title: ev.title,
            start: ev.startStr,
            end: ev.endStr,
            iscompleted: ev.extendedProps?.iscompleted,
        });
    }, []);

    const closeModal = useCallback(() => setSelectedBooking(null), []);

    return (
        <div className="account-page">
            <div className="top-bar">
                <button className="back-btn" onClick={goHome}>
                    ← Back
                </button>

                <div className="site-title">Inov8r</div>

                <div className="dropdown">
                    <button className="dropdown-btn" onClick={toggleMenu}>
                        ⋮
                    </button>

                    <div className="dropdown-menu" ref={menuRef}>
                        <button onClick={goEditProfile}>Edit Profile</button>
                        <button onClick={goSettings}>Settings</button>
                        <button onClick={logout}>Log Out</button>
                    </div>
                </div>
            </div>

            <div
                className="banner"
                style={
                    bannerSrc
                        ? { backgroundImage: `url(${bannerSrc})`, backgroundSize: "cover", backgroundPosition: "center" }
                        : undefined
                }
            >
                <div className="profile-pic">
                    <img src={profileSrc || ""} alt="" />
                </div>
            </div>

            <div className="page-layout">
                <div className="profile-content">
                    <div className="profile-name">{displayName}</div>

                    <div className="profile-education">{educationLine}</div>

                    <div className="profile-desc-box">
                        {descriptionLine ? (
                            <div className="profile-description">{descriptionLine}</div>
                        ) : (
                            <div className="empty-text">No description yet. Add one in Edit Profile.</div>
                        )}
                    </div>

                    <div className="box">
                        <h3>Scheduled Tutoring & Meetings</h3>

                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: "prev,next today",
                                center: "title",
                                right: "dayGridMonth,timeGridWeek,timeGridDay",
                            }}
                            events={events}
                            height="auto"
                            eventClick={handleEventClick}
                        />

                        <p className="empty-text" style={{ marginTop: 10 }}>
                            Sessions loaded: {events.length}
                        </p>
                    </div>
                </div>

                <div className="side-panel">
                    <div className="follow-box">
                        <h3>Followers</h3>

                        <div className="follow-placeholder">
                            <div className="follow-banner">
                                <div className="follow-pic" />
                            </div>
                        </div>

                        <p className="empty-text">No followers yet.</p>
                    </div>
                </div>
            </div>

            {selectedBooking && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                    }}
                    onClick={closeModal}
                >
                    <div
                        style={{ background: "#fff", padding: 20, borderRadius: 12, width: "min(520px, 92vw)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ marginTop: 0 }}>Booking Details</h3>
                        <p><b>Title:</b> {selectedBooking.title}</p>
                        <p><b>Start:</b> {new Date(selectedBooking.start).toLocaleString()}</p>
                        <p><b>End:</b> {new Date(selectedBooking.end).toLocaleString()}</p>
                        <p><b>Completed:</b> {selectedBooking.iscompleted ? "Yes" : "No"}</p>
                        <button onClick={closeModal}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}
