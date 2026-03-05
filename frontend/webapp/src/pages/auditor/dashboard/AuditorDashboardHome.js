import React, { useState, useEffect } from 'react';
import { Chart } from "react-google-charts";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../admin/AdminDashboardHome.css';
import api from '../../utils/axios';
import { FaUsers, FaBuilding, FaCalendarAlt, FaLayerGroup, FaRegClock } from 'react-icons/fa';

function AuditorDashboardHome() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await api.get('/users/dashboard/');
                setDashboardData(response.data);
                setError(null);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError("Failed to load dashboard data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const options = {
        title: "",
        legend: { position: "none" },
        vAxis: {
            title: "Number of users added",
            minValue: 0,
            format: '0',
            viewWindow: { min: 0 }
        },
        hAxis: { title: "Month" },
        bar: { groupWidth: "50%" },
        colors: ['#4e73df'],
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            </div>
        );
    }

    const {
        metrics,
        global_role_distribution,
        department_overview,
        attention_required,
        monthly_trends
    } = dashboardData;

    return (
        <div className="d-flex flex-column p-4 dashboard-background" style={{ backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <div className="container-fluid bg-white rounded shadow-sm p-4 dashboard-container">

                {/* Section: Academic Info */}
                <div className="row mb-4 text-left g-3">
                    <div className="col-md-4">
                        <div className="metric-label">Academic Year</div>
                        <div className="metric-box shadow-hover">
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <FaCalendarAlt className="text-primary" />
                                <div className="fw-bold">{metrics.academic_year}</div>
                            </div>
                            <div className="text-success small">Status: Active</div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="metric-label">Scheme</div>
                        <div className="metric-box shadow-hover">
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <FaLayerGroup className="text-info" />
                                <div className="fw-bold">{metrics.scheme_name}</div>
                            </div>
                            <div className="text-muted small">Current Academic Scheme</div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="metric-label">Semester Type</div>
                        <div className="metric-box shadow-hover">
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <FaRegClock className="text-warning" />
                                <div className="fw-bold">{metrics.semester_type}</div>
                            </div>
                            <div className="text-muted small">Effective: {metrics.effective_from}</div>
                        </div>
                    </div>
                </div>

                {/* Section: User Metrics */}
                <div className="row mb-4 text-left g-3">
                    <div className="col-md-3">
                        <div className="metric-label">Total Users</div>
                        <div className="metric-box shadow-hover bg-primary-light">
                            <div className="d-flex align-items-center gap-2">
                                <FaUsers className="text-primary" />
                                <div className="fw-bold fs-4">{metrics.total_users}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="metric-label">Active Users</div>
                        <div className="metric-box shadow-hover">
                            <div className="d-flex align-items-center gap-2">
                                <FaUsers className="text-success" />
                                <div className="fw-bold fs-4">{metrics.active_users}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="metric-label">Inactive Users</div>
                        <div className="metric-box shadow-hover">
                            <div className="d-flex align-items-center gap-2">
                                <FaUsers className="text-danger" />
                                <div className="fw-bold fs-4">{metrics.inactive_users}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="metric-label">Total Departments</div>
                        <div className="metric-box shadow-hover">
                            <div className="d-flex align-items-center gap-2">
                                <FaBuilding className="text-info" />
                                <div className="fw-bold fs-4">{metrics.total_departments}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row g-4">
                    <div className="col-md-8">
                        {/* Section: Department-Level Overview */}
                        <div className="mb-4">
                            <h5 className="mb-3 d-flex align-items-center gap-2">
                                <FaBuilding size={20} /> Department-Level Overview
                            </h5>
                            <div className="department-overview-container border rounded p-3 bg-light-soft">
                                <div className="row g-3">
                                    {department_overview.map((dept, index) => (
                                        <div key={index} className="col-md-6">
                                            <div className="dept-card p-3 h-100 shadow-sm border-0 bg-white">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <h6 className="fw-bold m-0">{dept.dept_name}</h6>
                                                    <span className="badge bg-soft-primary text-primary">Total: {dept.total_users}</span>
                                                </div>
                                                <div className="row g-2">
                                                    {dept.roles.map((r, ri) => (
                                                        <div key={ri} className="col-6">
                                                            <div className="small text-muted mb-0">{r.role}</div>
                                                            <div className="fw-bold small">{r.total} <span className="text-success" style={{ fontSize: '0.7rem' }}>({r.active} active)</span></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section: Trends Chart */}
                        <div className="row">
                            <div className="col-12">
                                <h5 className="mb-3">Users Added per month (Trends)</h5>
                                <div className="chart-container border rounded p-3" style={{ minHeight: '350px' }}>
                                    {monthly_trends && monthly_trends.length > 1 ? (
                                        <Chart
                                            chartType="ColumnChart"
                                            width="100%"
                                            height="350px"
                                            data={monthly_trends}
                                            options={options}
                                            loader={<div>Loading Chart...</div>}
                                        />
                                    ) : (
                                        <div className="text-center py-5 text-muted">No trend data available</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        {/* Section: Global Role Distribution */}
                        <h5 className="mb-3 d-flex align-items-center gap-2">
                            <FaUsers size={20} /> Global Role Distribution
                        </h5>
                        <div className="grey-card p-3">
                            <ul className="list-unstyled mb-0">
                                {global_role_distribution.map((role, index) => (
                                    <li key={index} className="mb-3 role-item-expanded p-2 rounded">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="fw-bold text-dark">{role.role}</span>
                                            <span className="badge bg-primary rounded-pill">{role.total} Users</span>
                                        </div>
                                        <div className="progress" style={{ height: '6px' }}>
                                            <div
                                                className="progress-bar bg-success"
                                                role="progressbar"
                                                style={{ width: `${(role.active / role.total) * 100}%` }}
                                            ></div>
                                            <div
                                                className="progress-bar bg-danger"
                                                role="progressbar"
                                                style={{ width: `${((role.total - role.active) / role.total) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="d-flex justify-content-between mt-1" style={{ fontSize: '0.7rem' }}>
                                            <span className="text-success font-weight-bold">{role.active} Active</span>
                                            <span className="text-muted">{role.total - role.active} Inactive</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuditorDashboardHome;
