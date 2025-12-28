import React, { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import { useNavigate } from "react-router-dom";

export default function LoginMenu() {
  const navigate = useNavigate();
  const { instance } = useMsal();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const togglePassword = () => setShowPw((v) => !v);

  const loginWithMicrosoft = async () => {
    try {
      const result = await instance.loginPopup(loginRequest);
      console.log("Signed in:", result.account);
      navigate("/home"); // ✅ router navigation
    } catch (e) {
      console.error(e);
      alert("Microsoft sign-in failed.");
    }
  };

  const login = (e) => {
    e.preventDefault();

    // TODO: call your backend auth here if you still want local username/pw auth
    // console.log({ username, password });

    navigate("/home"); // ✅ router navigation
  };

  const signup = (e) => {
    e.preventDefault();
    navigate("/signup"); // ✅ router navigation
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
        }
      `}</style>

      <div className="login-box">
        <h1>Inov8r</h1>

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

        <button type="button" className="sso-btn" onClick={loginWithMicrosoft}>
          Sign in with Microsoft
        </button>
      </div>
    </>
  );
}
