import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import './Backtracking.css';
import { Container, Table, Row, Col, Form } from 'react-bootstrap';
import { FaChevronDown, FaChevronRight, FaArrowRight } from 'react-icons/fa';

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers to read CIS Direct Attainment from localStorage
   (fallback to API – mirrors what Cisdirectrep preview uses)
───────────────────────────────────────────────────────────────────────────── */
const TOOL_NAMES = {
  fa_th_1: 'FA-TH (CT1)',
  fa_th_2: 'FA-TH (CT2)',
  fa_pr: 'FA-PR',
  sla: 'SLA',
  sa_th: 'SA-TH',
  sa_pr: 'SA-PR',
  ces: 'CES',
  oit: 'OIT (Indirect)',
};

const Backtracking = () => {
  const [departments, setDepartments] = useState([]);
  const [years] = useState(['2024 - 25', '2025 - 26', '2026 - 27']);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('2025 - 26');

  const [tableData, setTableData] = useState([]);
  const [summary, setSummary] = useState({ achieved: 0, target: 0, gap: 0 });
  const [loading, setLoading] = useState(false);

  // Drill-down state: which row is expanded + its detail data
  const [expanded, setExpanded] = useState(null);   // label string e.g. "PO 1"
  const [drillData, setDrillData] = useState(null);   // { cos: [{co, tools, weight}] }
  const [drillLabel, setDrillLabel] = useState('');     // breadcrumb label
  const [drillLoading, setDrillLoading] = useState(false);

  useEffect(() => { fetchInitialFilters(); }, []);
  useEffect(() => { if (selectedDept && selectedYear) fetchData(); }, [selectedDept, selectedYear]);

  /* ── Initial filter load ── */
  const fetchInitialFilters = async () => {
    try {
      const res = await api.get('/academics/programs/');
      setDepartments(res.data);
      const user = JSON.parse(localStorage.getItem('user'));
      const userDeptVal = user?.department || user?.department_id;
      let foundId = '';
      if (userDeptVal) {
        const dept = res.data.find(d =>
          String(d.program_id) === String(userDeptVal) || d.program_name === userDeptVal);
        if (dept) foundId = dept.program_id;
      }
      if (foundId) setSelectedDept(foundId);
      else if (res.data.length) setSelectedDept(res.data[0].program_id);
    } catch (err) { console.error(err); }
  };

  /* ── Main summary table data ── */
  const fetchData = async () => {
    setLoading(true);
    setExpanded(null); setDrillData(null);
    try {
      const academic_year = selectedYear.replace(/\s/g, '');
      const params = { program_id: selectedDept, academic_year };

      const [poRes, psoRes, targetsRes] = await Promise.all([
        api.get('/attainment/po/', { params }),
        api.get('/attainment/pso/', { params }),
        api.get('/academics/targets/', { params: { academic_year } }),
      ]);

      const poAtt = poRes.data['PO attainment'] || [];
      const psoAtt = psoRes.data['PSO attainment'] || [];
      const poTMap = {};
      const psoTMap = {};
      (targetsRes.data?.po_targets || []).forEach(t => poTMap[String(t.po_id)] = t.target_value);
      (targetsRes.data?.pso_targets || []).forEach(t => psoTMap[String(t.pso_id)] = t.target_value);

      const combined = [
        ...poAtt.map(a => ({
          sr: `PO ${a.po_number || a.po_id}`,
          id: a.po_id,
          type: 'po',
          level: a.normalized_value.toFixed(2),
          target: poTMap[String(a.po_id)] || 2.5,
          gap: a.gap
            ? a.gap.toFixed(2)
            : (parseFloat(poTMap[String(a.po_id)] || 2.5) - a.normalized_value).toFixed(2),
        })),
        ...psoAtt.map(a => ({
          sr: `PSO ${a.pso_number || a.pso_id}`,
          id: a.pso_id,
          type: 'pso',
          level: a.normalized_value.toFixed(2),
          target: psoTMap[String(a.pso_id)] || 2.5,
          gap: a.gap
            ? a.gap.toFixed(2)
            : (parseFloat(psoTMap[String(a.pso_id)] || 2.5) - a.normalized_value).toFixed(2),
        })),
      ];

      const withStatus = combined.map(d => ({
        ...d,
        status: parseFloat(d.level) >= d.target ? 'Met' : parseFloat(d.level) >= d.target * 0.8 ? 'Near' : 'Low',
      }));
      setTableData(withStatus);

      if (withStatus.length) {
        const avgA = withStatus.reduce((s, r) => s + parseFloat(r.level), 0) / withStatus.length;
        const avgT = withStatus.reduce((s, r) => s + parseFloat(r.target), 0) / withStatus.length;
        setSummary({ achieved: avgA.toFixed(2), target: avgT.toFixed(2), gap: (avgT - avgA).toFixed(2) });
      } else { setSummary({ achieved: 0, target: 0, gap: 0 }); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  /* ── Drill-down: load CO-level data for a clicked PO/PSO ── */
  const handleDrillDown = async (row) => {
    if (expanded === row.sr) {
      setExpanded(null); setDrillData(null); return;
    }
    setExpanded(row.sr);
    setDrillLabel(row.sr);
    setDrillData(null);
    setDrillLoading(true);

    try {
      const academic_year = selectedYear.replace(/\s/g, '');
      // Try to get CO attainment for this PO/PSO from backend
      const endpoint = row.type === 'po'
        ? `/attainment/po/${row.id}/cos/?academic_year=${academic_year}`
        : `/attainment/pso/${row.id}/cos/?academic_year=${academic_year}`;

      let cosData = [];
      try {
        const res = await api.get(endpoint, { params: { program_id: selectedDept } });
        cosData = res.data?.cos || res.data || [];
      } catch {
        // Endpoint may not exist — fall back to localStorage CIS entries
        cosData = readCOsFromLocalStorage(row);
      }

      // Normalise shape
      const normalised = cosData.map(co => ({
        coNumber: co.co_number || co.co_id || '?',
        description: co.description || co.co_description || '—',
        tools: co.tools || co.tool_scores || {},
        overallCO: co.overall_attainment ?? co.co_attainment ?? null,
        weight: co.weight ?? co.contribution_weight ?? null,
      }));

      setDrillData({ cos: normalised, row });
    } catch (err) {
      console.error('Drill-down error:', err);
      setDrillData({ cos: [], row, error: true });
    } finally {
      setDrillLoading(false);
    }
  };

  /* Fallback: read from localStorage CIS save data */
  const readCOsFromLocalStorage = (row) => {
    // CIS data is stored as cisEntry_{course_id}_... — we don't have course-level
    // info per PO here, so we return an empty array and show a helpful message.
    return [];
  };

  const getStatusClass = (status) => {
    if (status === 'Met') return 'bt-status-met';
    if (status === 'Near') return 'bt-status-near';
    return 'bt-status-low';
  };

  const formatTool = (val) => {
    if (val === null || val === undefined || val === '') return <span className="text-muted small">—</span>;
    return <span className="fw-semibold">{typeof val === 'number' ? val.toFixed(2) : val}</span>;
  };

  return (
    <div className="d-flex flex-column vh-100 overflow-hidden">
      <div className="flex-grow-1 p-3 bg-light overflow-y-auto">
        <Container fluid className="bg-white p-4 shadow-sm rounded border-0 h-100">

          <h4 className="fw-bold mb-1" style={{ color: '#1a237e' }}>Attainment Backtracking</h4>
          <p className="text-muted small mb-4">
            Drill-down from PO / PSO → contributing COs → tool scores to trace how attainment was computed.
          </p>

          {/* ── Filters ── */}
          <div className="row mb-4 g-3">
            <div className="col-md-4">
              <label className="fw-bold small text-muted mb-1 text-uppercase">Department</label>
              <Form.Select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="shadow-none border-secondary-subtle"
              >
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d.program_id} value={d.program_id}>{d.program_name}</option>
                ))}
              </Form.Select>
            </div>
            <div className="col-md-3">
              <label className="fw-bold small text-muted mb-1 text-uppercase">Academic Year</label>
              <Form.Select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="shadow-none border-secondary-subtle"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </Form.Select>
            </div>
          </div>

          {/* ── Summary cards ── */}
          <div className="mb-4">
            <h6 className="fw-bold text-primary mb-3">Attainment Summary</h6>
            {loading ? (
              <div className="text-muted small">Fetching data…</div>
            ) : (
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <div className="backtracking-card card-achieved shadow-sm">
                  <div className="small opacity-75">Achieved</div>
                  <div className="fs-4">{summary.achieved}</div>
                </div>
                <div className="backtracking-card card-target shadow-sm">
                  <div className="small opacity-75">Target</div>
                  <div className="fs-4">{summary.target}</div>
                </div>
                <div className="backtracking-card card-gap shadow-sm">
                  <div className="small opacity-75">Gap</div>
                  <div className="fs-4">{summary.gap}</div>
                </div>
                <div className={`ms-2 px-3 py-2 rounded-pill fw-bold d-flex align-items-center gap-2
                                    ${parseFloat(summary.gap) <= 0 ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                  <i className={`bi ${parseFloat(summary.gap) <= 0 ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`}></i>
                  Status: {parseFloat(summary.gap) <= 0 ? 'Target Met' : 'Not Met'}
                </div>
              </div>
            )}
          </div>

          {/* ── Main table + inline drill-down ── */}
          <div>
            <h6 className="fw-bold text-primary mb-2">
              Attainment Table — Click a row to drill down
              {expanded && (
                <span className="ms-2 text-muted fw-normal small">
                  <FaArrowRight className="mx-1" size={11} />
                  {drillLabel} → COs → Tool Scores
                </span>
              )}
            </h6>

            <div className="table-responsive" style={{ maxWidth: 820 }}>
              <Table bordered hover className="bt-main-table text-center shadow-sm">
                <thead>
                  <tr style={{ background: '#8da2fb', color: '#fff' }}>
                    <th className="py-3" style={{ width: 32 }}></th>
                    <th className="py-3">PO / PSO</th>
                    <th className="py-3">Level Achieved</th>
                    <th className="py-3">Target</th>
                    <th className="py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="py-4 text-muted">Loading data…</td></tr>
                  ) : tableData.length > 0 ? (
                    tableData.map((row, index) => (
                      <React.Fragment key={index}>
                        {/* ── Main row ── */}
                        <tr
                          className={`bt-row ${expanded === row.sr ? 'bt-row-expanded' : ''}`}
                          onClick={() => handleDrillDown(row)}
                          style={{ cursor: 'pointer' }}
                          title="Click to drill down into CO contributions"
                        >
                          <td className="text-center align-middle">
                            {expanded === row.sr
                              ? <FaChevronDown size={12} className="text-primary" />
                              : <FaChevronRight size={12} className="text-muted" />}
                          </td>
                          <td className="fw-bold bg-light text-start ps-3">{row.sr}</td>
                          <td className="fw-bold text-primary">{row.level}</td>
                          <td className="text-secondary">{row.target}</td>
                          <td>
                            <span className={`bt-status-badge ${getStatusClass(row.status)}`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>

                        {/* ── Drill-down panel ── */}
                        {expanded === row.sr && (
                          <tr>
                            <td colSpan="5" className="p-0">
                              <div className="bt-drill-panel">
                                {/* Breadcrumb */}
                                <div className="bt-breadcrumb">
                                  <span className="text-muted small">Drill path:</span>
                                  <span className="bt-crumb">{row.sr}</span>
                                  <FaArrowRight size={11} className="text-muted mx-1" />
                                  <span className="bt-crumb text-primary">Course Outcomes (CO)</span>
                                  <FaArrowRight size={11} className="text-muted mx-1" />
                                  <span className="bt-crumb text-success">Tool Scores</span>
                                </div>

                                {drillLoading ? (
                                  <div className="text-center py-4">
                                    <div className="spinner-border spinner-border-sm text-primary me-2" />
                                    Loading CO contributions…
                                  </div>
                                ) : drillData?.error ? (
                                  <div className="text-danger small p-3">
                                    Failed to load drill-down data.
                                  </div>
                                ) : !drillData?.cos?.length ? (
                                  <div className="bt-no-drill">
                                    <p className="mb-1 fw-semibold">No CO-level breakdown available from the API.</p>
                                    <p className="text-muted small mb-0">
                                      This section will populate once the backend endpoint
                                      <code className="mx-1">/attainment/{row.type}/{'{id}'}/cos/</code>
                                      is implemented. It will show which COs contribute to <strong>{row.sr}</strong>,
                                      each CO's tool scores (FA-TH, SA-TH, CES, OIT, etc.), and their weighted contribution.
                                    </p>

                                    {/* Placeholder drill structure */}
                                    <div className="bt-drill-placeholder mt-3 p-3 border rounded bg-white">
                                      <div className="text-muted small fw-bold mb-2 text-uppercase">
                                        Expected drill-down structure for {row.sr}
                                      </div>
                                      <table className="table table-sm table-bordered mb-0 text-center" style={{ fontSize: '.78rem' }}>
                                        <thead className="table-light">
                                          <tr>
                                            <th className="text-start ps-2">CO</th>
                                            <th>FA-TH CT1</th>
                                            <th>FA-TH CT2</th>
                                            <th>FA-PR</th>
                                            <th>SLA</th>
                                            <th>SA-TH</th>
                                            <th>SA-PR</th>
                                            <th>CES</th>
                                            <th>OIT</th>
                                            <th className="text-primary fw-bold">CO Att.</th>
                                            <th>Weight</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {['CO 1', 'CO 2', 'CO 3'].map(co => (
                                            <tr key={co} className="text-muted fst-italic">
                                              <td className="text-start ps-2 fw-bold">{co}</td>
                                              <td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td>
                                              <td className="text-primary">—</td>
                                              <td>—</td>
                                            </tr>
                                          ))}
                                          <tr className="table-light fw-bold">
                                            <td className="text-start ps-2" colSpan={10}>Weighted Avg → {row.sr} Attainment</td>
                                            <td className="text-primary">{row.level}</td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ) : (
                                  /* ── Live CO data (when API returns it) ── */
                                  <div className="table-responsive">
                                    <table className="table table-sm table-bordered mb-0 text-center" style={{ fontSize: '.8rem' }}>
                                      <thead className="table-light">
                                        <tr>
                                          <th className="text-start ps-2">CO</th>
                                          <th className="text-start" style={{ maxWidth: 200 }}>Description</th>
                                          {Object.keys(TOOL_NAMES).map(k => (
                                            <th key={k}>{TOOL_NAMES[k]}</th>
                                          ))}
                                          <th className="text-primary fw-bold">CO Att.</th>
                                          <th>Weight</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {drillData.cos.map((co, ci) => (
                                          <tr key={ci}>
                                            <td className="fw-bold text-start ps-2">{co.coNumber}</td>
                                            <td className="text-start text-muted small">{co.description}</td>
                                            {Object.keys(TOOL_NAMES).map(k => (
                                              <td key={k}>{formatTool(co.tools?.[k])}</td>
                                            ))}
                                            <td className="fw-bold text-primary">
                                              {co.overallCO !== null ? parseFloat(co.overallCO).toFixed(2) : '—'}
                                            </td>
                                            <td className="text-secondary">
                                              {co.weight !== null ? `${co.weight}%` : '—'}
                                            </td>
                                          </tr>
                                        ))}
                                        <tr className="table-primary fw-bold">
                                          <td
                                            colSpan={2 + Object.keys(TOOL_NAMES).length + 1}
                                            className="text-end pe-2"
                                          >
                                            Weighted Avg → {row.sr} Attainment
                                          </td>
                                          <td className="text-primary">{row.level}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="py-4 text-muted">No attainment records found for this selection.</td></tr>
                  )}
                </tbody>
              </Table>
            </div>
            <div className="mt-2 small text-muted fst-italic">
              * Click any row to expand the CO → tool score drill-down chain.
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default Backtracking;
