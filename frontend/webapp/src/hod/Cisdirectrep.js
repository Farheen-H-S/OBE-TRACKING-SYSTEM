import React from 'react';
import Header from '../components/header/Header';
import Sidebar from '../components/sidebar/Sidebar';
import { BsFileEarmarkExcelFill } from "react-icons/bs";
import './Cisdirectrep.css';

const Cisdirectrep = () => {
    // Mock data for the reports
    const internalReports = [
        { title: "FA-TH", file: "manual", date: "14-12-2025 08:05 PM" },
        { title: "SLA", file: "Assignment", date: "14-12-2025 08:05 PM" },
        { title: "FA-PR", file: "Internal practical", date: "14-12-2025 08:05 PM" },
        { title: "SA-PR", file: "practical exam", date: "14-12-2025 08:05 PM" }
    ];

    const externalReports = [
        { title: "SA-PR", file: "External pr exam", date: "14-12-2025 08:05 PM" },
        { title: "CES", file: "Exit survey", date: "14-12-2025 08:05 PM" },
        { title: "FA-PR", file: "Exam", date: "14-12-2025 08:05 PM" },
        { title: "SA-PR", file: "Thoery", date: "14-12-2025 08:05 PM" }
    ];

    const handleFileClick = (fileName) => {
        // Placeholder for moving to excel file
        alert(`Opening ${fileName}...`);
        // In a real app, this would be: window.location.href = reportUrl;
    };

    const ReportRow = ({ item }) => (
        <div className="report-row">
            <div className="report-col-title">{item.title}</div>
            <div className="report-col-file" onClick={() => handleFileClick(item.file)}>
                <BsFileEarmarkExcelFill className="excel-icon" />
                <span className="file-name">{item.file}</span>
            </div>
            <div className="report-col-date">{item.date}</div>
        </div>
    );

    return (
        <div className="cisdirectrep-wrapper">
            <Header />
            <div className="d-flex">
                <Sidebar />
                <div className="cisdirectrep-main">
                    <div className="cisdirectrep-card">

                        <h2 className="cis-report-title">CIS report : Direct</h2>

                        <div className="cis-report-content">
                            {/* Internal Section */}
                            <div className="cis-section">
                                <h4 className="cis-section-header">Internal</h4>
                                <div className="cis-report-list">
                                    {internalReports.map((item, index) => (
                                        <ReportRow key={index} item={item} />
                                    ))}
                                </div>
                            </div>

                            {/* External Section */}
                            <div className="cis-section mt-5">
                                <h4 className="cis-section-header">External</h4>
                                <div className="cis-report-list">
                                    {externalReports.map((item, index) => (
                                        <ReportRow key={index} item={item} />
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cisdirectrep;
