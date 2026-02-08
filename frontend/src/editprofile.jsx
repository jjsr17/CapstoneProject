import { useCallback, useEffect, useMemo, useState } from "react";
import "./editprofile.css";

const BASE = {
    bannerImage: "bannerImage",
    profileImage: "profileImage",

    firstName: "profileFirstName",
    lastName: "profileLastName",
    education: "profileEducation",
    description: "profileDescription",
};

export default function EditProfile() {
    const userId = useMemo(() => localStorage.getItem("mongoUserId") || "", []);
    const k = useCallback((baseKey) => `user:${userId}:${baseKey}`, [userId]);

    useEffect(() => {
        if (!userId) return;

        Object.values(BASE).forEach((baseKey) => {
            const namespacedKey = k(baseKey);
            if (localStorage.getItem(namespacedKey) == null) {
                const oldVal = localStorage.getItem(baseKey);
                if (oldVal != null) localStorage.setItem(namespacedKey, oldVal);
            }
        });
    }, [userId, k]);

    const [bannerSrc, setBannerSrc] = useState(() => (userId ? localStorage.getItem(k(BASE.bannerImage)) || "" : ""));
    const [profileSrc, setProfileSrc] = useState(() => (userId ? localStorage.getItem(k(BASE.profileImage)) || "" : ""));

    const [firstName, setFirstName] = useState(() => (userId ? localStorage.getItem(k(BASE.firstName)) || "" : ""));
    const [lastName, setLastName] = useState(() => (userId ? localStorage.getItem(k(BASE.lastName)) || "" : ""));
    const [education, setEducation] = useState(() => (userId ? localStorage.getItem(k(BASE.education)) || "" : ""));
    const [description, setDescription] = useState(() => (userId ? localStorage.getItem(k(BASE.description)) || "" : ""));

    const goBack = useCallback(() => {
        window.location.href = "/account";
    }, []);

    const handleBannerChange = useCallback(
        (e) => {
            const file = e.target.files?.[0];
            if (!file || !userId) return;

            const reader = new FileReader();
            reader.onload = () => {
                const base64 = String(reader.result || "");
                setBannerSrc(base64);
                localStorage.setItem(k(BASE.bannerImage), base64);
            };
            reader.readAsDataURL(file);
        },
        [userId, k]
    );

    const handleProfileChange = useCallback(
        (e) => {
            const file = e.target.files?.[0];
            if (!file || !userId) return;

            const reader = new FileReader();
            reader.onload = () => {
                const base64 = String(reader.result || "");
                setProfileSrc(base64);
                localStorage.setItem(k(BASE.profileImage), base64);
            };
            reader.readAsDataURL(file);
        },
        [userId, k]
    );

    const saveChanges = useCallback(() => {
        if (!userId) {
            alert("No user session found. Please log in again.");
            return;
        }

        localStorage.setItem(k(BASE.firstName), firstName);
        localStorage.setItem(k(BASE.lastName), lastName);
        localStorage.setItem(k(BASE.education), education);
        localStorage.setItem(k(BASE.description), description);

        if (bannerSrc) localStorage.setItem(k(BASE.bannerImage), bannerSrc);
        if (profileSrc) localStorage.setItem(k(BASE.profileImage), profileSrc);

        alert("Profile changes saved.");
        window.location.href = "/account";
    }, [userId, k, firstName, lastName, education, description, bannerSrc, profileSrc]);

    useEffect(() => {
        if (!userId) return;

        const onStorage = () => {
            setFirstName(localStorage.getItem(k(BASE.firstName)) || "");
            setLastName(localStorage.getItem(k(BASE.lastName)) || "");
            setEducation(localStorage.getItem(k(BASE.education)) || "");
            setDescription(localStorage.getItem(k(BASE.description)) || "");
            setBannerSrc(localStorage.getItem(k(BASE.bannerImage)) || "");
            setProfileSrc(localStorage.getItem(k(BASE.profileImage)) || "");
        };

        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [userId, k]);

    return (
        <div className="ep-page">
            {/* Top Bar */}
            <div className="ep-topbar">
                <button className="ep-back" onClick={goBack}>
                    ← Back
                </button>
                <div className="ep-title">Inov8r</div>
            </div>

            {/* Banner */}
            <div className="ep-banner">
                {bannerSrc ? <img className="ep-banner-img" src={bannerSrc} alt="" /> : null}

                <input
                    className="ep-banner-input"
                    type="file"
                    id="epBannerUpload"
                    accept="image/*"
                    onChange={handleBannerChange}
                />
                <label className="ep-banner-label" htmlFor="epBannerUpload">
                    Change Banner
                </label>
            </div>

            {/* Profile Area */}
            <div className="ep-profile-wrap">
                <div className="ep-profile-area">
                    <div className="ep-avatar">
                        <img src={profileSrc || ""} alt="" />
                    </div>

                    <label className="ep-upload">
                        Change Profile Photo
                        <input type="file" accept="image/*" onChange={handleProfileChange} />
                    </label>
                </div>
            </div>

            {/* Form */}
            <div className="ep-form">
                <div className="ep-section">
                    <h2>Basic Information</h2>

                    <div className="ep-row">
                        <div className="ep-group">
                            <label>First Name</label>
                            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                        </div>

                        <div className="ep-group">
                            <label>Last Name</label>
                            <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                        </div>
                    </div>

                    <div className="ep-row">
                        <div className="ep-group">
                            <label>Education Level / Concentration</label>
                            <input value={education} onChange={(e) => setEducation(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="ep-section">
                    <h2>About You</h2>
                    <div className="ep-group">
                        <label>Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                </div>

                <div className="ep-actions">
                    <button className="ep-btn ep-cancel" onClick={goBack}>
                        Cancel
                    </button>
                    <button className="ep-btn ep-save" onClick={saveChanges}>
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
