import React, { useState, useEffect } from 'react';
import api from '../../../utils/axios';
import './Assigntarget.css';
import { Modal, Button, Form } from 'react-bootstrap';
import { BsFileEarmarkExcelFill } from 'react-icons/bs';
import { useFilters } from '../../../context/FilterContext';
import { useDebounce } from '../../../utils/useDebounce';

const Assigntarget = () => {
  const {
    selectedDept,
    selectedScheme,
    selectedYear,
    selectedBatch,
    selectedClass,
    selectedSemester: selectedSem,
    loadingFilters,
    validateContext
  } = useFilters();

  const requiredFields = ['dept', 'year'];
  const { isValid, missingFields } = validateContext(requiredFields);

  const [courses, setCourses] = useState([]);
  const [pos, setPos] = useState([]);
  const [psos, setPsos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('course'); // 'course' or 'program'
  const [isEditing, setIsEditing] = useState(false);
  const [showAttainmentTables, setShowAttainmentTables] = useState(false);
  const [showAtrModal, setShowAtrModal] = useState(false);
  const [selectedCourseAtr, setSelectedCourseAtr] = useState(null);
  const [atrText, setAtrText] = useState('');
  const [savingAtr, setSavingAtr] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (selectedDept && selectedYear) {
      fetchData();
    }
  }, [selectedDept, selectedScheme, selectedYear]);


  const fetchData = async () => {
    if (!selectedDept || !selectedYear) return;
    try {
      setLoading(true);
      const academic_year = selectedYear.replace(/\s/g, '');
      const params = {
        program_id: selectedDept,
        academic_year: academic_year
      };

      // Helper for resilient individual fetches
      const safeGet = async (url, config = {}) => {
        try {
          const res = await api.get(url, config);
          return res.data;
        } catch (err) {
          console.warn(`Soft fail on ${url}:`, err);
          return null;
        }
      };

      const [
        courseDataArr, coDataArr, poDataArr, psoDataArr,
        schemeDataArr, targetDataArr,
        attainmentCoObj, attainmentPoObj, attainmentPsoObj
      ] = await Promise.all([
        safeGet('/academics/courses/', { params: { program_id: selectedDept } }),
        safeGet('/academics/cos/'),
        safeGet('/academics/pos/', { params: { program_id: selectedDept } }),
        safeGet('/academics/psos/', { params: { program_id: selectedDept } }),
        safeGet('/academics/schemes/list/'),
        safeGet('/academics/targets/', { params: { academic_year } }),
        safeGet('/attainment/co/', { params }),
        selectedBatch && selectedBatch !== 'All' 
          ? safeGet('/attainment/po/batch/', { params: { ...params, batch_id: selectedBatch } })
          : safeGet('/attainment/po/', { params }),
        selectedBatch && selectedBatch !== 'All'
          ? safeGet('/attainment/pso/batch/', { params: { ...params, batch_id: selectedBatch } })
          : safeGet('/attainment/pso/', { params })
      ]);

      const coursesArr = courseDataArr || [];
      const coArr = coDataArr || [];
      const poArr = poDataArr || [];
      const psoArr = psoDataArr || [];
      const schemeArr = schemeDataArr || [];
      // Updated: Target data structure now contains co_targets, po_targets, pso_targets
      const targetObj = targetDataArr || { co_targets: [] };
      const coTargetsArr = targetObj.co_targets || [];
      const poTargetsArr = targetObj.po_targets || [];
      const psoTargetsArr = targetObj.pso_targets || [];

      const schemeMap = {};
      schemeArr.forEach(s => {
        schemeMap[String(s.scheme_id)] = s.scheme_name;
      });

      const coTargetMap = {};
      coTargetsArr.forEach(t => {
        const cId = t.course_id || t.course || (t.co_id?.course_id) || t.co_id;
        if (cId) {
          coTargetMap[String(cId)] = t.target_value;
        }
      });

      const poTargetMap = {};
      poTargetsArr.forEach(t => poTargetMap[String(t.po_id)] = t.target_value);

      const psoTargetMap = {};
      psoTargetsArr.forEach(t => psoTargetMap[String(t.pso_id)] = t.target_value);

      const coAttainmentMap = {};
      attainmentCoObj?.['CO attainment']?.forEach(a => {
        coAttainmentMap[a.co_id] = a;
      });

      const poAttainmentMap = {};
      const poBatchData = attainmentPoObj?.['PO batch attainment'] || attainmentPoObj?.['PO attainment'] || [];
      poBatchData.forEach(a => {
        poAttainmentMap[a.po_id] = a;
      });

      const psoAttainmentMap = {};
      const psoBatchData = attainmentPsoObj?.['PSO batch attainment'] || attainmentPsoObj?.['PSO attainment'] || [];
      psoBatchData.forEach(a => {
        psoAttainmentMap[a.pso_id] = a;
      });

      const formattedCourses = coursesArr
        .filter(c => String(c.program_id) === String(selectedDept))
        .map(c => {
          const tVal = coTargetMap[String(c.course_id)] || '0';
          const cosForCourse = coArr.filter(co => String(co.course_id) === String(c.course_id));
          const levels = cosForCourse.map(co => coAttainmentMap[co.co_id]?.overall_attainment).filter(l => l !== undefined);
          const aLevel = levels.length > 0 ? (levels.reduce((a, b) => a + b, 0) / levels.length).toFixed(2) : '-';
          const gapVal = aLevel === '-'
            ? (parseFloat(tVal) - 0).toFixed(2)
            : (parseFloat(tVal) - parseFloat(aLevel)).toFixed(2);

          return {
            id: c.course_id,
            code: c.course_code,
            name: c.course_name,
            title: c.course_title || '-',
            abbr: c.course_abbr || '-',
            scheme: schemeMap[String(c.scheme_id)] || '-',
            scheme_id: c.scheme_id,
            program_id: c.program_id,
            semester: String(c.semester),
            class_year: c.class_year,
            batch_list: c.batch_list || [],
            targetLevel: tVal,
            achievedLevel: aLevel,
            gap: gapVal,
            course_atr: c.course_atr || '',
            co_status: c.co_status || 'PENDING',
            mapping_status: c.mapping_status || 'PENDING'
          };
        });

      setCourses(formattedCourses);
      setPos(poArr.map(p => {
        const att = poAttainmentMap[p.po_id];
        const tVal = poTargetMap[String(p.po_id)] || '0';
        const aVal = att ? (att.normalized_value || att.attainment_value || 0).toFixed(2) : '-';
        return {
          ...p,
          targetLevel: tVal,
          achievedLevel: aVal,
          gap: aVal === '-' ? (parseFloat(tVal) - 0).toFixed(2) : (att.gap !== undefined ? att.gap.toFixed(2) : (parseFloat(tVal) - parseFloat(aVal)).toFixed(2))
        };
      }));
      setPsos(psoArr.map(p => {
        const att = psoAttainmentMap[p.pso_id];
        const tVal = psoTargetMap[String(p.pso_id)] || '0';
        const aVal = att ? (att.normalized_value || att.attainment_value || 0).toFixed(2) : '-';
        return {
          ...p,
          targetLevel: tVal,
          achievedLevel: aVal,
          gap: aVal === '-' ? (parseFloat(tVal) - 0).toFixed(2) : (att.gap !== undefined ? att.gap.toFixed(2) : (parseFloat(tVal) - parseFloat(aVal)).toFixed(2))
        };
      }));

      setLoading(false);
    } catch (err) {
      console.error("Error fetching target data:", err);
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = (course.name || "").toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (course.code || "").toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (course.title || "").toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (course.abbr || "").toLowerCase().includes(debouncedSearchTerm.toLowerCase());

    const matchesDept = !selectedDept || selectedDept === 'All' || String(course.program_id) === String(selectedDept);
    const matchesScheme = !selectedScheme || selectedScheme === 'All' || String(course.scheme_id) === String(selectedScheme);

    // If a specific batch/class/sem is selected, try to match but don't hide everything if it's broad
    const matchesClass = !selectedClass || selectedClass === 'All' || (course.class_year && selectedClass.includes(course.class_year));
    const matchesSem = !selectedSem || selectedSem === 'All' || String(course.semester) === String(selectedSem);

    // Batch matching: If no batch selected, or course has no batches (allow assignment), or it matches
    const matchesBatch = !selectedBatch || selectedBatch === 'All' ||
      (course.batch_list && course.batch_list.length === 0) ||
      (course.batch_list && course.batch_list.some(b => String(b) === String(selectedBatch)));

    return matchesSearch && matchesDept && matchesScheme && matchesClass && matchesSem && matchesBatch;
  });


  const handleCourseMetricChange = (courseId, field, value) => {
    console.log(`Input change: courseId=${courseId}, value=${value}`);
    if (field === 'targetLevel') {
      if (value !== '' && value !== '.' && (isNaN(value) || parseFloat(value) < 0 || parseFloat(value) > 3)) {
        return;
      }
    }

    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        const updated = { ...c, [field]: value };
        if (field === 'targetLevel') {
          const target = parseFloat(value) || 0;
          const achieved = parseFloat(updated.achievedLevel) || 0;
          updated.gap = isNaN(achieved) ? '-' : (target - achieved).toFixed(2);
        }
        return updated;
      }
      return c;
    }));
  };

  const handlePOMetricChange = (itemId, field, value, type) => {
    if (field === 'targetLevel') {
      if (value !== '' && value !== '.' && (isNaN(value) || parseFloat(value) < 0 || parseFloat(value) > 3)) {
        return;
      }
    }

    const updater = (prev) => prev.map(item => {
      const idKey = type === 'po' ? 'po_id' : 'pso_id';
      if (item[idKey] === itemId) {
        const updated = { ...item, [field]: value };
        const target = parseFloat(value) || 0;
        const achieved = parseFloat(updated.achievedLevel) || 0;
        updated.gap = isNaN(achieved) ? '-' : (target - achieved).toFixed(2);
        return updated;
      }
      return item;
    });

    if (type === 'po') setPos(updater);
    else setPsos(updater);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const ay = selectedYear.replace(/\s/g, '');

      const targetsToSave = courses
        .map(c => ({
          course_id: c.id,
          target_value: c.targetLevel
        }));

      const poTargetsToSave = pos.map(p => ({
        po_id: p.po_id,
        target_value: p.targetLevel
      }));

      const psoTargetsToSave = psos.map(p => ({
        pso_id: p.pso_id,
        target_value: p.targetLevel
      }));

      await api.post('/academics/targets/', {
        targets: targetsToSave,
        po_targets: poTargetsToSave,
        pso_targets: psoTargetsToSave,
        academic_year: ay
      });

      setIsEditing(false);
      alert("Metrics saved successfully!");
      fetchData(); // Refresh data from server
    } catch (err) {
      console.error("Error saving metrics:", err);
      const errorMsg = err.response?.data?.error || err.message || "Unknown error";
      alert(`Failed to save metrics: ${errorMsg}`);
      setLoading(false);
    }
  };



  const getGapClass = (gap) => {
    if (gap === '-' || gap === '' || isNaN(parseFloat(gap))) return 'bg-light';
    const gapVal = parseFloat(gap);
    return gapVal > 0 ? 'gap-high' : 'gap-low';
  };

  const handleOpenAtrModal = (course) => {
    setSelectedCourseAtr(course);
    setAtrText(course.course_atr || 'No ATR Submitted');
    setShowAtrModal(true);
  };

  const handleRequestAtr = async (course) => {
    try {
      // Optional: Add a localized loading indicator if you wish, 
      // but for now an alert provides instant feedback.
      const response = await api.post(`/academics/courses/${course.id}/request-atr/`);
      alert(response.data.message || "ATR notification sent successfully.");
    } catch (err) {
      console.error("Error requesting ATR:", err);
      const errorMsg = err.response?.data?.error || "Failed to send ATR notification.";
      alert(`Error: ${errorMsg}`);
    }
  };

  return (
    <div className="assign-target-container">
      <div className="d-flex w-100 h-100 overflow-hidden">
        <div className="content-area p-4 w-100 bg-light overflow-y-auto">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold m-0" style={{ color: '#1a237e' }}>Target Management</h2>

            <div className="d-flex gap-3 align-items-center">
              <button
                className="attainment-toggle-btn"
                onClick={() => setShowAttainmentTables(!showAttainmentTables)}
              >
                {showAttainmentTables ? 'Hide' : 'Show'} Attainment Levels
              </button>

              <div className="toggle-container-v2">
                <button
                  className={`toggle-btn-v2 ${viewMode === 'course' ? 'active' : ''}`}
                  onClick={() => setViewMode('course')}
                >
                  Course
                </button>
                <button
                  className={`toggle-btn-v2 ${viewMode === 'program' ? 'active' : ''}`}
                  onClick={() => setViewMode('program')}
                >
                  Program
                </button>
              </div>
            </div>
          </div>

          <div className="card shadow-sm border-0 p-4 mb-4">
            {/* Context Filters - Handled by GlobalFilterBar */}


            {!isValid ? (
              <div className="alert alert-warning shadow-sm border-warning d-flex align-items-center gap-3 p-4 mb-0">
                <BsFileEarmarkExcelFill className="text-warning fs-3" />
                <div>
                  <h5 className="fw-bold mb-1">Academic Context Required</h5>
                  <p className="mb-0">Please select the remaining filters in the top bar to proceed: <span className="fw-bold text-dark">{missingFields.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ')}</span></p>
                </div>
              </div>
            ) : (
              <>
                {viewMode === 'course' && (
                  <div className="mb-0">
                    <input
                      type="text"
                      className="form-control search-input-v2"
                      placeholder="Search course..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ width: '100%', borderRadius: '8px' }}
                    />
                    <small className="text-muted mt-1 d-block">
                      <i className="bi bi-info-circle me-1"></i>
                      All courses in this department are shown. Evaluation data (Achieved Level) requires <strong>CO Status</strong> &amp; <strong>Mapping Status</strong> to be <strong>Complete</strong>.
                    </small>
                  </div>
                )}
              </>
            )}
          </div>

          {showAttainmentTables && (
            <div className="attainment-tables-wrapper mb-4">
              <div className="attainment-level-grid">
                <div>
                  <h6 className="fw-bold mb-2" style={{ color: '#1a237e' }}>COURSE: % of Students → Attainment Level</h6>
                  <table className="table table-bordered attainment-info-table">
                    <thead>
                      <tr><th>% of Students</th><th>Level</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>&gt; 80</td><td>3</td></tr>
                      <tr><td>76 - 80</td><td>2.75</td></tr>
                      <tr><td>71 - 75</td><td>2.5</td></tr>
                      <tr><td>66 - 70</td><td>2.25</td></tr>
                      <tr><td>61 - 65</td><td>2.0</td></tr>
                      <tr><td>56 - 60</td><td>1.75</td></tr>
                      <tr><td>51 - 55</td><td>1.5</td></tr>
                      <tr><td>46 - 50</td><td>1.25</td></tr>
                      <tr><td>20 - 45</td><td>1</td></tr>
                      <tr><td>&lt; 20</td><td>0</td></tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <h6 className="fw-bold mb-2" style={{ color: '#1a237e' }}>PROGRAM: Score Range → Level</h6>
                  <table className="table table-bordered attainment-info-table">
                    <thead>
                      <tr><th>Score Range</th><th>Level</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>2.50 to 3</td><td>Very High (3)</td></tr>
                      <tr><td>2.00 to 2.49</td><td>High (2.5)</td></tr>
                      <tr><td>1.50 to 1.99</td><td>Medium (2)</td></tr>
                      <tr><td>1.00 to 1.49</td><td>Low (1.5)</td></tr>
                      <tr><td>&lt; 1</td><td>Very Low (1)</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">Loading data...</div>
          ) : viewMode === 'course' ? (
            <div className="table-responsive">
              <div className="alert alert-info py-2 small mb-2">
                <i className="bi bi-info-circle me-1"></i>
                <strong>Helper Note:</strong> Course Targets change and are evaluated per Semester.
              </div>

              {/* TEMPORARY UI DOM DEBUGGER */}
              <div className="alert alert-secondary border-secondary p-2 mb-3 mt-2" style={{ fontFamily: 'monospace', fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                <strong className="text-dark">Antigravity Debug:</strong><br/>
                Total Fetched Courses: {courses.length}<br/>
                Total Filtered Courses: {filteredCourses.length}<br/>
                Selected Context: Dept={selectedDept}, Scheme={selectedScheme}, Class={selectedClass}, Sem={selectedSem}, Batch={selectedBatch}<br/>
                First Filtered Course Dump: {filteredCourses.length > 0 ? JSON.stringify(filteredCourses[0]) : "None"}<br/>
                First Source Course Dump: {courses.length > 0 ? JSON.stringify(courses[0]) : "None"}
              </div>

              <table className="table table-bordered align-middle target-table-refined">
                <thead>
                  <tr>
                    <th>COURSE CODE</th>
                    <th>COURSE NAME</th>
                    <th>COURSE TITLE</th>
                    <th>STATUS</th>
                    <th>TARGET LEVEL</th>
                    <th>ACHIEVED LEVEL</th>
                    <th>GAP</th>
                    <th>ATR</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => (
                    <tr key={course.id}>
                      <td className="fw-bold">{course.code}</td>
                      <td>{course.name}</td>
                      <td>{course.title}</td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <span className={`badge ${course.co_status === 'COMPLETED' ? 'bg-success' : 'bg-warning text-dark'}`} style={{ fontSize: '10px' }}>
                            CO: {course.co_status}
                          </span>
                          <span className={`badge ${course.mapping_status === 'COMPLETED' ? 'bg-success' : 'bg-warning text-dark'}`} style={{ fontSize: '10px' }}>
                            MAP: {course.mapping_status}
                          </span>
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control text-center metric-input"
                          value={course.targetLevel}
                          readOnly={!isEditing}
                          onChange={(e) => handleCourseMetricChange(course.id, 'targetLevel', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control text-center metric-input bg-light"
                          value={course.achievedLevel}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={`form-control text-center metric-input ${getGapClass(course.gap)}`}
                          value={course.gap}
                          readOnly
                        />
                      </td>
                      <td className="text-center">
                        <div className="d-flex align-items-center justify-content-center gap-2">
                          {(course.course_atr && course.course_atr !== "No ATR Submitted") ? (
                            <button
                              className="btn btn-sm btn-outline-primary border-0 fw-bold d-flex align-items-center gap-1"
                              onClick={() => handleOpenAtrModal(course)}
                            > View ATR
                            </button>
                          ) : (
                            <div className="d-flex flex-column align-items-center gap-1">
                              <span className="text-danger small fw-bold">No ATR Submitted</span>
                              <button
                                className="btn btn-sm btn-outline-primary fw-bold py-0"
                                style={{ fontSize: '11px' }}
                                onClick={() => handleRequestAtr(course)}
                              >
                                Request ATR
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="program-view-container">
              <div className="alert alert-info py-2 small mb-3">
                <i className="bi bi-info-circle me-1"></i>
                <strong>Helper Note:</strong> Program Targets (POs & PSOs) change and are evaluated per Batch.
              </div>
              <h5 className="fw-bold mb-3 text-secondary">Program Outcomes (POs)</h5>
              <div className="table-responsive mb-5">
                <table className="table table-bordered align-middle target-table-refined">
                  <thead>
                    <tr>
                      <th style={{ width: '10%' }}>PO NUM</th>
                      <th style={{ width: '40%' }}>PO STATEMENT</th>
                      <th style={{ width: '15%' }}>TARGET LEVEL</th>
                      <th style={{ width: '15%' }}>ACHIEVED LEVEL</th>
                      <th style={{ width: '15%' }}>GAP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pos.map((p) => (
                      <tr key={p.po_id}>
                        <td className="fw-bold text-center">{p.po_number}</td>
                        <td className="text-wrap-cell">{p.description}</td>
                        <td>
                          <input
                            type="text"
                            className="form-control text-center metric-input"
                            value={p.targetLevel}
                            readOnly={!isEditing}
                            onChange={(e) => handlePOMetricChange(p.po_id, 'targetLevel', e.target.value, 'po')}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control text-center metric-input bg-light"
                            value={p.achievedLevel}
                            readOnly
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className={`form-control text-center metric-input ${getGapClass(p.gap)}`}
                            value={p.gap}
                            readOnly
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h5 className="fw-bold mb-3 text-secondary">Program Specific Outcomes (PSOs)</h5>
              <div className="table-responsive">
                <table className="table table-bordered align-middle target-table-refined">
                  <thead>
                    <tr>
                      <th style={{ width: '10%' }}>PSO NUM</th>
                      <th style={{ width: '40%' }}>PSO STATEMENT</th>
                      <th style={{ width: '15%' }}>TARGET LEVEL</th>
                      <th style={{ width: '15%' }}>ACHIEVED LEVEL</th>
                      <th style={{ width: '15%' }}>GAP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {psos.map((p) => (
                      <tr key={p.pso_id}>
                        <td className="fw-bold text-center">{p.pso_number}</td>
                        <td className="text-wrap-cell">{p.description}</td>
                        <td>
                          <input
                            type="text"
                            className="form-control text-center metric-input"
                            value={p.targetLevel}
                            readOnly={!isEditing}
                            onChange={(e) => handlePOMetricChange(p.pso_id, 'targetLevel', e.target.value, 'pso')}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control text-center metric-input bg-light"
                            value={p.achievedLevel}
                            readOnly
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className={`form-control text-center metric-input ${getGapClass(p.gap)}`}
                            value={p.gap}
                            readOnly
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="text-center mt-4 d-flex justify-content-center gap-3">
            {!isEditing ? (
              <button className="btn btn-outline-primary px-5 py-2 fw-bold shadow-sm" onClick={() => setIsEditing(true)}>
                Edit Metrics
              </button>
            ) : (
              <>
                <button className="btn btn-outline-secondary px-5 py-2 fw-bold shadow-sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button className="btn btn-outline-primary px-5 py-2 fw-bold shadow-sm" onClick={handleSave}>
                  Save All Metrics
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <Modal show={showAtrModal} onHide={() => setShowAtrModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title style={{ color: '#1a237e' }}>
            Consolidated ATR: {selectedCourseAtr?.name} ({selectedCourseAtr?.code})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Action Taken / Proposed Report (ATR)</Form.Label>
            <p className="text-muted small">
              This is the ATR submitted.
            </p>
            <div className="p-3 bg-light border rounded text-dark" style={{ whiteSpace: 'pre-wrap', minHeight: '100px' }}>
              {atrText}
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAtrModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Assigntarget;
