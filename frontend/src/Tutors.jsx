console.log("Loaded Tutors.jsx");

import React, { useMemo, useState } from "react";

export default function Tutors() {
  const [search, setSearch] = useState("");

  const subjects = useMemo(
    () => [
      {
        key: "math",
        title: "Mathematics",
        desc: "Algebra, Calculus, Geometry",
        href: "mathtutors.html",
      },
      {
        key: "science",
        title: "Science",
        desc: "Biology, Chemistry, Physics",
        href: "sciencetutors.html",
      },
      {
        key: "history",
        title: "History",
        desc: "World & U.S. History",
        href: "historytutors.html",
      },
      {
        key: "english",
        title: "English",
        desc: "Writing, Literature, Grammar",
        href: "englishtutors.html",
      },
      {
        key: "computer-science",
        title: "Computer Science",
        desc: "Programming, Algorithms",
        href: "computer-sciencetutors.html",
      },
      {
        key: "electrical",
        title: "Electrical",
        desc: "Circuits, Power, Electronics",
        href: "electricaltutors.html",
      },
      {
        key: "spanish",
        title: "Spanish",
        desc: "Writing, Literature, Grammar",
        href: "spanishtutors.html",
      },
      {
        key: "architecture",
        title: "Architecture",
        desc: "Design, History",
        href: "architecturetutors.html",
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter((s) =>
      `${s.title} ${s.desc}`.toLowerCase().includes(q)
    );
  }, [search, subjects]);

  const openSubject = (href) => {
    // Same behavior as your HTML version:
    window.location.href = href;
  };

  return (
    <>
      <style>{`
        body {
          margin: 0;
          font-family: "Times New Roman", serif;
          background-color: white;
        }

        header {
          text-align: center;
          padding: 25px 10px;
          background-color: white;
          border-bottom: 2px solid #ddd;
        }

        header h1 {
          margin: 0;
          font-size: 50px;
          color: blueviolet;
        }

        /* Search Bar */
        .search-container {
          display: flex;
          justify-content: center;
          margin: 30px 0;
        }

        .search-container input {
          width: 50%;
          padding: 12px;
          font-size: 18px;
          border-radius: 8px;
          border: 1px solid #bbb;
        }

        /* Subject cards grid */
        .subjects {
          width: 80%;
          margin: auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 25px;
        }

        .subject-card {
          background-color: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          cursor: pointer;
          transition: 0.2s;
          text-align: center;
        }

        .subject-card:hover {
          transform: scale(1.05);
        }

        .subject-card h2 {
          margin: 0;
          font-size: 26px;
          color: #333;
        }

        .subject-card p {
          color: #666;
          margin-top: 10px;
        }
      `}</style>

      <header>
        <h1>Inov8r</h1>
      </header>

      {/* Search */}
      <div className="search-container">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subjects (Math, Science, History...)"
        />
      </div>

      {/* Subjects */}
      <div className="subjects" id="subjectsContainer">
        {filtered.map((s) => (
          <div
            key={s.key}
            className="subject-card"
            role="button"
            tabIndex={0}
            onClick={() => openSubject(s.href)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") openSubject(s.href);
            }}
          >
            <h2>{s.title}</h2>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
    </>
  );
}
