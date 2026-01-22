import React from 'react';
import { Outlet } from 'react-router-dom';
import Adminhead from '../components/header/Adminhead.js';
import Adminside from '../components/sidebar/Adminside';



function Addash({ children }) {
  return (
    <div className="d-flex flex-column vh-100">

      <Adminhead />

      {/* Body Section */}
      <div className="d-flex flex-grow-1 overflow-hidden">
        <div className="h-100 overflow-y-auto">
          <Adminside />
        </div>

        {/* Middle Content (Render Child Routes Here) */}
        <div className="d-flex flex-column flex-grow-1 overflow-hidden">
          
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Addash;