import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/axios';
import { getLoggedInUser } from '../utils/auth';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedScheme, setSelectedScheme] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('2025-26');
    const [selectedYear, setSelectedYear] = useState('2025 - 26');
    const [selectedClass, setSelectedClass] = useState('TY');
    const [selectedSemester, setSelectedSemester] = useState('All');
    const [selectedDivision, setSelectedDivision] = useState('All');
    const [departments, setDepartments] = useState([]);
    const [schemes, setSchemes] = useState([]);
    const [loadingFilters, setLoadingFilters] = useState(true);
    const location = useLocation();

    // Generate academic years for components that depend on it
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
            const [deptRes, schemeRes, setupRes] = await Promise.all([
                api.get('academics/programs/'),
                api.get('academics/schemes/list/'),
                api.get('academics/academic-setup/').catch(() => ({ data: null }))
            ]);

            if (deptRes.data) setDepartments(deptRes.data);
            if (schemeRes.data) setSchemes(schemeRes.data);

            if (setupRes && setupRes.data) {
                const ay = setupRes.data.academic_year;
                if (ay) setSelectedYear(ay);
            }

            // Set default department from user
            const userDept = user.department_id || user.department;
            if (userDept) {
                setSelectedDept(userDept.toString());
            }

            // Set default scheme if available
            if (schemeRes.data && schemeRes.data.length > 0) {
                setSelectedScheme(schemeRes.data[0].scheme_id.toString());
            }

            setLoadingFilters(false);
        } catch (err) {
            console.error("Error fetching filters:", err);
            if (err.response?.status !== 401) {
                setLoadingFilters(false);
            }
        }
    }, []);

    // Initial load and re-fetch on navigation if data is missing
    useEffect(() => {
        if (departments.length === 0) {
            fetchFilters();
        }
    }, [location.pathname, fetchFilters, departments.length]);

    return (
        <FilterContext.Provider value={{
            selectedDept, setSelectedDept,
            selectedScheme, setSelectedScheme,
            selectedBatch, setSelectedBatch,
            selectedYear, setSelectedYear,
            selectedClass, setSelectedClass,
            selectedSemester, setSelectedSemester,
            selectedDivision, setSelectedDivision,
            departments,
            programs: departments, // Alias for backwards compatibility with some components
            years, // Providing years array globally
            schemes,
            loadingFilters
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
