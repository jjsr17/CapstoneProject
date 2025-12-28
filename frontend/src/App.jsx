import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginMenu from "./LoginMenu.jsx";
import Tutors from "./Tutors.jsx";
import Home from "./Home.jsx";
import SignUpMenu from "./signup.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginMenu />} />
        <Route path="/LoginMenu" element={<Navigate to="/login" replace />} />

        <Route path="/signup" element={<SignUpMenu />} />
        <Route path="/tutors" element={<Tutors />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
