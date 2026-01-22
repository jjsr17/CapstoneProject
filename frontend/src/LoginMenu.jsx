import React, { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "";
//const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function LoginMenu() {
  const navigate = useNavigate();
  const { instance } = useMsal();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const togglePassword = () => setShowPw((v) => !v);

  async function fetchMsLogin(idToken) {
    const resp = await fetch(`${API_BASE}/auth/ms-login`, {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
    });

    const raw = await resp.text();
    let data = null;
    try {
      const result = await instance.loginPopup(loginRequest);
      console.log("Signed in:", result.account);
      navigate("/mainmenu"); // ✅ router navigation
    } catch (e) {
      console.error(e);
      alert(e?.message || "Microsoft sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  const login = async (e) => {
  e.preventDefault();

  if (!username.trim()) return alert("Enter your username or email.");
  if (!password) return alert("Enter your password.");

  try {
    const resp = await fetch(`${API_BASE}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });

    const raw = await resp.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch {}

    if (!resp.ok) {
      alert(data?.message || raw || "Login failed");
      return;
    }

    const user = data?.user;
    if (!user?._id) {
      alert("Login succeeded but user id missing.");
      return;
    }

    localStorage.setItem("mongoUserId", user._id);
    if (user.accountType) localStorage.setItem("accountType", user.accountType);
    localStorage.setItem("tutorId", user._id);

    if (user.accountType === "educator") navigate("/educatoraccount");
    else navigate("/account");
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
};

    navigate("/mainmenu"); // ✅ router navigation
  };

  const signup = (e) => {
    e.preventDefault();
    navigate("/signup");
  };

  return (
    <>
      <style>{`
        body {
          margin: 0;
          padding: 0;
          background-color: white;
          font-family: "Times New Roman", serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }

        .login-box {
          background-color: white;
          width: 380px;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 5px 18px rgba(0,0,0,0.15);
          text-align: center;
        }

        .login-box h1 {
          margin: 0 0 20px 0;
          font-size: 42px;
          color: blueviolet;
        }

        .input-group {
          margin-bottom: 20px;
          text-align: left;
        }

        .input-group label {
          font-size: 16px;
          margin-bottom: 5px;
          display: block;
        }

        .input-group input {
          width: 100%;
          padding: 12px;
          font-size: 16px;
          border-radius: 6px;
          border: 1px solid #ccc;
          box-sizing: border-box;
        }

        .password-wrapper { position: relative; }

        .toggle-password {
          position: absolute;
          right: 10px;
          top: 11px;
          cursor: pointer;
          font-size: 15px;
          background: none;
          border: none;
          padding: 3px;
        }

        .button-row {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
          gap: 10px;
        }

        .btn {
          width: 48%;
          padding: 12px;
          font-size: 16px;
          cursor: pointer;
          border-radius: 6px;
          border: none;
          transition: 0.2s;
        }

        .btn-login { background-color: blue; color: white; }
        .btn-login:hover { background-color: #002db3; }

        .btn-signup { background-color: #f0f0f0; }
        .btn-signup:hover { background-color: #dcdcdc; }

        .sso-btn {
          width: 100%;
          margin-top: 12px;
          padding: 12px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          background: #2F2F2F;
          color: white;
          font-size: 16px;
          opacity: ${busy ? 0.7 : 1};
        }
      `}</style>

      <div className="login-box">
        <h1>Noesis</h1>

        <form onSubmit={login}>
          <div className="input-group">
            <label htmlFor="username">Username / Email</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                type={showPw ? "text" : "password"}
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={togglePassword}
                aria-label={showPw ? "Hide password" : "Show password"}
                title={showPw ? "Hide password" : "Show password"}
              >
                👁
              </button>
            </div>
          </div>

          <div className="button-row">
            <button className="btn btn-signup" type="button" onClick={signup}>
              User Sign Up
            </button>
            <button className="btn btn-login" type="submit">
              Log In
            </button>
          </div>
        </form>

        <button
          type="button"
          className="sso-btn"
          onClick={loginWithMicrosoft}
          disabled={busy}
        >
          {busy ? "Signing in..." : "Sign in with Microsoft"}
        </button>
      </div>
    </>
  );
}
