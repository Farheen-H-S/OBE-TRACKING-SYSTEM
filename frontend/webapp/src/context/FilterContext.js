import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/axios';
import { getLoggedInUser } from '../utils/auth';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedScheme, setSelectedScheme] = useState('');
    const [departments, setDepartments] = useState([]);
    const [schemes, setSchemes] = useState([]);
    const [loadingFilters, setLoadingFilters] = useState(true);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [deptRes, schemeRes] = await Promise.all([
                    api.get('/academics/programs/'),
                    api.get('/academics/schemes/list/')
                ]);

                setDepartments(deptRes.data);
                setSchemes(schemeRes.data);

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
            selectedDept,
            setSelectedDept,
            selectedScheme,
            setSelectedScheme,
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
