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
import GlobalFilterBar from "./filters/GlobalFilterBar";
import { useLocation } from "react-router-dom";

const Layout = ({ children, role }) => {
    const user = getLoggedInUser();
    const location = useLocation();
    const rawRole = role || user?.role || user?.role_name || "ADMIN";
    const effectiveRole = rawRole.toUpperCase();

    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1200);
    const [currentUser, setCurrentUser] = useState(user);

    // Filter Visibility Rules
    const getVisibleFilters = () => {
        const path = location.pathname;

        // Hidden Group
        if (effectiveRole === 'ADMIN' ||
            path === '/profile' ||
            path === '/add-course') {
            return [];
        }

        // Dashboard Visibility Logic - Hide only for ADMIN
        if (path.includes('/dashboard')) {
            if (effectiveRole === 'ADMIN') return [];
            return ['dept', 'scheme', 'year'];
        }

        // Dept Only Group
        if (path === '/peo-po-pso' || path === '/statement2') {
            return ['dept'];
        }

        // Course Layer Group
        if (path === '/course-management' || path === '/co-po-pso-mapping' || path === '/my-courses') {
            return ['dept', 'scheme', 'introYear'];
        }

        // Full (No Div) Group
        if (path === '/target-management' || path === '/dac-reports') {
            return ['dept', 'scheme', 'batch', 'year', 'class', 'semester'];
        }

        // Stress Survey Group
        const stressPages = ['/stress-create', '/stress-report', '/stress-survey-report'];
        if (stressPages.includes(path)) {
            return ['dept', 'scheme', 'year'];
        }

        // Backtracking Group (No Division)
        const backtrackingPages = ['/attainment-backtracking'];
        if (backtrackingPages.includes(path)) {
            return ['dept', 'scheme', 'batch', 'year', 'class', 'semester'];
        }

        // Full Context Group (Default for other faculty/hod pages)
        const fullContextPages = [
            '/student-management', '/marks-entry', '/course-exit-survey',
            '/other-indirect-tools', '/direct-attainment', '/indirect-attainment',
            '/po-pso-attainment', '/report-verification',
            '/view-reports', '/view-cis-entries'
        ];

        if (fullContextPages.includes(path)) {
            return ['dept', 'scheme', 'batch', 'year', 'class', 'semester', 'division'];
        }

        return []; // Default hidden
    };

    const visibleFilters = getVisibleFilters();

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

                <div className="dashboard-content flex-grow-1" style={{ minWidth: 0, padding: '1rem' }}>
                    <GlobalFilterBar visibleFilters={visibleFilters} />
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Layout;
