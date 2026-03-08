import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useState, useCallback } from "react";
import { Button, Form, Modal, Alert, Badge } from "react-bootstrap";
import { useFilters } from "../../../context/FilterContext";

import "./Teacherfeedbackcreate.css";

import {
    getFeedbackSurveys,
    createFeedbackSurvey,
    updateFeedbackSurvey,
} from "../../../services/feedbackService";
import api from "../../../utils/axios";

const Teacherfeedbackcreate = () => {

    const { selectedYear, selectedDept, selectedSemester } = useFilters();

    /* ---------------- STATE ---------------- */

    const [surveys, setSurveys] = useState([]);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState(null);
    const [duration, setDuration] = useState(7); // Default 7 days
    const [timeLeft, setTimeLeft] = useState("");

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingSurvey, setEditingSurvey] = useState(null);
    const [editableQuestions, setEditableQuestions] = useState([]);

    const defaultQuestions = [
        "The teacher comes to class on time.",
        "The teacher completes the lecture as per the timetable.",
        "The teacher maintains discipline in the classroom.",
        "The teacher revises the previous lecture before starting a new topic.",
        "The teacher explains concepts clearly and understandably.",
        "The teacher uses suitable examples to explain topics.",
        "The teacher is well prepared for every lecture."
    ];

    /* ---------------- DERIVED ---------------- */
    const now = new Date();
    const currentYear = now.getFullYear();

    // Inject a virtual "Default" survey if no surveys exist for current selection
    const displaySurveys = surveys.length > 0 ? surveys : (selectedDept && selectedYear ? [{
        survey_id: 'default',
        survey_name: "Default Feedback Question Set",
        status: 'DRAFT',
        questions: defaultQuestions.map(q => ({ question_text: q }))
    }] : []);

    // Find latest active survey
    const activeSurvey = surveys
        .filter(s => {
            const isTimeActive = s.expires_at ? new Date(s.expires_at) > new Date() : true;
            return s.status === 'APPROVED' && s.is_active !== false && isTimeActive;
        })
        .sort((a, b) => b.survey_id - a.survey_id)[0];

    const surveyUrl = activeSurvey
        ? `${window.location.origin}/student/feedback?survey_id=${activeSurvey.survey_id}`
        : "";

    /* ---------------- LOAD DATA ---------------- */
    const fetchSurveys = useCallback(async () => {
        if (!selectedDept || !selectedYear) return;
        try {
            const res = await getFeedbackSurveys({
                academic_year: selectedYear,
                program_id: selectedDept
            });
            setSurveys(res.data);
            setError(null);
        } catch (err) {
            console.error("Failed to load surveys", err);
            setError("Failed to load survey data.");
        }
    }, [selectedDept, selectedYear]);

    useEffect(() => {
        fetchSurveys();
    }, [fetchSurveys]);

    const updateCountdown = useCallback(() => {
        if (!activeSurvey || !activeSurvey.expires_at) {
            setTimeLeft("");
            return;
        }

        const end = new Date(activeSurvey.expires_at).getTime();
        const nowMs = new Date().getTime();
        const diff = end - nowMs;

        if (diff <= 0) {
            setTimeLeft("Expired");
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        let timeString = "";
        if (days > 0) timeString += `${days} d `;
        timeString += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} `;
        setTimeLeft(timeString);
    }, [activeSurvey]);

    useEffect(() => {
        const timer = setInterval(() => {
            updateCountdown();
        }, 1000);

        return () => clearInterval(timer);
    }, [updateCountdown]);


    /* ---------------- HANDLERS ---------------- */

    const handleCopy = () => {
        if (!activeSurvey) return;
        navigator.clipboard.writeText(surveyUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleApprove = async (survey) => {
        if (!selectedDept || !selectedYear) {
            alert("Please select Department and Academic Year.");
            return;
        }

        if (!window.confirm(`Are you sure you want to approve this Feedback survey set for ${duration} days?`)) return;

        try {
            const now = new Date();
            const expiresAt = new Date();
            expiresAt.setDate(now.getDate() + parseInt(duration));

            // Fetch faculty for this department to generate matrix questions
            // We use the same API pattern as QuestionPage.js
            const usersRes = await api.get(`/users/?role=Faculty&department=${selectedDept}`);
            const teachers = usersRes.data.results || usersRes.data || [];

            if (teachers.length === 0) {
                alert("No faculty found for this department. Cannot create matrix feedback.");
                return;
            }

            // Generate Matrix Questions: For each statement, create a question for each teacher
            // Format: "Teacher Name | Statement"
            const statements = survey.questions?.length > 0
                ? survey.questions.map(q => typeof q === 'string' ? q : q.question_text)
                : defaultQuestions;

            const matrixQuestions = [];
            statements.forEach(stmt => {
                teachers.forEach(teacher => {
                    matrixQuestions.push({ question_text: `${teacher.name} | ${stmt}` });
                });
            });

            const payload = {
                survey_name: `Teacher Feedback - ${selectedYear} (${now.toLocaleDateString()})`,
                survey_category: 'feedback',
                academic_year: selectedYear,
                semester: selectedSemester || null,
                program_id: selectedDept,
                status: 'APPROVED',
                expires_at: expiresAt.toISOString(),
                questions: matrixQuestions
            };

            if (survey.survey_id === 'default') {
                await createFeedbackSurvey(payload);
            } else {
                await updateFeedbackSurvey(survey.survey_id, payload);
            }

            alert("Feedback survey approved and activated!");
            fetchSurveys();
        } catch (err) {
            console.error(err);
            alert("Failed to activate survey.");
        }
    };

    const handleEdit = (survey) => {
        setEditingSurvey(survey);
        setEditableQuestions(JSON.parse(JSON.stringify(survey.questions || [])));
        setShowEditModal(true);
    };

    const handleQuestionChange = (index, newText) => {
        setEditableQuestions(prev => prev.map((q, i) =>
            i === index ? { ...q, question_text: newText } : q
        ));
    };

    const handleSaveEdit = async () => {
        try {
            if (editingSurvey.survey_id === 'default') {
                const now = new Date();
                const payload = {
                    survey_name: `Teacher Feedback - ${selectedYear} (Custom)`,
                    survey_category: 'feedback',
                    academic_year: selectedYear,
                    semester: selectedSemester || null,
                    program_id: selectedDept,
                    status: 'DRAFT',
                    questions: editableQuestions
                };
                await createFeedbackSurvey(payload);
            } else {
                const payload = {
                    questions: editableQuestions
                };
                await updateFeedbackSurvey(editingSurvey.survey_id, payload);
            }
            fetchSurveys();
            setShowEditModal(false);
        } catch (error) {
            console.error("Error updating questions:", error);
            alert("Failed to update questions");
        }
    };

    const handleCloseSurvey = async (surveyId) => {
        if (!window.confirm("Are you sure you want to CLOSE this feedback survey early?")) return;

        try {
            await updateFeedbackSurvey(surveyId, {
                status: 'CLOSED',
                is_active: false,
                expires_at: new Date().toISOString()
            });
            alert("Survey closed successfully.");
            fetchSurveys();
        } catch (err) {
            console.error("Failed to close survey", err);
            alert("Failed to close survey");
        }
    };

    /* ---------------- UI ---------------- */

    return (
        <div className="flex-grow-1">
            <div className="p-3 bg-light overflow-y-auto" style={{ height: '100%' }}>
                <div className="container-fluid bg-white p-4 shadow-sm rounded">

                    <hr className="my-4" />

                    {error && <Alert variant="danger">{error}</Alert>}

                    {!selectedDept && (
                        <Alert variant="warning">Please select a Department from the top filters.</Alert>
                    )}

                    {/* Survey URL */}
                    <div className="mb-5">
                        <h5 className="section-title fw-bold">
                            Teacher Feedback Survey Link
                        </h5>

                        <div className="d-flex gap-2 mt-3">
                            <Form.Control
                                type="text"
                                value={activeSurvey ? surveyUrl : ""}
                                placeholder={activeSurvey ? "" : "No active feedback survey approved yet."}
                                readOnly
                                className="url-input text-primary"
                            />
                            <Button
                                variant="primary"
                                className="fw-bold px-4"
                                onClick={handleCopy}
                                disabled={!activeSurvey}
                            >
                                {copied ? "Copied!" : "Copy Link"}
                            </Button>
                        </div>
                        {activeSurvey && timeLeft && (
                            <div className="mt-2 text-muted small">
                                <i className="bi bi-clock-history me-1"></i>
                                This link will expire in <span className="fw-bold text-danger">{timeLeft}</span>
                            </div>
                        )}
                    </div>

                    {/* Recent Surveys */}
                    <h5 className="section-title fw-bold">
                        Feedback Survey Question Sets
                    </h5>

                    {displaySurveys.length === 0 && selectedDept && (
                        <p className="text-muted mt-3">No feedback surveys found.</p>
                    )}

                    {displaySurveys.map((survey, index) => {
                        const isActive = survey.status === 'APPROVED';
                        const isExpired = survey.status === 'APPROVED' && survey.expires_at && new Date(survey.expires_at) < new Date();

                        return (
                            <div className="question-set-card" key={survey.survey_id}>
                                <div className="question-set-header">
                                    <h6 className="question-set-name">
                                        <i className="bi bi-file-earmark-text me-2"></i>
                                        {survey.survey_name}
                                    </h6>
                                    <span className={`status-badge ${isActive ? 'active' : (isExpired ? 'expired' : 'inactive')}`}>
                                        {isActive ? 'Active' : (isExpired ? 'Expired' : survey.status)}
                                    </span>
                                </div>

                                <div className="p-4">
                                    <div className="ps-3 border-start">
                                        <ul className="list-unstyled">
                                            {(survey.questions?.length > 0 ? survey.questions : defaultQuestions).map((q, idx) => (
                                                <li key={idx} className="mb-2 text-dark d-flex align-items-baseline">
                                                    <span className="me-2 text-muted small fw-bold" style={{ minWidth: '20px' }}>{idx + 1}.</span>
                                                    <span>{typeof q === 'string' ? q : q.question_text}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
                                        <Button
                                            variant="outline-primary"
                                            className="px-4"
                                            onClick={() => handleEdit(survey)}
                                            disabled={isActive}
                                            title={isActive ? "Cannot edit an active survey" : ""}
                                        >
                                            Edit
                                        </Button>

                                        {isActive ? (
                                            <div className="d-flex gap-2">
                                                <Button
                                                    variant="success"
                                                    className="px-4"
                                                    disabled
                                                >
                                                    Approved
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    className="px-3"
                                                    size="sm"
                                                    onClick={() => handleCloseSurvey(survey.survey_id)}
                                                    title="Close survey now"
                                                >
                                                    Close Early
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="d-flex align-items-center gap-3">
                                                <Form.Group className="mb-0">
                                                    <Form.Select
                                                        size="sm"
                                                        value={duration}
                                                        onChange={(e) => setDuration(e.target.value)}
                                                        disabled={!!activeSurvey}
                                                        style={{ width: '120px' }}
                                                    >
                                                        <option value={3}>3 Days</option>
                                                        <option value={7}>7 Days</option>
                                                        <option value={15}>15 Days</option>
                                                    </Form.Select>
                                                </Form.Group>
                                                <Button
                                                    variant="primary"
                                                    className="px-4"
                                                    onClick={() => handleApprove(survey)}
                                                    disabled={!!activeSurvey}
                                                    title={activeSurvey ? "Disable the current active survey to approve a new one" : ""}
                                                >
                                                    Approve
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Edit Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Feedback Questions</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {editableQuestions.map((q, index) => (
                        <Form.Group key={index} className="mb-3">
                            <Form.Label className="fw-bold">
                                Question {index + 1}
                            </Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={q.question_text}
                                onChange={(e) => handleQuestionChange(index, e.target.value)}
                            />
                        </Form.Group>
                    ))}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSaveEdit}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>
        </div >
    );
};

export default Teacherfeedbackcreate;
