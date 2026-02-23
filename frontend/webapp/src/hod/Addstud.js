import React from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import Header from '../components/header/Header';
import Sidebar from '../components/sidebar/Sidebar';
import './Addstud.css';

const Addstud = () => {
    // Generate empty rows for the table
    const rows = Array.from({ length: 9 });

    return (
        <div className="addstud-layout">
            <Header />
            <div className="addstud-body d-flex">
                <div className="sidebar-wrapper">
                    <Sidebar />
                </div>
                <div className="content-wrapper flex-grow-1 p-4">
                    <div className="white-box p-4 shadow-sm bg-white rounded">
                        <h4 className="mb-4 text-primary fw-bold" style={{ color: '#031c38' }}>Enter the details of students in table below</h4>

                        <div className="table-responsive">
                            <Table bordered hover className="addstud-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '10%' }}>Roll No.</th>
                                        <th style={{ width: '20%' }}>Enrollment No.</th>
                                        <th>Name of Student</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((_, index) => (
                                        <tr key={index}>
                                            <td><Form.Control type="text" className="border-0 bg-transparent text-center" /></td>
                                            <td><Form.Control type="text" className="border-0 bg-transparent text-center" /></td>
                                            <td><Form.Control type="text" className="border-0 bg-transparent text-center" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>

                        <div className="d-flex justify-content-end mt-3">
                            <Button variant="primary" className="px-4" style={{ backgroundColor: '#4b75ff', border: 'none' }}>
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Addstud;
