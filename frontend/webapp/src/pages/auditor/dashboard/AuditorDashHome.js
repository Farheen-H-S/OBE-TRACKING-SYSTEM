import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuditorDashHome.css';
import api from '../../../utils/axios';

function AuditorDashHome() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await api.get('/users/auditor-dashboard/');
                setData(response.data);
                setError(null);
            } catch (err) {
                console.error('Failed to load auditor dashboard:', err);
                setError('Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-4" style={{ backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
                <div className="alert alert-warning mt-4">{error || 'No data available.'}</div>
            </div>
        );
    }

    const { top_stats = {}, activity_log = [] } = data;
    const reportPct = top_stats.report_verification_pct ?? 0;
    const dacPct = top_stats.dac_verification_pct ?? 0;

    return (
        <div className="p-4 auditor-dash" style={{ backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <div className="container-fluid">

                {/* Header */}
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <div>
                        <h4 className="mb-0 fw-bold text-dark">Auditor Dashboard</h4>
                        <span className="text-secondary small">Academic Year: <strong>{top_stats.academic_year}</strong></span>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-outline-primary btn-sm" onClick={() => navigate('/view-reports')}>
                            View Reports
                        </button>
                        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/activity-log')}>
                            Full Activity Log
                        </button>
                    </div>
                </div>

                {/* Top Stat Cards */}
                <div className="row g-3 mb-4">
                    {/* CIS Reports */}
                    <div className="col-6 col-md-3">
                        <div className="auditor-stat-card">
                            <div className="auditor-stat-label">CIS Reports</div>
                            <div className="auditor-stat-value text-primary">{top_stats.total_reports || 0}</div>
                            <div className="d-flex justify-content-between mt-2 small">
                                <span className="text-success">✓ Verified: {top_stats.verified_reports || 0}</span>
                                <span className="text-warning">● Pending: {top_stats.pending_reports || 0}</span>
                            </div>
                            <div className="progress mt-2" style={{ height: '5px' }}>
                                <div className="progress-bar bg-success" style={{ width: `${reportPct}%` }}></div>
                            </div>
                            <div className="text-secondary" style={{ fontSize: '0.7rem' }}>{reportPct}% verified</div>
                        </div>
                    </div>

                    {/* DAC Reports */}
                    <div className="col-6 col-md-3">
                        <div className="auditor-stat-card">
                            <div className="auditor-stat-label">DAC Reports</div>
                            <div className="auditor-stat-value text-info">{top_stats.total_dac || 0}</div>
                            <div className="d-flex justify-content-between mt-2 small">
                                <span className="text-success">✓ Verified: {top_stats.verified_dac || 0}</span>
                                <span className="text-warning">● Pending: {top_stats.pending_dac || 0}</span>
                            </div>
                            <div className="progress mt-2" style={{ height: '5px' }}>
                                <div className="progress-bar bg-info" style={{ width: `${dacPct}%` }}></div>
                            </div>
                            <div className="text-secondary" style={{ fontSize: '0.7rem' }}>{dacPct}% verified</div>
                        </div>
                    </div>

                    {/* Pending Approval */}
                    <div className="col-6 col-md-3">
                        <div className={`auditor-stat-card ${top_stats.approved_reports > 0 ? 'auditor-stat-card--highlight' : ''}`}>
                            <div className="auditor-stat-label">Approved (Awaiting Verification)</div>
                            <div className={`auditor-stat-value ${top_stats.approved_reports > 0 ? 'text-warning' : 'text-success'}`}>
                                {top_stats.approved_reports || 0}
                            </div>
                            <div className="small text-secondary mt-2">Reports approved by HOD / Coordinator awaiting your verification</div>
                        </div>
                    </div>

                    {/* Recent Activity Count */}
                    <div className="col-6 col-md-3">
                        <div className="auditor-stat-card">
                            <div className="auditor-stat-label">Recent Activity</div>
                            <div className="auditor-stat-value text-secondary">{activity_log.length}</div>
                            <div className="small text-secondary mt-2">Log entries (last 20 actions across all users)</div>
                        </div>
                    </div>
                </div>

                {/* Activity Log Table */}
                <div className="auditor-section-card">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <h5 className="fw-bold mb-0">User Activity Log</h5>
                        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/activity-log')}>
                            View All →
                        </button>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-sm table-hover auditor-table mb-0">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Action</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activity_log.length > 0 ? (
                                    activity_log.map((log) => (
                                        <tr key={log.log_id}>
                                            <td className="text-secondary">{log.log_id}</td>
                                            <td>{log.date}</td>
                                            <td className="text-secondary">{log.time}</td>
                                            <td className="fw-medium">{log.username}</td>
                                            <td><span className="badge bg-secondary fw-normal">{log.role}</span></td>
                                            <td>
                                                <span className={`badge ${log.action === 'APPROVE' ? 'bg-success' :
                                                        log.action === 'VERIFY' ? 'bg-primary' :
                                                            log.action === 'CREATE' ? 'bg-info text-dark' :
                                                                log.action === 'UPDATE' ? 'bg-warning text-dark' :
                                                                    'bg-secondary'
                                                    }`}>{log.action}</span>
                                            </td>
                                            <td className="text-secondary small">{log.description}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center text-muted py-4">
                                            No activity recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default AuditorDashHome;
