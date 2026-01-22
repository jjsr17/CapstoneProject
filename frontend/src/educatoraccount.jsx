<<<<<<< HEAD
﻿import { useEffect, useRef } from "react";
import "./EducatorAccount.css";
=======
﻿import { useEffect, useRef, useState } from "react";
import "./educatoraccount.css";
>>>>>>> origin

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function EducatorAccount() {
  const menuRef = useRef(null);
  const [events, setEvents] = useState([]);

<<<<<<< HEAD
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

    // ===== Dropdown (IDENTICAL behavior) =====
    function toggleMenu(e) {
        e.stopPropagation();
        const menu = menuRef.current;
        if (!menu) return;
        menu.style.display =
            menu.style.display === "block" ? "none" : "block";
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

    // ===== Backend =====
    useEffect(() => {
        loadEducatorCourses();
    }, []);

    async function loadEducatorCourses() {
        try {
            const educatorId = localStorage.getItem("userId") || "";
            const url = educatorId
                ? `http://localhost:5173/api/courses?educatorId=${encodeURIComponent(
                    educatorId
                )}`
                : `http://localhost:5173/api/courses?educatorId=all`;

            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch");
            const courses = await res.json();

            const container = document.getElementById("educatorCourseList");
            const emptyNotice = document.getElementById("noCoursesNotice");

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
                div.querySelector("button").onclick = () =>
                    deleteCourse(c._id);
                container.appendChild(div);
            });
        } catch (err) {
            console.error(err);
        }
    }

    async function deleteCourse(id) {
        if (!window.confirm("Delete this offering?")) return;
        try {
            const res = await fetch(
                `http://localhost:3000/api/courses/${id}`,
                { method: "DELETE" }
            );
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
            <div className="banner">
                <div className="profile-pic">
                    <img src="" alt="" />
                </div>
            </div>

            {/* Layout */}
            <div className="page-layout">
                {/* LEFT */}
                <div className="profile-content">
                    <div className="profile-name">Educator Name</div>
                    <div className="profile-education">
                        Degree · Concentration
                    </div>
                    <div className="follower-count">0 Followers</div>

                    <div className="box">
                        <div className="box-header">
                            <h3>About</h3>
                        </div>
                        <p>
                            Brief description of the educator, teaching philosophy,
                            experience, and areas of expertise.
                        </p>
                    </div>

                    <div className="box">
                        <h3>Credentials</h3>
                        <p>Uploaded academic and professional credentials.</p>
                    </div>

                    <div className="box">
                        <div className="box-header">
                            <h3>Course Offerings</h3>
                            <button
                                className="add-btn"
                                onClick={() =>
                                    (window.location.href = "/courseoffering")
                                }
                            >
                                +
                            </button>
                        </div>

                        <div id="educatorCourseList">
                            <p
                                className="empty-text"
                                id="noCoursesNotice"
                            >
                                No courses added yet.
                            </p>
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
        </>
    );
=======
  const toggleMenu = () => {
    if (!menuRef.current) return;
    menuRef.current.style.display =
      menuRef.current.style.display === "block" ? "none" : "block";
  };

  const goHome = () => (window.location.href = "mainmenu");
  const editProfile = () => (window.location.href = "editeducatorprofile");

  const settings = () => {
    localStorage.setItem("userRole", "tutor");
    window.location.href = "settings";
  };

  const logout = () => {
    localStorage.removeItem("userRole");
    window.location.href = "login";
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".dropdown") && menuRef.current) {
        menuRef.current.style.display = "none";
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ✅ Load tutor sessions into calendar
  useEffect(() => {
    async function load() {
      try {
        // For now, store tutor's Mongo ObjectId at login (ex: localStorage.setItem("tutorId", "..."))
        const tutorId = localStorage.getItem("tutorId");
        if (!tutorId) {
          console.warn("No tutorId found in localStorage");
          setEvents([]);
          return;
        }

        const query = `
          query($tutorId: ID!) {
            sessionsByTutor(tutorId: $tutorId) {
              _id
              title
              start
              end
              roomId
              mode
            }
          }
        `;

        const res = await fetch("http://localhost:5000/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, variables: { tutorId } }),
        });

        const json = await res.json();
        if (json.errors) {
          console.error(json.errors);
          return;
        }

        setEvents(
          (json.data?.sessionsByTutor ?? []).map((e) => ({
            id: e._id,
            title: e.title,
            start: e.start,
            end: e.end,
          }))
        );
      } catch (err) {
        console.error(err);
      }
    }

    load();
  }, []);

  return (
    <>
      {/* Top Bar */}
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
            <button onClick={editProfile}>Edit Profile</button>
            <button onClick={settings}>Settings</button>
            <button onClick={logout}>Log Out</button>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="banner">
        <div className="profile-pic">
          <img src="" alt="" />
        </div>
      </div>

      {/* Layout */}
      <div className="page-layout">
        {/* LEFT */}
        <div className="profile-content">
          <div className="profile-name">Educator Name</div>
          <div className="profile-education">Degree · Concentration</div>
          <div className="follower-count">0 Followers</div>

          <div className="box">
            <h3>About</h3>
            <p>
              Brief description of the educator, teaching philosophy, experience,
              and areas of expertise.
            </p>
          </div>

          <div className="box">
            <h3>Credentials</h3>
            <p>Uploaded academic and professional credentials.</p>
          </div>

          {/* ✅ Calendar Box */}
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
          </div>

          {/* Course Offerings */}
          <div className="box">
            <div className="box-header">
              <h3>Course Offerings</h3>
              <button
                className="add-btn"
                onClick={() => (window.location.href = "courseoffering")}
              >
                +
              </button>
            </div>
            <p className="empty-text">No courses added yet.</p>
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
    </>
  );
>>>>>>> origin
}
