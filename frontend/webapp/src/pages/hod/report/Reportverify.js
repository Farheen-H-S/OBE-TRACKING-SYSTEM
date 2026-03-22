import React, { useState, useEffect } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import './Reportverify.css';
import api from '../../../utils/axios';
import { getLoggedInUser } from '../../../utils/auth';

const Reportverifiy = () => {
    const user = getLoggedInUser();
    const role = (user?.role_name || user?.role || '').toLowerCase();
    const isFaculty = role === 'faculty';
    const isHod = role === 'hod';
    const isCoordinator = role === 'coordinator';
    const isAdmin = role === 'admin';
    const isAuditor = role === 'auditor';

    const [reports, setReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [auditorRemarks, setAuditorRemarks] = useState({ rows: Array(25).fill(0).map(() => Array(10).fill('')) });
    const [showAuditorBoard, setShowAuditorBoard] = useState(false);
    const [loadingRemarks, setLoadingRemarks] = useState(false);
    const [saving, setSaving] = useState(false);

    const columnLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

    // Sync with global filters from localStorage or use defaults
    const [selectedYear, setSelectedYear] = useState(localStorage.getItem('selectedAcademicYear') || '2025 - 26');
    const [selectedBatch, setSelectedBatch] = useState(localStorage.getItem('selectedBatch') || '2025 - 26');
    const [selectedClass, setSelectedClass] = useState(localStorage.getItem('selectedClassYear') || '');
    const [selectedSem, setSelectedSem] = useState(localStorage.getItem('selectedSemester') || '');
    const [applyContextFilters, setApplyContextFilters] = useState(false); // Default to false to show all reports

    const years = [];
    for (let i = 2019; i <= 2030; i++) {
        years.push(`${i} - ${(i + 1).toString().slice(-2)}`);
    }
    const classes = ['FY', 'SY', 'TY'];
    const semesters = ['1', '2', '3', '4', '5', '6'];

    useEffect(() => {
        fetchPendingReports();
        // Listener for storage changes if filters are updated in header
        const handleStorageChange = () => {
            setSelectedYear(localStorage.getItem('selectedAcademicYear') || '2025 - 26');
            setSelectedBatch(localStorage.getItem('selectedBatch') || '2025 - 26');
            setSelectedClass(localStorage.getItem('selectedClassYear') || '');
            setSelectedSem(localStorage.getItem('selectedSemester') || '');
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const fetchAuditorRemarks = async () => {
        setLoadingRemarks(true);
        try {
            const res = await api.get('/reports/auditor-board/');
            if (res.data.content) {
                setAuditorRemarks(JSON.parse(res.data.content));
            } else if (Array.isArray(res.data)) {
                // Handle legacy list format if any
                const rows = res.data.map(r => [r.report_name || '', r.remark || '']);
                setAuditorRemarks({ rows });
            }
        } catch (err) {
            console.error("Error fetching auditor remarks:", err);
        } finally {
            setLoadingRemarks(false);
        }
    };

    useEffect(() => {
        if (showAuditorBoard) {
            fetchAuditorRemarks();
        }
    }, [showAuditorBoard]);

    const fetchPendingReports = async () => {
        try {
            const [regularRes, dacRes] = await Promise.all([
                api.get('/reports/verification/'),
                api.get('/reports/dac-reports/')
            ]);

            const regularReports = regularRes.data.map(r => ({
                ...r,
                report_id: r.report_id,
                report_name: r.file_name || `${r.report_type} Report - ${r.course_id || r.batch_id || 'N/A'}`,
                report_file: r.report_file,
                display_status: r.status,
                submitted_by: r.created_by_name || 'System',
                filters: {
                    academicYear: r.year,
                    batch: r.batch_id ? (r.batch_year ? `${r.batch_year} - ${(parseInt(r.batch_year)+3).toString().slice(-2)}` : null) : null,
                    // Note: regular reports don't always have class/sem in the model
                },
                file_exists: r.file_exists,
                source: 'System Generated'
            }));

            const dacReports = dacRes.data.map(r => ({
                ...r,
                report_id: r.dac_report_id,
                report_type: 'DAC Report',
                report_name: r.file_name || `DAC Report - ${r.academic_year} (${r.semester})`,
                report_file: r.file,
                created_at: r.created_at,
                display_status: r.status,
                submitted_by: r.uploaded_by_name || 'System',
                // Map filters for consistent filtering logic
                filters: {
                    academicYear: r.academic_year,
                    batch: r.batch,
                    class: r.class_year,
                    semester: r.semester
                },
                file_exists: r.file_exists,
                source: 'Manual Upload'
            }));

            setReports([...regularReports, ...dacReports]);
        } catch (err) {
            console.error("Error fetching reports:", err);
        }
    };

    const handleAction = async (report, newStatus) => {
        const id = report.report_id;
        const isDac = report.report_type === 'DAC Report';
        try {
            if (newStatus === 'Approved') {
                const endpoint = isDac ? `/reports/dac-reports/${id}/approve/` : `/reports/${id}/approve/`;
                await api.post(endpoint);
                alert("Report approved successfully!");
            } else if (newStatus === 'Rejected') {
                const remark = window.prompt("Enter reason for rejection:");
                if (remark === null) return;
                const endpoint = isDac ? `/reports/dac-reports/${id}/reject/` : `/reports/${id}/reject/`;
                await api.post(endpoint, { remark });
                alert("Report rejected.");
            }
            fetchPendingReports();
        } catch (err) {
            console.error(`Error updating report status:`, err);
            alert(`Failed to update report status.`);
        }
    };

    const filteredReports = reports.filter(r => {
        const typeMatchName = r.report_type ? String(r.report_type).toLowerCase() : '';
        const userMatchName = r.submitted_by ? String(r.submitted_by).toLowerCase() : '';
        const searchLow = searchTerm.toLowerCase();

        const matchesSearch = typeMatchName.includes(searchLow) ||
            userMatchName.includes(searchLow) ||
            (r.course_id && r.course_id.toString().toLowerCase().includes(searchLow));

        const matchesType = filterType === 'All' || r.report_type === filterType || (r.report_type === 'Batch' && filterType === 'PO/PSO Attainment');

        // Context filtering with normalization
        const normalize = (val) => String(val || '').replace(/\s+/g, '').toLowerCase();

        const matchesYear = !applyContextFilters || !selectedYear || selectedYear === 'All' || !r.filters?.academicYear || 
            normalize(r.filters.academicYear) === normalize(selectedYear);
            
        const matchesBatch = !applyContextFilters || !selectedBatch || selectedBatch === 'All' || !r.filters?.batch || 
            normalize(r.filters.batch) === normalize(selectedBatch);
            
        const matchesClass = !applyContextFilters || !selectedClass || selectedClass === 'All' || !r.filters?.class || 
            normalize(r.filters.class) === normalize(selectedClass);
            
        const matchesSem = !applyContextFilters || !selectedSem || selectedSem === 'All' || !r.filters?.semester || 
            String(r.filters.semester) === String(selectedSem);

        return matchesSearch && matchesType && matchesYear && matchesBatch && matchesClass && matchesSem;
    });

    return (
        <div className="reportverifiy-wrapper">
            <div className="reportverifiy-main">
                <div className="reportverifiy-card">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="rv-title mb-0">Report Verification & Approval</h2>
                        {!isAdmin && (isHod || isCoordinator || isFaculty || isAuditor) && (
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => setShowAuditorBoard(true)}
                                className="fw-bold px-3"
                            >
                                <i className="bi bi-journal-text me-2"></i>
                                View Remarks
                            </Button>
                        )}
                    </div>

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
                                    <option value="Direct">Direct Attainment</option>
                                    <option value="Indirect">Indirect Attainment</option>
                                    <option value="Batch">PO/PSO Attainment</option>
                                </select>
                            </div>
                            <div className="col-md">
                                <div className="search-box position-relative" style={{ marginTop: '24px' }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-auto d-flex align-items-end">
                                <div className="form-check form-switch mb-2">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        id="contextFilterToggle" 
                                        checked={applyContextFilters}
                                        onChange={(e) => setApplyContextFilters(e.target.checked)}
                                    />
                                    <label className="form-check-label small fw-bold text-muted" htmlFor="contextFilterToggle">
                                        Filter by Global Context
                                    </label>
                                </div>
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
                                    <th className="text-center">Remarks</th>
                                    <th className="text-center">Status</th>
                                    {!isFaculty && <th className="text-center">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReports.length > 0 ? (
                                    filteredReports.map((report) => (
                                        <tr key={`${report.report_type}-${report.report_id}`}>
                                            <td>{report.report_id}</td>
                                            <td className="text-start fw-bold report-name-cell" title={report.report_name}>
                                                {report.report_name}
                                                {!report.file_exists && (
                                                    <span className="ms-2 badge bg-warning text-dark px-2" style={{ fontSize: '10px' }}>Missing</span>
                                                )}
                                                <div className="text-muted" style={{ fontSize: '10px', fontWeight: 'normal' }}>
                                                    Source: {report.source}
                                                </div>
                                            </td>
                                            <td className="small">{report.report_type}</td>
                                            <td className="small">{new Date(report.created_at).toLocaleString()}</td>
                                            <td>{report.submitted_by}</td>
                                            <td>
                                                <div className="d-flex justify-content-center">
                                                    <a
                                                        href={report.report_file}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className={`btn btn-view btn-sm ${!report.file_exists ? 'disabled' : ''}`}
                                                        title={report.file_exists ? "View Report" : "File missing on server"}
                                                        onClick={(e) => { if (!report.file_exists) e.preventDefault(); }}
                                                    >
                                                        View
                                                    </a>
                                                </div>
                                            </td>
                                            <td className="text-center small text-muted">
                                                {report.auditor_remark || '-'}
                                            </td>
                                            <td className="text-center">
                                                <span className={`status-badge status-${(report.display_status || '').toLowerCase()}`}>
                                                    {report.display_status}
                                                </span>
                                            </td>
                                            {!isFaculty && (
                                                <td>
                                                    <div className="d-flex gap-2 justify-content-center">
                                                        <button
                                                            className={`btn btn-success btn-sm btn-action ${(report.display_status === 'Approved' || report.display_status === 'Verified') ? 'disabled' : ''}`}
                                                            title="Approve"
                                                            onClick={() => handleAction(report, 'Approved')}
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            className={`btn btn-danger btn-sm btn-action ${report.display_status === 'Rejected' ? 'disabled' : ''}`}
                                                            title="Reject"
                                                            onClick={() => handleAction(report, 'Rejected')}
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

            <Modal show={showAuditorBoard} onHide={() => setShowAuditorBoard(false)} size="xl" centered animation={false}>
                <Modal.Header closeButton style={{ backgroundColor: '#0d6efd', color: 'white', border: 'none' }}>
                    <Modal.Title className="fs-5 fw-bold">
                        Audit Remarks (Read-Only)
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                    <div className="excel-grid-container custom-scrollbar" style={{ height: '70vh' }}>
                        <table className="excel-table">
                            <thead>
                                <tr>
                                    <th className="excel-corner" style={{ width: '40px' }}></th>
                                    {auditorRemarks.rows && auditorRemarks.rows[0] && auditorRemarks.rows[0].map((_, idx) => (
                                        <th key={idx} className="excel-col-header">{columnLabels[idx] || `C${idx + 1}`}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loadingRemarks ? (
                                    <tr>
                                        <td colSpan="20" className="text-center py-5 bg-white">
                                            <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                                            Loading remarks...
                                        </td>
                                    </tr>
                                ) : auditorRemarks.rows && auditorRemarks.rows.length > 0 ? (
                                    auditorRemarks.rows.map((row, rIdx) => (
                                        <tr key={rIdx}>
                                            <td className="excel-row-header">{rIdx + 1}</td>
                                            {row.map((cell, cIdx) => (
                                                <td key={cIdx} className="excel-cell">
                                                    <textarea
                                                        className="excel-textarea"
                                                        value={cell}
                                                        readOnly // Always read-only for HOD/Coordinator
                                                        style={{ cursor: 'default' }}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="20" className="text-center py-5 bg-white text-muted italic">
                                            No auditor remarks have been recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="secondary" onClick={() => setShowAuditorBoard(false)} className="px-4">Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Reportverifiy;
