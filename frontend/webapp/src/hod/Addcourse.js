import React from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import Header from '../components/header/Header';
import Sidebar from '../components/sidebar/Sidebar';
import './Addcourse.css';

const Addcourse = () => {
    // Generate empty rows for the table
    const rows = Array.from({ length: 11 }); // Image shows about 11 rows

    return (
        <div className="addcourse-layout">
            <Header />
            <div className="addcourse-body d-flex">
                <div className="sidebar-wrapper">
                    <Sidebar />
                </div>
                <div className="content-wrapper flex-grow-1 p-4">
                    <div className="white-box p-4 shadow-sm bg-white rounded">
                        <h4 className="mb-4 text-primary fw-bold" style={{ color: '#042850' }}>Enter the details of courses in the table below</h4>

                        <div className="table-responsive">
                            <Table bordered hover className="addcourse-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '8%' }}>Couse Id</th>
                                        <th style={{ width: '12%' }}>Course code</th>
                                        <th style={{ width: '35%' }}>Course name</th>
                                        <th style={{ width: '10%' }}>Semester</th>
                                        <th style={{ width: '15%' }}>Program id</th>
                                        <th style={{ width: '15%' }}>Scheme id</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((_, index) => (
                                        <tr key={index}>
                                            <td><Form.Control type="text" className="border-0 bg-transparent text-center" /></td>
                                            <td><Form.Control type="text" className="border-0 bg-transparent text-center" /></td>
                                            <td><Form.Control type="text" className="border-0 bg-transparent" /></td>
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

export default Addcourse;
