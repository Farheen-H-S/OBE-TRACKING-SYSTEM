import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Row, Col, Card, Collapse } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/axios';
import './COPOmapping.css';
import { useFilters } from '../../../context/FilterContext';

const COPOmapping = () => {
    const {
        selectedDept,
        selectedScheme,
        selectedIntroYear,
        years,
        schemes,
        programs
    } = useFilters();

    // Data states
    const [courses, setCourses] = useState([]);
    const [pos, setPos] = useState([]);
    const [psos, setPsos] = useState([]);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [average, setAverage] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [existingCoursesAll, setExistingCoursesAll] = useState([]);
    const [showStatements, setShowStatements] = useState(false);
    const [cos, setCos] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                // Fetch all courses for search bar
                const courseRes = await api.get('/academics/courses/');
                setExistingCoursesAll(courseRes.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching mapping data:", err);
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [selectedIntroYear, selectedDept, selectedScheme]);

    const fetchCourses = async () => {
        try {
            const response = await api.get('/academics/courses/', {
                params: {
                    program_id: selectedDept,
                    scheme_id: selectedScheme,
                    intro_year: selectedIntroYear
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
            setCos(coRes.data);
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
            navigate('/course-management');
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
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="text-left mb-0" style={{ color: '#3949ab', fontWeight: '600' }}>3.1.2 CO-PO matrices of courses selected in 3.1.1 (5)</h5>
                            {selectedCourse && (
                                <Button
                                    variant="outline-primary"
                                    onClick={() => setShowStatements(!showStatements)}
                                    className="shadow-sm"
                                >
                                    {showStatements ? 'Hide Statements' : 'Show Statements'}
                                </Button>
                            )}
                        </div>

                        <Collapse in={showStatements}>
                            <div className="mb-4">
                                <Card className="border-0 shadow-sm bg-white p-3">
                                    <h6 className="fw-bold mb-3 border-bottom pb-2" style={{ color: '#1a237e' }}>Definitions & Statements</h6>
                                    <Row>
                                        <Col md={6}>
                                            <div className="mb-3">
                                                <small className="text-muted fw-bold d-block mb-2">COURSE OUTCOMES (CO)</small>
                                                <div className="statements-list overflow-auto" style={{ maxHeight: '200px' }}>
                                                    {cos.map(co => (
                                                        <div key={co.co_id} className="p-2 mb-1 bg-light rounded shadow-sm border-start border-4 border-primary">
                                                            <strong>{co.co_number}:</strong> {co.description}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="mb-3">
                                                <small className="text-muted fw-bold d-block mb-2">PROGRAM OUTCOMES (PO) & PSOs</small>
                                                <div className="statements-list overflow-auto" style={{ maxHeight: '200px' }}>
                                                    {pos.map(po => (
                                                        <div key={po.po_id} className="p-2 mb-1 bg-light rounded shadow-sm border-start border-4 border-info">
                                                            <strong>{po.po_number}:</strong> {po.description}
                                                        </div>
                                                    ))}
                                                    {psos.map(pso => (
                                                        <div key={pso.pso_id} className="p-2 mb-1 bg-light rounded shadow-sm border-start border-4 border-success">
                                                            <strong>{pso.pso_number}:</strong> {pso.description}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card>
                            </div>
                        </Collapse>

                        {/* Filter Section - Handled by GlobalFilterBar */}
                        <Card className="border-0 bg-light mb-4 p-3 shadow-sm rounded">
                            <Row>
                                <Col md={12}>
                                    <div className="search-container-v2">
                                        <Form.Control
                                            type="text"
                                            placeholder="Search course..."
                                            className="course-search-input-v2"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        {searchTerm && (
                                            <div className="search-results-overlay shadow-sm" style={{ maxHeight: '300px', overflowY: 'auto', zIndex: 1000 }}>
                                                {existingCoursesAll
                                                    .filter(c => {
                                                        const term = searchTerm.toLowerCase();
                                                        return (
                                                            (c.course_name || "").toLowerCase().includes(term) ||
                                                            (c.course_code || "").toLowerCase().includes(term) ||
                                                            (c.course_title || "").toLowerCase().includes(term) ||
                                                            (c.course_abbr || "").toLowerCase().includes(term)
                                                        ) && !['TEST101', 'CS101'].includes(c.course_code);
                                                    })
                                                    .slice(0, 15)
                                                    .map(c => (
                                                        <div
                                                            key={c.course_id}
                                                            className="search-result-item"
                                                            onClick={() => {
                                                                handleCourseChange(c.course_id);
                                                                setSearchTerm('');
                                                            }}
                                                        >
                                                            <div className="fw-bold">{c.course_code} - {c.course_abbr || '---'}</div>
                                                            <div className="small text-muted">{c.course_name}</div>
                                                            <div className="small text-muted italic" style={{ fontSize: '0.75rem' }}>{c.course_title}</div>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                </Col>
                            </Row>
                        </Card>

                        {/* Course Selected: CO Status Warning */}
                        {selectedCourse && selectedCourse.co_status !== 'COMPLETED' && (
                            <div className="alert alert-warning d-flex align-items-center gap-2 mb-3 shadow-sm" role="alert">
                                <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                                <div>
                                    <strong>CO Status is not complete.</strong> Please mark the course outcomes as <strong>Completed</strong> in Course Management before entering the CO-PO mapping.
                                </div>
                            </div>
                        )}

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
                                    {selectedCourse?.co_status !== 'COMPLETED' ? (
                                        <Button
                                            variant="outline-secondary"
                                            className="px-4 fw-bold shadow-sm"
                                            disabled
                                            title="CO Status must be COMPLETED before mapping can be edited."
                                        >
                                            <i className="bi bi-lock me-2"></i>Mapping Locked (CO Pending)
                                        </Button>
                                    ) : selectedCourse?.mapping_status?.toLowerCase() === 'completed' && !isEditing ? (
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
