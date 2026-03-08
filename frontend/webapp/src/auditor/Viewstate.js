
import React from 'react';
import Header from '../components/header/Header';
import Auditorside from '../components/sidebar/Auditorside';
import './Viewstate.css';

const Viewstate = () => {
    return (
        <div className="statement2-wrapper">
            
            <div className="d-flex">
               
                <div className="statement2-main">
                    <div className="statement2-card">

                       
                        {/* Institute Section */}
                        <div className="section-header">
                            <h5 className="section-title">Vision and Mission of the Institute</h5>
                        </div>

                        <div className="text-center mb-4">
                            <h5 className="vision-mission-label">Vision</h5>
                            <p className="content-text">
                                To produce skilled technocrats for serving industry,society and peruse higher eduction.
                            </p>
                        </div>

                        <div className="mb-4">
                            <h5 className="vision-mission-label text-center">Mission</h5>
                            <ul className="mission-list">
                                <li className="mission-item">
                                    <span className="mission-no">M1 :</span>
                                    <span>To provide state-of-art infrastructure,qualified and competent teaching faculty .</span>
                                </li>
                                <li className="mission-item">
                                    <span className="mission-no">M2 :</span>
                                    <span>To provide industry-institute interaction,employability  enhancement and higher eduction .</span>
                                </li>
                                <li className="mission-item">
                                    <span className="mission-no">M3 :</span>
                                    <span>To provide platform for development of professional,social skills and lifelong learning.</span>
                                </li>
                            </ul>
                            
                        </div>


                        {/* Department Section */}
                        <div className="department-section">
                            <div className="section-header">
                                <h5 className="section-title">Vision and Mission of the Department</h5>
                            </div>

                            <div className="text-center mb-4">
                                <h5 className="vision-mission-label">Vision</h5>
                                <p className="content-text">
                                    To produce skilled technocrats for serving industry,society and peruse higher eduction.
                                </p>
                            </div>

                            <div className="mb-4">
                                <h5 className="vision-mission-label text-center">Mission</h5>
                                
                                <ul className="mission-list">
                                    <li className="mission-item">
                                        <span className="mission-no">M1 :</span>
                                        <span>To provide state-of-art infrastructure,qualified and competent teaching faculty .</span>
                                    </li>
                                    <li className="mission-item">
                                        <span className="mission-no">M2 :</span>
                                        <span>To provide industry-institute interaction,employability  enhancement and higher eduction .</span>
                                    </li>
                                    <li className="mission-item">
                                        <span className="mission-no">M3 :</span>
                                        <span>To provide platform for development of professional,social skills and lifelong learning.</span>
                                    </li>
                                </ul>
                               
                            </div>
                        </div>

                    </div>

                    {/* Bottom Section with Tables */}
                    <div className="statement2-bottom-section">

                        {/* PEO Table */}
                        <div className="table-section">
                            <h5 className="section-title">Program Educational Objectives</h5>
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th className="col-no">PEO no.</th>
                                        <th className="col-stmt">Statement</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="col-no-body">PEO 1</td>
                                        <td>To prepare students for successful careers in industry and higher education.</td>
                                    </tr>
                                    <tr>
                                        <td className="col-no-body">PEO 2</td>
                                        <td>To provide strong foundation in mathematics, science and engineering fundamentals.</td>
                                    </tr>
                                    <tr>
                                        <td className="col-no-body">PEO 3</td>
                                        <td>To develop professional and ethical attitude, communication skills and teamwork.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* PO Table */}
                        <div className="table-section">
                            <h5 className="section-title">Program outcomes</h5>
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th className="col-no">PO no.</th> {/* Corrected from PEO no. based on context */}
                                        <th className="col-stmt">Statement</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="col-no-body">PO 1</td>
                                        <td>Engineering knowledge: Apply knowledge of mathematics and engineering sciences.</td>
                                    </tr>
                                    <tr>
                                        <td className="col-no-body">PO 2</td>
                                        <td>Problem analysis: Identify, formulate and analyze complex engineering problems.</td>
                                    </tr>
                                    <tr>
                                        <td className="col-no-body">PO 3</td>
                                        <td>Design/development of solutions for complex engineering problems.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* PSO Table */}
                        <div className="table-section">
                            <h5 className="section-title">Program specific outcomes</h5>
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th className="col-no">PSO no.</th>
                                        <th className="col-stmt">Statement</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="col-no-body">PSO 1</td>
                                        <td>Apply software engineering principles to design and develop software systems.</td>
                                    </tr>
                                    <tr>
                                        <td className="col-no-body">PSO 2</td>
                                        <td>Demonstrate proficiency in modern programming languages and tools.</td>
                                    </tr>
                                    <tr>
                                        <td className="col-no-body">PSO 3</td>
                                        <td>Apply algorithmic principles to solve computational problems efficiently.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Viewstate;
