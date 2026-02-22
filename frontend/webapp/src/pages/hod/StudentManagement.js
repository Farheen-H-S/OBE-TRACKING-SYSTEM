import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { BsPlusCircleFill, BsDashCircleFill, BsPencilFill, BsCheckCircleFill, BsXCircleFill } from "react-icons/bs";
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
    const [selectedSem, setSelectedSem] = useState('1'); // Still useful for backend but UI uses Class/Div
    const [isEditMode, setIsEditMode] = useState(false);

    // UI States
    const [editingId, setEditingId] = useState(null); // ID of student being edited
    const [newStudent, setNewStudent] = useState(null); // Data for row being added

    useEffect(() => {
        fetchFilters();
    }, []);

    useEffect(() => {
        if (selectedProgram && selectedBatch) {
            fetchStudents();
        }
    }, [selectedProgram, selectedBatch, selectedClass, selectedDivision]);

    const fetchFilters = async () => {
        try {
            const [progRes, batchRes] = await Promise.all([
                api.get('academics/programs/'),
                api.get('academics/batches/list/')
            ]);
            setPrograms(progRes.data);
            setBatches(batchRes.data);

            if (progRes.data.length > 0) setSelectedProgram(progRes.data[0].program_id);
            if (batchRes.data.length > 0) setSelectedBatch(batchRes.data[0].batch_id);
            setSelectedSem('1');
        } catch (err) {
            console.error("Error fetching filters:", err);
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const params = {
                program_id: selectedProgram,
                batch_id: selectedBatch,
                class_year: selectedClass,
                division: selectedDivision
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
            program_id: selectedProgram,
            batch_id: selectedBatch,
            semester: selectedSem || '1',
            class_year: selectedClass,
            division: selectedDivision
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

    const handleBulkSave = async () => {
        setIsEditMode(false);
        // In a real app, you might want to send all changes at once.
        // For now, since editing is per-row in state, we assumes it's saved already or we save on toggle off.
        alert("Changes saved successfully!");
    };

    return (
        <div className="student-management-wrapper">
            <div className="d-flex">
                <div className="student-management-main p-4 flex-grow-1">
                    <div className="bg-white p-4 rounded shadow-sm border">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="m-0 text-primary fw-bold">Student Management</h2>
                            <div className="d-flex gap-2">
                                <Button variant={isEditMode ? "success" : "outline-primary"} onClick={() => isEditMode ? handleBulkSave() : setIsEditMode(true)}>
                                    {isEditMode ? <><BsCheckCircleFill /> Save Changes</> : <><BsPencilFill /> Edit Students</>}
                                </Button>
                                <Button variant="success" onClick={handleAddRow} className="d-flex align-items-center gap-2">
                                    <BsPlusCircleFill /> Add Student
                                </Button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="row g-3 mb-4 bg-light p-3 rounded border">
                            <div className="col-md-3">
                                <Form.Label className="small fw-bold">PROGRAM</Form.Label>
                                <Form.Select value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)}>
                                    {programs.map(p => <option key={p.program_id} value={p.program_id}>{p.program_name}</option>)}
                                </Form.Select>
                            </div>
                            <div className="col-md-3">
                                <Form.Label className="small fw-bold">BATCH</Form.Label>
                                <Form.Select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                                    {batches.map(b => <option key={b.batch_id} value={b.batch_id}>{b.batch_year} ({b.program_name})</option>)}
                                </Form.Select>
                            </div>
                            <div className="col-md-3">
                                <Form.Label className="small fw-bold">CLASS</Form.Label>
                                <Form.Select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                                    <option value="FY">FY - {selectedDivision}</option>
                                    <option value="SY">SY - {selectedDivision}</option>
                                    <option value="TY">TY - {selectedDivision}</option>
                                </Form.Select>
                            </div>
                            <div className="col-md-3">
                                <Form.Label className="small fw-bold">DIVISION</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={selectedDivision}
                                    onChange={e => setSelectedDivision(e.target.value)}
                                    placeholder="Enter Division (e.g. A)"
                                />
                            </div>
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
                                            <th style={{ width: '20%' }}>Roll No.</th>
                                            <th style={{ width: '45%' }}>Student Name</th>
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
