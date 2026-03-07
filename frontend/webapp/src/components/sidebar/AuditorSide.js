import { FaCircle, FaSignOutAlt } from "react-icons/fa";
import { profile } from "../../assets/images";
import "./AuditorSide.css"; // Ensure this CSS file exists or create it
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";
import { getLoggedInUser } from "../../utils/auth";

const AuditorSide = ({ isOpen, onClose, user: propUser }) => {
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
        { title: "PEOs, POs, PSOs", path: "/statement2" },
        { title: "CO-PO-PSO Mapping", path: "/co-po-pso-mapping" },
        { title: "View Reports", path: "/auditor/view-reports" },
        { title: "Attainment Backtracking", path: "/attainment-backtracking" },
        { title: "System Logs", path: "/activity-log" },
        { title: "My Audit Remarks", path: "/auditor/view-my-remarks" }
    ];

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
                User: Auditor
            </div>

            {/* MENU */}
            <ul className="sidebar-menu list-unstyled p-0 m-0 flex-grow-1 overflow-y-auto">
                {menuItems.map((menu, index) => (
                    <li key={index} className="nav-item">
                        <div
                            className="menu-item d-flex align-items-center text-white cursor-pointer pe-4 flex-nowrap"
                            onClick={() => navigate(menu.path)}
                            style={{ fontSize: '0.9rem' }}
                        >
                            <FaCircle className="me-2" style={{ fontSize: '0.5rem' }} />
                            <span className="text-truncate">{menu.title}</span>
                        </div>
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

export default AuditorSide;
