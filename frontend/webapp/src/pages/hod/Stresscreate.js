import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";

import "./Stresscreate.css";

import {
    getStressSurveys,
    createStressSurvey,
    getStressQuestionSets,
    updateStressSurvey,
    updateStressQuestion
} from "../../services/stressService";

const Stresscreate = () => {

    /* ---------------- STATE ---------------- */

    const [surveys, setSurveys] = useState([]);
    const [questionSets, setQuestionSets] = useState([]); // Store fetched sets
    const [copied, setCopied] = useState(false);

    const [error, setError] = useState(null);
    const [duration, setDuration] = useState(7); // Default 7 days
    const [timeLeft, setTimeLeft] = useState("");

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingSet, setEditingSet] = useState(null);
    const [editableQuestions, setEditableQuestions] = useState([]);

    /* ---------------- DERIVED ---------------- */
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Find all active surveys for this month, sorted by survey_id descending to get the LATEST one
    const activeSurvey = surveys
        .filter(s => s.is_active === true && s.month === currentMonth && s.year === currentYear)
        .sort((a, b) => b.survey_id - a.survey_id)[0];

    const surveyUrl = activeSurvey
        ? `${window.location.origin}/stress/welcome`
        : "";

    /* ---------------- LOAD DATA ---------------- */
    const fetchSurveys = async () => {
        try {
            const res = await getStressSurveys();
            setSurveys(res.data);
        } catch (err) {
            console.error("Failed to load surveys", err);
        }
    };

    const fetchQuestionSets = async () => {
        try {
            const res = await getStressQuestionSets();
            setQuestionSets(res.data);
        } catch (err) {
            console.error("Failed to load question sets", err);
            setError("Failed to load question sets.");
        }
    };

    useEffect(() => {
        fetchSurveys();
        fetchQuestionSets();
    }, []);

    const updateCountdown = () => {
        if (!activeSurvey || !activeSurvey.end_date) {
            setTimeLeft("");
            return;
        }

        const end = new Date(activeSurvey.end_date).getTime();
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
        if (days > 0) timeString += `${days}d `;
        timeString += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        setTimeLeft(timeString);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            updateCountdown();
        }, 1000);

        return () => clearInterval(timer);
    }, [activeSurvey, surveys]);


    /* ---------------- HANDLERS ---------------- */

    const handleCopy = () => {
        if (!activeSurvey) return;
        // Construct URL for public entry
        // The pattern in urls.py is surveys/<pk>/public-entry/ for token generation
        // But the user wants a link to SHARE.
        // Usually something like http://domain/stress/welcome?survey=123 (or just /stress/welcome if it finds active)
        const link = `${window.location.origin}/stress/welcome`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleApprove = async (questionSetId) => {
        if (!window.confirm(`Are you sure you want to approve this Question Set for ${duration} days? This will activate a new survey.`)) return;

        try {
            const now = new Date();
            const endDate = new Date();
            endDate.setDate(now.getDate() + parseInt(duration));

            const payload = {
                title: `Student Stress Survey ${now.getMonth() + 1}/${now.getFullYear()}`,
                month: now.getMonth() + 1,
                year: now.getFullYear(),
                approved_question_set: questionSetId,
                is_active: true,
                end_date: endDate.toISOString()
            };

            await createStressSurvey(payload);
            alert("Survey approved and activated");

            fetchSurveys(); // Refresh to get the new active survey and update URL
        } catch (err) {
            console.error(err);
            alert("Survey approval failed");
        }
    };

    /* ---------------- UI HELPERS ---------------- */

    const groupBy = (array, key) => {
        return array.reduce((result, item) => {
            (result[item[key]] = result[item[key]] || []).push(item);
            return result;
        }, {});
    };

    const handleEdit = (setId) => {
        const set = questionSets.find(s => s.question_set_id === setId);
        if (!set) return;
        setEditingSet(set);
        // Deep copy questions to editable state
        setEditableQuestions(JSON.parse(JSON.stringify(set.set_questions || [])));
        setShowEditModal(true);
    };

    const handleQuestionChange = (qId, newText) => {
        setEditableQuestions(prev => prev.map(q =>
            q.question === qId ? { ...q, question_text: newText } : q
        ));
    };

    const handleSaveEdit = async () => {
        try {
            // Find modified questions
            const originalQuestions = editingSet.set_questions || [];
            const updates = [];

            editableQuestions.forEach(editedQ => {
                const originalQ = originalQuestions.find(oq => oq.question === editedQ.question);
                if (originalQ && originalQ.question_text !== editedQ.question_text) {
                    updates.push(updateStressQuestion(editedQ.question, { question_text: editedQ.question_text }));
                }
            });

            if (updates.length > 0) {
                await Promise.all(updates);
                fetchQuestionSets(); // Refresh data
            }
            setShowEditModal(false);
        } catch (error) {
            console.error("Error updating questions:", error);
            // alert("Failed to update questions"); // Removed alert
        }
    };

    const handleCloseSurvey = async (surveyId) => {
        if (!window.confirm("Are you sure you want to CLOSE this survey early? No further responses will be accepted.")) return;

        try {
            await updateStressSurvey(surveyId, {
                is_active: false,
                end_date: new Date().toISOString()
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

                    {/* Survey URL */}
                    <div className="mb-5">
                        <h5 className="section-title fw-bold">
                            Student Stress Survey Link
                        </h5>

                        <div className="d-flex gap-2 mt-3">
                            <Form.Control
                                type="text"
                                value={activeSurvey ? `${window.location.origin}/stress/welcome` : ""}
                                placeholder={activeSurvey ? "" : "No active survey approved yet."}
                                readOnly
                                className="url-input text-primary"
                            />
                            <Button
                                variant="primary"
                                className="fw-bold px-4"
                                onClick={handleCopy}
                                disabled={!activeSurvey}
                                title={!activeSurvey ? "Approve a question set to enable the survey link" : ""}
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

                    {/* Question Sets */}
                    <h5 className="section-title fw-bold">
                        Stress Survey Question Sets
                    </h5>

                    {error && <div className="alert alert-danger">{error}</div>}

                    {questionSets.length === 0 && !error && (
                        <p className="text-muted mt-3">No question sets found.</p>
                    )}

                    {questionSets.map((set, index) => {
                        let globalIndex = 0; // Continuous numbering counter for this set
                        const isActive = activeSurvey?.approved_question_set === set.question_set_id;

                        return (
                            <div className="question-set-card" key={set.question_set_id}>
                                <div className="question-set-header">
                                    <h6 className="question-set-name">
                                        <i className="bi bi-file-earmark-text me-2"></i>
                                        Question Set {index + 1}
                                    </h6>
                                    <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
                                        {isActive ? 'Active' : 'Draft'}
                                    </span>
                                </div>

                                <div className="p-4">
                                    <div className="ps-3 border-start">
                                        {set.set_questions && Object.entries(groupBy(set.set_questions, 'category')).map(([category, questions]) => (
                                            <div key={category} className="mb-4">
                                                <h6 className="fw-bold text-secondary text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1.2px' }}>
                                                    {category}
                                                </h6>
                                                <ul className="list-unstyled">
                                                    {questions.map((q, idx) => {
                                                        globalIndex++;
                                                        return (
                                                            <li key={idx} className="mb-2 text-dark d-flex align-items-baseline">
                                                                <span className="me-2 text-muted small fw-bold" style={{ minWidth: '20px' }}>{globalIndex}.</span>
                                                                <span>{q.question_text}</span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
                                        <Button
                                            variant="outline-primary"
                                            className="px-4"
                                            onClick={() => handleEdit(set.question_set_id)}
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
                                                    onClick={() => handleCloseSurvey(activeSurvey.survey_id)}
                                                    title="Close survey now"
                                                >
                                                    Close Early
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="d-flex align-items-center gap-3">
                                                <Form.Group controlId={`duration-${set.question_set_id}`} className="mb-0">
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
                                                        <option value={30}>30 Days</option>
                                                    </Form.Select>
                                                </Form.Group>
                                                <Button
                                                    variant="primary"
                                                    className="px-4"
                                                    onClick={() => handleApprove(set.question_set_id)}
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
                    <Modal.Title>Edit Questions - {editingSet?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {editableQuestions.map((q, index) => (
                        <Form.Group key={q.question} className="mb-3">
                            <Form.Label className="fw-bold">
                                {index + 1}. {q.category || "Uncategorized"}
                            </Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={q.question_text}
                                onChange={(e) => handleQuestionChange(q.question, e.target.value)}
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
        </div>
    );
};

export default Stresscreate;
