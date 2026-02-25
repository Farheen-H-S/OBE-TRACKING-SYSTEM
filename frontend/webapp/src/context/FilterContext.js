import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/axios';
import { getLoggedInUser } from '../utils/auth';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedScheme, setSelectedScheme] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('All');
    const [selectedYear, setSelectedYear] = useState('2025 - 26');
    const [selectedClass, setSelectedClass] = useState('All');
    const [selectedSemester, setSelectedSemester] = useState('All');
    const [selectedDivision, setSelectedDivision] = useState('All');
    const [departments, setDepartments] = useState([]);
    const [schemes, setSchemes] = useState([]);
    const [loadingFilters, setLoadingFilters] = useState(true);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [deptRes, schemeRes, setupRes] = await Promise.all([
                    api.get('/academics/programs/'),
                    api.get('/academics/schemes/list/'),
                    api.get('/academics/academic-setup/').catch(() => null)
                ]);

                setDepartments(deptRes.data);
                setSchemes(schemeRes.data);

                if (setupRes && setupRes.data) {
                    const ay = setupRes.data.academic_year;
                    if (ay) setSelectedYear(ay);
                }

                // Set default department from user
                const user = getLoggedInUser();
                if (user) {
                    const userDept = user.department_id || user.department;
                    if (userDept) {
                        setSelectedDept(userDept.toString());
                    }
                }

                // Set default scheme if available
                if (schemeRes.data.length > 0) {
                    setSelectedScheme(schemeRes.data[0].scheme_id.toString());
                }

                setLoadingFilters(false);
            } catch (err) {
                console.error("Error fetching filters:", err);
                setLoadingFilters(false);
            }
        };

        fetchFilters();
    }, []);

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
