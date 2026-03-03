import React, { useState, useEffect } from "react";
import { Chart } from "react-google-charts";
import { FaCheck, FaTimes } from "react-icons/fa";
import "./Codash.css";
import api from "../../utils/axios";

const Codash = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCoordinatorData = async () => {
            try {
                setLoading(true);
                const response = await api.get('/users/coordinator-dashboard/');
                setData(response.data);
                setError(null);
            } catch (err) {
                console.error("Error fetching Coordinator dashboard data:", err);
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchCoordinatorData();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f0f4f8' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f0f4f8' }}>
                <div className="d-flex flex-grow-1">
                    <div className="flex-grow-1 p-4 text-center">
                        <div className="alert alert-warning mt-5">{error || "No dashboard data available."}</div>
                    </div>
                </div>
            </div>
        );
    }

    const {
        academic = {},
        health = [],
        coverage = [],
        dac_reports = []
    } = data;

    const pieOptions = {
        pieHole: 0.7,
        legend: "none",
        pieSliceText: "none",
        chartArea: { width: '80%', height: '80%' },
        backgroundColor: "transparent",
    };

    return (
        <div className="d-flex flex-column min-vh-100 co-dash-wrapper">
            <div className="d-flex flex-grow-1 overflow-hidden" style={{ height: 'calc(100vh - 70px)' }}>
                <div className="flex-grow-1 p-4 overflow-auto scrollable-content">
                    <div className="main-content-container p-4">

                        {/* Top Summary Cards */}
                        <div className="row mb-5 g-4">
                            <div className="col-12 col-md-4 col-lg-2">
                                <div className="info-card">
                                    <h6>Academic year</h6>
                                    <p>{academic.academic_year}</p>
                                    <p className="status-active">Status : Active</p>
                                </div>
                            </div>
                            <div className="col-12 col-md-4 col-lg-2">
                                <div className="info-card">
                                    <h6>Department</h6>
                                    <p>{academic.department}</p>
                                </div>
                            </div>
                            <div className="col-12 col-md-4 col-lg-2">
                                <div className="info-card">
                                    <h6>Semester type</h6>
                                    <p>{academic.semester_type}</p>
                                    <p className="small">Eff: {academic.effective_from}</p>
                                </div>
                            </div>
                            <div className="col-12 col-md-4 col-lg-2">
                                <div className="info-card">
                                    <h6>Scheme</h6>
                                    <p>{academic.scheme}</p>
                                </div>
                            </div>
                            <div className="col-12 col-md-4 col-lg-2">
                                <div className="info-card text-muted">
                                    <h6>Stress survey</h6>
                                    <p><b>Pending</b></p>
                                </div>
                            </div>
                            <div className="col-12 col-md-4 col-lg-2">
                                <div className="info-card">
                                    <h6>DAC reports</h6>
                                    <p>Tracking Active</p>
                                </div>
                            </div>
                        </div>

                        {/* OBE Process Health Section */}
                        <div className="obe-health-section mb-5">
                            <h4 className="section-title">OBE process health</h4>
                            <div className="obe-health-wrapper">
                                <div className="row g-4 align-items-center">
                                    {health.map((chart, index) => (
                                        <div className="col-12 col-sm-6 col-lg-3 chart-box" key={index}>
                                            <div className="chart-label">{chart.title}</div>
                                            <div className="d-flex align-items-center justify-content-center position-relative">
                                                <Chart
                                                    chartType="PieChart"
                                                    data={chart.data}
                                                    options={{ ...pieOptions, colors: chart.title.toLowerCase().includes('target') ? ["#68d391", "#ef5350"] : ["#68d391", "#cbd5e0"] }}
                                                    width={"150px"}
                                                    height={"150px"}
                                                />
                                                <div className="position-absolute fs-6 fw-bold">{chart.percentage}%</div>
                                            </div>
                                            <div className="chart-stats text-start px-2 small" style={{ whiteSpace: 'pre-line' }}>
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
                                {coverage.map((subj, idx) => (
                                    <div className="col-12 col-md-6 col-lg-4" key={idx}>
                                        <div className="assessment-status-card h-100">
                                            <h5 className="border-bottom pb-2 mb-3">Subject : {subj.subject}</h5>
                                            {subj.details.map((detail, dIdx) => (
                                                <div className="status-detail-item d-flex justify-content-between mb-1" key={dIdx}>
                                                    <span>{detail.label}</span>
                                                    <span className={`fw-bold ${detail.status === 'uploaded' ? 'text-success' : 'text-danger'}`}>{detail.status}</span>
                                                </div>
                                            ))}
                                            <div className="status-detail-item mt-3 pt-2 border-top d-flex justify-content-between">
                                                <span>CO attainment:</span>
                                                <span className="attainment-value fw-bold text-primary">{subj.co_attainment}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* DAC Report Submission Status Section */}
                        <div className="dac-report-section mb-4">
                            <h4 className="section-title">DAC report submission status (Approved Reports)</h4>
                            <div className="dac-status-card-v2 p-4 rounded shadow-sm bg-light" style={{ width: '100%', maxWidth: '600px' }}>
                                <h5 className="fw-bold mb-3 dac-card-title-v2" style={{ color: '#1e3a8a' }}>Monthly Tracker</h5>
                                <div className="row">
                                    {dac_reports.map((item, idx) => (
                                        <div key={idx} className="col-4 col-md-3 d-flex align-items-center justify-content-between mb-3 px-3">
                                            <span className="month-name fw-semibold text-secondary">{item.month}</span>
                                            {item.status === "ok" ?
                                                <FaCheck className="text-success" /> :
                                                <FaTimes className="text-danger" />
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
