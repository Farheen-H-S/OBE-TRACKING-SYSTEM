
import React, { useState } from 'react';
import { Container, Row, Col, Table, Button, Form } from 'react-bootstrap';
import { FaPlus, FaFileExcel } from 'react-icons/fa';
import Header from '../components/header/Header';
import Auditorside from '../components/sidebar/Auditorside';
import './ViewCis.css';

const ViewCis = () => {
    // Static data for CIS Direct Internal
    const internalReports = [
        { name: 'FA-TH', file: 'Book1', date: '14-12-2025 08:05 PM' },
        { name: 'SLA', file: 'Book1', date: '14-12-2025 08:05 PM' },
        { name: 'FA-PR', file: 'Book1', date: '14-12-2025 08:05 PM' },
        { name: 'SA-PR', file: 'Book1', date: '14-12-2025 08:05 PM' },
    ];

    // Static data for CIS Direct External
    const externalReports = [
        { name: 'SA-PR', file: 'Book1', date: '14-12-2025 08:05 PM' },
        { name: 'CES', file: 'Book1', date: '14-12-2025 08:05 PM' },
        { name: 'FA-PR', file: 'Book1', date: '14-12-2025 08:05 PM' },
        { name: 'SA-PR', file: 'Book1', date: '14-12-2025 08:05 PM' },
    ];

    // Static data for CIS Indirect Co-curricular
    const coCurricularReports = [
        { name: 'Guest Lecturer', file: 'Book1', date: '14-12-2025 08:05 PM' },
        { name: 'Technical events', file: 'Book1', date: '14-12-2025 08:05 PM' },
        { name: 'Value-added programs', file: 'Book1', date: '14-12-2025 08:05 PM' },
    ];

    // Static data for CIS Indirect Extra-curricular
    const extraCurricularReports = [
        { name: 'Sports', file: 'Book1', date: '14-12-2025 08:05 PM' },
        { name: 'Cultural events', file: 'Book1', date: '14-12-2025 08:05 PM' },
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

    const handleEditClick = () => setIsEditing(!isEditing);

    const handleRemarkChange = (id, field, value) => {
        setRemarks(remarks.map(row => (row.id === id ? { ...row, [field]: value } : row)));
    };

    const handleAddRow = () => {
        const newId = remarks.length > 0 ? Math.max(...remarks.map(r => r.id)) + 1 : 1;
        setRemarks([...remarks, { id: newId, col1: '', col2: '', col3: '', col4: '' }]);
    };

    const renderFileList = (reports) => (
        <div className="file-list-container">
            {reports.map((item, index) => (
                <div key={index} className="file-list-row">
                    <div className="file-label text-muted">{item.name}</div>
                    <div className="file-link">
                        <span className="excel-icon"><FaFileExcel /></span>
                        <span className="text-dark fw-bold">{item.file}</span>
                    </div>
                    <div className="file-date text-muted">{item.date}</div>
                </div>
            ))}
        </div>
    );

    return (
        <div className='view-cis-page'>
           
            <div className='d-flex'>
        
                <div className='main-content flex-grow-1 p-4 pb-5'>
                    <Container fluid>
                        <Row className='justify-content-center'>
                            <Col md={12}>
                                <div className='white-box'>

                                    <h4 className="page-title mb-4">View CIS reports</h4>

                                    {/* CIS Direct Section */}
                                    <div className="mb-4">
                                        <h5 className="section-header">CIS Direct</h5>
                                        <hr className="section-divider" />

                                        <div className="subsection mb-3">
                                            <h6 className="subsection-title">Internal</h6>
                                            {renderFileList(internalReports)}
                                        </div>

                                        <div className="subsection">
                                            <h6 className="subsection-title">External</h6>
                                            {renderFileList(externalReports)}
                                        </div>
                                    </div>

                                    {/* CIS Indirect Section */}
                                    <div className="mb-5">
                                        <h5 className="section-header mt-4">CIS Indirect</h5>
                                        <hr className="section-divider" />

                                        <div className="subsection mb-3">
                                            <h6 className="subsection-title">Co-curicular</h6>
                                            {renderFileList(coCurricularReports)}
                                        </div>

                                        <div className="subsection">
                                            <h6 className="subsection-title">Extra-curicular</h6>
                                            {renderFileList(extraCurricularReports)}
                                        </div>
                                    </div>

                                    {/* Remarks Section */}
                                    <div>
                                        <h4 className="page-title">Give remark to reports</h4>
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

export default ViewCis;
