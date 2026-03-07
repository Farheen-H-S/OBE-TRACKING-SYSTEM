import React, { useState, useEffect, useCallback } from 'react';
import { useFilters } from '../../../context/FilterContext';
import api from '../../../utils/axios';
import { getLoggedInUser } from '../../../utils/auth';
import { Button, Spinner, Alert, Form } from 'react-bootstrap';
import './Teachplan.css';

const Teachplan = () => {
    const { selectedDept, selectedScheme, selectedYear, selectedSemester, selectedBatch } = useFilters();
    const user = getLoggedInUser();

    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [plan, setPlan] = useState(null);
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    const fetchCourses = useCallback(async () => {
        const role = (user?.role_name || user?.role || '').toLowerCase();
        const isFaculty = role === 'faculty';

        if (!selectedYear) return;
        if (!isFaculty && !selectedDept) return; // HOD/Coord must select Dept
        try {
            const res = await api.get('/academics/courses/', {
                params: {
                    program_id: selectedDept,
                    academic_year: selectedYear,
                    semester: selectedSemester,
                    scheme_id: selectedScheme
                }
            });
            setCourses(res.data);
            if (res.data.length > 0 && !selectedCourseId) {
                setSelectedCourseId(res.data[0].course_id);
            }
        } catch (err) {
            console.error("Error fetching courses:", err);
        }
    }, [selectedDept, selectedYear, selectedSemester, selectedScheme]);

    const fetchPlan = useCallback(async () => {
        if (!selectedCourseId) return;

        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/teaching-plan/', {
                params: {
                    course_id: selectedCourseId,
                    academic_year: selectedYear,
                    semester: selectedSemester,
                    scheme_id: selectedScheme
                }
            });

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
    }, [selectedCourseId, selectedYear, selectedSemester, selectedScheme]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    useEffect(() => {
        fetchPlan();
    }, [fetchPlan]);

    const handleCreatePlan = async () => {
        if (!selectedCourseId) return;

        setSaving(true);
        try {
            const payload = {
                course_id: selectedCourseId,
                user_id: user.user_id,
                batch_id: selectedBatch || null,
                scheme_id: selectedScheme,
                academic_year: selectedYear,
                semester: selectedSemester,
                is_active: true
            };
            const res = await api.post('/teaching-plan/', payload);
            setPlan(res.data);
            setLectures([]);
            setSuccessMsg("Plan initialized!");
        } catch (err) {
            setError("Failed to create plan.");
        } finally {
            setSaving(false);
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
                is_completed: false,
                remark: ""
            }
        ]);
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
                                <Button variant="outline-primary" size="sm" onClick={handleCreatePlan} disabled={!selectedCourseId || saving}>
                                    {saving ? 'Creating...' : 'Initialize Plan'}
                                </Button>
                            )}
                        </div>
                    </div>

                    {error && <Alert variant="danger">{error}</Alert>}
                    {successMsg && <Alert variant="success">{successMsg}</Alert>}

                    {!selectedDept && (
                        <Alert variant="warning">Please select a Department from the top filters to begin.</Alert>
                    )}

                    {plan ? (
                        <div className="table-responsive">
                            <table className="teachplan-table">
                                <thead>
                                    <tr>
                                        <th className="col-lecture">Lec No.</th>
                                        <th className="col-date">Planned Date</th>
                                        <th className="col-topics">Topics Planned</th>
                                        <th className="col-completed">Status</th>
                                        <th className="col-remark">Remark</th>
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
                                            <td className="col-completed text-center">
                                                <div className="form-check form-check-inline">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={row.is_completed}
                                                        onChange={(e) => handleInputChange(index, 'is_completed', e.target.checked)}
                                                    />
                                                    <label className="form-check-label small">{row.is_completed ? 'Completed' : 'Pending'}</label>
                                                </div>
                                            </td>
                                            <td className="col-remark">
                                                <input
                                                    type="text"
                                                    className="editable-input"
                                                    value={row.remark || ''}
                                                    onChange={(e) => handleInputChange(index, 'remark', e.target.value)}
                                                    placeholder="Add remark..."
                                                />
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
                            <p className="mt-2">{selectedCourseId ? "No teaching plan found for this course. Click 'Initialize Plan' to start." : "Please select a course to view its teaching plan."}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Teachplan;
