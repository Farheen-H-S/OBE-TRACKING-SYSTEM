import React, { useState } from 'react';
import Header from '../components/header/Header';
import Sidebar from '../components/sidebar/Sidebar';
import './Backtracking.css';
import { Card, Table, Container, Row, Col } from 'react-bootstrap';

const Backtracking = () => {
  // Hardcoded data for the table as per requirement (values from backend in future)
  const tableData = [
    { sr: 'PO 1', level: 2.5, status: 'Medium' },
    { sr: 'PO 2', level: 3, status: 'High' },
    { sr: 'PO 3', level: 1.5, status: 'Low' },
    { sr: 'PO 4', level: 2.5, status: 'Medium' },
    { sr: 'PO 5', level: 2, status: 'Low' },
    { sr: 'PO 6', level: 2.5, status: 'Medium' },
    { sr: 'PO 7', level: 3, status: 'High' },
    { sr: 'PSO 1', level: 3.5, status: 'High' },
    { sr: 'PSO 2', level: 1.5, status: 'Low' },
    { sr: 'PSO 3', level: 1, status: 'Low' },
  ];

  const getStatusClass = (status) => {
    if (status === 'High') return 'table-status-high'; // Green
    if (status === 'Medium') return 'table-status-medium'; // Yellow/Orange
    if (status === 'Low') return 'table-status-low'; // Red
    return '';
  };

  return (
    <div className="d-flex flex-column vh-100 overflow-hidden">
     
        <div className="flex-grow-1 p-3 bg-light overflow-y-auto">
          <Container fluid className="bg-white p-4 shadow-sm rounded border-0 h-100">
            <h4 className="fw-bold mb-4 text-primary" style={{ color: '#041835' }}>Backtraking of attainment</h4>

            {/* Summary Section */}
            <div className="mb-4">
              <h6 className="fw-bold text-primary mb-3  text-align-left">Attainment summary :</h6>
              <div className="d-flex align-items-center gap-3">
                <div className="backtracking-card card-achieved">
                  <div className="small">Achieved</div>
                  <div className="fs-4">3</div>
                </div>
                <div className="backtracking-card card-target">
                  <div className="small text-primary">Target</div>
                  <div className="fs-4 text-primary">5</div>
                </div>
                <div className="backtracking-card card-gap">
                  <div className="small">Gap</div>
                  <div className="fs-4">2</div>
                </div>
                <div className="status-not-met ms-3">
                  <i className="bi bi-exclamation-circle-fill"></i>
                  <span>! Status : Not met</span>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div>
              <h6 className="fw-bold text-primary mb-3">Attainment table (PO & PSO's):</h6>
              <div className="table-responsive" style={{ maxWidth: '400px' }}>
                <Table bordered hover className="custom-table text-center mobile-table">
                  <thead className="bg-light-blue-header text-white">
                    <tr>
                      <th style={{ backgroundColor: '#8da2fb', color: 'white' }}>Sr No.</th>
                      <th style={{ backgroundColor: '#8da2fb', color: 'white' }}>Level achieved</th>
                      <th style={{ backgroundColor: '#8da2fb', color: 'white' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, index) => (
                      <tr key={index}>
                        <td className="fw-bold bg-light">{row.sr}</td>
                        <td>{row.level}</td>
                        <td className={getStatusClass(row.status)}>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="mt-2 small text-muted">
                Note:Click on PO/PSO no. to view details
              </div>
            </div>
          </Container>
        </div>
      </div>
  
  );
};

export default Backtracking;
