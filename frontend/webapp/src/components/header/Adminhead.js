import React from "react";
import "./Adminhead.css";
import sflogo from "./sflogo.png";
import { FaBell, FaSearch } from "react-icons/fa";

const Adminhead = () => {
  return (
    <nav className="navbar navbar-expand-lg admin-navbar">
      <div className="admin-header container-fluid">
        <div className="row align-items-center w-100">

          {/* LEFT */}
          <div className="col-12 col-md-4 d-flex align-items-center gap-3">
            <img src={sflogo} alt="Logo" className="header-logo" />
            <div className="header-text">
              <h2>Sandip Foundation</h2>
              <span>Sandip Polytechnic</span>
            </div>
          </div>

          {/* CENTER */}
          <div className="col-12 col-md-4 text-center my-2 my-md-0">
            <h1 className="header-title">Dashboard</h1>
          </div>

          {/* RIGHT */}
          <div className="col-12 col-md-4 d-flex justify-content-md-end justify-content-center align-items-center gap-3">
            <div className="input-group search-box">
              <span className="input-group-text">
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search"
              />
            </div>
            <FaBell className="bell-icon" />
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Adminhead;
