import React from 'react';
import { useFilters } from '../../context/FilterContext';
import './GlobalFilterBar.css';

// Helper: parse 'YYYY-YY' or 'YYYY - YY' → start year integer
const parseYear = (str) => {
    if (!str) return null;
    const clean = str.replace(/\s/g, '');
    return parseInt(clean.split('-')[0], 10);
};

// Helper: format start year → 'YYYY-YY'
const fmtYear = (y) => `${y}-${(y + 1).toString().slice(-2)}`;

// Helper: format start year → 'YYYY - YY' (academic year style)
const fmtAY = (y) => `${y} - ${(y + 1).toString().slice(-2)}`;

const PROGRAM_DURATION = 3; // years

// Class ↔ Semester mappings
const CLASS_SEMS = { FY: ['1', '2'], SY: ['3', '4'], TY: ['5', '6'] };
const SEM_CLASS = { '1': 'FY', '2': 'FY', '3': 'SY', '4': 'SY', '5': 'TY', '6': 'TY' };

const GlobalFilterBar = ({ visibleFilters = null, disableYearFiltering = false }) => {
    const {
        selectedDept, setSelectedDept,
        selectedScheme, setSelectedScheme,
        selectedBatch, setSelectedBatch,
        selectedYear, setSelectedYear,
        selectedIntroYear, setSelectedIntroYear,
        selectedClass, setSelectedClass,
        selectedSemester, setSelectedSemester,
        selectedDivision, setSelectedDivision,
        departments,
        batches,
        years,
        schemes
    } = useFilters();

    if (visibleFilters !== null && visibleFilters.length === 0) return null;

    const isVisible = (id) => visibleFilters === null || visibleFilters.includes(id);

    const DIV_OPTIONS = ['A', 'B', 'C'];

    // --- Smart Academic Year options (filtered by selected Batch) ---
    // Batch is primary: show ALL batches, but filter academic years based on selected batch
    const selBatchYear = parseYear(selectedBatch);
    const filteredYears = (selBatchYear && !disableYearFiltering)
        ? years.filter(y => {
            const yy = parseYear(y);
            // Batch selBatchYear is active in years: selBatchYear-2, selBatchYear-1, selBatchYear
            return yy >= selBatchYear - (PROGRAM_DURATION - 1) && yy <= selBatchYear;
        })
        : years;

    // --- Smart Semester options (filtered by selected Class) ---
    const filteredSems = (selectedClass && CLASS_SEMS[selectedClass])
        ? [...CLASS_SEMS[selectedClass]]
        : ['1', '2', '3', '4', '5', '6'];

    // --- Handlers with auto-sync ---
    const handleClassChange = (cls) => {
        setSelectedClass(cls);
        const validSems = CLASS_SEMS[cls] || [];
        if (!validSems.includes(selectedSemester)) {
            setSelectedSemester(validSems[0] || '1');
        }
    };

    const handleSemesterChange = (sem) => {
        setSelectedSemester(sem);
        if (SEM_CLASS[sem]) setSelectedClass(SEM_CLASS[sem]);
    };

    const handleBatchChange = (batch) => {
        setSelectedBatch(batch);
        if (batch) {
            const by = parseYear(batch);
            const currentAY = parseYear(selectedYear);
            if (currentAY !== null && (currentAY < by - (PROGRAM_DURATION - 1) || currentAY > by)) {
                setSelectedYear(fmtAY(by));
            }
        }
    };

    const handleYearChange = (year) => {
        // Year is secondary — just update it, no batch snapping
        setSelectedYear(year);
    };

    return (
        <div className="global-filter-bar shadow-sm">
            {isVisible('dept') && (
                <div className="filter-item">
                    <label>Department</label>
                    <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                        <option value="">Select Dept</option>
                        {departments.map(dept => (
                            <option key={dept.program_id} value={dept.program_id}>{dept.program_name}</option>
                        ))}
                    </select>
                </div>
            )}

            {isVisible('scheme') && (
                <div className="filter-item">
                    <label>Scheme</label>
                    <select value={selectedScheme} onChange={(e) => setSelectedScheme(e.target.value)}>
                        <option value="">Select Scheme</option>
                        {schemes.map(s => (
                            <option key={s.scheme_id} value={s.scheme_id}>{s.scheme_name}</option>
                        ))}
                    </select>
                </div>
            )}

            {isVisible('batch') && (
                <div className="filter-item">
                    <label>Batch</label>
                    <select value={selectedBatch} onChange={(e) => handleBatchChange(e.target.value)}>
                        <option value="">Select Batch</option>
                        {batches.map(b => (
                            <option key={b.batch_id} value={b.batch_id}>
                                {b.display_batch || b.batch_id}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {isVisible('year') && (
                <div className="filter-item">
                    <label>Academic Year</label>
                    <select value={selectedYear} onChange={(e) => handleYearChange(e.target.value)}>
                        {filteredYears.map(y => (
                            <option key={`ay-${y}`} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            )}

            {isVisible('introYear') && (
                <div className="filter-item">
                    <label>Year of Introduction</label>
                    <select value={selectedIntroYear} onChange={(e) => setSelectedIntroYear(e.target.value)}>
                        <option value="">Select Year</option>
                        {batches.map(b => (
                            <option key={`intro-${b.batch_id}`} value={b.batch_id}>
                                {b.display_batch || b.batch_id}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {isVisible('class') && (
                <div className="filter-item compact">
                    <label>Class</label>
                    <select value={selectedClass} onChange={(e) => handleClassChange(e.target.value)}>
                        {['FY', 'SY', 'TY'].map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            )}

            {isVisible('semester') && (
                <div className="filter-item compact">
                    <label>Sem</label>
                    <select value={selectedSemester} onChange={(e) => handleSemesterChange(e.target.value)}>
                        {filteredSems.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            )}

            {isVisible('division') && (
                <div className="filter-item compact">
                    <label>Div</label>
                    <select value={selectedDivision} onChange={(e) => setSelectedDivision(e.target.value)}>
                        {DIV_OPTIONS.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
};

export default GlobalFilterBar;
