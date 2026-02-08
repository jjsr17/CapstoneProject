// src/LoginMenu.jsx
import React, { useState, useCallback, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import { useNavigate } from "react-router-dom";
import LoginBG from "./assets/artbackground.jpeg"

const API_BASE = import.meta.env.VITE_API_BASE || "";

// LocalStorage keys (keep consistent across app)
const LS = {
  useMsSso: "useMsSso",
  msAccessToken: "msAccessToken",
  mongoUserId: "mongoUserId",
  accountType: "accountType",
  tutorId: "tutorId",
  profileComplete: "profileComplete",
};

// Centralized “auth mode” switch
function setAuthMode(mode) {
  if (mode === "ms") {
    localStorage.setItem(LS.useMsSso, "true");
  } else {
    localStorage.setItem(LS.useMsSso, "false");
    localStorage.removeItem(LS.msAccessToken);
  }
}

export default function LoginMenu() {
  const navigate = useNavigate();
  const { instance } = useMsal();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  // Optional: default to local mode only if no token exists
  useEffect(() => {
    if (!localStorage.getItem(LS.msAccessToken)) {
      setAuthMode("local");
    }
  }, []);

  const togglePassword = () => setShowPw((v) => !v);

  const goSignup = useCallback(() => {
    setAuthMode("local");
    navigate("/signup");
  }, [navigate]);

  const loginWithMicrosoft = useCallback(async () => {
  setBusy(true);
  try {
    setAuthMode("ms");

    const loginResp = await instance.loginPopup({
      ...loginRequest,
      prompt: "login",
    });

    let tokenResp;
    try {
      tokenResp = await instance.acquireTokenSilent({
        ...loginRequest,
        account: loginResp.account,
      });
    } catch {
      tokenResp = await instance.acquireTokenPopup({
        ...loginRequest,
        account: loginResp.account,
      });
    }

    // store token
    localStorage.setItem(LS.msAccessToken, tokenResp.accessToken);
    localStorage.setItem(LS.useMsSso, "true");

    // ✅ use GraphQL "me" (no /api/users/ms-login needed)
    const gqlResp = await fetch(API_BASE ? `${API_BASE}/graphql` : "/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenResp.accessToken}`,
      },
      body: JSON.stringify({
        query: `
          query Me {
            me {
              _id
              accountType
              profileComplete
              user_email
              firstName
              lastName
            }
          }
        `,
      }),
    });

    const gqlJson = await gqlResp.json();
    const me = gqlJson?.data?.me;

    if (me?._id) {
      // persist what app uses
      localStorage.setItem(LS.mongoUserId, me._id);
      localStorage.setItem(LS.tutorId, me._id);
      if (me.accountType) localStorage.setItem(LS.accountType, me.accountType);
      localStorage.setItem("profileComplete", String(!!me.profileComplete));

      const name =
          me.firstName && me.lastName
          ? `${me.firstName} ${me.lastName}`
          : me.user_email;

       localStorage.setItem("displayName", name);

      // ✅ decide route based on profileComplete
      if (me.profileComplete) {
        navigate("/mainmenu", { replace: true });
      } else {
        navigate("/signup", { replace: true });
      }
      return;
    }

    // if me is null -> treat as needs signup
    navigate("/signup", { replace: true });
  } catch (e) {
    console.error(e);
    setAuthMode("local");
    alert(e?.message || "Microsoft sign-in failed.");
  } finally {
    setBusy(false);
  }
}, [instance, navigate]);


  const loginLocal = useCallback(
    async (e) => {
      e.preventDefault();
      setAuthMode("local");

      if (!username.trim()) return alert("Enter your username or email.");
      if (!password) return alert("Enter your password.");

      setBusy(true);
      try {
        const resp = await fetch(`${API_BASE}/api/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim(), password }),
        });

        const raw = await resp.text();
        let data = null;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch {}

        if (!resp.ok) {
          alert(data?.message || raw || "Login failed");
          return;
        }

        const user = data?.user;
        if (!user?._id) {
          alert("Login succeeded but user id missing.");
          return;
        }

          // Display name
        const name =
           user.firstName && user.lastName
           ? `${user.firstName} ${user.lastName}`
           : user.username || user.email || "User";

          localStorage.setItem("displayName", name);


        localStorage.setItem(LS.mongoUserId, user._id);
        localStorage.setItem(LS.tutorId, user._id);
        if (user.accountType) localStorage.setItem(LS.accountType, user.accountType);

        navigate("/mainmenu", { replace: true });
      } catch (err) {
        console.error(err);
        alert("Server error");
      } finally {
        setBusy(false);
      }
    },
    [username, password, navigate]
  );

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


          background-image: url(${LoginBG});
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
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
          opacity: ${busy ? 0.85 : 1};
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

        <form onSubmit={loginLocal}>
          <div className="input-group">
            <label htmlFor="username">Username / Email</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={busy}
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
                disabled={busy}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={togglePassword}
                aria-label={showPw ? "Hide password" : "Show password"}
                title={showPw ? "Hide password" : "Show password"}
                disabled={busy}
              >
                👁
              </button>
            </div>
          </div>

          <div className="button-row">
            <button className="btn btn-signup" type="button" onClick={goSignup} disabled={busy}>
              User Sign Up
            </button>
            <button className="btn btn-login" type="submit" disabled={busy}>
              {busy ? "Logging in..." : "Log In"}
            </button>
          </div>
        </form>

        <button type="button" className="sso-btn" onClick={loginWithMicrosoft} disabled={busy}>
          {busy ? "Signing in..." : "Sign in with Microsoft"}
        </button>
      </div>
    </>
  );
}
