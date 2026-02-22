import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { celebImg } from '../../assets/images';

const AcademicSetup = () => {
    const [academicYear, setAcademicYear] = useState('2025 - 26');
    const [selectedScheme, setSelectedScheme] = useState('');
    const [semesterType, setSemesterType] = useState('Odd');
    const [loading, setLoading] = useState(true);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const [programs, setPrograms] = useState([]);
    const [newProgram, setNewProgram] = useState({ program_name: '', duration: 3 });

    const [schemes, setSchemes] = useState([]);
    const [newScheme, setNewScheme] = useState({ scheme_name: '', start_year: new Date().getFullYear() });

    const [batches, setBatches] = useState([]);
    const [newBatch, setNewBatch] = useState({ start_year: new Date().getFullYear(), end_year: '', scheme_id: '' });

    useEffect(() => { fetchInitialData(); }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const setupRes = await api.get('academics/academic-setup/');
            if (setupRes.data && setupRes.data.academic_year) {
                setAcademicYear(setupRes.data.academic_year);
                setSelectedScheme(setupRes.data.scheme_id);
                setSemesterType(setupRes.data.semester_type);
                // Cache for other components to use
                localStorage.setItem('academicSetup', JSON.stringify(setupRes.data));
            }
            await Promise.all([fetchPrograms(), fetchSchemes(), fetchBatches()]);
        } catch (error) {
            console.error("Error fetching academic setup data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPrograms = async () => {
        const res = await api.get('academics/programs/?all=true');
        setPrograms(res.data);
    };

    const fetchSchemes = async () => {
        const res = await api.get('academics/schemes/list/?all=true');
        setSchemes(res.data);
    };

    const fetchBatches = async () => {
        const res = await api.get('academics/batches/list/?all=true');
        setBatches(res.data);
    };

    const sortActiveFirst = (arr) => [...arr].sort((a, b) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0));

    const showSuccess = (msg) => { setSuccessMessage(msg); setShowSuccessPopup(true); };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const data = { academic_year: academicYear, scheme_id: selectedScheme, semester_type: semesterType };
            await api.post('academics/academic-setup/', data);
            localStorage.setItem('academicSetup', JSON.stringify(data));
            showSuccess('Academic Setup successfully updated');
        } catch (error) {
            alert("Failed to save academic setup.");
        }
    };

    const handleAddProgram = async (e) => {
        e.preventDefault();
        const formattedName = newProgram.program_name.toLowerCase().split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        try {
            await api.post('academics/programs/', { ...newProgram, program_name: formattedName });
            setNewProgram({ program_name: '', duration: 3 });
            fetchPrograms();
            showSuccess('Department added successfully!');
        } catch { alert("Failed to add department."); }
    };

    const handleToggleProgram = async (prog) => {
        if (!window.confirm(`${prog.is_active ? 'Disable' : 'Enable'} this department?`)) return;
        try {
            await api.put(`academics/programs/${prog.program_id}/`, { is_active: !prog.is_active });
            fetchPrograms();
        } catch { alert("Failed to update department."); }
    };

    const handleAddScheme = async (e) => {
        e.preventDefault();
        try {
            await api.post('academics/schemes/', newScheme);
            setNewScheme({ scheme_name: '', start_year: new Date().getFullYear() });
            fetchSchemes();
            showSuccess('Scheme added successfully!');
        } catch (err) {
            alert("Failed to add scheme: " + JSON.stringify(err.response?.data || 'Unknown error'));
        }
    };

    const handleToggleScheme = async (scheme) => {
        if (!window.confirm(`${scheme.is_active ? 'Disable' : 'Enable'} this scheme?`)) return;
        try {
            await api.put(`academics/schemes/${scheme.scheme_id}/`, { is_active: !scheme.is_active });
            fetchSchemes();
        } catch { alert("Failed to update scheme."); }
    };

    const handleAddBatch = async (e) => {
        e.preventDefault();
        if (!newBatch.scheme_id) { alert('Please select a scheme.'); return; }
        if (!newBatch.start_year) { alert('Please enter a start year.'); return; }
        // batch_year is derived from start_year (admission year)
        const payload = { ...newBatch, batch_year: newBatch.start_year };
        try {
            await api.post('academics/batches/', payload);
            setNewBatch({ start_year: new Date().getFullYear(), end_year: '', scheme_id: '' });
            fetchBatches();
            showSuccess('Batch added successfully!');
        } catch (err) {
            alert("Failed to add batch: " + JSON.stringify(err.response?.data || 'Unknown error'));
        }
    };

    const handleToggleBatch = async (batch) => {
        if (!window.confirm(`${batch.is_active ? 'Disable' : 'Enable'} this batch?`)) return;
        try {
            await api.put(`academics/batches/${batch.batch_id}/`, { is_active: !batch.is_active });
            fetchBatches();
        } catch { alert("Failed to update batch."); }
    };

    if (loading) return <div className="text-center py-5">Loading academic setup...</div>;

    const activeSchemes = schemes.filter(s => s.is_active);
    const sortedPrograms = sortActiveFirst(programs);
    const sortedSchemes = sortActiveFirst(schemes);
    const sortedBatches = sortActiveFirst(batches);

    const cardHeader = (title) => (
        <h5 className="fw-bold mb-3 pb-2 border-bottom" style={{ color: '#1a237e' }}>{title}</h5>
    );

    const statusBadge = (active) => (
        <span className={`badge ${active ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '11px', minWidth: '60px' }}>
            {active ? 'Active' : 'Disabled'}
        </span>
    );

    const toggleBtn = (active, onClick) => (
        <button onClick={onClick}
            className={`btn btn-sm ${active ? 'btn-outline-warning' : 'btn-outline-success'} border-0 fw-bold`}
            style={{ fontSize: '12px' }}>
            {active ? 'Disable' : 'Enable'}
        </button>
    );

    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', overflowY: 'auto', padding: '24px' }}>
            <div className="container-fluid" style={{ maxWidth: '1400px' }}>

                {/* Row 1: Academic Setup + Departments side by side */}
                <div className="row g-3 mb-3">
                    {/* Academic Setup */}
                    <div className="col-lg-4">
                        <div className="bg-white p-4 rounded shadow-sm">
                            {cardHeader('Academic Setup')}
                            <form onSubmit={handleSave}>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-secondary">Academic Year</label>
                                    <select className="form-select" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                                        <option value="">Select Academic Year</option>
                                        {batches
                                            .filter(b => b.is_active && b.start_year && b.end_year)
                                            .map(b => {
                                                const label = `${b.start_year} - ${String(b.end_year).slice(-2)}`;
                                                return <option key={b.batch_id} value={label}>{label}</option>;
                                            })
                                        }
                                        {/* Fallback static options if no batches configured */}
                                        {batches.filter(b => b.is_active && b.start_year && b.end_year).length === 0 &&
                                            ['2025 - 26', '2024 - 25', '2023 - 24', '2022 - 23'].map(y => <option key={y} value={y}>{y}</option>)
                                        }
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-secondary">Active Scheme</label>
                                    <select className="form-select" value={selectedScheme} onChange={(e) => setSelectedScheme(e.target.value)}>
                                        <option value="">Select Scheme</option>
                                        {activeSchemes.map(s => <option key={s.scheme_id} value={s.scheme_id}>{s.scheme_name}</option>)}
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="form-label small fw-bold text-secondary">Semester Type</label>
                                    <select className="form-select" value={semesterType} onChange={(e) => setSemesterType(e.target.value)}>
                                        <option value="Odd">Odd (1, 3, 5)</option>
                                        <option value="Even">Even (2, 4, 6)</option>
                                    </select>
                                    <div className="form-text">
                                        Sets default semester for FY/SY/TY across all user interfaces.
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary w-100 fw-semibold" style={{ backgroundColor: '#4285f4', border: 'none' }}>
                                    Save Setup
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Departments */}
                    <div className="col-lg-8">
                        <div className="bg-white p-4 rounded shadow-sm">
                            {cardHeader('Manage Departments')}
                            <form onSubmit={handleAddProgram} className="mb-3 p-3 border rounded bg-light">
                                <div className="row g-2 align-items-end">
                                    <div className="col-md-7">
                                        <label className="form-label small fw-bold text-secondary">Department Name</label>
                                        <input type="text" className="form-control" placeholder="e.g. Computer Engineering"
                                            value={newProgram.program_name}
                                            onChange={(e) => setNewProgram({ ...newProgram, program_name: e.target.value })} required />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small fw-bold text-secondary">Duration (Years)</label>
                                        <input type="number" className="form-control" value={newProgram.duration} min="1"
                                            onChange={(e) => setNewProgram({ ...newProgram, duration: parseInt(e.target.value) || 0 })} required />
                                    </div>
                                    <div className="col-md-2">
                                        <button type="submit" className="btn btn-success w-100 fw-bold">Add</button>
                                    </div>
                                </div>
                            </form>
                            <div className="table-responsive" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                                <table className="table table-hover align-middle mb-0 small">
                                    <thead className="table-light sticky-top"><tr>
                                        <th>Department</th><th className="text-center">Years</th>
                                        <th className="text-center">Status</th><th className="text-center">Action</th>
                                    </tr></thead>
                                    <tbody>
                                        {sortedPrograms.length > 0 ? sortedPrograms.map(prog => (
                                            <tr key={prog.program_id} className={prog.is_active ? '' : 'table-secondary opacity-75'}>
                                                <td className="fw-medium">{prog.program_name}</td>
                                                <td className="text-center">{prog.duration}</td>
                                                <td className="text-center">{statusBadge(prog.is_active)}</td>
                                                <td className="text-center">{toggleBtn(prog.is_active, () => handleToggleProgram(prog))}</td>
                                            </tr>
                                        )) : <tr><td colSpan="4" className="text-center py-4 text-muted">No departments added yet.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 2: Schemes + Batches */}
                <div className="row g-3">
                    {/* Schemes */}
                    <div className="col-lg-5">
                        <div className="bg-white p-4 rounded shadow-sm">
                            {cardHeader('Manage Schemes')}
                            <form onSubmit={handleAddScheme} className="mb-3 p-3 border rounded bg-light">
                                <div className="row g-2 align-items-end">
                                    <div className="col-md-7">
                                        <label className="form-label small fw-bold text-secondary">Scheme Name</label>
                                        <input type="text" className="form-control" placeholder="e.g. K Scheme"
                                            value={newScheme.scheme_name}
                                            onChange={(e) => setNewScheme({ ...newScheme, scheme_name: e.target.value })} required />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small fw-bold text-secondary">Start Year</label>
                                        <input type="number" className="form-control" value={newScheme.start_year}
                                            onChange={(e) => setNewScheme({ ...newScheme, start_year: parseInt(e.target.value) })} required />
                                    </div>
                                    <div className="col-md-2">
                                        <button type="submit" className="btn btn-success w-100 fw-bold">Add</button>
                                    </div>
                                </div>
                            </form>
                            <div className="table-responsive" style={{ maxHeight: '260px', overflowY: 'auto' }}>
                                <table className="table table-hover align-middle mb-0 small">
                                    <thead className="table-light sticky-top"><tr>
                                        <th>Scheme Name</th><th className="text-center">Start Year</th>
                                        <th className="text-center">Status</th><th className="text-center">Action</th>
                                    </tr></thead>
                                    <tbody>
                                        {sortedSchemes.length > 0 ? sortedSchemes.map(scheme => (
                                            <tr key={scheme.scheme_id} className={scheme.is_active ? '' : 'table-secondary opacity-75'}>
                                                <td className="fw-medium">{scheme.scheme_name}</td>
                                                <td className="text-center">{scheme.start_year}</td>
                                                <td className="text-center">{statusBadge(scheme.is_active)}</td>
                                                <td className="text-center">{toggleBtn(scheme.is_active, () => handleToggleScheme(scheme))}</td>
                                            </tr>
                                        )) : <tr><td colSpan="4" className="text-center py-4 text-muted">No schemes yet.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Batches */}
                    <div className="col-lg-7">
                        <div className="bg-white p-4 rounded shadow-sm">
                            {cardHeader('Manage Batches')}
                            <form onSubmit={handleAddBatch} className="mb-3 p-3 border rounded bg-light">
                                <div className="row g-2 align-items-end">
                                    <div className="col-md-3">
                                        <label className="form-label small fw-bold text-secondary">Start Year</label>
                                        <input type="number" className="form-control" value={newBatch.start_year}
                                            onChange={(e) => setNewBatch({ ...newBatch, start_year: parseInt(e.target.value) })} required />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small fw-bold text-secondary">End Year</label>
                                        <input type="number" className="form-control" value={newBatch.end_year}
                                            onChange={(e) => setNewBatch({ ...newBatch, end_year: parseInt(e.target.value) || '' })} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small fw-bold text-secondary">Scheme</label>
                                        <select className="form-select" value={newBatch.scheme_id}
                                            onChange={(e) => setNewBatch({ ...newBatch, scheme_id: e.target.value })} required>
                                            <option value="">Select Scheme</option>
                                            {activeSchemes.map(s => <option key={s.scheme_id} value={s.scheme_id}>{s.scheme_name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-2">
                                        <button type="submit" className="btn btn-success w-100 fw-bold">Add</button>
                                    </div>
                                </div>
                            </form>
                            <div className="table-responsive" style={{ maxHeight: '260px', overflowY: 'auto' }}>
                                <table className="table table-hover align-middle mb-0 small">
                                    <thead className="table-light sticky-top"><tr>
                                        <th>Start Year</th><th>End Year</th>
                                        <th>Scheme</th><th className="text-center">Status</th><th className="text-center">Action</th>
                                    </tr></thead>
                                    <tbody>
                                        {sortedBatches.length > 0 ? sortedBatches.map(batch => (
                                            <tr key={batch.batch_id} className={batch.is_active ? '' : 'table-secondary opacity-75'}>
                                                <td className="fw-medium">{batch.start_year || '—'}</td>
                                                <td>{batch.end_year || '—'}</td>
                                                <td>{batch.scheme_name || `#${batch.scheme_id}`}</td>
                                                <td className="text-center">{statusBadge(batch.is_active)}</td>
                                                <td className="text-center">{toggleBtn(batch.is_active, () => handleToggleBatch(batch))}</td>
                                            </tr>
                                        )) : <tr><td colSpan="5" className="text-center py-4 text-muted">No batches yet.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Popup */}
            {showSuccessPopup && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="bg-white p-5 rounded shadow d-flex flex-column align-items-center text-center" style={{ maxWidth: '400px', width: '90%' }}>
                        <h4 className="mb-3 text-primary fw-bold">Success!</h4>
                        <p className="mb-3">{successMessage}</p>
                        <img src={celebImg} alt="Celebration" style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '16px' }} />
                        <button onClick={() => { setShowSuccessPopup(false); setSuccessMessage(''); }}
                            className="btn btn-primary px-4" style={{ backgroundColor: '#4285f4', border: 'none' }}>OK</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicSetup;
