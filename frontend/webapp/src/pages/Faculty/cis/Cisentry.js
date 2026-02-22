import React, { useState, useEffect, useRef } from 'react';
import './Cisentry.css';
// import { students } from '../../../data/studentData'; // REMOVED
import { sampleCourses, sampleCOs } from '../../../data/sampleData';
import api from '../../../utils/axios';
import { FaCloudUploadAlt, FaFilePdf, FaTimesCircle, FaCheckCircle, FaPlus, FaMinus, FaEye, FaPaperclip, FaEdit } from 'react-icons/fa';
import { getDefaultSemester, getCachedSemesterType, getSemesterOptions as computeSemesterOptions } from '../../../utils/semesterUtils';

const Cisentry = () => {
  // State for dynamic data
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [academicYear, setAcademicYear] = useState('');
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [coCount, setCoCount] = useState(0);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Selection state
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedScheme, setSelectedScheme] = useState('');
  const [selectedYear, setSelectedYear] = useState('2025-26');
  const [assessmentTools, setAssessmentTools] = useState({});
  const [selectedClass, setSelectedClass] = useState('FY');
  const [selectedDivision, setSelectedDivision] = useState('A');
  const [selectedSemester, setSelectedSemester] = useState(() => getDefaultSemester('FY', getCachedSemesterType()));
  const [selectedCourse, setSelectedCourse] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [allCourses, setAllCourses] = useState([]);
  const [assessmentType, setAssessmentType] = useState('Internal');
  const [selectedTool, setSelectedTool] = useState('FA-TH-CT1');
  const [totalMaxMarks, setTotalMaxMarks] = useState(30);
  const [columnCount, setColumnCount] = useState(14); // Default for CT
  const [viewMode, setViewMode] = useState('entry'); // 'entry', 'view', 'edit'

  // Marks and CO state
  const [marksData, setMarksData] = useState({}); // { studentEnrollment: { questionIndex: marks } }
  const [userCos, setUserCos] = useState(new Array(30).fill('')); // Support up to 30 CO inputs
  const [uploadedFiles, setUploadedFiles] = useState({});
  const fileInputRef = useRef(null);

  // Editable headers state
  const getCTQuestionLabel = (index) => {
    const qNum = Math.floor(index / 7) + 1;
    const subQ = String.fromCharCode(97 + (index % 7)); // 97 is 'a'
    return `${qNum}(${subQ})`;
  };

  const defaultQuestions = selectedTool === 'FA-PR'
    ? Array.from({ length: 60 }, (_, i) => `${i + 1}`)
    : selectedTool === 'SLA'
      ? ['1', '2', '3', '4', ...Array.from({ length: 56 }, (_, i) => `${i + 5}`)]
      : Array.from({ length: 60 }, (_, i) => getCTQuestionLabel(i));

  const defaultWeights = selectedTool === 'FA-PR'
    ? new Array(60).fill(totalMaxMarks.toString())
    : selectedTool === 'SLA'
      ? new Array(60).fill(totalMaxMarks.toString())
      : (selectedTool === 'SA-TH' || selectedTool === 'SA-PR')
        ? new Array(60).fill(totalMaxMarks.toString())
        : (parseInt(totalMaxMarks) === 30)
          ? Array.from({ length: 60 }, (_, i) => (i % 14 < 7 ? '2' : '4'))
          : new Array(60).fill((parseInt(totalMaxMarks) / 10).toString());

  const [customQuestions, setCustomQuestions] = useState(new Array(30).fill(''));
  const [customWeights, setCustomWeights] = useState(new Array(30).fill(''));

  const questions = (customQuestions.map((q, i) => q || defaultQuestions[i])).slice(0, columnCount);
  const weights = (customWeights.map((w, i) => w || defaultWeights[i])).slice(0, columnCount);
  const slicedUserCos = userCos.slice(0, columnCount);

  // Attainment Calculation Logic
  const calculateAttainmentStats = () => {
    // 1. Number of students appeared (per question)
    const appeared = questions.map((_, colIndex) => {
      return students.filter(s => {
        const mark = marksData[s.enrollment_no]?.[colIndex];
        return mark !== undefined && mark !== '' && mark !== null;
      }).length;
    });

    // 2. Average Marks per question
    const averages = questions.map((_, colIndex) => {
      const validMarks = students.map(s => parseFloat(marksData[s.enrollment_no]?.[colIndex])).filter(m => !isNaN(m));
      const total = validMarks.reduce((a, b) => a + b, 0);
      return validMarks.length ? (total / validMarks.length) : 0;
    });

    // 3. Number of Students >= Average
    const equalOrMoreAvg = questions.map((_, colIndex) => {
      const avg = averages[colIndex];
      // if (!avg && avg !== 0) return 0; // Handle 0 avg
      return students.filter(s => {
        const mark = parseFloat(marksData[s.enrollment_no]?.[colIndex]);
        return !isNaN(mark) && mark >= avg;
      }).length;
    });

    // 4. % of Student scored more than average
    const percentMoreAvg = questions.map((_, colIndex) => {
      const app = appeared[colIndex];
      const count = equalOrMoreAvg[colIndex];
      return app ? ((count / app) * 100).toFixed(2) : '0';
    });

    // 5. CO wise Hierarchical Attainment (Aggregated by Success/Appearance per CO)
    const coStats = {}; // { co_num: { success: 0, appeared: 0 } }
    questions.forEach((_, colIndex) => {
      const coVal = userCos[colIndex];
      if (coVal) {
        const coKey = coVal.toString();
        if (!coStats[coKey]) coStats[coKey] = { success: 0, appeared: 0 };
        coStats[coKey].success += equalOrMoreAvg[colIndex];
        coStats[coKey].appeared += appeared[colIndex];
      }
    });

    const coAttainment = questions.map((_, colIndex) => {
      const coVal = userCos[colIndex];
      if (coVal) {
        const stats = coStats[coVal.toString()];
        if (stats && stats.appeared > 0) {
          return ((stats.success / stats.appeared) * 100).toFixed(2);
        }
      }
      return '0.00';
    });

    return { appeared, equalOrMoreAvg, percentMoreAvg, coAttainment, averages, coStats };
  };

  const attainmentStats = calculateAttainmentStats();

  // Dynamic Tool options based on selected course configuration
  // const [dynamicTools, setDynamicTools] = useState({ Internal: [], External: [] }); // REMOVED

  // useEffect(() => { // REMOVED
  //   if (selectedCourse && courses.length > 0) {
  //     const course = courses.find(c => c.course_id === parseInt(selectedCourse));
  //     if (course && course.assessment_tools) {
  //       const config = course.assessment_tools;
  //       const internal = [];
  //       const external = [];

  //       if (config['FA-TH']?.selected) {
  //         internal.push({ value: 'FA-TH-CT1', label: 'FA-TH (Class Test 1)' });
  //         internal.push({ value: 'FA-TH-CT2', label: 'FA-TH (Class Test 2)' });
  //       }
  //       if (config['FA-PR']?.selected) internal.push({ value: 'FA-PR', label: 'FA-PR (K3)' });
  //       if (config['SLA']?.selected) internal.push({ value: 'SLA', label: 'SLA (Self Learning Assessment)' });

  //       if (config['SA-TH']?.selected) external.push({ value: 'SA-TH', label: 'SA-TH (Theory)' });
  //       if (config['SA-PR']?.selected) external.push({ value: 'SA-PR', label: 'SA-PR (Practical)' });

  //       setDynamicTools({ Internal: internal, External: external });

  //       // Auto-select first available tool if current is not valid
  //       const allPossible = [...internal, ...external].map(t => t.value);
  //       if (!allPossible.includes(selectedTool) && allPossible.length > 0) {
  //         setSelectedTool(allPossible[0]);
  //         setAssessmentType(internal.some(t => t.value === allPossible[0]) ? 'Internal' : 'External');
  //       }
  //     }
  //   }
  // }, [selectedCourse, courses]); // REMOVED

  // const toolOptions = dynamicTools; // REMOVED

  useEffect(() => {
    fetchAcademicData();
  }, []);

  const fetchAcademicData = async () => {
    try {
      const [progRes, schemeRes, setupRes, allCourseRes] = await Promise.all([
        api.get('/academics/programs/'),
        api.get('/academics/schemes/list/'),
        api.get('/academics/academic-setup/'),
        api.get('/academics/courses/')
      ]);
      setPrograms(progRes.data);
      setSchemes(schemeRes.data);
      setAllCourses(allCourseRes.data);

      if (setupRes.data) {
        setAcademicYear(setupRes.data.academic_year);
        setSelectedYear(setupRes.data.academic_year);
        setSelectedScheme(setupRes.data.scheme_id);
        // Cache globally so other components can use semester_type
        localStorage.setItem('academicSetup', JSON.stringify(setupRes.data));
        // Set semester based on current class + admin's semester_type
        setSelectedSemester(getDefaultSemester('FY', setupRes.data.semester_type || 'Odd'));
      }
      if (progRes.data.length > 0) {
        const user = JSON.parse(localStorage.getItem('user'));
        const userDept = user?.department_id || user?.department;

        // Try numeric match first
        let matched = progRes.data.find(p => p.program_id === parseInt(userDept));
        // Fallback to name match if department was stored as name string
        if (!matched && typeof userDept === 'string') {
          matched = progRes.data.find(p => p.program_name.toLowerCase() === userDept.toLowerCase());
        }

        if (matched) {
          setSelectedProgram(matched.program_id);
        } else if (progRes.data.length > 0) {
          setSelectedProgram(progRes.data[0].program_id);
        }
      }
    } catch (error) {
      console.error("Error fetching initial academic data:", error);
    }
  };

  // Consolidate initial data fetching to avoid race conditions
  useEffect(() => {
    if (selectedProgram) {
      const loadInitialData = async () => {
        setStudentsLoading(true);
        try {
          // Fetch courses and students in parallel
          await Promise.all([
            fetchCourses(),
            fetchStudents()
          ]);
        } catch (error) {
          console.error("Initial load error:", error);
        } finally {
          setStudentsLoading(false);
        }
      };
      loadInitialData();
    }
  }, [selectedProgram, selectedScheme, selectedClass, selectedSemester, selectedDivision]);

  // Auto-update semester when class changes based on admin semester_type
  useEffect(() => {
    const semType = getCachedSemesterType();
    setSelectedSemester(getDefaultSemester(selectedClass, semType));
  }, [selectedClass]);

  const formatCO = (coNumber) => {
    if (!coNumber) return 'CO';
    if (typeof coNumber !== 'string') return `CO${coNumber}`;
    // If it already has a dot or a prefix like CO301.1, return as is
    if (coNumber.includes('.') || /^[A-Z]+\d+/.test(coNumber)) return coNumber;

    const course = allCourses.find(c => c.course_id === parseInt(selectedCourse));
    const prefix = course?.course_abbr || 'CO';
    // If coNumber is just a digit like "1", return "CO301.1"
    const match = coNumber.match(/\d+/);
    if (match) return `${prefix}.${match[0]}`;
    return coNumber;
  };

  const fetchStudents = async () => {
    if (!selectedProgram) return;
    try {
      const params = {
        program_id: selectedProgram,
        class_year: selectedClass,
        semester: selectedSemester,
        division: selectedDivision,
        is_active: true
      };
      let response = await api.get('/users/students/', { params });

      // Fallback: If no students found with the strict semester filter, try without it
      if (response.data.length === 0) {
        console.warn(`No students found for Semester ${selectedSemester}. Retrying without semester filter.`);
        const fallbackParams = { ...params };
        delete fallbackParams.semester;
        response = await api.get('/users/students/', { params: fallbackParams });
      }

      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!selectedCourse) return;
      try {
        const response = await api.get(`/academics/courses/${selectedCourse}/`);
        setAssessmentTools(response.data.assessment_tools || {});
      } catch (error) {
        console.error("Error fetching course details:", error);
      }
    };
    fetchCourseDetails();
    fetchCoCount();
  }, [selectedCourse]);

  const getFilteredTools = (type) => {
    return Object.entries(assessmentTools)
      .filter(([tool, config]) => config.selected && config.type === type)
      .flatMap(([tool, config]) => {
        if (tool === 'FA-TH') {
          return [
            { value: 'FA-TH-CT1', label: 'Class Test 1 (FA-TH)' },
            { value: 'FA-TH-CT2', label: 'Class Test 2 (FA-TH)' }
          ];
        }
        if (tool === 'SLA') {
          return [
            { value: 'SLA', label: 'SLA' }
          ];
        }
        if (tool === 'FA-PR') {
          return [{ value: 'FA-PR', label: 'FA-PR (K3)' }];
        }
        return [{ value: tool, label: tool }];
      });
  };

  const internalTools = getFilteredTools('Internal');
  const externalTools = getFilteredTools('External');

  const toolOptions = {
    Internal: internalTools,
    External: externalTools
  };

  // Safe check for selected tool validity when switching types
  useEffect(() => {
    const currentOptions = toolOptions[assessmentType];
    if (currentOptions.length > 0 && !currentOptions.find(opt => opt.value === selectedTool)) {
      setSelectedTool(currentOptions[0].value);
    } else if (currentOptions.length === 0) {
      setSelectedTool('');
    }
  }, [assessmentType, assessmentTools]);


  const getSemesterOptions = () => {
    return computeSemesterOptions(selectedClass);
  };

  const fetchCourses = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const role = user?.role?.toUpperCase();

      let endpoint = '/academics/courses/';
      const params = {
        program_id: selectedProgram,
        scheme_id: selectedScheme,
        class_year: selectedClass,
        semester: selectedSemester
      };

      if (role === 'FACULTY') {
        endpoint = `/academics/my-courses/`;
      }

      setCoursesLoading(true);
      const response = await api.get(endpoint, { params });

      // The backend now handles filtering, but we keep the client-side fallback just in case
      let filtered = response.data;
      if (role !== 'FACULTY') {
        if (selectedSemester) filtered = filtered.filter(c => c.semester === parseInt(selectedSemester));
        if (selectedClass) filtered = filtered.filter(c => c.class_year === selectedClass);
      }

      setCourses(filtered);
      setCoursesLoading(false);
      // Removed auto-selection of course to allow list view
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCoursesLoading(false);
    }
  };

  const fetchCoCount = async () => {
    try {
      if (!selectedCourse) return;
      const response = await api.get(`/academics/courses/${selectedCourse}/cos/`);
      if (response.data && response.data.length > 0) {
        setCourseOutcomes(response.data);
        setCoCount(response.data.length);
      } else {
        setCourseOutcomes([]);
        setCoCount(5); // Default to 5 for sample data
      }
    } catch (error) {
      console.error("Error fetching COs:", error);
      setCourseOutcomes([]);
      setCoCount(5); // Default to 5 for sample data or error
    }
  };

  useEffect(() => {
    if (selectedCourse && selectedTool) {
      loadSavedData();
    }
  }, [selectedCourse, selectedTool]);

  const loadSavedData = async () => {
    // Always calculate max marks from course configuration (not from localStorage)
    let configMax = 0;
    let toolKey = selectedTool;
    if (selectedTool.startsWith('FA-TH')) toolKey = 'FA-TH';
    if (assessmentTools && assessmentTools[toolKey] && assessmentTools[toolKey].maxMarks) {
      configMax = parseInt(assessmentTools[toolKey].maxMarks, 10);
    }
    if (selectedTool === 'FA-PR') {
      setColumnCount(30);
      setTotalMaxMarks(configMax || 25);
    } else if (selectedTool.startsWith('SLA')) {
      setColumnCount(4);
      setTotalMaxMarks(configMax || 20);
    } else if (selectedTool === 'SA-TH' || selectedTool === 'SA-PR') {
      setColumnCount(1);
      setTotalMaxMarks(configMax || 10);
    } else if (selectedTool.startsWith('FA-TH')) {
      setColumnCount(14);
      setTotalMaxMarks(configMax || 30);
    } else {
      setColumnCount(14);
      setTotalMaxMarks(configMax || 30);
    }

    try {
      const params = { course_id: selectedCourse, tool_name: selectedTool };
      const res = await api.get('/assessments/marks/', { params });

      if (res.data && res.data.assessment_id) {
        const config = res.data.configuration || {};

        // Prioritize backend data if it exists
        if (config.userCos) setUserCos(config.userCos);
        if (config.customQuestions) setCustomQuestions(config.customQuestions);
        if (config.customWeights) setCustomWeights(config.customWeights);
        if (config.columnCount) setColumnCount(config.columnCount);

        // Detailed marks breakdown if stored in config
        if (config.marksData) {
          setMarksData(config.marksData);
          setViewMode('view');
          return; // Exit early as we have backend data
        }
      }
    } catch (err) {
      console.error("Backend fetch error:", err);
    }

    const data = localStorage.getItem(`cis_entry_${selectedCourse}_${selectedTool}`);
    if (data) {
      const parsed = JSON.parse(data);
      setMarksData(parsed.marksData || {});
      setCustomQuestions(parsed.customQuestions || new Array(30).fill(''));
      setCustomWeights(new Array(30).fill('')); // Always clear — weights come from config
      setUserCos(parsed.userCos || new Array(30).fill(''));
      if (parsed.columnCount) setColumnCount(parsed.columnCount);
      // NOTE: intentionally NOT restoring totalMaxMarks from storage — it must come from config
      if (parsed.uploadedFiles) {
        setUploadedFiles(prev => ({
          ...prev,
          [selectedTool]: parsed.uploadedFiles
        }));
      }

      // Check if there's actual marks data to determine view mode
      const hasData = (parsed.marksData && Object.keys(parsed.marksData).length > 0) ||
        (parsed.uploadedFiles && parsed.uploadedFiles.length > 0);
      setViewMode(hasData ? 'view' : 'entry');
    } else {
      setMarksData({});
      setCustomQuestions(new Array(30).fill(''));
      setCustomWeights(new Array(30).fill(''));
      setUserCos(new Array(30).fill(''));
      setViewMode('entry');
    }
  };

  // Handle assessment type change
  const handleAssessmentTypeChange = (type) => {
    setAssessmentType(type);
    const tools = toolOptions[type];
    if (tools && tools.length > 0) {
      setSelectedTool(tools[0].value);
    } else {
      setSelectedTool(''); // Reset or handle empty case
    }
  };

  const addColumn = () => {
    if (columnCount < 60) setColumnCount(prev => prev + 1);
  };

  const removeColumn = () => {
    if (columnCount > 1) setColumnCount(prev => prev - 1);
  };

  const handleCourseClick = (courseId) => {
    const course = allCourses.find(c => c.course_id === courseId);
    if (course) {
      if (course.program_id) setSelectedProgram(course.program_id);
      if (course.scheme_id) setSelectedScheme(course.scheme_id);
      if (course.class_year) setSelectedClass(course.class_year);
      if (course.semester) setSelectedSemester(course.semester.toString());
      // academic year is usually global but we could set it if stored
    }
    setSelectedCourse(courseId);
    setSearchTerm('');
  };

  const handleMarkChange = (enrollment, qIndex, value) => {
    // numeric only check (decimal allowed)
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) return;

    // Weight validation
    if (value !== '') {
      const numValue = parseFloat(value);
      const maxWeight = parseFloat(weights[qIndex]);
      if (numValue > maxWeight) {
        alert(`Entered marks (${numValue}) cannot exceed question weight (${maxWeight})`);
        return;
      }
    }

    setMarksData(prev => {
      const studentMarks = { ...(prev[enrollment] || {}) };
      studentMarks[qIndex] = value;

      // Calculate row total
      let total = 0;
      if (selectedTool.startsWith('FA-TH')) {
        // Best 5 of 7 Logic for Q1 (0-6) and Q2 (7-13)
        const getBest5Sum = (start, end) => {
          const vals = [];
          for (let i = start; i <= end; i++) {
            const v = parseFloat(studentMarks[i]);
            if (!isNaN(v)) vals.push(v);
          }
          vals.sort((a, b) => b - a);
          // Sum top 5
          return vals.slice(0, 5).reduce((a, c) => a + c, 0);
        };
        total = getBest5Sum(0, 6) + getBest5Sum(7, 13);
      } else if (selectedTool === 'FA-PR' || selectedTool.startsWith('SLA')) {
        // Normalization: Average (Sum / total number of columns)
        let sum = 0;
        for (let i = 0; i < columnCount; i++) {
          const mark = studentMarks[i];
          if (mark && !isNaN(parseFloat(mark))) {
            sum += parseFloat(mark);
          }
        }
        total = columnCount > 0 ? sum / columnCount : 0;
        // Round to 2 decimal places
        total = Math.round(total * 100) / 100;
      } else {
        // Standard Sum
        for (let i = 0; i < columnCount; i++) {
          const mark = studentMarks[i];
          if (mark && !isNaN(parseFloat(mark))) {
            total += parseFloat(mark);
          }
        }
      }
      studentMarks['total'] = total === 0 ? '' : total.toString();

      return {
        ...prev,
        [enrollment]: studentMarks
      };
    });
    // Removed auto-save: data is saved only when user explicitly clicks Save
  };

  const handleCoChange = (index, value) => {
    if (viewMode === 'view') return;

    if (value === '') {
      const newCos = [...userCos];
      newCos[index] = '';
      setUserCos(newCos);
      return;
    }

    // Integer check and range check
    if (!/^\d+$/.test(value)) return;
    const num = parseInt(value);

    if (num === 0) return; // No zero

    if (num > coCount) {
      alert(`Invalid CO! This subject has only ${coCount} CO statements.`);
      return;
    }

    const newCos = [...userCos];
    newCos[index] = value;
    setUserCos(newCos);
  };

  const getSLAColumnStats = () => {
    const colCount = columnCount || 1;
    const stats = [];
    for (let col = 0; col < colCount; col++) {
      let sum = 0;
      let appearedCount = 0;
      let marks = [];
      students.forEach(student => {
        const val = marksData[student.enrollment_no]?.[col];
        if (val !== undefined && val !== '' && val !== null) {
          const numericVal = parseFloat(val);
          if (!isNaN(numericVal)) {
            sum += numericVal;
            appearedCount++;
            marks.push(numericVal);
          }
        }
      });
      const average = appearedCount > 0 ? sum / appearedCount : 0;
      const aboveAvgCount = marks.filter(m => m >= average).length;
      const percentAboveAvg = appearedCount > 0 ? (aboveAvgCount / appearedCount) * 100 : 0;
      const coAttainment = (percentAboveAvg / 100) * 3;
      stats.push({
        average: average.toFixed(2),
        aboveAvgCount,
        appearedCount,
        absentCount: students.length - appearedCount,
        percentAboveAvg: percentAboveAvg.toFixed(2),
        coAttainment: coAttainment.toFixed(2)
      });
    }
    return stats;
  };

  const handleWeightChange = (colIndex, value) => {
    // numeric only check (decimal allowed)
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) return;

    const newWs = [...customWeights];
    newWs[colIndex] = value;
    setCustomWeights(newWs);
    // No auto-save: user must click Save explicitly
  };

  const handleKeyDown = (e, type, rowIndex, colIndex) => {
    const key = e.key;
    let nextRow = rowIndex;
    let nextCol = colIndex;
    let nextType = type;
    const isFaPr = selectedTool === 'FA-PR';
    const isSAButNotCT = selectedTool.startsWith('SA') || selectedTool === 'SLA';

    if (key === 'ArrowUp') {
      if (type === 'mark') {
        if (rowIndex > 0) nextRow = rowIndex - 1;
        else nextType = 'co';
      } else if (type === 'co') {
        nextType = isFaPr ? 'q' : 'wt';
      } else if (type === 'wt') nextType = 'q';
    } else if (key === 'ArrowDown') {
      if (type === 'q') {
        nextType = isFaPr ? 'co' : 'wt';
      } else if (type === 'wt') nextType = 'co';
      else if (type === 'co') {
        nextType = 'mark';
        nextRow = 0;
      } else if (type === 'mark' && rowIndex < students.length - 1) {
        nextRow = rowIndex + 1;
      }
    } else if (key === 'ArrowLeft') {
      if (colIndex > 0) nextCol = colIndex - 1;
    } else if (key === 'ArrowRight') {
      if (colIndex < questions.length - 1) nextCol = colIndex + 1;
    } else {
      return;
    }

    e.preventDefault();
    const selector = `[data-type="${nextType}"][data-row="${nextRow}"][data-col="${nextCol}"]`;
    const nextInput = document.querySelector(selector);
    if (nextInput) nextInput.focus();
  };

  const saveData = async (showAlert = false) => {
    // Calculation and storage logic
    const getAttainmentLevel = (percent) => {
      if (percent >= 80) return 3.00;
      if (percent >= 76) return 2.75;
      if (percent >= 71) return 2.50;
      if (percent >= 66) return 2.25;
      if (percent >= 61) return 2.00;
      if (percent >= 56) return 1.75;
      if (percent >= 51) return 1.50;
      if (percent >= 46) return 1.25;
      if (percent >= 20) return 1.00;
      return 0.00;
    };

    const stats = calculateAttainmentStats();
    const attainment = Object.entries(stats.coStats).map(([coId, data]) => {
      const percent = data.appeared > 0 ? (data.success / data.appeared) * 100 : 0;
      return {
        co_id: coId,
        percent: percent.toFixed(2),
        level: getAttainmentLevel(percent)
      };
    });

    const dataToSave = {
      selectedProgram,
      selectedSemester,
      selectedCourse,
      selectedTool,
      columnCount,
      totalMaxMarks,
      customQuestions,
      customWeights,
      userCos,
      marksData,
      attainment,
      uploadedFiles: uploadedFiles[selectedTool] || []
    };

    // Validation 1: Check for marks without CO
    for (let c = 0; c < columnCount; c++) {
      let hasMark = false;
      for (const s of students) {
        const m = marksData[s.enrollment_no]?.[c];
        if (m !== undefined && m !== '' && m !== null) {
          hasMark = true;
          break;
        }
      }

      // SA tools (SA-TH, SA-PR) have no CO row in their UI — skip CO check for them
      const isSA = selectedTool.startsWith('SA');
      if (hasMark && !userCos[c] && !isSA) {
        alert(`Error: Column ${c + 1} has marks but no CO assigned. Please assign a CO to every column before saving.`);
        return false; // Return false to indicate failure
      }
    }

    // Validation 2: Check that student totals don't exceed max marks from Course Management
    if (totalMaxMarks) {
      for (const s of students) {
        const total = parseFloat(marksData[s.enrollment_no]?.['total']);
        if (!isNaN(total) && total > totalMaxMarks) {
          alert(`Error: ${s.name}'s total marks (${total}) exceed the maximum allowed (${totalMaxMarks}). Please check the marks.`);
          return false;
        }
      }
    }

    try {
      const payload = {
        course_id: selectedCourse,
        academic_year: selectedYear,
        tool_type: selectedTool.split('-')[0] + (selectedTool.includes('TH') ? '_TH' : selectedTool.includes('PR') ? '_PR' : ''),
        tool_name: selectedTool,
        max_marks: totalMaxMarks,
        marks_data: Object.entries(marksData).filter(([enroll, data]) => enroll !== 'total').map(([enrollment, data]) => {
          // Flatten marks data for backend (this assumes question index 0 if it's SA)
          // For multi-column, we might need a better format or the backend handles configuration
          // Let's send the first column as marks for now if it's SA, or the total
          const marksValue = data.total || data[0] || 0;
          return { enrollment_no: enrollment, marks: marksValue };
        }),
        co_mappings: slicedUserCos.map((co, idx) => ({ co_id: (co || '').toString().trim(), weight: weights[idx] })).filter(m => m.co_id),
        configuration: {
          columnCount,
          customQuestions,
          customWeights,
          userCos,
          marksData, // Include full breakdown for CT/PR tools
          toolKey: selectedTool
        },
        semester: parseInt(selectedSemester)
      };

      // Correct tool_type logic
      let backendToolType = 'FA_TH';
      if (selectedTool.startsWith('FA-TH')) backendToolType = 'FA_TH';
      else if (selectedTool === 'FA-PR') backendToolType = 'FA_PR';
      else if (selectedTool === 'SLA') backendToolType = 'SLA';
      else if (selectedTool === 'SA-TH') backendToolType = 'SA_TH';
      else if (selectedTool === 'SA-PR') backendToolType = 'SA_PR';
      else if (selectedTool === 'CES') backendToolType = 'CES';

      payload.tool_type = backendToolType;

      await api.post('/assessments/marks/', payload);

      localStorage.setItem(`cis_entry_${selectedCourse}_${selectedTool}`, JSON.stringify(dataToSave));
      if (showAlert) alert('Marks saved to database and attainment recalculated!');
      return true; // Indicate success
    } catch (e) {
      console.error("Save Error:", e);
      alert('An error occurred while saving data: ' + (e.response?.data?.error || e.message));
      return false;
    }
  };

  const handleSave = async () => {
    const success = await saveData(true);
    if (success) {
      setViewMode('view');
    }
  };

  const handleEdit = () => {
    setViewMode('edit');
  };

  const isMarkExcluded = (enrollment, colIndex) => {
    if (!selectedTool.startsWith('FA-TH') || columnCount !== 14) return false;
    const sMarks = marksData[enrollment] || {};
    const val = parseFloat(sMarks[colIndex]);
    if (isNaN(val)) return false;

    let start = 0, end = 6;
    if (colIndex > 6 && colIndex <= 13) { start = 7; end = 13; }
    else if (colIndex > 13) return false;

    const groupMarks = [];
    for (let i = start; i <= end; i++) {
      const v = parseFloat(sMarks[i]);
      if (!isNaN(v)) groupMarks.push({ i, v });
    }
    groupMarks.sort((a, b) => b.v - a.v);

    // Included are top 5
    const included = groupMarks.slice(0, 5).map(m => m.i);
    return !included.includes(colIndex);
  };

  const renderTableHeaders = (toolTitle) => {
    const isSLA = selectedTool.startsWith('SLA');
    const isSATH = selectedTool === 'SA-TH';

    if (isSATH || selectedTool === 'SA-PR') {
      const headerLabel = isSATH ? 'Theory Marks (SA-TH)' : 'Practical Marks (SA-PR)';
      return (
        <thead>
          <tr>
            <th className="student-col-header fw-bold bg-light" style={{ width: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderBottom: '2px solid #dee2e6' }}>Enrollment No.</th>
            <th className="student-col-header fw-bold bg-light" style={{ width: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderBottom: '2px solid #dee2e6' }}>Roll No.</th>
            <th className="student-col-header fw-bold bg-light" style={{ width: 'auto', minWidth: '250px', verticalAlign: 'middle', borderBottom: '2px solid #dee2e6' }}>Name of Student</th>
            <th className="fw-bold text-white text-center blue-header-dark" style={{ width: '200px', verticalAlign: 'middle' }}>
              Total Marks {totalMaxMarks ? `(out of ${totalMaxMarks})` : ''}
            </th>
          </tr>
        </thead>
      );
    }

    if (selectedTool === 'FA-PR') {
      return (
        <thead>
          {/* Row 1: Student info and Practical Numbers */}
          <tr>
            <th rowSpan="3" className="student-col-header fw-bold bg-light" style={{ width: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderBottom: '2px solid #dee2e6' }}>Enrollment No.</th>
            <th rowSpan="3" className="student-col-header fw-bold bg-light" style={{ width: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderBottom: '2px solid #dee2e6' }}>Roll No.</th>
            <th rowSpan="3" className="student-col-header fw-bold bg-light" style={{ width: 'auto', minWidth: '250px', verticalAlign: 'middle', borderBottom: '2px solid #dee2e6' }}>Name of Student</th>

            <th className="label-col-cell text-white text-center fw-bold" style={{ verticalAlign: 'middle', backgroundColor: '#2f5597' }}>
              Practical No.
            </th>

            {questions.map((q, index) => (
              <th key={index} className="fw-bold p-0 blue-header-light" style={{ width: 'auto', minWidth: '80px' }}>
                <input
                  type="text"
                  className="header-input-transparent shadow-none"
                  value={customQuestions[index]}
                  placeholder={defaultQuestions[index]}
                  style={{ padding: '8px 2px', cursor: viewMode === 'view' ? 'default' : 'text' }}
                  readOnly={viewMode === 'view'}
                  data-type="q"
                  data-row="0"
                  data-col={index}
                  onChange={viewMode === 'view' ? undefined : (e) => {
                    const newQs = [...customQuestions];
                    newQs[index] = e.target.value;
                    setCustomQuestions(newQs);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, 'q', 0, index)}
                />
              </th>
            ))}

            <th className="bg-light" style={{ width: '20px', verticalAlign: 'middle', borderLeft: '1px solid #dee2e6' }} rowSpan="3"></th>
            <th className="fw-bold text-white blue-header-dark" style={{ width: 'auto', minWidth: '120px', verticalAlign: 'middle' }} rowSpan="3">
              FA-PR Marks {totalMaxMarks ? `(out of ${totalMaxMarks})` : ''}
            </th>
          </tr>

          {/* Row 2: Max Marks (Weights) */}
          <tr>
            <th className="label-col-cell text-white text-center fw-bold" style={{ verticalAlign: 'middle', backgroundColor: '#2f5597' }}>Max Marks</th>
            {weights.map((w, index) => (
              <th key={index} className="fw-bold p-0 blue-header-dark">
                <input
                  type="text"
                  className="header-input-transparent shadow-none text-white"
                  value={customWeights[index]}
                  placeholder={defaultWeights[index]}
                  style={{ padding: '8px 2px', cursor: viewMode === 'view' ? 'default' : 'text' }}
                  readOnly={viewMode === 'view'}
                  data-type="wt"
                  data-row="0"
                  data-col={index}
                  onChange={viewMode === 'view' ? undefined : (e) => handleWeightChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'wt', 0, index)}
                />
              </th>
            ))}
          </tr>

          {/* Row 3: Course Outcomes */}
          <tr>
            <th className="label-col-cell text-white text-center fw-bold" style={{ verticalAlign: 'middle', backgroundColor: '#2f5597' }}>Course Outcome</th>
            {slicedUserCos.map((co, index) => (
              <th key={index} className="fw-bold p-0 blue-header-medium">
                <input
                  type="text"
                  className="header-input-transparent shadow-none"
                  value={co}
                  placeholder={sampleCOs[index % sampleCOs.length]}
                  style={{ padding: '8px 2px', cursor: viewMode === 'view' ? 'default' : 'text' }}
                  readOnly={viewMode === 'view'}
                  data-type="co"
                  data-row="0"
                  data-col={index}
                  onChange={(e) => handleCoChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'co', 0, index)}
                />
              </th>
            ))}
          </tr>
        </thead>
      );
    }

    if (selectedTool.startsWith('SLA')) {
      return (
        <thead>
          {/* Row 1: Student info and Assignment Numbers */}
          <tr>
            <th rowSpan="3" className="student-col-header fw-bold bg-light" style={{ width: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderBottom: '2px solid #dee2e6' }}>Enrollment No.</th>
            <th rowSpan="3" className="student-col-header fw-bold bg-light" style={{ width: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', borderBottom: '2px solid #dee2e6' }}>Roll No.</th>
            <th rowSpan="3" className="student-col-header fw-bold bg-light" style={{ width: 'auto', minWidth: '250px', verticalAlign: 'middle', borderBottom: '2px solid #dee2e6' }}>Name of Student</th>

            <th className="label-col-cell text-white text-center fw-bold" style={{ verticalAlign: 'middle', backgroundColor: '#2f5597' }}>
              Assignment
            </th>

            {questions.map((q, index) => (
              <th key={index} className="fw-bold p-0 blue-header-light" style={{ width: 'auto', minWidth: '80px' }}>
                <input
                  type="text"
                  className="header-input-transparent shadow-none"
                  value={customQuestions[index]}
                  placeholder={defaultQuestions[index]}
                  style={{ padding: '8px 2px', cursor: viewMode === 'view' ? 'default' : 'text' }}
                  readOnly={viewMode === 'view'}
                  data-type="q"
                  data-row="0"
                  data-col={index}
                  onChange={viewMode === 'view' ? undefined : (e) => {
                    const newQs = [...customQuestions];
                    newQs[index] = e.target.value;
                    setCustomQuestions(newQs);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, 'q', 0, index)}
                />
              </th>
            ))}

            <th className="bg-light" style={{ width: '20px', verticalAlign: 'middle', borderLeft: '1px solid #dee2e6' }} rowSpan="3"></th>
            <th className="fw-bold text-white blue-header-dark" style={{ width: 'auto', minWidth: '120px', verticalAlign: 'middle' }} rowSpan="3">
              Total Marks {totalMaxMarks ? `(out of ${totalMaxMarks})` : ''}
            </th>
          </tr>

          {/* Row 2: Max Marks (Weights) */}
          <tr>
            <th className="label-col-cell text-white text-center fw-bold" style={{ verticalAlign: 'middle', backgroundColor: '#2f5597' }}>Max Marks</th>
            {weights.map((w, index) => (
              <th key={index} className="fw-bold p-0 blue-header-dark">
                <input
                  type="text"
                  className="header-input-transparent shadow-none text-white"
                  value={customWeights[index]}
                  placeholder={defaultWeights[index]}
                  style={{ padding: '8px 2px', cursor: viewMode === 'view' ? 'default' : 'text' }}
                  readOnly={viewMode === 'view'}
                  data-type="wt"
                  data-row="0"
                  data-col={index}
                  onChange={viewMode === 'view' ? undefined : (e) => handleWeightChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'wt', 0, index)}
                />
              </th>
            ))}
          </tr>

          {/* Row 3: Course Outcomes */}
          <tr>
            <th className="label-col-cell text-white text-center fw-bold" style={{ verticalAlign: 'middle', backgroundColor: '#2f5597' }}>CO</th>
            {slicedUserCos.map((co, index) => (
              <th key={index} className="fw-bold p-0 blue-header-medium">
                <input
                  type="text"
                  className="header-input-transparent shadow-none"
                  value={co}
                  placeholder={sampleCOs[index % sampleCOs.length]}
                  style={{ padding: '8px 2px', cursor: viewMode === 'view' ? 'default' : 'text' }}
                  readOnly={viewMode === 'view'}
                  data-type="co"
                  data-row="0"
                  data-col={index}
                  onChange={(e) => handleCoChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'co', 0, index)}
                />
              </th>
            ))}
          </tr>
        </thead>
      );
    }

    const headerInfoBg = '#e7e6e6';

    return (
      <thead>
        {/* Row 1: Student info and Questions */}
        <tr>
          <th rowSpan="3" className="student-col-header fw-bold" style={{ width: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', backgroundColor: headerInfoBg }}>Enrollment No.</th>
          <th rowSpan="3" className="student-col-header fw-bold" style={{ width: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', backgroundColor: headerInfoBg }}>Roll No.</th>
          <th rowSpan="3" className="student-col-header fw-bold" style={{ width: 'auto', minWidth: '250px', verticalAlign: 'middle', backgroundColor: headerInfoBg }}>Name of Student</th>

          <th className="label-col-cell text-white text-center fw-bold" style={{ verticalAlign: 'middle', backgroundColor: '#2f5597' }}>
            {selectedTool === 'FA-PR' ? 'Practical No.' : 'Q'}
          </th>

          {questions.map((q, index) => (
            <th key={index} className="fw-bold p-0 blue-header-light" style={{ width: 'auto', minWidth: '80px' }}>
              <input
                type="text"
                className="header-input-transparent shadow-none"
                value={customQuestions[index]}
                placeholder={defaultQuestions[index]}
                style={{ padding: '8px 2px', cursor: viewMode === 'view' ? 'default' : 'text' }}
                readOnly={viewMode === 'view'}
                onChange={viewMode === 'view' ? undefined : (e) => {
                  const newQs = [...customQuestions];
                  newQs[index] = e.target.value;
                  setCustomQuestions(newQs);
                }}
              />
            </th>
          ))}

          <th className="bg-light" style={{ width: '20px', verticalAlign: 'middle', borderLeft: '1px solid #dee2e6' }} rowSpan="3"></th>
          <th className="fw-bold text-white blue-header-dark" style={{ width: 'auto', minWidth: '120px', verticalAlign: 'middle' }} rowSpan="3">
            FA-TH Marks {totalMaxMarks ? `(out of ${totalMaxMarks})` : ''}
          </th>
        </tr>

        {/* Row 2: Weights */}
        <tr>
          <th className="label-col-cell text-white text-center fw-bold" style={{ verticalAlign: 'middle', backgroundColor: '#2f5597' }}>Wt</th>
          {weights.map((w, index) => (
            <th key={index} className="fw-bold p-0 blue-header-dark">
              <input
                type="text"
                className="header-input-transparent shadow-none text-white"
                value={customWeights[index]}
                placeholder={defaultWeights[index]}
                style={{ padding: '8px 2px', cursor: viewMode === 'view' ? 'default' : 'text' }}
                readOnly={viewMode === 'view'}
                onChange={viewMode === 'view' ? undefined : (e) => handleWeightChange(index, e.target.value)}
              />
            </th>
          ))}
        </tr>

        {/* Row 3: COs */}
        <tr>
          <th className="label-col-cell text-white text-center fw-bold" style={{ verticalAlign: 'middle', backgroundColor: '#2f5597' }}>CO</th>
          {slicedUserCos.map((co, index) => (
            <th key={index} className="fw-bold p-0 blue-header-medium">
              <input
                type="text"
                className="header-input-transparent shadow-none"
                value={co}
                placeholder={sampleCOs[index % sampleCOs.length]}
                style={{ padding: '8px 2px', cursor: viewMode === 'view' ? 'default' : 'text' }}
                readOnly={viewMode === 'view'}
                onChange={(e) => handleCoChange(index, e.target.value)}
              />
            </th>
          ))}
        </tr>
      </thead>
    );
  };
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const openBase64InNewTab = (base64Data, filename) => {
    try {
      // Decode base64
      const parts = base64Data.split(';base64,');
      const contentType = parts[0].split(':')[1];
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);

      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }

      const blob = new Blob([uInt8Array], { type: contentType });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error("Error opening PDF:", error);
      // Fallback to direct open if blob fails
      window.open(base64Data, '_blank');
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);

    // Limits
    const MAX_FILES = 2;
    const MAX_SIZE_MB = 5;
    const currentFiles = uploadedFiles[selectedTool] || [];

    if (currentFiles.length + files.length > MAX_FILES) {
      alert(`You can upload a maximum of ${MAX_FILES} files.`);
      return;
    }

    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    if (files.length !== pdfFiles.length) {
      alert("Only PDF files are allowed.");
    }

    const validFiles = pdfFiles.filter(file => {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the ${MAX_SIZE_MB}MB limit.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const readers = validFiles.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            resolve({
              name: file.name,
              size: file.size,
              content: ev.target.result // Store Base64 content
            });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then(newFiles => {
        setUploadedFiles(prev => ({
          ...prev,
          [selectedTool]: [
            ...(prev[selectedTool] || []),
            ...newFiles
          ]
        }));
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (tool, index) => {
    setUploadedFiles(prev => ({
      ...prev,
      [tool]: prev[tool].filter((_, i) => i !== index)
    }));
  };

  const renderActionFooter = (uploadMsg) => {
    // View mode: show evidence and Edit button
    if (viewMode === 'view') {
      return (
        <>
          {/* Evidence Section in View Mode */}
          {uploadedFiles[selectedTool] && uploadedFiles[selectedTool].length > 0 && (
            <div className="mt-4 pt-4 border-top">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-primary" style={{ fontSize: '1.2rem' }}>
                <FaPaperclip /> Assessment Evidence
              </h5>
              <div className="d-flex flex-wrap gap-3">
                {uploadedFiles[selectedTool].map((file, idx) => (
                  <div key={idx} className="file-tag d-flex align-items-center gap-3 bg-white border rounded shadow-sm p-3" style={{ minWidth: '250px' }}>
                    <FaFilePdf className="text-danger fs-3" />
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="fw-bold text-dark text-truncate" title={file.name}>{file.name}</div>
                      <div className="text-muted small">{formatFileSize(file.size)}</div>
                    </div>
                    <button
                      className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                      onClick={() => {
                        const content = file.content;
                        if (content) {
                          openBase64InNewTab(content, file.name);
                        } else {
                          alert("File content not found.");
                        }
                      }}
                    >
                      <FaEye /> View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edit Button */}
          <div className="d-flex justify-content-center mt-4">
            <button
              className="btn btn-primary px-5 py-2 fs-5 fw-bold d-flex align-items-center gap-2"
              style={{ borderRadius: '8px' }}
              onClick={handleEdit}
            >
              <FaEdit /> Edit Data
            </button>
          </div>
        </>
      );
    }

    // Entry/Edit mode: show upload UI and Save button
    return (
      <>
        <div className="mt-4 pb-4 border-bottom">
          <p className="fw-medium text-muted small mb-3 text-left fs-6 italic">
            {uploadMsg || "Please upload 3-5 sample assessment records (e.g., answer sheets or marksheets) as supporting evidence."}
          </p>
          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-items-center gap-3">
              <input
                type="file"
                multiple
                accept=".pdf"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2"
                style={{ backgroundColor: '#4285f4', borderColor: '#4285f4' }}
                onClick={() => fileInputRef.current.click()}
              >
                <FaCloudUploadAlt /> Upload Evidence
              </button>
            </div>

            {uploadedFiles[selectedTool] && uploadedFiles[selectedTool].length > 0 && (
              <div className="uploaded-files-list mt-2">
                <p className="fw-bold small text-muted mb-2 text-uppercase" style={{ letterSpacing: '0.5px' }}>Attached Files:</p>
                <div className="d-flex flex-wrap gap-2">
                  {uploadedFiles[selectedTool].map((file, idx) => (
                    <div key={idx} className="file-tag d-flex align-items-center gap-2 bg-light border rounded px-2 py-1 shadow-sm" style={{ fontSize: '12px' }}>
                      <FaFilePdf className="text-danger" />
                      <span className="file-name text-truncate" style={{ maxWidth: '150px' }} title={file.name}>{file.name}</span>
                      <span className="file-size text-muted">({formatFileSize(file.size)})</span>
                      <button
                        className="btn btn-link p-0 text-danger hover-opacity"
                        onClick={() => removeFile(selectedTool, idx)}
                        style={{ textDecoration: 'none', lineHeight: 1, border: 'none' }}
                        title="Remove file"
                      >
                        <FaTimesCircle style={{ fontSize: '14px' }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="d-flex justify-content-center mt-4">
          <button className="btn btn-success px-5 py-2 fs-5 fw-bold" style={{ borderRadius: '8px' }} onClick={handleSave}>
            Save Data
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="p-4" style={{ backgroundColor: '#f0f8ff', minHeight: '100vh' }}>
      {/* Card 1: Localized Filters */}
      <div className="bg-white p-4 rounded shadow-sm mb-4">
        <div className="filters-section bg-light p-3 rounded shadow-sm" style={{ border: '1px solid #adcaf8' }}>
          <div className="row g-3 mb-3 text-start">
            <div className="col-md-3">
              <label className="form-label fw-bold small text-muted text-uppercase mb-1" style={{ letterSpacing: '0.5px' }}>Department</label>
              <select className="form-select border-primary-subtle" value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)}>
                {programs.map(p => <option key={p.program_id} value={p.program_id}>{p.program_name}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-bold small text-muted text-uppercase mb-1" style={{ letterSpacing: '0.5px' }}>Scheme</label>
              <select className="form-select border-primary-subtle" value={selectedScheme} onChange={(e) => setSelectedScheme(e.target.value)}>
                {schemes.map(s => <option key={s.scheme_id} value={s.scheme_id}>{s.scheme_name}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-bold small text-muted text-uppercase mb-1" style={{ letterSpacing: '0.5px' }}>Year</label>
              <select className="form-select border-primary-subtle" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                <option value={academicYear}>{academicYear}</option>
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-bold small text-muted text-uppercase mb-1" style={{ letterSpacing: '0.5px' }}>Class</label>
              <select
                className="form-select border-primary-subtle"
                value={selectedClass}
                onChange={(e) => {
                  const newClass = e.target.value;
                  setSelectedClass(newClass);
                  if (newClass === 'FY') setSelectedSemester('1');
                  else if (newClass === 'SY') setSelectedSemester('3');
                  else if (newClass === 'TY') setSelectedSemester('5');
                }}
              >
                <option value="FY">FY - {selectedDivision}</option>
                <option value="SY">SY - {selectedDivision}</option>
                <option value="TY">TY - {selectedDivision}</option>
              </select>
            </div>
            <div className="col-md-1">
              <label className="form-label fw-bold small text-muted text-uppercase mb-1" style={{ letterSpacing: '0.5px' }}>Div</label>
              <select className="form-select border-primary-subtle" value={selectedDivision} onChange={(e) => setSelectedDivision(e.target.value)}>
                {['A', 'B', 'C', 'D'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-bold small text-muted text-uppercase mb-1" style={{ letterSpacing: '0.5px' }}>Semester</label>
              <select className="form-select border-primary-subtle" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
                {getSemesterOptions().map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-12">
              <div className="search-container-v2 position-relative">
                <input
                  type="text"
                  placeholder="Search course by name or code..."
                  className="form-control border-primary-subtle py-2 ps-4 rounded-pill"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                />
                {searchTerm && (
                  <div className="search-results-overlay shadow border rounded mt-1 bg-white" style={{ position: 'absolute', zIndex: 1000, width: '100%', maxHeight: '300px', overflowY: 'auto' }}>
                    {allCourses
                      .filter(c =>
                        (c.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.course_code.toLowerCase().includes(searchTerm.toLowerCase())) &&
                        !['TEST101', 'CS101'].includes(c.course_code)
                      )
                      .slice(0, 10)
                      .map(c => (
                        <div
                          key={c.course_id}
                          className="p-3 border-bottom search-result-item hover-bg-light cursor-pointer text-start"
                          onClick={() => handleCourseClick(c.course_id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <span className="fw-bold text-primary">{c.course_code}</span> - {c.course_name}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {selectedCourse && (
          <div className="mt-4 p-3 rounded text-start" style={{ backgroundColor: '#f8fbff', border: '1px solid #adcaf8' }}>
            <h5 className="small fw-bold text-primary text-uppercase mb-3" style={{ letterSpacing: '1px' }}>Course Outcome (CO) Statements</h5>
            <div className="row g-3">
              {courseOutcomes.length > 0 ? (
                courseOutcomes.map((co, idx) => (
                  <div key={idx} className="col-md-12 d-flex gap-3">
                    <span className="badge rounded-pill bg-primary d-flex align-items-center justify-content-center" style={{ width: 'auto', minWidth: '80px', height: '28px', padding: '0 12px', fontSize: '13px' }}>
                      {formatCO(co.co_number)}
                    </span>
                    <p className="mb-0 small text-muted" style={{ lineHeight: '1.5' }}>{co.description}</p>
                  </div>
                ))
              ) : (
                <p className="small text-muted mb-0 ms-3">No Course Outcomes defined for this course.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {!selectedCourse ? (
        <div className="bg-white p-4 rounded shadow-sm">
          <h5 className="mb-4 fw-bold text-secondary border-bottom pb-2 text-start">Courses matching filters:</h5>
          <div className="table-responsive">
            <table className="table table-hover border align-middle">
              <thead className="table-light">
                <tr>
                  <th className="text-start ps-3">CODE</th>
                  <th className="text-start">NAME</th>
                  <th className="text-start">TITLE</th>
                  <th>ABBR.</th>
                  <th>SCHEME</th>
                  <th>CO STATUS</th>
                </tr>
              </thead>
              <tbody>
                {coursesLoading ? (
                  <tr><td colSpan="6" className="text-center py-5"><div className="spinner-border text-primary" role="status"></div><div className="mt-2 text-muted fw-bold">Loading courses...</div></td></tr>
                ) : courses.length > 0 ? (
                  courses.map(c => (
                    <tr
                      key={c.course_id}
                      onClick={() => handleCourseClick(c.course_id)}
                      className="cursor-pointer hover-bg-light"
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="fw-bold text-primary text-start ps-3">{c.course_code}</td>
                      <td className="text-start">{c.course_name}</td>
                      <td className="small text-start">{c.course_title}</td>
                      <td>{c.course_abbr}</td>
                      <td>{schemes.find(s => s.scheme_id === c.scheme_id)?.scheme_name || "-"}</td>
                      <td>
                        <span className={`badge ${c.co_status?.toLowerCase() === 'completed' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                          {c.co_status || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="text-center py-5 text-muted">No courses found matching selected filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* Card 2: Section Header & Tool Selection */}
          <div className="bg-white p-4 rounded shadow-sm mb-4">
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
              <div className="text-start">
                <h5 className="fw-bold m-0" style={{ color: '#1a237e' }}>
                  Course: <span className="text-primary">{allCourses.find(c => c.course_id === parseInt(selectedCourse))?.course_code} - {allCourses.find(c => c.course_id === parseInt(selectedCourse))?.course_name}</span>
                </h5>
                <p className="small text-muted mb-0">Select tool and enter marks below</p>
              </div>
              <button
                className="btn btn-outline-secondary btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm px-3"
                onClick={() => setSelectedCourse('')}
                style={{ borderRadius: '20px' }}
              >
                Back to Course List
              </button>
            </div>

            <h2 className="text-center mb-4 section-title" style={{ color: '#2c3e50', fontWeight: 'bold', fontSize: 26 }}>
              CIS Assessment - Marks Entry
            </h2>

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-4 bg-light p-3 rounded shadow-sm border">
              <div className="d-flex gap-2 bg-white p-1 rounded border shadow-sm">
                <button
                  className={`btn btn-sm px-4 py-2 fw-bold transition-all ${assessmentType === 'Internal' ? 'btn-primary shadow-sm' : 'btn-light text-muted border-0'}`}
                  onClick={() => handleAssessmentTypeChange('Internal')}
                  style={{ borderRadius: '5px' }}
                >
                  Internal
                </button>
                <button
                  className={`btn btn-sm px-4 py-2 fw-bold transition-all ${assessmentType === 'External' ? 'btn-primary shadow-sm' : 'btn-light text-muted border-0'}`}
                  onClick={() => handleAssessmentTypeChange('External')}
                  style={{ borderRadius: '5px' }}
                >
                  External
                </button>
              </div>

              <div className="d-flex align-items-end gap-3 text-start" style={{ width: '100%', maxWidth: '550px' }}>
                <div className="flex-grow-1">
                  <label className="form-label fw-bold mb-1 text-muted small text-uppercase" style={{ color: '#2c3e50', letterSpacing: '0.5px' }}>
                    Select Assessment Tool
                  </label>
                  <select
                    className="form-select shadow-sm"
                    value={selectedTool}
                    onChange={(e) => setSelectedTool(e.target.value)}
                    style={{ borderRadius: '6px', border: '1px solid #dee2e6' }}
                  >
                    {toolOptions[assessmentType].map(tool => (
                      <option key={tool.value} value={tool.value}>{tool.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  className="btn btn-outline-primary fw-bold d-flex align-items-center gap-2 shadow-sm"
                  style={{ height: '38px', whiteSpace: 'nowrap', borderRadius: '6px' }}
                >
                  <FaCloudUploadAlt /> Bulk Upload
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Table and Actions */}
          <div className="bg-white p-4 rounded shadow-sm">
            {(selectedTool === 'FA-TH-CT1' || selectedTool === 'FA-TH-CT2') && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="test-title text-start fs-5 fw-bold mb-0" style={{ color: '#2c3e50' }}>{selectedTool === 'FA-TH-CT1' ? 'Class Test 1 (FA-TH)' : 'Class Test 2 (FA-TH)'}</h4>
                  <div className="d-flex align-items-center gap-4 pe-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Max Total:</span>
                      <span className="fw-bold fs-5 px-2" title="Configured in Course Management">{totalMaxMarks}</span>
                    </div>
                    {viewMode !== 'view' && (
                      <div className="d-flex gap-2 align-items-center border-start ps-3">
                        <FaPlus
                          className="text-success cursor-pointer hover-opacity"
                          onClick={addColumn}
                          style={{ fontSize: '1.2rem', transition: 'transform 0.2s' }}
                          title="Add Column"
                        />
                        <FaMinus
                          className="text-danger cursor-pointer hover-opacity"
                          onClick={removeColumn}
                          style={{ fontSize: '1.2rem', transition: 'transform 0.2s' }}
                          title="Remove Column"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="table-responsive cis-table-container">
                  <table className="table table-bordered cis-table text-center align-middle mb-0">
                    {renderTableHeaders(selectedTool)}
                    <tbody>
                      {students.map((student, rowIndex) => (
                        <tr key={rowIndex}>
                          <td className="bg-light">{student.enrollment_no}</td>
                          <td className="bg-light">{student.roll_no}</td>
                          <td className="text-start ps-3 bg-light">{student.name}</td>
                          <td className="blue-col-cell" style={{ backgroundColor: '#6c8ebf' }}></td>
                          {questions.map((_, colIndex) => (
                            <td key={colIndex} className="p-0">
                              {viewMode === 'view' ? (
                                <div className="p-2 text-center fw-bold" style={{ backgroundColor: isMarkExcluded(student.enrollment_no, colIndex) ? '#ffcccc' : 'transparent' }}>
                                  {marksData[student.enrollment_no]?.[colIndex] || '-'}
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  className="form-control border-0 text-center table-input shadow-none"
                                  style={{ borderRadius: 0, backgroundColor: isMarkExcluded(student.enrollment_no, colIndex) ? '#ffcccc' : 'transparent' }}
                                  value={marksData[student.enrollment_no]?.[colIndex] || ''}
                                  data-type="mark"
                                  data-row={rowIndex}
                                  data-col={colIndex}
                                  onKeyDown={(e) => handleKeyDown(e, 'mark', rowIndex, colIndex)}
                                  onChange={(e) => handleMarkChange(student.enrollment_no, colIndex, e.target.value)}
                                />
                              )}
                            </td>
                          ))}
                          <td className="bg-light"></td>
                          <td className="p-0" style={{ backgroundColor: '#f0f7ff' }}>
                            <input
                              type="text"
                              className="form-control border-0 text-center table-input shadow-none bg-transparent fw-bold"
                              style={{ borderRadius: 0 }}
                              value={marksData[student.enrollment_no]?.['total'] || ''}
                              readOnly
                            />
                          </td>
                        </tr>
                      ))}

                      {/* Attainment Footer */}
                      <tr className="bg-light">
                        <td colSpan="3" className="text-start ps-3 fw-bold small text-uppercase" style={{ backgroundColor: '#cfe2f3' }}>Number of students appeared</td>
                        <td className="label-col-cell" style={{ backgroundColor: '#cfe2f3' }}></td>
                        {attainmentStats.appeared.map((val, i) => (
                          <td key={i} className="fw-bold small" style={{ backgroundColor: '#e9f2fb' }}>{val}</td>
                        ))}
                        <td colSpan="2" style={{ backgroundColor: '#e9f2fb' }}></td>
                      </tr>
                      <tr className="bg-light">
                        <td colSpan="3" className="text-start ps-3 fw-bold small text-uppercase" style={{ backgroundColor: '#cfe2f3' }}>Number of Students getting equal and more than average</td>
                        <td className="label-col-cell" style={{ backgroundColor: '#cfe2f3' }}></td>
                        {attainmentStats.equalOrMoreAvg.map((val, i) => (
                          <td key={i} className="fw-bold small" style={{ backgroundColor: '#cfe2f3' }}>{val}</td>
                        ))}
                        <td colSpan="2" style={{ backgroundColor: '#cfe2f3' }}></td>
                      </tr>
                      <tr className="bg-light">
                        <td colSpan="3" className="text-start ps-3 fw-bold small text-uppercase" style={{ backgroundColor: '#cfe2f3' }}>% of Student scored more than average</td>
                        <td className="label-col-cell" style={{ backgroundColor: '#cfe2f3' }}></td>
                        {attainmentStats.percentMoreAvg.map((val, i) => (
                          <td key={i} className="fw-bold small" style={{ backgroundColor: '#e9f2fb' }}>{val}%</td>
                        ))}
                        <td colSpan="2" style={{ backgroundColor: '#e9f2fb' }}></td>
                      </tr>
                      <tr className="bg-light">
                        <td colSpan="3" className="text-start ps-3 fw-bold small text-uppercase" style={{ backgroundColor: '#cfe2f3' }}>CO attainment</td>
                        <td className="label-col-cell" style={{ backgroundColor: '#cfe2f3' }}></td>
                        {attainmentStats.coAttainment.map((val, i) => {
                          const percent = parseFloat(val);
                          let level = 0.00;
                          if (percent >= 80) level = 3.00;
                          else if (percent >= 76) level = 2.75;
                          else if (percent >= 71) level = 2.50;
                          else if (percent >= 66) level = 2.25;
                          else if (percent >= 61) level = 2.00;
                          else if (percent >= 56) level = 1.75;
                          else if (percent >= 51) level = 1.50;
                          else if (percent >= 46) level = 1.25;
                          else if (percent >= 20) level = 1.00;

                          return (
                            <td key={i} className="fw-bold small" style={{ backgroundColor: '#b4c7e7' }}>
                              {level.toFixed(2)} ({val}%)
                            </td>
                          );
                        })}
                        <td colSpan="2" style={{ backgroundColor: '#b4c7e7' }}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {renderActionFooter()}
              </>
            )}

            {(selectedTool === 'SLA' || selectedTool.startsWith('SLA-')) && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="test-title text-start fs-5 fw-bold mb-0" style={{ color: '#2c3e50' }}>Self Learning Assessment (SLA)</h4>
                  <div className="d-flex align-items-center gap-4 pe-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="small text-muted fw-bold text-uppercase">Max Total:</span>
                      <span className="fw-bold fs-5 px-2" title="Configured in Course Management">{totalMaxMarks}</span>
                    </div>
                    {viewMode !== 'view' && (
                      <div className="d-flex gap-2 align-items-center border-start ps-3">
                        <FaPlus
                          className="text-success cursor-pointer hover-opacity"
                          onClick={addColumn}
                          style={{ fontSize: '1.2rem', transition: 'transform 0.2s' }}
                          title="Add Column"
                        />
                        <FaMinus
                          className="text-danger cursor-pointer hover-opacity"
                          onClick={removeColumn}
                          style={{ fontSize: '1.2rem', transition: 'transform 0.2s' }}
                          title="Remove Column"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="table-responsive cis-table-container">
                  <table className="table table-bordered cis-table text-center align-middle mb-0">
                    {renderTableHeaders('SLA')}
                    <tbody>
                      {students.map((student, rowIndex) => (
                        <tr key={rowIndex}>
                          <td>{student.enrollment_no}</td>
                          <td>{student.roll_no}</td>
                          <td className="text-start ps-3">{student.name}</td>
                          <td style={{ backgroundColor: '#6c8ebf' }}></td>
                          {questions.map((_, colIndex) => (
                            <td key={colIndex} className="p-0">
                              <input
                                type="text"
                                className="form-control border-0 text-center shadow-none text-center"
                                value={marksData[student.enrollment_no]?.[colIndex] || ''}
                                onChange={(e) => handleMarkChange(student.enrollment_no, colIndex, e.target.value)}
                                readOnly={viewMode === 'view'}
                                data-type="mark"
                                data-row={rowIndex}
                                data-col={colIndex}
                                onKeyDown={(e) => handleKeyDown(e, 'mark', rowIndex, colIndex)}
                              />
                            </td>
                          ))}
                          <td className="bg-light"></td>
                          <td className="fw-bold" style={{ backgroundColor: '#f0f7ff' }}>{marksData[student.enrollment_no]?.['total'] || '0'}</td>
                        </tr>
                      ))}
                      <tr className="bg-light">
                        <td colSpan="3" className="text-start ps-3 fw-bold small text-uppercase" style={{ backgroundColor: '#cfe2f3' }}>Average Marks</td>
                        <td className="label-col-cell" style={{ backgroundColor: '#cfe2f3' }}></td>
                        {attainmentStats.averages.map((avg, i) => (
                          <td key={i} className="fw-bold small" style={{ backgroundColor: '#e9f2fb' }}>{avg.toFixed(2)}</td>
                        ))}
                        <td colSpan="2"></td>
                      </tr>
                      <tr className="bg-light">
                        <td colSpan="3" className="text-start ps-3 fw-bold small text-uppercase" style={{ backgroundColor: '#cfe2f3' }}>CO attainment</td>
                        <td className="label-col-cell" style={{ backgroundColor: '#cfe2f3' }}></td>
                        {attainmentStats.coAttainment.map((val, i) => {
                          const percent = parseFloat(val);
                          let level = 0.00;
                          if (percent >= 80) level = 3.00;
                          else if (percent >= 76) level = 2.75;
                          else if (percent >= 71) level = 2.50;
                          else if (percent >= 66) level = 2.25;
                          else if (percent >= 61) level = 2.00;
                          else if (percent >= 56) level = 1.75;
                          else if (percent >= 51) level = 1.50;
                          else if (percent >= 46) level = 1.25;
                          else if (percent >= 20) level = 1.00;

                          return (
                            <td key={i} className="fw-bold small" style={{ backgroundColor: '#b4c7e7' }}>
                              {level.toFixed(2)} ({val}%)
                            </td>
                          );
                        })}
                        <td colSpan="2"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {renderActionFooter()}
              </>
            )}

            {selectedTool === 'FA-PR' && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="test-title text-start fs-5 fw-bold mb-0" style={{ color: '#2c3e50' }}>FA PR (K3) - Manual Practical Assessment</h4>
                  <div className="d-flex align-items-center gap-4 pe-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="small text-muted fw-bold text-uppercase">Max Total:</span>
                      <span className="fw-bold fs-5 px-2" title="Configured in Course Management">{totalMaxMarks}</span>
                    </div>
                    {viewMode !== 'view' && (
                      <div className="d-flex gap-2 align-items-center border-start ps-3">
                        <FaPlus
                          className="text-success cursor-pointer hover-opacity"
                          onClick={addColumn}
                          style={{ fontSize: '1.2rem', transition: 'transform 0.2s' }}
                          title="Add Column"
                        />
                        <FaMinus
                          className="text-danger cursor-pointer hover-opacity"
                          onClick={removeColumn}
                          style={{ fontSize: '1.2rem', transition: 'transform 0.2s' }}
                          title="Remove Column"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="table-responsive cis-table-container">
                  <table className="table table-bordered cis-table text-center align-middle mb-0">
                    {renderTableHeaders('FA-PR')}
                    <tbody>
                      {students.map((student, rowIndex) => (
                        <tr key={rowIndex}>
                          <td>{student.enrollment_no}</td>
                          <td>{student.roll_no}</td>
                          <td className="text-start ps-3">{student.name}</td>
                          <td style={{ backgroundColor: '#6c8ebf' }}></td>
                          {questions.map((_, colIndex) => (
                            <td key={colIndex} className="p-0">
                              <input
                                type="text"
                                className="form-control border-0 text-center shadow-none text-center"
                                value={marksData[student.enrollment_no]?.[colIndex] || ''}
                                onChange={(e) => handleMarkChange(student.enrollment_no, colIndex, e.target.value)}
                                readOnly={viewMode === 'view'}
                                data-type="mark"
                                data-row={rowIndex}
                                data-col={colIndex}
                                onKeyDown={(e) => handleKeyDown(e, 'mark', rowIndex, colIndex)}
                              />
                            </td>
                          ))}
                          <td className="bg-light"></td>
                          <td className="fw-bold" style={{ backgroundColor: '#f0f7ff' }}>{marksData[student.enrollment_no]?.['total'] || '0'}</td>
                        </tr>
                      ))}
                      <tr className="bg-light">
                        <td colSpan="3" className="text-start ps-3 fw-bold small text-uppercase" style={{ backgroundColor: '#cfe2f3' }}>Average Marks</td>
                        <td className="label-col-cell" style={{ backgroundColor: '#cfe2f3' }}></td>
                        {attainmentStats.averages.map((avg, i) => (
                          <td key={i} className="fw-bold small" style={{ backgroundColor: '#e9f2fb' }}>{avg.toFixed(2)}</td>
                        ))}
                        <td colSpan="2"></td>
                      </tr>
                      <tr className="bg-light">
                        <td colSpan="3" className="text-start ps-3 fw-bold small text-uppercase" style={{ backgroundColor: '#cfe2f3' }}>CO attainment</td>
                        <td className="label-col-cell" style={{ backgroundColor: '#cfe2f3' }}></td>
                        {attainmentStats.coAttainment.map((val, i) => {
                          const percent = parseFloat(val);
                          let level = 0.00;
                          if (percent >= 80) level = 3.00;
                          else if (percent >= 76) level = 2.75;
                          else if (percent >= 71) level = 2.50;
                          else if (percent >= 66) level = 2.25;
                          else if (percent >= 61) level = 2.00;
                          else if (percent >= 56) level = 1.75;
                          else if (percent >= 51) level = 1.50;
                          else if (percent >= 46) level = 1.25;
                          else if (percent >= 20) level = 1.00;

                          return (
                            <td key={i} className="fw-bold small" style={{ backgroundColor: '#b4c7e7' }}>
                              {level.toFixed(2)} ({val}%)
                            </td>
                          );
                        })}
                        <td colSpan="2" style={{ backgroundColor: '#b4c7e7' }}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {renderActionFooter("Please upload practical records as evidence.")}
              </>
            )}

            {(selectedTool === 'SA-TH' || selectedTool === 'SA-PR') && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="test-title text-start fs-5 fw-bold mb-0" style={{ color: '#2c3e50' }}>{selectedTool === 'SA-TH' ? 'Summative Assessment (Theory)' : 'Summative Assessment (Practical)'}</h4>
                  <div className="d-flex align-items-center gap-2">
                    <span className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Max Total:</span>
                    <span className="fw-bold fs-5 px-2" title="Configured in Course Management">{totalMaxMarks}</span>
                  </div>
                </div>
                <div className="table-responsive cis-table-container">
                  <table className="table table-bordered cis-table text-center align-middle mb-0">
                    {renderTableHeaders(selectedTool)}
                    <tbody>
                      {students.map((student, rowIndex) => (
                        <tr key={rowIndex}>
                          <td>{student.enrollment_no}</td>
                          <td>{student.roll_no}</td>
                          <td className="text-start ps-3">{student.name}</td>
                          <td className="p-0">
                            <input
                              type="text"
                              className="form-control border-0 text-center shadow-none fw-bold text-center"
                              value={marksData[student.enrollment_no]?.[0] || ''}
                              onChange={(e) => handleMarkChange(student.enrollment_no, 0, e.target.value)}
                              readOnly={viewMode === 'view'}
                              data-type="mark"
                              data-row={rowIndex}
                              data-col={0}
                              onKeyDown={(e) => handleKeyDown(e, 'mark', rowIndex, 0)}
                            />
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-light">
                        <td colSpan="3" className="text-start ps-3 fw-bold small text-uppercase" style={{ backgroundColor: '#cfe2f3' }}>CO attainment</td>
                        <td className="fw-bold small" style={{ backgroundColor: '#b4c7e7' }}>
                          {(() => {
                            const val = attainmentStats.coAttainment[0] || '0.00';
                            const percent = parseFloat(val);
                            let level = 0.00;
                            if (percent >= 80) level = 3.00;
                            else if (percent >= 76) level = 2.75;
                            else if (percent >= 71) level = 2.50;
                            else if (percent >= 66) level = 2.25;
                            else if (percent >= 61) level = 2.00;
                            else if (percent >= 56) level = 1.75;
                            else if (percent >= 51) level = 1.50;
                            else if (percent >= 46) level = 1.25;
                            else if (percent >= 20) level = 1.00;
                            return `${level.toFixed(2)} (${val}%)`;
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {renderActionFooter(selectedTool === 'SA-TH' ? "Please upload 3-5 sample theory papers." : "Please upload practical exam records.")}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Cisentry;
