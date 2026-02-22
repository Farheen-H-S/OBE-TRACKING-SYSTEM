import React, { useState, useEffect } from 'react';
import { Chart } from "react-google-charts";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../admin/AdminDashboardHome.css';
import api from '../../utils/axios';
import { FaGraduationCap, FaChalkboardTeacher, FaClipboardList, FaRegClock, FaChartBar } from 'react-icons/fa';

function FacultyDashboardHome() {
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
                console.error("Error fetching Faculty dashboard data:", err);
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error || !dashboardData) {
        return <div className="alert alert-warning m-4">Welcome to your Faculty Dashboard. (Basic data fetch failed or pending setup)</div>;
    }

    const { metrics } = dashboardData;

    return (
        <div className="d-flex flex-column p-4 dashboard-background" style={{ backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <div className="container-fluid bg-white rounded shadow-sm p-4 dashboard-container">
                <h2 className="mb-4 fw-bold" style={{ color: '#1f2f5c' }}>Faculty Dashboard</h2>

                <div className="row mb-4 g-3">
                    <div className="col-md-4">
                        <div className="metric-box shadow-hover">
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <FaGraduationCap className="text-primary" />
                                <div className="fw-bold">Academic Year: {metrics.academic_year}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="metric-box shadow-hover">
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <FaChartBar className="text-info" />
                                <div className="fw-bold">Scheme: {metrics.scheme_name}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="metric-box shadow-hover">
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <FaRegClock className="text-warning" />
                                <div className="fw-bold">{metrics.semester_type} Semester</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row g-4 mt-2">
                    <div className="col-md-6">
                        <div className="card border-0 shadow-sm p-4 text-center h-100">
                            <FaChalkboardTeacher size={50} className="text-primary mb-3 mx-auto" />
                            <h5>My Profile</h5>
                            <p className="display-6 fw-bold">Active: Faculty</p>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card border-0 shadow-sm p-4 text-center h-100">
                            <FaClipboardList size={50} className="text-success mb-3 mx-auto" />
                            <h5>Pending Surveys</h5>
                            <p className="display-6 fw-bold">Active Cycles</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FacultyDashboardHome;
