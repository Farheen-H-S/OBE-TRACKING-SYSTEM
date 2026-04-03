import { FaCircle, FaMinus, FaPlus, FaSignOutAlt } from "react-icons/fa";
import "./FacultySide.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";
import { getLoggedInUser } from "../../utils/auth";

const profile = '/images/profile.jpeg';

const FacultySide = ({ isOpen, onClose, user: propUser }) => {
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
                User: Faculty
            </div>

            {/* MENU */}
            <ul className="sidebar-menu list-unstyled p-0 m-0 flex-grow-1">
                <li className="nav-item">
                    <div
                        className="menu-item d-flex align-items-center text-white"
                        onClick={() => navigate("/statement2")}
                        style={{ cursor: "pointer" }}
                    >
                        <FaCircle className="me-2" style={{ fontSize: '0.5rem' }} /> PEOs, POs, PSOs
                    </div>
                </li>

                <li className="nav-item">
                    <div
                        className="menu-item d-flex align-items-center text-white"
                        onClick={() => navigate("/my-courses")}
                        style={{ cursor: "pointer" }}
                    >
                        <FaCircle className="me-2" style={{ fontSize: '0.5rem' }} /> My Courses
                    </div>
                </li>

                <li className="nav-item">
                    <div
                        className="menu-item d-flex align-items-center text-white"
                        onClick={() => navigate("/co-po-pso-mapping")}
                        style={{ cursor: "pointer" }}
                    >
                        <FaCircle className="me-2" style={{ fontSize: '0.5rem' }} /> CO-PO-PSO Mapping
                    </div>
                </li>

                <li className="nav-item">
                    <div
                        className="menu-item d-flex align-items-center text-white"
                        onClick={() => navigate("/marks-entry")}
                        style={{ cursor: "pointer" }}
                    >
                        <FaCircle className="me-2" style={{ fontSize: '0.5rem' }} /> CIS - Marks Entry
                    </div>
                </li>

                <li className="nav-item">
                    <div
                        className="menu-item d-flex align-items-center text-white"
                        onClick={() => navigate("/teaching-plan")}
                        style={{ cursor: "pointer" }}
                    >
                        <FaCircle className="me-2" style={{ fontSize: '0.5rem' }} /> Teaching Plan
                    </div>
                </li>

                <li className="nav-item">
                    <div
                        className="menu-item d-flex align-items-center text-white pe-4"
                        onClick={() => toggleMenu('Attainment')}
                        style={{ cursor: "pointer" }}
                    >
                        <FaCircle className="me-2" style={{ fontSize: '0.5rem' }} /> Attainment
                        {openMenu === 'Attainment' ? <FaMinus className="ms-auto" size={12} /> : <FaPlus className="ms-auto" size={12} />}
                    </div>
                    {openMenu === 'Attainment' && (
                        <div className="submenu bg-white bg-opacity-10 ps-3">
                            <div
                                className="py-2 text-white cursor-pointer"
                                style={{ fontSize: '0.9rem' }}
                                onClick={() => navigate("/direct-attainment")}
                            >
                                Direct Attainment
                            </div>
                            <div
                                className="py-2 text-white cursor-pointer"
                                style={{ fontSize: '0.9rem' }}
                                onClick={() => navigate("/indirect-attainment")}
                            >
                                Indirect Attainment
                            </div>
                            <div
                                className="py-2 text-white cursor-pointer"
                                style={{ fontSize: '0.9rem' }}
                                onClick={() => navigate("/po-pso-attainment")}
                            >
                                PO & PSO Attainment
                            </div>
                        </div>
                    )}
                </li>

                <li className="nav-item">
                    <div
                        className="menu-item d-flex align-items-center text-white"
                        onClick={() => navigate("/report-verification")}
                        style={{ cursor: "pointer" }}
                    >
                        <FaCircle className="me-2" style={{ fontSize: '0.5rem' }} /> Report Verification
                    </div>
                </li>

                <li className="nav-item">
                    <div
                        className="menu-item d-flex align-items-center text-white"
                        onClick={() => navigate("/view-reports")}
                        style={{ cursor: "pointer" }}
                    >
                        <FaCircle className="me-2" style={{ fontSize: '0.5rem' }} /> View Reports
                    </div>
                </li>

                <li className="nav-item">
                    <div
                        className="menu-item d-flex align-items-center text-white"
                        onClick={() => navigate("/stress-report")}
                        style={{ cursor: "pointer" }}
                    >
                        <FaCircle className="me-2" style={{ fontSize: '0.5rem' }} /> Stress Survey Report
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

export default FacultySide;
