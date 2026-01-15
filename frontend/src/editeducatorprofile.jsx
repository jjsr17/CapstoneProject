import { useEffect, useRef } from "react";
import "./editeducatorprofile.css";

export default function EditEducatorProfile() {
    const profilePreviewRef = useRef(null);
    const profileUploadRef = useRef(null);

    const goBack = () => {
        window.location.href = "educatoraccount";
    };

    const saveChanges = () => {
        alert("Educator profile updated.");
        window.location.href = "educatoraccount";
    };

    useEffect(() => {
        const input = profileUploadRef.current;

        const handleProfileUpload = (e) => {
            const file = e.target.files[0];
            if (file && profilePreviewRef.current) {
                profilePreviewRef.current.src = URL.createObjectURL(file);
            }
        };

        if (input) {
            input.addEventListener("change", handleProfileUpload);
        }

        return () => {
            if (input) {
                input.removeEventListener("change", handleProfileUpload);
            }
        };
    }, []);

    return (
        <>
            {/* Top Bar */}
            <div className="top-bar">
                <button className="back-btn" onClick={goBack}>
                    ← Back
                </button>
                <div className="site-title">Inov8r</div>
            </div>

            {/* Banner */}
            <div className="banner">
                <input type="file" id="bannerUpload" accept="image/*" />
                <label htmlFor="bannerUpload">Change Banner</label>
            </div>

            {/* Profile Image Area */}
            <div className="profile-area">
                <div className="profile-pic">
                    <img ref={profilePreviewRef} src="" alt="" />
                </div>

                <label className="profile-upload">
                    Change Profile Photo
                    <input
                        type="file"
                        accept="image/*"
                        ref={profileUploadRef}
                    />
                </label>
            </div>

            {/* Form */}
            <div className="form-container">
                <div className="section">
                    <h3>Professional Information</h3>

                    <div className="row">
                        <div className="input-group">
                            <label>Full Name</label>
                            <input />
                        </div>

                        <div className="input-group">
                            <label>Degree</label>
                            <select>
                                <option>Bachelor</option>
                                <option>Master</option>
                                <option>Doctorate</option>
                            </select>
                        </div>
                    </div>

                    {/* FIXED ROW */}
                    <div className="row single">
                        <div className="input-group">
                            <label>Concentration</label>
                            <input />
                        </div>
                    </div>
                </div>

                <div className="section">
                    <h3>About You</h3>
                    <textarea placeholder="Describe your experience and teaching approach..."></textarea>
                </div>

                <div className="button-row">
                    <button className="btn btn-cancel" onClick={goBack}>
                        Cancel
                    </button>
                    <button className="btn btn-save" onClick={saveChanges}>
                        Save Changes
                    </button>
                </div>
            </div>
        </>
    );
}
