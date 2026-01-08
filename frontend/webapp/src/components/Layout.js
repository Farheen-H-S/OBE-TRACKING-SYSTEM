import React from "react";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";
import "./Layout.css";

const Layout = ({ children, role = "HOD" }) => {
    return (
        <div className="dashboard-wrapper">
            <Header />
            <div className="dashboard-body">
                <Sidebar role={role} />
                <div className="dashboard-content">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Layout;
