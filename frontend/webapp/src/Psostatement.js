import React from "react";

import Header from './components/header/Header';
import Sidebar from './components/sidebar/Sidebar';




const Psostatement = () => {

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
              Program specific outcome (PSO's)
            </h2>
            <hr />

            <div className="text-start" style={{ fontFamily: 'Inter, sans-serif', color: '#1f2f5c', fontSize: '20px', lineHeight: '1.8' }}>
              <p className="mb-3">
                
               <strong>PO1 :</strong> Basic and Discipline specific knowledge: Apply knowledge of basic mathematics,
               science and engineering  fundamentals and engineering specialization to solve the engineering problems.
               </p>
               
                <p className="mb-3">
              <strong>PO2 :</strong>  Problem analysis: Identify and analyse well-defined engineering problems using codified standard methods. 

            </p>

            <p className="mb-3">
              <strong>PO3 :</strong> Design/ development of solutions: Design solutions for well-defined technical problems and
               assist with the  design of systems components or processes to meet specified needs.
            </p>


            <p className="mb-3">
                <strong>PO4 :</strong>  Engineering Tools, Experimentation and Testing: Apply modern engineering tools
                 and appropriate technique  to conduct standard tests and measurements. 
                </p>


           <p className="mb-3">
              <strong>PO5 :</strong>  Engineering practices for society, sustainability and environment: Apply appropriate technology 
              in context  of society, sustainability, environment and ethical practices. 
           </p>

           <p className="mb-3">
              <strong>PO6 :</strong> Project Management: Use engineering management principles individually, as a team member or a leader to 
               manage projects and effectively communicate about well-defined engineering activities.
           </p>

           <p className="mb-3">
            <strong>PO7 :</strong> Life-long learning: Ability to analyze individual needs and engage in updating in the context of technological  changes.
           </p>

              
            </div>
          </div>
        </div>
      </div>
    </div>


  )

}

export default Psostatement;
