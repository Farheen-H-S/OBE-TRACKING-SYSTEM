import React, { useState, useEffect } from 'react';
import './Reportverifiy.css';
import { FaCheck, FaTimes, FaEye, FaSearch, FaFilter } from 'react-icons/fa';
import api from '../../utils/axios';
import { getLoggedInUser } from '../../utils/auth';

const Reportverifiy = () => {
    const user = getLoggedInUser();
    const isFaculty = user?.role?.toLowerCase() === 'faculty';
    const [reports, setReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');

    const [selectedYear, setSelectedYear] = useState('2025 - 26');
    const [selectedBatch, setSelectedBatch] = useState('2025 - 26');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSem, setSelectedSem] = useState('');

    const years = [];
    for (let i = 2019; i <= 2030; i++) {
        years.push(`${i} - ${(i + 1).toString().slice(-2)}`);
    }
    const classes = ['FY', 'SY', 'TY'];
    const semesters = ['1', '2', '3', '4', '5', '6'];

    useEffect(() => {
        fetchPendingReports();
    }, []);

    const fetchPendingReports = async () => {
        try {
            const res = await api.get('/reports/verification/');
            setReports(res.data);
        } catch (err) {
            console.error("Error fetching reports:", err);
        }
    };

    const handleAction = async (id, newStatus) => {
        try {
            if (newStatus === 'Approved') {
                await api.post(`/reports/${id}/approve/`);
                alert("Report approved successfully!");
            } else if (newStatus === 'Rejected') {
                const remark = window.prompt("Enter reason for rejection:");
                if (remark === null) return; // Cancelled
                await api.post(`/reports/${id}/reject/`, { remark });
                alert("Report rejected.");
            }
            fetchPendingReports();
        } catch (err) {
            console.error(`Error updating report status to ${newStatus}:`, err);
            alert(`Failed to update report status to ${newStatus}.`);
        }
    };

    const filteredReports = reports.filter(r => {
        const typeMatchName = r.report_type ? r.report_type.toLowerCase() : '';
        const userMatchName = r.user_id_created ? r.user_id_created.toLowerCase() : '';
        const searchLow = searchTerm.toLowerCase();

        const matchesSearch = typeMatchName.includes(searchLow) ||
            userMatchName.includes(searchLow) ||
            (r.course_id && r.course_id.toString().toLowerCase().includes(searchLow));

        const matchesType = filterType === 'All' || r.report_type === filterType || (r.report_type === 'Batch' && filterType === 'PO/PSO Attainment');

        // Match additional filters if report has them (DAC reports have them)
        const matchesYear = !selectedYear || !r.filters?.academicYear || r.filters.academicYear === selectedYear;
        const matchesBatch = !selectedBatch || !r.filters?.batch || r.filters.batch === selectedBatch;
        const matchesClass = !selectedClass || !r.filters?.class || r.filters.class === selectedClass;
        const matchesSem = !selectedSem || !r.filters?.semester || String(r.filters.semester) === String(selectedSem);

        return matchesSearch && matchesType && matchesYear && matchesBatch && matchesClass && matchesSem;
    });

    return (
        <div className="reportverifiy-wrapper">
            <div className="reportverifiy-main">
                <div className="reportverifiy-card">
                    <h2 className="rv-title">Report Verification & Approval</h2>

                    <div className="filter-row-v2 mb-4 p-3 bg-light rounded border">
                        <div className="row g-3">
                            <div className="col-md">
                                <label className="filter-label">TYPE</label>
                                <select
                                    className="form-select filter-select"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <option value="All">All Types</option>
                                    <option value="DAC Report">DAC Reports</option>
                                    <option value="Direct Attainment">Direct Attainment</option>
                                    <option value="Indirect Attainment">Indirect Attainment</option>
                                    <option value="PO/PSO Attainment">PO/PSO Attainment</option>
                                </select>
                            </div>
                            <div className="col-md">
                                <label className="filter-label">BATCH</label>
                                <select className="form-select filter-select" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                                    <option value="">All Batches</option>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div className="col-md">
                                <label className="filter-label">ACADEMIC YEAR</label>
                                <select className="form-select filter-select" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                                    <option value="">All Years</option>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div className="col-md" style={{ maxWidth: '100px' }}>
                                <label className="filter-label">CLASS</label>
                                <select className="form-select filter-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                                    <option value="">All</option>
                                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="col-md" style={{ maxWidth: '100px' }}>
                                <label className="filter-label">SEM</label>
                                <select className="form-select filter-select" value={selectedSem} onChange={e => setSelectedSem(e.target.value)}>
                                    <option value="">All</option>
                                    {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="mt-3">
                            <div className="search-box position-relative">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by name or faculty..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rv-table-container">
                        <table className="rv-table">
                            <thead>
                                <tr>
                                    <th>Report ID</th>
                                    <th>Report Name</th>
                                    <th>Type</th>
                                    <th>Submission Date</th>
                                    <th>Submitted By</th>
                                    <th className="text-center">View</th>
                                    <th className="text-center">Status</th>
                                    {!isFaculty && <th className="text-center">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReports.length > 0 ? (
                                    filteredReports.map((report) => (
                                        <tr key={report.report_id}>
                                            <td>{report.report_id}</td>
                                            <td className="text-start fw-bold">
                                                {report.report_type} Report - {report.course_id || report.batch_id}
                                            </td>
                                            <td className="small">{report.report_type}</td>
                                            <td className="small">{new Date(report.created_at).toLocaleDateString()}</td>
                                            <td>{report.user_id_created || 'System'}</td>
                                            <td>
                                                <div className="d-flex justify-content-center">
                                                    <a
                                                        href={report.report_file}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="btn btn-view btn-sm"
                                                        title="View Report"
                                                    >
                                                        View
                                                    </a>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className={`status-badge status-${report.status.toLowerCase()}`}>
                                                    {report.status}
                                                </span>
                                            </td>
                                            {!isFaculty && (
                                                <td>
                                                    <div className="d-flex gap-2 justify-content-center">
                                                        <button
                                                            className={`btn btn-success btn-sm btn-action ${(report.status === 'Approved' || report.status === 'Verified') ? 'disabled' : ''}`}
                                                            title="Approve"
                                                            onClick={() => handleAction(report.report_id, 'Approved')}
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            className={`btn btn-danger btn-sm btn-action ${report.status === 'Rejected' ? 'disabled' : ''}`}
                                                            title="Reject"
                                                            onClick={() => handleAction(report.report_id, 'Rejected')}
                                                        >
                                                            ✗
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">No reports found matching your criteria.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reportverifiy;
