import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/axios';
import { getLoggedInUser } from '../utils/auth';

const FilterContext = createContext();

const CONTEXT_STORAGE_KEY = 'obe_academic_context';

export const FilterProvider = ({ children }) => {
    // Load initial state from localStorage or defaults
    const getInitialState = () => {
        const saved = localStorage.getItem(CONTEXT_STORAGE_KEY);
        const defaults = {
            selectedDept: '',
            selectedScheme: '',
            selectedBatch: '2025-26',
            selectedYear: '2025 - 26',
            selectedClass: 'TY',
            selectedSemester: '1',
            selectedDivision: 'A',
            selectedIntroYear: ''
        };

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Override the cached selectedIntroYear if it was the old default to prevent invisible courses
                if (parsed.selectedIntroYear === '2025-26') {
                    parsed.selectedIntroYear = '';
                }
                return { ...defaults, ...parsed };
            } catch (e) {
                console.error("Error parsing saved context:", e);
                return defaults;
            }
        }
        return defaults;
    };

    const initialState = getInitialState();

    const [selectedDept, setSelectedDept] = useState(initialState.selectedDept);
    const [selectedScheme, setSelectedScheme] = useState(initialState.selectedScheme);
    const [selectedBatch, setSelectedBatch] = useState(initialState.selectedBatch);
    const [selectedYear, setSelectedYear] = useState(initialState.selectedYear);
    const [selectedClass, setSelectedClass] = useState(initialState.selectedClass);
    const [selectedSemester, setSelectedSemester] = useState(initialState.selectedSemester);
    const [selectedDivision, setSelectedDivision] = useState(initialState.selectedDivision);
    const [selectedIntroYear, setSelectedIntroYear] = useState(initialState.selectedIntroYear);
    const [selectedCourse, setSelectedCourse] = useState(initialState.selectedCourse || '');

    const [departments, setDepartments] = useState([]);
    const [schemes, setSchemes] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loadingFilters, setLoadingFilters] = useState(true);
    const location = useLocation();

    // Persist to localStorage whenever context changes
    useEffect(() => {
        const finalCourse = selectedCourse || '';

        const context = {
            selectedDept,
            selectedScheme,
            selectedBatch,
            selectedYear,
            selectedClass,
            selectedSemester,
            selectedDivision,
            selectedIntroYear,
            selectedCourse: finalCourse
        };
        localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(context));
    }, [selectedDept, selectedScheme, selectedBatch, selectedYear, selectedClass, selectedSemester, selectedDivision, selectedIntroYear, selectedCourse]);

    // Generate batches (2018-19 to 2030-31)
    const generatedBatches = [];
    for (let i = 2018; i <= 2030; i++) {
        generatedBatches.push(`${i}-${(i + 1).toString().slice(-2)}`);
    }

    // Auto-select Class based on Academic Year and Batch (runs on change AND initial mount)
    // Batch year = graduation year. FY = batch-2, SY = batch-1, TY = batch year
    const computeClassFromYearBatch = (year, batch) => {
        if (!year || !batch) return null;
        try {
            const batchStartYear = parseInt(batch.replace(/\s/g, '').split('-')[0], 10);
            const currentAyStartYear = parseInt(year.replace(/\s/g, '').split('-')[0], 10);
            const diff = batchStartYear - currentAyStartYear; // e.g. 2025 - 2023 = 2 → FY
            if (diff === 2) return 'FY';
            if (diff === 1) return 'SY';
            if (diff === 0) return 'TY';
        } catch (e) {
            console.error("Error calculating class from year:", e);
        }
        return null;
    };

    useEffect(() => {
        const computedClass = computeClassFromYearBatch(selectedYear, selectedBatch);
        if (computedClass && computedClass !== selectedClass) {
            setSelectedClass(computedClass);
        }
    }, [selectedYear, selectedBatch]); // eslint-disable-line react-hooks/exhaustive-deps

    // Generate academic years (fallback if API fails)
    const years = [];
    for (let i = 2018; i <= 2030; i++) {
        years.push(`${i} - ${(i + 1).toString().slice(-2)}`);
    }

    const fetchFilters = useCallback(async () => {
        const user = getLoggedInUser();
        if (!user) {
            setLoadingFilters(false);
            return;
        }

        try {
            const [deptRes, schemeRes, batchRes, setupRes] = await Promise.all([
                api.get('academics/programs/'),
                api.get('academics/schemes/list/'),
                api.get('academics/batches/list/'),
                api.get('academics/academic-setup/').catch(() => ({ data: null }))
            ]);

            if (deptRes.data) setDepartments(deptRes.data);
            if (schemeRes.data) setSchemes(schemeRes.data);

            // Always use generated batches to ensure YYYY-YY format and correct range (2018-2030)
            setBatches(generatedBatches.map(b => ({ batch_id: b, display_batch: b })));

            // Only set defaults if state is currently empty
            if (setupRes && setupRes.data && !selectedYear) {
                const ay = setupRes.data.academic_year;
                if (ay) setSelectedYear(ay);
            }

            // Set default department from user if not already set
            const userDept = user.department_id || user.department;
            if (userDept && !selectedDept) {
                setSelectedDept(userDept.toString());
            }

            // Set default scheme if not already set
            if (schemeRes.data && schemeRes.data.length > 0 && !selectedScheme) {
                setSelectedScheme(schemeRes.data[0].scheme_id.toString());
            }

            setLoadingFilters(false);
        } catch (err) {
            console.error("Error fetching filters:", err);
            if (err.response?.status !== 401) {
                setLoadingFilters(false);
            }
        }
    }, [selectedDept, selectedScheme, selectedYear]);

    // Initial load and re-fetch on navigation if data is missing
    useEffect(() => {
        if (departments.length === 0) {
            fetchFilters();
        }
    }, [location.pathname, fetchFilters, departments.length]);

    const validateContext = useCallback((requiredFields = []) => {
        const context = {
            dept: selectedDept,
            scheme: selectedScheme,
            batch: selectedBatch,
            year: selectedYear,
            class: selectedClass,
            semester: selectedSemester,
            division: selectedDivision,
            introYear: selectedIntroYear
        };

        const missingFields = requiredFields.filter(field => !context[field] || context[field] === '');

        return {
            isValid: missingFields.length === 0,
            missingFields
        };
    }, [selectedDept, selectedScheme, selectedBatch, selectedYear, selectedClass, selectedSemester, selectedDivision, selectedIntroYear]);

    return (
        <FilterContext.Provider value={{
            selectedDept, setSelectedDept,
            selectedScheme, setSelectedScheme,
            selectedBatch, setSelectedBatch,
            selectedYear, setSelectedYear,
            selectedIntroYear, setSelectedIntroYear,
            selectedClass, setSelectedClass,
            selectedSemester, setSelectedSemester,
            selectedDivision, setSelectedDivision,
            selectedCourse, setSelectedCourse,
            departments,
            programs: departments,
            batches,
            years,
            schemes,
            loadingFilters,
            validateContext
        }}>
            {children}
        </FilterContext.Provider>
    );
};

export const useFilters = () => {
    const context = useContext(FilterContext);
    if (!context) {
        throw new Error('useFilters must be used within a FilterProvider');
    }
    return context;
};
