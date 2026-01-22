import React from 'react';
import { Outlet } from 'react-router-dom';
import Adminhead from '../components/header/Adminhead';
import Adminside from '../components/sidebar/Adminside';

function Addash() {
  return (
    <div className="d-flex flex-column vh-100">
      
      {/* Header */}
      <Adminhead />

      {/* Body */}
      <div className="d-flex flex-grow-1 overflow-hidden">
        
        {/* Sidebar */}
        <div className="flex-shrink-0">
          <Adminside />
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 overflow-auto p-3">
          <Outlet />
        </div>

      </div>
    </div>
  );
}

export default Addash;
