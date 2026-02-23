
import React, { useState } from 'react';
import { Container, Row, Col, Table, Button, Form } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import Header from '../components/header/Header';
import Auditorside from '../components/sidebar/Auditorside';
import './ViewDac.css';

const ViewDac = () => {
    // Static data for DAC reports matching the image
    const reports = [
        { name: '316315-DIGITAL FORENSIC AND HACKING...', date: '05-12-2025 08:43 PM', type: 'Microsoft Edge PDF...', size: '324 KB' },
        { name: '316316-MACHINE LEARNING (elective)', date: '05-12-2025 08:43 PM', type: 'Microsoft Edge PDF...', size: '312 KB' },
        { name: '316317-NETWORK AND INFORMATION SECURITY...', date: '05-12-2025 08:43 PM', type: 'Microsoft Edge PDF...', size: '326 KB' },
        { name: 'capstone project syllabus', date: '05-12-2025 08:42 PM', type: 'Microsoft Edge PDF...', size: '377 KB' },
        { name: 'client side scripting syllabus', date: '05-12-2025 08:41 PM', type: 'Microsoft Edge PDF...', size: '315 KB' },
        { name: 'Emerging trends in computer engineering...', date: '05-12-2025 08:38 PM', type: 'Microsoft Edge PDF...', size: '297 KB' },
        { name: 'management syllabus', date: '05-12-2025 08:37 PM', type: 'Microsoft Edge PDF...', size: '281 KB' },
    ];

    // State for remarks table
    const [remarks, setRemarks] = useState([
        { id: 1, col1: '', col2: '', col3: '', col4: '' },
        { id: 2, col1: '', col2: '', col3: '', col4: '' },
        { id: 3, col1: '', col2: '', col3: '', col4: '' },
        { id: 4, col1: '', col2: '', col3: '', col4: '' },
        { id: 5, col1: '', col2: '', col3: '', col4: '' },
    ]);

    const [isEditing, setIsEditing] = useState(false);

    // Toggle edit mode
    const handleEditClick = () => {
        setIsEditing(!isEditing);
    };

    // Handle input change for remarks
    const handleRemarkChange = (id, field, value) => {
        setRemarks(remarks.map(row => (row.id === id ? { ...row, [field]: value } : row)));
    };

    // Add new row to remarks
    const handleAddRow = () => {
        const newId = remarks.length > 0 ? Math.max(...remarks.map(r => r.id)) + 1 : 1;
        setRemarks([...remarks, { id: newId, col1: '', col2: '', col3: '', col4: '' }]);
    };

    return (
        <div className='view-dac-page'>
            
            <div className='d-flex'>
        
                <div className='main-content flex-grow-1 p-4 pb-5'>
                    <Container fluid>
                        <Row className='justify-content-center'>
                            <Col md={12}>
                                <div className='white-box'>

                                    {/* DAC Reports Section */}
                                    <div className="mb-5">
                                        <h4 className="section-title">DAC reports</h4>
                                        <div className="table-responsive">
                                            <table className="table table-borderless report-list-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: '45%' }}>Name</th>
                                                        <th>Date modified</th>
                                                        <th>Type</th>
                                                        <th>Size</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reports.map((file, index) => (
                                                        <tr key={index} className="file-row">
                                                            <td>
                                                                <span className="pdf-icon">PDF</span>
                                                                <span className="file-name">{file.name}</span>
                                                            </td>
                                                            <td className="text-muted small-text">{file.date}</td>
                                                            <td className="text-muted small-text">{file.type}</td>
                                                            <td className="text-muted small-text">{file.size}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Remarks Section */}
                                    <div>
                                        <h4 className="section-title">Give remark to DAC reports</h4>
                                        <div className="table-responsive">
                                            <Table bordered className='remarks-table'>
                                                <thead className="remarks-header">
                                                    <tr>
                                                        <th></th>
                                                        <th></th>
                                                        <th></th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {remarks.map((row) => (
                                                        <tr key={row.id}>
                                                            {['col1', 'col2', 'col3', 'col4'].map((col, idx) => (
                                                                <td key={idx} className="p-0">
                                                                    {isEditing ? (
                                                                        <Form.Control
                                                                            type="text"
                                                                            value={row[col]}
                                                                            onChange={(e) => handleRemarkChange(row.id, col, e.target.value)}
                                                                            className="editable-cell"
                                                                        />
                                                                    ) : (
                                                                        <div className="static-cell">{row[col]}</div>
                                                                    )}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                        {isEditing && (
                                            <div className="d-flex justify-content-center mt-2">
                                                <span className="add-row-icon" onClick={handleAddRow} title="Add Row">
                                                    <FaPlus />
                                                </span>
                                            </div>
                                        )}
                                        <div className="d-flex justify-content-end mt-3">
                                            <Button variant={isEditing ? "primary" : "secondary"} size="sm" onClick={handleEditClick}>
                                                {isEditing ? "Save" : "Edit"}
                                            </Button>
                                        </div>
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

export default ViewDac;
