import React from "react";

import Header from '../components/header/Header';
import Sidebar from '../components/sidebar/Sidebar';






const Stressreport = () => {

  return (

    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#eef6f8' }}>
      {/* HEADER */}
      <Header />

      {/* BODY */}
      <div className="d-flex flex-grow-1">
        {/* SIDEBAR */}
        <Sidebar />

        {/* MAIN CONTENT */}
        <div className="flex-grow-1 p-3">
          <div className="bg-white p-4 rounded shadow-sm" style={{ minHeight: '780px' }}>
            <h2 className="text-center fw-bold mb-4" style={{ fontFamily: 'Inter, sans-serif', color: '#1f2f5c', fontSize: '32px' }}>
              Student stress analysis report
            </h2>
            <hr />

            
        </div>
      </div>
    </div>
   </div>

  )

}

export default Stressreport;
