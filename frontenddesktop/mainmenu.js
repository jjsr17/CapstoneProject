import React, { useState } from "react";

export default function App() {
  const [feedback, setFeedback] = useState("");

  const goToPage = (page) => {
    // If you're using React Router later, you'd navigate differently.
    // For now this matches your original "go to another html file" behavior:
    const routes = {
      home: "mainmenu.html",
      tutors: "tutormainmenu.html",
      professors: "professormainmenu.html",
      account: "account.html",
    };

    window.location.href = routes[page] ?? "mainmenu.html";
  };

  const openCard = (type) => {
    alert("Opening: " + type + " section");
  };

  const submitFeedback = () => {
    // Placeholder: connect this to backend later
    if (!feedback.trim()) {
      alert("Please enter feedback before submitting.");
      return;
    }
    alert("Feedback submitted:\n" + feedback);
    setFeedback("");
  };

  return (
    <>
      <style>{`
        body {
          margin: 0;
          font-family: "Times New Roman", serif;
          background-color: white;
          color: #333;
        }

        /* Website title */
        header {
          text-align: center;
          padding: 30px 10px;
          background-color: white;
          border-bottom: 2px solid #eee;
        }

        header h1 {
          color: blueviolet;
          font-size: 60px;
          margin: 0;
        }

        /* Navigation bar */
        nav {
          display: flex;
          justify-content: center;
          background-color: white;
          border-bottom: 2px solid #ddd;
          padding: 10px 0;
          gap: 30px;
        }

        nav button {
          background-color: white;
          border: none;
          font-size: 18px;
          color: dimgrey;
          padding: 10px 20px;
          cursor: pointer;
          border-radius: 5px;
          transition: 0.2s;
        }

        nav button:hover {
          background-color: lightsteelblue;
        }

        /* Content */
        .container {
          width: 80%;
          margin: 30px auto;
        }

        /* Cards */
        .card {
          background-color: white;
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          cursor: pointer;
          transition: 0.2s;
        }

        .card:hover {
          transform: scale(1.02);
        }

        textarea {
          width: 100%;
          height: 120px;
          margin-top: 15px;
          border-radius: 6px;
          padding: 10px;
          font-size: 16px;
        }

        .submit-btn {
          background-color: blue;
          color: white;
          border: none;
          padding: 10px 15px;
          margin-top: 10px;
          cursor: pointer;
          border-radius: 5px;
        }
      `}</style>

      {/* Title */}
      <header>
        <h1>Inov8r</h1>
      </header>

      {/* Navigation */}
      <nav>
        <button onClick={() => goToPage("home")}>Home</button>
        <button onClick={() => goToPage("tutors")}>Tutors</button>
        <button onClick={() => goToPage("professors")}>Professors</button>
        <button onClick={() => goToPage("account")}>Account</button>
      </nav>

      {/* Main content */}
      <div className="container">
        <p>
          Welcome to our website! Here you will find many tutors ready to help
          you succeed in your classes. Please create an account to begin.
        </p>

        {/* Cards */}
        <div className="card" onClick={() => openCard("news")}>
          <h2>Latest News</h2>
          <p>Click to view the latest updates.</p>
        </div>

        <div className="card" onClick={() => openCard("info")}>
          <h2>Information</h2>
          <p>Learn more about our services.</p>
        </div>

        <div className="card" onClick={() => openCard("misc")}>
          <h2>Offerings</h2>
          <p>Educational content offers for learners.</p>
        </div>

        {/* Feedback */}
        <textarea
          placeholder="Provide your feedback..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />

        <button className="submit-btn" onClick={submitFeedback}>
          Submit
        </button>
      </div>
    </>
  );
}
