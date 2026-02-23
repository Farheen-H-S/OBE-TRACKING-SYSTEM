import React from 'react';
import { Outlet } from 'react-router-dom';
import Auditorside from '../components/sidebar/Auditorside';
import Header from '../components/header/Header';

function AudDash() {
  return (
    <div className="d-flex flex-column vh-100">
      
      {/* Header */}
      <Header />

      {/* Body */}
      <div className="d-flex flex-grow-1 overflow-hidden">
        
        {/* Sidebar */}
        <div className="flex-shrink-0">
          <Auditorside />
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 overflow-auto p-3">
          <Outlet />
        </div>

      </div>
    </div>
  );
}

export default AudDash;
