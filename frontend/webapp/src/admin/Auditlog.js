import React, { useState } from 'react';

import './Auditlog.css';

const Auditlog = () => {
    // Simulated data from backend
    const [rows] = useState([
        {
            id: 1,
            recordId: 'REC001',
            dateTime: '01-01-2026 10:30 AM',
            username: 'mitesh@123',
            role: 'Admin',
            action: 'Delete User',
            shortDescription: 'Deleted user ID 312023046'
        },
        {
            id: 2,
            recordId: 'REC002',
            dateTime: '05-01-2026 11:15 AM',
            username: 'Riya@345',
            role: 'Faculty',
            action: 'Enter Marks',
            shortDescription: 'Entered class test 1 marks' 
        },
        
    
        ...Array.from({ length: 9 }).map((_, i) => ({
            id: i + 4, recordId: '', dateTime: '', username: '', role: '', action: '', shortDescription: ''
        }))
    ]);

    return (
        <div >

                <div className="flex-grow-1 p-5 bg-white overflow-y-auto" style={{ backgroundColor: '#fff' }}>
                    <h2 className="mb-4 text-primary fw-bold" style={{ color: '#2c3e50' }}>Audit log table</h2>

                    <div className="table-wrapper">
                        <table className="table table-bordered audit-table mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '10%' }}>Record ID</th>
                                    <th style={{ width: '15%' }}>Date & time</th>
                                    <th style={{ width: '15%' }}>Username</th>
                                    <th style={{ width: '10%' }}>Role</th>
                                    <th style={{ width: '15%' }}>Action</th>
                                    <th style={{ width: '35%' }}>Short Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, index) => (
                                    <tr key={index}>
                                        <td>{row.recordId}</td>
                                        <td>{row.dateTime}</td>
                                        <td>{row.username}</td>
                                        <td>{row.role}</td>
                                        <td>{row.action}</td>
                                        <td className="d-flex align-items-center justify-content-between">
                                            <span className="text-truncate me-2" style={{ maxWidth: '200px' }}>
                                                {row.shortDescription}
                                            </span>
                                            {/* Show View details button only if shortDescription has value */}
                                            {row.shortDescription && row.shortDescription.trim().length > 0 && (
                                                <button className="btn btn-sm btn-primary view-details-btn text-nowrap" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                                                    View details
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
       
    );
};

export default Auditlog;
