import { FaCircle, FaMinus, FaPlus, FaSignOutAlt } from "react-icons/fa";
import "./HodSide.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";
import { getLoggedInUser } from "../../utils/auth";

const profile = '/images/profile.jpeg';
const backpic = '/images/back-pic.png';

const HodSide = ({ isOpen, onClose, user: propUser }) => {
    const [openMenu, setOpenMenu] = useState(null);
    const [openSubMenu, setOpenSubMenu] = useState(null);

    const toggleMenu = (menu) => setOpenMenu(openMenu === menu ? null : menu);
    const toggleSubMenu = (menu) => setOpenSubMenu(openSubMenu === menu ? null : menu);

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

    const menuItems = [
        {
            title: "PEOs, POs, PSOs",
            path: "/statement2"
        },
        {
            title: "Academic Data",
            items: [
                { name: "Student Management", path: "/student-management" },
                { name: "Course Management", path: "/course-management" }
            ]
        },
        {
            title: "CO-PO-PSO Mapping",
            path: "/co-po-pso-mapping"
        },
        {
            title: "Assessment",
            items: [
                { name: "Target Management", path: "/target-management" },
                {
                    name: "CIS",
                    subItems: [
                        { name: "Marks Entry", path: "/marks-entry" },
                        { name: "Course Exit Survey", path: "/course-exit-survey" },
                        { name: "Other Indirect Tools", path: "/other-indirect-tools" }
                    ]
                }
            ]
        },
        {
            title: "Attainment",
            items: [
                { name: "Direct Attainment", path: "/direct-attainment" },
                { name: "Indirect Attainment", path: "/indirect-attainment" },
                { name: "PO & PSO Attainment", path: "/po-pso-attainment" }
            ]
        },
        {
            title: "Verification & Reports",
            items: [
                { name: "DAC Reports", path: "/dac-reports" },
                { name: "Report Verification", path: "/report-verification" },
                { name: "Attainment Backtracking", path: "/attainment-backtracking" }
            ]
        },
        {
            title: "Stress & Feedback",
            items: [
                {
                    name: "Stress Survey",
                    subItems: [
                        { name: "Survey Creation", path: "/stress-create" },
                        { name: "Survey Report", path: "/stress-report" }
                    ]
                },
                {
                    name: "Teacher Feedback",
                    subItems: [
                        { name: "Survey Creation", path: "/teacher-feedback-create" },
                        { name: "Survey Report", path: "/teacher-feedback-report" }
                    ]
                }
            ]
        }
    ];


    const handleNavigation = (path) => {
        if (path) {
            navigate(path);
        }
    };

    const renderSubMenu = (items) => {
        return items.map((item, index) => {
            if (item.subItems) {
                return (
                    <div key={index} className="nav-item">
                        <div
                            className="menu-item d-flex align-items-center text-white ps-3 pe-4 flex-nowrap"
                            onClick={() => toggleSubMenu(item.name)}
                            style={{ fontSize: '0.9rem' }}
                        >
                            <span className="text-truncate">{item.name}</span>
                            {openSubMenu === item.name ? <FaMinus className="ms-auto" size={12} /> : <FaPlus className="ms-auto" size={12} />}
                        </div>
                        {openSubMenu === item.name && (
                            <div className="submenu ps-4">
                                {item.subItems.map((sub, subIndex) => (
                                    <div
                                        key={subIndex}
                                        className="py-2 text-white cursor-pointer ps-2"
                                        style={{ fontSize: '0.82rem' }}
                                        onClick={() => handleNavigation(sub.path)}
                                    >
                                        {sub.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            } else {
                return (
                    <div
                        key={index}
                        className="py-2 text-white cursor-pointer ps-3"
                        style={{ fontSize: '0.9rem' }}
                        onClick={() => handleNavigation(item.path)}
                    >
                        {item.name}
                    </div>
                );
            }
        });
    }

    return (
        <div className={`sidebar d-flex flex-column text-white ${isOpen ? "open" : ""}`}>

            {/* USER BANNER */}
            <div
                className="user-banner p-3 text-center cursor-pointer"
                onClick={() => navigate('/profile')}
                style={{ cursor: 'pointer', backgroundImage: `url(${backpic})` }}
            >
                <div className="user-banner-img mb-2">
                    <img
                        src={(user?.profile_picture && user.profile_picture !== "") ? (user.profile_picture.startsWith('http') ? user.profile_picture : `http://127.0.0.1:8000${user.profile_picture.startsWith('/') ? '' : '/'}${user.profile_picture}`) : profile}
                        alt="profile"
                        className="rounded-circle border border-3 border-white"
                        style={{ width: 80, height: 80, objectFit: "cover" }}
                    />
                </div>
                <h3 style={{ color: "#0e2344" }}>Welcome {user?.name || user?.email || "User"}!</h3>
                <p style={{ color: "#0e2344" }}>{user?.email}</p>
            </div>

            {/* USER ROLE */}
            <div className="user-role-bar p-3 fw-bold fs-5">
                User: HOD
            </div>

            {/* MENU */}
            <ul className="sidebar-menu list-unstyled p-0 m-0 flex-grow-1 overflow-y-auto">
                {menuItems.map((menu, index) => (
                    <li key={index} className="nav-item">
                        <div
                            className={`menu-item d-flex align-items-center text-white pe-4 flex-nowrap`}
                            onClick={() => {
                                if (menu.path) handleNavigation(menu.path);
                                else if (menu.items) toggleMenu(menu.title);
                            }}
                        >
                            <FaCircle className="me-2" style={{ fontSize: '0.5rem' }} /> {menu.title}
                            {menu.items && (
                                openMenu === menu.title ? <FaMinus className="ms-auto" size={12} /> : <FaPlus className="ms-auto" size={12} />
                            )}
                        </div>
                        {menu.items && openMenu === menu.title && (
                            <div className="submenu bg-white bg-opacity-10">
                                {renderSubMenu(menu.items)}
                            </div>
                        )}
                    </li>
                ))}
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

export default HodSide;
