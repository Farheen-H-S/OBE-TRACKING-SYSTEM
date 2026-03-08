import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AuditorDashHome.css';
import api from '../../../utils/axios';
import Backtracking from '../../hod/backtracking/Backtracking';

function AuditorDashHome() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/users/auditor-dashboard/');
                if (response.data?.top_stats) {
                    setData(response.data);
                }
            } catch (error) {
                console.error("Error fetching auditor dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const stats = data?.top_stats || {};
    const activityLog = data?.activity_log || [];
    const latestActivity = activityLog[0] || null;

    if (loading) {
        return <div className="p-4 text-center">Loading Data...</div>;
    }

    return (
        <div className="p-3" style={{ backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <div className="container-fluid auditor-dashboard-container">

                {/* Row 1: Audit Info — full width split across 3 cols */}
                <div className="row mb-3">
                    {/* Verification Status */}
                    <div className="col-md-3 mb-3">
                        <div className="heading-title">Verification status</div>
                        <div className="info-card d-flex flex-column justify-content-center">
                            <div className="mb-1">Verified : <strong>{stats.verified_reports || 0}</strong></div>
                            <div>Pending : <strong>{stats.pending_reports || 0}</strong></div>
                        </div>
                    </div>

                    {/* DAC Reports */}
                    <div className="col-md-3 mb-3">
                        <div className="heading-title">DAC reports</div>
                        <div className="info-card d-flex flex-column justify-content-center">
                            <div className="mb-1">Verified : <strong>{stats.verified_dac || 0}</strong></div>
                            <div>Total : <strong>{stats.total_dac || 0}</strong></div>
                        </div>
                    </div>

                    {/* Available Reports */}
                    <div className="col-md-3 mb-3">
                        <div className="heading-title">Available reports</div>
                        <div className="info-card">
                            <ul className="mb-2">
                                <li>• DAC {stats.verified_dac || 0}/{stats.total_dac || 0}</li>
                                <li>• CIS : <br /> &nbsp;&nbsp; Direct-8/8 <br /> &nbsp;&nbsp; Indirect-4/5</li>
                            </ul>
                            <button className="btn btn-primary btn-sm mt-1" onClick={() => navigate('/auditor/view-reports')}>View reports →</button>
                        </div>
                    </div>

                    {/* Latest Activity */}
                    <div className="col-md-3 mb-3">
                        <div className="heading-title">Latest activity</div>
                        <div className="info-card d-flex flex-column justify-content-between">
                            {latestActivity ? (
                                <>
                                    <div className="mb-1">Date: <strong>{latestActivity.date}</strong></div>
                                    <div className="mb-1">Time: <strong>{latestActivity.time}</strong></div>
                                    <div className="text-muted small text-truncate">{latestActivity.action}</div>
                                </>
                            ) : (
                                <div className="text-muted small">No recent activity.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Row 2: Action Buttons */}
                <div className="row mb-3">
                    <div className="col-6">
                        <button className="dash-action-btn w-100" onClick={() => navigate('/co-po-pso-mapping')}>View CO-PO-PSO Mapping →</button>
                    </div>
                    <div className="col-6">
                        <button className="dash-action-btn w-100" onClick={() => navigate('/auditor/view-my-remarks')}>View My Remarks →</button>
                    </div>
                </div>

                {/* Row 3: Attainment Backtracking (full width) */}
                <div className="row">
                    <div className="col-12">
                        <Backtracking isDashboard={true} />
                    </div>
                </div>

            </div>
        </div>
    );
}

export default AuditorDashHome;
