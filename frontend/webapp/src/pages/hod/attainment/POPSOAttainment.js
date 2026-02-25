import React, { useState, useEffect } from 'react';
import api from '../../../utils/axios';
import './POPSOAttainment.css';
import { Chart } from 'react-google-charts';
import { BsFileEarmarkExcelFill } from 'react-icons/bs';
import { Modal, Button } from 'react-bootstrap';
import { useFilters } from '../../../context/FilterContext';

const STATUS_COLOR = (achieved, target) => {
    if (achieved === null || achieved === undefined) return '#9e9e9e';
    return achieved >= target ? '#2e7d32' : '#c62828';
};

const GAP_COLOR = (gap) => parseFloat(gap) <= 0 ? '#388e3c' : '#d32f2f';

export default function POPSOAttainment() {
    const {
        selectedDept, setSelectedDept,
        selectedBatch, setSelectedBatch,
        selectedYear, setSelectedYear,
        selectedClass, setSelectedClass,
        selectedSemester: selectedSem, setSelectedSemester: setSelectedSem,
        programs: departments,
        years
    } = useFilters();

    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState({ achieved: 0, target: 0, gap: 0 });

    const [showReport, setShowReport] = useState(false);
    const [admissionBatches, setAdmissionBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (selectedDept) {
            fetchBatches(selectedDept);
            fetchData();
        }
    }, [selectedDept, selectedBatch, selectedYear, selectedClass, selectedSem]);

    const fetchBatches = async (program_id) => {
        if (!program_id || program_id === 'All') return;
        try {
            const res = await api.get('/academics/batches/list/', { params: { program_id } });
            setAdmissionBatches(res.data || []);
            if (res.data?.length) setSelectedBatchId(String(res.data[0].batch_id));
        } catch (e) { console.error(e); }
    };

    const fetchData = async () => {
        if (!selectedDept || selectedDept === 'All') return;
        setLoading(true);
        try {
            const academic_year = selectedYear.replace(/\s/g, '');
            const params = { program_id: selectedDept, academic_year };

            const [poRes, psoRes, targetsRes] = await Promise.allSettled([
                api.get('/attainment/po/', { params }),
                api.get('/attainment/pso/', { params }),
                api.get('/academics/targets/', { params: { academic_year } }),
            ]);

            const poAtt = poRes.status === 'fulfilled' ? (poRes.value.data['PO attainment'] || []) : [];
            const psoAtt = psoRes.status === 'fulfilled' ? (psoRes.value.data['PSO attainment'] || []) : [];
            const targets = targetsRes.status === 'fulfilled' ? targetsRes.value.data : {};
            const poTargetMap = {};
            const psoTargetMap = {};
            (targets.po_targets || []).forEach(t => poTargetMap[String(t.po_id)] = t.target_value);
            (targets.pso_targets || []).forEach(t => psoTargetMap[String(t.pso_id)] = t.target_value);

            const combined = [
                ...poAtt.map(a => ({
                    po_id: a.po_id,
                    label: `PO ${a.po_number || a.po_id}`,
                    achieved: parseFloat(a.normalized_value).toFixed(2),
                    target: parseFloat(poTargetMap[String(a.po_id)] || 2.5),
                    gap: a.gap
                        ? parseFloat(a.gap).toFixed(2)
                        : (parseFloat(poTargetMap[String(a.po_id)] || 2.5) - a.normalized_value).toFixed(2),
                })),
                ...psoAtt.map(a => ({
                    pso_id: a.pso_id,
                    label: `PSO ${a.pso_number || a.pso_id}`,
                    achieved: parseFloat(a.normalized_value).toFixed(2),
                    target: parseFloat(psoTargetMap[String(a.pso_id)] || 2.5),
                    gap: a.gap
                        ? parseFloat(a.gap).toFixed(2)
                        : (parseFloat(psoTargetMap[String(a.pso_id)] || 2.5) - a.normalized_value).toFixed(2),
                })),
            ];

            setTableData(combined);

            if (combined.length) {
                const avgA = combined.reduce((s, r) => s + parseFloat(r.achieved), 0) / combined.length;
                const avgT = combined.reduce((s, r) => s + parseFloat(r.target), 0) / combined.length;
                setSummary({ achieved: avgA.toFixed(2), target: avgT.toFixed(2), gap: (avgT - avgA).toFixed(2) });
            } else {
                setSummary({ achieved: 0, target: 0, gap: 0 });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // ── Chart data ──────────────────────────────────────────────────────────
    const buildAttainmentChartData = () => {
        if (!tableData.length) return null;
        const header = ['PO / PSO', 'Achieved', { role: 'style' }, 'Target', { role: 'style' }];
        const rows = tableData.map(r => [
            r.label,
            parseFloat(r.achieved),
            STATUS_COLOR(parseFloat(r.achieved), r.target),
            r.target,
            'color: #1565c0; opacity: .35',
        ]);
        return [header, ...rows];
    };

    const buildGapChartData = () => {
        if (!tableData.length) return null;
        const header = ['PO / PSO', 'Gap', { role: 'style' }];
        const rows = tableData.map(r => [
            r.label,
            parseFloat(r.gap),
            GAP_COLOR(r.gap),
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

    const gapChartOptions = {
        ...chartOptions,
        vAxis: { title: 'Gap (Target − Achieved)' },
        seriesType: 'bars',
    };

    const attainChartData = buildAttainmentChartData();
    const gapChartData = buildGapChartData();

    const metCount = tableData.filter(r => parseFloat(r.gap) <= 0).length;
    const notMetCount = tableData.length - metCount;

    return (
        <div className="ppo-wrapper">
            <div className="ppo-card">

                {/* Filters */}
                <div className="filter-row-v2 mb-4 p-3 bg-light rounded border">
                    <div className="row g-3">
                        <div className="col-md">
                            <label className="filter-label">DEPARTMENT</label>
                            <select className="form-select filter-select" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                                <option value="All">All Departments</option>
                                {departments.map(d => <option key={d.program_id} value={d.program_id}>{d.program_abbr || d.program_name}</option>)}
                            </select>
                        </div>
                        <div className="col-md">
                            <label className="filter-label">BATCH</label>
                            <select className="form-select filter-select" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                                <option value="All">All</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="col-md">
                            <label className="filter-label">ACADEMIC YEAR</label>
                            <select className="form-select filter-select" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                                <option value="All">All</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="col-md" style={{ maxWidth: 100 }}>
                            <label className="filter-label">CLASS</label>
                            <select className="form-select filter-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                                <option value="All">All</option>
                                {['FY', 'SY', 'TY'].map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div className="col-md" style={{ maxWidth: 100 }}>
                            <label className="filter-label">SEM</label>
                            <select className="form-select filter-select" value={selectedSem} onChange={e => setSelectedSem(e.target.value)}>
                                <option value="All">All</option>
                                {[1, 2, 3, 4, 5, 6].map(s => <option key={s} value={s.toString()}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Page title + generate button */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="ppo-title mb-0">PO &amp; PSO Attainment</h2>
                        <p className="text-muted small mb-0">{selectedClass} &nbsp;|&nbsp; {selectedYear}</p>
                    </div>
                    <button
                        className="btn btn-success d-flex align-items-center gap-2"
                        onClick={() => setShowReport(true)}
                        disabled={!tableData.length}
                    >
                        <BsFileEarmarkExcelFill size={16} /> Generate Report
                    </button>
                </div>

                {/* Summary cards */}
                <div className="ppo-summary-row mb-4">
                    {[
                        { label: 'Avg. Achieved', value: summary.achieved, cls: 'ppo-card-achieved' },
                        { label: 'Avg. Target', value: summary.target, cls: 'ppo-card-target' },
                        { label: 'Avg. Gap', value: summary.gap, cls: 'ppo-card-gap' },
                        { label: 'Met Target', value: `${metCount} / ${tableData.length}`, cls: 'ppo-card-met' },
                    ].map(c => (
                        <div key={c.label} className={`ppo-summary-card ${c.cls}`}>
                            <div className="ppo-card-label">{c.label}</div>
                            <div className="ppo-card-value">{loading ? '…' : c.value}</div>
                        </div>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
                ) : tableData.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <p>No attainment data found for the selected filters.</p>
                        <small>Make sure CIS entries have been saved and attainment has been computed.</small>
                    </div>
                ) : (<>

                    {/* ── Section A: Attainment Chart ── */}
                    <div className="ppo-section mb-5">
                        <h5 className="ppo-section-title">A. PO / PSO Attainment vs Target</h5>
                        <p className="text-muted small mb-3">
                            Green bars = target met &nbsp;|&nbsp; Red bars = target not met &nbsp;|&nbsp; Blue = target value
                        </p>
                        {attainChartData && (
                            <Chart
                                chartType="ColumnChart"
                                data={attainChartData}
                                options={chartOptions}
                                width="100%"
                                height="340px"
                            />
                        )}
                    </div>

                    {/* ── Section B: Gap Chart ── */}
                    <div className="ppo-section mb-5">
                        <h5 className="ppo-section-title">B. Gap Analysis (Target − Achieved)</h5>
                        <p className="text-muted small mb-3">
                            Green bars = no gap (or surplus) &nbsp;|&nbsp; Red bars = gap exists
                        </p>
                        {gapChartData && (
                            <Chart
                                chartType="ColumnChart"
                                data={gapChartData}
                                options={gapChartOptions}
                                width="100%"
                                height="300px"
                            />
                        )}
                    </div>

                    {/* ── Section C: Table ── */}
                    <div className="ppo-section">
                        <h5 className="ppo-section-title">C. Attainment Summary Table</h5>
                        <div className="table-responsive" style={{ maxWidth: 680 }}>
                            <table className="table table-bordered shadow-sm text-center" style={{ fontSize: '.85rem' }}>
                                <thead>
                                    <tr style={{ background: '#1a237e', color: '#fff' }}>
                                        <th className="py-3">PO / PSO</th>
                                        <th>Achieved</th>
                                        <th>Target</th>
                                        <th>Gap</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.map((r, i) => (
                                        <tr key={i} className="align-middle">
                                            <td className="fw-bold bg-light">{r.label}</td>
                                            <td className="text-primary fw-bold">{r.achieved}</td>
                                            <td className="text-secondary">{r.target}</td>
                                            <td className={`fw-bold ${parseFloat(r.gap) <= 0 ? 'text-success' : 'text-danger'}`}>{r.gap}</td>
                                            <td>
                                                <span className={`badge ${parseFloat(r.gap) <= 0 ? 'bg-success' : 'bg-danger'}`}>
                                                    {parseFloat(r.gap) <= 0 ? 'Met' : 'Not Met'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-muted small mt-2 fst-italic">* One report per class — individual PO reports are not generated separately.</p>
                    </div>
                </>)}
            </div>

            {/* ── Report Preview Modal ── */}
            <Modal show={showReport} onHide={() => setShowReport(false)} size="lg" centered>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="fw-bold text-primary">
                        PO / PSO Attainment Report Preview
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="ppo-report-preview p-3">
                        <h6 className="fw-bold mb-1">{selectedClass} &nbsp;|&nbsp; Academic Year: {selectedYear}</h6>
                        <hr />
                        <table className="table table-bordered table-sm text-center mt-3" style={{ fontSize: '.82rem' }}>
                            <thead style={{ background: '#1a237e', color: '#fff' }}>
                                <tr>
                                    <th>PO / PSO</th>
                                    <th>Level Achieved</th>
                                    <th>Target</th>
                                    <th>Gap</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.map((r, i) => (
                                    <tr key={i}>
                                        <td className="fw-bold">{r.label}</td>
                                        <td>{r.achieved}</td>
                                        <td>{r.target}</td>
                                        <td className={parseFloat(r.gap) <= 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>{r.gap}</td>
                                        <td><span className={`badge ${parseFloat(r.gap) <= 0 ? 'bg-success' : 'bg-danger'}`}>{parseFloat(r.gap) <= 0 ? 'Met' : 'Not Met'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="mt-3 p-3 bg-light border rounded small text-muted">
                            <strong>Note:</strong> Full Excel report generation is cohort-wise. Please select the admission batch to generate the aggregate "Result of Evaluation" report.

                            <div className="mt-2">
                                <label className="fw-bold small mb-1">SELECT ADMISSION BATCH</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={selectedBatchId}
                                    onChange={e => setSelectedBatchId(e.target.value)}
                                >
                                    <option value="">Select Batch</option>
                                    {admissionBatches.map(b => (
                                        <option key={b.batch_id} value={b.batch_id}>
                                            Batch {b.batch_year} - {b.scheme_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="bg-light">
                    <Button variant="secondary" onClick={() => setShowReport(false)}>Close</Button>
                    <Button
                        variant="success"
                        className="d-flex align-items-center gap-2"
                        onClick={async () => {
                            if (!selectedBatchId) return alert('Please select a batch');
                            setDownloading(true);
                            try {
                                const response = await api.get('/attainment/batch-report/', {
                                    params: { program_id: selectedDept, batch_id: selectedBatchId },
                                    responseType: 'blob'
                                });
                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `Result_of_Evaluation_Batch_${selectedBatchId}.xlsx`);
                                document.body.appendChild(link);
                                link.click();
                                window.URL.revokeObjectURL(url);
                            } catch (e) {
                                console.error(e);
                                alert('Failed to generate report');
                            } finally {
                                setDownloading(false);
                            }
                        }}
                        disabled={downloading || !selectedBatchId}
                    >
                        {downloading ? <div className="spinner-border spinner-border-sm" /> : <BsFileEarmarkExcelFill size={15} />}
                        {downloading ? 'Generating...' : 'Download Excel'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
