import React, { useState, useEffect } from 'react';
import api from '../../../utils/axios';
import './IndirectAttainment.css';
import { Modal, Button, Table } from 'react-bootstrap';
import { BsEyeFill, BsFileEarmarkExcelFill } from 'react-icons/bs';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';

const SURVEY_TOOLS = [
    { id: 'co-curricular', label: 'Co-curricular / Extra Curricular Activity Feedback', short: 'Co-curricular' },
    { id: 'resource-person', label: 'Resource Person Feedback', short: 'Resource Person' },
    { id: 'program-exit', label: 'Program Exit Survey', short: 'Program Exit' },
    { id: 'alumni', label: 'Alumni Feedback', short: 'Alumni' },
];

const ATTAINMENT_LEVELS = [
    { level: 5, label: 'Very High', min: 2.50, max: 3.00 },
    { level: 4, label: 'High', min: 2.00, max: 2.49 },
    { level: 3, label: 'Medium', min: 1.50, max: 1.99 },
    { level: 2, label: 'Low', min: 1.00, max: 1.49 },
    { level: 1, label: 'Very Low', min: 0, max: 0.99 },
];

const getAttainmentLevel = (avg) => {
    if (avg === null || avg === undefined) return null;
    for (const al of ATTAINMENT_LEVELS) {
        if (avg >= al.min && avg <= al.max) return al;
    }
    return ATTAINMENT_LEVELS[4];
};

const years = ['2024 - 25', '2025 - 26', '2026 - 27'];
const BATCHES = ['FY', 'SY', 'TY'];
const DIVS = ['A', 'B', 'C', 'D'];

