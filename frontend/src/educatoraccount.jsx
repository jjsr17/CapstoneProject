import { useEffect, useRef } from "react";
import "./educatoraccount.css";

export default function EducatorAccount() {
    const menuRef = useRef(null);

    const toggleMenu = () => {
        if (!menuRef.current) return;
        menuRef.current.style.display =
            menuRef.current.style.display === "block" ? "none" : "block";
    };

    const goHome = () => {
        window.location.href = "mainmenu";
    };

    const editProfile = () => {
        window.location.href = "editeducatorprofile";
    };

    const settings = () => {
        localStorage.setItem("userRole", "tutor");
        window.location.href = "settings.jsx";
    };

    const logout = () => {
        localStorage.removeItem("userRole");
        window.location.href = "login.jsx";
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
                            Brief description of the educator, teaching philosophy,
                            experience, and areas of expertise.
                        </p>
                    </div>

                    <div className="box">
                        <h3>Credentials</h3>
                        <p>Uploaded academic and professional credentials.</p>
                    </div>

                    {/* Course Offerings */}
                    <div className="box">
                        <div className="box-header">
                            <h3>Course Offerings</h3>
                            <button
                                className="add-btn"
                                onClick={() =>
                                    (window.location.href = "courseoffering.jsx")
                                }
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
}
