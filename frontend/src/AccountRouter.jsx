// src/AccountRouter.jsx
import { Navigate } from "react-router-dom";

export default function AccountRouter() {
  const at = (localStorage.getItem("accountType") || "").trim().toLowerCase();

  if (at === "educator") return <Navigate to="/educatoraccount" replace />;
  if (at === "student") return <Navigate to="/account" replace />;

  return <Navigate to="/login" replace />;
}
