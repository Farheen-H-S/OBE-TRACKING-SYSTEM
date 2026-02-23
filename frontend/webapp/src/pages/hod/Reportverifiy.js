import React, { useState, useEffect } from 'react';
import './Reportverifiy.css';
import { FaCheck, FaTimes, FaEye, FaSearch, FaFilter } from 'react-icons/fa';

const Reportverifiy = () => {
    const [reports, setReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = () => {
        // 1. Load DAC reports from localStorage
        const dacReports = JSON.parse(localStorage.getItem('dac_reports') || '[]');

        // 2. Synthesize one sample report row
        const otherReports = [
            { id: 101, name: "Direct CIS Report - CS101", type: "Direct Attainment", date: "24-02-2025", submittedBy: "Faculty John", status: "Pending" }
        ];

        // Format DAC reports to match the table structure
        const formattedDac = dacReports.map(r => ({
            id: r.id,
            name: r.name,
            type: "DAC Report",
            date: r.date,
            submittedBy: r.submittedBy,
            status: r.status || 'Pending',
            isDac: true,
            content: r.content
        }));

        // Combine and load (prioritizing DAC reports from Task 1)
        const combined = [...formattedDac, ...otherReports];

        // Check if we already have verification states in localStorage
        const verificationStates = JSON.parse(localStorage.getItem('report_verification_states') || '{}');
        const finalReports = combined.map(r => ({
            ...r,
            status: verificationStates[r.id] || r.status
        }));

        setReports(finalReports);
    };

    const handleAction = (id, newStatus) => {
        const verificationStates = JSON.parse(localStorage.getItem('report_verification_states') || '{}');
        verificationStates[id] = newStatus;
        localStorage.setItem('report_verification_states', JSON.stringify(verificationStates));

        // Also update dac_reports if it's a DAC report
        const dacReports = JSON.parse(localStorage.getItem('dac_reports') || '[]');
        const updatedDac = dacReports.map(r => r.id === id ? { ...r, status: newStatus } : r);
        localStorage.setItem('dac_reports', JSON.stringify(updatedDac));

        setReports(reports.map(r => r.id === id ? { ...r, status: newStatus } : r));
    };

    const filteredReports = reports.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.submittedBy.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'All' || r.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="reportverifiy-wrapper">
            <div className="reportverifiy-main">
                <div className="reportverifiy-card">
                    <h2 className="rv-title">Report Verification & Approval</h2>

                    <div className="rv-controls mb-4 w-100 d-flex justify-content-between gap-3">
                        <div className="search-box flex-grow-1 position-relative">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="filter-box d-flex align-items-center gap-2">
                            <select
                                className="form-select"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                style={{ width: '200px' }}
                            >
                                <option value="All">All Types</option>
                                <option value="DAC Report">DAC Reports</option>
                                <option value="Direct Attainment">Direct Attainment</option>
                                <option value="Indirect Attainment">Indirect Attainment</option>
                                <option value="PO/PSO Attainment">PO/PSO Attainment</option>
                            </select>
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
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReports.length > 0 ? (
                                    filteredReports.map((report) => (
                                        <tr key={report.id}>
                                            <td>{report.id}</td>
                                            <td className="text-start fw-bold">{report.name}</td>
                                            <td className="small">{report.type}</td>
                                            <td className="small">{report.date}</td>
                                            <td>{report.submittedBy}</td>
                                            <td>
                                                <div className="d-flex justify-content-center">
                                                    <button
                                                        className="btn btn-view btn-sm"
                                                        title="View Report"
                                                        onClick={() => {
                                                            if (report.isDac && report.content) {
                                                                const win = window.open();
                                                                win.document.write(`<iframe src="${report.content}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                                            } else {
                                                                alert("Preview for this report type is under development. Please check generated files.");
                                                            }
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className={`status-badge status-${report.status.toLowerCase()}`}>
                                                    {report.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2 justify-content-center">
                                                    <button
                                                        className={`btn btn-success btn-sm btn-action ${(report.status === 'Approved' || report.status === 'Verified') ? 'disabled' : ''}`}
                                                        title="Approve"
                                                        onClick={() => handleAction(report.id, 'Approved')}
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        className={`btn btn-danger btn-sm btn-action ${report.status === 'Rejected' ? 'disabled' : ''}`}
                                                        title="Reject"
                                                        onClick={() => handleAction(report.id, 'Rejected')}
                                                    >
                                                        ✗
                                                    </button>
                                                </div>
                                            </td>
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
