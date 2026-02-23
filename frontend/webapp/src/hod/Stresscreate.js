import React, { useState } from 'react';
import Header from '../components/header/Header';
import Sidebar from '../components/sidebar/Sidebar';
import './Stresscreate.css';
import { Button, Form } from 'react-bootstrap';

const Stresscreate = () => {
    const surveyUrl = "https://forms.gle/AUQxLoHq7xJ5rAfL8";
    const [copied, setCopied] = useState(false);

    // State for questions
    const [qSet1, setQSet1] = useState([
        "1. My academic workload (assignments, practicals, projects) feels excessive.",
        "2. I feel stressed due to frequent exams, tests, or evaluations.",
        "3. I worry a lot about my marks and academic performance.",
        "4. I feel pressure to perform well to meet expectations of parents or teachers.",
        "5. My academic workload (assignments, practicals, projects) feels excessive.",
        "6. I feel stressed due to frequent exams, tests, or evaluations.",
        "7. I worry a lot about my marks and academic performance.",
        "8. I feel pressure to perform well to meet expectations of parents or teachers."
    ]);

    const [qSet2, setQSet2] = useState([
        "1. My academic workload (assignments, practicals, projects) feels excessive.",
        "2. I feel stressed due to frequent exams, tests, or evaluations.",
        "3. I worry a lot about my marks and academic performance.",
        "4. I feel pressure to perform well to meet expectations of parents or teachers.",
        "5. My academic workload (assignments, practicals, projects) feels excessive.",
        "6. I feel stressed due to frequent exams, tests, or evaluations.",
        "7. I worry a lot about my marks and academic performance.",
        "8. I feel pressure to perform well to meet expectations of parents or teachers."
    ]);

    // State for edit mode
    const [isEditingSet1, setIsEditingSet1] = useState(false);
    const [isEditingSet2, setIsEditingSet2] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(surveyUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEditToggle1 = () => {
        setIsEditingSet1(!isEditingSet1);
    };

    const handleEditToggle2 = () => {
        setIsEditingSet2(!isEditingSet2);
    };

    const handleQuestionChange1 = (index, value) => {
        const newQuestions = [...qSet1];
        newQuestions[index] = value;
        setQSet1(newQuestions);
    };

    const handleQuestionChange2 = (index, value) => {
        const newQuestions = [...qSet2];
        newQuestions[index] = value;
        setQSet2(newQuestions);
    };

    return (
        <div className="d-flex flex-column vh-100 overflow-hidden">
            <Header />
            <div className="d-flex flex-grow-1 overflow-hidden">
                <div className="sidebar-container h-100 overflow-y-auto">
                    <Sidebar />
                </div>
                <div className="flex-grow-1 p-3 bg-light overflow-y-auto w-50">
                    <div className="container-fluid bg-white p-4 shadow-sm rounded border-0" style={{ minHeight: '100%' }}>

                        {/* Survey URL Section */}
                        <div className="mb-5 f">
                            <h5 className="section-title fw-bold">Student stress servey URL</h5>
                            <div className="d-flex gap-2 align-items-left mt-3">
                                <Form.Control
                                    type="text"
                                    value={surveyUrl}
                                    readOnly
                                    className="url-input text-primary"
                                />
                                <Button variant="primary" className="btn-copy text-white fw-bold px-4" onClick={handleCopy}>
                                    {copied ? "Copied!" : "Copy"}
                                </Button>
                            </div>
                        </div>

                        {/* Question Set Section */}
                        <div className="mb-4">
                            <h5 className="section-title fw-bold">Stress survey question set</h5>

                            {/* Question Set 1 */}
                            <div className="mt-4">
                                <div className="d-flex align-items-left mb-3">
                                    <span className="text-decoration-underline fs-5 fw-bold text-primary question-set-link" style={{ cursor: 'pointer' }}>Question set 1</span>
                                </div>
                                <div className="ps-2">
                                    <ul className="list-unstyled">
                                        {qSet1.map((q, index) => (
                                            <li key={index} className="mb-1 text-dark fs-6">
                                                {isEditingSet1 ? (
                                                    <Form.Control
                                                        type="text"
                                                        value={q}
                                                        onChange={(e) => handleQuestionChange1(index, e.target.value)}
                                                        className="mb-2"
                                                        size="sm"
                                                    />
                                                ) : (
                                                    q
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="d-flex justify-content-end gap-3 mt-3">
                                        <Button variant="primary" className="px-4 fw-bold action-btn" onClick={handleEditToggle1}>
                                            {isEditingSet1 ? "Save" : "Edit"}
                                        </Button>
                                        <Button variant="primary" className="px-4 fw-bold action-btn">Approve</Button>
                                    </div>
                                </div>
                            </div>
                            <hr className="my-4" />

                            {/* Question Set 2 */}
                            <div className="mt-4">
                                <div className="d-flex align-items-center mb-3">
                                    <span className="text-decoration-underline fs-5 fw-bold text-primary question-set-link" style={{ cursor: 'pointer' }}>Question set 2</span>
                                </div>
                                <div className="ps-2">
                                    <ul className="list-unstyled">
                                        {qSet2.map((q, index) => (
                                            <li key={index} className="mb-1 text-dark fs-6">
                                                {isEditingSet2 ? (
                                                    <Form.Control
                                                        type="text"
                                                        value={q}
                                                        onChange={(e) => handleQuestionChange2(index, e.target.value)}
                                                        className="mb-2"
                                                        size="sm"
                                                    />
                                                ) : (
                                                    q
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="d-flex justify-content-end gap-3 mt-3">
                                        <Button variant="primary" className="px-4 fw-bold action-btn" onClick={handleEditToggle2}>
                                            {isEditingSet2 ? "Save" : "Edit"}
                                        </Button>
                                        <Button variant="primary" className="px-4 fw-bold action-btn">Approve</Button>
                                    </div>
                                </div>
                            </div>

                            {/* Question Set 3 was removed in user edits so it remains removed here */}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Stresscreate;
