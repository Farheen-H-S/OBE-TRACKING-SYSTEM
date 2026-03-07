import React, { useState, useEffect, useCallback } from 'react';
import { useFilters } from '../../../context/FilterContext';
import api from '../../../utils/axios';
import { Button, Spinner, Alert, Table, Form } from 'react-bootstrap';
import { FaCopy, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import './Teacherfeedbackcreate.css';

const Teacherfeedbackcreate = () => {
    const { selectedDept, selectedAcademicYear, selectedSemester } = useFilters();

    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    const defaultQuestions = [
        "The teacher comes to class on time.",
        "The teacher completes the lecture as per the timetable.",
        "The teacher maintains discipline in the classroom.",
        "The teacher revises the previous lecture before starting a new topic.",
        "The teacher explains concepts clearly and understandably.",
        "The teacher uses suitable examples to explain topics.",
        "The teacher is well prepared for every lecture."
    ];

    const fetchSurveys = useCallback(async () => {
        if (!selectedDept || !selectedAcademicYear) return;
        setLoading(true);
        try {
            const res = await api.get('/surveys/', {
                params: {
                    survey_category: 'feedback',
                    academic_year: selectedAcademicYear,
                    program_id: selectedDept
                }
            });
            setSurveys(res.data);
        } catch (err) {
            console.error("Error fetching feedback surveys:", err);
            setError("Failed to load survey data.");
        } finally {
            setLoading(false);
        }
    }, [selectedDept, selectedAcademicYear]);

    useEffect(() => {
        fetchSurveys();
    }, [fetchSurveys]);

    const handleCopy = (url) => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCreateSurvey = async () => {
        if (!selectedDept || !selectedAcademicYear) {
            alert("Please select Department and Academic Year.");
            return;
        }

        try {
            const payload = {
                survey_name: `Teacher Feedback - ${selectedAcademicYear}`,
                survey_category: 'feedback',
                academic_year: selectedAcademicYear,
                semester: selectedSemester || null,
                program_id: selectedDept,
                status: 'APPROVED',
                questions: defaultQuestions.map(q => ({ question_text: q }))
            };
            await api.post('/surveys/', payload);
            fetchSurveys();
            alert("Feedback survey created and approved!");
        } catch (err) {
            alert("Failed to create survey.");
        }
    };

    const activeSurvey = surveys.find(s => s.status === 'APPROVED');
    const surveyUrl = activeSurvey ? `${window.location.origin}/student/feedback?survey_id=${activeSurvey.survey_id}` : "No active survey";

    // Dummy data for months (matching user's original UI concept)
    const months = [
        { name: 'January', survey: surveys.find(s => s.survey_name.includes('January')) },
        { name: 'February', survey: surveys.find(s => s.survey_name.includes('February')) },
        { name: 'March', survey: null },
        { name: 'April', survey: null },
    ];

    return (
        <div className="teacher-feedback-container">
            <div className="feedback-content-wrapper">
                <div className="feedback-card">
                    <h4 className="fw-bold text-primary mb-4">Teacher Feedback Management</h4>

                    {error && <Alert variant="danger">{error}</Alert>}

                    {!selectedDept && (
                        <Alert variant="warning">Please select a Department from the top filters.</Alert>
                    )}

                    {/* URL Section */}
                    <div className="mb-5 p-3 bg-light rounded border">
                        <label className="fw-bold mb-2 text-dark">Teacher Feedback Survey URL</label>
                        <div className="input-group">
                            <Form.Control
                                type="text"
                                className="text-primary fw-semibold"
                                value={activeSurvey ? surveyUrl : "No Active Survey Found"}
                                readOnly
                                style={{ backgroundColor: '#f8f9fa' }}
                            />
                            <Button
                                variant={copied ? "success" : "primary"}
                                onClick={() => handleCopy(surveyUrl)}
                                disabled={!activeSurvey}
                            >
                                {copied ? 'Copied!' : <><FaCopy className="me-1" /> Copy</>}
                            </Button>
                        </div>
                        {!activeSurvey && selectedDept && (
                            <Button variant="outline-primary" size="sm" className="mt-2" onClick={handleCreateSurvey}>
                                Initialize New Survey
                            </Button>
                        )}
                    </div>

                    {/* Survey Status Section */}
                    <div className="mb-5">
                        <h5 className="fw-bold text-dark mb-3">Survey Status</h5>
                        <div className="table-responsive" style={{ maxWidth: '600px' }}>
                            <Table borderless hover className="status-table shadow-sm rounded">
                                <thead className="table-light border-bottom">
                                    <tr>
                                        <th className="text-primary">Month</th>
                                        <th className="text-dark">Status</th>
                                        <th className="text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {months.map((m, index) => (
                                        <tr key={index} className="align-middle">
                                            <td className="fw-semibold">{m.name}</td>
                                            <td>
                                                {m.survey ? (
                                                    <span className="text-success small fw-bold">
                                                        <FaCheckCircle className="me-1" /> Conducted
                                                    </span>
                                                ) : (
                                                    <span className="text-danger small fw-bold">
                                                        <FaTimesCircle className="me-1" /> Not Conducted
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                {!m.survey && activeSurvey && (
                                                    <Button variant="outline-success" size="sm" className="py-0 px-3">
                                                        Approve
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </div>

                    {/* Question Set Section */}
                    <div>
                        <h5 className="fw-bold text-dark mb-3">Question Set</h5>
                        <div className="bg-white p-3 rounded border shadow-sm">
                            <ol className="mb-0">
                                {defaultQuestions.map((q, index) => (
                                    <li key={index} className="mb-2 text-muted">{q}</li>
                                ))}
                            </ol>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Teacherfeedbackcreate;
