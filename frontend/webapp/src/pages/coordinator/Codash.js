import React from "react";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";
import { Chart } from "react-google-charts";
import { FaCheck, FaTimes } from "react-icons/fa";
import "./Codash.css";

const Codash = () => {
    // OBE Process Health Chart Data
    const obeChartsData = [
        {
            title: "CO-PO-PSO Mapping",
            data: [
                ["Status", "Percentage"],
                ["Mapped", 25],
                ["Pending", 75],
            ],
            colors: ["#68d391", "#e2e8f0"],
            centerText: "25%",
            stats: "Completed:\n8/20 courses"
        },
        {
            title: "Report verification Status",
            data: [
                ["Status", "Percentage"],
                ["Verified", 65],
                ["Pending", 45],
            ],
            colors: ["#68d391", "#cbd5e0"],
            centerText: "65%",
            stats: "Verified:22\nPending:3"
        },
        {
            title: "Target management",
            data: [
                ["Status", "Percentage"],
                ["Assigned", 90],
                ["Pending", 10],
            ],
            colors: ["#68d391", "#cbd5e0"],
            centerText: "90%",
            stats: "Targets assigned:\n20/22 courses"
        },
        {
            title: "Target achived",
            data: [
                ["Status", "Percentage"],
                ["Achieved", 50],
                ["Pending", 50],
            ],
            colors: ["#68d391", "#cbd5e0"],
            centerText: "50%",
            stats: "Target\nAchived:50%\nPending:50%"
        }
    ];

    const pieOptions = {
        pieHole: 0.7,
        legend: "none",
        pieSliceText: "none",
        slices: {
            0: { color: "#68d391" },
            1: { color: "#cbd5e0" }
        },
        chartArea: { width: '80%', height: '80%' },
        backgroundColor: "transparent",
    };

    return (
        <div className="d-flex flex-column min-vh-100 co-dash-wrapper">
            <Header />
            <div className="d-flex flex-grow-1 overflow-hidden" style={{ height: 'calc(100vh - 70px)' }}>
                <Sidebar role="Coordinator" />
                <div className="flex-grow-1 p-4 overflow-auto scrollable-content">
                    <div className="main-content-container p-4">

                        {/* Top Summary Cards */}
                        <div className="row mb-5 g-4">
                            <div className="col-12 col-md-6 col-lg-2">
                                <div className="info-card">
                                    <h6>Acedemic year</h6>
                                    <p>2025-26</p>
                                    <p className="status-active">Status : Active</p>
                                </div>
                            </div>
                            <div className="col-12 col-md-6 col-lg-2">
                                <div className="info-card">
                                    <h6>Department</h6>
                                    <p>Computer engineering (CO)</p>
                                </div>
                            </div>
                            <div className="col-12 col-md-6 col-lg-2">
                                <div className="info-card">
                                    <h6>Semester type</h6>
                                    <p>Odd/<b>even</b></p>
                                    <p>Effective from : 01/01/2025</p>
                                    <p>Current month:Aug</p>
                                </div>
                            </div>
                            <div className="col-12 col-md-6 col-lg-2">
                                <div className="info-card">
                                    <h6>Scheme</h6>
                                    <p>MSBTE</p>
                                    <p><b>K</b> scheme</p>
                                </div>
                            </div>
                            <div className="col-12 col-md-6 col-lg-2">
                                <div className="info-card">
                                    <h6>Current stress survey status</h6>
                                    <p>Month:Aug</p>
                                    <p>Status:<b>Not conducted</b></p>
                                </div>
                            </div>
                            <div className="col-12 col-md-6 col-lg-2">
                                <div className="info-card">
                                    <h6>DAC report status</h6>
                                    <p>Month:Aug</p>
                                    <p>Status:<b>Uploaded</b></p>
                                </div>
                            </div>
                        </div>

                        {/* OBE Process Health Section */}
                        <div className="obe-health-section mb-5">
                            <h4 className="section-title">OBE process health</h4>
                            <div className="obe-health-wrapper">
                                <div className="row g-4 align-items-center">
                                    {obeChartsData.map((chart, index) => (
                                        <div className="col-12 col-sm-6 col-lg-3 chart-box" key={index}>
                                            <div className="chart-label">{chart.title}</div>
                                            <div className="d-flex align-items-center justify-content-center position-relative">
                                                <Chart
                                                    chartType="PieChart"
                                                    data={chart.data}
                                                    options={{ ...pieOptions, slices: { 0: { color: chart.colors[0] }, 1: { color: chart.colors[1] } } }}
                                                    width={"150px"}
                                                    height={"150px"}
                                                />
                                                <div className="position-absolute fs-6 fw-bold">{chart.centerText}</div>
                                            </div>
                                            <div className="chart-stats text-start px-2" style={{ whiteSpace: 'pre-line' }}>
                                                {chart.stats}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Assessment Coverage Status Section */}
                        <div className="assessment-coverage-section mb-5">
                            <h4 className="section-title">Assessment coverage status</h4>
                            <div className="row g-4">
                                {/* Subject 1: Operating system */}
                                <div className="col-12 col-lg-6">
                                    <div className="assessment-status-card">
                                        <h5>Subject : Operating system</h5>
                                        <div className="status-detail-item">FA-TH : uploaded</div>
                                        <div className="status-detail-item">FA-TH : Not applicable</div>
                                        <div className="status-detail-item">
                                            SA-PR :
                                            <div className="status-dots">
                                                {[...Array(10)].map((_, i) => <div key={i} className="dot dot-filled"></div>)}
                                                {[...Array(5)].map((_, i) => <div key={i} className="dot dot-light"></div>)}
                                            </div>
                                            <span>10/15</span>
                                        </div>
                                        <div className="status-detail-item">
                                            SLA :
                                            <div className="status-dots">
                                                {[...Array(2)].map((_, i) => <div key={i} className="dot dot-filled"></div>)}
                                                {[...Array(3)].map((_, i) => <div key={i} className="dot dot-light"></div>)}
                                            </div>
                                            <span>2/5</span>
                                        </div>
                                        <div className="status-detail-item">SA-PR : Not applicable</div>
                                        <div className="status-detail-item">CO attainment: <span className="attainment-value">50%</span></div>
                                    </div>
                                </div>

                                {/* Subject 2: Data Analytics */}
                                <div className="col-12 col-lg-6">
                                    <div className="assessment-status-card">
                                        <h5>Subject : Data Analytics</h5>
                                        <div className="status-detail-item">FA-TH : uploaded</div>
                                        <div className="status-detail-item">FA-TH : uploaded</div>
                                        <div className="status-detail-item">
                                            SA-PR :
                                            <div className="status-dots">
                                                {[...Array(10)].map((_, i) => <div key={i} className="dot dot-filled"></div>)}
                                                {[...Array(4)].map((_, i) => <div key={i} className="dot dot-light"></div>)}
                                            </div>
                                            <span>10/14</span>
                                        </div>
                                        <div className="status-detail-item">
                                            SLA :
                                            <div className="status-dots">
                                                {[...Array(2)].map((_, i) => <div key={i} className="dot dot-filled"></div>)}
                                                {[...Array(3)].map((_, i) => <div key={i} className="dot dot-light"></div>)}
                                            </div>
                                            <span>2/5</span>
                                        </div>
                                        <div className="status-detail-item">SA-PR : Not applicable</div>
                                        <div className="status-detail-item">CO attainment: <span className="attainment-value">38%</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DAC Report Submission Status Section */}
                        <div className="dac-report-section mb-4">
                            <h4 className="section-title">DAC report submission status</h4>
                            <div className="dac-status-card-v2 p-4 rounded shadow-sm" style={{ backgroundColor: '#d1d5db', width: 'fit-content', minWidth: '220px' }}>
                                <h5 className="fw-bold mb-3 dac-card-title-v2 text-center" style={{ color: '#1e3a8a', borderBottom: '2px solid #9ca3af', paddingBottom: '8px' }}>Months</h5>
                                <div className="dac-months-list-v2">
                                    {[
                                        { m: "Jan", s: "ok" }, { m: "Feb", s: "ok" }, { m: "Mar", s: "ok" },
                                        { m: "Apr", s: "ok" }, { m: "May", s: "ok" }, { m: "Jun", s: "no" },
                                        { m: "Jul", s: "no" }, { m: "Sep", s: "no" }, { m: "Oct", s: "no" },
                                        { m: "Nov", s: "no" }, { m: "Dec", s: "no" }
                                    ].map((item, idx) => (
                                        <div key={idx} className="d-flex align-items-center justify-content-between mb-2">
                                            <span className="month-name fw-semibold" style={{ color: '#4b5563', width: '45px' }}>{item.m}</span>
                                            {item.s === "ok" ?
                                                <FaCheck className="text-success ms-3" /> :
                                                <FaTimes className="text-danger ms-3" />
                                            }
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Codash;
