import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../admin/Viewuser1.css';

import { FaSearch } from "react-icons/fa";

const Viewuser1 = () => {
  const navigate = useNavigate();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      navigate('/view-user2');
    }
  };

  return (
    <div >

      {/* Main Content */}
      <main className="form-content-area p-4 d-flex justify-content-center align-items-start overflow-auto w-100" style={{ backgroundColor: '#f0f2f5' }}>
        <div className="form-wrapper w-100" style={{ maxWidth: '900px' }}>

          <h5 className="fw-medium text-primary mb-2 fs-3 inter-heading">Search user</h5>

          <div className="position-relative" style={{ maxWidth: "350px" }}>
            <FaSearch
              className="position-absolute" />

            <input
              type="text"
              className="form-control ps-5 fs-4"
              placeholder="search"
              onKeyDown={handleKeyDown}
            />
          </div>


        </div>
      </main>
    </div>

  );
};

export default Viewuser1;
