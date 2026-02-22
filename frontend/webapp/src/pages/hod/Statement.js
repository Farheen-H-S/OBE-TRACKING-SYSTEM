import React, { useState } from 'react';
import Header from '../../components/header/Header';
import HodSide from '../../components/sidebar/HodSide';
import { Dropdown, Container } from 'react-bootstrap';
import './Statement.css';

const Statement = () => {
    const [selectedDept, setSelectedDept] = useState('Department');

    const handleSelect = (eventKey) => {
        setSelectedDept(eventKey);
    };

    return (
        <div className="d-flex flex-column vh-100 overflow-hidden">
            {/* Header Section */}
            <Header />

            {/* Main Body Section */}
            <div className="d-flex flex-grow-1 overflow-hidden">
                {/* Sidebar Section */}
                <div className="flex-shrink-0">
                    <HodSide />
                </div>

                {/* Content Section */}
                <div className="flex-grow-1 p-3 statement-container overflow-auto">
                    <Container fluid className="white-content-box p-9 d-flex justify-content-start align-items-start">

                        <Dropdown onSelect={handleSelect} className="dropdown-custom">
                            <Dropdown.Toggle
                                id="dropdown-department"
                                className="dept-dropdown-toggle"
                            >
                                {selectedDept}
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item eventKey="CO">CO</Dropdown.Item>
                                <Dropdown.Item eventKey="CE">CE</Dropdown.Item>
                                <Dropdown.Item eventKey="ME">ME</Dropdown.Item>
                                <Dropdown.Item eventKey="IT">IT</Dropdown.Item>
                                <Dropdown.Item eventKey="EE">EE</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>


                    </Container>
                </div>
            </div>
        </div>
    );
};

export default Statement;
