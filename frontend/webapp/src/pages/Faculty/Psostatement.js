import React from "react";

import Header from './components/header/Header';
import Sidebar from './components/sidebar/Sidebar';
import "./Psostatement.css";




const Psostatement = () => {

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
            <h2 className="po-title">Program outcome(PO's)</h2>
            <hr />

            <p>
              <strong>PO1 :</strong> Basic and Discipline specific knowledge: Apply knowledge of basic mathematics,
               science and engineering  fundamentals and engineering specialization to solve the engineering problems.
            </p>

            <p>
              <strong>PO2 :</strong>  Problem analysis: Identify and analyse well-defined engineering problems using codified standard methods. 

            </p>

            <p>
              <strong>PO3 :</strong> Design/ development of solutions: Design solutions for well-defined technical problems and
               assist with the  design of systems components or processes to meet specified needs.
            </p>


            <p>
                <strong>PO4 :</strong>  Engineering Tools, Experimentation and Testing: Apply modern engineering tools
                 and appropriate technique  to conduct standard tests and measurements. 
                </p>


           <p>
              <strong>PO5 :</strong>  Engineering practices for society, sustainability and environment: Apply appropriate technology 
              in context  of society, sustainability, environment and ethical practices. 
           </p>

           <p>
              <strong>PO6 :</strong> Project Management: Use engineering management principles individually, as a team member or a leader to 
               manage projects and effectively communicate about well-defined engineering activities.
           </p>

           <p>
            <strong>PO7 :</strong> Life-long learning: Ability to analyze individual needs and engage in updating in the context of technological  changes.
           </p>
          </div>
        </div>
      </div>
    </div>


  )

}
  
export default Psostatement;
