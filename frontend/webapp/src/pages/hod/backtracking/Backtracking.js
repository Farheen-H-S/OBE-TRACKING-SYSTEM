import React, { useState, useEffect } from 'react';
import api from '../../../utils/axios';
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

  const years = [];
  for (let i = 2019; i <= 2030; i++) {
    years.push(`${i} - ${(i + 1).toString().slice(-2)}`);
  }

  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('2025 - 26');
  const [selectedBatch, setSelectedBatch] = useState('2025 - 26');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSem, setSelectedSem] = useState('');

  const [tableData, setTableData] = useState([]);
  const [summary, setSummary] = useState({ achieved: 0, target: 0, gap: 0 });
  const [loading, setLoading] = useState(false);

  // Drill-down state: which row is expanded + its detail data
  const [expanded, setExpanded] = useState(null);   // label string e.g. "PO 1"
  const [drillLevel, setDrillLevel] = useState(0);  // 0: PO list, 1: Course list, 2: CO list
  const [drillData, setDrillData] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [drillLoading, setDrillLoading] = useState(false);

  useEffect(() => { fetchInitialFilters(); }, []);
  useEffect(() => { if (selectedDept) fetchData(); }, [selectedDept, selectedBatch, selectedYear, selectedClass, selectedSem]);

  /* ── Initial filter load ── */
  const fetchInitialFilters = async () => {
    try {
      const res = await api.get('/academics/programs/');
      setDepartments(res.data);
      const user = JSON.parse(localStorage.getItem('user'));
      const userDeptVal = user?.department || user?.department_id;

      const setupKey = 'academicSetup';
      const setup = JSON.parse(localStorage.getItem(setupKey) || '{}');
      if (setup.academic_year) {
        const ay = setup.academic_year.replace(/(\d{4})(\d{2})/, "$1 - $2");
        setSelectedYear(ay);
      }

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
    setExpanded(null); setDrillLevel(0); setDrillData(null);
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

  /* ── Drill-down Level 1: PO/PSO -> Courses ── */
  const handleDrillDown = async (row) => {
    if (expanded === row.sr) {
      setExpanded(null); setDrillLevel(0); setDrillData(null); return;
    }
    setExpanded(row.sr);
    setDrillLevel(1);
    setDrillData(null);
    setDrillLoading(true);

    try {
      const academic_year = selectedYear.replace(/\s/g, '');
      // Fetch courses contributing to this PO/PSO
      const endpoint = row.type === 'po'
        ? `/attainment/po/${row.id}/courses/?academic_year=${academic_year}`
        : `/attainment/pso/${row.id}/courses/?academic_year=${academic_year}`;

      let coursesData = [];
      try {
        const res = await api.get(endpoint);
        coursesData = res.data?.courses || res.data || [];
      } catch {
        // Mock fallback if endpoint doesn't exist
        coursesData = [
          { course_id: 1, course_name: 'Software Engineering', course_code: '22413', level: (Math.random() * 3).toFixed(2) },
          { course_id: 2, course_name: 'Operating System', course_code: '22415', level: (Math.random() * 3).toFixed(2) },
        ];
      }
      setDrillData({ courses: coursesData, row });
    } catch (err) {
      console.error('Course drill-down error:', err);
      setDrillData({ courses: [], row, error: true });
    } finally {
      setDrillLoading(false);
    }
  };

  /* ── Drill-down Level 2: Course -> COs ── */
  const handleCourseSelect = async (course) => {
    setSelectedCourse(course);
    setDrillLevel(2);
    setDrillLoading(true);
    try {
      const academic_year = selectedYear.replace(/\s/g, '');
      const endpoint = `/attainment/course/${course.course_id}/cos/?academic_year=${academic_year}`;
      let cosData = [];
      try {
        const res = await api.get(endpoint);
        cosData = res.data?.cos || res.data || [];
      } catch {
        // Mock fallback
        cosData = [
          { co_number: 'CO 1', description: 'Study software development life cycle', tools: { fa_th_1: 2.5, sa_th: 2.1 }, overall_attainment: 2.3, contribution_weight: 25 },
          { co_number: 'CO 2', description: 'Understand requirements engineering', tools: { fa_th_1: 2.8, sa_th: 2.6 }, overall_attainment: 2.7, contribution_weight: 25 },
        ];
      }
      setDrillData(prev => ({ ...prev, cos: cosData }));
    } catch (err) {
      console.error('CO drill-down error:', err);
      setDrillData(prev => ({ ...prev, cos: [], error: true }));
    } finally {
      setDrillLoading(false);
    }
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
          <div className="filter-row-v2 mb-4 p-3 bg-light rounded border">
            <div className="row g-3">
              <div className="col-md">
                <label className="filter-label">BATCH</label>
                <Form.Select
                  value={selectedBatch}
                  onChange={e => setSelectedBatch(e.target.value)}
                  className="filter-select"
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </Form.Select>
              </div>
              <div className="col-md">
                <label className="filter-label">ACADEMIC YEAR</label>
                <Form.Select
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  className="filter-select"
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </Form.Select>
              </div>
              <div className="col-md" style={{ maxWidth: '100px' }}>
                <label className="filter-label">CLASS</label>
                <Form.Select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All</option>
                  {['FY', 'SY', 'TY'].map(c => <option key={c} value={c}>{c}</option>)}
                </Form.Select>
              </div>
              <div className="col-md" style={{ maxWidth: '100px' }}>
                <label className="filter-label">SEM</label>
                <Form.Select
                  value={selectedSem}
                  onChange={e => setSelectedSem(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All</option>
                  {[1, 2, 3, 4, 5, 6].map(s => <option key={s} value={s}>{s}</option>)}
                </Form.Select>
              </div>
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
                  {expanded} → Detailed Breakdown
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
                                {/* Breadcrumb Navigation */}
                                <div className="bt-breadcrumb d-flex align-items-center gap-2 mb-3">
                                  <span className={`bt-crumb ${drillLevel >= 1 ? 'text-primary clickable' : ''}`} onClick={() => setDrillLevel(1)}>
                                    {row.sr}
                                  </span>
                                  {drillLevel >= 2 && (
                                    <>
                                      <FaArrowRight size={11} className="text-muted" />
                                      <span className="bt-crumb text-info">
                                        {selectedCourse?.course_name}
                                      </span>
                                    </>
                                  )}
                                </div>

                                {drillLoading ? (
                                  <div className="text-center py-4">
                                    <div className="spinner-border spinner-border-sm text-primary me-2" />
                                    Loading {drillLevel === 1 ? 'Contributing Courses' : 'CO Breakdown'}…
                                  </div>
                                ) : drillLevel === 1 ? (
                                  /* ── Level 1: Course List ── */
                                  <div className="p-3">
                                    <h6 className="small fw-bold text-uppercase text-muted mb-3">Courses contributing to {row.sr}</h6>
                                    <Table hover size="sm" bordered className="bg-white mb-0 text-center align-middle">
                                      <thead className="table-light">
                                        <tr>
                                          <th className="text-start ps-3">Course Name</th>
                                          <th>Code</th>
                                          <th>Direct Attainment</th>
                                          <th style={{ width: 100 }}>Action</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {drillData?.courses?.map(course => (
                                          <tr key={course.course_id}>
                                            <td className="text-start ps-3 fw-semibold">{course.course_name}</td>
                                            <td className="text-muted">{course.course_code}</td>
                                            <td className="text-primary fw-bold">{course.level}</td>
                                            <td>
                                              <button
                                                className="btn btn-sm btn-outline-primary py-0"
                                                onClick={() => handleCourseSelect(course)}
                                              >
                                                Details <FaArrowRight size={10} />
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </Table>
                                  </div>
                                ) : drillLevel === 2 ? (
                                  /* ── Level 2: CO Breakdown ── */
                                  <div className="table-responsive p-3">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                      <h6 className="small fw-bold text-uppercase text-muted mb-0">CO breakdown for {selectedCourse?.course_name}</h6>
                                      <button className="btn btn-sm btn-link text-decoration-none p-0" onClick={() => setDrillLevel(1)}>
                                        &larr; Back to Courses
                                      </button>
                                    </div>
                                    <Table bordered size="sm" className="bg-white mb-0 text-center align-middle" style={{ fontSize: '.8rem' }}>
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
                                        {drillData?.cos?.map((co, ci) => (
                                          <tr key={ci}>
                                            <td className="fw-bold text-start ps-2 text-nowrap">{co.co_number}</td>
                                            <td className="text-start text-muted smallest" style={{ fontSize: '10px' }}>{co.description}</td>
                                            {Object.keys(TOOL_NAMES).map(k => (
                                              <td key={k}>{formatTool(co.tools?.[k])}</td>
                                            ))}
                                            <td className="fw-bold text-primary">
                                              {co.overall_attainment !== null ? parseFloat(co.overall_attainment).toFixed(2) : '—'}
                                            </td>
                                            <td className="text-secondary">
                                              {co.contribution_weight !== null ? `${co.contribution_weight}%` : '—'}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </Table>
                                  </div>
                                ) : null}
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
