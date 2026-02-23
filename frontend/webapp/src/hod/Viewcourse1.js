import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header/Header';
import Sidebar from '../components/sidebar/Sidebar';
import './Viewcourse1.css';

const Viewcourse1 = () => {
    const navigate = useNavigate();
    const syllabusLink = "https://econtent.msbte.edu.in/curriculum_search/";

    const [copySuccess, setCopySuccess] = useState('');

    const copyToClipboard = () => {
        navigator.clipboard.writeText(syllabusLink);
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000); // Clear message after 2s
    };

    const courses = [
        "Data Analytics",
        "Software Engineering",
        "Operating System",
        "Java Programming",
        "Entrepreneurship development"
    ];

    return (
        <div className="viewcourse1-wrapper">
            <Header />
            <div className="d-flex">
                <Sidebar />
                <div className="viewcourse1-main">
                    <div className="viewcourse1-card">

                        {/* Syllabus Link Section */}
                        <div className="syllabus-section">
                            <h5 className="section-header-title">MSBTE's syllabus link to view details of courses</h5>
                            <div className="link-input-group">
                                <input
                                    type="text"
                                    className="link-input"
                                    value={syllabusLink}
                                    readOnly
                                />
                                <button className="btn-copy" onClick={copyToClipboard}>
                                    {copySuccess || "Copy"}
                                </button>
                            </div>
                        </div>

                        {/* All Courses Section */}
                        <div className="courses-section">
                            <h5 className="section-header-title">All Courses :</h5>
                            <div className="course-buttons-list">
                                {courses.map((course, index) => (
                                    <button key={index} className="btn-course" onClick={() => navigate('/view-course2')}>
                                        {course}
                                    </button>
                                ))}
                            </div>

                            <p className="footer-note">
                                Click on above courses to view details & assigned faculty
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Viewcourse1;
