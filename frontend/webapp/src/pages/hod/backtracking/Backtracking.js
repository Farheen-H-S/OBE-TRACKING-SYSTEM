import React, { useState, useEffect } from 'react';
import api from '../../../utils/axios';
import { useFilters } from '../../../context/FilterContext';
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

const Backtracking = ({ isDashboard = false }) => {
  const { selectedDept, selectedYear, selectedBatch, selectedClass, selectedSemester: selectedSem } = useFilters();

  const [tableData, setTableData] = useState([]);
  const [summary, setSummary] = useState({ achieved: 0, target: 0, gap: 0 });
  const [loading, setLoading] = useState(false);

  // Drill-down state: which row is expanded + its detail data
  const [expanded, setExpanded] = useState(null);   // label string e.g. "PO 1"
  const [drillLevel, setDrillLevel] = useState(0);  // 0: PO list, 1: Course list, 2: CO list
  const [drillData, setDrillData] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [selectedToolDetail, setSelectedToolDetail] = useState(null);

  useEffect(() => { if (selectedDept) fetchData(); }, [selectedDept, selectedBatch, selectedYear, selectedClass, selectedSem]);

  /* ── Main summary table data ── */
  const fetchData = async () => {
    setLoading(true);
    setExpanded(null); setDrillLevel(0); setDrillData(null);
    try {
      const academic_year = selectedYear.replace(/\s/g, '');
      const params = { program_id: selectedDept, academic_year };
      if (selectedBatch) params.batch_id = selectedBatch;
      if (selectedClass) params.course_class = selectedClass;
      if (selectedSem) params.semester = selectedSem;

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
      let endpoint = row.type === 'po'
        ? `/attainment/po/${row.id}/courses/?academic_year=${academic_year}`
        : `/attainment/pso/${row.id}/courses/?academic_year=${academic_year}`;
      if (selectedBatch) endpoint += `&batch_id=${selectedBatch}`;
      if (selectedClass) endpoint += `&course_class=${selectedClass}`;
      if (selectedSem) endpoint += `&semester=${selectedSem}`;

      const res = await api.get(endpoint);
      const coursesData = res.data?.courses || res.data || [];
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
      const parentRow = drillData?.row;
      let endpoint = `/attainment/course/${course.course_id}/cos/?academic_year=${academic_year}`;
      if (selectedBatch) endpoint += `&batch_id=${selectedBatch}`;
      if (selectedClass) endpoint += `&course_class=${selectedClass}`;
      if (selectedSem) endpoint += `&semester=${selectedSem}`;

      if (parentRow) {
        if (parentRow.type === 'po') endpoint += `&po_id=${parentRow.id}`;
        else if (parentRow.type === 'pso') endpoint += `&pso_id=${parentRow.id}`;
      }

      const res = await api.get(endpoint);
      const cosData = res.data?.cos || res.data || [];
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

  const formatTool = (val, details, toolKey) => {
    if (val === null || val === undefined || val === '') return <span className="text-muted small">—</span>;
    const isLevel = typeof val === 'number';
    const realVal = typeof val === 'object' ? val.level : val;
    const displayVal = typeof realVal === 'number' ? realVal.toFixed(2) : realVal;

    // If we have details for this tool, make it clickable
    // Check both original and lowercase keys for robustness
    const detailsObj = details?.[toolKey] || details?.[toolKey.toLowerCase()];
    const hasDetails = detailsObj && typeof detailsObj === 'object';

    if (hasDetails) {
      return (
        <span
          className="fw-semibold bt-tool-detail-cell"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedToolDetail({
              name: TOOL_NAMES[toolKey] || toolKey,
              ...detailsObj
            });
          }}
          title="Click for details"
        >
          {displayVal}
        </span>
      );
    }

    return <span className="fw-semibold">{displayVal}</span>;
  };

  return (
    <div className={isDashboard ? "" : "d-flex flex-column vh-100 overflow-hidden"}>
      <div className={isDashboard ? "" : "flex-grow-1 p-3 bg-light overflow-y-auto"}>
        <Container fluid className={isDashboard ? "p-0" : "bg-white p-4 shadow-sm rounded border-0 h-100"}>

          {!isDashboard && (
            <>
              <h4 className="fw-bold mb-1" style={{ color: '#1a237e' }}>Attainment Backtracking</h4>
              <p className="text-muted small mb-4">
                Drill-down from PO / PSO → contributing COs → tool scores to trace how attainment was computed.
              </p>
            </>
          )}


          {/* ── Summary cards ── */}
          <div className="mb-4">
            <h6 className="fw-bold text-primary mb-3">Attainment Summary</h6>
            {loading ? (
              <div className="text-muted small">Fetching data…</div>
            ) : !selectedDept ? (
              <div className="text-muted small">Please select a department to view attainment.</div>
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
                {tableData.length > 0 && (
                  <div className={`ms-2 px-3 py-2 rounded-pill fw-bold d-flex align-items-center gap-2
                                      ${parseFloat(summary.gap) <= 0 ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                    <i className={`bi ${parseFloat(summary.gap) <= 0 ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`}></i>
                    Status: {parseFloat(summary.gap) <= 0 ? 'Target Met' : 'Not Met'}
                  </div>
                )}
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
                                        {(() => {
                                          const courses = drillData?.courses || [];
                                          const minLevel = courses.length > 0 ? Math.min(...courses.map(c => parseFloat(c.level) || 0)) : null;
                                          return courses.map(course => {
                                            const isLowest = minLevel !== null && parseFloat(course.level) === minLevel;
                                            return (
                                              <tr key={course.course_id} className={isLowest ? 'bt-highlight-lowest' : ''}>
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
                                            );
                                          });
                                        })()}
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
                                          <th title="Contribution Weight: Mapping strength of this CO to the parent PO/PSO (1=Normal, 2=Medium, 3=High)">
                                            Weight
                                            <span className="ms-1 text-muted small" style={{ cursor: 'help' }}>(?)</span>
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(() => {
                                          const cos = drillData?.cos || [];
                                          const toolKeys = Object.keys(TOOL_NAMES);

                                          // Find the tool with the lowest average attainment across COs
                                          const toolAverages = {};
                                          toolKeys.forEach(k => {
                                            const vals = cos.map(co => {
                                              const v = co.tools?.[k];
                                              return (typeof v === 'object' ? v.level : v);
                                            }).filter(v => v !== null && v !== undefined && v !== '' && v !== '—' && v !== '-');

                                            if (vals.length > 0) {
                                              toolAverages[k] = vals.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / vals.length;
                                            }
                                          });

                                          const activeKeys = Object.keys(toolAverages);
                                          const minAvg = activeKeys.length > 0 ? Math.min(...activeKeys.map(k => toolAverages[k])) : null;
                                          const lowestToolKey = minAvg !== null ? activeKeys.find(k => toolAverages[k] === minAvg) : null;

                                          return cos.map((co, ci) => (
                                            <tr key={ci}>
                                              <td className="fw-bold text-start ps-2 text-nowrap">{co.co_number}</td>
                                              <td className="text-start text-muted smallest" style={{ fontSize: '10px' }}>{co.description}</td>
                                              {toolKeys.map(k => (
                                                <td key={k} className={k === lowestToolKey ? 'bt-highlight-lowest' : ''}>
                                                  {formatTool(co.tools?.[k], co.tools?.tool_details, k)}
                                                </td>
                                              ))}
                                              <td className="fw-bold text-primary">
                                                {co.overall_attainment !== null ? parseFloat(co.overall_attainment).toFixed(2) : '—'}
                                              </td>
                                              <td className="text-secondary">
                                                {co.contribution_weight !== null ? `${co.contribution_weight}%` : '—'}
                                              </td>
                                            </tr>
                                          ));
                                        })()}
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

      {/* Tool Detail Modal */}
      {selectedToolDetail && (
        <div className="bt-stats-overlay" onClick={() => setSelectedToolDetail(null)}>
          <div className="bt-stats-modal" onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 text-primary">{selectedToolDetail.name} Attainment Details</h5>
              <button className="btn-close" onClick={() => setSelectedToolDetail(null)}></button>
            </div>
            <table className="bt-stats-table">
              <tbody>
                <tr>
                  <th>Students Appeared</th>
                  <td>{selectedToolDetail.appeared}</td>
                </tr>
                <tr>
                  <th>Success (&ge; Avg)</th>
                  <td>{selectedToolDetail.success}</td>
                </tr>
                <tr>
                  <th>Percentage</th>
                  <td>{parseFloat(selectedToolDetail.percentage).toFixed(2)}%</td>
                </tr>
                <tr className="border-top">
                  <th className="pt-2">Attainment Level</th>
                  <td className="pt-2 text-primary fs-5">{parseFloat(selectedToolDetail.level).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-4 text-center">
              <button className="btn btn-sm btn-primary px-4" onClick={() => setSelectedToolDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Backtracking;
