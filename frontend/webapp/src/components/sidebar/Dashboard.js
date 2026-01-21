import React from 'react';
import Sidebar from './Sidebar'; // Sidebar is in the same directory now
import Header from "../header/Header"; // Header is in sibling directory

import "./Dashboard.css"; // Assuming Dashboard.css is in components/ or verify its location. 
// Ideally Dashboard.js should be moved to components/, but user asked to solve errors.
// If Dashboard.css is in components/, it is ../Dashboard.css. 
// If it is in sidebar/, it is ./Dashboard.css.


function Dashboard({ children }) {
  return (
    <div className="d-flex flex-column vh-100">
      {/* Top Header */}
      <Header />

      {/* Body Section */}
      <div className="d-flex flex-grow-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="h-100 overflow-y-auto">
          <Sidebar />
        </div>

        {/* Middle Content (Blank Container) */}
        <div className="flex-grow-1 p-4 bg-white overflow-y-auto">
          {children}
          <h1>HI this is HOD dashboard</h1>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
