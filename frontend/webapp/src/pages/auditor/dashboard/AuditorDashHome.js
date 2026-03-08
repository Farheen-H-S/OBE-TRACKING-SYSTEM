import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AuditorDashHome.css';
import api from '../../../utils/axios';
import Backtracking from '../../hod/backtracking/Backtracking';
import GlobalFilterBar from '../../../components/filters/GlobalFilterBar';
import { useFilters } from '../../../context/FilterContext';

function AuditorDashHome() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { selectedDept, selectedYear, selectedClass, selectedSemester, programs } = useFilters();

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

    const selectedProgramName = programs?.find(p => String(p.program_id) === String(selectedDept))?.program_name || 'Computer engineering(CO)';
    const stats = data?.top_stats || {};

    if (loading) {
        return <div className="p-4 text-center">Loading Data...</div>;
    }

    return (
        <div className="p-4" style={{ backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <div className="container-fluid auditor-dashboard-container">

                {/* Top Row: Audit Info */}
                <div className="row mb-4">
                    {/* Audit Duration */}
                    <div className="col-md-5 mb-3">
                        <div className="heading-title">Audit duration</div>
                        <div className="info-card d-flex flex-column justify-content-center">
                            <div className="mb-1"><strong>Start:</strong> <span className="badge bg-secondary">01/Aug/2025</span></div>
                            <div><strong>End:</strong> <span className="badge bg-secondary">03/Aug/2025</span></div>
                        </div>
                    </div>

                    {/* Available Reports */}
                    <div className="col-md-7 mb-3">
                        <div className="heading-title">Available reports</div>
                        <div className="info-card d-flex flex-row justify-content-between align-items-center">
                            <ul className="mb-0">
                                <li>• DAC {stats.verified_dac || 0}/{stats.total_dac || 12}</li>
                                <li>• CIS : Direct-8/8 | Indirect-4/5</li>
                            </ul>
                            <button className="btn btn-primary btn-sm" onClick={() => navigate('/auditor/view-reports')}>View reports →</button>
                        </div>
                    </div>
                </div>

                {/* Middle Row: Reports & Status */}
                <div className="row mb-4">

                    {/* Verification Status */}
                    <div className="col-md-2 mb-3">
                        <div className="heading-title">Verification status</div>
                        <div className="info-card d-flex flex-column justify-content-center align-items-center">
                            <div className="mb-1">Verifyed : <strong>{stats.verified_reports || 0}</strong></div>
                            <div>Pending : <strong>{stats.pending_reports || 0}</strong></div>
                        </div>
                    </div>

                    {/* Total Remarks Added */}
                    <div className="col-md-2 mb-3">
                        <div className="heading-title">Total remarks added</div>
                        <div className="info-card d-flex align-items-center justify-content-center">
                            <h2 className="fw-bold mb-0">12</h2>
                        </div>
                    </div>

                    {/* Latest Remark Status */}
                    <div className="col-md-6 mb-3">
                        <div className="heading-title">latest remark staus</div>
                        <div className="info-card d-flex flex-column justify-content-between">
                            <div className="d-flex justify-content-between mb-2">
                                <span>Date: <strong>02/Aug/2025</strong></span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <span>Time: <strong>12:56 pm</strong></span>
                                <button className="btn btn-primary btn-sm">View remark</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* View CO-PO Mapping Button */}
                <div className="row mb-4">
                    <div className="col-12 align-items-left">
                        <button className="co-po-mapping-btn" onClick={() => navigate('/co-po-pso-mapping')}>View CO-PO mapping &rarr;</button>
                    </div>
                </div>

                {/* Attainment Backtracking */}
                <div className="row">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-end mb-3">
                            <h5 className="attainment-section-title mb-0">Attainment Backtracking</h5>
                            <div style={{ maxWidth: '600px', transform: 'scale(0.9)', transformOrigin: 'right center' }}>
                                <GlobalFilterBar visibleFilters={['batch', 'class', 'semester']} />
                            </div>
                        </div>

                        <div className="mt-3">
                            <Backtracking />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default AuditorDashHome;
