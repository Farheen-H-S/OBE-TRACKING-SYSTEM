/**
 * Shared utility for computing semester defaults based on academic setup.
 * The admin sets `semester_type` as 'Odd' or 'Even' in Academic Setup.
 *
 * Odd  => FY=1, SY=3, TY=5
 * Even => FY=2, SY=4, TY=6
 */

export const getDefaultSemester = (classYear, semesterType) => {
    const isOdd = (semesterType || 'Odd').toLowerCase() === 'odd';
    switch (classYear) {
        case 'FY': return isOdd ? '1' : '2';
        case 'SY': return isOdd ? '3' : '4';
        case 'TY': return isOdd ? '5' : '6';
        default: return isOdd ? '1' : '2';
    }
};

export const getSemesterOptions = (classYear) => {
    switch (classYear) {
        case 'FY': return ['1', '2'];
        case 'SY': return ['3', '4'];
        case 'TY': return ['5', '6'];
        default: return ['1', '2', '3', '4', '5', '6'];
    }
};

/**
 * Fetch the global academic setup semester type from localStorage cache,
 * or fallback to 'Odd'.
 */
export const getCachedSemesterType = () => {
    try {
        const setup = JSON.parse(localStorage.getItem('academicSetup') || '{}');
        return setup.semester_type || 'Odd';
    } catch {
        return 'Odd';
    }
};
