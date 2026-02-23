import Header from '../components/header/Header';
import Sidebar from '../components/sidebar/Sidebar';
import { FaFilePdf } from 'react-icons/fa';
import './Techfeedreport.css';

const Techfeedreport = () => {
    // Dummy data for reports
    const reports = [
        { name: '316315-DIGITAL FORENSIC AND HACKING...', date: '05-12-2025 08:43 PM' },
        { name: '316316-MACHINE LEARNING (elective)', date: '05-12-2025 08:43 PM' },
        { name: '316317-NETWORK AND INFORMATION S...', date: '05-12-2025 08:43 PM' },
        { name: 'capstone project syllabus', date: '05-12-2025 08:42 PM' },
        { name: 'client side scripting syllabus', date: '05-12-2025 08:41 PM' },
        { name: 'Emerging trends in computer engineerin...', date: '05-12-2025 08:38 PM' },
        { name: 'management syllabus', date: '05-12-2025 08:37 PM' },
    ];

    return (
        <div className="report-container">
            <Header />
            <div className="d-flex">
                <Sidebar />
                <div className="flex-grow-1 report-content-wrapper">
                    <div className="report-card">

                        <h2 className="report-title">Teacher feedback servery report</h2>

                        <div className="file-list-container">
                            <div className="file-list-header">
                                <span className="ms-2">Name</span>
                                <span>Date modified</span>
                            </div>

                            <ul className="file-list">
                                {reports.map((file, index) => (
                                    <li key={index} className="file-item cursor-pointer" style={{ cursor: 'pointer' }}>
                                        <div className="file-info">
                                            <FaFilePdf className="file-icon" />
                                            <span>{file.name}</span>
                                        </div>
                                        <div className="file-date">
                                            {file.date}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Techfeedreport;
