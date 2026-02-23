import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AuditorDashHome.css';

function AuditorDashHome() {
    return (
        <div className="p-4" style={{ backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <div className="container-fluid auditor-dashboard-container">

                {/* Top Row: Academic Info */}
                <div className="row mb-4">
                    {/* Academic Year */}
                    <div className="col-md-3 mb-3">
                        <div className="heading-title">Acedemic year</div>
                        <div className="info-card active-status d-flex flex-column justify-content-center">
                            <div className="fw-bold fs-5">2025-26</div>
                            <div className="text-secondary small">Status : Active</div>
                        </div>
                    </div>

                    {/* Current Working */}
                    <div className="col-md-5 mb-3">
                        <div className="heading-title">Current working</div>
                        <div className="info-card">
                            <ul className="mb-0">
                                <li><strong>• Dept:</strong> Computer engineering(CO)</li>
                                <li><strong>• Scheme:</strong> MSBTE K</li>
                                <li><strong>• Class:</strong> FYCO-A</li>
                                <li><strong>• Semester:</strong> II(even)</li>
                            </ul>
                        </div>
                    </div>

                    {/* Audit Duration */}
                    <div className="col-md-4 mb-3">
                        <div className="heading-title">Audit duration</div>
                        <div className="info-card d-flex flex-column justify-content-center">
                            <div className="mb-1"><strong>Start:</strong> <span className="badge bg-secondary">01/Aug/2025</span></div>
                            <div><strong>End:</strong> <span className="badge bg-secondary">03/Aug/2025</span></div>
                        </div>
                    </div>
                </div>

                {/* Middle Row: Reports & Status */}
                <div className="row mb-4">
                    {/* Available Reports */}
                    <div className="col-md-4 mb-3">
                        <div className="heading-title">Available reports</div>
                        <div className="info-card">
                            <ul className="mb-2">
                                <li>• DAC 11/12</li>
                                <li>• CIS : <br /> &nbsp;&nbsp; Direct-8/8 <br /> &nbsp;&nbsp; Indirect-4/5</li>
                            </ul>
                            <button className="btn btn-primary btn-sm mt-2">View reports →</button>
                        </div>
                    </div>

                    {/* Verification Status */}
                    <div className="col-md-2 mb-3">
                        <div className="heading-title">Verification status</div>
                        <div className="info-card d-flex flex-column justify-content-center align-items-center">
                            <div className="mb-1">Verifyed : <strong>22</strong></div>
                            <div>Pending : <strong>7</strong></div>
                        </div>
                    </div>

                    {/* Total Remarks Added */}
                    <div className="col-md-2 mb-3">
                        <div className="heading-title">Total remarks added</div>
                        <div className="info-card d-flex align-items-center justify-content-center">
                            <h2 className="fw-bold mb-0">12</h2>
                        </div>
                    </div>

                    {/* Latest Remark Status */}
                    <div className="col-md-4 mb-3">
                        <div className="heading-title">latest remark staus</div>
                        <div className="info-card d-flex flex-column justify-content-between">
                            <div className="d-flex justify-content-between mb-2">
                                <span>Date: <strong>02/Aug/2025</strong></span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <span>Time: <strong>12:56 pm</strong></span>
                                <button className="btn btn-primary btn-sm">View remark</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: User Activities */}
                <div className="row">
                    <div className="col-12">
                        <h4 className="user-activities-title">User Activities</h4>
                        <div className="table-responsive">
                            <table className="table table-bordered custom-table">
                                <thead>
                                    <tr>
                                        <th>Record ID</th>
                                        <th>Date & time</th>
                                        <th>Username</th>
                                        <th>Role</th>
                                        <th>Action</th>
                                        <th>Short Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Empty Rows as placeholders or empty state from image */}
                                    <tr>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td className="text-end"><button className="btn btn-primary btn-sm">View details</button></td>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td className="text-end"><button className="btn btn-primary btn-sm">View details</button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default AuditorDashHome;
