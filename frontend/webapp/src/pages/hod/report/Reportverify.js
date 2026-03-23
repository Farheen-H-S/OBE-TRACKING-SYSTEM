import React, { useState, useEffect } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import './Reportverify.css';
import api from '../../../utils/axios';
import { getLoggedInUser } from '../../../utils/auth';
import { useDebounce } from '../../../utils/useDebounce';

const columnLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

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
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [filterType, setFilterType] = useState('All');
    const [programs, setPrograms] = useState([]);
    const [schemes, setSchemes] = useState([]);
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedScheme, setSelectedScheme] = useState('');
    
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalReports, setTotalReports] = useState(0);

    const [auditorRemarks, setAuditorRemarks] = useState({ rows: Array(25).fill(0).map(() => Array(10).fill('')) });
    const [showAuditorBoard, setShowAuditorBoard] = useState(false);
    const [loadingRemarks, setLoadingRemarks] = useState(false);
    const [periods, setPeriods] = useState([]); // All periods (Active + Archive)
    const [selectedPeriod, setSelectedPeriod] = useState(null); // The period selected in the remark modal
    const [loading, setLoading] = useState(false);

    
    useEffect(() => {
        fetchInitialData();
        fetchPeriods();
    }, []);

    const fetchPeriods = async () => {
        try {
            const res = await api.get('/reports/audit-periods/');
            setPeriods(res.data);
            if (res.data.length > 0) {
                // Default selection is the active period if it exists
                const active = res.data.find(p => p.is_active);
                const defaultPeriod = active || res.data[0];
                setSelectedPeriod(defaultPeriod);
            }
        } catch (err) {
            console.error("Error fetching periods:", err);
        }
    };

    useEffect(() => {
        fetchPendingReports();
    }, [selectedProgram, selectedScheme, page]);

    const fetchInitialData = async () => {
        try {
            const [progRes, schemeRes] = await Promise.all([
                api.get('/academics/programs/'),
                api.get('/academics/schemes/')
            ]);
            setPrograms(progRes.data);
            setSchemes(schemeRes.data);
            
            // Default to user's department if available
            if (user?.program_id) setSelectedProgram(user.program_id);
            else if (user?.department_id) setSelectedProgram(user.department_id);
        } catch (err) {
            console.error("Error fetching initial data:", err);
        }
    };

    const fetchAuditorRemarks = async (periodId = null) => {
        setLoadingRemarks(true);
        try {
            // If periodId is provided, fetch historical board; otherwise fetch current
            const url = periodId ? `/reports/auditor-board/?period_id=${periodId}` : '/reports/auditor-board/';
            const res = await api.get(url);
            if (res.data.content) {
                setAuditorRemarks(JSON.parse(res.data.content));
            } else {
                setAuditorRemarks({ rows: Array(25).fill(0).map(() => Array(10).fill('')) });
            }
        } catch (err) {
            console.error("Error fetching auditor remarks:", err);
        } finally {
            setLoadingRemarks(false);
        }
    };

    const handlePeriodChange = (e) => {
        const periodId = e.target.value;
        const period = periods.find(p => p.id === parseInt(periodId));
        setSelectedPeriod(period);
        fetchAuditorRemarks(periodId);
    };

    useEffect(() => {
        if (showAuditorBoard && selectedPeriod) {
            fetchAuditorRemarks(selectedPeriod.id);
        }
    }, [showAuditorBoard]);

    const fetchPendingReports = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                program_id: selectedProgram,
                scheme_id: selectedScheme
            };

            const [regularRes, dacRes] = await Promise.all([
                api.get('/reports/verification/', { params }),
                api.get('/reports/dac-reports/', { params })
            ]);

            // Combine results from both paginated responses
            // Note: This is an approximation since we have two separate paginated endpoints.
            // Ideally, we'd have a unified endpoint, but for now, we merge the results.
            
            const regularData = regularRes.data.results || [];
            const dacData = dacRes.data.results || [];
            
            const regularReports = regularData.map(r => ({
                ...r,
                report_id: r.report_id,
                report_name: r.file_name || `${r.report_type} Report - ${r.course_id || r.batch_id || 'N/A'}`,
                report_file: r.report_file,
                display_status: r.status,
                submitted_by: r.created_by_name || 'System',
                file_exists: r.file_exists,
                source: 'System Generated'
            }));

            const dacReports = dacData.map(r => ({
                ...r,
                report_id: r.dac_report_id,
                report_type: 'DAC Report',
                report_name: r.file_name || `DAC Report - ${r.academic_year} (${r.semester})`,
                report_file: r.file,
                created_at: r.uploaded_at,
                display_status: r.status,
                submitted_by: r.uploaded_by_name || 'System',
                file_exists: r.file_exists,
                source: 'Manual Upload'
            }));

            setReports([...regularReports, ...dacReports]);
            
            // Calculate total pages based on the maximum of both
            const regPages = regularRes.data.total_pages || 1;
            const dacPages = dacRes.data.total_pages || 1;
            setTotalPages(Math.max(regPages, dacPages));
            setTotalReports((regularRes.data.count || 0) + (dacRes.data.count || 0));
            
        } catch (err) {
            console.error("Error fetching reports:", err);
        } finally {
            setLoading(false);
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
        const searchLow = debouncedSearchTerm.toLowerCase();

        const matchesSearch = typeMatchName.includes(searchLow) ||
            userMatchName.includes(searchLow) ||
            (r.course_id && r.course_id.toString().toLowerCase().includes(searchLow));

        const matchesType = filterType === 'All' || r.report_type === filterType || (r.report_type === 'Batch' && filterType === 'PO/PSO Attainment');

        return matchesSearch && matchesType;
    });

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    return (
        <div className="reportverifiy-wrapper">
            <div className="reportverifiy-main">
                <div className="reportverifiy-card">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="rv-title mb-0">Report Verification & Approval</h2>
                        <div className="d-flex gap-2">
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
                    </div>

                    <div className="filter-row-v2 mb-4 p-3 bg-light rounded border">
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label className="filter-label">DEPARTMENT</label>
                                <select
                                    className="form-select filter-select"
                                    value={selectedProgram}
                                    onChange={(e) => { setSelectedProgram(e.target.value); setPage(1); }}
                                >
                                    <option value="">All Departments</option>
                                    {programs.map(p => (
                                        <option key={p.program_id} value={p.program_id}>{p.program_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="filter-label">SCHEME</label>
                                <select
                                    className="form-select filter-select"
                                    value={selectedScheme}
                                    onChange={(e) => { setSelectedScheme(e.target.value); setPage(1); }}
                                >
                                    <option value="">All Schemes</option>
                                    {schemes.map(s => (
                                        <option key={s.scheme_id} value={s.scheme_id}>{s.scheme_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-3">
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
                            <div className="col-md-3">
                                <label className="filter-label">SEARCH</label>
                                <div className="search-box position-relative">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rv-table-container position-relative">
                        {loading && (
                            <div className="position-absolute top-50 start-50 translate-middle" style={{ zIndex: 10 }}>
                                <div className="spinner-border text-primary" role="status"></div>
                            </div>
                        )}
                        <table className={`rv-table ${loading ? 'opacity-50' : ''}`}>
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
                                                    Source: {report.source} | Scheme: {report.scheme_name || 'N/A'}
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
                                        <td colSpan="9" className="text-center py-4 text-muted">No reports found matching your criteria.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="d-flex justify-content-between align-items-center mt-3 px-3">
                        <div className="text-muted small">
                            Showing {filteredReports.length} of {totalReports} total reports
                        </div>
                        <div className="d-flex gap-2 align-items-center">
                            <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                disabled={page === 1 || loading}
                                onClick={() => handlePageChange(page - 1)}
                            >
                                Previous
                            </Button>
                            <span className="small fw-bold">Page {page} of {totalPages}</span>
                            <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                disabled={page === totalPages || loading}
                                onClick={() => handlePageChange(page + 1)}
                            >
                                Next
                            </Button>
                        </div>
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
                    <div className="p-3 bg-light border-bottom d-flex align-items-center justify-content-between">
                        <div className="text-muted small fw-bold">Select Audit Period</div>
                        <div className="d-flex align-items-center gap-2">
                            <span className="small text-muted">Period:</span>
                            <select 
                                className="form-select form-select-sm" 
                                style={{ width: 'auto', minWidth: '220px' }}
                                value={selectedPeriod?.id || ''}
                                onChange={handlePeriodChange}
                            >
                                {periods.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.label} {p.is_active ? '(Current)' : '(Archive)'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
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
