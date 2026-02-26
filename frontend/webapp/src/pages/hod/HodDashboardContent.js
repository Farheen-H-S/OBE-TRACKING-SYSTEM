import React from 'react';
import { Chart } from "react-google-charts";
import 'bootstrap/dist/css/bootstrap.min.css';
import './HodDashboardContent.css';

function HodDashboardContent() {

    // --- Data for Charts ---

    // 1. CO-PO-PSO Mapping
    const mappingData = [
        ["Status", "Percentage"],
        ["Completed", 75],
        ["Inprogress", 25],
    ];
    const mappingOptions = {
        pieHole: 0.5,
        legend: 'none',
        pieSliceText: 'none',
        colors: ['#66bb6a', '#9e9e9e'], // Green, Grey
    };

    // 2. Report verification Status
    const verificationData = [
        ["Status", "Percentage"],
        ["Verified", 60],
        ["Pending", 40],
    ];
    const verificationOptions = {
        pieHole: 0.5,
        legend: 'none',
        pieSliceText: 'none',
        colors: ['#66bb6a', '#bdbdbd'],
    };

    // 3. Target management
    const targetData = [
        ["Status", "Percentage"],
        ["Target set", 82],
        ["Target not set", 18],
    ];
    const targetOptions = {
        pieHole: 0.5,
        legend: 'none',
        pieSliceText: 'none',
        colors: ['#66bb6a', '#ef5350'], // Green, Red
    };

    // 4. Target achieved
    const achievedData = [
        ["Status", "Percentage"],
        ["Target Achieved", 58],
        ["Target Not Achieved", 42],
    ];
    const achievedOptions = {
        pieHole: 0.5,
        legend: 'none',
        pieSliceText: 'none',
        colors: ['#66bb6a', '#ef5350'],
    };

    // Overall CO Attainment Bar Chart
    const attainmentData = [
        ["Course Outcome", "Percentage", { role: "style" }],
        ["CO 1", 23, "#4285f4"],
        ["CO 2", 50, "#4285f4"],
        ["CO 3", 46, "#4285f4"],
        ["CO 4", 30, "#4285f4"],
        ["CO 5", 55, "#4285f4"],
    ];

    const attainmentOptions = {
        title: "",
        legend: { position: "none" },
        vAxis: {
            title: "Attainment achived in %",
            minValue: 0,
            maxValue: 60
        },
        hAxis: { title: "Course outcome" },
    };


    return (
        <div className="hod-dashboard-wrapper">
            <div className="row h-100">

                {/* --- Main Dashboard (Full Width) --- */}
                <div className="col-12 mb-4">
                    <div className="hod-main-container">

                        {/* 1. Top Stats Row */}
                        <div className="row mb-4 text-center">
                            <div className="col-md-2 mb-2">
                                <div className="stat-card-label">Acedemic year</div>
                                <div className="stat-card-box">
                                    <div className="fw-bold">2025-26</div>
                                    <div className="text-secondary small">Status : Active</div>
                                </div>
                            </div>
                            <div className="col-md-2 mb-2">
                                <div className="stat-card-label">Department</div>
                                <div className="stat-card-box">
                                    <div className="fw-bold small">Computer engineering (CO)</div>
                                </div>
                            </div>
                            <div className="col-md-2 mb-2">
                                <div className="stat-card-label">Semester type</div>
                                <div className="stat-card-box">
                                    <div className="fw-bold small">Odd/even</div>
                                    <div className="text-secondary tiny">Effective from : 01/01/2025</div>
                                </div>
                            </div>
                            <div className="col-md-2 mb-2">
                                <div className="stat-card-label">Scheme</div>
                                <div className="stat-card-box">
                                    <div className="fw-bold">MSBTE</div>
                                    <div className="fw-bold">K scheme</div>
                                </div>
                            </div>
                            <div className="col-md-2 mb-2">
                                <div className="stat-card-label">Current stress survey status</div>
                                <div className="stat-card-box">
                                    <div className="small">Month:Aug</div>
                                    <div className="fw-bold text-danger tiny">Status:Not conducted</div>
                                </div>
                            </div>
                            <div className="col-md-2 mb-2">
                                <div className="stat-card-label">DAC report status</div>
                                <div className="stat-card-box">
                                    <div className="small">Month:Aug</div>
                                    <div className="fw-bold text-success tiny">Status:Uploaded</div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Course & Faculty Overview */}
                        <h5 className="section-heading">Course & faculty overview</h5>
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="course-scroll-container">
                                    {/* Total Students Card (Moved from Right Panel) */}
                                    <div className="course-scroll-item">
                                        <div className="right-panel-stat h-100 d-flex flex-column justify-content-center">
                                            <h6 className="section-heading text-secondary text-center mb-2">Total students</h6>
                                            <div className="total-students-count">68</div>
                                        </div>
                                    </div>

                                    {/* Course Cards (Existing) */}
                                    {['Operating System(OSY)', 'Data Analytics(DAM)', 'Java Programming(JHP)', 'Software Engineering(SFT)'].map((course, idx) => (
                                        <div className="course-scroll-item" key={`main-${idx}`}>
                                            <div className="course-card">
                                                <div className="course-card-header">{course}</div>
                                                <div className="course-card-body">
                                                    <ul>
                                                        <li>• Faculty assigned: Prof.Varsha Wagh</li>
                                                        <li>• Course completed: <strong>{50 + idx * 10}%</strong></li>
                                                        <li>• Attainment status: <strong>Pending</strong></li>
                                                        <li>• Class: <strong>FYCO-A</strong></li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Additional Courses (Moved from Right Panel) */}
                                    {[1, 2, 3].map((item, idx) => (
                                        <div className="course-scroll-item" key={`extra-${idx}`}>
                                            <div className="right-course-card h-100">
                                                <div className="right-course-title">Software Engineering(SFT)</div>
                                                <div className="tiny-text">
                                                    <div>• Faculty assigned: Prof.Varsha Wagh</div>
                                                    <div>• Course completed: 88%</div>
                                                    <div>• Attainment status: <strong>Pending</strong></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 3. OBE Process Health */}
                        <h5 className="section-heading">OBE process health</h5>
                        <div className="row mb-4">
                            <div className="col-md-3 mb-3">
                                <div className="obe-chart-container">
                                    <div className="chart-title">CO-PO-PSO Mapping</div>
                                    <Chart chartType="PieChart" width="100%" height="120px" data={mappingData} options={mappingOptions} />
                                    <div className="small mt-1 text-success">Completed</div>
                                </div>
                            </div>
                            <div className="col-md-3 mb-3">
                                <div className="obe-chart-container">
                                    <div className="chart-title">Report verification Status</div>
                                    <Chart chartType="PieChart" width="100%" height="120px" data={verificationData} options={verificationOptions} />
                                    <div className="small mt-1 text-success">Verified: 22
                                         Pending</div>
                                </div>
                            </div>
                            <div className="col-md-3 mb-3">
                                <div className="obe-chart-container">
                                    <div className="chart-title">Target management</div>
                                    <Chart chartType="PieChart" width="100%" height="120px" data={targetData} options={targetOptions} />
                                    <div className="small mt-1 text-success">Target set: 22</div>
                                </div>
                            </div>
                            <div className="col-md-3 mb-3">
                                <div className="obe-chart-container">
                                    <div className="chart-title">Target achieved</div>
                                    <Chart chartType="PieChart" width="100%" height="120px" data={achievedData} options={achievedOptions} />
                                    <div className="small mt-1 text-success">Achieved: 58%</div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Overall CO Attainment */}
                        <h5 className="section-heading">Overall CO attainment overview Subject</h5>
                        <div className="row">
                            <div className="col-12">
                                <div className="border rounded p-2">
                                    <Chart chartType="ColumnChart" width="100%" height="300px" data={attainmentData} options={attainmentOptions} />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}

export default HodDashboardContent;
