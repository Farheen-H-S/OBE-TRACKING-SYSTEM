import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Viewcourse2.css';

const Viewcourse2 = () => {
    const navigate = useNavigate();
    const syllabusLink = "https://econtent.msbte.edu.in/curriculum_search/";

    // State for Faculty Name editing
    const [isEditable, setIsEditable] = useState(false);
    const [facultyName, setFacultyName] = useState("Prof . Yuvaraj Jadhav");

    const handleFacultyChange = () => {
        setIsEditable(!isEditable);
    };

    return (
        <div className="viewcourse2-wrapper">
            <div className="viewcourse2-main">
                <button className="btn btn-link btn-sm text-decoration-none mb-3" onClick={() => navigate('/course-management')}>
                    ← Back to Course Management
                </button>
                <div className="viewcourse2-card">

                    {/* Syllabus Link Section */}
                    <div className="vc2-section">
                        <h5 className="vc2-section-title">MSBTE Syllabus Curriculum Search</h5>

                        <input
                            type="text"
                            className="vc2-link-input"
                            value={syllabusLink}
                            readOnly
                        />

                    </div>

                    {/* Course Details */}
                    <div className="vc2-course-details">
                        <p>Course Title : Data Analytics</p>
                        <p>Course Code : 315326</p>
                        <p>Course Abbreviation : DAN</p>
                    </div>

                    {/* Assessment Scheme Table */}
                    <div className="vc2-table-container">
                        <table className="vc2-assessment-table">
                            <thead>
                                <tr>
                                    <th colSpan="10">Assessment Scheme</th>
                                </tr>
                                <tr>
                                    <th rowSpan="3" className="vertical-align-middle">Paper Duration</th>
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
                                    <th>-</th>
                                    <th>-</th>
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
                                    <td>-</td>
                                    <td style={{ display: 'none' }}>fix</td>
                                </tr>
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

                    {/* Faculty Section */}
                    <div className="vc2-faculty-section">
                        <span className="faculty-label">Assigned faculty :</span>
                        <div className="faculty-input-wrapper">
                            <input
                                type="text"
                                className="faculty-input"
                                value={facultyName}
                                onChange={(e) => setFacultyName(e.target.value)}
                                readOnly={!isEditable}
                                style={{
                                    borderBottom: isEditable ? '2px solid #4da3ff' : '2px solid #2c3e50',
                                    cursor: isEditable ? 'text' : 'default'
                                }}
                            />
                            {!isEditable && <div className="input-underline"></div>}
                        </div>
                    </div>

                    <div className="vc2-action-area">
                        <button className="btn-change" onClick={handleFacultyChange}>
                            {isEditable ? "Save" : "Change"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Viewcourse2;
