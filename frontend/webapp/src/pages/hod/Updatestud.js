import React, { useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import Header from '../../components/header/Header';
import HodSide from '../../components/sidebar/HodSide';
import './Updatestud.css';

const Updatestud = () => {
    // Initial data extracted from the image
    const [students, setStudents] = useState([
        { id: 1, enrollment: '2301231', name: 'Anil jagazp' },
        { id: 2, enrollment: '2301232', name: 'Grishma Chitte' },
        { id: 3, enrollment: '2301233', name: 'Khushi Nigal' },
        { id: 4, enrollment: '2301234', name: 'Gayatri deore' },
        { id: 5, enrollment: '2301235', name: 'Saloni hande' },
        { id: 6, enrollment: '2301236', name: 'Farheen shaikh' },
        { id: 7, enrollment: '2301237', name: 'Vishakha bankar' },
        { id: 8, enrollment: '2301238', name: 'Suraj Deore' },
        { id: 9, enrollment: '2301239', name: 'Pratik sonavane' },
        { id: 10, enrollment: '2301240', name: 'Pooja Pawar' },
        { id: 11, enrollment: '2301241', name: 'Aditiya patil' },
        { id: 12, enrollment: '2301242', name: 'Somesh sapkal' },
        { id: 13, enrollment: '2301243', name: 'Mitesh marathe' },
        { id: 14, enrollment: '2301244', name: 'Disha pagar' }
    ]);

    const handleInputChange = (id, field, value) => {
        const updatedStudents = students.map(student =>
            student.id === id ? { ...student, [field]: value } : student
        );
        setStudents(updatedStudents);
    };

    const handleSave = () => {
        console.log("Saved Data:", students);
        alert("Data saved successfully!");
    };

    return (
        <div className="updatestud-layout">
            <Header />
            <div className="updatestud-body d-flex">
                <div className="sidebar-wrapper">
                    <HodSide />
                </div>
                <div className="content-wrapper flex-grow-1 p-4">
                    <div className="white-box p-4 shadow-sm bg-white rounded">
                        <h5 className="mb-4 text-primary fw-bold" style={{ color: '#042850' }}>Update the details of students</h5>

                        <div className="table-responsive">
                            <Table bordered hover className="updatestud-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '10%' }}>Roll No.</th>
                                        <th style={{ width: '25%' }}>Enrollment No.</th>
                                        <th>Name of Student</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student) => (
                                        <tr key={student.id}>
                                            <td className="text-center fw-bold">{student.id}</td>
                                            <td>
                                                <Form.Control
                                                    type="text"
                                                    value={student.enrollment}
                                                    onChange={(e) => handleInputChange(student.id, 'enrollment', e.target.value)}
                                                    className="border-0 bg-transparent text-center"
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="text"
                                                    value={student.name}
                                                    onChange={(e) => handleInputChange(student.id, 'name', e.target.value)}
                                                    className="border-0 bg-transparent"
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

export default Updatestud;
