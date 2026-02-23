
import React, { useState } from 'react';
import Header from '../components/header/Header';
import Sidebar from '../components/sidebar/Sidebar';
import './Indirectcreate.css';


const Indirectcreate = () => {
    // ---------------- State for CO-Curricular Section ----------------
    const [coLink, setCoLink] = useState("https://forms.gle/AUQxLoHq7xJ5rAfL8");
    const [coTitle, setCoTitle] = useState("");
    const [isCoEditing, setIsCoEditing] = useState(false);
    const [coQuestions, setCoQuestions] = useState([
        "My academic workload (assignments, practicals, projects) feels excessive.",
        "I feel stressed due to frequent exams, tests, or evaluations.",
        "I worry a lot about my marks and academic performance.",
        "I feel pressure to perform well to meet expectations of parents or teachers.",
        "My academic workload (assignments, practicals, projects) feels excessive.",
        "I feel stressed due to frequent exams, tests, or evaluations.",
        "I worry a lot about my marks and academic performance.",
        "I feel pressure to perform well to meet expectations of parents or teachers."
    ]);

   
    const [extraLink, setExtraLink] = useState("https://forms.gle/AUQxLoHq7xJ5rAfL8");
    const [extraTitle, setExtraTitle] = useState("");
    const [isExtraEditing, setIsExtraEditing] = useState(false);
    const [extraQuestions, setExtraQuestions] = useState([
        "My academic workload (assignments, practicals, projects) feels excessive.",
        "I feel stressed due to frequent exams, tests, or evaluations.",
        "I worry a lot about my marks and academic performance.",
        "I feel pressure to perform well to meet expectations of parents or teachers.",
        "My academic workload (assignments, practicals, projects) feels excessive.",
        "I feel stressed due to frequent exams, tests, or evaluations.",
        "I worry a lot about my marks and academic performance.",
        "I feel pressure to perform well to meet expectations of parents or teachers."
    ]);

    

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        alert("Link copied to clipboard!");
    };

    const handleCoQuestionChange = (index, value) => {
        const newQuestions = [...coQuestions];
        newQuestions[index] = value;
        setCoQuestions(newQuestions);
    };

    const handleExtraQuestionChange = (index, value) => {
        const newQuestions = [...extraQuestions];
        newQuestions[index] = value;
        setExtraQuestions(newQuestions);
    };

    const handleApprove = (section) => {
        // Logic to approve/save to backend would go here
        alert(`${section} survey approved!`);
        if (section === 'CO-curricular') setIsCoEditing(false);
        if (section === 'Extra-curricular') setIsExtraEditing(false);
    };

    return (
        <div className="indirect-create-wrapper">
            <Header />
            <div className="d-flex" style={{ flexGrow: 1, overflow: 'hidden' }}>
                <Sidebar />
                <div className="indirect-content-main">
                    <div className="indirect-card">
                        <h2 className="indirect-title">Indirect survey creation</h2>

                        {/* ================= CO-curricular Section ================= */}
                        <div className="survey-section">
                            <h3 className="section-title">CO-curricular</h3>

                            {/* URL Input */}
                            <div className="url-input-group">
                                <input
                                    type="text"
                                    className="url-input"
                                    value={coLink}
                                    readOnly
                                />
                                <button className="copy-btn" onClick={() => handleCopy(coLink)}>
                                    Copy
                                </button>
                            </div>

                            {/* Assign Title --- text */}
                            <div className="assign-title-row">
                                <label className="assign-label">Assign title of activity:</label>
                                <input
                                    type="text"
                                    className="assign-input"
                                    value={coTitle}
                                    onChange={(e) => setCoTitle(e.target.value)}
                                />
                            </div>

                            {/* Question Set */}
                            <div className="question-set-block">
                                <div className="question-set-header">Question set</div>
                                <ol className="question-list">
                                    {coQuestions.map((q, index) => (
                                        <li key={index} className="question-item">
                                            {isCoEditing ? (
                                                <input
                                                    type="text"
                                                    className="question-input"
                                                    value={q}
                                                    onChange={(e) => handleCoQuestionChange(index, e.target.value)}
                                                />
                                            ) : (
                                                <span>{q}</span>
                                            )}
                                        </li>
                                    ))}
                                </ol>

                                <div className="action-buttons">
                                    <button
                                        className="edit-btn"
                                        onClick={() => setIsCoEditing(!isCoEditing)}
                                    >
                                        {isCoEditing ? "Save" : "Edit"}
                                    </button>
                                    <button
                                        className="approve-btn"
                                        onClick={() => handleApprove("CO-curricular")}
                                    >
                                        Approve
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="divider-line"></div>

                        {/* ================= Extra-curricular Section ================= */}
                        <div className="survey-section">
                            <h3 className="section-title">Extra-curricular</h3>

                            {/* URL Input */}
                            <div className="url-input-group">
                                <input
                                    type="text"
                                    className="url-input"
                                    value={extraLink}
                                    readOnly
                                />
                                <button className="copy-btn" onClick={() => handleCopy(extraLink)}>
                                    Copy
                                </button>
                            </div>

                            {/* Assign Title text */}
                            <div className="assign-title-row">
                                <label className="assign-label">Assign title of activity:</label>
                                <input
                                    type="text"
                                    className="assign-input"
                                    value={extraTitle}
                                    onChange={(e) => setExtraTitle(e.target.value)}
                                />
                            </div>

                            {/* Question Set */}
                            <div className="question-set-block">
                                <div className="question-set-header">Question set</div>
                                <ol className="question-list">
                                    {extraQuestions.map((q, index) => (
                                        <li key={index} className="question-item">
                                            {isExtraEditing ? (
                                                <input
                                                    type="text"
                                                    className="question-input"
                                                    value={q}
                                                    onChange={(e) => handleExtraQuestionChange(index, e.target.value)}
                                                />
                                            ) : (
                                                <span>{q}</span>
                                            )}
                                        </li>
                                    ))}
                                </ol>

                                <div className="action-buttons">
                                    <button
                                        className="edit-btn"
                                        onClick={() => setIsExtraEditing(!isExtraEditing)}
                                    >
                                        {isExtraEditing ? "Save" : "Edit"}
                                    </button>
                                    <button
                                        className="approve-btn"
                                        onClick={() => handleApprove("Extra-curricular")}
                                    >
                                        Approve
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Indirectcreate;
