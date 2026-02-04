import { useEffect, useRef, useState } from "react";
import { useMsal } from "@azure/msal-react";

import "./educatoraccount.css";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function EducatorAccount() {
  const menuRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [educator, setEducator] = useState(null);
  const [tutorProfile, setTutorProfile] = useState(null);
  const { instance } = useMsal();

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

  // ===== Load educator profile + tutor profile (GraphQL) =====
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

  // ===== Load tutor bookings into calendar (GraphQL) =====
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

  // ===== Courses (kept as you wrote it, but FIXED the port to 5000) =====
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
          <h4>${escapeHtml(c.courseName)} ${
            c.courseCode ? `(${escapeHtml(c.courseCode)})` : ""
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

  async function deleteCourse(id) {
    if (!window.confirm("Delete this offering?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/courses/${id}`, {
        method: "DELETE",
      });
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
          <div className="profile-name">
            {educator ? `${educator.firstName} ${educator.lastName}` : "Educator Name"}
          </div>

          <div className="profile-education">
            {educator?.educator?.degree ?? "Degree"} ·{" "}
            {educator?.educator?.concentration ?? "Concentration"}
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
              Brief description of the educator, teaching philosophy, experience,
              and areas of expertise.
            </p>
          </div>

          <div className="box">
            <h3>Credentials</h3>
            <p>Uploaded academic and professional credentials.</p>
          </div>

          {/* ✅ Calendar box (ONLY ONCE, inside profile-content) */}
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
              <button
                className="add-btn"
                onClick={() => (window.location.href = "/courseoffering")}
              >
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
}
