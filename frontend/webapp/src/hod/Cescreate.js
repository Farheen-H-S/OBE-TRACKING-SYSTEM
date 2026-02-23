import React from 'react';
import Header from '../components/header/Header';
import Sidebar from '../components/sidebar/Sidebar';
import './Cescreate.css';

const Cescreate = () => {
    const surveyLink = "https://econtent.msbte.edu.in/curriculum_search/";

    const handleCopy = () => {
        navigator.clipboard.writeText(surveyLink);
        alert("Link copied to clipboard!");
    };

    return (
        <div className="cescreate-wrapper">
            <Header />
            <div className="d-flex">
                <Sidebar />
                <div className="cescreate-main">
                    <div className="cescreate-card">

                        {/* URL Section */}
                        <div className="ces-url-section">
                            <h5 className="ces-section-title">Course Exit survey URL</h5>
                            <div className="ces-input-group">
                                <input
                                    type="text"
                                    className="ces-link-input"
                                    value={surveyLink}
                                    readOnly
                                />
                                <button className="btn-copy" onClick={handleCopy}>Copy</button>
                            </div>
                            <p className="ces-info-text">! Link active for days 6</p>
                        </div>

                        {/* Question Set Section */}
                        <div className="ces-question-set">
                            <h5 className="ces-subtitle">Question Set</h5>
                            <hr className="ces-divider" />

                            {/* Course 1 */}
                            <div className="ces-course-block">
                                <div className="ces-course-header">
                                    <p><strong>Name of course & code :</strong> JPR 312023</p>
                                    <p><strong>Faculty :</strong> Prof.Rashmi Despande</p>
                                </div>
                                <div className="ces-co-list">
                                    <p>CO 1 : Are you able to develop a program using java classes & objects</p>
                                    <p>CO 2 : Are you able to develop a program for implementing code reusability concept.</p>
                                    <p>CO 3 : Are you able to develop a program to implement multithreading & exception handling</p>
                                    <p>CO 4 : Are you able to develop a program for implenting event handling using window-based application components.</p>
                                    <div className="d-flex align-items-left gap-2">
                                        <p className="mb-0">CO 5 : Are you able to develop java program for managing database</p>
                                        <button className="btn-approve">Approve</button>
                                    </div>
                                </div>
                            </div>

                            {/* Course 2 */}
                            <div className="ces-course-block">
                                <div className="ces-course-header">
                                    <p><strong>Name of course & code :</strong> DAN 312025</p>
                                    <p><strong>Faculty :</strong> Prof.Yuraj Jadhav</p>
                                </div>
                                <div className="ces-co-list">
                                    <p>CO1 : Elaborate the fundamental concepts of Data Analytics.</p>
                                    <p>CO2 : Apply appropriate statistical techniques to analyze and interpret complex Datasets.</p>
                                    <p>CO3 : Analyze numerical data by creating pivot table.</p>
                                    <p>CO4 : Represent data in terms of various types of charts.</p>
                                    <div className="d-flex align-items-center gap-2">
                                        <p className="mb-0">CO5 : Visualize the data using a Python library.</p>
                                        <button className="btn-approve">Approve</button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cescreate;
