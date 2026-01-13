import React from 'react'; 
import Sidebar from './sidebar/Sidebar';
import Header from "./header/Header";

import "./Dashboard.css";

function Dashboard({ children }) {
  return (
    <div className="dashboard-wrapper">
      {/* Top Header */}
      <Header />

      {/* Body Section */}
      <div className="dashboard-body">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Middle Content (Blank Container) */}
        <div className="dashboard-content">
          {children}
          {/* You can add other components here later */}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
