import React, { useState, useEffect } from 'react';
import './ViewReports.css';
import { FaFilter, FaSearch, FaSave, FaPlus, FaTrash, FaEye, FaFileDownload, FaTimes, FaArrowLeft, FaChevronRight } from 'react-icons/fa';
import api from '../../../utils/axios';
import { getLoggedInUser } from '../../../utils/auth';
import { Badge, Modal, Table, Button } from 'react-bootstrap';
import { useDebounce } from '../../../utils/useDebounce';

const ViewReports = () => {
    const user = getLoggedInUser();
    const role = (user?.role_name || user?.role || '').toLowerCase();
    const isFaculty = role === 'faculty';
    const isHod = role === 'hod';
    const isCoordinator = role === 'coordinator';
    const isAdmin = role === 'admin';
    const isAuditor = role === 'auditor';
    const isUserDisabled = user?.is_active === false;

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
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [selectedReport, setSelectedReport] = useState(null);

    // Remarks State: { rows: [['','','']] } -> Single Unified Board
    const [remarksData, setRemarksData] = useState({ rows: Array(25).fill(0).map(() => Array(10).fill('')) });
    const [showRemarksModal, setShowRemarksModal] = useState(false);
    const [loadingRemarks, setLoadingRemarks] = useState(false);
    const [periods, setPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState(null);

    // Column letters for Excel-like feel
    const columnLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

    const gridRefs = React.useRef({});

    useEffect(() => {
        fetchPrograms();
        loadApprovedReports();
        fetchPeriods();
    }, []);

    const fetchPeriods = async () => {
        try {
            const res = await api.get('/reports/audit-periods/');
            setPeriods(res.data);
            if (res.data.length > 0) {
                const active = res.data.find(p => p.is_active);
                const defaultPeriod = active || res.data[0];
                setSelectedPeriod(defaultPeriod);
                loadUnifiedBoard(defaultPeriod.id);
            } else {
                loadUnifiedBoard();
            }
        } catch (err) {
            console.error("Error fetching periods:", err);
            loadUnifiedBoard();
        }
    };

    const fetchPrograms = async () => {
        try {
            const res = await api.get('/academics/programs/');
            setPrograms(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadApprovedReports = async () => {
        try {
            const [regularRes, dacRes] = await Promise.all([
                api.get('/reports/'),
                api.get('/reports/dac-reports/')
            ]);

            const regularApproved = regularRes.data
                .filter(r => r.status === 'Approved' || r.status === 'Verified')
                .map(r => ({
                    id: r.report_id,
                    name: r.file_name || (r.report_type === 'Direct' ? `Direct CIS - ${r.course_id}` : `Batch Report - ${r.batch_id}`),
                    type: r.report_type === 'Direct' ? 'Direct Attainment' : (r.report_type === 'Indirect' ? 'Indirect Attainment' : 'PO/PSO Attainment'),
                    date: new Date(r.created_at).toLocaleDateString(),
                    submittedBy: r.user_id_created || 'System',
                    status: r.status,
                    filters: { program: r.program_id, batch: r.batch_id },
                    content: r.report_file,
                    auditor_remark: r.auditor_remark,
                    isDac: false,
                    uniqueKey: `reg-${r.report_id}`
                }));

            const dacApproved = dacRes.data
                .filter(r => r.status === 'Approved' || r.status === 'Verified')
                .map(r => ({
                    id: r.dac_report_id,
                    name: r.file_name || `DAC Report - ${r.academic_year}`,
                    type: 'DAC Report',
                    date: new Date(r.uploaded_at).toLocaleDateString(),
                    submittedBy: r.uploaded_by || 'System',
                    status: r.status,
                    filters: { program: r.program_id, batch: r.batch_id },
                    content: r.file,
                    auditor_remark: r.auditor_remark,
                    isDac: true,
                    uniqueKey: `dac-${r.dac_report_id}`
                }));

            setReports([...regularApproved, ...dacApproved]);
        } catch (err) {
            console.error("Error loading reports:", err);
        }
    };

    const loadUnifiedBoard = async (periodId = null) => {
        try {
            const url = periodId ? `/reports/auditor-board/?period_id=${periodId}` : '/reports/auditor-board/';
            const res = await api.get(url);
            if (res.data.content) {
                setRemarksData(JSON.parse(res.data.content));
            } else {
                setRemarksData({ rows: Array(25).fill(0).map(() => Array(10).fill('')) });
            }
        } catch (err) {
            console.error("Error loading board:", err);
        }
    };

    const handlePeriodChange = (e) => {
        const periodId = e.target.value;
        const period = periods.find(p => p.id === parseInt(periodId));
        setSelectedPeriod(period);
        loadUnifiedBoard(periodId);
    };

    const isPeriodReadOnly = !selectedPeriod?.is_active || isUserDisabled;



    useEffect(() => {
        if (showRemarksModal && selectedPeriod) {
            loadUnifiedBoard(selectedPeriod.id);
        }
    }, [showRemarksModal]);

    const handleReportSelect = (report) => {
        setSelectedReport(report);

        // Trigger Direct Download if content exists
        if (report.content) {
            const link = document.createElement('a');
            link.href = report.content;
            link.setAttribute('download', report.name);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const saveRemarks = async () => {
        if (isUserDisabled) {
            alert("Your account is disabled. Remarks cannot be saved.");
            return;
        }

        try {
            await api.patch('/reports/auditor-board/', {
                content: JSON.stringify(remarksData)
            });

            alert("Board remarks saved to database successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to save remarks to database.");
        }
    };

    const handleRowChange = (rowIndex, colIndex, value) => {
        if (isPeriodReadOnly) return;
        const newRows = [...remarksData.rows];
        newRows[rowIndex] = [...newRows[rowIndex]];
        newRows[rowIndex][colIndex] = value;
        setRemarksData({ ...remarksData, rows: newRows });
    };

    const addRow = () => {
        if (isPeriodReadOnly) return;
        const newRows = [...remarksData.rows, Array(remarksData.rows[0].length).fill('')];
        setRemarksData({ ...remarksData, rows: newRows });
    };

    const addColumn = () => {
        if (isPeriodReadOnly) return;
        const newRows = remarksData.rows.map(row => [...row, '']);
        setRemarksData({ ...remarksData, rows: newRows });
    };

    const handleKeyDown = (e, rIdx, cIdx) => {
        if (isPeriodReadOnly) return;
        const rows = remarksData.rows;
        const maxRows = rows.length;
        const maxCols = rows[0].length;

        let nextR = rIdx;
        let nextC = cIdx;

        if (e.key === 'ArrowUp') {
            nextR = Math.max(0, rIdx - 1);
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            nextR = Math.min(maxRows - 1, rIdx + 1);
            e.preventDefault();
        } else if (e.key === 'ArrowLeft') {
            nextC = Math.max(0, cIdx - 1);
            e.preventDefault();
        } else if (e.key === 'ArrowRight') {
            nextC = Math.min(maxCols - 1, cIdx + 1);
            e.preventDefault();
        }

        if (nextR !== rIdx || nextC !== cIdx) {
            const nextRef = gridRefs.current[`${nextR}-${nextC}`];
            if (nextRef) nextRef.focus();
        }
    };

    const filteredReports = reports.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        const matchesProgram = !filters.program || (r.filters.program && r.filters.program.toString() === filters.program);
        const matchesType = filters.type === 'All' || r.type === filters.type;
        return matchesSearch && matchesProgram && matchesType;
    });

    const getCurrentRows = () => {
        return remarksData.rows;
    };

    return (
        <div className="view-reports-container">
            <div className="view-reports-main-layout">
                <div className="view-reports-content-panel">
                    <div className="view-reports-header mb-4 d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="fw-bold text-primary">Approved Reports for Audit</h2>
                            <p className="text-muted mb-0">Only verified/approved reports are listed here for your review.</p>
                        </div>
                        {!isAdmin && (isHod || isCoordinator || isFaculty || isAuditor) && (
                            <button
                                className="btn btn-outline-primary btn-sm fw-bold px-3"
                                onClick={() => setShowRemarksModal(true)}
                            >
                                <i className="bi bi-journal-text me-2"></i>
                                View Remarks
                            </button>
                        )}
                    </div>

                    <div className="row g-4 content-row">
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
                                                key={report.uniqueKey}
                                                className={`report-item p-3 mb-2 rounded border-start border-4 ${selectedReport?.uniqueKey === report.uniqueKey ? 'active-report' : ''}`}
                                                onClick={() => handleReportSelect(report)}
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

                        <div className="col-lg-7">
                            <div className={`audit-board-card shadow-sm bg-white rounded-lg border-0 h-100`}>
                                <div className="d-flex flex-column h-100">
                                    <div className="excel-panel-header p-3 border-bottom d-flex justify-content-between align-items-center bg-white rounded-top">
                                        <div className="d-flex align-items-center gap-2">
                                            <h5 className="fw-bold m-0">Remarks Board</h5>
                                            {isUserDisabled && <Badge bg="danger" className="ms-2">Account Frozen</Badge>}
                                            {selectedPeriod && !selectedPeriod.is_active && <Badge bg="warning" text="dark" className="ms-2">Historical</Badge>}
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-sm btn-outline-secondary" onClick={addColumn} title="Add Column" disabled={isPeriodReadOnly}>+</button>
                                            <button className="btn btn-sm btn-outline-secondary" onClick={addRow} title="Add Row" disabled={isPeriodReadOnly}>↵</button>
                                            <button className="btn btn-success btn-sm px-3" onClick={saveRemarks} disabled={isPeriodReadOnly}> Save</button>
                                        </div>
                                    </div>

                                    <div className="excel-grid-container custom-scrollbar p-0">
                                        <table className="excel-table">
                                            <thead>
                                                <tr>
                                                    <th className="excel-corner"></th>
                                                    {remarksData.rows[0].map((_, idx) => (
                                                        <th key={idx} className="excel-col-header">{columnLabels[idx] || `C${idx + 1}`}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {remarksData.rows.map((row, rIdx) => (
                                                    <tr key={rIdx}>
                                                        <td className="excel-row-header">{rIdx + 1}</td>
                                                        {row.map((cell, cIdx) => (
                                                            <td key={cIdx} className="excel-cell">
                                                                <textarea
                                                                    ref={el => gridRefs.current[`${rIdx}-${cIdx}`] = el}
                                                                    className="excel-textarea"
                                                                    value={cell}
                                                                    onChange={(e) => handleRowChange(rIdx, cIdx, e.target.value)}
                                                                    onKeyDown={(e) => handleKeyDown(e, rIdx, cIdx)}
                                                                    disabled={isPeriodReadOnly}
                                                                />
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Auditor Remarks Modal (Read-Only) */}
            <Modal show={showRemarksModal} onHide={() => setShowRemarksModal(false)} size="xl" centered animation={false}>
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title className="fs-5 fw-bold">
                        <i className="bi bi-journal-text me-2"></i>
                        Remarks History (Read-Only)
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                    <div className="p-3 bg-light border-bottom d-flex align-items-center justify-content-between">
                        <div className="text-muted small fw-bold">Select Audit Period to view past results</div>
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
                                    <th className="excel-corner"></th>
                                    {remarksData.rows[0].map((_, idx) => (
                                        <th key={idx} className="excel-col-header">{columnLabels[idx] || `C${idx + 1}`}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loadingRemarks ? (
                                    <tr>
                                        <td colSpan="20" className="text-center py-5 bg-white">
                                            <div className="spinner-border text-primary spinner-border-sm" role="status"></div>
                                        </td>
                                    </tr>
                                ) : remarksData.rows.map((row, rIdx) => (
                                    <tr key={rIdx}>
                                        <td className="excel-row-header">{rIdx + 1}</td>
                                        {row.map((cell, cIdx) => (
                                            <td key={cIdx} className="excel-cell">
                                                <textarea
                                                    className="excel-textarea"
                                                    value={cell}
                                                    readOnly
                                                    style={{ cursor: 'default' }}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRemarksModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ViewReports;
