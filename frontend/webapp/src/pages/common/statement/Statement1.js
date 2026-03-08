import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFilters } from '../../../context/FilterContext';
import api from '../../../utils/axios';
import { getLoggedInUser } from '../../../utils/auth';
import './Statement1.css';

// Default Placeholders for Engineering Departments
const DEFAULT_PLACEHOLDERS = {
    INSTITUTE_VISION: "Enter vision of institue",
    DEPT_VISION: (dept) => `Enter vision of ${dept} department`,
    MISSION: "Enter mission",
    PEO: "Enter peo",
    PO: "Enter po",
    PSO: "Enter pso"
};

// Reusable Table Component with Blue Theme
const MissionTable = ({ missions, type, onChange, onAdd, onRemove }) => {
    const getPlaceholder = (index) => {
        if (type.includes('MISSION')) return DEFAULT_PLACEHOLDERS.MISSION;
        if (type.includes('PEO')) return DEFAULT_PLACEHOLDERS.PEO;
        if (type.includes('PO')) return DEFAULT_PLACEHOLDERS.PO;
        if (type.includes('PSO')) return DEFAULT_PLACEHOLDERS.PSO;
        return `Enter ${type} statement here...`;
    };

    const headerLabel = type.includes('MISSION') ? 'Mission no.' : `${type} no.`;

    return (
        <div className="table-row-group">
            <table className="mission-table blue-theme-table">
                <thead>
                    <tr>
                        <th width="120">{headerLabel}</th>
                        <th>Statement</th>
                    </tr>
                </thead>
                <tbody>
                    {missions.map((mission, index) => (
                        <tr key={index}>
                            <td className="no-cell">{mission.no}</td>
                            <td>
                                <input
                                    type="text"
                                    className="mission-input"
                                    value={mission.text}
                                    placeholder={getPlaceholder(index)}
                                    onChange={(e) => onChange(index, e.target.value)}
                                    readOnly={!onChange}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {onAdd && (
                <div className="row-controls no-print">
                    <button className="row-action-btn add-btn" onClick={onAdd} title="Add Row">+</button>
                    {missions.length > 1 && (
                        <button className="row-action-btn remove-btn" onClick={onRemove} title="Remove Row">-</button>
                    )}
                </div>
            )}
        </div>
    );
};

const Statement1 = () => {
    const navigate = useNavigate();
    const user = getLoggedInUser();
    const role = (user?.role || user?.role_name || "").toUpperCase();
    const canEdit = role === 'HOD' || role === 'COORDINATOR' || role === 'ADMIN';

    const { selectedDept: selectedProgram, setSelectedDept: setSelectedProgram, departments: programs } = useFilters();
    const [loading, setLoading] = useState(false);

    // Form states
    const [instituteVision, setInstituteVision] = useState('');
    const [instituteMissions, setInstituteMissions] = useState([{ no: 'M1', text: '' }]);
    const [deptVision, setDeptVision] = useState('');
    const [deptMissions, setDeptMissions] = useState([{ no: 'M1', text: '' }]);
    const [peoMissions, setPeoMissions] = useState([{ no: 'PEO 1', text: '' }]);
    const [poMissions, setPoMissions] = useState([{ no: 'PO 1', text: '' }]);
    const [psoMissions, setPsoMissions] = useState([{ no: 'PSO 1', text: '' }]);

    useEffect(() => {
        if (selectedProgram) {
            fetchExistingData();
        }
    }, [selectedProgram]);

    const currentProgramName = programs.find(p => p.program_id === parseInt(selectedProgram))?.program_name || 'Department';

    const fetchExistingData = async () => {
        setLoading(true);
        try {
            const stmtRes = await api.get(`/academics/program-statements/?program_id=${selectedProgram}`);
            const stmts = stmtRes.data;

            if (stmts.length > 0) {
                setInstituteVision(stmts.find(s => s.statement_type === 'INSTITUTE_VISION')?.description || '');
                setDeptVision(stmts.find(s => s.statement_type === 'DEPT_VISION')?.description || '');

                const instM = stmts.filter(s => s.statement_type === 'INSTITUTE_MISSION')
                    .map((s, i) => ({ no: `M${i + 1}`, text: s.description }));
                if (instM.length > 0) setInstituteMissions(instM);
                else setInstituteMissions([{ no: 'M1', text: '' }]);

                const deptM = stmts.filter(s => s.statement_type === 'DEPT_MISSION')
                    .map((s, i) => ({ no: `M${i + 1}`, text: s.description }));
                if (deptM.length > 0) setDeptMissions(deptM);
                else setDeptMissions([{ no: 'M1', text: '' }]);
            } else {
                setInstituteVision('');
                setDeptVision('');
                setInstituteMissions([{ no: 'M1', text: '' }]);
                setDeptMissions([{ no: 'M1', text: '' }]);
            }

            const peoRes = await api.get(`/academics/peos/?program_id=${selectedProgram}`);
            if (peoRes.data.length > 0) {
                setPeoMissions(peoRes.data.map((p, i) => ({ no: `PEO ${i + 1}`, text: p.description })));
            } else {
                setPeoMissions([{ no: 'PEO 1', text: '' }]);
            }

            const poRes = await api.get(`/academics/pos/?program_id=${selectedProgram}`);
            if (poRes.data.length > 0) {
                setPoMissions(poRes.data.map((p, i) => ({ no: `PO ${i + 1}`, text: p.description })));
            } else {
                setPoMissions([{ no: 'PO 1', text: '' }]);
            }

            const psoRes = await api.get(`/academics/psos/?program_id=${selectedProgram}`);
            if (psoRes.data.length > 0) {
                setPsoMissions(psoRes.data.map((p, i) => ({ no: `PSO ${i + 1}`, text: p.description })));
            } else {
                setPsoMissions([{ no: 'PSO 1', text: '' }]);
            }

        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleMissionChange = (state, setState, index, value) => {
        const newMissions = [...state];
        newMissions[index].text = value;
        setState(newMissions);
    };

    const handleAddRow = (state, setState, prefix) => {
        const nextId = state.length + 1;
        const label = prefix === 'M' ? `M${nextId}` : `${prefix} ${nextId}`;
        setState([...state, { no: label, text: '' }]);
    };

    const handleRemoveRow = (state, setState) => {
        if (state.length > 1) {
            setState(state.slice(0, -1));
        }
    };

    const handleSave = async () => {
        if (!selectedProgram) return alert("Please select a program first");

        // Logic: Use placeholder if text is empty
        const finalVision = instituteVision.trim();
        const finalDeptVision = deptVision.trim();

        const statements = [
            { program_id: selectedProgram, statement_type: 'INSTITUTE_VISION', description: finalVision },
            { program_id: selectedProgram, statement_type: 'DEPT_VISION', description: finalDeptVision },
            ...instituteMissions.map((m, i) => ({
                program_id: selectedProgram,
                statement_type: 'INSTITUTE_MISSION',
                statement_number: m.no,
                description: m.text.trim()
            })),
            ...deptMissions.map((m, i) => ({
                program_id: selectedProgram,
                statement_type: 'DEPT_MISSION',
                statement_number: m.no,
                description: m.text.trim()
            }))
        ];

        const peoData = peoMissions.map((p, i) => ({
            program_id: selectedProgram,
            peo_number: p.no,
            description: p.text.trim()
        }));

        const poData = poMissions.map((p, i) => ({
            program_id: selectedProgram,
            po_number: p.no,
            description: p.text.trim()
        }));

        const psoData = psoMissions.map((p, i) => ({
            program_id: selectedProgram,
            pso_number: p.no,
            description: p.text.trim()
        }));

        try {
            setLoading(true);
            await api.post('/academics/program-statements/', statements);
            await api.post('/academics/peos/', peoData);
            await api.post('/academics/pos/', poData);
            await api.post('/academics/psos/', psoData);

            alert("Statements saved successfully!");
            navigate('/statement2');
        } catch (err) {
            console.error("Error saving data:", err);
            alert("Failed to save statements. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="statement1-main-standalone">
            <div className="mx-auto" style={{ maxWidth: '1100px' }}>
                <div className="statement-card shadow-sm">
                    <div className="d-flex justify-content-end mb-4 no-print" style={{ width: '100%' }}>
                        {canEdit && (
                            <div className="toggle-container shadow-sm">
                                <button className="toggle-btn active">Define</button>
                                <button className="toggle-btn" onClick={() => navigate('/statement2')}>View</button>
                            </div>
                        )}
                        {!canEdit && (
                            <h4 className="m-0 fw-bold text-primary">PEOs, POs, and PSOs Statements</h4>
                        )}
                    </div>

                    {loading ? (
                        <div className="text-center p-5">Loading...</div>
                    ) : (
                        <div className="statement-content-container">

                            {/* Institute Section */}
                            <div className="section-block">
                                <h3 className="section-title">1.1 State Vision and Mission of the Institute</h3>
                                <div className="vision-input-group mb-4">
                                    <label className="fw-bold text-dark me-2">Vision :</label>
                                    <input
                                        type="text"
                                        className="form-control vision-input-field"
                                        value={instituteVision}
                                        placeholder={DEFAULT_PLACEHOLDERS.INSTITUTE_VISION}
                                        onChange={(e) => setInstituteVision(e.target.value)}
                                        readOnly={!canEdit}
                                    />
                                </div>
                                <div className="mission-table-group">
                                    <label className="fw-bold text-dark mb-2">Mission :</label>
                                    <MissionTable
                                        type="INSTITUTE_MISSION"
                                        missions={instituteMissions}
                                        onChange={canEdit ? (i, v) => handleMissionChange(instituteMissions, setInstituteMissions, i, v) : null}
                                        onAdd={canEdit ? () => handleAddRow(instituteMissions, setInstituteMissions, 'M') : null}
                                        onRemove={canEdit ? () => handleRemoveRow(instituteMissions, setInstituteMissions) : null}
                                    />
                                </div>
                            </div>

                            {/* Department Section */}
                            <div className="section-block mt-5">
                                <h3 className="section-title">1.2 State Vision and Mission of the Department</h3>
                                <div className="vision-input-group mb-4">
                                    <label className="fw-bold text-dark me-2">Vision :</label>
                                    <input
                                        type="text"
                                        className="form-control vision-input-field"
                                        value={deptVision}
                                        placeholder={DEFAULT_PLACEHOLDERS.DEPT_VISION(currentProgramName)}
                                        onChange={(e) => setDeptVision(e.target.value)}
                                        readOnly={!canEdit}
                                    />
                                </div>
                                <div className="mission-table-group">
                                    <label className="fw-bold text-dark mb-2">Mission :</label>
                                    <MissionTable
                                        type="DEPT_MISSION"
                                        missions={deptMissions}
                                        onChange={canEdit ? (i, v) => handleMissionChange(deptMissions, setDeptMissions, i, v) : null}
                                        onAdd={canEdit ? () => handleAddRow(deptMissions, setDeptMissions, 'M') : null}
                                        onRemove={canEdit ? () => handleRemoveRow(deptMissions, setDeptMissions) : null}
                                    />
                                </div>
                            </div>

                            {/* PEO Section */}
                            <div className="section-block mt-5">
                                <h3 className="section-title">1.3 State the Program Educational Objectives (PEO)</h3>
                                <MissionTable
                                    type="PEO"
                                    missions={peoMissions}
                                    onChange={canEdit ? (i, v) => handleMissionChange(peoMissions, setPeoMissions, i, v) : null}
                                    onAdd={canEdit ? () => handleAddRow(peoMissions, setPeoMissions, 'PEO') : null}
                                    onRemove={canEdit ? () => handleRemoveRow(peoMissions, setPeoMissions) : null}
                                />
                            </div>

                            {/* PO Section */}
                            <div className="section-block mt-5">
                                <h3 className="section-title">Define Program Outcomes (PO)</h3>
                                <MissionTable
                                    type="PO"
                                    missions={poMissions}
                                    onChange={canEdit ? (i, v) => handleMissionChange(poMissions, setPoMissions, i, v) : null}
                                    onAdd={canEdit ? () => handleAddRow(poMissions, setPoMissions, 'PO') : null}
                                    onRemove={canEdit ? () => handleRemoveRow(poMissions, setPoMissions) : null}
                                />
                            </div>

                            {/* PSO Section */}
                            <div className="section-block mt-5">
                                <h3 className="section-title">Define Program Specific Outcomes (PSO)</h3>
                                <MissionTable
                                    type="PSO"
                                    missions={psoMissions}
                                    onChange={canEdit ? (i, v) => handleMissionChange(psoMissions, setPsoMissions, i, v) : null}
                                    onAdd={canEdit ? () => handleAddRow(psoMissions, setPsoMissions, 'PSO') : null}
                                    onRemove={canEdit ? () => handleRemoveRow(psoMissions, setPsoMissions) : null}
                                />
                            </div>

                            {canEdit && (
                                <div className="text-center mt-5 pb-4">
                                    <button className="btn btn-outline-primary px-5 py-3 btn-lg shadow-sm fw-bold" onClick={handleSave}>
                                        Save Statements
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Statement1;
