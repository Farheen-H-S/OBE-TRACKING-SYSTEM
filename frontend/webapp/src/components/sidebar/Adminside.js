import { FaCircle, FaMinus, FaPlus, FaSignOutAlt } from "react-icons/fa";
import { profile } from "../../assets/images"
import "./Adminside.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";
import { getLoggedInUser } from "../../utils/auth";


const AdminSide = ({ isOpen, onClose, user: propUser }) => {
  const [openMenu, setOpenMenu] = useState(null);
  const toggleMenu = (menu) => setOpenMenu(openMenu === menu ? null : menu);

  const loggedInUser = getLoggedInUser();
  const user = propUser || loggedInUser;

  const navigate = useNavigate();

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refresh") || sessionStorage.getItem("refresh");
    if (refreshToken) {
      try {
        await logout(refreshToken);
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    sessionStorage.removeItem("access");
    sessionStorage.removeItem("refresh");
    navigate("/");
  };

  return (
    <div className={`sidebar d-flex flex-column text-white ${isOpen ? "open" : ""}`}>

      {/* USER BANNER */}
      <div
        className="user-banner p-3 text-center cursor-pointer"
        onClick={() => navigate('/profile')}
        style={{ cursor: 'pointer' }}
      >
        <div className="user-banner-img mb-2">
          <img
            src={(user?.profile_picture && user.profile_picture !== "") ? (user.profile_picture.startsWith('http') ? user.profile_picture : `http://127.0.0.1:8000${user.profile_picture.startsWith('/') ? '' : '/'}${user.profile_picture}`) : profile}
            alt="profile"
            className="rounded-circle border border-3 border-white"
            style={{ width: 80, height: 80, objectFit: "cover" }}
          />
        </div>
        <h3 className="text-dark">Welcome {user?.name || user?.email || "User"}!</h3>
        <p className="text-dark small mb-0">{user?.email}</p>
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
              <div
                className="py-1 text-white cursor-pointer"
                onClick={() => navigate("/create-user")}
              >
                Create User
              </div>
              <div
                className="py-1 text-white cursor-pointer"
                onClick={() => navigate("/view-user")}
              >
                View User
              </div>
            </div>
          )}
        </li>

        <li className="nav-item">
          <div
            className="menu-item d-flex align-items-center text-white"
            onClick={() => navigate("/academic-setup")}
            style={{ cursor: "pointer" }}
          >
            <FaCircle className="me-2" /> Academic Setup
          </div>
        </li>

        <li className="nav-item">
          <div
            className="menu-item d-flex align-items-center text-white"
            onClick={() => navigate("/activity-log")}
            style={{ cursor: "pointer" }}
          >
            <FaCircle className="me-2" />  System Activity Logs
          </div>
        </li>
      </ul>

      {/* LOGOUT */}
      <div
        className="logout-container d-flex align-items-center justify-content-end p-3"
        onClick={handleLogout}
      >
        <FaSignOutAlt className="me-2" />
        <span className="fw-bold">Log Out</span>
      </div>
    </div>
  );
};

export default AdminSide;
