import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Viewcourse3.css';

const Viewcourse3 = () => {
    const navigate = useNavigate();
    const syllabusLink = "https://econtent.msbte.edu.in/curriculum_search/";

    const [isEditing, setIsEditing] = useState(false);
    const [assignedFaculty, setAssignedFaculty] = useState("");
    const [selectedFaculty, setSelectedFaculty] = useState("R.V.Deshpande");

    const facultyOptions = [
        "R.V.Deshpande",
        "V.Wagh",
        "A.Aher",
        "Y.D.Mahajan",
        "P.Datir"
    ];

    const handleActionClick = () => {
        if (isEditing) {
            setAssignedFaculty(selectedFaculty);
            setIsEditing(false);
        } else {
            setIsEditing(true);
        }
    };

    return (
        <div className="viewcourse3-wrapper">
            <div className="viewcourse3-main">
                <button className="btn btn-link btn-sm text-decoration-none mb-3" onClick={() => navigate('/course-management')}>
                    ← Back to Course Management
                </button>
                <div className="viewcourse3-card">

                    <div className="vc3-section">
                        <h5 className="vc3-section-title">MSBTE's syllabus link to view details of courses</h5>
                        <input
                            type="text"
                            className="vc3-link-input"
                            value={syllabusLink}
                            readOnly
                        />
                    </div>

                    <div className="vc3-course-details">
                        <p>Course Title : Data Analytics</p>
                        <p>Course Code : 315326</p>
                        <p>Course Abbreviation : DAN</p>
                    </div>

                    <div className="vc3-table-container">
                        <table className="vc3-assessment-table">
                            <thead>
                                <tr>
                                    <th colSpan="10" className="main-header">Assessment Scheme</th>
                                </tr>
                                <tr>
                                    <th rowSpan="3" className="vertical-align-middle" style={{ width: '80px' }}>Paper Duration</th>
                                    <th colSpan="3">Theory</th>
                                    <th colSpan="2">Based on LL & TL</th>
                                    <th colSpan="3">Based on SL</th>
                                    <th rowSpan="3" className="vertical-align-middle">Total Marks</th>
                                </tr>
                                <tr>
                                    <th rowSpan="2">FA-TH</th>
                                    <th rowSpan="2">SA-TH</th>
                                    <th rowSpan="2">Total</th>
                                    <th colSpan="5">Practical</th>
                                </tr>
                                <tr>
                                    <th>FA-PR</th>
                                    <th>SA-PR</th>
                                    <th>SLA</th>
                                    <th style={{ width: '30px' }}>-</th>
                                    <th style={{ width: '30px' }}>-</th>
                                </tr>
                                <tr className="limits-row">
                                    <td></td>
                                    <td>Max</td>
                                    <td>Max</td>
                                    <td>Max</td>
                                    <td>Min</td>
                                    <td>Max</td>
                                    <td>Min</td>
                                    <td>Max</td>
                                    <td>Min</td>
                                    <td></td>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="data-row">
                                    <td>3</td>
                                    <td>30</td>
                                    <td>70</td>
                                    <td>100</td>
                                    <td>40</td>
                                    <td>25</td>
                                    <td>10</td>
                                    <td>25#</td>
                                    <td>10</td>
                                    <td>150</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="instruction-text">Choose the faculty member from the list on clicking of dropdown & click button 'Save'</p>

                    <div className="vc3-faculty-section">
                        <div className="faculty-row">
                            <span className="faculty-label">Assigned faculty :</span>

                            <div className="faculty-control-container">
                                {isEditing ? (
                                    <select
                                        className="faculty-select"
                                        value={selectedFaculty}
                                        onChange={(e) => setSelectedFaculty(e.target.value)}
                                    >
                                        {facultyOptions.map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="faculty-display-text">
                                        {assignedFaculty || "Not assigned yet"}
                                        {!assignedFaculty && <span className="dropdown-indicator"> ▼</span>}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="action-button-container">
                            <button className="btn-assign-save" onClick={handleActionClick}>
                                {isEditing ? "Save" : (assignedFaculty ? "Change" : "Assign")}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Viewcourse3;
