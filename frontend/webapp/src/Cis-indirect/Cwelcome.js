import React from 'react';
import './Cwelcome.css';
import redbg from './redbg.jpg';

const Cwelcome = () => {
    return (
        <div className="container-fluid p-0 cwelcome-container">
            <div className="row">
                <div className="col-12">
                    <div className="d-flex align-items-center mb-4">
                        <img src={redbg} alt="Background" className="cwelcome-bg-img" />
                        <h2 className="cwelcome-title ms-3">
                            Welcome to course exist survey (CIS)
                        </h2>
                    </div>
                </div>
            </div>

            <div className="container">
                <div className="row">
                    <div className="col-12 mb-4">
                        <p className="cwelcome-text">
                            This survey helps the department evaluate how well the course outcomes are achieved.<br />
                            Your honest feedback is important.
                        </p>
                    </div>

                    <div className="col-md-8 col-lg-6 mb-5">
                        <table className="table table-bordered cwelcome-table">
                            <tbody>
                                <tr>
                                    <td className="fw-bold">Course name</td>
                                    <td className="fw-bold">Java programming</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold">Course code</td>
                                    <td className="fw-bold">312023</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold">Faculty name</td>
                                    <td className="fw-bold">prof. Rashmi Deshpande</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold">Semester</td>
                                    <td className="fw-bold">5</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="col-12 mb-4">
                        <p className="cwelcome-instruction">
                            <span className="text-danger fw-bold">Instruction : </span>
                            Read each Course Outcome (CO) statement carefully and give your rating from 1 to based on how well you achieved it.
                        </p>
                    </div>

                    <div className="col-12 mb-2">
  <p className="fw-bold mb-2 ms-2">Rating scale :</p>

  <ul className="list-unstyled">
    <li className="d-flex align-items-center">
      <span className="text-danger fw-bold me-2" style={{ width: "20px" }}>4</span>
      <span>Very Good</span>
    </li>
    <li className="d-flex align-items-center">
      <span className="text-danger fw-bold me-2" style={{ width: "20px" }}>3</span>
      <span>Good</span>
    </li>
    <li className="d-flex align-items-center">
      <span className="text-danger fw-bold me-2" style={{ width: "20px" }}>2</span>
      <span>Fair</span>
    </li>
    <li className="d-flex align-items-center">
      <span className="text-danger fw-bold me-2" style={{ width: "20px" }}>1</span>
      <span>Poor</span>
    </li>
  </ul>
</div>



                    <div className="col-12 text-end mb-5">
                        <button className="btn btn-danger px-4 cwelcome-btn">Start</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cwelcome;
