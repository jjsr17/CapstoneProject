import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useMsal } from "@azure/msal-react";

import "./educatoraccount.css";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const API_BASE = import.meta.env.VITE_API_BASE || "";
const GRAPHQL_URL = API_BASE ? `${API_BASE}/graphql` : "/graphql";


const BASE = {
    banner: "educatorBannerImage",
    profile: "educatorProfileImage",
    fullName: "educatorFullName",
    degree: "educatorDegree",
    concentration: "educatorConcentration",
    about: "educatorAbout",
};



export default function EducatorAccount() {
    
    const menuRef = useRef(null);

    const [events, setEvents] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [educator, setEducator] = useState(null);
    const [tutorProfile, setTutorProfile] = useState(null);
    const { instance } = useMsal();

    const mongoUserId = useMemo(() => localStorage.getItem("mongoUserId") || "", []);
    const k = useCallback((baseKey) => `user:${mongoUserId}:${baseKey}`, [mongoUserId]);

    const [courses, setCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(false);

    const loadCourses = useCallback(async () => {
    const educatorId = localStorage.getItem("mongoUserId") || "";
    if (!educatorId) {
        setCourses([]);
        return;
    }

    try {
        setCoursesLoading(true);
        const res = await fetch(
        `${API_BASE || "http://localhost:5000"}/api/courses?educatorId=${encodeURIComponent(educatorId)}`
        );
        if (!res.ok) throw new Error("Failed to fetch courses");
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
    } catch (e) {
        console.error(e);
        setCourses([]);
    } finally {
        setCoursesLoading(false);
    }
    }, [mongoUserId]);
    // migrate old global keys -> user keys if needed
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

    // localStorage overrides
    const [bannerSrc, setBannerSrc] = useState(() =>
        mongoUserId ? localStorage.getItem(k(BASE.banner)) || "" : ""
    );
    const [profileSrc, setProfileSrc] = useState(() =>
        mongoUserId ? localStorage.getItem(k(BASE.profile)) || "" : ""
    );
    const [localFullName, setLocalFullName] = useState(() =>
        mongoUserId ? localStorage.getItem(k(BASE.fullName)) || "" : ""
    );
    const [localDegree, setLocalDegree] = useState(() =>
        mongoUserId ? localStorage.getItem(k(BASE.degree)) || "" : ""
    );
    const [localConcentration, setLocalConcentration] = useState(() =>
        mongoUserId ? localStorage.getItem(k(BASE.concentration)) || "" : ""
    );
    const [localAbout, setLocalAbout] = useState(() =>
        mongoUserId ? localStorage.getItem(k(BASE.about)) || "" : ""
    );

    useEffect(() => {
        if (!mongoUserId) return;

        const syncLocal = () => {
            setBannerSrc(localStorage.getItem(k(BASE.banner)) || "");
            setProfileSrc(localStorage.getItem(k(BASE.profile)) || "");
            setLocalFullName(localStorage.getItem(k(BASE.fullName)) || "");
            setLocalDegree(localStorage.getItem(k(BASE.degree)) || "");
            setLocalConcentration(localStorage.getItem(k(BASE.concentration)) || "");
            setLocalAbout(localStorage.getItem(k(BASE.about)) || "");
        };

        syncLocal();
        window.addEventListener("storage", syncLocal);
        return () => window.removeEventListener("storage", syncLocal);
    }, [mongoUserId, k]);

    // ===== Navigation =====
    function goHome() {
        window.location.href = "/mainmenu";
    }

    function editProfile() {
        window.location.href = "/editeducatorprofile";
    }

    function settings() {
        localStorage.setItem("userRole", "tutor");
        window.location.href = "/settings";
    }

    async function logout() {
        // clear your app storage
        localStorage.removeItem("userRole");
        localStorage.removeItem("mongoUserId");
        localStorage.removeItem("tutorId");
        localStorage.removeItem("accountType");
        localStorage.removeItem("profileComplete");
        localStorage.removeItem("useMsSso");
        localStorage.removeItem("msAccessToken");
        localStorage.removeItem("msGraphAccessToken");

        // ✅ if they were logged in via Microsoft, actually sign out of MSAL too
        const accounts = instance.getAllAccounts();
        if (accounts.length > 0) {
            instance.setActiveAccount(null);
            await instance.logoutRedirect({
                postLogoutRedirectUri: window.location.origin + "/login",
            });
            return; // redirect happens
        }

        // local logout
        window.location.href = "/login";
    }

    // ===== Dropdown =====
    function toggleMenu(e) {
        e.stopPropagation();
        const menu = menuRef.current;
        if (!menu) return;
        menu.style.display = menu.style.display === "block" ? "none" : "block";
    }

    // Close menu if clicking outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (!e.target.closest(".dropdown") && menuRef.current) {
                menuRef.current.style.display = "none";
            }
        }
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);
    useEffect(() => {
  loadCourses();
}, [loadCourses]);
    // ===== Load educator profile + tutor profile =====
    useEffect(() => {
        async function loadEducator() {
            try {
                const tutorId = localStorage.getItem("mongoUserId");
                if (!tutorId) return;

                const query = `
          query ($id: ID!) {
            userById(id: $id) {
              _id
              firstName
              lastName
              educator {
                collegeName
                degree
                concentration
              }
            }
            tutorProfileByUserId(userId: $id) {
              tutor_rate
              tutor_rating
              subjects
            }
          }
        `;

         const res = await fetch(GRAPHQL_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ query, variables: { id: mongoUserId } }),
                });

                const json = await res.json();
                setEducator(json.data?.userById ?? null);
                setTutorProfile(json.data?.tutorProfileByUserId ?? null);
            } catch (err) {
                console.error("Failed to load educator profile:", err);
            }
        }

        loadEducator();
    }, []);
    
    // ✅ Calendar click -> model
    const handleEventClick = useCallback((clickInfo) => {
        const ev = clickInfo.event;
        setSelectedBooking({
            id: ev.id,
            title: ev.title,
            start: ev.startStr,
            end: ev.endStr,
            iscompleted: ev.extendedProps?.iscompleted,
            teamsJoinUrl: ev.extendedProps?.teamsJoinUrl || "",
        });
    }, []);

    const closeModal = useCallback(() => setSelectedBooking(null), []);

    // ✅ helper: POST graphql
    async function gql(query, variables) {
        const res = await fetch("http://localhost:5000/graphql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, variables }),
        });
        return res.json();
    }

    // ===== Load tutor bookings into calendar =====
    useEffect(() => {
        async function loadTutorBookings() {
            try {
                const tutorId = localStorage.getItem("mongoUserId");
                if (!tutorId) {
                    console.warn("No mongoUserId found for tutor");
                    setEvents([]);
                    return;
                }

                // Try WITH teamsJoinUrl first
                const queryWithLink = `
          query ($tutorId: ID!) {
            bookingsByTutor(tutorId: $tutorId) {
              _id
              title
              start
              end
              iscompleted
              teamsJoinUrl
            }
          }
        `;

                // Fallback WITHOUT teamsJoinUrl (if schema doesn't have it)
                const queryWithoutLink = `
          query ($tutorId: ID!) {
            bookingsByTutor(tutorId: $tutorId) {
              _id
              title
              start
              end
              iscompleted
            }
          }
        `;

                let json = await gql(queryWithLink, { tutorId });

                if (json?.errors?.length) {
                    console.warn("GraphQL errors (with teamsJoinUrl). Retrying without it:", json.errors);
                    json = await gql(queryWithoutLink, { tutorId });
                }

                const list = json?.data?.bookingsByTutor ?? [];

                setEvents(
                    list.map((b) => ({
                        id: b._id,
                        title: b.title,
                        start: b.start,
                        end: b.end,
                        extendedProps: {
                            iscompleted: b.iscompleted,
                            teamsJoinUrl: b.teamsJoinUrl || "", // will be "" on fallback
                        },
                    }))
                );
            } catch (err) {
                console.error("Failed to load tutor bookings:", err);
                setEvents([]);
            }
        }

        loadTutorBookings();
    }, []);

    // ===== Courses =====
    useEffect(() => {
        loadEducatorCourses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function loadEducatorCourses() {
        try {
            const educatorId = localStorage.getItem("mongoUserId") || "";
            const url = educatorId
                ? `http://localhost:5000/api/courses?educatorId=${encodeURIComponent(educatorId)}`
                : `http://localhost:5000/api/courses?educatorId=all`;

            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch");
            const courses = await res.json();

            const container = document.getElementById("educatorCourseList");
            const emptyNotice = document.getElementById("noCoursesNotice");

            if (!container || !emptyNotice) return;

            container.innerHTML = "";

            if (!courses || courses.length === 0) {
                emptyNotice.style.display = "block";
                return;
            } else {
                emptyNotice.style.display = "none";
            }

            courses.forEach((c) => {
                const div = document.createElement("div");
                div.className = "course-card";
                div.innerHTML = `
          <h4>${escapeHtml(c.courseName)} ${c.courseCode ? `(${escapeHtml(c.courseCode)})` : ""
                    }</h4>
          <p><strong>Subject:</strong> ${escapeHtml(c.subject)}</p>
          <p><strong>Type:</strong> ${escapeHtml(c.type)}</p>
          <p>${escapeHtml(c.description || "")}</p>
          <button data-id="${c._id}">Delete</button>
        `;
                div.querySelector("button").onclick = () => deleteCourse(c._id);
                container.appendChild(div);
            });
        } catch (err) {
            console.error(err);
        }
    }

    const deleteCourse = useCallback(async (id) => {
  if (!window.confirm("Delete this offering?")) return;

  try {
    const res = await fetch(
      `${API_BASE || "http://localhost:5000"}/api/courses/${id}`,
      { method: "DELETE" }
    );
    if (!res.ok) throw new Error("Delete failed");

    // ✅ immediate UI update (no refetch needed)
    setCourses((prev) => prev.filter((c) => c._id !== id));

    // OR if you prefer refetch:
    // await loadCourses();
  } catch (err) {
    console.error(err);
    alert("Failed to delete course.");
  }
}, []);

    function escapeHtml(str) {
        if (!str) return "";
        return str.replace(/[&<>"']/g, (s) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        }[s]));
    }

    const displayName =
        localFullName?.trim() ||
        (educator ? `${educator.firstName} ${educator.lastName}` : "Educator Name");

    const displayDegree = localDegree?.trim() || educator?.educator?.degree || "Degree";
    const displayConcentration =
        localConcentration?.trim() || educator?.educator?.concentration || "Concentration";
    const displayAbout = localAbout?.trim() || "";

    return (
        <>
            {/* Top Bar */}
            <div className="top-bar">
                <button className="back-btn" onClick={goHome}>
                    ← Back
                </button>
                <div className="site-title">Noesis</div>

                <div className="dropdown">
                    <button className="dropdown-btn" onClick={toggleMenu}>
                        ⋮
                    </button>
                    <div className="dropdown-menu" ref={menuRef}>
                        <button onClick={editProfile}>Edit Profile</button>
                        <button onClick={settings}>Settings</button>
                        <button onClick={logout}>Log Out</button>
                    </div>
                </div>
            </div>

            {/* Banner */}
            <div
                className="banner"
                style={
                    bannerSrc
                        ? {
                            backgroundImage: `url(${bannerSrc})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }
                        : undefined
                }
            >
              <div className="profile-pic">
                {profileSrc && <img src={profileSrc} alt="Profile" />}
                </div>
            </div>

            {/* Layout */}
            <div className="page-layout">
                {/* LEFT */}
                <div className="profile-content">
                    <div className="profile-name">{displayName}</div>

                    <div className="profile-education">
                        {displayDegree} · {displayConcentration}
                    </div>

                    <div className="follower-count">
                        {tutorProfile?.tutor_rating ? `${tutorProfile.tutor_rating} ⭐` : "No rating yet"}
                        {tutorProfile?.tutor_rate ? ` · Rate: ${tutorProfile.tutor_rate}` : ""}
                    </div>

                    <div className="box">
                        <div className="box-header">
                            <h3>About</h3>
                        </div>
                        <p>
                            {displayAbout
                                ? displayAbout
                                : "Brief description of the educator, teaching philosophy, experience, and areas of expertise."}
                        </p>
                    </div>

                    <div className="box">
                        <h3>Credentials</h3>
                        <p>Uploaded academic and professional credentials.</p>
                    </div>

                    {/* Calendar */}
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

                    <div className="box">
                        <div className="box-header">
                            <h3>Course Offerings</h3>
                            <button className="add-btn" onClick={() => (window.location.href = "/courseoffering")}>
                                +
                            </button>
                        </div>

                       <div>
                            {coursesLoading ? (
                                <p className="empty-text">Loading courses...</p>
                            ) : courses.length === 0 ? (
                                <p className="empty-text">No courses added yet.</p>
                            ) : (
                                courses.map((c) => (
                                <div key={c._id} className="course-card">
                                    <h4>
                                    {c.courseName} {c.courseCode ? `(${c.courseCode})` : ""}
                                    </h4>
                                    <p><strong>Subject:</strong> {c.subject}</p>
                                    <p><strong>Type:</strong> {c.type}</p>
                                    <p>{c.description || ""}</p>
                                    <button onClick={() => deleteCourse(c._id)}>Delete</button>
                                </div>
                                ))
                            )}
                            </div>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="side-panel">
                    <div className="follow-box">
                        <h3>Followers</h3>

                        <div className="follow-placeholder">
                            <div className="follow-banner">
                                <div className="follow-pic"></div>
                            </div>
                        </div>

                        <p className="empty-text">No followers yet.</p>
                    </div>
                </div>
            </div>

            {/* Booking */}
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
                        style={{
                            background: "#fff",
                            padding: 20,
                            borderRadius: 12,
                            width: "min(520px, 92vw)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ marginTop: 0 }}>Booking Details</h3>
                        <p>
                            <b>Title:</b> {selectedBooking.title}
                        </p>
                        <p>
                            <b>Start:</b> {new Date(selectedBooking.start).toLocaleString()}
                        </p>
                        <p>
                            <b>End:</b> {new Date(selectedBooking.end).toLocaleString()}
                        </p>
                        <p>
                            <b>Completed:</b> {selectedBooking.iscompleted ? "Yes" : "No"}
                        </p>

                        {selectedBooking.teamsJoinUrl ? (
                            <p style={{ marginTop: 12 }}>
                                <b>Teams:</b>{" "}
                                <a href={selectedBooking.teamsJoinUrl} target="_blank" rel="noopener noreferrer">
                                    Join Teams Meeting
                                </a>
                            </p>
                        ) : (
                            <p style={{ marginTop: 12, opacity: 0.7 }}>
                                <b>Teams:</b> No meeting link available.
                            </p>
                        )}

                        <button onClick={closeModal}>Close</button>
                    </div>
                </div>
            )}
        </>
    );
}