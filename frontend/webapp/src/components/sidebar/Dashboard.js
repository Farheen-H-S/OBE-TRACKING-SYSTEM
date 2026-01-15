import React from 'react';
import Sidebar from './Sidebar'; // Sidebar is in the same directory now
import Header from "../header/Header"; // Header is in sibling directory

import "./Dashboard.css"; // Assuming Dashboard.css is in components/ or verify its location. 
// Ideally Dashboard.js should be moved to components/, but user asked to solve errors.
// If Dashboard.css is in components/, it is ../Dashboard.css. 
// If it is in sidebar/, it is ./Dashboard.css.


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
