import React, { useState, useEffect } from "react";
import Header from "../components/header/Header";

// Sidebars
import AdminSide from "../components/sidebar/Adminside";
import HodSide from "../components/sidebar/HodSide";
import FacultySide from "../components/sidebar/FacultySide";
import CoordinatorSide from "../components/sidebar/CoordinatorSide";
import AuditorSide from "../components/sidebar/AuditorSide";

import "./Layout.css";

import { getLoggedInUser } from "../utils/auth";
import api from "../utils/axios";

const Layout = ({ children, role }) => {
    const user = getLoggedInUser();
    const rawRole = role || user?.role || user?.role_name || "ADMIN";
    const effectiveRole = rawRole.toUpperCase();

    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1200);
    const [currentUser, setCurrentUser] = useState(user);

    useEffect(() => {
        const syncUser = async () => {
            try {
                const res = await api.get('/users/profile/');
                if (res.data) {
                    setCurrentUser(res.data);
                    const storage = localStorage.getItem("user") ? localStorage : sessionStorage;
                    storage.setItem("user", JSON.stringify(res.data));
                }
            } catch (err) {
                console.error("Failed to sync user data in Layout:", err);
            }
        };
        syncUser();
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1200) {
                setSidebarOpen(true);
            }
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

    const SidebarComponent = sidebars[effectiveRole] || null;

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="dashboard-wrapper">
            <Header onToggleSidebar={toggleSidebar} />

            <div className="dashboard-body d-flex position-relative">
                {/* Backdrop for mobile when sidebar is open */}
                {sidebarOpen && window.innerWidth < 1200 && (
                    <div
                        className="sidebar-backdrop"
                        onClick={() => setSidebarOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            background: 'rgba(0,0,0,0.5)',
                            zIndex: 1040
                        }}
                    />
                )}

                {SidebarComponent && (
                    <div className={`sidebar-container ${sidebarOpen ? 'open' : 'closed'}`} style={{ zIndex: 1050 }}>
                        <SidebarComponent isOpen={sidebarOpen} user={currentUser} onClose={() => setSidebarOpen(false)} />
                    </div>
                )}

                <div className="dashboard-content flex-grow-1" style={{ minWidth: 0 }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Layout;
