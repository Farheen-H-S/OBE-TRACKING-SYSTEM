import Header from "../components/header/Header";
import Adminhead from "../components/header/Adminhead";

// Sidebars
import AdminSide from "./sidebar/AdminSide";
import HodSide from "../components/sidebar/HodSide";
import FacultySide from "../components/sidebar/FacultySide";
import CoordinatorSide from "../components/sidebar/CoordinatorSide";
import AuditorSide from "../components/sidebar/AuditorSide";

import "./Layout.css";

const Layout = ({ children, role = "HOD" }) => {
    const sidebars = {
        ADMIN: AdminSide,
        HOD: HodSide,
        FACULTY: FacultySide,
        COORDINATOR: CoordinatorSide,
        AUDITOR: AuditorSide,
    };

    const SidebarComponent = sidebars[role] || null;

    return (
        <div className="dashboard-wrapper">
            {/* Render Adminhead only for Admin */}
            {role === "ADMIN" ? <Adminhead /> : <Header role={role} />}

            <div className="dashboard-body d-flex">
                {SidebarComponent && <SidebarComponent role={role} />}
                <div className="dashboard-content flex-grow-1">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Layout;
