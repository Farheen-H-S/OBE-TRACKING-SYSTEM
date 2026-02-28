import React, { useState, useEffect } from 'react';
import api from '../../../utils/axios';
import { BsPlusCircleFill, BsDashCircleFill, BsPencilFill, BsCheckCircleFill, BsXCircleFill, BsArrowRepeat } from "react-icons/bs";
import { Table, Form, Button, Spinner, Alert } from 'react-bootstrap';
import './StudentManagement.css';
import { useFilters } from '../../../context/FilterContext';

const StudentManagement = () => {
    const {
        selectedDept: selectedProgram,
        selectedBatch,
        selectedClass,
        selectedDivision,
        selectedSemester: selectedSem,
        selectedYear: selectedAcademicYear,
        validateContext
    } = useFilters();

    const requiredFields = ['dept', 'batch', 'year', 'class', 'semester', 'division'];
    const { isValid, missingFields } = validateContext(requiredFields);

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // UI States
    const [newStudent, setNewStudent] = useState(null);
    const [uploadResults, setUploadResults] = useState(null);
    const [showResultsModal, setShowResultsModal] = useState(false);

    useEffect(() => {
        if (selectedBatch && selectedProgram) {
            fetchStudents();
        } else {
            setStudents([]);
        }
    }, [selectedProgram, selectedBatch, selectedClass, selectedDivision, selectedAcademicYear, selectedSem]);

    const fetchStudents = async () => {
        if (!selectedBatch) {
            setStudents([]);
            return;
        }
        setLoading(true);
        try {
            const params = {
                batch_id: selectedBatch,
                class_year: selectedClass,
                division: selectedDivision,
                academic_year: selectedAcademicYear,
                semester: selectedSem === 'All' ? undefined : selectedSem
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
            batch_id: selectedBatch,
            semester: selectedSem === 'All' ? '1' : selectedSem,
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
        if (!selectedBatch || !selectedSem || selectedSem === 'All') {
            alert("Please select a Semester (numeric) and Batch to carry forward students.");
            return;
        }

        if (!window.confirm(`This will move all students from previous semester to current selection (Sem ${selectedSem}). Continue?`)) return;

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

                        {!isValid ? (
                            <Alert variant="warning" className="shadow-sm border-warning d-flex align-items-center gap-3 p-4">
                                <div className="fs-3">⚠️</div>
                                <div>
                                    <h5 className="fw-bold mb-1">Academic Context Required</h5>
                                    <p className="mb-0">Please select the remaining filters in the top bar to proceed: <span className="fw-bold">{missingFields.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ')}</span></p>
                                </div>
                            </Alert>
                        ) : (
                            <>

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
                                                e.target.value = null;
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
                                                    <th style={{ width: '15%' }}>Actions</th>
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
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentManagement;
