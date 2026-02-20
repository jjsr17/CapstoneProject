// src/signup.jsx (or SignUpMenu.jsx)
import React, { useEffect, useMemo, useRef, useState } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import LoginBG from "./assets/artbackground.jpeg";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const COMPLETE_PROFILE = gql`
  mutation CompleteProfile($input: CompleteProfileInput!) {
    completeProfile(input: $input) {
      _id
      accountType
      profileComplete
      user_email
      firstName
      lastName
      authProvider
      msOid
      msUpn
      teamsEnabled
    }
  }
`;

// LocalStorage keys
const LS = {
    useMsSso: "useMsSso",
    msAccessToken: "msAccessToken",
    mongoUserId: "mongoUserId",
    accountType: "accountType",
    tutorId: "tutorId",
    profileComplete: "profileComplete",
};

const ME = gql`
  query Me {
    me {
      firstName
      lastName
      user_email
    }
  }
`;

/* Input sanitizers */
function sanitizeLettersSpaces(value) {
    // letters + spaces + common name punctuation (', -, .)
    // keeps integrity for names like "O'Neil", "Mary-Jane", "St. John"
    return String(value || "").replace(/[^a-zA-Z\s'.-]/g, "");
}

function sanitizeDigits(value) {
    return String(value || "").replace(/[^\d]/g, "");
}

function formatUsPhone(digits) {
  const d = String(digits || "").replace(/\D/g, "").slice(0, 10);

  const a = d.slice(0, 3);
  const b = d.slice(3, 6);
  const c = d.slice(6, 10);

  if (d.length === 0) return "";
  if (d.length < 4) return `(${a}`;
  if (d.length < 7) return `(${a}) ${b}`;
  return `(${a}) ${b}-${c}`;
}

function sanitizePhone(value) {
  // ✅ keep ONLY digits, limit to 10, and format
  const digits = String(value || "").replace(/\D/g, "").slice(0, 10);
  return formatUsPhone(digits);
}

function isValidEmailDomain(value) {
    const v = String(value || "").trim();
    if (!v) return false;

    // must have @ and end with ".something" (at least 2 letters)
    // examples: .com .me .edu .co.uk (this allows multi-part TLDs)
    return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}(\.[A-Za-z]{2,})?$/.test(v);
}

export default function SignUpMenu() {
    // read once per page load
    const useMs = useMemo(() => localStorage.getItem(LS.useMsSso) === "true", []);
    const msToken = useMemo(() => localStorage.getItem(LS.msAccessToken) || "", []);
    const [completeProfileMutation] = useMutation(COMPLETE_PROFILE);
    const isMsMode = useMs === true;
    const hasMsToken = !!msToken;

    // If someone lands in "ms mode" but token is missing, treat as local
    const isLocalMode = !isMsMode || !hasMsToken;

    // Names
    const [firstName, setFirstName] = useState("");
    const [middleName, setMiddleName] = useState("");
    const [lastName, setLastName] = useState("");

    // Demographics
    const [gender, setGender] = useState("");
    const [age, setAge] = useState("");
    const [birthDate, setBirthDate] = useState("");

    // Address
    const [address, setAddress] = useState("");
    const [town, setTown] = useState("");
    const [stateField, setStateField] = useState("");
    const [country, setCountry] = useState("");

    // Account type
    const [accountType, setAccountType] = useState(""); // student | educator

    // Student fields
    const [schoolName, setSchoolName] = useState("");
    const [educationLevel, setEducationLevel] = useState(""); // school | college
    const [grade, setGrade] = useState("");
    const [collegeYear, setCollegeYear] = useState("");
    const [studentConcentration, setStudentConcentration] = useState("");
    const [degreeType, setDegreeType] = useState("Associate");

    // Educator fields
    const [educatorCollegeName, setEducatorCollegeName] = useState("");
    const [educatorDegree, setEducatorDegree] = useState("Bachelor");
    const [educatorConcentration, setEducatorConcentration] = useState("");
    const [credentialFile, setCredentialFile] = useState(null);

    // Contact
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");

    // Passwords (LOCAL only)
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    // Drop zone
    const fileInputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);
    const fileName = useMemo(() => credentialFile?.name ?? "", [credentialFile]);

    // Only query ME if MS mode AND token exists
    const shouldAutofillFromMe = isMsMode && hasMsToken;

    const { data, loading, error } = useQuery(ME, {
        fetchPolicy: "network-only",
        skip: !shouldAutofillFromMe,
    });

    useEffect(() => {
        if (!shouldAutofillFromMe) return;
        if (loading) return;

        if (error) {
            console.error("Signup ME query error:", error);
            return;
        }

        const me = data?.me;
        if (!me) return;

        setFirstName((v) => v || me.firstName || "");
        setLastName((v) => v || me.lastName || "");
        setEmail((v) => v || me.user_email || "");
    }, [shouldAutofillFromMe, loading, error, data]);

    const handleFile = (file) => {
        if (!file || file.type !== "application/pdf") {
            alert("Only PDF files are allowed.");
            return;
        }
        setCredentialFile(file);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        handleFile(file);
    };

    const goBack = () => {
        window.location.href = "/login";
    };

    const createAccount = async (e) => {
        e.preventDefault();

        if (!accountType) return alert("Please select an account type.");
        if (!email.trim()) return alert("Please enter an email address.");

        // ✅ email must be in valid domain format (user@provider.tld)
        if (!isValidEmailDomain(email)) {
            return alert("Please enter a valid email (example: name@gmail.com).");
        }

        // ✅ Only require password for LOCAL mode
        if (isLocalMode) {
            if (!password) return alert("Please enter a password.");
            if (password !== confirmPassword) return alert("Passwords do not match.");
        }
        
        const phoneDigits = phone.replace(/\D/g, "");
        if (phoneDigits.length !== 10) {
        return alert("Phone number must be exactly 10 digits.");
        }
        const payload = {
            firstName,
            middleName,
            lastName,
            gender,
            age,
            birthDate,
            address,
            town,
            stateField,
            country,
            phone,

            user_email: email.trim(),
            accountType,

            // ✅ Only send password for local signups
            password: isLocalMode ? password : undefined,

            student:
                accountType === "student"
                    ? {
                        schoolName,
                        educationLevel,
                        grade,
                        collegeYear,
                        concentration: studentConcentration,
                        degreeType,
                    }
                    : undefined,

            educator:
                accountType === "educator"
                    ? {
                        collegeName: educatorCollegeName,
                        degree: educatorDegree,
                        concentration: educatorConcentration,
                        credentialsFileName: credentialFile?.name || "",
                    }
                    : undefined,
        };

        try {
            const url = API_BASE ? `${API_BASE}/api/users/signup` : "/api/users/signup";

            const headers = { "Content-Type": "application/json" };

            // ✅ Only attach auth header when MS token exists
            if (isMsMode && hasMsToken) headers.Authorization = `Bearer ${msToken}`;

           const res = await fetch(url, {
                method: "POST",
                headers,
                credentials: "include",
                body: JSON.stringify(payload),
                });
                
             const raw = await res.text();
            let respData = null;
            try { respData = raw ? JSON.parse(raw) : null; } catch {}

            if (!res.ok) {
            alert(respData?.message || raw || "Signup failed");
            return;
            }

            if (isMsMode && hasMsToken) {
                const resp = await completeProfileMutation({
                    variables: {
                        input: {
                            accountType,
                            firstName,
                            lastName,
                            phone,
                        },
                    },
                    context: {
                        headers: {
                            Authorization: `Bearer ${msToken}`,
                        },
                    },
                });

                const user = resp?.data?.completeProfile;
                if (!user?._id) {
                    alert("Microsoft profile completion failed.");
                    return;
                }

                localStorage.setItem(LS.mongoUserId, user._id);
                localStorage.setItem(LS.tutorId, user._id);
                localStorage.setItem(LS.accountType, user.accountType || accountType);
                localStorage.setItem(LS.profileComplete, String(!!user.profileComplete));

                window.location.href =
                    user.accountType === "educator" ? "/educatoraccount" : "/mainmenu";
                return;
            }
            
          

            // accept multiple backend shapes
            const userId =
            respData?.userId ||
            respData?._id ||
            respData?.id ||
            respData?.user?._id ||
            respData?.user?.id;

            console.log("signup response:", respData);
            console.log("resolved userId:", userId);

            if (!userId) {
            alert("Signup succeeded but no user id was returned. Check server response shape.");
            return;
            }
            // Your backend currently returns { ok, userId }
            // const userId = respData?.userId;
           
            localStorage.setItem(LS.mongoUserId, userId);
            localStorage.setItem(LS.tutorId, userId);
            // store accountType from form selection
            localStorage.setItem(LS.accountType, accountType);

            if (accountType.trim().toLowerCase() === "educator") {
                window.location.href = "/educatoraccount";
            } else {
                window.location.href = "/mainmenu";
            }
        } catch (err) {
            console.error(err);
            alert("Server error");
        }
    };

    return (
        <>
            <style>{`
        body {
          margin: 0;
          background-color: white;
          font-family: "Times New Roman", serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;

          background-image: url(${LoginBG});
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        .signup-box {
          background-color: white;
          width: 640px;
          padding: 30px;
          border-radius: 14px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }
        .signup-box h1 {
          text-align: center;
          color: blueviolet;
          font-size: 42px;
          margin-bottom: 25px;
        }
        .row { display: flex; gap: 20px; }
        .row.names { gap: 25px; }
        .row.demographics {
          justify-content: center;
          align-items: flex-end;
          flex-wrap: nowrap;
          gap: 25px;
        }
        .row.region { gap: 25px; }
        .input-group { margin-bottom: 15px; width: 100%; }
        .input-group label { display: block; font-size: 15px; margin-bottom: 5px; }
        .input-group input,
        .input-group select {
          width: 100%;
          padding: 10px;
          font-size: 15px;
          border-radius: 6px;
          border: 1px solid #ccc;
          box-sizing: border-box;
        }
        .input-small { max-width: 110px; }
        .input-xsmall { max-width: 40px; }
        .input-medium { max-width: 100px; }
        .password-wrapper { position: relative; }
        .toggle-password {
          position: absolute;
          right: 10px;
          top: 9px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px 4px;
        }
        .hidden { display: none; }
        .button-row {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }
        .btn {
          width: 48%;
          padding: 12px;
          font-size: 16px;
          border-radius: 6px;
          cursor: pointer;
          border: none;
        }
        .btn-back { background-color: #e6e6e6; }
        .btn-create { background-color: blue; color: white; }
        .drop-zone {
          border: 2px dashed #aaa;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          color: #666;
          transition: 0.2s;
          user-select: none;
        }
        .drop-zone.dragover {
          background-color: #f3eaff;
          border-color: blueviolet;
        }
        .file-name {
          margin-top: 8px;
          font-size: 14px;
          color: blue;
          word-break: break-word;
        }
      `}</style>

            <div className="signup-box">
                <h1>Noesis</h1>

                <form onSubmit={createAccount}>
                    {/* Names */}
                    <div className="row names">
                        <div className="input-group">
                            <label>First Name</label>
                            <input
                                value={firstName}
                                onChange={(e) => setFirstName(sanitizeLettersSpaces(e.target.value))}
                                onPaste={(e) => {
                                    e.preventDefault();
                                    setFirstName(sanitizeLettersSpaces(e.clipboardData.getData("text")));
                                }}
                            />
                        </div>
                        <div className="input-group">
                            <label>Middle Name</label>
                            <input
                                value={middleName}
                                onChange={(e) => setMiddleName(sanitizeLettersSpaces(e.target.value))}
                                onPaste={(e) => {
                                    e.preventDefault();
                                    setMiddleName(sanitizeLettersSpaces(e.clipboardData.getData("text")));
                                }}
                            />
                        </div>
                        <div className="input-group">
                            <label>Last Name</label>
                            <input
                                value={lastName}
                                onChange={(e) => setLastName(sanitizeLettersSpaces(e.target.value))}
                                onPaste={(e) => {
                                    e.preventDefault();
                                    setLastName(sanitizeLettersSpaces(e.clipboardData.getData("text")));
                                }}
                            />
                        </div>
                    </div>

                    {/* Gender / Age / Birth Date */}
                    <div className="row demographics">
                        <div className="input-group input-small">
                            <label>Gender</label>
                            <select value={gender} onChange={(e) => setGender(e.target.value)}>
                                <option value="">Select</option>
                                <option>Male</option>
                                <option>Female</option>
                            </select>
                        </div>

                        <div className="input-group input-small">
                        <label>Age</label>
                        <input
                            type="number"
                            min="0"
                            max="119"
                            value={age}
                            onChange={(e) => {
                            const value = e.target.value;

                            // Allow empty field
                            if (value === "") {
                                setAge("");
                                return;
                            }

                            const numeric = Number(value);

                            // Only allow 0–119
                            if (numeric >= 0 && numeric < 120) {
                                setAge(value);
                            }
                            }}
                        />
                        </div>

                        <div className="input-group input-medium">
                            <label>Birth Date</label>
                            <input
                                placeholder="MM/DD/YYYY"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="input-group">
                        <label>Address</label>
                        <input value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>

                    <div className="row region">
                        <div className="input-group">
                            <label>Town</label>
                            <input
                                value={town}
                                onChange={(e) => setTown(sanitizeLettersSpaces(e.target.value))}
                                onPaste={(e) => {
                                    e.preventDefault();
                                    setTown(sanitizeLettersSpaces(e.clipboardData.getData("text")));
                                }}
                            />
                        </div>
                        <div className="input-group">
                            <label>State</label>
                            <input
                                value={stateField}
                                onChange={(e) => setStateField(sanitizeLettersSpaces(e.target.value))}
                                onPaste={(e) => {
                                    e.preventDefault();
                                    setStateField(sanitizeLettersSpaces(e.clipboardData.getData("text")));
                                }}
                            />
                        </div>
                        <div className="input-group">
                            <label>Country</label>
                            <input
                                value={country}
                                onChange={(e) => setCountry(sanitizeLettersSpaces(e.target.value))}
                                onPaste={(e) => {
                                    e.preventDefault();
                                    setCountry(sanitizeLettersSpaces(e.clipboardData.getData("text")));
                                }}
                            />
                        </div>
                    </div>

                    {/* Account Type */}
                    <div className="input-group">
                        <label>Account Type</label>
                        <select
                            value={accountType}
                            onChange={(e) => {
                                const v = e.target.value;
                                setAccountType(v);

                                if (v !== "student") setEducationLevel("");
                                if (v !== "educator") {
                                    setCredentialFile(null);
                                    setDragOver(false);
                                }
                            }}
                        >
                            <option value="">Select account type</option>
                            <option value="student">Student</option>
                            <option value="educator">Educator</option>
                        </select>
                    </div>

                    {/* Student */}
                    <div className={accountType === "student" ? "" : "hidden"}>
                        <div className="input-group">
                            <label>School Name</label>
                            <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                        </div>

                        <div className="input-group">
                            <label>Education Level</label>
                            <select value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)}>
                                <option value="">Select</option>
                                <option value="school">School</option>
                                <option value="college">College</option>
                            </select>
                        </div>

                        <div className={educationLevel === "school" ? "" : "hidden"}>
                            <div className="input-group">
                                <label>Grade</label>
                                <input
                                        type="number"
                                        min="1"
                                        max="12"
                                        value={grade}
                                        inputMode="numeric"
                                        onChange={(e) => {
                                            const value = e.target.value;

                                            // Allow empty field
                                            if (value === "") {
                                            setGrade("");
                                            return;
                                            }

                                            const numeric = Number(value);

                                            // Only allow grades 1–12
                                            if (numeric >= 1 && numeric <= 12) {
                                            setGrade(String(numeric));
                                            }
                                        }}
                                        onPaste={(e) => {
                                            e.preventDefault();
                                            const pasted = sanitizeDigits(e.clipboardData.getData("text"));
                                            const numeric = Number(pasted);

                                            if (numeric >= 1 && numeric <= 12) {
                                            setGrade(String(numeric));
                                            }
                                        }}
                                        />
                            </div>
                        </div>

                        <div className={educationLevel === "college" ? "" : "hidden"}>
                            <div className="input-group">
                                <label>College Year</label>
                                <input value={collegeYear} onChange={(e) => setCollegeYear(e.target.value)} />
                            </div>

                            <div className="input-group">
                                <label>Concentration</label>
                                <input
                                    value={studentConcentration}
                                    onChange={(e) => setStudentConcentration(sanitizeLettersSpaces(e.target.value))}
                                    onPaste={(e) => {
                                        e.preventDefault();
                                        setStudentConcentration(sanitizeLettersSpaces(e.clipboardData.getData("text")));
                                    }}
                                />
                            </div>

                            <div className="input-group">
                                <label>Degree Type</label>
                                <select value={degreeType} onChange={(e) => setDegreeType(e.target.value)}>
                                    <option>Associate</option>
                                    <option>Bachelor</option>
                                    <option>Master</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Educator */}
                    <div className={accountType === "educator" ? "" : "hidden"}>
                        <div className="input-group">
                            <label>College Name</label>
                            <input
                                value={educatorCollegeName}
                                onChange={(e) => setEducatorCollegeName(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label>Degree</label>
                            <select value={educatorDegree} onChange={(e) => setEducatorDegree(e.target.value)}>
                                <option>Bachelor</option>
                                <option>Master</option>
                                <option>Doctorate</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label>Concentration</label>
                            <input
                                value={educatorConcentration}
                                onChange={(e) => setEducatorConcentration(sanitizeLettersSpaces(e.target.value))}
                                onPaste={(e) => {
                                    e.preventDefault();
                                    setEducatorConcentration(sanitizeLettersSpaces(e.clipboardData.getData("text")));
                                }}
                            />
                        </div>

                        <div className="input-group">
                            <label>Credentials (PDF only)</label>
                            <div
                                className={`drop-zone ${dragOver ? "dragover" : ""}`}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOver(true);
                                }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={onDrop}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                                }}
                            >
                                Drag & drop PDF here or click to upload
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="application/pdf"
                                    hidden
                                    onChange={(e) => handleFile(e.target.files?.[0])}
                                />
                                <div className="file-name">{fileName}</div>
                            </div>
                        </div>
                    </div>

                    {/* Phone / Email */}
                    <div className="input-group">
                        <label>Phone Number</label>
                        <input
                            value={phone}
                            inputMode="tel"
                            placeholder="(555) 123-4567"
                            maxLength={14} // formatted length: "(123) 456-7890" = 14 chars
                            onChange={(e) => setPhone(sanitizePhone(e.target.value))}
                            onPaste={(e) => {
                                e.preventDefault();
                                setPhone(sanitizePhone(e.clipboardData.getData("text")));
                            }}
                            />
                    </div>

                    <div className="input-group">
                        <label>Email Address</label>
                        <input
                            value={email}
                            readOnly={!isLocalMode} // ✅ only readOnly when true MS mode
                            style={!isLocalMode ? { backgroundColor: "#f2f2f2" } : undefined}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => {
                                // ✅ gentle validation on blur (won't block typing)
                                if (email.trim() && !isValidEmailDomain(email)) {
                                    alert("Email must look like name@provider.com (or .me / .edu / etc).");
                                }
                            }}
                        />
                    </div>

                    {/* ✅ Passwords shown ONLY in local mode */}
                    <div className={isLocalMode ? "" : "hidden"}>
                        <div className="input-group">
                            <label>Password</label>
                            <div className="password-wrapper">
                                <input
                                    type={showPw ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    id="password"
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPw((v) => !v)}
                                >
                                    👁
                                </button>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Confirm Password</label>
                            <div className="password-wrapper">
                                <input
                                    type={showConfirmPw ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    id="confirmPassword"
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowConfirmPw((v) => !v)}
                                >
                                    👁
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="button-row">
                        <button type="button" className="btn btn-back" onClick={goBack}>
                            Back
                        </button>
                        <button type="submit" className="btn btn-create">
                            Create Account
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
