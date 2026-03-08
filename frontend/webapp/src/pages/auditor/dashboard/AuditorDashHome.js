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

                {/* View CO-PO Mapping Button */}
                <div className="row mb-4">
                    <div className="col-12 align-items-left">
                        <button className="co-po-mapping-btn">View CO-PO mapping &rarr;</button>
                    </div>
                </div>

                {/* Attainment Backtracking */}
                <div className="row">
                    <div className="col-12">
                        <h5 className="attainment-section-title">Attainment Backtracking</h5>

                        {/* Attainment Summary */}
                        <h4 className="attainment-heading">Attainment summary :</h4>
                        <div className="attainment-summary">
                            <div className="attainment-badge achieved">
                                <span className="badge-label">Achieved</span>
                                <span className="badge-value">3</span>
                            </div>
                            <div className="attainment-badge target">
                                <span className="badge-label">Target</span>
                                <span className="badge-value">5</span>
                            </div>
                            <div className="attainment-badge gap">
                                <span className="badge-label">Gap</span>
                                <span className="badge-value">2</span>
                            </div>
                            <div className="status-not-met">
                                <span className="status-icon">&#9888;</span>
                                <span>Status : Not met</span>
                            </div>
                        </div>

                        {/* Attainment Table */}
                        <h4 className="attainment-heading mt-4">Attainment table (PO & PSO's):</h4>
                        <div className="attainment-table-wrapper">
                            <table className="attainment-table">
                                <thead>
                                    <tr>
                                        <th>Sr No.</th>
                                        <th>Level achieved</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td className="po-link">PO 1</td><td>2.5</td><td>Medium</td></tr>
                                    <tr><td className="po-link">PO 2</td><td>3</td><td>High</td></tr>
                                    <tr><td className="po-link">PO 3</td><td>1.5</td><td>Low</td></tr>
                                    <tr><td className="po-link">PO 4</td><td>2.5</td><td>Medium</td></tr>
                                    <tr><td className="po-link">PO 5</td><td>2</td><td>Low</td></tr>
                                    <tr><td className="po-link">PO 6</td><td>2.5</td><td>Medium</td></tr>
                                    <tr><td className="po-link">PO 7</td><td>3</td><td>High</td></tr>
                                    <tr className="pso-row"><td className="po-link">PSO 1</td><td>3.5</td><td>High</td></tr>
                                    <tr className="pso-row"><td className="po-link">PSO 2</td><td>1.5</td><td>Low</td></tr>
                                    <tr className="pso-row"><td className="po-link">PSO 3</td><td>1</td><td>Low</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="attainment-note mt-2"><strong>Note:</strong>Click on PO/PSO no. to view details</p>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default AuditorDashHome;
