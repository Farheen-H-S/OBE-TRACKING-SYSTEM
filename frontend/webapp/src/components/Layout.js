import React, { useState, useEffect } from "react";
import Header from "../components/header/Header";
import Adminhead from "../components/header/Adminhead";

// Sidebars
import AdminSide from "../components/sidebar/AdminSide";
import HodSide from "../components/sidebar/HodSide";
import FacultySide from "../components/sidebar/FacultySide";
import CoordinatorSide from "../components/sidebar/CoordinatorSide";
import AuditorSide from "../components/sidebar/AuditorSide";

import "./Layout.css";

const Layout = ({ children, role = "ADMIN" }) => {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1200);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1200) setSidebarOpen(true);
            else setSidebarOpen(false);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const sidebars = {
        ADMIN: AdminSide,
        HOD: HodSide,
        FACULTY: FacultySide,
        COORDINATOR: CoordinatorSide,
        AUDITOR: AuditorSide,
    };

    const SidebarComponent = sidebars[role] || null;

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="dashboard-wrapper">
            {role === "ADMIN" ? (
                <Adminhead onToggleSidebar={toggleSidebar} />
            ) : (
                <Header onToggleSidebar={toggleSidebar} />
            )}

            <div className="dashboard-body d-flex">
                {SidebarComponent && <SidebarComponent isOpen={sidebarOpen} />}
                <div className="dashboard-content flex-grow-1">{children}</div>
            </div>
        </div>
    );
};

export default Layout;
