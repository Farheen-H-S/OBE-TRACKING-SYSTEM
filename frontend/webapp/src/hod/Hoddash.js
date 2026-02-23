import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/sidebar/Sidebar';
import Header from '../components/header/Header';

function Hoddash() {
  return (
    <div className="d-flex flex-column vh-100">
      
      {/* Header */}
      <Header />

      {/* Body */}
      <div className="d-flex flex-grow-1 overflow-hidden">
        
        {/* Sidebar */}
        <div className="flex-shrink-0">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 overflow-auto p-3">
          <Outlet />
        </div>

      </div>
    </div>
  );
}

export default Hoddash;
