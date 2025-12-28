import React, { useMemo, useRef, useState } from "react";

export default function SignUpMenu() {
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
  const [credentialFile, setCredentialFile] = useState(null); // File | null

  // Contact
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Passwords
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Drop zone
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const fileName = useMemo(() => credentialFile?.name ?? "", [credentialFile]);

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

  if (!accountType) {
    alert("Please select an account type.");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
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
    email,
    accountType,

    // student
    schoolName,
    educationLevel,
    grade,
    collegeYear,
    studentConcentration,
    degreeType,

    // educator
    educatorCollegeName,
    educatorDegree,
    educatorConcentration,
  };

  try {
    const res = await fetch("http://localhost:5000/api/users/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.message || "Signup failed");
      return;
    }

    // success
    window.location.href = "/home";
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

        .input-group {
          margin-bottom: 15px;
          width: 100%;
        }

        .input-group label {
          display: block;
          font-size: 15px;
          margin-bottom: 5px;
        }

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
        <h1>Inov8r</h1>

        <form onSubmit={createAccount}>
          {/* Names */}
          <div className="row names">
            <div className="input-group">
              <label>First Name</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Middle Name</label>
              <input value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Last Name</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
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

            <div className="input-group input-xsmall">
              <label>Age</label>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
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
              <input value={town} onChange={(e) => setTown(e.target.value)} />
            </div>
            <div className="input-group">
              <label>State</label>
              <input value={stateField} onChange={(e) => setStateField(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Country</label>
              <input value={country} onChange={(e) => setCountry(e.target.value)} />
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

                // mimic your HTML behavior: hide other section + reset sub-fields if desired
                if (v !== "student") {
                  setEducationLevel("");
                }
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

          {/* Student Section */}
          <div className={accountType === "student" ? "" : "hidden"}>
            <div className="input-group">
              <label>School Name</label>
              <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
            </div>

            <div className="input-group">
              <label>Education Level</label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
              >
                <option value="">Select</option>
                <option value="school">School</option>
                <option value="college">College</option>
              </select>
            </div>

            {/* School Fields */}
            <div className={educationLevel === "school" ? "" : "hidden"}>
              <div className="input-group">
                <label>Grade</label>
                <input value={grade} onChange={(e) => setGrade(e.target.value)} />
              </div>
            </div>

            {/* College Fields */}
            <div className={educationLevel === "college" ? "" : "hidden"}>
              <div className="input-group">
                <label>College Year</label>
                <input value={collegeYear} onChange={(e) => setCollegeYear(e.target.value)} />
              </div>

              <div className="input-group">
                <label>Concentration</label>
                <input
                  value={studentConcentration}
                  onChange={(e) => setStudentConcentration(e.target.value)}
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

          {/* Educator Section */}
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
                onChange={(e) => setEducatorConcentration(e.target.value)}
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
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="input-group">
            <label>Email Address</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          {/* Password */}
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
                aria-label={showPw ? "Hide password" : "Show password"}
                title={showPw ? "Hide password" : "Show password"}
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
                aria-label={showConfirmPw ? "Hide confirm password" : "Show confirm password"}
                title={showConfirmPw ? "Hide confirm password" : "Show confirm password"}
              >
                👁
              </button>
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
