import React, { useState, useEffect } from 'react';
import api from '../../../utils/axios';
import { BsPlusCircleFill, BsDashCircleFill, BsPencilFill, BsCheckCircleFill, BsXCircleFill, BsArrowRepeat } from "react-icons/bs";
import { Table, Form, Button, Spinner, Alert } from 'react-bootstrap';
import './StudentManagement.css';

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [programs, setPrograms] = useState([]);
    const [batches, setBatches] = useState([]);
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('');
    const [selectedClass, setSelectedClass] = useState('FY');
    const [selectedDivision, setSelectedDivision] = useState('A');
    const [selectedSem, setSelectedSem] = useState('1');
    const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);

    // UI States
    const [editingId, setEditingId] = useState(null); // ID of student being edited
    const [newStudent, setNewStudent] = useState(null); // Data for row being added
    const [uploadResults, setUploadResults] = useState(null);
    const [showResultsModal, setShowResultsModal] = useState(false);

    // Dynamic Options
    const batchYears = Array.from({ length: 13 }, (_, i) => {
        const start = 2019 + i;
        const end = (start + 1).toString().slice(-2);
        return `${start}-${end}`;
    });
    const academicYears = [...batchYears];

    useEffect(() => {
        fetchFilters();
    }, []);

    useEffect(() => {
        if (selectedProgram && selectedBatch) {
            fetchStudents();
        }
    }, [selectedProgram, selectedBatch, selectedClass, selectedDivision, selectedAcademicYear, selectedSem]);

    // Handle Class change to update Semester options
    const handleClassChange = (newClass) => {
        setSelectedClass(newClass);
        if (newClass === 'FY') setSelectedSem('1');
        else if (newClass === 'SY') setSelectedSem('3');
        else if (newClass === 'TY') setSelectedSem('5');
    };

    const getSemesterOptions = () => {
        if (selectedClass === 'FY') return ['1', '2'];
        if (selectedClass === 'SY') return ['3', '4'];
        if (selectedClass === 'TY') return ['5', '6'];
        return ['1', '2', '3', '4', '5', '6'];
    };

    const fetchFilters = async () => {
        try {
            const [progRes, batchRes, setupRes] = await Promise.all([
                api.get('academics/programs/'),
                api.get('academics/batches/list/'),
                api.get('academics/academic-setup/')
            ]);
            setPrograms(progRes.data);
            setBatches(batchRes.data);

            if (progRes.data.length > 0) setSelectedProgram(progRes.data[0].program_id);
            if (batchRes.data.length > 0) setSelectedBatch(batchRes.data[0].batch_id);
            if (setupRes.data && setupRes.data.academic_year) setSelectedAcademicYear(setupRes.data.academic_year);
            setSelectedSem('1');
        } catch (err) {
            console.error("Error fetching filters:", err);
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const params = {
                // program_id: selectedProgram,
                batch_id: selectedBatch,
                class_year: selectedClass,
                division: selectedDivision,
                academic_year: selectedAcademicYear,
                semester: selectedSem
            };
            const res = await api.get('users/students/', { params });
            setStudents(res.data);
        } catch (err) {
            console.error("Error fetching students:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRow = () => {
        setNewStudent({
            enrollment_no: '',
            roll_no: '',
            name: '',
            // program_id: selectedProgram,
            batch_id: selectedBatch,
            semester: selectedSem || '1',
            class_year: selectedClass,
            division: selectedDivision,
            academic_year: selectedAcademicYear
        });
        setIsEditMode(true);
    };

    const handleSaveNew = async () => {
        try {
            const res = await api.post('users/students/', newStudent);
            setStudents([...students, res.data].sort((a, b) => a.roll_no.localeCompare(b.roll_no)));
            setNewStudent(null);
        } catch (err) {
            alert("Error saving student: " + JSON.stringify(err.response?.data || "Unknown error"));
        }
    };

    const handleUpdate = async (student) => {
        try {
            const res = await api.put(`users/students/${student.student_id}/`, student);
            setStudents(students.map(s => s.student_id === student.student_id ? res.data : s));
            setEditingId(null);
        } catch (err) {
            alert("Error updating student");
        }
    };

    const handleDelete = async (studentId) => {
        if (!window.confirm("Are you sure you want to remove this student?")) return;
        try {
            await api.delete(`users/students/${studentId}/`);
            setStudents(students.filter(s => s.student_id !== studentId));
        } catch (err) {
            alert("Error deleting student");
        }
    };

    const handleCarryForward = async () => {
        if (!selectedBatch || !selectedSem || selectedSem === '1') {
            alert("Please select a Semester (greater than 1) and Batch to carry forward students.");
            return;
        }

        if (!window.confirm(`This will move all students from Semester ${parseInt(selectedSem) - 1} to current selection (Sem ${selectedSem}). Continue?`)) return;

        setLoading(true);
        try {
            await api.post('bulk_upload/students/promote/', {
                batch_id: selectedBatch,
                semester: selectedSem,
                class_year: selectedClass,
                academic_year: selectedAcademicYear,
                division: selectedDivision,
                program_id: selectedProgram
            });
            alert("Students carried forward successfully!");
            fetchStudents();
        } catch (err) {
            alert("Failed to carry forward: " + (err.response?.data?.error || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    const handleBulkSave = () => {
        setIsEditMode(false);
    };

    return (
        <div className="student-management-wrapper">
            <div className="d-flex">
                <div className="student-management-main p-4 flex-grow-1">
                    <div className="bg-white p-4 rounded shadow-sm border">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="m-0 text-primary fw-bold">Student Management</h2>
                        </div>

                        {/* Upload Results Modal */}
                        {showResultsModal && uploadResults && (
                            <Alert variant={uploadResults.errors.length > 0 ? "warning" : "success"} dismissible onClose={() => setShowResultsModal(false)}>
                                <Alert.Heading>Upload Complete</Alert.Heading>
                                <div className="d-flex gap-4 mb-2">
                                    <span>Total Rows: <strong>{uploadResults.total}</strong></span>
                                    <span className="text-success">New: <strong>{uploadResults.success}</strong></span>
                                    <span className="text-info">Updated: <strong>{uploadResults.updated || 0}</strong></span>
                                    <span className="text-secondary">Skipped: <strong>{uploadResults.skipped}</strong></span>
                                    <span className="text-danger">Errors: <strong>{uploadResults.errors.length}</strong></span>
                                </div>
                                {uploadResults.errors.length > 0 && (
                                    <div className="mt-2 p-2 bg-white rounded border overflow-auto" style={{ maxHeight: '200px' }}>
                                        <ul className="small mb-0 text-danger">
                                            {uploadResults.errors.map((err, i) => <li key={i}>{err}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </Alert>
                        )}

                        {/* Filters */}
                        <div className="row g-3 mb-4 bg-light p-3 rounded border">
                            <div className="col-md-2">
                                <Form.Label className="small fw-bold">BATCH</Form.Label>
                                <Form.Select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                                    <option value="">Select Batch</option>
                                    {batchYears.map(year => {
                                        const b = batches.find(batch => batch.display_batch === year || batch.batch_year.toString() === year.split('-')[0]);
                                        return <option key={year} value={b ? b.batch_id : ""}>{year}</option>;
                                    })}
                                </Form.Select>
                            </div>
                            <div className="col-md-3">
                                <Form.Label className="small fw-bold">ACADEMIC YEAR</Form.Label>
                                <Form.Select value={selectedAcademicYear} onChange={e => setSelectedAcademicYear(e.target.value)}>
                                    <option value="">Select Year</option>
                                    {academicYears.map(ay => <option key={ay} value={ay}>{ay}</option>)}
                                </Form.Select>
                            </div>
                            <div className="col-md-2">
                                <Form.Label className="small fw-bold">CLASS</Form.Label>
                                <Form.Select value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
                                    <option value="FY">FY</option>
                                    <option value="SY">SY</option>
                                    <option value="TY">TY</option>
                                </Form.Select>
                            </div>
                            <div className="col-md-2">
                                <Form.Label className="small fw-bold">SEMESTER</Form.Label>
                                <Form.Select value={selectedSem} onChange={e => setSelectedSem(e.target.value)}>
                                    {getSemesterOptions().map(s => <option key={s} value={s}>{s}</option>)}
                                </Form.Select>
                            </div>
                            <div className="col-md-3">
                                <Form.Label className="small fw-bold">DIVISION</Form.Label>
                                <Form.Select
                                    value={selectedDivision}
                                    onChange={e => setSelectedDivision(e.target.value)}
                                >
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                </Form.Select>
                            </div>
                        </div>

                        <div className="d-flex justify-content-end gap-2 mb-4">
                            <Button variant={isEditMode ? "success" : "outline-primary"} onClick={() => isEditMode ? handleBulkSave() : setIsEditMode(true)}>
                                {isEditMode ? <><BsCheckCircleFill /> Save Changes</> : <><BsPencilFill /> Edit Students</>}
                            </Button>
                            <Button variant="success" onClick={handleAddRow} className="d-flex align-items-center gap-2">
                                <BsPlusCircleFill /> Add Student
                            </Button>
                            <Button variant="info" onClick={handleCarryForward} className="d-flex align-items-center gap-2 text-white">
                                <BsArrowRepeat /> Carry Forward
                            </Button>
                            <Button variant="primary" onClick={() => document.getElementById('bulk-upload-input').click()} className="d-flex align-items-center gap-2">
                                <BsPlusCircleFill /> Bulk Upload
                            </Button>

                            <input
                                type="file"
                                id="bulk-upload-input"
                                style={{ display: 'none' }}
                                accept=".xlsx, .xls"
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;

                                    const formData = new FormData();
                                    formData.append('file', file);
                                    // Include current filter values as defaults
                                    formData.append('batch_id', selectedBatch);
                                    formData.append('academic_year', selectedAcademicYear);
                                    formData.append('semester', selectedSem);
                                    formData.append('class_year', selectedClass);
                                    formData.append('division', selectedDivision);
                                    formData.append('program_id', selectedProgram);

                                    setLoading(true);
                                    try {
                                        const res = await api.post('bulk_upload/students/', formData, {
                                            headers: { 'Content-Type': 'multipart/form-data' }
                                        });
                                        setUploadResults(res.data);
                                        setShowResultsModal(true);
                                        fetchStudents();
                                    } catch (err) {
                                        const errorData = err.response?.data;
                                        if (errorData && typeof errorData === 'object' && errorData.total !== undefined) {
                                            setUploadResults(errorData);
                                            setShowResultsModal(true);
                                        } else if (errorData && errorData.expected) {
                                            alert(`Template Mismatch!\n\nExpected: ${errorData.expected.join(", ")}\n\nFound: ${errorData.found.join(", ")}`);
                                        } else {
                                            const errorMsg = errorData?.error || errorData?.details || "Unknown error";
                                            alert("Upload failed: " + errorMsg);
                                        }
                                    } finally {
                                        setLoading(false);
                                        e.target.value = null; // Reset input
                                    }
                                }}
                            />
                        </div>

                        {loading ? (
                            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                        ) : (
                            <div className="table-responsive">
                                <Table bordered hover className="align-middle">
                                    <thead className="bg-fath-blue-header text-white text-center">
                                        <tr>
                                            <th style={{ width: '5%' }}>#</th>
                                            <th style={{ width: '25%' }}>Enrollment No.</th>
                                            <th style={{ width: '15%' }}>Roll No.</th>
                                            <th style={{ width: '50%' }}>Student Name</th>
                                            <th style={{ width: '5%' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((s, idx) => (
                                            <tr key={s.student_id}>
                                                <td className="text-center">{idx + 1}</td>
                                                <td>
                                                    {isEditMode ? (
                                                        <Form.Control
                                                            size="sm"
                                                            value={s.enrollment_no}
                                                            onChange={e => {
                                                                const updated = [...students];
                                                                updated[idx].enrollment_no = e.target.value;
                                                                setStudents(updated);
                                                                handleUpdate(updated[idx]);
                                                            }}
                                                        />
                                                    ) : s.enrollment_no}
                                                </td>
                                                <td className="text-center fw-bold">
                                                    {isEditMode ? (
                                                        <Form.Control
                                                            size="sm"
                                                            className="text-center"
                                                            value={s.roll_no}
                                                            onChange={e => {
                                                                const updated = [...students];
                                                                updated[idx].roll_no = e.target.value;
                                                                setStudents(updated);
                                                                handleUpdate(updated[idx]);
                                                            }}
                                                        />
                                                    ) : s.roll_no}
                                                </td>
                                                <td>
                                                    {isEditMode ? (
                                                        <Form.Control
                                                            size="sm"
                                                            value={s.name}
                                                            onChange={e => {
                                                                const updated = [...students];
                                                                updated[idx].name = e.target.value;
                                                                setStudents(updated);
                                                                handleUpdate(updated[idx]);
                                                            }}
                                                        />
                                                    ) : s.name}
                                                </td>
                                                <td className="text-center">
                                                    <BsDashCircleFill
                                                        className="text-danger cursor-pointer"
                                                        style={{ fontSize: '1.2rem' }}
                                                        onClick={() => handleDelete(s.student_id)}
                                                        title="Remove Student"
                                                    />
                                                </td>
                                            </tr>
                                        ))}

                                        {/* New Row Logic */}
                                        {newStudent && (
                                            <tr className="table-info">
                                                <td className="text-center">New</td>
                                                <td><Form.Control size="sm" placeholder="Enrollment" value={newStudent.enrollment_no} onChange={e => setNewStudent({ ...newStudent, enrollment_no: e.target.value })} /></td>
                                                <td><Form.Control size="sm" className="text-center" placeholder="Roll No" value={newStudent.roll_no} onChange={e => setNewStudent({ ...newStudent, roll_no: e.target.value })} /></td>
                                                <td><Form.Control size="sm" placeholder="Student Name" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} /></td>
                                                <td className="text-center">
                                                    <div className="d-flex justify-content-center gap-2">
                                                        <Button variant="success" size="sm" onClick={handleSaveNew}><BsCheckCircleFill /> Save</Button>
                                                        <Button variant="secondary" size="sm" onClick={() => setNewStudent(null)}><BsXCircleFill /> Cancel</Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        )}

                        {!loading && students.length === 0 && !newStudent && (
                            <Alert variant="info" className="text-center">No students found for this selection.</Alert>
                        )}

                        <div className="mt-3 text-muted border-top pt-2">
                            <small>Total Students: {students.length}</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentManagement;
