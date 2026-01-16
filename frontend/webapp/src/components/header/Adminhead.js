import React from "react";
import "./Adminhead.css";
import { sflogo } from "../../assets/images";
import { FaBell, FaSearch, FaBars } from "react-icons/fa";

const Adminhead = ({ onToggleSidebar }) => {
  return (
    <nav className="navbar admin-navbar">
      <div className="admin-header container-fluid d-flex align-items-center justify-content-between">

        {/* LEFT: Hamburger + Logo + Text */}
        <div className="d-flex align-items-center gap-2">
          <button className="hamburger-btn d-lg-none" onClick={onToggleSidebar}>
            <FaBars size={22} />
          </button>
          <img src={sflogo} alt="Logo" className="header-logo" />
          <div className="header-text d-none d-lg-block">
            <h2>Sandip Foundation</h2>
            <span>Sandip Polytechnic</span>
          </div>
        </div>

        {/* CENTER: Dashboard */}
        <div className="header-title text-center">
          Dashboard
        </div>

        {/* RIGHT: Search + Bell */}
        <div className="d-flex align-items-center gap-2">
          <div className="search-box">
            <span className="input-group-text"><FaSearch /></span>
            <input type="text" className="form-control" placeholder="Search" />
          </div>
          <FaBell size={30} className="bell-icon" />
        </div>

      </div>
    </nav>
  );
};

export default Adminhead;
