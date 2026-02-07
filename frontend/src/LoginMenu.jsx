// src/LoginMenu.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { useNavigate } from "react-router-dom";
import { loginRequest, graphRequest } from "./authConfig";

const API_BASE = import.meta.env.VITE_API_BASE || "";

// LocalStorage keys (keep consistent across app)
const LS = {
  useMsSso: "useMsSso",
  msAccessToken: "msAccessToken",
  msGraphAccessToken: "msGraphAccessToken",
  mongoUserId: "mongoUserId",
  tutorId: "tutorId",
  accountType: "accountType",
  profileComplete: "profileComplete",
};

// Centralized “auth mode” switch
function setAuthMode(mode) {
  if (mode === "ms") {
    localStorage.setItem(LS.useMsSso, "true");
  } else {
    localStorage.setItem(LS.useMsSso, "false");
    localStorage.removeItem(LS.msAccessToken);
    localStorage.removeItem(LS.msGraphAccessToken);
  }
}

async function fetchMe({ apiBase, accessToken }) {
  const resp = await fetch(apiBase ? `${apiBase}/graphql` : "/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      query: `query Me { me { _id accountType profileComplete user_email firstName lastName } }`,
    }),
  });

  const json = await resp.json();
  return { json, me: json?.data?.me || null };
}

export default function LoginMenu() {
  const navigate = useNavigate();
  const { instance, accounts, inProgress } = useMsal();

  const didMsFinish = useRef(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const activeAccount = useMemo(() => {
    return instance.getActiveAccount() || accounts?.[0] || null;
  }, [instance, accounts]);

  /**
   * Finish MS redirect flow (runs after redirect returns)
   * - acquire API token
   * - acquire Graph token (Teams) if possible (or trigger consent redirect)
   * - call GraphQL me
   * - route user accordingly
   */
  useEffect(() => {
    if (didMsFinish.current) return; // prevents StrictMode double-run
    if (inProgress !== "none") return; // wait until MSAL is idle
    if (!activeAccount) return; // no MS account signed in

    didMsFinish.current = true;

    (async () => {
      setBusy(true);
      try {
        instance.setActiveAccount(activeAccount);

        // 1) Acquire API token (for your backend)
        const apiTokenResp = await instance.acquireTokenSilent({
          ...loginRequest,
          account: activeAccount,
        });

        localStorage.setItem(LS.msAccessToken, apiTokenResp.accessToken);
        localStorage.setItem(LS.useMsSso, "true");

        // 2) Acquire Graph token (for Teams) - best-effort
        try {
          const graphTokenResp = await instance.acquireTokenSilent({
            ...graphRequest,
            account: activeAccount,
          });
          localStorage.setItem(LS.msGraphAccessToken, graphTokenResp.accessToken);
        } catch (e) {
          // If Graph consent is needed, trigger redirect consent ONCE
          if (e instanceof InteractionRequiredAuthError) {
            // NOTE: this will redirect away; code after this won't run in this pass
            await instance.acquireTokenRedirect({
              ...graphRequest,
              account: activeAccount,
              prompt: "consent",
            });
            return;
          }
          console.warn("Graph token not acquired:", e);
        }

        // 3) Call GraphQL me
        const { json, me } = await fetchMe({
          apiBase: API_BASE,
          accessToken: apiTokenResp.accessToken,
        });

        console.log("GraphQL raw response:", json);

        if (me?._id) {
          localStorage.setItem(LS.mongoUserId, me._id);
          localStorage.setItem(LS.tutorId, me._id);
          if (me.accountType) localStorage.setItem(LS.accountType, me.accountType);
          localStorage.setItem(LS.profileComplete, String(!!me.profileComplete));

          navigate(me.profileComplete ? "/mainmenu" : "/signup", { replace: true });
        } else {
          // no user in DB yet -> signup
          navigate("/signup", { replace: true });
        }
      } catch (e) {
        console.error("MS login finish failed:", e);
        // allow retry if something truly failed
        didMsFinish.current = false;
      } finally {
        setBusy(false);
      }
    })();
  }, [inProgress, activeAccount, instance, navigate]);

  // If no MS token, default to local
  useEffect(() => {
    if (!localStorage.getItem(LS.msAccessToken)) {
      setAuthMode("local");
    }
  }, []);

  const goSignup = useCallback(() => {
    setAuthMode("local");
    navigate("/signup");
  }, [navigate]);

  const loginWithMicrosoft = useCallback(async () => {
    setBusy(true);
    try {
      setAuthMode("ms");

      // redirect login (no popup)
      await instance.loginRedirect({
        ...loginRequest,
        prompt: "select_account",
      });

      // redirect happens; code below will not run
    } catch (e) {
      console.error(e);
      setAuthMode("local");
      alert(e?.message || "Microsoft sign-in failed.");
      setBusy(false);
    }
  }, [instance]);

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

        localStorage.setItem(LS.mongoUserId, user._id);
        localStorage.setItem(LS.tutorId, user._id);
        if (user.accountType) localStorage.setItem(LS.accountType, user.accountType);
        localStorage.setItem(LS.profileComplete, "true");

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
                onClick={() => setShowPw((v) => !v)}
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
