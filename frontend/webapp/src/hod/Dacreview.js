import React from 'react';
import Header from '../components/header/Header';
import Sidebar from '../components/sidebar/Sidebar';
import './Dacreview.css';
import { FaFilePdf } from 'react-icons/fa';

const Dacreview = () => {
    const files = [
        { name: '316315-DIGITAL FORENSIC AND HACKIN...', date: '05-12-2025 08:43 PM', type: 'Microsoft Edge P...', size: '324 KB' },
        { name: '316316-MACHINE LEARNING (elective)', date: '05-12-2025 08:43 PM', type: 'Microsoft Edge P...', size: '312 KB' },
        { name: '316317-NETWORK AND INFORMATION S...', date: '05-12-2025 08:43 PM', type: 'Microsoft Edge P...', size: '326 KB' },
        { name: 'capstone project syllabus', date: '05-12-2025 08:42 PM', type: 'Microsoft Edge P...', size: '377 KB' },
        { name: 'client side scripting syllabus', date: '05-12-2025 08:41 PM', type: 'Microsoft Edge P...', size: '315 KB' },
        { name: 'Emerging trends in computer engineerin...', date: '05-12-2025 08:38 PM', type: 'Microsoft Edge P...', size: '297 KB' },
        { name: 'management syllabus', date: '05-12-2025 08:37 PM', type: 'Microsoft Edge P...', size: '281 KB' },
    ];

    return (
        <div className="dac-container">
            <Header />
            <div className="dac-content-wrapper">
                <div className="dac-sidebar">
                    <Sidebar />
                </div>
                <div className="dac-main-content">
                    <div className="file-manager-card">
                        <div className="table-responsive">
                            <table className="table table-hover file-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40%' }}>Name</th>
                                        <th style={{ width: '25%' }}>Date modified</th>
                                        <th style={{ width: '20%' }}>Type</th>
                                        <th style={{ width: '15%' }}>Size</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {files.map((file, index) => (
                                        <tr key={index}>
                                            <td>
                                                <FaFilePdf className="file-icon text-danger me-2" />
                                                <span className="file-name">{file.name}</span>
                                            </td>
                                            <td className="text-secondary">{file.date}</td>
                                            <td className="text-secondary">{file.type}</td>
                                            <td className="text-secondary">{file.size}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dacreview;
