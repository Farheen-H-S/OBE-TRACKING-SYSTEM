import React, { useState } from 'react';
import Header from '../components/header/Header';
import Sidebar from '../components/sidebar/Sidebar';
import './Assigntarget.css';

const Assigntarget = () => {
  // Sample data to mimic the image
  const initialCourses = [
    { code: '312016', name: 'Data analytics', target: '' },
    { code: '312017', name: 'Operating system', target: '' },
    { code: '312018', name: 'Software engineering', target: '' },
    { code: '312023', name: 'Industrial internship', target: '' },
    { code: '312015', name: 'Management', target: '' },
    { code: '312016', name: 'Network security', target: '' },
  ];

  const [courses, setCourses] = useState(initialCourses);

  const handleTargetChange = (index, value) => {
    const newCourses = [...courses];
    newCourses[index].target = value;
    setCourses(newCourses);
  };

  const handleSave = () => {
    console.log('Saved targets:', courses);
    // Add save logic here
  };

  return (
    <div className="hod-dashboard-container">
      <Sidebar />
      <div className="hod-main-content">
        <Header />
        <div className="assign-target-wrapper ">
          <div className="assign-target-card">
            <div className="target-table-header">
              <div className="th-code">Course code</div>
              <div className="th-course">Course</div>
              <div className="th-target">Assigned target</div>
            </div>
            <div className="target-table-body">
              {courses.map((course, index) => (
                <div key={index} className="target-table-row">
                  <div className="td-code">{course.code}</div>
                  <div className="td-course">{course.name}</div>
                  <div className="td-target">
                    <input
                      type="text"
                      className="target-input"
                      value={course.target}
                      onChange={(e) => handleTargetChange(index, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="save-btn-container">
              <button className="save-btn" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assigntarget;