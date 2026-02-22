import React, { useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaSearch } from 'react-icons/fa';
import './Updatecourse.css';

const Updatecourse = () => {
    const navigate = useNavigate();
    // Initial dummy data for courses
    const [courses, setCourses] = useState([
        { id: 1, courseId: '101', code: 'CS101', name: 'Introduction to Programming', semester: '1', programId: 'P01', schemeId: 'S01' },
        { id: 2, courseId: '102', code: 'CS102', name: 'Data Structures', semester: '2', programId: 'P01', schemeId: 'S01' },
        { id: 3, courseId: '103', code: 'CS103', name: 'Database Management', semester: '3', programId: 'P01', schemeId: 'S01' },
        { id: 4, courseId: '104', code: 'CS104', name: 'Operating Systems', semester: '4', programId: 'P01', schemeId: 'S01' },
        { id: 5, courseId: '105', code: 'CS105', name: 'Computer Networks', semester: '5', programId: 'P01', schemeId: 'S01' },
        { id: 6, courseId: '106', code: 'CS106', name: 'Software Engineering', semester: '6', programId: 'P01', schemeId: 'S01' },
        { id: 7, courseId: '107', code: 'CS107', name: 'Web Development', semester: '5', programId: 'P01', schemeId: 'S01' },
        { id: 8, courseId: '108', code: 'CS108', name: 'Mobile Computing', semester: '6', programId: 'P01', schemeId: 'S01' },
        { id: 9, courseId: '109', code: 'CS109', name: 'Cloud Computing', semester: '7', programId: 'P01', schemeId: 'S01' },
        { id: 10, courseId: '110', code: 'CS110', name: 'Artificial Intelligence', semester: '8', programId: 'P01', schemeId: 'S01' },
    ]);

    const [searchTerm, setSearchTerm] = useState('');

    const handleInputChange = (id, field, value) => {
        const updatedCourses = courses.map(course =>
            course.id === id ? { ...course, [field]: value } : course
        );
        setCourses(updatedCourses);
    };

    const handleSave = () => {
        console.log("Saved Course Data:", courses);
        alert("Course details updated successfully!");
        navigate('/course-management');
    };

    const filteredCourses = courses.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="update-course-container">
            <div className="update-course-header">
                <button className="btn-back-link" onClick={() => navigate('/course-management')}>
                    <FaArrowLeft className="me-2" /> Back to Course Management
                </button>
                <div className="d-flex justify-content-between align-items-end mt-3">
                    <div>
                        <h2>Update Course Details</h2>
                        <p className="text-muted">Modify existing course information in the table below.</p>
                    </div>
                    <div className="update-search-wrapper">
                        <FaSearch className="search-icon-small" />
                        <input
                            type="text"
                            placeholder="Filter list..."
                            className="update-filter-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="update-course-card">
                <div className="table-responsive">
                    <Table bordered hover className="custom-update-table">
                        <thead>
                            <tr>
                                <th>Course Id</th>
                                <th>Course Code</th>
                                <th>Course Name</th>
                                <th>Semester</th>
                                <th>Program Id</th>
                                <th>Scheme Id</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCourses.map((course) => (
                                <tr key={course.id}>
                                    <td>
                                        <Form.Control
                                            type="text"
                                            value={course.courseId}
                                            onChange={(e) => handleInputChange(course.id, 'courseId', e.target.value)}
                                            className="table-input-edit text-center"
                                        />
                                    </td>
                                    <td>
                                        <Form.Control
                                            type="text"
                                            value={course.code}
                                            onChange={(e) => handleInputChange(course.id, 'code', e.target.value)}
                                            className="table-input-edit text-center"
                                        />
                                    </td>
                                    <td>
                                        <Form.Control
                                            type="text"
                                            value={course.name}
                                            onChange={(e) => handleInputChange(course.id, 'name', e.target.value)}
                                            className="table-input-edit"
                                        />
                                    </td>
                                    <td>
                                        <Form.Control
                                            type="text"
                                            value={course.semester}
                                            onChange={(e) => handleInputChange(course.id, 'semester', e.target.value)}
                                            className="table-input-edit text-center"
                                        />
                                    </td>
                                    <td>
                                        <Form.Control
                                            type="text"
                                            value={course.programId}
                                            onChange={(e) => handleInputChange(course.id, 'programId', e.target.value)}
                                            className="table-input-edit text-center"
                                        />
                                    </td>
                                    <td>
                                        <Form.Control
                                            type="text"
                                            value={course.schemeId}
                                            onChange={(e) => handleInputChange(course.id, 'schemeId', e.target.value)}
                                            className="table-input-edit text-center"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>

                <div className="form-footer mt-4">
                    <Button variant="primary" className="btn-update-save" onClick={handleSave}>
                        <FaSave className="me-2" /> Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Updatecourse;
