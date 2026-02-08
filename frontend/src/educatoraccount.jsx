import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import "./educatoraccount.css";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

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
    const [educator, setEducator] = useState(null);
    const [tutorProfile, setTutorProfile] = useState(null);

    const mongoUserId = useMemo(() => localStorage.getItem("mongoUserId") || "", []);
    const k = useCallback((baseKey) => `user:${mongoUserId}:${baseKey}`, [mongoUserId]);

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
    const [bannerSrc, setBannerSrc] = useState(() => (mongoUserId ? localStorage.getItem(k(BASE.banner)) || "" : ""));
    const [profileSrc, setProfileSrc] = useState(() => (mongoUserId ? localStorage.getItem(k(BASE.profile)) || "" : ""));
    const [localFullName, setLocalFullName] = useState(() => (mongoUserId ? localStorage.getItem(k(BASE.fullName)) || "" : ""));
    const [localDegree, setLocalDegree] = useState(() => (mongoUserId ? localStorage.getItem(k(BASE.degree)) || "" : ""));
    const [localConcentration, setLocalConcentration] = useState(() => (mongoUserId ? localStorage.getItem(k(BASE.concentration)) || "" : ""));
    const [localAbout, setLocalAbout] = useState(() => (mongoUserId ? localStorage.getItem(k(BASE.about)) || "" : ""));

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
    function logout() {
        localStorage.removeItem("userRole");
        window.location.href = "/login";
    }

    // ===== Dropdown =====
    function toggleMenu(e) {
        e.stopPropagation();
        const menu = menuRef.current;
        if (!menu) return;
        menu.style.display = menu.style.display === "block" ? "none" : "block";
    }

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

                const res = await fetch("http://localhost:5000/graphql", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query, variables: { id: tutorId } }),
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

    useEffect(() => {
        async function loadTutorBookings() {
            try {
                const tutorId = localStorage.getItem("mongoUserId");
                if (!tutorId) {
                    console.warn("No mongoUserId found for tutor");
                    setEvents([]);
                    return;
                }

                const query = `
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

                const res = await fetch("http://localhost:5000/graphql", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query, variables: { tutorId } }),
                });

                const json = await res.json();

                setEvents(
                    (json.data?.bookingsByTutor ?? []).map((b) => ({
                        id: b._id,
                        title: b.title,
                        start: b.start,
                        end: b.end,
                        extendedProps: { iscompleted: b.iscompleted },
                    }))
                );
            } catch (err) {
                console.error("Failed to load tutor bookings:", err);
                setEvents([]);
            }
        }

        loadTutorBookings();
    }, []);

    useEffect(() => {
        loadEducatorCourses();
      
    }, []);

    async function loadEducatorCourses() {
        try {
            const educatorId = localStorage.getItem("mongoUserId") || "";

            const container = document.getElementById("educatorCourseList");
            const emptyNotice = document.getElementById("noCoursesNotice");

            if (!container || !emptyNotice) return;

            container.innerHTML = "";

            if (!educatorId) {
                emptyNotice.style.display = "block";
                return;
            }

            const url = `http://localhost:5000/api/courses?educatorId=${encodeURIComponent(educatorId)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch");
            const courses = await res.json();

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
          <h4>${escapeHtml(c.courseName)} ${c.courseCode ? `(${escapeHtml(c.courseCode)})` : ""}</h4>
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

    async function deleteCourse(id) {
        if (!window.confirm("Delete this offering?")) return;
        try {
            const res = await fetch(`http://localhost:5000/api/courses/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            loadEducatorCourses();
        } catch (err) {
            console.error(err);
            alert("Failed to delete course.");
        }
    }

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
        localFullName?.trim() || (educator ? `${educator.firstName} ${educator.lastName}` : "Educator Name");

    const displayDegree = localDegree?.trim() || educator?.educator?.degree || "Degree";
    const displayConcentration = localConcentration?.trim() || educator?.educator?.concentration || "Concentration";
    const displayAbout = localAbout?.trim() || "";

    return (
        <>
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

                        <div id="educatorCourseList">
                            <p className="empty-text" id="noCoursesNotice">
                                No courses added yet.
                            </p>
                        </div>
                    </div>
                </div>

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
        </>
    );
}
