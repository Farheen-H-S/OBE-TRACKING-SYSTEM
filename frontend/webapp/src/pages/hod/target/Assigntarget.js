import React, { useState, useEffect } from 'react';
import Header from '../../../components/header/Header';
import HodSide from '../../../components/sidebar/HodSide';
import api from '../../../utils/axios';
import './Assigntarget.css';
import { getDefaultSemester, getCachedSemesterType } from '../../../utils/semesterUtils';

const Assigntarget = () => {
  const [courses, setCourses] = useState([]);
  const [pos, setPos] = useState([]);
  const [psos, setPsos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('course'); // 'course' or 'program'
  const [isEditing, setIsEditing] = useState(false);
  const [showAttainmentTables, setShowAttainmentTables] = useState(false);


  // New Filter States
  const [departments, setDepartments] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [years, setYears] = useState(['2024 - 25', '2025 - 26', '2026 - 27']); // Match screenshot format
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedScheme, setSelectedScheme] = useState('');
  const [selectedYear, setSelectedYear] = useState('2025 - 26');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('A');
  const [selectedSem, setSelectedSem] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const CLASS_OPTIONS = ['FY', 'SY', 'TY'];

  // getSemesterOptions replaced by semesterUtils
  const [semesterOptions, setSemesterOptions] = useState(['1', '2', '3', '4', '5', '6']);

  // Auto-update semester when class changes based on admin semester_type
  useEffect(() => {
    if (selectedClass) {
      const semType = getCachedSemesterType();
      setSelectedSem(getDefaultSemester(selectedClass, semType));
    }
  }, [selectedClass]);

  useEffect(() => {
    fetchInitialFilters();
  }, []);

  useEffect(() => {
    // fetchData should run if dept and year are present, scheme can be empty (meaning 'All')
    if (selectedDept && selectedYear) {
      fetchData();
    }
  }, [selectedDept, selectedScheme, selectedYear]);

  const fetchInitialFilters = async () => {
    try {
      const [deptRes, schemeRes] = await Promise.all([
        api.get('/academics/programs/'),
        api.get('/academics/schemes/list/')
      ]);
      setDepartments(deptRes.data);
      setSchemes(schemeRes.data);

      const user = JSON.parse(localStorage.getItem('user'));
      const userDeptValue = user?.department || user?.department_id;

      let foundDeptId = '';
      if (userDeptValue) {
        // Find the numeric ID if the value is a name or existing ID
        const dept = deptRes.data.find(d =>
          String(d.program_id) === String(userDeptValue) ||
          d.program_name === userDeptValue
        );
        if (dept) foundDeptId = dept.program_id;
      }

      if (foundDeptId) {
        setSelectedDept(foundDeptId);
      } else if (deptRes.data.length > 0) {
        setSelectedDept(deptRes.data[0].program_id);
      }

      // Default to "All Schemes" initially to show more courses
      setSelectedScheme('');

      setSelectedYear('2025 - 26');
      setSelectedClass('');
      setSemesterOptions([]);
      setSelectedSem('');
    } catch (err) {
      console.error("Error fetching filters:", err);
    }
  };


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
        safeGet('/academics/courses/'),
        safeGet('/academics/cos/'),
        safeGet('/academics/pos/', { params: { program_id: selectedDept } }),
        safeGet('/academics/psos/', { params: { program_id: selectedDept } }),
        safeGet('/academics/schemes/list/'),
        safeGet('/academics/targets/', { params: { academic_year } }),
        safeGet('/attainment/co/', { params }),
        safeGet('/attainment/po/', { params }),
        safeGet('/attainment/pso/', { params })
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
      attainmentPoObj?.['PO attainment']?.forEach(a => {
        poAttainmentMap[a.po_id] = a;
      });

      const psoAttainmentMap = {};
      attainmentPsoObj?.['PSO attainment']?.forEach?.(a => {
        psoAttainmentMap[a.pso_id] = a;
      });

      const formattedCourses = coursesArr
        .filter(c => String(c.program_id) === String(selectedDept)) // Critical: Only show courses for current program
        .map(c => {
          const tVal = coTargetMap[String(c.course_id)] || '0';
          const cosForCourse = coArr.filter(co => String(co.course_id) === String(c.course_id));
          const levels = cosForCourse.map(co => coAttainmentMap[co.co_id]?.overall_attainment).filter(l => l !== undefined);
          const aLevel = levels.length > 0 ? (levels.reduce((a, b) => a + b, 0) / levels.length).toFixed(2) : '-';

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
            targetLevel: tVal,
            achievedLevel: aLevel,
            gap: aLevel === '-' ? '-' : (parseFloat(tVal) - parseFloat(aLevel)).toFixed(2)
          };
        });

      setCourses(formattedCourses);
      setPos(poArr.map(p => {
        const att = poAttainmentMap[p.po_id];
        return {
          ...p,
          targetLevel: poTargetMap[String(p.po_id)] || '2.5', // Fetch from backend or use standard default
          achievedLevel: att ? att.normalized_value.toFixed(2) : '-',
          gap: att ? att.gap.toFixed(2) : '-'
        };
      }));
      setPsos(psoArr.map(p => {
        const att = psoAttainmentMap[p.pso_id];
        return {
          ...p,
          targetLevel: psoTargetMap[String(p.pso_id)] || '2.5',
          achievedLevel: att ? att.normalized_value.toFixed(2) : '-',
          gap: att ? att.gap.toFixed(2) : '-'
        };
      }));

      setLoading(false);
    } catch (err) {
      console.error("Error fetching target data:", err);
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = (course.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.code || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = !selectedDept || String(course.program_id) === String(selectedDept);
    const matchesScheme = !selectedScheme || String(course.scheme_id) === String(selectedScheme);

    // More robust class matching
    const matchesClass = !selectedClass || (course.class_year && selectedClass.includes(course.class_year));
    const matchesSem = !selectedSem || String(course.semester) === String(selectedSem);

    return matchesSearch && matchesDept && matchesScheme && matchesClass && matchesSem;
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

  return (

    <div className="assign-target-container">
      <div className="d-flex w-100">
        <div className="content-area p-4 w-100 bg-light">
          <div className="card shadow-sm border-0 p-4">

            {/* Filter Section */}
            <div className="filter-row-v2 mb-4 p-3 bg-light rounded shadow-none border">
              <div className="row g-3">
                <div className="col-md">
                  <label className="filter-label">DEPARTMENT</label>
                  <select
                    className="form-select filter-select"
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.program_id} value={d.program_id}>{d.program_name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md">
                  <label className="filter-label">SCHEME</label>
                  <select
                    className="form-select filter-select"
                    value={selectedScheme}
                    onChange={(e) => setSelectedScheme(e.target.value)}
                  >
                    <option value="">Select Scheme</option>
                    {schemes.map(s => (
                      <option key={s.scheme_id} value={s.scheme_id}>{s.scheme_name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md">
                  <label className="filter-label">YEAR</label>
                  <select
                    className="form-select filter-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md">
                  <label className="filter-label">CLASS</label>
                  <select
                    className="form-select filter-select"
                    value={selectedClass}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedClass(val);
                      const semType = getCachedSemesterType();
                      const defaultSem = getDefaultSemester(val, semType);
                      setSelectedSem(defaultSem);
                    }}
                  >
                    <option value="">Select Class</option>
                    {CLASS_OPTIONS.map(c => (
                      <option key={c} value={c}>{c} - {selectedDivision}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md" style={{ maxWidth: '100px' }}>
                  <label className="filter-label">DIV</label>
                  <select
                    className="form-select filter-select"
                    value={selectedDivision}
                    onChange={(e) => setSelectedDivision(e.target.value)}
                  >
                    {['A', 'B', 'C', 'D'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md">
                  <label className="filter-label">SEMESTER</label>
                  <select
                    className="form-select filter-select"
                    value={selectedSem}
                    onChange={(e) => setSelectedSem(e.target.value)}
                    disabled={!selectedClass}
                  >
                    <option value="">Select Sem</option>
                    {semesterOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Bar inside filter box */}
              <div className="mt-3">
                <input
                  type="text"
                  className="form-control search-input-v2"
                  placeholder="Search course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', borderRadius: '8px' }}
                />
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="fw-bold m-0" style={{ color: '#1a237e' }}>Target Management</h2>

              <div className="d-flex gap-3 align-items-center">
                <button
                  className="attainment-toggle-btn"
                  onClick={() => setShowAttainmentTables(!showAttainmentTables)}
                >
                  {showAttainmentTables ? 'Hide' : 'Show'} Attainment Levels
                </button>

                {/* Toggle Button Group */}
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

            {showAttainmentTables && (
              <div className="attainment-tables-wrapper">
                <div className="attainment-level-grid">
                  {/* Course Attainment Table */}
                  <div>
                    <h6 className="fw-bold mb-2" style={{ color: '#1a237e' }}>COURSE: % of Students → Attainment Level</h6>
                    <table className="table table-bordered attainment-info-table">
                      <thead>
                        <tr>
                          <th>% of Students</th>
                          <th>Attainment Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td>Greater than 80</td><td>3</td></tr>
                        <tr><td>76 to 80</td><td>2.75</td></tr>
                        <tr><td>71 to 75</td><td>2.5</td></tr>
                        <tr><td>66 to 70</td><td>2.25</td></tr>
                        <tr><td>61 to 65</td><td>2.0</td></tr>
                        <tr><td>56 to 60</td><td>1.75</td></tr>
                        <tr><td>51 to 55</td><td>1.5</td></tr>
                        <tr><td>46 to 50</td><td>1.25</td></tr>
                        <tr><td>20 to 45</td><td>1</td></tr>
                        <tr><td>Less than 20</td><td>0</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Program Attainment Table */}
                  <div>
                    <h6 className="fw-bold mb-2" style={{ color: '#1a237e' }}>PROGRAM: Score Range → Level</h6>
                    <table className="table table-bordered attainment-info-table">
                      <thead>
                        <tr>
                          <th>Score Range</th>
                          <th>Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td>2.50 to 3</td><td>Very High (3)</td></tr>
                        <tr><td>2.00 to 2.49</td><td>High (2.5)</td></tr>
                        <tr><td>1.50 to 1.99</td><td>Medium (2)</td></tr>
                        <tr><td>1.00 to 1.49</td><td>Low (1.5)</td></tr>
                        <tr><td>Less than 1</td><td>Very Low (1)</td></tr>
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
                <table className="table table-bordered align-middle target-table-refined">
                  <thead>
                    <tr>
                      <th>COURSE CODE</th>
                      <th>COURSE NAME</th>
                      <th>COURSE TITLE</th>
                      <th>ABBR.</th>
                      <th>SCHEME</th>
                      <th>TARGET LEVEL</th>
                      <th>ACHIEVED LEVEL</th>
                      <th>GAP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.map((course, index) => (
                      <tr key={course.id}>

                        <td className="fw-bold">{course.code}</td>
                        <td>{course.name}</td>
                        <td>{course.title}</td>
                        <td>{course.abbr}</td>
                        <td>{course.scheme}</td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="program-view-container">
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
                      {pos.map((p, index) => (
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
                      {psos.map((p, index) => (
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
                <button className="btn btn-primary px-5 py-2 fw-bold" onClick={() => setIsEditing(true)}>
                  Edit Metrics
                </button>
              ) : (
                <>
                  <button className="btn btn-outline-secondary px-5 py-2 fw-bold" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary px-5 py-2 fw-bold" onClick={handleSave}>
                    Save All Metrics
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assigntarget;
