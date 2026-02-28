import React from 'react';
import { useFilters } from '../../context/FilterContext';
import './GlobalFilterBar.css';

const GlobalFilterBar = () => {
    const {
        selectedDept, setSelectedDept,
        selectedScheme, setSelectedScheme,
        selectedBatch, setSelectedBatch,
        selectedYear, setSelectedYear,
        selectedClass, setSelectedClass,
        selectedSemester, setSelectedSemester,
        selectedDivision, setSelectedDivision,
        departments,
        batches,
        years,
        schemes
    } = useFilters();

    const CLASS_OPTIONS = ['FY', 'SY', 'TY'];
    const SEM_OPTIONS = ['1', '2', '3', '4', '5', '6', 'All'];
    const DIV_OPTIONS = ['A', 'B', 'C', 'All'];

    return (
        <div className="global-filter-bar shadow-sm">
            <div className="filter-item">
                <label>Department</label>
                <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                >
                    <option value="">Select Dept</option>
                    {departments.map(dept => (
                        <option key={dept.program_id} value={dept.program_id}>
                            {dept.program_name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="filter-item">
                <label>Scheme</label>
                <select
                    value={selectedScheme}
                    onChange={(e) => setSelectedScheme(e.target.value)}
                >
                    <option value="">Select Scheme</option>
                    {schemes.map(s => (
                        <option key={s.scheme_id} value={s.scheme_id}>
                            {s.scheme_name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="filter-item">
                <label>Batch</label>
                <select
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                >
                    <option value="">Select Batch</option>
                    {batches.map(b => (
                        <option key={b.batch_id} value={b.batch_id}>
                            {b.display_batch || b.batch_year}
                        </option>
                    ))}
                </select>
            </div>

            <div className="filter-item">
                <label>Academic Year</label>
                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                >
                    {years.map(y => (
                        <option key={`ay-${y}`} value={y}>{y}</option>
                    ))}
                </select>
            </div>

            <div className="filter-item compact">
                <label>Class</label>
                <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                >
                    {CLASS_OPTIONS.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            <div className="filter-item compact">
                <label>Sem</label>
                <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                >
                    {SEM_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            <div className="filter-item compact">
                <label>Div</label>
                <select
                    value={selectedDivision}
                    onChange={(e) => setSelectedDivision(e.target.value)}
                >
                    {DIV_OPTIONS.map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default GlobalFilterBar;
