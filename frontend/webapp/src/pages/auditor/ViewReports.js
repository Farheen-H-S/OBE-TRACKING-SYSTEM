import React, { useState, useEffect } from 'react';
import './ViewReports.css';
import { FaFilter, FaSearch, FaSave, FaPlus, FaTrash, FaEye, FaFileDownload } from 'react-icons/fa';
import api from '../../utils/axios';

const ViewReports = () => {
    const [reports, setReports] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [filters, setFilters] = useState({
        program: '',
        batch: '',
        class: '',
        semester: '',
        type: 'All'
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReport, setSelectedReport] = useState(null);

    const [showRemarks, setShowRemarks] = useState(false);

    // Remarks State: { reportId: { rows: [['','','']] } }
    const [remarksData, setRemarksData] = useState({});

    // Column letters for Excel-like feel
    const columnLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];

    useEffect(() => {
        fetchPrograms();
        loadApprovedReports();
        loadRemarks();
    }, []);

    const fetchPrograms = async () => {
        try {
            const res = await api.get('/academics/programs/');
            setPrograms(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadApprovedReports = () => {
        const dacReports = JSON.parse(localStorage.getItem('dac_reports') || '[]');
        const verificationStates = JSON.parse(localStorage.getItem('report_verification_states') || '{}');

        // Combine dac reports and mock reports, filtered by status === 'Approved' or 'Verified'
        const mockReports = [
            { id: 102, name: "Direct CIS Report - CS101", type: "Direct Attainment", date: "20-02-2025", submittedBy: "Faculty John", status: "Approved", filters: { program: '1', batch: '2022-26', class: 'FY', semester: 'Sem 1' } },
            { id: 103, name: "Indirect Attainment - TY Comp", type: "Indirect Attainment", date: "15-02-2025", submittedBy: "Coordinator Sarah", status: "Verified", filters: { program: '1', batch: '2022-26', class: 'TY', semester: 'Sem 5' } },
        ];

        const formattedDac = dacReports.map(r => ({
            id: r.id,
            name: r.name,
            type: "DAC Report",
            date: r.date,
            submittedBy: r.submittedBy,
            status: verificationStates[r.id] || r.status || 'Pending',
            filters: r.filters,
            content: r.content
        }));

        const all = [...formattedDac, ...mockReports];
        const approved = all.filter(r => r.status === 'Approved' || r.status === 'Verified');
        setReports(approved);
    };

    const loadRemarks = () => {
        const stored = localStorage.getItem('audit_remarks');
        if (stored) setRemarksData(JSON.parse(stored));
    };

    const saveRemarks = () => {
        localStorage.setItem('audit_remarks', JSON.stringify(remarksData));
        alert("Board remarks saved successfully!");
    };

    const handleRowChange = (reportId, rowIndex, colIndex, value) => {
        const current = remarksData[reportId] || { rows: Array(10).fill(0).map(() => Array(5).fill('')) };
        const newRows = [...current.rows];
        newRows[rowIndex] = [...newRows[rowIndex]];
        newRows[rowIndex][colIndex] = value;
        setRemarksData({ ...remarksData, [reportId]: { ...current, rows: newRows } });
    };

    const addRow = (reportId) => {
        const current = remarksData[reportId] || { rows: Array(10).fill(0).map(() => Array(5).fill('')) };
        const newRows = [...current.rows, Array(current.rows[0].length).fill('')];
        setRemarksData({ ...remarksData, [reportId]: { ...current, rows: newRows } });
    };

    const addColumn = (reportId) => {
        const current = remarksData[reportId] || { rows: Array(10).fill(0).map(() => Array(5).fill('')) };
        const newRows = current.rows.map(row => [...row, '']);
        setRemarksData({ ...remarksData, [reportId]: { ...current, rows: newRows } });
    };

    const filteredReports = reports.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesProgram = !filters.program || r.filters.program === filters.program;
        const matchesType = filters.type === 'All' || r.type === filters.type;
        const matchesBatch = !filters.batch || r.filters.batch === filters.batch;
        const matchesClass = !filters.class || r.filters.class === filters.class;
        return matchesSearch && matchesProgram && matchesType && matchesBatch && matchesClass;
    });

    // Helper to get rows for current report
    const getCurrentRows = (reportId) => {
        if (remarksData[reportId]?.rows) return remarksData[reportId].rows;
        // Default 15x6 grid
        return Array(15).fill(0).map(() => Array(6).fill(''));
    };

    return (
        <div className={`view-reports-container ${showRemarks ? 'remarks-expanded' : ''}`}>
            <div className="view-reports-main-layout">
                <div className="view-reports-content-panel">
                    <div className="view-reports-header mb-4">
                        <h2 className="fw-bold text-primary">Approved Reports for Audit</h2>
                        <p className="text-muted">Only verified/approved reports are listed here for your review.</p>
                    </div>

                    <div className="row g-4 content-row">
                        {/* Reports List Section */}
                        <div className="col-lg-5">
                            <div className="reports-card shadow-sm bg-white p-4 rounded-lg border-0 h-100">
                                <div className="filters-panel mb-4">
                                    <div className="row g-2 mb-3">
                                        <div className="col-6">
                                            <label className="small fw-bold">Program</label>
                                            <select className="form-select form-select-sm" value={filters.program} onChange={(e) => setFilters({ ...filters, program: e.target.value })}>
                                                <option value="">All Programs</option>
                                                {programs.map(p => <option key={p.program_id} value={p.program_id.toString()}>{p.program_name}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-6">
                                            <label className="small fw-bold">Report Type</label>
                                            <select className="form-select form-select-sm" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                                                <option value="All">All Types</option>
                                                <option value="Direct Attainment">Direct Attainment</option>
                                                <option value="Indirect Attainment">Indirect Attainment</option>
                                                <option value="PO/PSO Attainment">PO/PSO Attainment</option>
                                                <option value="DAC Report">DAC Report</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="search-panel position-relative">
                                        <FaSearch className="position-absolute text-muted" style={{ left: '12px', top: '10px' }} />
                                        <input
                                            type="text"
                                            className="form-control form-control-sm ps-5"
                                            placeholder="Search report name..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="reports-list custom-scrollbar" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                    {filteredReports.length > 0 ? (
                                        filteredReports.map(report => (
                                            <div
                                                key={report.id}
                                                className={`report-item p-3 mb-2 rounded border-start border-4 ${selectedReport?.id === report.id ? 'active-report' : ''}`}
                                                onClick={() => setSelectedReport(report)}
                                            >
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <h6 className="mb-1 text-truncate" style={{ maxWidth: '200px' }}>{report.name}</h6>
                                                    <span className="badge bg-info-subtle text-info border border-info-subtle rounded-pill small" style={{ fontSize: '0.65rem' }}>{report.type}</span>
                                                </div>
                                                <div className="small text-muted d-flex justify-content-between">
                                                    <span>{report.date}</span>
                                                    <span>By: {report.submittedBy}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-5 text-muted">No approved reports found.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Report Preview card */}
                        <div className="col-lg-7">
                            {selectedReport ? (
                                <div className="audit-card shadow-sm bg-white p-4 rounded-lg border-0 h-100">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <div>
                                            <h4 className="fw-bold mb-0">{selectedReport.name}</h4>
                                            <span className="text-primary small fw-bold">{selectedReport.type}</span>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
                                                onClick={() => {
                                                    if (selectedReport.content) {
                                                        const win = window.open();
                                                        win.document.write(`<iframe src="${selectedReport.content}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                                    } else {
                                                        alert("Full preview functionality coming soon.");
                                                    }
                                                }}
                                            >
                                                <FaEye /> View Report
                                            </button>
                                            <button
                                                className={`btn btn-sm d-flex align-items-center gap-2 ${showRemarks ? 'btn-dark' : 'btn-success'}`}
                                                onClick={() => setShowRemarks(!showRemarks)}
                                            >
                                                <FaSave /> {showRemarks ? 'Hide Board' : 'Remarks Board'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="report-mini-preview border rounded d-flex align-items-center justify-content-center bg-light" style={{ height: '400px' }}>
                                        <div className="text-center text-muted">
                                            <FaEye className="fs-1 mb-3 opacity-25" />
                                            <p>Use "View Report" for full screen preview<br />or check the Excel Board on the right.</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-state shadow-sm bg-white p-5 rounded-lg border-0 d-flex flex-column align-items-center justify-content-center h-100 text-center">
                                    <div className="empty-icon-circle mb-4">
                                        <FaFileDownload className="text-primary fs-1" />
                                    </div>
                                    <h4 className="fw-bold">Select a report to audit</h4>
                                    <p className="text-muted">Choose any approved report from the left to start auditing.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side Excel Panel */}
                <div className={`excel-remarks-side-panel ${showRemarks ? 'show' : ''}`}>
                    <div className="excel-panel-header p-3 border-bottom d-flex justify-content-between align-items-center bg-white sticky-top">
                        <h5 className="fw-bold m-0"><span className="text-success">Excel</span> Audit Remarks</h5>
                        <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => addColumn(selectedReport?.id)} title="Add Column">+</button>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => addRow(selectedReport?.id)} title="Add Row">↵</button>
                            <button className="btn btn-success btn-sm" onClick={saveRemarks}>Save</button>
                        </div>
                    </div>

                    <div className="excel-grid-container custom-scrollbar">
                        {selectedReport ? (
                            <table className="excel-table">
                                <thead>
                                    <tr>
                                        <th className="excel-corner"></th>
                                        {getCurrentRows(selectedReport.id)[0].map((_, idx) => (
                                            <th key={idx} className="excel-col-header">{columnLabels[idx] || `C${idx + 1}`}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {getCurrentRows(selectedReport.id).map((row, rIdx) => (
                                        <tr key={rIdx}>
                                            <td className="excel-row-header">{rIdx + 1}</td>
                                            {row.map((cell, cIdx) => (
                                                <td key={cIdx} className="excel-cell">
                                                    <textarea
                                                        className="excel-textarea"
                                                        value={cell}
                                                        onChange={(e) => handleRowChange(selectedReport.id, rIdx, cIdx, e.target.value)}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-5 text-center text-muted">Select a report to edit remarks</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewReports;
