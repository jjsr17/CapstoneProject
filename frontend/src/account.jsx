// frontend/src/account.jsx (WEB - Vite/React)
import React, { useEffect, useRef, useState } from "react";
import "./account.css";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function Account() {
  const menuRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [student, setStudent] = useState(null);

  const clean = (v) => {
    const s = v == null ? "" : String(v).trim();
    return s.length ? s : null;
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

  // Load student profile
  useEffect(() => {
    (async () => {
      try {
        const studentId = localStorage.getItem("mongoUserId");
        if (!studentId) return;

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
          body: JSON.stringify({ query, variables: { id: studentId } }),
        });

        const json = await res.json();
        setStudent(json.data?.userById ?? null);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Load bookings
  useEffect(() => {
    (async () => {
      try {
        const studentId = localStorage.getItem("mongoUserId");
        if (!studentId) return;

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
          body: JSON.stringify({ query, variables: { studentId } }),
        });

        const json = await res.json();

        setEvents(
          (json.data?.bookingsByStudent ?? []).map((b) => ({
            id: b._id,
            title: b.title,
            start: b.start,
            end: b.end,
            extendedProps: { iscompleted: b.iscompleted },
          }))
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const displayName = student
    ? [clean(student.firstName), clean(student.middleName), clean(student.lastName)]
        .filter(Boolean)
        .join(" ")
    : "Student";

  const schoolName = clean(student?.student?.schoolName) || "";
  const concentration = clean(student?.student?.concentration) || "";

  const toggleMenu = () => {
    if (!menuRef.current) return;
    menuRef.current.style.display =
      menuRef.current.style.display === "block" ? "none" : "block";
  };

  const logout = () => {
    localStorage.removeItem("mongoUserId");
    localStorage.removeItem("accountType");
    window.location.href = "/login";
  };

  const handleEventClick = (clickInfo) => {
    const e = clickInfo.event;
    setSelectedBooking({
      id: e.id,
      title: e.title,
      start: e.startStr,
      end: e.endStr,
      iscompleted: e.extendedProps.iscompleted,
    });
  };

  return (
    <>
      <div className="top-bar">
        <button className="back-btn" onClick={() => (window.location.href = "/mainmenu")}>
          ← Back
        </button>

        <div className="site-title">Inov8r</div>

        <div className="dropdown">
          <button className="dropdown-btn" onClick={toggleMenu}>
            ⋮
          </button>

          <div className="dropdown-menu" ref={menuRef}>
            <button onClick={() => (window.location.href = "/editprofile")}>Edit Profile</button>
            <button onClick={() => (window.location.href = "/settings")}>Settings</button>
            <button onClick={logout}>Log Out</button>
          </div>
        </div>
      </div>

      <div className="banner">
        <div className="profile-pic">
          <img src="" alt="" />
        </div>
      </div>

      <div className="main-layout">
        <div className="profile-content">
          <div className="profile-name">{displayName}</div>
          <div className="profile-education">
            {[schoolName, concentration].filter(Boolean).join(" · ")}
          </div>

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
              eventClick={handleEventClick}
            />

            <p className="empty-text" style={{ marginTop: 10 }}>
              Sessions loaded: {events.length}
            </p>
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
          onClick={() => setSelectedBooking(null)}
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
            <button onClick={() => setSelectedBooking(null)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
\