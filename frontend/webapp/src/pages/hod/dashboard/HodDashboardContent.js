import React, { useState, useEffect } from 'react';
import { Chart } from "react-google-charts";
import { useFilters } from "../../../context/FilterContext";
import GlobalFilterBar from "../../../components/filters/GlobalFilterBar";
import 'bootstrap/dist/css/bootstrap.min.css';
import './HodDashboardContent.css';
import api from '../../../utils/axios';

function HodDashboardContent() {
    const { selectedDept, selectedScheme, selectedYear } = useFilters();
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
                        academic_year: selectedYear
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
    }, [selectedDept, selectedScheme, selectedYear]);

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
        hAxis: { title: "Course outcome" },
    };

    return (
        <div className="hod-dashboard-wrapper">
            <div className="row h-100">
                <div className="col-12 mb-4">
                    <div className="hod-main-container">
                        <div className="mb-4">
                            <GlobalFilterBar visibleFilters={['dept', 'scheme', 'year']} />
                        </div>
                        {/* 1. Top Stats Row */}
                        <div className="row mb-4 text-center">
                            <div className="col-md-2 mb-2">
                                <div className="stat-card-label">Academic year</div>
                                <div className="stat-card-box">
                                    <div className="fw-bold">{academic.academic_year}</div>
                                    <div className="text-secondary small">Status : Active</div>
                                </div>
                            </div>
                            <div className="col-md-2 mb-2">
                                <div className="stat-card-label">Department</div>
                                <div className="stat-card-box">
                                    <div className="fw-bold small">{academic.department}</div>
                                </div>
                            </div>
                            <div className="col-md-2 mb-2">
                                <div className="stat-card-label">Semester type</div>
                                <div className="stat-card-box">
                                    <div className="fw-bold small">{academic.semester_type}</div>
                                    <div className="text-secondary tiny">Effective from : {academic.effective_from}</div>
                                </div>
                            </div>
                            <div className="col-md-2 mb-2">
                                <div className="stat-card-label">Scheme</div>
                                <div className="stat-card-box">
                                    <div className="fw-bold">{academic.scheme}</div>
                                </div>
                            </div>
                            <div className="col-md-2 mb-2">
                                <div className="stat-card-label">Stress survey status</div>
                                <div className="stat-card-box">
                                    <div className="small">Month:{new Date().toLocaleString('default', { month: 'short' })}</div>
                                    <div className={`fw-bold tiny ${academic.stress_survey_conducted ? 'text-success' : 'text-danger'}`}>
                                        Status:{academic.stress_survey_conducted ? 'Conducted' : 'Not conducted'}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-2 mb-2">
                                <div className="stat-card-label">DAC report status</div>
                                <div className="stat-card-box">
                                    <div className="small">Month:{new Date().toLocaleString('default', { month: 'short' })}</div>
                                    <div className={`fw-bold tiny ${academic.dac_report_uploaded ? 'text-success' : 'text-danger'}`}>
                                        Status:{academic.dac_report_uploaded ? 'Uploaded' : 'Pending'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Course & Faculty Overview */}
                        <h5 className="section-heading">Course & faculty overview</h5>
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="course-scroll-container">
                                    <div className="course-scroll-item">
                                        <div className="right-panel-stat h-100 d-flex flex-column justify-content-center">
                                            <h6 className="section-heading text-secondary text-center mb-2">Total students</h6>
                                            <div className="total-students-count">{academic.total_students}</div>
                                        </div>
                                    </div>

                                    {courses.map((course, idx) => (
                                        <div className="course-scroll-item" key={course.course_name}>
                                            <div className="course-card">
                                                <div className="course-card-header">{course.course_name}</div>
                                                <div className="course-card-body">
                                                    <ul>
                                                        <li>• Faculty assigned: {course.faculty}</li>
                                                        <li>• Course completed: <strong>{course.completion}%</strong></li>
                                                        <li>• Attainment status: <strong>{course.attainment_status}</strong></li>
                                                        <li>• Class: <strong>{course.class_name}</strong></li>
                                                    </ul>
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
                            {health.map((item, idx) => (
                                <div className="col-md-3 mb-3" key={item.title}>
                                    <div className="obe-chart-container">
                                        <div className="chart-title">{item.title}</div>
                                        <Chart
                                            chartType="PieChart"
                                            width="100%"
                                            height="120px"
                                            data={item.data}
                                            options={item.title.toLowerCase().includes('target') ? targetOptions : chartOptions}
                                        />
                                        <div className={`small mt-1 ${item.percentage > 50 ? 'text-success' : 'text-warning'}`}>
                                            {item.stats.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 4. Overall CO Attainment */}
                        <h5 className="section-heading">Overall CO attainment overview</h5>
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
