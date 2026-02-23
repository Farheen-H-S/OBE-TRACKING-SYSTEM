import React, { useState } from 'react';
import Header from '../components/header/Header';
import Sidebar from '../components/sidebar/Sidebar';
import './Teacherfeedbackcreate.css';

const Teacherfeedbackcreate = () => {
    const defaultUrl = "https://forms.gle/AUQxLoHq7xJ5rAfL8";
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        setCopied(true);
        navigator.clipboard.writeText(defaultUrl);
        setTimeout(() => setCopied(false), 2000);
    };

    const surveyData = [
        { month: 'January', status: 'Conducted', action: null },
        { month: 'February', status: 'Conducted', action: null },
        { month: 'March', status: 'Not conducted', action: 'Approve' },
        { month: 'April', status: 'Not conducted', action: 'Approve' },
    ];

    const questions = [
        "The teacher comes to class on time.",
        "The teacher completes the lecture as per the timetable.",
        "The teacher maintains discipline in the classroom.",
        "The teacher revises the previous lecture before starting a new topic.",
        "The teacher explains concepts clearly and understandably.",
        "The teacher uses suitable examples to explain topics.",
        "The teacher is well prepared for every lecture."
    ];

    return (
        <div className="teacher-feedback-container">
            <Header />
            <div className="d-flex">
                <Sidebar />
                <div className="flex-grow-1 feedback-content-wrapper">
                    <div className="feedback-card">

                        {/* URL Section */}
                        <div className="mb-5">
                            <h5 className="mb-3" style={{ color: '#445069', fontWeight: 'bold' }}>Teacher feedback servery URL</h5>
                            <div className="input-group url-input-group">
                                <input
                                    type="text"
                                    className="form-control text-center text-primary"
                                    value={defaultUrl}
                                    readOnly
                                    style={{ color: '#4facfe', backgroundColor: 'white' }}
                                />
                                <button
                                    className={`btn ${copied ? 'btn-success' : 'btn-copy'}`}
                                    type="button"
                                    onClick={handleCopy}
                                >
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        {/* Survey Status Section */}
                        <div className="mb-5">
                            <h5 className="feedback-section-title">Survey status :</h5>
                            <div className="table-responsive" style={{ maxWidth: '400px' }}>
                                <table className="table table-borderless status-table">
                                    <thead>
                                        <tr>
                                            <th scope="col" className="ps-0" style={{ color: '#4facfe' }}>Month</th>
                                            <th scope="col" style={{ color: '#445069' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {surveyData.map((row, index) => (
                                            <tr key={index}>
                                                <td className="ps-0 text-primary-custom">{row.month}</td>
                                                <td>
                                                    <span className={row.status === 'Conducted' ? 'text-primary' : 'text-danger'}>
                                                        {row.status}
                                                    </span>
                                                    {row.action && (
                                                        <button className="btn-approve ms-2">
                                                            {row.action}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Question Set Section */}
                        <div>
                            <h5 className="feedback-section-title">Question set</h5>
                            <ol className="question-list">
                                {questions.map((q, index) => (
                                    <li key={index}>{q}</li>
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
