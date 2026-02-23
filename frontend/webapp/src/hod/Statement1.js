import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header/Header';
import Sidebar from '../components/sidebar/Sidebar';
import './Statement1.css';

// Reusable Table Component (Moved outside to prevent re-render focus loss)
const MissionTable = ({ missions, onChange, onAdd, onRemove }) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
        <table className="mission-table">
            <thead>
                <tr>
                    <th>{missions[0].no.startsWith('M') ? 'Mission no.' : missions[0].no.split(' ')[0] + ' no.'}</th>
                    <th>Statement</th>
                </tr>
            </thead>
            <tbody>
                {missions.map((mission, index) => (
                    <tr key={mission.id}>
                        <td>{mission.no}</td>
                        <td>
                            <input
                                type="text"
                                className="mission-input"
                                value={mission.text}
                                onChange={(e) => onChange(index, e.target.value)}
                            />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        <div className="row-controls">
            <button className="row-action-btn" onClick={onAdd}>+</button>
            {missions.length > 1 && (
                <button className="row-action-btn" onClick={onRemove}>-</button>
            )}
        </div>
    </div>
);

const Statement1 = () => {
    const navigate = useNavigate();

    // State for Institute
    const [instituteVision, setInstituteVision] = useState('');
    const [instituteMissions, setInstituteMissions] = useState([
        { id: 1, no: 'M1', text: '' },
        { id: 2, no: 'M2', text: '' },
        { id: 3, no: 'M3', text: '' }
    ]);

    // State for Department
    const [deptVision, setDeptVision] = useState('');
    const [deptMissions, setDeptMissions] = useState([
        { id: 1, no: 'M1', text: '' },
        { id: 2, no: 'M2', text: '' },
        { id: 3, no: 'M3', text: '' }
    ]);

    // State for PEO
    const [peoMissions, setPeoMissions] = useState([
        { id: 1, no: 'PEO 1', text: '' },
        { id: 2, no: 'PEO 2', text: '' },
        { id: 3, no: 'PEO 3', text: '' }
    ]);

    // State for PO
    const [poMissions, setPoMissions] = useState([
        { id: 1, no: 'PO 1', text: '' },
        { id: 2, no: 'PO 2', text: '' },
        { id: 3, no: 'PO 3', text: '' }
    ]);

    // State for PSO
    const [psoMissions, setPsoMissions] = useState([
        { id: 1, no: 'PSO 1', text: '' },
        { id: 2, no: 'PSO 2', text: '' },
        { id: 3, no: 'PSO 3', text: '' }
    ]);


    // Helper to handle change
    const handleMissionChange = (state, setState, index, value) => {
        const newMissions = [...state];
        newMissions[index].text = value;
        setState(newMissions);
    };

    // Helper to add row
    const handleAddRow = (state, setState, prefix) => {
        const nextId = state.length + 1;
        // For PEO/PO/PSO we add a space, for M we don't (based on image observation M1 vs PEO 1)
        // Actually image shows PEO 1, M1.
        const label = prefix === 'M' ? `M${nextId}` : `${prefix} ${nextId}`;

        const newMissions = [
            ...state,
            { id: nextId, no: label, text: '' }
        ];
        setState(newMissions);
    };

    // Helper to remove row
    const handleRemoveRow = (state, setState) => {
        if (state.length > 1) {
            setState(state.slice(0, -1));
        }
    };

    const handleSave = () => {
        const data = {
            institute: { vision: instituteVision, missions: instituteMissions },
            department: { vision: deptVision, missions: deptMissions },
            peo: peoMissions,
            po: poMissions,
            pso: psoMissions
        };
        console.log("Saved Data:", data);
        alert("Data saved successfully (check console for details)");
    };

    return (
        <div className="statement-wrapper-nav-top">
            <Header />
            <div className="statement-body-container">
                <Sidebar />
                <div className="statement-main-content">
                    <div className="statement-content-wrapper">
                        <div className="statement-card">

                            <div className="statement-actions">
                                <button className="btn-define">Define</button>
                                <button className="btn-view" onClick={() => navigate('/statement2')}>View</button>
                            </div>

                            {/* Institute Section */}
                            <div className="section-title">1.1 State Vision and Mission of the Institute</div>
                            <div className="vision-row">
                                <span className="label-text">Vision :</span>
                                <input
                                    type="text"
                                    className="vision-input"
                                    value={instituteVision}
                                    onChange={(e) => setInstituteVision(e.target.value)}
                                />
                            </div>
                            <div className="mission-row"><span className="label-text">Mission :</span></div>
                            <MissionTable
                                missions={instituteMissions}
                                onChange={(i, v) => handleMissionChange(instituteMissions, setInstituteMissions, i, v)}
                                onAdd={() => handleAddRow(instituteMissions, setInstituteMissions, 'M')}
                                onRemove={() => handleRemoveRow(instituteMissions, setInstituteMissions)}
                            />

                            {/* Department Section */}
                            <div className="section-title">1.1 State Vision and Mission of the Department</div>
                            <div className="vision-row">
                                <span className="label-text">Vision :</span>
                                <input
                                    type="text"
                                    className="vision-input"
                                    value={deptVision}
                                    onChange={(e) => setDeptVision(e.target.value)}
                                />
                            </div>
                            <div className="mission-row"><span className="label-text">Mission :</span></div>
                            <MissionTable
                                missions={deptMissions}
                                onChange={(i, v) => handleMissionChange(deptMissions, setDeptMissions, i, v)}
                                onAdd={() => handleAddRow(deptMissions, setDeptMissions, 'M')}
                                onRemove={() => handleRemoveRow(deptMissions, setDeptMissions)}
                            />

                            {/* PEO Section */}
                            <div className="section-title">1.2 State the Program Educational Objectives </div>
                            <MissionTable
                                missions={peoMissions}
                                onChange={(i, v) => handleMissionChange(peoMissions, setPeoMissions, i, v)}
                                onAdd={() => handleAddRow(peoMissions, setPeoMissions, 'PEO')}
                                onRemove={() => handleRemoveRow(peoMissions, setPeoMissions)}
                            />

                            {/* PO Section */}
                            <div className="section-title">Define the Program Outcomes</div>
                            <MissionTable
                                missions={poMissions}
                                onChange={(i, v) => handleMissionChange(poMissions, setPoMissions, i, v)}
                                onAdd={() => handleAddRow(poMissions, setPoMissions, 'PO')}
                                onRemove={() => handleRemoveRow(poMissions, setPoMissions)}
                            />

                            {/* PSO Section */}
                            <div className="section-title">Define the Program Specific Outcomes</div>
                            <MissionTable
                                missions={psoMissions}
                                onChange={(i, v) => handleMissionChange(psoMissions, setPsoMissions, i, v)}
                                onAdd={() => handleAddRow(psoMissions, setPsoMissions, 'PSO')}
                                onRemove={() => handleRemoveRow(psoMissions, setPsoMissions)}
                            />

                            <div className="save-btn-container">
                                <button className="save-btn" onClick={handleSave}>Save</button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Statement1;
