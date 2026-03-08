import React, { useState, useEffect } from 'react';
import { Chart } from "react-google-charts";
import { useFilters } from "../../../context/FilterContext";
import GlobalFilterBar from "../../../components/filters/GlobalFilterBar";
import 'bootstrap/dist/css/bootstrap.min.css';
import './HodDashboardContent.css';
import api from '../../../utils/axios';

function HodDashboardContent() {
    const { selectedDept, selectedScheme, selectedYear } = useFilters();
    const [selectedClass, setSelectedClass] = useState('All');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await api.get('/users/hod-dashboard/', {
                    params: {
                        dept_id: selectedDept,
                        scheme_id: selectedScheme,
                        academic_year: selectedYear,
                        class_name: selectedClass === 'All' ? '' : selectedClass
                    }
                });
                setData(response.data);
                setError(null);
            } catch (err) {
                console.error("Error fetching HOD dashboard data:", err);
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [selectedDept, selectedScheme, selectedYear, selectedClass]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return <div className="alert alert-warning m-4">{error || "No dashboard data available."}</div>;
    }

    const {
        academic = {},
        health = [],
        courses = [],
        attainment_bar_data = []
    } = data;

    // --- Chart Options ---
    const chartOptions = {
        pieHole: 0.5,
        legend: 'none',
        pieSliceText: 'none',
        colors: ['#66bb6a', '#bdbdbd'],
    };

    const targetOptions = {
        ...chartOptions,
        colors: ['#66bb6a', '#ef5350'],
    };

    const attainmentOptions = {
        title: "",
        legend: { position: "none" },
        vAxis: {
            title: "Attainment achieved in %",
            minValue: 0,
            maxValue: 100
        },
        hAxis: { title: "PO / PSO" },
    };

    return (
        <div className="hod-dashboard-wrapper">
            <div className="row h-100">
                <div className="col-12 mb-4">
                    <div className="hod-main-container">
                        <div className="mb-4">
                            <GlobalFilterBar visibleFilters={['dept', 'scheme', 'year']} disableYearFiltering={true} />
                        </div>
                        {/* 1. Top Actionable Alerts & Surveys Row */}
                        <div className="row mb-4 text-center d-flex align-items-stretch">

                            {/* Pending Reports Alert */}
                            <div className="col-md-3 mb-2">
                                <div className={`stat-card-box h-100 ${academic.pending_reports_approval > 0 ? 'border-warning bg-warning bg-opacity-10' : ''}`}>
                                    <div className="stat-card-label text-warning mb-1">Pending Reports</div>
                                    <div className="fw-bold fs-4 text-warning">{academic.pending_reports_approval || 0}</div>
                                    <div className="text-secondary small">Awaiting Approval</div>
                                </div>
                            </div>

                            {/* Stress Survey */}
                            <div className="col-md-3 mb-2">
                                <div className="stat-card-box h-100">
                                    <div className="stat-card-label mb-1">Stress Survey</div>
                                    <div className="small text-secondary mb-1">Month: {new Date().toLocaleString('default', { month: 'short' })}</div>
                                    <div className={`fw-bold small ${academic.stress_survey_conducted === 'Conducted' ? 'text-success' : 'text-danger'}`}>
                                        {academic.stress_survey_conducted}
                                    </div>
                                </div>
                            </div>

                            {/* Teacher Feedback Survey */}
                            <div className="col-md-3 mb-2">
                                <div className="stat-card-box h-100">
                                    <div className="stat-card-label mb-1">Teacher Feedback</div>
                                    <div className="small text-secondary mb-1">AY: {academic.academic_year}</div>
                                    <div className={`fw-bold small ${academic.teacher_survey_conducted === 'Conducted' ? 'text-success' : 'text-danger'}`}>
                                        {academic.teacher_survey_conducted}
                                    </div>
                                </div>
                            </div>

                            {/* Class Distribution (FY, SY, TY) */}
                            <div className="col-md-3 mb-2">
                                <div className="stat-card-box h-100 py-2">
                                    <div className="stat-card-label mb-1 border-bottom pb-1">Total Students: {academic.students_distribution?.total || 0}</div>
                                    <div className="d-flex justify-content-around mt-2">
                                        <div className="text-center">
                                            <div className="fw-bold fs-5 text-primary">{academic.students_distribution?.FY || 0}</div>
                                            <div className="small text-secondary">FY</div>
                                        </div>
                                        <div className="text-center border-start border-end px-3">
                                            <div className="fw-bold fs-5 text-primary">{academic.students_distribution?.SY || 0}</div>
                                            <div className="small text-secondary">SY</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="fw-bold fs-5 text-primary">{academic.students_distribution?.TY || 0}</div>
                                            <div className="small text-secondary">TY</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Course & Faculty Overview */}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="section-heading mb-0">Course & faculty overview</h5>
                            <div className="d-flex align-items-center">
                                <label className="me-2 small fw-bold text-secondary">Filter Class:</label>
                                <select
                                    className="form-select form-select-sm"
                                    style={{ width: '120px' }}
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                >
                                    <option value="All">All Classes</option>
                                    <option value="FY">FY</option>
                                    <option value="SY">SY</option>
                                    <option value="TY">TY</option>
                                </select>
                            </div>
                        </div>

                        <div className="row mb-5">
                            <div className="col-12">
                                <div className="course-scroll-container">
                                    {courses.length === 0 ? (
                                        <div className="w-100 text-center py-4 text-muted border rounded bg-light">No courses found for selected filters</div>
                                    ) : (
                                        courses.map((course) => (
                                            <div className="course-scroll-item" key={course.course_name}>
                                                <div className="course-card">
                                                    <div className="course-card-header">{course.course_name}</div>
                                                    <div className="course-card-body">
                                                        <ul>
                                                            <li>• Faculty assigned: <span className={course.faculty === "Not Assigned" ? "text-danger fw-bold" : ""}>{course.faculty}</span></li>
                                                            <li>• Attainment status: <strong>{course.attainment_status}</strong></li>
                                                            <li>• Class: <strong>{course.class_name}</strong></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 3. OBE Process Health */}
                        <h5 className="section-heading">OBE process health</h5>
                        <div className="row mb-5 justify-content-between">
                            {health.map((item, idx) => (
                                <div className="col mb-3 d-flex" key={item.title}>
                                    <div className="obe-chart-container flex-fill shadow-sm border border-light">
                                        <div className="chart-title text-center">{item.title}</div>
                                        <Chart
                                            chartType="PieChart"
                                            width="100%"
                                            height="120px"
                                            data={item.data}
                                            options={item.title.toLowerCase().includes('target') ? { ...targetOptions, chartArea: { width: '80%', height: '80%' } } : { ...chartOptions, chartArea: { width: '80%', height: '80%' } }}
                                        />
                                        <div className={`small mt-2 text-center text-secondary`}>
                                            <span className={item.percentage >= 50 ? 'text-success fw-bold' : 'text-danger fw-bold'}>{item.percentage}%</span>
                                        </div>
                                        <div className="small mt-1 text-center text-muted border-top pt-1 mt-2">
                                            {item.stats.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 4. Overall PO/PSO Attainment */}
                        <h5 className="section-heading">Overall PO & PSO attainment overview</h5>
                        <div className="row">
                            <div className="col-12">
                                <div className="border rounded p-2">
                                    <Chart
                                        chartType="ColumnChart"
                                        width="100%"
                                        height="300px"
                                        data={attainment_bar_data}
                                        options={attainmentOptions}
                                    />
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
