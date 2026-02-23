import React, { useState } from 'react';
import Header from '../components/header/Header';
import Sidebar from '../components/sidebar/Sidebar';
import { Container, Table, Button } from 'react-bootstrap';
import './COPOmapping.css';

const COPOmapping = () => {
    // Initial State for the table data
    const [rows, setRows] = useState([
        { co: 'CO101.1', po1: '', po2: '', po3: '', po4: '', po5: '', po6: '', po7: '', pso1: '', pso2: '', pso3: '' },
        { co: 'CO101.2', po1: '', po2: '', po3: '', po4: '', po5: '', po6: '', po7: '', pso1: '', pso2: '', pso3: '' },
        { co: 'CO101.3', po1: '', po2: '', po3: '', po4: '', po5: '', po6: '', po7: '', pso1: '', pso2: '', pso3: '' },
        { co: 'CO101.4', po1: '', po2: '', po3: '', po4: '', po5: '', po6: '', po7: '', pso1: '', pso2: '', pso3: '' },
        { co: 'CO101.5', po1: '', po2: '', po3: '', po4: '', po5: '', po6: '', po7: '', pso1: '', pso2: '', pso3: '' },
    ]);

    const [average, setAverage] = useState(
        { po1: '', po2: '', po3: '', po4: '', po5: '', po6: '', po7: '', pso1: '', pso2: '', pso3: '' }
    );

    const handleInputChange = (index, field, value) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        setRows(newRows);
    };

    const handleAverageChange = (field, value) => {
        setAverage({ ...average, [field]: value });
    };

    return (
        <div className="d-flex flex-column vh-100 overflow-hidden co-po-mapping-container">
            <Header />
            <div className="d-flex flex-grow-1 overflow-hidden">
                <div className="sidebar-container h-100 overflow-y-auto">
                    <Sidebar />
                </div>
                <div className="flex-grow-1 p-3 bg-light overflow-y-auto">
                    <Container fluid className="bg-white p-4 shadow-sm rounded border-0 h-100 d-flex flex-column">

                        <h4 className="text-left mb-3" style={{ color: '#2c3e50', fontWeight: 'bold' }}>3.1 Establish the correlation between the courses & the POs & PSOs(20)</h4>

                        <div className="course-info mb-4  fs-5  d-flex justify-content-between flex-wrap">
                            <div>
                                <div className="mb-2 ">Course code: - CO1I</div>
                                <div>Subject Name: - English (101)</div>
                            </div>
                            <div className="align-self-end">
                                <div>Subject Code: - 22101</div>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <Table bordered className="co-po-table">
                                <thead>
                                    <tr>
                                        <th rowSpan="2" className="table-header-blue">CO No</th>
                                        <th colSpan="7" className="table-header-blue">PO's</th>
                                        <th colSpan="3" className="table-header-blue">PSO's</th>
                                    </tr>
                                    <tr className="table-sub-header-blue">
                                        <th>PO1</th>
                                        <th>PO2</th>
                                        <th>PO3</th>
                                        <th>PO4</th>
                                        <th>PO5</th>
                                        <th>PO6</th>
                                        <th>PO7</th>
                                        <th>PSO1</th>
                                        <th>PSO2</th>
                                        <th>PSO3</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, index) => (
                                        <tr key={index}>
                                            <td className="fw-bold bg-light">{row.co}</td>
                                            {['po1', 'po2', 'po3', 'po4', 'po5', 'po6', 'po7', 'pso1', 'pso2', 'pso3'].map((field) => (
                                                <td key={field} className="p-0">
                                                    <input
                                                        type="text"
                                                        value={row[field]}
                                                        onChange={(e) => handleInputChange(index, field, e.target.value)}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    <tr className="average-row">
                                        <td className="table-header-blue">Average</td>
                                        {['po1', 'po2', 'po3', 'po4', 'po5', 'po6', 'po7', 'pso1', 'pso2', 'pso3'].map((field) => (
                                            <td key={field} className="p-0 bg-white">
                                                <input
                                                    type="text"
                                                    value={average[field]}
                                                    onChange={(e) => handleAverageChange(field, e.target.value)}
                                                    className="fw-bold"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </Table>
                        </div>

                        <div className="d-flex justify-content-end mt-4">
                            <Button className="save-btn text-white fw-bold">Save</Button>
                        </div>

                    </Container>
                </div>
            </div>
        </div>
    );
};

export default COPOmapping;
