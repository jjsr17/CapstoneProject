import { useEffect, useRef } from "react";
import "./editprofile.css";

export default function EditProfile() {
    const profilePreviewRef = useRef(null);
    const profileUploadRef = useRef(null);

    const goBack = () => {
        window.location.href = "account";
    };

    const saveChanges = () => {
        alert("Profile changes saved.");
        window.location.href = "account";
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
                <div className="site-title">Noesis</div>
            </div>

            {/* Banner */}
            <div className="banner">
                <input type="file" id="bannerUpload" accept="image/*" />
                <label className="banner-label" htmlFor="bannerUpload">
                    Change Banner
                </label>
            </div>

            {/* Profile Image */}
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
                    <h2>Basic Information</h2>

                    <div className="row">
                        <div className="input-group">
                            <label>First Name</label>
                            <input />
                        </div>

                        <div className="input-group">
                            <label>Last Name</label>
                            <input />
                        </div>
                    </div>

                    <div className="row">
                        <div className="input-group">
                            <label>Education Level / Concentration</label>
                            <input />
                        </div>
                    </div>
                </div>

                <div className="section">
                    <h2>About You</h2>
                    <div className="input-group">
                        <label>Description</label>
                        <textarea></textarea>
                    </div>
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