export default function IndirectAttainment() {
    const [departments, setDepartments] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedYear, setSelectedYear] = useState('2025 - 26');
    const [selectedClass, setSelectedClass] = useState('FY');
    const [selectedDiv, setSelectedDiv] = useState('A');

    // Survey rows derived from localStorage
    const [rows, setRows] = useState([]);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalTool, setModalTool] = useState(null);
    const [modalRows, setModalRows] = useState([]);
    const [modalStmts, setModalStmts] = useState([]);

    useEffect(() => { fetchDepts(); }, []);
    useEffect(() => { if (selectedDept) buildRows(); }, [selectedDept, selectedYear, selectedClass, selectedDiv]);

    const fetchDepts = async () => {
        try {
            const res = await api.get('/academics/programs/');
            setDepartments(res.data || []);
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            const dept = user?.department || user?.department_id;
            if (dept) {
                const found = (res.data || []).find(d => String(d.program_id) === String(dept));
                setSelectedDept(found ? String(found.program_id) : String(res.data[0]?.program_id || ''));
            } else if (res.data?.length) {
                setSelectedDept(String(res.data[0].program_id));
            }
        } catch (e) { console.error(e); }
    };

    const buildRows = () => {
        const built = SURVEY_TOOLS.map(tool => {
            const key = `oit_responses_oit_survey_${tool.id}_${selectedDept}_${selectedYear.replace(/\s/g, '')}_${selectedClass}_${selectedDiv}`;
            const responses = JSON.parse(localStorage.getItem(key) || '[]');
            return { tool, responses, count: responses.length };
        });
        setRows(built);
    };

    const buildStmts = async (programId) => {
        try {
            const [poRes, psoRes] = await Promise.allSettled([
                api.get(`/academics/pos/?program_id=${programId}`),
                api.get(`/academics/psos/?program_id=${programId}`),
            ]);
            const pos = poRes.status === 'fulfilled' ? (Array.isArray(poRes.value.data) ? poRes.value.data : []) : [];
            const psos = psoRes.status === 'fulfilled' ? (Array.isArray(psoRes.value.data) ? psoRes.value.data : []) : [];
            return [
                ...pos.map((p, i) => ({ type: 'PO', id: `po_${i}`, number: p.po_number || `PO ${i + 1}`, description: p.description })),
                ...psos.map((p, i) => ({ type: 'PSO', id: `pso_${i}`, number: p.pso_number || `PSO ${i + 1}`, description: p.description })),
            ];
        } catch { return []; }
    };

    const handleView = async (row) => {
        setModalTool(row.tool);
        setModalRows(row.responses);
        const stmts = await buildStmts(selectedDept);
        setModalStmts(stmts);
        setShowModal(true);
    };

    // Compute per-statement stats for modal
    const computeStats = (stmts, responses) => stmts.map(stmt => {
        const vals = responses.map(r => r.answers?.[stmt.id]).filter(v => v !== undefined && v !== null);
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
        const pctAbove = vals.length && avg !== null
            ? ((vals.filter(v => v >= avg).length / vals.length) * 100).toFixed(1)
            : '0.0';
        return { ...stmt, vals, avg: avg !== null ? avg.toFixed(2) : '-', pctAbove, attainment: getAttainmentLevel(avg) };
    });

    const isRP = modalTool?.id === 'resource-person';

    const statusIcon = (count) => {
        if (count === 0) return <FaTimesCircle className="text-secondary me-1" />;
        if (count < 5) return <FaExclamationTriangle className="text-warning me-1" />;
        return <FaCheckCircle className="text-success me-1" />;
    };

    const avgAttainmentBadge = (responses, stmts) => {
        if (!responses.length || !stmts.length) return <span className="badge bg-secondary">No data</span>;
        const stats = computeStats(stmts, responses);
        const avgs = stats.map(s => parseFloat(s.avg)).filter(v => !isNaN(v));
        if (!avgs.length) return <span className="badge bg-secondary">–</span>;
        const mean = avgs.reduce((a, b) => a + b, 0) / avgs.length;
        const al = getAttainmentLevel(mean);
        const cls = !al ? 'secondary' : al.level >= 4 ? 'success' : al.level === 3 ? 'warning' : 'danger';
        return <span className={`badge bg-${cls}`}>{mean.toFixed(2)} {al ? `— L${al.level} ${al.label}` : ''}</span>;
    };

    return (
        <div className="indir-wrapper">
            <div className="indir-card">

                {/* Filter bar */}
                <div className="filter-row-v2 mb-4 p-3 bg-light rounded border">
                    <div className="row g-3">
                        <div className="col-md">
                            <label className="filter-label">DEPARTMENT</label>
                            <select className="form-select filter-select" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                                <option value="">Select Department</option>
                                {departments.map(d => <option key={d.program_id} value={d.program_id}>{d.program_name}</option>)}
                            </select>
                        </div>
                        <div className="col-md">
                            <label className="filter-label">ACADEMIC YEAR</label>
                            <select className="form-select filter-select" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="col-md">
                            <label className="filter-label">BATCH</label>
                            <select className="form-select filter-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                                {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div className="col-md" style={{ maxWidth: 110 }}>
                            <label className="filter-label">DIV</label>
                            <select className="form-select filter-select" value={selectedDiv} onChange={e => setSelectedDiv(e.target.value)}>
                                {DIVS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <h2 className="indir-title mb-4">Report : Indirect Attainment</h2>

                {/* Survey tools table */}
                <div className="table-responsive">
                    <table className="table table-bordered table-hover shadow-sm" style={{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }}>
                        <thead className="table-light">
                            <tr>
                                <th className="py-3 text-start indir-th">#</th>
                                <th className="py-3 text-start indir-th">SURVEY TOOL</th>
                                <th className="py-3 text-center indir-th">STATUS</th>
                                <th className="py-3 text-center indir-th">RESPONDENTS</th>
                                <th className="py-3 text-center indir-th">AVG. ATTAINMENT</th>
                                <th className="py-3 text-center indir-th">ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => {
                                const stmtCount = 0; // stmts loaded lazily in modal
                                return (
                                    <tr key={row.tool.id} style={{ verticalAlign: 'middle' }}>
                                        <td className="text-center fw-bold text-muted small">{i + 1}</td>
                                        <td className="fw-bold text-dark">{row.tool.label}</td>
                                        <td className="text-center">
                                            {row.count === 0
                                                ? <span className="badge bg-secondary">No Data</span>
                                                : <span className="badge bg-success">Responses Available</span>}
                                        </td>
                                        <td className="text-center fw-bold">{row.count || '—'}</td>
                                        <td className="text-center">
                                            {row.count === 0
                                                ? <span className="text-muted">—</span>
                                                : <span className="badge bg-info text-dark">
                                                    {statusIcon(row.count)} Compute on View
                                                </span>}
                                        </td>
                                        <td className="text-center">
                                            <button
                                                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-2"
                                                style={{ borderRadius: 6, fontWeight: 600 }}
                                                onClick={() => handleView(row)}
                                                disabled={row.count === 0}
                                                title={row.count === 0 ? 'No responses collected yet' : 'View statistics'}
                                            >
                                                <BsEyeFill size={14} /> View
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <p className="text-muted small fst-italic mt-2">
                    * Responses are collected from the OIT student survey links generated in <strong>Other Indirect Tools</strong>.
                </p>
            </div>

            {/* ── Stats Modal ── */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" scrollable>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="text-primary fw-bold">
                        Indirect Attainment: {modalTool?.label}
                        <div className="small text-muted fw-normal">
                            {selectedClass} – Div {selectedDiv} &nbsp;|&nbsp; {selectedYear}
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalStmts.length === 0 ? (
                        <div className="text-center py-5 text-muted">Loading statements…</div>
                    ) : (
                        <div>
                            <Table bordered hover responsive className="shadow-sm mb-4 text-center align-middle" style={{ fontSize: '.82rem' }}>
                                <thead className="table-light">
                                    <tr>
                                        {isRP
                                            ? <th style={{ minWidth: 180 }}>Name</th>
                                            : <>
                                                <th style={{ minWidth: 150 }}>Enrollment No.</th>
                                                <th style={{ minWidth: 80 }}>Roll No.</th>
                                                <th style={{ minWidth: 160 }}>Name</th>
                                            </>}
                                        {modalStmts.map(s => (
                                            <th key={s.id} style={{ background: '#1a237e', color: '#fff', minWidth: 80 }}>
                                                <div>{s.number}</div>
                                                {s.description && (
                                                    <div style={{ fontSize: '.6rem', opacity: .7, fontWeight: 400, lineHeight: 1.2 }}>
                                                        {s.description.split(' ').slice(0, 4).join(' ')}…
                                                    </div>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {modalRows.map((r, i) => (
                                        <tr key={i} className="align-middle">
                                            {isRP
                                                ? <td className="fw-semibold text-muted">{r.respondentName || `Respondent ${i + 1}`}</td>
                                                : <>
                                                    <td className="fw-semibold text-muted">{r.enrollment || '—'}</td>
                                                    <td className="text-center">{r.rollNo || '—'}</td>
                                                    <td>{r.respondentName || '—'}</td>
                                                </>}
                                            {modalStmts.map(s => (
                                                <td key={s.id} className="fw-bold">
                                                    {r.answers?.[s.id] !== undefined ? r.answers[s.id] : <span className="text-muted">-</span>}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                    {/* Summary rows */}
                                    {(() => {
                                        const stats = computeStats(modalStmts, modalRows);
                                        const colSpan = isRP ? 1 : 3;
                                        return (<>
                                            <tr className="table-light fw-bold">
                                                <td colSpan={colSpan} className="text-start ps-3 text-uppercase small">No. of Respondents</td>
                                                {stats.map(s => <td key={s.id}>{s.vals.length}</td>)}
                                            </tr>
                                            <tr className="table-light fw-bold">
                                                <td colSpan={colSpan} className="text-start ps-3 text-uppercase small">Average Rating</td>
                                                {stats.map(s => <td key={s.id} className="text-primary">{s.avg}</td>)}
                                            </tr>
                                            <tr className="table-light fw-bold">
                                                <td colSpan={colSpan} className="text-start ps-3 text-uppercase small">% At or Above Average</td>
                                                {stats.map(s => <td key={s.id}>{s.pctAbove}%</td>)}
                                            </tr>
                                            <tr className="fw-bold" style={{ background: '#e8eaf6' }}>
                                                <td colSpan={colSpan} className="text-start ps-3 text-uppercase small text-primary">PO/PSO Attainment Level</td>
                                                {stats.map(s => (
                                                    <td key={s.id}>
                                                        {s.attainment
                                                            ? <span className={`badge ${s.attainment.level >= 4 ? 'bg-success' : s.attainment.level === 3 ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                                                L{s.attainment.level} – {s.attainment.label}
                                                            </span>
                                                            : '—'}
                                                    </td>
                                                ))}
                                            </tr>
                                        </>);
                                    })()}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="bg-light">
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                    <Button
                        variant="success"
                        className="d-flex align-items-center gap-2"
                        disabled
                        title="Backend report generation coming soon"
                    >
                        <BsFileEarmarkExcelFill size={16} /> Generate Report (Coming Soon)
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
