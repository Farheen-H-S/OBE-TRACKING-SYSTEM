import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Row, Col, Card } from 'react-bootstrap';
import api from '../../../utils/axios';
import './COPOmapping.css';
import { getDefaultSemester, getCachedSemesterType } from '../../../utils/semesterUtils';

const COPOmapping = () => {
    // Data states
    const [programs, setPrograms] = useState([]);
    const [courses, setCourses] = useState([]);
    const [schemes, setSchemes] = useState([]);
    const [pos, setPos] = useState([]);
    const [psos, setPsos] = useState([]);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [average, setAverage] = useState({});
    const [isEditing, setIsEditing] = useState(false);

    // Filter states
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedScheme, setSelectedScheme] = useState('');
    const [selectedYear, setSelectedYear] = useState('2025-26');
    const [selectedClass, setSelectedClass] = useState('FY');
    const [selectedDivision, setSelectedDivision] = useState('A');
    const [selectedSemester, setSelectedSemester] = useState(() => getDefaultSemester('FY', getCachedSemesterType()));
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [existingCoursesAll, setExistingCoursesAll] = useState([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [progRes, schemeRes, setupRes] = await Promise.all([
                api.get('/academics/programs/'),
                api.get('/academics/schemes/list/'),
                api.get('/academics/academic-setup/')
            ]);
            setPrograms(progRes.data);
            setSchemes(schemeRes.data);
            if (setupRes.data) {
                setSelectedYear(setupRes.data.academic_year);
                setSelectedScheme(setupRes.data.scheme_id);
                localStorage.setItem('academicSetup', JSON.stringify(setupRes.data));
                setSelectedSemester(getDefaultSemester('FY', setupRes.data.semester_type || 'Odd'));
            }

            // Set default program based on user dept
            const user = JSON.parse(localStorage.getItem('user'));
            const userDept = user?.department_id || user?.department;
            const matched = progRes.data.find(p => p.program_id === parseInt(userDept));
            if (matched) setSelectedProgram(matched.program_id);
            else if (progRes.data.length > 0) setSelectedProgram(progRes.data[0].program_id);

            setLoading(false);

            // Fetch all courses for search bar
            const courseRes = await api.get('/academics/courses/');
            setExistingCoursesAll(courseRes.data);
        } catch (err) {
            console.error("Error fetching mapping data:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedProgram) {
            fetchCourses();
        }
    }, [selectedProgram, selectedSemester, selectedClass, selectedDivision, selectedScheme, selectedYear]);

    // Auto-update semester when class changes based on admin semester_type
    useEffect(() => {
        const semType = getCachedSemesterType();
        setSelectedSemester(getDefaultSemester(selectedClass, semType));
    }, [selectedClass]);

    const getSemesterOptions = () => {
        if (selectedClass === 'FY') return ['1', '2'];
        if (selectedClass === 'SY') return ['3', '4'];
        if (selectedClass === 'TY') return ['5', '6'];
        return [];
    };

    const handleClassChange = (newClass) => {
        setSelectedClass(newClass);
        const sems = newClass === 'FY' ? ['1', '2'] : newClass === 'SY' ? ['3', '4'] : ['5', '6'];
        if (!sems.includes(selectedSemester)) {
            setSelectedSemester(sems[0]);
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await api.get('/academics/courses/', {
                params: {
                    program_id: selectedProgram,
                    semester: selectedSemester,
                    class_year: selectedClass,
                    division: selectedDivision,
                    scheme_id: selectedScheme,
                    academic_year: selectedYear
                }
            });
            setCourses(response.data);

            // Result of filter change: should reset selected course unless it exists in new list
            if (selectedCourse && !response.data.some(c => c.course_id === selectedCourse.course_id)) {
                handleCourseChange("");
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
        }
    };

    const handleCourseChange = async (courseId) => {
        if (!courseId) {
            setSelectedCourse(null);
            setRows([]);
            setPos([]);
            setPsos([]);
            setIsEditing(false);
            return;
        }

        const course = existingCoursesAll.find(c => c.course_id === parseInt(courseId));
        if (!course) return;

        // Auto-sync filters to match the selected course
        if (course.program_id !== selectedProgram) setSelectedProgram(course.program_id);
        if (course.scheme_id !== selectedScheme) setSelectedScheme(course.scheme_id);
        if (course.class_year !== selectedClass) setSelectedClass(course.class_year);
        if (course.semester.toString() !== selectedSemester) setSelectedSemester(course.semester.toString());
        setSelectedCourse(course);
        setIsEditing(false);

        try {
            // Fetch filtered POs and PSOs for the course's program
            const [poRes, psoRes, coRes, mappingRes] = await Promise.all([
                api.get('/academics/pos/', { params: { program_id: course.program_id } }),
                api.get('/academics/psos/', { params: { program_id: course.program_id } }),
                api.get(`/academics/courses/${courseId}/cos/`),
                api.get('/academics/mappings/', { params: { course_id: courseId } })
            ]);

            setPos(poRes.data);
            setPsos(psoRes.data);

            const mappingMap = {};
            mappingRes.data.forEach(m => {
                const key = m.po_id ? `po${m.po_id}` : `pso${m.pso_id}`;
                if (!mappingMap[m.co_id]) mappingMap[m.co_id] = {};
                mappingMap[m.co_id][key] = m.weightage;
            });

            const newRows = coRes.data.map(co => {
                const row = { co_id: co.co_id, co_number: co.co_number };
                poRes.data.forEach(p => row[`po${p.po_id}`] = mappingMap[co.co_id]?.[`po${p.po_id}`] || '');
                psoRes.data.forEach(p => row[`pso${p.pso_id}`] = mappingMap[co.co_id]?.[`pso${p.pso_id}`] || '');
                return row;
            });
            setRows(newRows);
            calculateAverages(newRows, poRes.data, psoRes.data);
        } catch (err) {
            console.error("Error fetching COs/Mappings:", err);
        }
    };

    const calculateAverages = (currentRows, currentPos, currentPsos) => {
        const newAverage = {};
        currentPos.forEach(p => {
            const values = currentRows.map(r => parseFloat(r[`po${p.po_id}`])).filter(v => !isNaN(v));
            newAverage[`po${p.po_id}`] = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : '';
        });
        currentPsos.forEach(p => {
            const values = currentRows.map(r => parseFloat(r[`pso${p.pso_id}`])).filter(v => !isNaN(v));
            newAverage[`pso${p.pso_id}`] = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : '';
        });
        setAverage(newAverage);
    };

    const handleInputChange = (index, field, value) => {
        // Validation: Only allow 0, 1, 2, 3 or empty string
        if (value !== '' && !['0', '1', '2', '3'].includes(value)) {
            alert("Please enter a value between 0 and 3.");
            return;
        }
        const newRows = [...rows];
        newRows[index][field] = value;
        setRows(newRows);
        calculateAverages(newRows, pos, psos);
    };

    const handleKeyDown = (e, rowIndex, colIndex) => {
        const key = e.key;
        let nextRow = rowIndex;
        let nextCol = colIndex;
        const totalCols = pos.length + psos.length;

        if (key === 'ArrowUp') {
            if (rowIndex > 0) nextRow = rowIndex - 1;
        } else if (key === 'ArrowDown') {
            if (rowIndex < rows.length - 1) nextRow = rowIndex + 1;
        } else if (key === 'ArrowLeft') {
            if (colIndex > 0) nextCol = colIndex - 1;
        } else if (key === 'ArrowRight') {
            if (colIndex < totalCols - 1) nextCol = colIndex + 1;
        } else {
            return;
        }

        e.preventDefault();
        const nextInput = document.querySelector(`input[data-row="${nextRow}"][data-col="${nextCol}"]`);
        if (nextInput) nextInput.focus();
    };

    const handleSave = async () => {
        if (!selectedCourse) return;
        try {
            const matrix = [];
            rows.forEach(row => {
                pos.forEach(p => {
                    if (row[`po${p.po_id}`]) {
                        matrix.push({
                            co_id: row.co_id,
                            po_id: p.po_id,
                            weightage: parseFloat(row[`po${p.po_id}`])
                        });
                    }
                });
                psos.forEach(p => {
                    if (row[`pso${p.pso_id}`]) {
                        matrix.push({
                            co_id: row.co_id,
                            pso_id: p.pso_id,
                            weightage: parseFloat(row[`pso${p.pso_id}`])
                        });
                    }
                });
            });

            await api.post('/academics/mappings/', {
                course_id: selectedCourse.course_id,
                mapping_matrix: matrix,
                status: 'COMPLETED'
            });

            // Refresh course data to update status
            fetchCourses();
            setIsEditing(false);
            alert("Mappings saved & completed successfully!");
        } catch (err) {
            console.error("Error saving mappings:", err);
            alert("Error saving mappings.");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="d-flex flex-column vh-100 overflow-hidden co-po-mapping-container">
            <div className="d-flex flex-grow-1 overflow-hidden">
                <div className="flex-grow-1 p-3 bg-light overflow-y-auto">
                    <Container fluid className="bg-white p-4 shadow-sm rounded border-0 h-100 d-flex flex-column">

                        <h4 className="text-left mb-3" style={{ color: '#1a237e', fontWeight: 'bold' }}>3.1 Establish correlation between courses and the POs & PSOs (20)</h4>
                        <h5 className="text-left mb-4" style={{ color: '#3949ab', fontWeight: '600' }}>3.1.2 CO-PO matrices of courses selected in 3.1.1 (5)</h5>

                        {/* Filter Section */}
                        <Card className="border-0 bg-light mb-4 p-3 shadow-sm rounded">
                            <Row className="g-3 align-items-end">
                                <Col md={6} lg={4}>
                                    <span className="filter-label">Department</span>
                                    <Form.Select
                                        className="filter-select"
                                        value={selectedProgram}
                                        onChange={(e) => setSelectedProgram(e.target.value)}
                                    >
                                        <option value="">Select Department</option>
                                        {programs.map(p => <option key={p.program_id} value={p.program_id}>{p.program_name}</option>)}
                                    </Form.Select>
                                </Col>
                                <Col md={3} lg={2}>
                                    <span className="filter-label">Scheme</span>
                                    <Form.Select
                                        className="filter-select"
                                        value={selectedScheme}
                                        onChange={(e) => setSelectedScheme(e.target.value)}
                                    >
                                        <option value="">Select Scheme</option>
                                        {schemes.map(s => <option key={s.scheme_id} value={s.scheme_id}>{s.scheme_name}</option>)}
                                    </Form.Select>
                                </Col>
                                <Col md={3} lg={2}>
                                    <span className="filter-label">Year</span>
                                    <Form.Select
                                        className="filter-select"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                    >
                                        <option value="2024-25">2024 - 25</option>
                                        <option value="2025-26">2025 - 26</option>
                                    </Form.Select>
                                </Col>
                                <Col md={4} lg={2}>
                                    <span className="filter-label">Class</span>
                                    <Form.Select
                                        className="filter-select"
                                        value={selectedClass}
                                        onChange={(e) => handleClassChange(e.target.value)}
                                    >
                                        <option value="FY">FY - {selectedDivision}</option>
                                        <option value="SY">SY - {selectedDivision}</option>
                                        <option value="TY">TY - {selectedDivision}</option>
                                    </Form.Select>
                                </Col>
                                <Col md={2} lg={1}>
                                    <span className="filter-label">Div</span>
                                    <Form.Select
                                        className="filter-select"
                                        value={selectedDivision}
                                        onChange={(e) => setSelectedDivision(e.target.value)}
                                    >
                                        {['A', 'B', 'C', 'D'].map(d => <option key={d} value={d}>{d}</option>)}
                                    </Form.Select>
                                </Col>
                                <Col md={4} lg={1}>
                                    <span className="filter-label">Semester</span>
                                    <Form.Select
                                        className="filter-select"
                                        value={selectedSemester}
                                        onChange={(e) => setSelectedSemester(e.target.value)}
                                    >
                                        {getSemesterOptions().map(sem => (
                                            <option key={sem} value={sem}>{sem}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col md={12} lg={3}>
                                    {/* Spacer for layout consistency */}
                                </Col>
                            </Row>

                            <Row className="mt-3">
                                <Col md={12}>
                                    <div className="search-container-v2">
                                        <Form.Control
                                            type="text"
                                            placeholder="Search course..."
                                            className="course-search-input-v2"
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                // If we search, we might find a course not in current filters.
                                                // The dropdown logic remains, but we search globally if needed?
                                                // Actually the user said "if user searches a course then if that course belong to..."
                                                // So I should search across ALL courses, not just current filtered ones.
                                            }}
                                        />
                                        {searchTerm && (
                                            <div className="search-results-overlay shadow-sm">
                                                {existingCoursesAll
                                                    .filter(c =>
                                                        (c.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                            c.course_code.toLowerCase().includes(searchTerm.toLowerCase())) &&
                                                        !['TEST101', 'CS101'].includes(c.course_code)
                                                    )
                                                    .slice(0, 10)
                                                    .map(c => (
                                                        <div
                                                            key={c.course_id}
                                                            className="search-result-item"
                                                            onClick={() => {
                                                                handleCourseChange(c.course_id);
                                                                setSearchTerm('');
                                                            }}
                                                        >
                                                            <span className="fw-bold">{c.course_code}</span> - {c.course_name}
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                </Col>
                            </Row>
                        </Card>

                        {/* Mapping Content - Only shown if course selected and rows exist */}
                        {selectedCourse && rows.length > 0 ? (
                            <div className="flex-grow-1 d-flex flex-column">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="fw-bold m-0 text-dark">
                                        Course: <span className="text-primary">{selectedCourse.course_code} - {selectedCourse.course_name}</span>
                                    </h6>
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => handleCourseChange("")}
                                        className="d-flex align-items-center gap-1"
                                    >
                                        Back to Course List
                                    </Button>
                                </div>
                                <div className="table-responsive flex-grow-1">
                                    <Table bordered className="co-po-table align-middle">
                                        <thead>
                                            <tr>
                                                <th rowSpan="2" className="table-header-blue text-white" style={{ fontFamily: 'Inter, sans-serif' }}>CO No</th>
                                                {pos.length > 0 && <th colSpan={pos.length} className="table-header-blue text-white" style={{ fontFamily: 'Inter, sans-serif' }}>Program Outcomes (POs)</th>}
                                                {psos.length > 0 && <th colSpan={psos.length} className="table-header-blue text-white" style={{ fontFamily: 'Inter, sans-serif' }}>Program Specific Outcomes (PSOs)</th>}
                                            </tr>
                                            <tr className="table-sub-header-blue text-white">
                                                {pos.map(p => <th key={p.po_id} title={p.description} style={{ fontFamily: 'Inter, sans-serif' }}>{p.po_number}</th>)}
                                                {psos.map(p => <th key={p.pso_id} title={p.description} style={{ fontFamily: 'Inter, sans-serif' }}>{p.pso_number}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row, index) => (
                                                <tr key={index}>
                                                    <td className="fw-bold bg-light" style={{ width: '80px', fontFamily: 'Inter, sans-serif' }}>{row.co_number}</td>
                                                    {pos.map((p, pIdx) => (
                                                        <td key={`po${p.po_id}`} className="p-0">
                                                            <input
                                                                type="text"
                                                                value={row[`po${p.po_id}`]}
                                                                readOnly={selectedCourse?.mapping_status?.toLowerCase() === 'completed' && !isEditing}
                                                                onChange={(e) => handleInputChange(index, `po${p.po_id}`, e.target.value)}
                                                                onKeyDown={(e) => handleKeyDown(e, index, pIdx)}
                                                                data-row={index}
                                                                data-col={pIdx}
                                                                style={{ fontFamily: 'Inter, sans-serif' }}
                                                            />
                                                        </td>
                                                    ))}
                                                    {psos.map((p, psoIdx) => {
                                                        const colIdx = pos.length + psoIdx;
                                                        return (
                                                            <td key={`pso${p.pso_id}`} className="p-0">
                                                                <input
                                                                    type="text"
                                                                    value={row[`pso${p.pso_id}`]}
                                                                    readOnly={selectedCourse?.mapping_status?.toLowerCase() === 'completed' && !isEditing}
                                                                    onChange={(e) => handleInputChange(index, `pso${p.pso_id}`, e.target.value)}
                                                                    onKeyDown={(e) => handleKeyDown(e, index, colIdx)}
                                                                    data-row={index}
                                                                    data-col={colIdx}
                                                                    style={{ fontFamily: 'Inter, sans-serif' }}
                                                                />
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                            <tr className="average-row bg-light">
                                                <td className="fw-bold text-primary" style={{ fontFamily: 'Inter, sans-serif' }}>Average</td>
                                                {pos.map(p => (
                                                    <td key={`po${p.po_id}`} className="p-0">
                                                        <input
                                                            type="text"
                                                            value={average[`po${p.po_id}`]}
                                                            readOnly
                                                            className="fw-bold text-center border-0 bg-transparent w-100"
                                                            style={{ fontFamily: 'Inter, sans-serif' }}
                                                        />
                                                    </td>
                                                ))}
                                                {psos.map(p => (
                                                    <td key={`pso${p.pso_id}`} className="p-0">
                                                        <input
                                                            type="text"
                                                            value={average[`pso${p.pso_id}`]}
                                                            readOnly
                                                            className="fw-bold text-center border-0 bg-transparent w-100"
                                                            style={{ fontFamily: 'Inter, sans-serif' }}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </Table>
                                </div>

                                <div className="d-flex justify-content-end gap-3 mt-4 pb-3">
                                    {selectedCourse?.mapping_status?.toLowerCase() === 'completed' && !isEditing ? (
                                        <Button
                                            variant="primary"
                                            className="px-4 fw-bold shadow-sm"
                                            onClick={() => setIsEditing(true)}
                                            style={{ fontFamily: 'Inter, sans-serif' }}
                                        >
                                            <i className="bi bi-pencil-square me-2"></i> Edit Mapping
                                        </Button>
                                    ) : (
                                        <>
                                            {selectedCourse?.mapping_status?.toLowerCase() === 'completed' && (
                                                <Button
                                                    variant="outline-secondary"
                                                    className="px-4 fw-bold shadow-sm"
                                                    onClick={() => setIsEditing(false)}
                                                    style={{ fontFamily: 'Inter, sans-serif' }}
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                            <Button
                                                className="save-btn text-white px-4 fw-bold shadow-sm"
                                                onClick={handleSave}
                                                style={{ fontFamily: 'Inter, sans-serif' }}
                                            >
                                                <i className="bi bi-check-circle me-2"></i> Save & Complete Mapping
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : selectedCourse ? (
                            <div className="text-center p-5 text-muted border rounded bg-light flex-grow-1 d-flex flex-column justify-content-center">
                                <i className="bi bi-exclamation-triangle fs-1 mb-3 text-warning"></i>
                                <h5>No Course Outcomes (COs) found for this course.</h5>
                                <p>Please define COs in the Course Management section first.</p>
                            </div>
                        ) : (
                            <div className="flex-grow-1 overflow-hidden d-flex flex-column">
                                <h5 className="mb-3 fw-bold text-secondary">Courses matching your filters:</h5>
                                <div className="table-responsive flex-grow-1">
                                    <Table bordered hover className="course-list-table-refined align-middle w-100">
                                        <thead>
                                            <tr>
                                                <th>COURSE CODE</th>
                                                <th>COURSE NAME</th>
                                                <th>COURSE TITLE</th>
                                                <th>ABBR.</th>
                                                <th>SCHEME</th>
                                                <th>CO STATUS</th>
                                                <th>MAPPING STATUS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {courses.length === 0 ? (
                                                <tr><td colSpan="7" className="text-center py-4 text-muted">No courses found matching these filters.</td></tr>
                                            ) : courses.map(c => (
                                                <tr
                                                    key={c.course_id}
                                                    onClick={() => handleCourseChange(c.course_id)}
                                                    className="clickable-course-row"
                                                >
                                                    <td className="fw-bold">{c.course_code}</td>
                                                    <td>{c.course_name}</td>
                                                    <td className="text-start">{c.course_title}</td>
                                                    <td>{c.course_abbr}</td>
                                                    <td>{schemes.find(s => s.scheme_id === c.scheme_id)?.scheme_name || "-"}</td>
                                                    <td>
                                                        <span className={`status-badge-v1 ${c.co_status?.toLowerCase() === 'completed' ? 'status-completed' : 'status-pending'}`}>
                                                            {c.co_status || 'PENDING'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge-v1 ${c.mapping_status?.toLowerCase() === 'completed' ? 'status-completed' : 'status-pending'}`}>
                                                            {c.mapping_status || 'PENDING'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </div>
                        )}

                    </Container>
                </div>
            </div>
        </div>
    );
};

export default COPOmapping;
