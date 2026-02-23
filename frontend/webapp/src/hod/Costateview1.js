import React, { useState } from 'react';
import Header from '../components/header/Header';
import Sidebar from '../components/sidebar/Sidebar';
import { Container } from 'react-bootstrap';
import './Costateview1.css';
import { FaPlus, FaMinus } from 'react-icons/fa';

const Costateview1 = () => {
    const courses = [
        "Data analytics (315326)",
        "Operating system (315319)",
        "Software Engineering (315326)",
        "Entrepreneurship development & startups (315002)",
        "Seminar & Project initiation course(3153003)",
        "Internship (3153004)"
    ];

    const [openIndex, setOpenIndex] = useState(null);

    const toggleCourse = (index) => {
        if (openIndex === index) {
            setOpenIndex(null);
        } else {
            setOpenIndex(index);
        }
    };

    return (
        <div className="d-flex flex-column vh-100 overflow-hidden costateview-container">
            <Header />
            <div className="d-flex flex-grow-1 overflow-hidden">
                <div className="sidebar-container h-100 overflow-y-auto">
                    <Sidebar />
                </div>
                <div className="flex-grow-1 p-3 bg-light overflow-y-auto">
                    <Container fluid className="bg-white p-5 shadow-sm rounded border-0 h-100">
                        <div className="d-flex flex-column gap-4" style={{ maxWidth: '900px', margin: '0 auto', paddingTop: '50px' }}>
                            {courses.map((course, index) => (
                                <div key={index}>
                                    <div
                                        className="course-item p-3 d-flex justify-content-between align-items-center rounded"
                                        onClick={() => toggleCourse(index)}
                                    >
                                        <span>{course}</span>
                                        {openIndex === index ? <FaMinus className="plus-icon" /> : <FaPlus className="plus-icon" />}
                                    </div>

                                    {openIndex === index && (
                                        <div className="course-details mt-3 p-4 rounded text-start" style={{ backgroundColor: '#e2eef1', color: '#1a3c63' }}>
                                            <div className="mb-2">
                                            </div>
                                            <div className="mb-5">
                                                <h5 className="fw-bold fs-5 mb-2" style={{ color: '#1f3a68' }}>Couse name : Data Analytics</h5>
                                                <h5 className="fw-bold fs-5 mb-2" style={{ color: '#1f3a68' }}>Couse abrivation : DAN</h5>
                                                <h5 className="fw-bold fs-5 mb-2" style={{ color: '#1f3a68' }}>Couse code : 315326</h5>
                                            </div>

                                            <div className="d-flex justify-content-between mb-3 px-2">
                                                <h5 className="fw-bold fs-5" style={{ color: '#1f3a68' }}>CO No.</h5>
                                                <h5 className="fw-bold fs-5" style={{ marginRight: '30%', color: '#1f3a68' }}>Course outcomes</h5>
                                            </div>

                                            <ul className="list-unstyled px-2">
                                                <li className="mb-2 fw-semibold fs-6" style={{ color: '#1f3a68' }}>• CO1 - Elaborate the fundamental concepts of Data Analytics.</li>
                                                <li className="mb-2 fw-semibold fs-6" style={{ color: '#1f3a68' }}>• CO2 - Apply appropriate statistical techniques to analyze and interpret complex Datasets.</li>
                                                <li className="mb-2 fw-semibold fs-6" style={{ color: '#1f3a68' }}>• CO3 - Analyze numerical data by creating pivot table.</li>
                                                <li className="mb-2 fw-semibold fs-6" style={{ color: '#1f3a68' }}>• CO4 - Represent data in terms of various types of charts.</li>
                                                <li className="mb-2 fw-semibold fs-6" style={{ color: '#1f3a68' }}>• CO5 - Visualize the data using a Python library.</li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Container>
                </div>
            </div>
        </div>
    );
};

export default Costateview1;
