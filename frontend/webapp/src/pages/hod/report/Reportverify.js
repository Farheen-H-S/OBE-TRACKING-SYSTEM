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
    const [auditorRemarks, setAuditorRemarks] = useState([]);
    const [showAuditorBoard, setShowAuditorBoard] = useState(false);
    const [loadingRemarks, setLoadingRemarks] = useState(false);
    const [saving, setSaving] = useState(false);

    // Sync with global filters from localStorage or use defaults
    const [selectedYear, setSelectedYear] = useState(localStorage.getItem('selectedAcademicYear') || '2025 - 26');
    const [selectedBatch, setSelectedBatch] = useState(localStorage.getItem('selectedBatch') || '2025 - 26');
    const [selectedClass, setSelectedClass] = useState(localStorage.getItem('selectedClassYear') || '');
    const [selectedSem, setSelectedSem] = useState(localStorage.getItem('selectedSemester') || '');

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
            setAuditorRemarks(res.data);
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
                display_status: r.status,
                submitted_by: r.created_by_name || 'System'
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
                }
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

        // Context filtering
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
                                                        className="btn btn-view btn-sm"
                                                        title="View Report"
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

            {/* Auditor Remarks Modal */}
            <Modal show={showAuditorBoard} onHide={() => setShowAuditorBoard(false)} size="xl" centered>
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title className="fs-5 fw-bold">
                        <i className="bi bi-journal-text me-2"></i>
                        Audit Remarks {(!isAuditor) && "(Read-Only)"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                    <div className="table-responsive" style={{ maxHeight: '70vh' }}>
                        <Table striped bordered hover className="mb-0 admin-remarks-table">
                            <thead className="sticky-top bg-light">
                                <tr>
                                    <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                                    <th>Report Name / Component</th>
                                    <th>Auditor Remark</th>
                                    {isAuditor && <th style={{ width: '100px' }}>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {loadingRemarks ? (
                                    <tr>
                                        <td colSpan={isAuditor ? 4 : 3} className="text-center py-5">
                                            <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                                            Loading remarks...
                                        </td>
                                    </tr>
                                ) : auditorRemarks.length > 0 ? (
                                    auditorRemarks.map((row, index) => (
                                        <tr key={row.auditor_board_id || index}>
                                            <td className="text-center text-muted">{index + 1}</td>
                                            <td className="fw-bold text-dark">{row.report_name}</td>
                                            <td className="text-muted">
                                                {isAuditor ? (
                                                    <textarea
                                                        className="form-control form-control-sm"
                                                        value={row.remark || ''}
                                                        onChange={(e) => {
                                                            const newRemarks = [...auditorRemarks];
                                                            newRemarks[index].remark = e.target.value;
                                                            setAuditorRemarks(newRemarks);
                                                        }}
                                                    />
                                                ) : (
                                                    row.remark || <span className="opacity-50 italic">No remark provided</span>
                                                )}
                                            </td>
                                            {isAuditor && (
                                                <td className="text-center">
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={async () => {
                                                            setSaving(true);
                                                            try {
                                                                await api.patch(`/reports/auditor-board/${row.auditor_board_id}/`, { remark: row.remark });
                                                                alert("Remark saved!");
                                                                fetchAuditorRemarks();
                                                            } catch (err) { alert("Failed to save"); }
                                                            finally { setSaving(false); }
                                                        }}
                                                        disabled={saving}
                                                    >
                                                        Save
                                                    </Button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isAuditor ? 4 : 3} className="text-center py-5 text-muted italic">
                                            No auditor remarks have been recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAuditorBoard(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Reportverifiy;
