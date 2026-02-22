import React, { useState } from 'react';
import './Tracktarget1.css';

const Tracktarget = () => {
    // Sample data to get idea
    const initialCourses = [
        { code: '312016', name: 'Data analytics', assigned: 5, tracked: 2.5, gap: 2.5 },
        { code: '312017', name: 'Operating system', assigned: 5, tracked: 2.2, gap: 2.3 },
        { code: '312018', name: 'Software engineering', assigned: 5, tracked: 1.8, gap: 3.2 },
        { code: '312023', name: 'Industrial internship', assigned: 4.5, tracked: 1.5, gap: 3 },
        { code: '312015', name: 'Management', assigned: 5, tracked: 2.5, gap: 2.5 },
        { code: '312016', name: 'Network security', assigned: 4, tracked: 3, gap: 1 },
    ];

    const [courses] = useState(initialCourses);

    return (
        <div className="tracktarget-container">
            <div className="tracktarget-body">
                <div className="tracktarget-content">
                    <div className="tracktarget-card">
                        <div className="tracktarget-title">Target Progress</div>

                        {/* Progress Bar Section (Visual representation) */}
                        <div className="progress-section">
                            <div className="custom-progress-bar">
                                <div className="progress-fill" style={{ width: '40%' }}></div>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="track-table-header">
                            <div className="track-col code-col">Course code</div>
                            <div className="track-col course-col">Course</div>
                            <div className="track-col assigned-col">Assigned target</div>
                            <div className="track-col tracked-col">Tracked target</div>
                            <div className="track-col gap-col">Gap</div>
                        </div>

                        <div className="track-table-body">
                            {courses.map((course, index) => (
                                <div key={index} className="track-table-row">
                                    <div className="track-col code-col text-dark">{course.code}</div>
                                    <div className="track-col course-col text-primary">{course.name}</div>
                                    <div className="track-col assigned-col center-cell">
                                        <div className="data-box">{course.assigned}</div>
                                    </div>
                                    <div className="track-col tracked-col center-cell">
                                        <div className="data-box">{course.tracked}</div>
                                    </div>
                                    <div className="track-col gap-col center-cell">
                                        <div className="data-box">{course.gap}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tracktarget;
