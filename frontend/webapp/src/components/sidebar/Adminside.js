import React, { useState } from "react";
import "./AdminSide.css";
import { FaCircle, FaMinus, FaPlus, FaSignOutAlt } from "react-icons/fa";
import { profile } from "../../assets/images";

const AdminSide = ({ isOpen, onClose }) => {
  const [openMenu, setOpenMenu] = useState(null);
  const toggleMenu = (menu) => setOpenMenu(openMenu === menu ? null : menu);

  return (
    <div className={`sidebar d-flex flex-column text-white ${isOpen ? "open" : ""}`}>

      {/* USER BANNER */}
      <div className="user-banner p-3 text-center">
        <div className="user-banner-img mb-2">
          <img
            src={profile}
            alt="profile"
            className="rounded-circle border border-3 border-white"
            style={{ width: 80, height: 80, objectFit: "cover" }}
          />
        </div>
        <h3 style={{ color: "#0e2344" }}>Welcome Mitesh!</h3>
        <p style={{ color: "#0e2344" }}>312023016</p>
      </div>

      {/* USER ROLE */}
      <div className="user-role-bar p-3 fw-bold fs-5">
        User: Admin
      </div>

      {/* MENU */}
      <ul className="sidebar-menu list-unstyled p-0 m-0 flex-grow-1">
        <li className="nav-item">
          <div
            className="menu-item d-flex align-items-center text-white"
            onClick={() => toggleMenu("User Management")}
          >
            <FaCircle className="me-2" /> User Management
            {openMenu === "User Management" ? (
              <FaMinus className="ms-auto" />
            ) : (
              <FaPlus className="ms-auto" />
            )}
          </div>
          {openMenu === "User Management" && (
            <div className="submenu ps-4">
              <div className="py-1 text-white cursor-pointer">Create User</div>
              <div className="py-1 text-white cursor-pointer">View User</div>
            </div>
          )}
        </li>

        <li className="nav-item">
          <div className="menu-item d-flex align-items-center text-white">
            <FaCircle className="me-2" /> Academic Setup
          </div>
        </li>

        <li className="nav-item">
          <div className="menu-item d-flex align-items-center text-white">
            <FaCircle className="me-2" /> View Audit Log
          </div>
        </li>
      </ul>

      {/* LOGOUT */}
      <div className="logout-container d-flex align-items-center justify-content-end p-3">
        <FaSignOutAlt className="me-2" />
        <span className="fw-bold">Log Out</span>
      </div>
    </div>
  );
};

export default AdminSide;
