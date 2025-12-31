import React from "react";

import Header from './components/header/Header';
import Sidebar from './components/sidebar/Sidebar';
import "./Postatement.css";




const Postatement = () => {

  return(

    <div className="page-wrapper">
      {/* HEADER */}
      <Header />

      {/* BODY */}
      <div className="page-body">
        {/* SIDEBAR */}
        <Sidebar />

        {/* MAIN CONTENT */}
        <div className="content-wrapper">
          <div className="white-container">
            <h2 className="po-title">Program specific outcome (PSO's)</h2>
            <hr />

            <p>
              <strong>PSO1 :</strong> Computer Software and Hardware Usage: Use
              state-of-the-art technologies for operation and application of
              computer software and hardware.
            </p>

            <p>
              <strong>PSO2 :</strong> Computer Engineering Maintenance: Maintain
              Computer Engineering related software and hardware systems.
            </p>

            <p>
              <strong>PSO3 :</strong> Apply standard ethical and moral values,
              management principles and soft skills to develop projects for the
              Industry and societal needs.
            </p>
          </div>
        </div>
      </div>
    </div>


  )

}
  
export default Postatement;
