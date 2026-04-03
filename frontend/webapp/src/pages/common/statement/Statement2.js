import React, { useState, useEffect } from 'react';
import { useFilters } from '../../../context/FilterContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/axios';
import { getLoggedInUser } from '../../../utils/auth';
import './Statement2.css';
const sflogo2 = '/images/sflogo.jpg';
const splogo = '/images/splogo.jpg';

const Statement2 = () => {
    const navigate = useNavigate();
    const user = getLoggedInUser();

    const { selectedDept: selectedProgram, setSelectedDept: setSelectedProgram, departments: programs } = useFilters();
    const [loading, setLoading] = useState(false);

    // Data states
    const [instituteVision, setInstituteVision] = useState('');
    const [instituteMissions, setInstituteMissions] = useState([]);
    const [deptVision, setDeptVision] = useState('');
    const [deptMissions, setDeptMissions] = useState([]);
    const [peos, setPeos] = useState([]);
    const [pos, setPos] = useState([]);
    const [psos, setPsos] = useState([]);

    useEffect(() => {
        if (selectedProgram) {
            fetchData();
        }
    }, [selectedProgram]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Statements (Vision/Mission)
            const stmtRes = await api.get(`/academics/program-statements/?program_id=${selectedProgram}`);
            const stmts = stmtRes.data;

            setInstituteVision(stmts.find(s => s.statement_type === 'INSTITUTE_VISION')?.description || '');
            setDeptVision(stmts.find(s => s.statement_type === 'DEPT_VISION')?.description || '');

            setInstituteMissions(stmts.filter(s => s.statement_type === 'INSTITUTE_MISSION').map(s => ({ no: s.statement_number, text: s.description })));
            setDeptMissions(stmts.filter(s => s.statement_type === 'DEPT_MISSION').map(s => ({ no: s.statement_number, text: s.description })));

            // Fetch PEOs
            const peoRes = await api.get(`/academics/peos/?program_id=${selectedProgram}`);
            setPeos(peoRes.data);

            // Fetch POs
            const poRes = await api.get(`/academics/pos/?program_id=${selectedProgram}`);
            setPos(poRes.data);

            // Fetch PSOs
            const psoRes = await api.get(`/academics/psos/?program_id=${selectedProgram}`);
            setPsos(psoRes.data);

        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const currentProgramName = programs.find(p => p.program_id === parseInt(selectedProgram))?.program_name || 'Computer Engineering';

    const renderBannerHeader = () => (
        <div className="banner-header-section border-bottom position-relative">
            <div className="d-flex justify-content-between align-items-center">
                <div className="banner-logo-container text-center" style={{ width: '120px' }}>
                    <img src={splogo} alt="SF Logo" className="banner-logo-img" />
                </div>
                <div className="banner-center-text text-center flex-grow-1">
                    <div className="top-title">Sandip Foundation's</div>
                    <div className="main-college-name">Sandip Polytechnic</div>
                    <div className="college-address">At Post Mahiravani, Trimbak Road, Nashik - 422 213</div>
                </div>
                <div className="banner-logo-container text-center" style={{ width: '120px' }}>
                    <img src={sflogo2} alt="SF Logo" className="banner-logo-img" />
                </div>
            </div>
            <div className="dept-bar-blue mt-2 text-center">
                Department of {currentProgramName}
            </div>
        </div>
    );

    const isAuditor = (user?.role || user?.role_name || "").toUpperCase() === 'AUDITOR';
    const isFaculty = (user?.role || user?.role_name || "").toUpperCase() === 'FACULTY';

    return (
        <div className="statement2-main-standalone">
            <div className="mx-auto" style={{ maxWidth: '1100px' }}>

                <div className="d-flex justify-content-end align-items-center mb-4 no-print" style={{ width: '100%' }}>
                    {!(isAuditor || isFaculty) ? (
                        <div className="toggle-container shadow-sm">
                            <button className="toggle-btn" onClick={() => navigate('/peo-po-pso')}>Define</button>
                            <button className="toggle-btn active">View</button>
                        </div>
                    ) : (
                        <h4 className="m-0 fw-bold text-primary">PEOs, POs, and PSOs Statements</h4>
                    )}
                </div>

                {loading ? (
                    <div className="text-center p-5">Loading...</div>
                ) : (
                    <>
                        {/* BANNER 1: VISION AND MISSION */}
                        <div className="banner-board shadow-sm">
                            {renderBannerHeader()}
                            <div className="banner-body-content p-4">
                                <div className="main-board-title text-center mb-4">VISION AND MISSION</div>

                                <div className="row g-4">
                                    <div className="col-12">
                                        <h5 className="sub-board-title text-center mb-3" style={{ color: '#ff0000', fontWeight: 'bold' }}>VISION AND MISSION OF THE INSTITUTE</h5>
                                        <div className="mb-4">
                                            <h6 className="red-label text-center">Vision</h6>
                                            <p className="blue-text text-center px-5">{instituteVision || 'No Vision defined'}</p>
                                        </div>
                                        <div className="mb-4">
                                            <h6 className="red-label text-center">Mission</h6>
                                            <div className="mission-list-container mx-auto" style={{ maxWidth: '85%' }}>
                                                {instituteMissions.map((m, i) => (
                                                    <div key={i} className="mission-item-row blue-text mb-2 d-flex">
                                                        <span className="fw-bold me-2" style={{ minWidth: '35px' }}>{m.no}:</span>
                                                        <span>{m.text}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-12 border-top pt-4">
                                        <h5 className="sub-board-title text-center mb-3" style={{ color: '#ff0000', fontWeight: 'bold' }}>VISION AND MISSION OF THE DEPARTMENT</h5>
                                        <div className="mb-4">
                                            <h6 className="red-label text-center">Vision</h6>
                                            <p className="blue-text text-center px-5">{deptVision || `No Vision defined`}</p>
                                        </div>
                                        <div className="mb-2">
                                            <h6 className="red-label text-center">Mission</h6>
                                            <div className="mission-list-container mx-auto" style={{ maxWidth: '85%' }}>
                                                {deptMissions.map((m, i) => (
                                                    <div key={i} className="mission-item-row blue-text mb-2 d-flex">
                                                        <span className="fw-bold me-2" style={{ minWidth: '35px' }}>{m.no}:</span>
                                                        <span>{m.text}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BANNER 2: PEO, PO, PSO */}
                        <div className="banner-board shadow-sm">
                            {renderBannerHeader()}
                            <div className="banner-body-content p-4">
                                {/* <div className="main-board-title text-center mb-4">PEO, PO AND PSO STATEMENTS</div> */}

                                <div className="mb-5">
                                    <h5 className="main-board-title text-center">Program Educational Objectives (PEOs)</h5>
                                    <table className="board-table border shadow-sm">
                                        <thead>
                                            <tr>
                                                <th width="120">PEO No.</th>
                                                <th>Statements</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {peos.map((p, i) => (
                                                <tr key={i}>
                                                    <td>{p.peo_number}</td>
                                                    <td className="blue-text">{p.description}</td>
                                                </tr>
                                            ))}
                                            {peos.length === 0 && <tr><td colSpan="2" className="text-center italic">No PEOs defined</td></tr>}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mb-5">
                                    <h5 className="main-board-title text-center">Program Outcomes (POs)</h5>
                                    <table className="board-table border shadow-sm">
                                        <thead>
                                            <tr>
                                                <th width="120">PO No.</th>
                                                <th>Statements</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pos.map((p, i) => (
                                                <tr key={i}>
                                                    <td>{p.po_number}</td>
                                                    <td className="blue-text">{p.description}</td>
                                                </tr>
                                            ))}
                                            {pos.length === 0 && <tr><td colSpan="2" className="text-center italic">No POs defined</td></tr>}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mb-4">
                                    <h5 className="main-board-title text-center">Program Specific Outcomes (PSOs)</h5>
                                    <table className="board-table border shadow-sm">
                                        <thead>
                                            <tr>
                                                <th width="120">PSO No.</th>
                                                <th>Statements</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {psos.map((p, i) => (
                                                <tr key={i}>
                                                    <td>{p.pso_number}</td>
                                                    <td className="blue-text">{p.description}</td>
                                                </tr>
                                            ))}
                                            {psos.length === 0 && <tr><td colSpan="2" className="text-center italic">No PSOs defined</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {!(isAuditor || isFaculty) && (
                    <div className="text-center mt-4 no-print pb-5">
                        <button className="btn btn-outline-secondary px-5 fw-bold" onClick={() => navigate('/peo-po-pso')}>
                            Edit Statements
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Statement2;
