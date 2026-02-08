import { useEffect, useRef, useState } from "react";
import "./account.css";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function Account() {
  const menuRef = useRef(null);
  const [events, setEvents] = useState([]);

  const toggleMenu = () => {
    if (!menuRef.current) return;
    menuRef.current.style.display =
      menuRef.current.style.display === "block" ? "none" : "block";
  };

  const goHome = () => (window.location.href = "mainmenu");
  const editProfile = () => (window.location.href = "editprofile");

  const settings = () => {
    localStorage.setItem("userRole", "student");
    window.location.href = "settings";
  };

  const logout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("mongoUserId");
    localStorage.removeItem("accountType");
    window.location.href = "login";
  };

  // close menu if clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".dropdown") && menuRef.current) {
        menuRef.current.style.display = "none";
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ✅ Load student sessions into calendar
  useEffect(() => {
    async function load() {
      try {
        const studentId = localStorage.getItem("mongoUserId");
        if (!studentId) {
          console.warn("No mongoUserId found in localStorage");
          setEvents([]);
          return;
        }

        const query = `
          query ($studentId: ID!) {
            sessionsByStudent(studentId: $studentId) {
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
          body: JSON.stringify({ query, variables: { studentId } }),
        });

        const json = await res.json();

<<<<<<< HEAD
                <div className="site-title">Noesis</div>
=======
        if (json.errors) {
          console.error(json.errors);
          setEvents([]);
          return;
        }
>>>>>>> origin

        setEvents(
          (json.data?.sessionsByStudent ?? []).map((s) => ({
            id: s._id,
            title: s.title,
            start: s.start,
            end: s.end,
          }))
        );
      } catch (err) {
        console.error(err);
        setEvents([]);
      }
    }

    load();
  }, []);

  return (
    <>
      {/* Top Navigation */}
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

      {/* Main Layout (uses your CSS class names) */}
      <div className="main-layout">
        {/* LEFT */}
        <div className="profile-content">
          <div className="profile-name">Student Name</div>
          <div className="profile-education">
            College Student · Computer Science
          </div>

          <div className="description-box">
            <p>
              This is a brief description about the student in Academic level,
              career and degree level they plan to reach.
            </p>
          </div>

          {/* ✅ Calendar (same behavior as educator) */}
          <div className="sessions-box">
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
        </div>

        {/* RIGHT */}
        <div className="sidebar">
          <div className="follow-box">
            <h3>Accounts You Follow</h3>

            <div className="follow-placeholder">
              <div className="follow-banner">
                <div className="follow-pic"></div>
              </div>
            </div>

            <p className="empty-text">
              You are not following any educators yet.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
