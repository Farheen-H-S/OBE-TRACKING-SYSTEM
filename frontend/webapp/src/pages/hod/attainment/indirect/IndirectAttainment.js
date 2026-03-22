import React, { useState, useEffect } from 'react';
import api from '../../../../utils/axios';
import './IndirectAttainment.css';
import { Modal, Button, Table } from 'react-bootstrap';
import { BsEyeFill, BsFileEarmarkExcelFill } from 'react-icons/bs';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useFilters } from '../../../../context/FilterContext';
import { Chart } from 'react-google-charts';

const STATUS_COLOR = (achieved) => {
    if (achieved === null || achieved === undefined) return '#9e9e9e';
    return '#1565c0';
};

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

export default function IndirectAttainment() {
    const {
        selectedDept, setSelectedDept,
        selectedBatch, setSelectedBatch,
        selectedYear, setSelectedYear,
        selectedClass, setSelectedClass,
        selectedSemester: selectedSem, setSelectedSemester: setSelectedSem,
        programs: departments,
        years,
        validateContext
    } = useFilters();

    const requiredFields = ['dept', 'batch', 'year', 'class', 'semester'];
    // Division is not always required for Indirect summary, but let's stick to the 5 key ones.
    const { isValid, missingFields } = validateContext(requiredFields);

    // Survey rows derived from localStorage
    const [rows, setRows] = useState([]);

    // Chart Summary State
    const [chartData, setChartData] = useState([]);
    const [loadingCharts, setLoadingCharts] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalTool, setModalTool] = useState(null);
    const [modalRows, setModalRows] = useState([]);
    const [modalStmts, setModalStmts] = useState([]);

    useEffect(() => {
        if (selectedDept) {
            buildRows();
            fetchSummaryData();
        }
    }, [selectedDept, selectedBatch, selectedYear, selectedClass, selectedSem]);

    const fetchSummaryData = async () => {
        if (!selectedDept || selectedDept === 'All') return;
        setLoadingCharts(true);
        try {
            const academic_year = selectedYear.replace(/\s/g, '');
            const params = { program_id: selectedDept, batch_id: selectedBatch, academic_year };

            const [summaryRes] = await Promise.allSettled([
                api.get('/attainment/indirect-summary/', { params })
            ]);

            const summary = summaryRes.status === 'fulfilled' ? summaryRes.value.data : [];

            const combined = summary.map(a => {
                const achieved = parseFloat(a.achieved || 0);
                return {
                    label: a.label,
                    achieved: achieved
                };
            });

            setChartData(combined);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingCharts(false);
        }
    };

    const buildRows = () => {
        const built = SURVEY_TOOLS.map(tool => {
            const key = `oit_responses_oit_survey_${tool.id}_${selectedDept}_${selectedYear.replace(/\s/g, '')}_${selectedClass}_${selectedSem}`;
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

    const handleGenerateReport = async () => {
        try {
            const response = await api.get('/attainment/indirect-report/', {
                params: { 
                    batch_id: selectedBatch, 
                    program_id: selectedDept,
                    academic_year: selectedYear.replace(/\s/g, '')
                },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Indirect_Attainment_Report_${selectedBatch}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Report generation failed:', err);
            if (err.response && err.response.status === 404) {
                alert(`No admission batch found for year ${selectedBatch}. Please ensure the batch is created in Academic Setup.`);
            } else {
                alert('Failed to generate report.');
            }
        }
    };

    // ── Chart data ──────────────────────────────────────────────────────────
    const buildAttainmentChartData = () => {
        if (!chartData.length) return null;
        const header = ['PO / PSO', 'Achieved', { role: 'style' }];
        const rows = chartData.map(r => [
            r.label,
            r.achieved,
            STATUS_COLOR(r.achieved),
        ]);
        return [header, ...rows];
    };

    const chartOptions = {
        legend: 'none',
        bar: { groupWidth: '55%' },
        vAxis: { minValue: 0, maxValue: 3, title: 'Attainment (0–3)' },
        hAxis: { title: 'PO / PSO' },
        chartArea: { width: '75%', height: '65%' },
        backgroundColor: 'transparent',
    };

    const attainChartData = buildAttainmentChartData();

    return (
        <div className="indir-wrapper">
            <div className="indir-card">


                {!isValid ? (
                    <div className="alert alert-warning shadow-sm border-warning d-flex align-items-center gap-3 p-4 mb-4">
                        <BsEyeFill className="text-warning fs-3" />
                        <div>
                            <h5 className="fw-bold mb-1">Academic Context Required</h5>
                            <p className="mb-0">Please select the remaining filters in the top bar to proceed: <span className="fw-bold text-dark">{missingFields.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ')}</span></p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="indir-title mb-0">Report : Indirect Attainment</h2>
                            <Button variant="success" onClick={handleGenerateReport} className="d-flex align-items-center gap-2">
                                <BsFileEarmarkExcelFill size={18} /> Download Overall Report
                            </Button>
                        </div>

                        {/* Charts Area */}
                        {loadingCharts ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <div className="text-muted mt-2">Loading Visualization Dashboard...</div>
                            </div>
                        ) : (
                            attainChartData && (
                                <div className="row g-4 mb-4">
                                    <div className="col-12">
                                        <div className="card shadow-sm h-100 border-0">
                                            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                                                <h5 className="card-title fw-bold text-dark m-0 d-flex align-items-center gap-2">
                                                    Indirect Attainment Level
                                                </h5>
                                            </div>
                                            <div className="card-body p-0" style={{ height: 350 }}>
                                                <Chart
                                                    chartType="ColumnChart"
                                                    width="100%"
                                                    height="100%"
                                                    data={attainChartData}
                                                    options={chartOptions}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                        <p className="text-muted small fst-italic mt-2">
                            * Responses are collected from the student survey links generated in <strong>Other Indirect Tools</strong>.
                        </p>
                    </>
                )}
            </div>

            {/* ── Stats Modal ── */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" scrollable>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="text-primary fw-bold">
                        Indirect Attainment: {modalTool?.label}
                        <div className="small text-muted fw-normal">
                            {selectedClass} &nbsp;|&nbsp; {selectedYear}
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
                        onClick={handleGenerateReport}
                        title="Download compiled Excel report"
                    >
                        <BsFileEarmarkExcelFill size={16} /> Compiled Report
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
