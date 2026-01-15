import { useEffect, useRef } from "react";
import "./account.css";

export default function StudentAccount() {
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
        window.location.href = "editprofile";
    };

    const settings = () => {
        localStorage.setItem("userRole", "student");
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

            {/* Main Layout */}
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

                    <div className="sessions-box">
                        <h3>Scheduled Tutoring & Meetings</h3>
                        <p className="empty-text">No sessions scheduled yet.</p>
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
