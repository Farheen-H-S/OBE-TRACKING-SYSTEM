import React, { useState, useEffect } from 'react';
import { Chart } from "react-google-charts";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../admin/AdminDashboardHome.css';
import api from '../../utils/axios';

function HodDashboardHome() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // Use a generic or specialized endpoint if available, 
                // for now fallback to the admin one if specific HOD one doesn't exist
                const response = await api.get('/users/dashboard/');
                setDashboardData(response.data);
                setError(null);
            } catch (err) {
                console.error("Error fetching HOD dashboard data:", err);
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
        return <div className="alert alert-warning m-4">Welcome to your HOD Dashboard. (Basic data fetch failed or pending setup)</div>;
    }
}

export default HodDashboardHome;
