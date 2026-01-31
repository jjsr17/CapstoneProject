import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginMenu from "./LoginMenu.jsx";
import Tutors from "./Tutors.jsx";
import Home from "./Home.jsx";
import SignUpMenu from "./signup.jsx";
import Account from "./account.jsx";
import EducatorAccount from "./educatoraccount.jsx";
import EditProfile from "./editprofile.jsx";
import EditEducatorProfile from "./editeducatorprofile.jsx";
import CourseOffering from "./courseoffering.jsx";
import Search from "./search.jsx";
import MainMenu from "./mainmenu.jsx";
import Booking from "./booking.jsx";
import Messages from "./messages.jsx";
import Settings from "./settings.jsx";

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

        <Route path="/account" element={<Account />} />
        <Route path="/educatoraccount" element={<EducatorAccount />} />
        <Route path="/editprofile" element={<EditProfile />} />
        <Route path="/editeducatorprofile" element={<EditEducatorProfile />} />

        <Route path="/courseoffering" element={<CourseOffering />} />
        <Route path="/search" element={<Search />} />
        <Route path="/mainmenu" element={<MainMenu />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/messages" element={<Messages /> } />
        <Route path="settings" element={<Settings />} />

      </Routes>
    </BrowserRouter>
  );
}
