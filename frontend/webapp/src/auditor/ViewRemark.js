
import React, { useState } from 'react';
import { Container, Row, Col, Table, Button, Form } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import Header from '../components/header/Header';
import Sidebar from '../components/sidebar/Sidebar';
import './ViewRemark.css';

const ViewRemark = () => {
    // Initial blank rows
    const [remarks, setRemarks] = useState([
        { id: 1, reportName: '', remark: '', date: '', status: '' },
        { id: 2, reportName: '', remark: '', date: '', status: '' },
        { id: 3, reportName: '', remark: '', date: '', status: '' },
        { id: 4, reportName: '', remark: '', date: '', status: '' },
    ]);

    const [isEditing, setIsEditing] = useState(false);

    const handleEditClick = () => {
        setIsEditing(!isEditing);
    };

    const handleRemarkChange = (id, field, value) => {
        setRemarks(remarks.map(row => (row.id === id ? { ...row, [field]: value } : row)));
    };

    const handleAddRow = () => {
        const newId = remarks.length > 0 ? Math.max(...remarks.map(r => r.id)) + 1 : 1;
        setRemarks([...remarks, { id: newId, reportName: '', remark: '', date: '', status: '' }]);
    };

    return (
        <div className='view-remark-page'>
        
            <div className='d-flex'>
            
                <div className='main-content flex-grow-1 p-4 pb-5'>
                    <Container fluid>
                        <Row className='justify-content-center'>
                            <Col md={12}>
                                <div className='white-box'>
                                    <h4 className="page-title mb-4">View Audit Remarks</h4>

                                    <div className="table-responsive">
                                        <Table bordered className="remark-table">
                                            <tbody>
                                                {remarks.map((row) => (
                                                    <tr key={row.id}>
                                                        <td className="p-0">
                                                            {isEditing ? (
                                                                <Form.Control
                                                                    type="text"
                                                                    value={row.reportName}
                                                                    onChange={(e) => handleRemarkChange(row.id, 'reportName', e.target.value)}
                                                                    className="editable-cell"
                                                                />
                                                            ) : (
                                                                <div className="static-cell">{row.reportName}</div>
                                                            )}
                                                        </td>
                                                        <td className="p-0">
                                                            {isEditing ? (
                                                                <Form.Control
                                                                    type="text"
                                                                    value={row.remark}
                                                                    onChange={(e) => handleRemarkChange(row.id, 'remark', e.target.value)}
                                                                    className="editable-cell"
                                                                />
                                                            ) : (
                                                                <div className="static-cell">{row.remark}</div>
                                                            )}
                                                        </td>
                                                        <td className="p-0">
                                                            {isEditing ? (
                                                                <Form.Control
                                                                    type="text"
                                                                    value={row.date}
                                                                    onChange={(e) => handleRemarkChange(row.id, 'date', e.target.value)}
                                                                    className="editable-cell"
                                                                />
                                                            ) : (
                                                                <div className="static-cell">{row.date}</div>
                                                            )}
                                                        </td>
                                                        <td className="p-0">
                                                            {isEditing ? (
                                                                <Form.Control
                                                                    type="text"
                                                                    value={row.status}
                                                                    onChange={(e) => handleRemarkChange(row.id, 'status', e.target.value)}
                                                                    className="editable-cell"
                                                                />
                                                            ) : (
                                                                <div className="static-cell">{row.status}</div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>

                                    {/* Add Row Icon - Visible only in Edit Mode */}
                                    {isEditing && (
                                        <div className="d-flex justify-content-center mt-3">
                                            <span className="add-row-icon" onClick={handleAddRow} title="Add Row">
                                                <FaPlus />
                                            </span>
                                        </div>
                                    )}

                                    {/* Edit/Save Button at the end */}
                                    <div className="d-flex justify-content-end mt-4">
                                        <Button
                                            variant={isEditing ? "primary" : "secondary"}
                                            onClick={handleEditClick}
                                            className="px-4"
                                        >
                                            {isEditing ? "Save" : "Edit"}
                                        </Button>
                                    </div>

                                </div>
                            </Col>
                        </Row>
                    </Container>
                </div>
            </div>
        </div>
    );
};

export default ViewRemark;
