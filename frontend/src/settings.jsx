import { useEffect, useState } from "react";
import "./settings.css";

export default function Settings() {
    const [activeSection, setActiveSection] = useState("preferences");

    const [preferences, setPreferences] = useState({
        emailNotifications: false,
        sessionReminders: false,
        messageAlerts: false,
        theme: "light"
    });

    const [messagingPrivacy, setMessagingPrivacy] = useState("everyone");

    const [emailForm, setEmailForm] = useState({
        oldEmail: "",
        newEmail: "",
        password: ""
    });

    const [passwordForm, setPasswordForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [deleteForm, setDeleteForm] = useState({
        email: "",
        password: ""
    });

    function goBack() {
        const role = localStorage.getItem("role");
        window.location.href =
            role === "educator" ? "educatoraccount" : "account";
    }

    function savePreferences() {
        document.body.classList.toggle("dark", preferences.theme === "dark");

        fetch("/api/settings/preferences", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(preferences)
        });

        alert("Preferences saved");
    }

    async function savePrivacy() {
        await fetch("/api/settings/privacy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messagingPrivacy })
        });

        alert("Privacy updated");
    }

    async function updateEmail() {
        await fetch("/api/settings/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(emailForm)
        });

        alert("Email updated");
    }

    async function updatePassword() {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        await fetch("/api/settings/password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword
            })
        });

        alert("Password updated");
    }

    async function deleteAccount() {
        if (!confirm("This action is permanent. Continue?")) return;

        await fetch("/api/account/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(deleteForm)
        });

        window.location.href = "LoginMenu";
    }

    useEffect(() => {
        document.body.classList.toggle("dark", preferences.theme === "dark");
    }, [preferences.theme]);

    return (
        <>
            {/* Top Bar */}
            <div className="top-bar">
                <button className="back-btn" onClick={goBack}>← Back</button>
                <div className="site-title">Noesis</div>
            </div>

            <div className="settings-wrapper">

                {/* Sidebar */}
                <div className="settings-sidebar">
                    <h2>Settings</h2>

                    {[
                        ["preferences", "Preferences"],
                        ["privacy", "Privacy"],
                        ["security", "Security"],
                        ["account", "Delete Account"]
                    ].map(([id, label]) => (
                        <button
                            key={id}
                            className={activeSection === id ? "active" : ""}
                            onClick={() => setActiveSection(id)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="settings-content">

                    {/* Preferences */}
                    <div className={`section ${activeSection === "preferences" ? "active" : ""}`}>
                        <h3>Preferences</h3>

                        {[
                            ["emailNotifications", "Email notifications"],
                            ["sessionReminders", "Session reminders"],
                            ["messageAlerts", "Message alerts"]
                        ].map(([key, label]) => (
                            <div className="checkbox-row" key={key}>
                                <input
                                    type="checkbox"
                                    checked={preferences[key]}
                                    onChange={e =>
                                        setPreferences({ ...preferences, [key]: e.target.checked })
                                    }
                                />
                                <label>{label}</label>
                            </div>
                        ))}

                        <label>Theme</label>
                        <select
                            className="theme-select"
                            value={preferences.theme}
                            onChange={e =>
                                setPreferences({ ...preferences, theme: e.target.value })
                            }
                        >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                        </select>

                        <button className="save-btn" onClick={savePreferences}>
                            Save Preferences
                        </button>
                    </div>

                    {/* Privacy */}
                    <div className={`section ${activeSection === "privacy" ? "active" : ""}`}>
                        <h3>Privacy</h3>

                        <label>Who can message me?</label>
                        <select
                            className="theme-select"
                            value={messagingPrivacy}
                            onChange={e => setMessagingPrivacy(e.target.value)}
                        >
                            <option value="everyone">Everyone</option>
                            <option value="following">Following</option>
                            <option value="none">No one</option>
                        </select>

                        <button className="save-btn" onClick={savePrivacy}>
                            Save Privacy Settings
                        </button>
                    </div>

                    {/* Security */}
                    <div className={`section ${activeSection === "security" ? "active" : ""}`}>
                        <h3>Security</h3>

                        <h4>Change Email</h4>
                        <input
                            placeholder="Current Email"
                            onChange={e => setEmailForm({ ...emailForm, oldEmail: e.target.value })}
                        />
                        <input
                            placeholder="New Email"
                            onChange={e => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                        />
                        <input
                            type="password"
                            placeholder="Current Password"
                            onChange={e => setEmailForm({ ...emailForm, password: e.target.value })}
                        />

                        <button className="save-btn" onClick={updateEmail}>Update Email</button>

                        <hr style={{ margin: "30px 0" }} />

                        <h4>Change Password</h4>
                        <input
                            type="password"
                            placeholder="Current Password"
                            onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                        />
                        <input
                            type="password"
                            placeholder="New Password"
                            onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        />
                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        />

                        <button className="save-btn" onClick={updatePassword}>
                            Update Password
                        </button>
                    </div>

                    {/* Delete Account */}
                    <div className={`section danger ${activeSection === "account" ? "active" : ""}`}>
                        <h3>Delete Account</h3>

                        <input
                            placeholder="Email"
                            onChange={e => setDeleteForm({ ...deleteForm, email: e.target.value })}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            onChange={e => setDeleteForm({ ...deleteForm, password: e.target.value })}
                        />

                        <button className="save-btn" onClick={deleteAccount}>
                            Confirm Account Deletion
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
}