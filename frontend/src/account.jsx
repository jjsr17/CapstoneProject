// frontend/src/account.jsx (WEB - Vite/React) — refactored (cleaner hooks, matches EducatorAccount layout/classes)
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMsal } from "@azure/msal-react";

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
  const { instance } = useMsal();

  const mongoUserId = useMemo(() => localStorage.getItem("mongoUserId"), []);

  const clean = useCallback((v) => {
    const s = v == null ? "" : String(v).trim();
    return s.length ? s : null;
  }, []);

  const closeMenu = useCallback(() => {
    if (menuRef.current) menuRef.current.style.display = "none";
  }, []);

  const toggleMenu = useCallback((e) => {
    // prevents immediate close from the document click handler
    e.stopPropagation();
    if (!menuRef.current) return;

    menuRef.current.style.display =
      menuRef.current.style.display === "block" ? "none" : "block";
  }, []);

  const goHome = useCallback(() => {
    window.location.href = "/mainmenu";
  }, []);

  const goEditProfile = useCallback(() => {
    window.location.href = "/editprofile";
  }, []);

  const goSettings = useCallback(() => {
    window.location.href = "/settings";
  }, []);

 const logout = useCallback(async () => {
  // clear app storage
  localStorage.removeItem("mongoUserId");
  localStorage.removeItem("accountType");
  localStorage.removeItem("tutorId");
  localStorage.removeItem("profileComplete");
  localStorage.removeItem("useMsSso");
  localStorage.removeItem("msAccessToken");
  localStorage.removeItem("msGraphAccessToken");
  localStorage.removeItem("userRole");

  // if MSAL has an account, sign out properly
  const accounts = instance.getAllAccounts();
  if (accounts.length > 0) {
    instance.setActiveAccount(null);
    await instance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin + "/login",
    });
    return; // redirect happens
  }

  window.location.href = "/login";
}, [instance]);


  // Close menu if clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".dropdown")) closeMenu();
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [closeMenu]);

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
    if (!student) return "Student";
    return [clean(student.firstName), clean(student.middleName), clean(student.lastName)]
      .filter(Boolean)
      .join(" ");
  }, [student, clean]);

  const schoolName = useMemo(() => clean(student?.student?.schoolName) || "", [student, clean]);
  const concentration = useMemo(
    () => clean(student?.student?.concentration) || "",
    [student, clean]
  );

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
            <button onClick={goEditProfile}>Edit Profile</button>
            <button onClick={goSettings}>Settings</button>
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

      {/* Layout — educator-style */}
      <div className="page-layout">
        {/* LEFT */}
        <div className="profile-content">
          <div className="profile-name">{displayName}</div>

          <div className="profile-education">
            {[schoolName, concentration].filter(Boolean).join(" · ")}
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

        {/* RIGHT (optional but matches educator look) */}
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

      {/* Booking modal */}
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
            <button onClick={closeModal}>Close</button>
          </div>
        </div> 
      )}
    </>
  );
}
