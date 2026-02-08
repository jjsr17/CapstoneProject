import { useCallback, useEffect, useMemo, useState } from "react";
import "./editeducatorprofile.css";

const BASE = {
    banner: "educatorBannerImage",
    profile: "educatorProfileImage",
    fullName: "educatorFullName",
    degree: "educatorDegree",
    concentration: "educatorConcentration",
    about: "educatorAbout",
};

export default function EditEducatorProfile() {
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

    const [bannerSrc, setBannerSrc] = useState(() => (userId ? localStorage.getItem(k(BASE.banner)) || "" : ""));
    const [profileSrc, setProfileSrc] = useState(() => (userId ? localStorage.getItem(k(BASE.profile)) || "" : ""));

    const [fullName, setFullName] = useState(() => (userId ? localStorage.getItem(k(BASE.fullName)) || "" : ""));
    const [degree, setDegree] = useState(() => (userId ? localStorage.getItem(k(BASE.degree)) || "Bachelor" : "Bachelor"));
    const [concentration, setConcentration] = useState(() => (userId ? localStorage.getItem(k(BASE.concentration)) || "" : ""));
    const [about, setAbout] = useState(() => (userId ? localStorage.getItem(k(BASE.about)) || "" : ""));

    const goBack = useCallback(() => {
        window.location.href = "/educatoraccount";
    }, []);

    const handleBannerChange = useCallback(
        (e) => {
            const file = e.target.files?.[0];
            if (!file || !userId) return;

            const reader = new FileReader();
            reader.onload = () => {
                const base64 = String(reader.result || "");
                setBannerSrc(base64);
                localStorage.setItem(k(BASE.banner), base64);
            };
            reader.readAsDataURL(file);

            e.target.value = "";
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
                localStorage.setItem(k(BASE.profile), base64);
            };
            reader.readAsDataURL(file);

            e.target.value = "";
        },
        [userId, k]
    );

    const saveChanges = useCallback(() => {
        if (!userId) {
            alert("No educator session found. Please log in again.");
            return;
        }

        localStorage.setItem(k(BASE.fullName), fullName);
        localStorage.setItem(k(BASE.degree), degree);
        localStorage.setItem(k(BASE.concentration), concentration);
        localStorage.setItem(k(BASE.about), about);

        if (bannerSrc) localStorage.setItem(k(BASE.banner), bannerSrc);
        if (profileSrc) localStorage.setItem(k(BASE.profile), profileSrc);

        alert("Educator profile updated.");
        window.location.href = "/educatoraccount";
    }, [userId, k, fullName, degree, concentration, about, bannerSrc, profileSrc]);

    return (
        <div className="eep-page">
            <div className="eep-topbar">
                <button className="eep-back" onClick={goBack}>
                    ← Back
                </button>
                <div className="eep-title">Noesis</div>
            </div>

            <div className="eep-banner">
                {bannerSrc ? <img className="eep-banner-img" src={bannerSrc} alt="" /> : null}

                <input
                    className="eep-banner-input"
                    type="file"
                    id="eepBannerUpload"
                    accept="image/*"
                    onChange={handleBannerChange}
                />
                <label className="eep-banner-label" htmlFor="eepBannerUpload">
                    Change Banner
                </label>
            </div>

            <div className="eep-profile-wrap">
                <div className="eep-profile-area">
                    <div className="eep-avatar">
                        <img src={profileSrc || ""} alt="" />
                    </div>

                    <label className="eep-upload">
                        Change Profile Photo
                        <input type="file" accept="image/*" onChange={handleProfileChange} />
                    </label>
                </div>
            </div>

            <div className="eep-form">
                <div className="eep-section">
                    <h3>Professional Information</h3>

                    <div className="eep-row">
                        <div className="eep-group">
                            <label>Full Name</label>
                            <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>

                        <div className="eep-group">
                            <label>Degree</label>
                            <select value={degree} onChange={(e) => setDegree(e.target.value)}>
                                <option>Bachelor</option>
                                <option>Master</option>
                                <option>Doctorate</option>
                            </select>
                        </div>
                    </div>

                    <div className="eep-row single">
                        <div className="eep-group">
                            <label>Concentration</label>
                            <input value={concentration} onChange={(e) => setConcentration(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="eep-section">
                    <h3>About You</h3>
                    <textarea
                        placeholder="Describe your experience and teaching approach..."
                        value={about}
                        onChange={(e) => setAbout(e.target.value)}
                    />
                </div>

                <div className="eep-actions">
                    <button className="eep-btn eep-cancel" onClick={goBack}>
                        Cancel
                    </button>
                    <button className="eep-btn eep-save" onClick={saveChanges}>
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
