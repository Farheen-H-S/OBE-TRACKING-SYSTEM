import React, { useState, useEffect, useCallback } from 'react';
import { useFilters } from '../../../context/FilterContext';
import api from '../../../utils/axios';
import { getLoggedInUser } from '../../../utils/auth';
import { Button, Spinner, Alert, Form } from 'react-bootstrap';
import './Teachplan.css';

const Teachplan = () => {
    const {
        selectedDept, selectedScheme, selectedYear, selectedSemester,
        selectedBatch, selectedClass, selectedDivision
    } = useFilters();
    const user = React.useMemo(() => getLoggedInUser(), []);

    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [plan, setPlan] = useState(null);
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const fileInputRef = React.useRef(null);

    const fetchCourses = useCallback(async () => {
        const role = (user?.role_name || user?.role || '').toLowerCase();
        const isFaculty = role === 'faculty';

        if (!selectedYear) return;

        const normalizedYear = selectedYear.replace(/\s/g, '');
        if (!isFaculty && !selectedDept) return;

        try {
            const params = {
                academic_year: normalizedYear,
            };

            // For Faculty, we rely primarily on their assignments. 
            // We only apply additional filters if THEY are explicitly selected and not just defaults.
            // Simplified: For now, let's just send academic_year and let backend handle the rest for faculty.
            if (selectedDept) params.program_id = selectedDept;
            if (selectedSemester) params.semester = selectedSemester;
            if (selectedScheme) params.scheme_id = selectedScheme;
            if (selectedClass) params.class_year = selectedClass;
            if (selectedBatch) params.batch_id = selectedBatch;

            const res = await api.get('/academics/courses/', { params });
            setCourses(res.data);

            // Set first course as default if none selected
            if (res.data.length > 0 && !selectedCourseId) {
                setSelectedCourseId(res.data[0].course_id);
            } else if (res.data.length === 0) {
                setSelectedCourseId('');
                setPlan(null);
                setLectures([]);
            }
        } catch (err) {
            console.error("Error fetching courses:", err);
            setCourses([]);
        }
    }, [selectedDept, selectedYear, selectedSemester, selectedScheme, selectedClass, selectedBatch, user]);

    const fetchPlan = useCallback(async () => {
        if (!selectedCourseId) return;

        const normalizedYear = selectedYear ? selectedYear.replace(/\s/g, '') : '';
        const role = (user?.role_name || user?.role || '').toLowerCase();
        const isFaculty = role === 'faculty';

        setLoading(true);
        setError(null);
        try {
            const params = {
                course_id: selectedCourseId,
                academic_year: normalizedYear,
                semester: selectedSemester,
                scheme_id: selectedScheme,
                batch_id: selectedBatch
            };

            const response = await api.get('/teaching-plan/', { params });

            if (response.data.length > 0) {
                const planObj = response.data[0];
                setPlan(planObj);
                setLectures(planObj.lectures || []);
            } else {
                setPlan(null);
                setLectures([]);
            }
        } catch (err) {
            console.error("Error fetching teaching plan:", err);
            setError("Failed to load teaching plan.");
        } finally {
            setLoading(false);
        }
    }, [selectedCourseId, selectedYear, selectedSemester, selectedScheme, selectedBatch]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    useEffect(() => {
        fetchPlan();
    }, [fetchPlan]);

    const handleUploadPlan = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedCourseId) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('course_id', selectedCourseId);
        formData.append('academic_year', selectedYear);
        formData.append('semester', selectedSemester);
        formData.append('scheme_id', selectedScheme);
        formData.append('batch_id', selectedBatch || '');

        setSaving(true);
        setError(null);
        try {
            const res = await api.post('/bulk_upload/teaching-plan/upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccessMsg(res.data.message || "Teaching plan uploaded successfully!");
            setTimeout(() => setSuccessMsg(''), 3000);
            fetchPlan();
        } catch (err) {
            console.error("Upload error:", err);
            setError(err.response?.data?.error || "Failed to upload teaching plan.");
        } finally {
            setSaving(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleInputChange = (index, field, value) => {
        const newLectures = [...lectures];
        newLectures[index][field] = value;
        setLectures(newLectures);
    };

    const handleAddRow = () => {
        setLectures([
            ...lectures,
            {
                lecture_no: lectures.length + 1,
                lecture_date: new Date().toISOString().split('T')[0],
                topic_planned: "",
                actual_topic: "",
                status: "INCOMPLETE",
                remark: ""
            }
        ]);
    };

    const handleDeleteRow = (index) => {
        if (!window.confirm("Are you sure you want to delete this row?")) return;
        const newLectures = lectures.filter((_, i) => i !== index);
        // Recalculate lecture numbers
        const updatedLectures = newLectures.map((lec, i) => ({
            ...lec,
            lecture_no: i + 1
        }));
        setLectures(updatedLectures);
    };

    const handleSave = async () => {
        if (!plan) return;
        setSaving(true);
        try {
            await api.patch(`/teaching-plan/${plan.teaching_plan_id}/`, {
                lectures: lectures
            });
            setSuccessMsg("Plan saved successfully!");
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    if (loading && !plan) {
        return (
            <div className="teachplan-wrapper d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <Spinner animation="border" variant="primary" />
                <span className="ms-2">Loading Teaching Plan...</span>
            </div>
        );
    }

    return (
        <div className="teachplan-wrapper">
            <div className="teachplan-content-main">
                <div className="teachplan-card">

                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <h4 className="fw-bold text-primary mb-0">Teaching Plan</h4>
                            <Form.Select
                                size="sm"
                                style={{ width: '250px' }}
                                value={selectedCourseId}
                                onChange={(e) => setSelectedCourseId(e.target.value)}
                            >
                                <option value="">Select Course...</option>
                                {courses.map(c => (
                                    <option key={c.course_id} value={c.course_id}>
                                        {c.course_code} - {c.course_name}
                                    </option>
                                ))}
                            </Form.Select>
                        </div>
                        <div className="d-flex gap-2">
                            {plan ? (
                                <Button variant="success" size="sm" onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Plan'}
                                </Button>
                            ) : (
                                <div className="d-flex flex-column align-items-end">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        accept=".xlsx, .xls"
                                        onChange={handleUploadPlan}
                                    />
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={!selectedCourseId || saving}
                                    >
                                        {saving ? 'Uploading...' : 'Upload Plan'}
                                    </Button>
                                    <div className="text-muted mt-1" style={{ fontSize: '11px', textAlign: 'right' }}>
                                        Note: Download template from Downloads section in header
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && <Alert variant="danger">{error}</Alert>}
                    {successMsg && <Alert variant="success">{successMsg}</Alert>}

                    {(!selectedDept && !(['faculty'].includes((user?.role_name || user?.role || '').toLowerCase()))) && (
                        <Alert variant="warning">Please select a Department from the top filters to begin.</Alert>
                    )}

                    {plan ? (
                        <div className="table-responsive">
                            <table className="teachplan-table">
                                <thead>
                                    <tr>
                                        <th className="col-lecture">Lec No.</th>
                                        <th className="col-date">Planned Date</th>
                                        <th className="col-topics">Topic</th>
                                        <th className="col-description">Description</th>
                                        <th className="col-status">Status</th>
                                        <th className="col-action">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lectures.map((row, index) => (
                                        <tr key={index}>
                                            <td className="col-lecture text-center">{row.lecture_no}</td>
                                            <td className="col-date">
                                                <input
                                                    type="date"
                                                    className="editable-input"
                                                    value={row.lecture_date}
                                                    onChange={(e) => handleInputChange(index, 'lecture_date', e.target.value)}
                                                />
                                            </td>
                                            <td className="col-topics">
                                                <textarea
                                                    className="editable-textarea"
                                                    value={row.topic_planned}
                                                    onChange={(e) => handleInputChange(index, 'topic_planned', e.target.value)}
                                                    placeholder="Enter topics..."
                                                />
                                            </td>
                                            <td className="col-description">
                                                <textarea
                                                    className="editable-textarea"
                                                    value={row.actual_topic || ''}
                                                    onChange={(e) => handleInputChange(index, 'actual_topic', e.target.value)}
                                                    placeholder="Enter description..."
                                                    style={{ minHeight: '40px' }}
                                                />
                                            </td>
                                            <td className="col-status text-center">
                                                <Form.Select
                                                    size="sm"
                                                    value={row.status || 'INCOMPLETE'}
                                                    onChange={(e) => handleInputChange(index, 'status', e.target.value)}
                                                    className="status-select"
                                                >
                                                    <option value="COMPLETED">Completed</option>
                                                    <option value="INCOMPLETE">Incomplete</option>
                                                    <option value="POSTPONED">Postponed</option>
                                                </Form.Select>
                                            </td>
                                            <td className="col-action text-center">
                                                <Button
                                                    variant="link"
                                                    className="text-danger p-0"
                                                    onClick={() => handleDeleteRow(index)}
                                                    title="Delete Row"
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="text-center mt-3">
                                <Button variant="link" className="text-decoration-none" onClick={handleAddRow}>
                                    <i className="bi bi-plus-circle me-1"></i> Add New Row
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-calendar-x fs-1 opacity-25"></i>
                            <p className="mt-2">{selectedCourseId ? "No teaching plan found for this course. Click 'Upload Plan' to start." : "Please select a course to view its teaching plan."}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Teachplan;
