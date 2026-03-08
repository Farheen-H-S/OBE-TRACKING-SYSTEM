import React, { useState, useEffect } from "react";
import { Chart } from "react-google-charts";
import { FaCheck, FaTimes } from "react-icons/fa";
import { useFilters } from "../../context/FilterContext";
import GlobalFilterBar from "../../components/filters/GlobalFilterBar";
import "./Codash.css";
import api from "../../utils/axios";

const Codash = () => {
    const { selectedDept, selectedScheme, selectedYear } = useFilters();
    const [selectedClass, setSelectedClass] = useState("");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCoordinatorData = async () => {
            try {
                setLoading(true);
                const response = await api.get('/users/coordinator-dashboard/', {
                    params: {
                        dept_id: selectedDept,
                        scheme_id: selectedScheme,
                        academic_year: selectedYear,
                        class_name: selectedClass
                    }
                });
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
    }, [selectedDept, selectedScheme, selectedYear, selectedClass]);

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
        last_dac_upload_date = "Not uploaded",
        po_pso_attainment = []
    } = data;

    const pieOptions = {
        pieHole: 0.7,
        legend: "none",
        pieSliceText: "none",
        chartArea: { width: '80%', height: '80%' },
        backgroundColor: "transparent",
    };

    const barOptions = {
        chartArea: { width: "80%", height: "70%" },
        legend: { position: "none" },
        vAxis: {
            title: "Attainment %",
            minValue: 0,
            maxValue: 100
        },
        hAxis: { title: "PO / PSO" },
    };

    return (
        <div className="d-flex flex-column min-vh-100 co-dash-wrapper">
            <div className="d-flex flex-grow-1 overflow-hidden" style={{ height: 'calc(100vh - 70px)' }}>
                <div className="flex-grow-1 p-4 overflow-auto scrollable-content">
                    <div className="main-content-container p-4">
                        <div className="mb-4">
                            <GlobalFilterBar visibleFilters={['dept', 'scheme', 'year']} />
                        </div>
                        {/* Top Summary Cards */}
                        <div className="row mb-5 g-4 align-items-center">
                            <div className="col-md-3">
                                <div className="stat-card-box h-100 p-3">
                                    <div className="stat-card-label mb-1">Last DAC Report Upload</div>
                                    <div className="small text-secondary mb-1">AY: {academic.academic_year}</div>
                                    <div className="fw-bold fs-5 text-primary">
                                        {last_dac_upload_date}
                                    </div>
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
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="section-title mb-0">Assessment coverage status</h4>
                                <div className="d-flex align-items-center gap-2">
                                    <label className="fw-medium text-secondary mb-0">Class:</label>
                                    <select
                                        className="form-select form-select-sm shadow-sm"
                                        value={selectedClass}
                                        onChange={(e) => setSelectedClass(e.target.value)}
                                        style={{ width: '120px', borderRadius: '8px', border: '1px solid #dee2e6' }}
                                    >
                                        <option value="">All</option>
                                        <option value="FY">FY</option>
                                        <option value="SY">SY</option>
                                        <option value="TY">TY</option>
                                    </select>
                                </div>
                            </div>
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

                        {/* PO & PSO Attainment Section */}
                        <div className="po-attainment-section mb-4">
                            <h4 className="section-title">PO & PSO Attainment</h4>
                            <div className="po-chart-container p-4 rounded shadow-sm bg-white" style={{ minHeight: '350px' }}>
                                <Chart
                                    chartType="ColumnChart"
                                    width="100%"
                                    height="300px"
                                    data={po_pso_attainment}
                                    options={barOptions}
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Codash;
