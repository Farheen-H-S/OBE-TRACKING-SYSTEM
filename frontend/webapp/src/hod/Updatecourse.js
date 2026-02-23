import React, { useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import Header from '../components/header/Header';
import Sidebar from '../components/sidebar/Sidebar';
import './Updatecourse.css';

const Updatecourse = () => {
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

    const handleInputChange = (id, field, value) => {
        const updatedCourses = courses.map(course =>
            course.id === id ? { ...course, [field]: value } : course
        );
        setCourses(updatedCourses);
    };

    const handleSave = () => {
        console.log("Saved Course Data:", courses);
        alert("Course details saved successfully!");
    };

    return (
        <div className="updatecourse-layout">
            <Header />
            <div className="updatecourse-body d-flex">
                <div className="sidebar-wrapper">
                    <Sidebar />
                </div>
                <div className="content-wrapper flex-grow-1 p-4">
                    <div className="white-box p-4 shadow-sm bg-white rounded">
                        <h4 className="mb-4 text-primary fw-bold" style={{ color: '#042850' }}>Update the course details</h4>

                        <div className="table-responsive">
                            <Table bordered hover className="updatecourse-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '8%' }}>Couse Id</th>
                                        <th style={{ width: '12%' }}>Course code</th>
                                        <th style={{ width: '30%' }}>Course name</th>
                                        <th style={{ width: '10%' }}>Semester</th>
                                        <th style={{ width: '15%' }}>Program id</th>
                                        <th style={{ width: '15%' }}>Scheme id</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.map((course) => (
                                        <tr key={course.id}>
                                            <td>
                                                <Form.Control
                                                    type="text"
                                                    value={course.courseId}
                                                    onChange={(e) => handleInputChange(course.id, 'courseId', e.target.value)}
                                                    className="border-0 bg-transparent text-center"
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="text"
                                                    value={course.code}
                                                    onChange={(e) => handleInputChange(course.id, 'code', e.target.value)}
                                                    className="border-0 bg-transparent text-center"
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="text"
                                                    value={course.name}
                                                    onChange={(e) => handleInputChange(course.id, 'name', e.target.value)}
                                                    className="border-0 bg-transparent"
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="text"
                                                    value={course.semester}
                                                    onChange={(e) => handleInputChange(course.id, 'semester', e.target.value)}
                                                    className="border-0 bg-transparent text-center"
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="text"
                                                    value={course.programId}
                                                    onChange={(e) => handleInputChange(course.id, 'programId', e.target.value)}
                                                    className="border-0 bg-transparent text-center"
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="text"
                                                    value={course.schemeId}
                                                    onChange={(e) => handleInputChange(course.id, 'schemeId', e.target.value)}
                                                    className="border-0 bg-transparent text-center"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>

                        <div className="d-flex justify-content-end mt-3">
                            <Button variant="primary" className="px-4" onClick={handleSave} style={{ backgroundColor: '#4b75ff', border: 'none' }}>
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Updatecourse;
