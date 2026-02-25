import React, { useState, useEffect } from 'react';
import './Reportverifiy.css';
import { FaCheck, FaTimes, FaEye, FaSearch, FaFilter } from 'react-icons/fa';

const Reportverifiy = () => {
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
