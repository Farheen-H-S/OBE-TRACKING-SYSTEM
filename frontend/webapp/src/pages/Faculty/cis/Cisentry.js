import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Cisentry.css';
// import { students } from '../../../data/studentData'; // REMOVED

import api from '../../../utils/axios';
import { useFilters } from '../../../context/FilterContext';
import {
  FaCloudUploadAlt, FaFilePdf, FaTimesCircle, FaCheckCircle, FaPlus, FaMinus,
  FaEye, FaPaperclip, FaEdit, FaExclamationCircle, FaUpload, FaFileExcel, FaCheckDouble
} from 'react-icons/fa';
import { getDefaultSemester, getCachedSemesterType, getSemesterOptions as computeSemesterOptions } from '../../../utils/semesterUtils';

const Cisentry = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    selectedDept: selectedProgram,
    setSelectedDept: setSelectedProgram,
    selectedScheme,
    setSelectedScheme,
    selectedBatch,
    setSelectedBatch,
    selectedYear: selectedAcademicYear,
    setSelectedYear,
    selectedClass,
    setSelectedClass,
    selectedSemester,
    setSelectedSemester,
    selectedDivision,
    setSelectedDivision,
    selectedCourse: globalSelectedCourse,
    setSelectedCourse: setGlobalSelectedCourse,
    departments: programs,
    schemes,
    years,
    batches,
    validateContext
  } = useFilters();

  const requiredFields = ['dept', 'scheme', 'batch', 'year', 'class', 'semester', 'division'];
  const { isValid, missingFields } = validateContext(requiredFields);

  const selectedYear = selectedAcademicYear; // Alias for compatibility
  const selectedIntroYear = selectedScheme;   // Alias for compatibility

  // State for dynamic data
  const [courses, setCourses] = useState([]);
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [surveyFilter, setSurveyFilter] = useState('ALL'); // ALL, ACTIVE, EXPIRED
  const [academicYear, setAcademicYear] = useState('');
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [coCount, setCoCount] = useState(0);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [showAtrModal, setShowAtrModal] = useState(false);
  const [pendingAtrCos, setPendingAtrCos] = useState([]);
  const [atrSubmitLoading, setAtrSubmitLoading] = useState(false);


  // Selection state
  const [assessmentTools, setAssessmentTools] = useState({});

  const [selectedCourse, setSelectedCourse] = useState(globalSelectedCourse || '');

  useEffect(() => {
    setGlobalSelectedCourse(selectedCourse);
  }, [selectedCourse, setGlobalSelectedCourse]);

  const [searchTerm, setSearchTerm] = useState('');
  const [allCourses, setAllCourses] = useState([]);
  const [assessmentType, setAssessmentType] = useState('Internal');
  const [selectedTool, setSelectedTool] = useState('FA-TH-CT1');
  const [columnCount, setColumnCount] = useState(14); // Default for CT
  const [totalMaxMarks, setTotalMaxMarks] = useState(30);
  const [minPassingMarks, setMinPassingMarks] = useState(0);
  const [viewMode, setViewMode] = useState('entry'); // 'entry', 'view', 'edit'

  // Marks and CO state
  const [marksData, setMarksData] = useState({}); // { studentEnrollment: { questionIndex: marks } }
  const [userCos, setUserCos] = useState(new Array(30).fill('')); // Support up to 30 CO inputs
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [assessmentId, setAssessmentId] = useState(null);
  const fileInputRef = useRef(null);  // Refs
  const bulkApplyRef = useRef(null);
  const [bulkUploadButtonText, setBulkUploadButtonText] = useState('Bulk Upload Marks');
  const isSyncingRef = useRef(false);


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

  const isMarkExcluded = (enrollment, colIndex) => {
    const isTheoryTest = selectedTool.startsWith('FA-TH') || selectedTool.includes('CT') || selectedTool.includes('TEST');
    if (!isTheoryTest) return false;

    // Every group of 7 indices is a separate question (Q1: 0-6, Q2: 7-13, Q3: 14-20, etc.)
    const groupIndex = Math.floor(colIndex / 7);
    const start = groupIndex * 7;
    const end = start + 6;

    const sMarks = marksData[enrollment] || {};
    const groupMarks = [];
    for (let i = start; i <= end; i++) {
        const v = parseFloat(sMarks[i]) || 0;
        groupMarks.push({ i, v });
    }
    // Sort descending by value, then by index for stability
    groupMarks.sort((a, b) => (b.v - a.v) || (a.i - b.i));

    const included = groupMarks.slice(0, 5).map(m => m.i);
    return !included.includes(colIndex);
  };

  // Attainment Calculation Logic (Attempted-Only + Fixed Threshold)
  const calculateAttainmentStats = () => {
    // Initialize stats containers first
    let appeared = new Array(columnCount).fill(0);
    let averages = new Array(columnCount).fill(0);
    let equalOrMoreAvg = new Array(columnCount).fill(0);
    let percentMoreAvg = new Array(columnCount).fill(0);
    let coStats = { /* co_key: { totalGot: 0, totalMax: 0, appearedEnrollments: Set } */ };
    let studentAppearedInCO = {}; // { enroll: { co_key: true } }

    // 1. Question-wise statistics
    // FA-PR, SA-PR, SA-TH and SLA use "count >= col_avg" formula; others (FA-TH, CT, etc) use 40% threshold
    const isPractical = selectedTool === 'FA-PR' || selectedTool === 'SLA' || selectedTool === 'SA-PR' || selectedTool === 'SA-TH';

    questions.forEach((_, colIndex) => {
      // Filter ONLY students who actually entered a mark
      const attemptedMarks = students
        .map(s => parseFloat(marksData[s.enrollment_no]?.[colIndex]))
        .filter(m => !isNaN(m));
      
      const qSum = attemptedMarks.reduce((a, b) => a + b, 0);
      const qAvg = attemptedMarks.length ? (qSum / attemptedMarks.length) : 0;
      const weight = parseFloat(weights[colIndex]) || 0;

      appeared[colIndex] = attemptedMarks.length;
      averages[colIndex] = qAvg;

      if (isPractical) {
        // FA-PR: percentage = (students scoring >= column average) / appeared * 100
        // This matches the Excel formula =AVERAGE of (count>=avg / count * 100) per CO's columns
        const successCount = attemptedMarks.filter(m => m >= qAvg).length;
        equalOrMoreAvg[colIndex] = successCount;
        percentMoreAvg[colIndex] = attemptedMarks.length > 0
          ? ((successCount / attemptedMarks.length) * 100).toFixed(2)
          : '0.00';
      } else {
        // FA-TH / SLA: percentage = COUNTIF(marks >= threshold) / COUNT * 100
        // Excel uses integer thresholds, rounded down, minimum 1 for small bits
        const threshold = Math.max(1, Math.floor(weight * 0.40));
        const successCount = attemptedMarks.filter(m => m >= threshold).length;
        equalOrMoreAvg[colIndex] = successCount;
        // Calculate true Success Rate (% of students passing the threshold)
        percentMoreAvg[colIndex] = attemptedMarks.length > 0 
          ? ((successCount / attemptedMarks.length) * 100).toFixed(2) 
          : '0.00';
      }
    });

    // 2. CO-wise and Overall aggregation (Attempted-Only Percentage)
    students.forEach(s => {
      const sMarks = marksData[s.enrollment_no] || {};
      
      questions.forEach((_, colIndex) => {
        const coVal = userCos[colIndex];
        if (!coVal) return;
        
        const coKey = coVal.toString();
        const mark = parseFloat(sMarks[colIndex]);
        const isMarkEntered = !isNaN(mark);
        
        // Choice Rule exclusion
        if (!isMarkExcluded(s.enrollment_no, colIndex)) {
          const weight = parseFloat(weights[colIndex]) || 0;
          
          // ATTEMPTED logic: Only add to CO aggregate if mark was actually entered
          if (isMarkEntered) {
            if (!coStats[coKey]) coStats[coKey] = { totalGot: 0, totalMax: 0 };
            coStats[coKey].totalGot += mark;
            coStats[coKey].totalMax += weight;
            
            if (!studentAppearedInCO[s.enrollment_no]) studentAppearedInCO[s.enrollment_no] = {};
            studentAppearedInCO[s.enrollment_no][coKey] = true;
          }
        }
      });
    });

    // 3. Final Summaries
    const coAttainmentLevels = {};
    const isSummative = selectedTool === 'SA-PR' || selectedTool === 'SA-TH';

    if (isSummative && courseOutcomes.length > 0) {
      // Replicate attainment for ALL course COs
      // Summative tools usually have only 1 main column or we take the avg of entered ones
      let sumPercent = 0;
      let countColumns = 0;
      questions.forEach((_, colIndex) => {
        if (appeared[colIndex] > 0) {
          sumPercent += parseFloat(percentMoreAvg[colIndex]) || 0;
          countColumns += 1;
        }
      });
      const avgPercent = countColumns > 0 ? (sumPercent / countColumns) : 0;
      const totalAppeared = students.length; // Use total class size for summative usually

      courseOutcomes.forEach(co => {
        const coKey = co.co_number || `CO${co.co_id}`;
        coAttainmentLevels[coKey] = {
          percent: avgPercent.toFixed(2),
          level: ((avgPercent / 100) * 3).toFixed(2),
          appeared: appeared[0] || totalAppeared // Use appeared from first column or class
        };
      });
    } else {
      Object.keys(coStats).forEach(coKey => {
        // Calculate CO attainment as the AVERAGE of the Question-wise percentages mapped to this CO
        let sumPercent = 0;
        let countColumns = 0;
        
        questions.forEach((_, colIndex) => {
          const coVal = userCos[colIndex];
          if (coVal && coVal.toString() === coKey && appeared[colIndex] > 0) {
            sumPercent += parseFloat(percentMoreAvg[colIndex]) || 0;
            countColumns += 1;
          }
        });
        
        const percent = countColumns > 0 ? (sumPercent / countColumns) : 0;
        const totalTouchers = Object.keys(studentAppearedInCO).filter(enroll => studentAppearedInCO[enroll][coKey]).length;

        coAttainmentLevels[coKey] = {
          percent: percent.toFixed(2),
          level: ((percent / 100) * 3).toFixed(2),
          appeared: totalTouchers
        };
      });
    }

    const totalAverage = (() => {
      // Total Average should also reflect attempted mastery to reach 98.74% precision
      const enrolledWithWork = Object.keys(studentAppearedInCO);
      if (enrolledWithWork.length === 0) return 0;
      const totalSum = enrolledWithWork.reduce((sum, enroll) => {
        const val = parseFloat(marksData[enroll]?.['total']);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);
      return totalSum / enrolledWithWork.length;
    })();

    const columnAttainmentLevels = questions.map((_, colIndex) => {
      const percent = parseFloat(percentMoreAvg[colIndex]) || 0;
      return ((percent / 100) * 3).toFixed(2);
    });

    return { appeared, equalOrMoreAvg, percentMoreAvg, columnAttainmentLevels, averages, totalAverage, coStats, coAttainmentLevels };
  };

  const attainmentStats = calculateAttainmentStats();

  useEffect(() => {
    fetchAcademicData();
  }, []);

  const fetchAcademicData = async () => {
    try {
      const [setupRes, allCourseRes, progRes] = await Promise.all([
        api.get('/academics/academic-setup/'),
        api.get('/academics/courses/'),
        api.get('/academics/programs/')
      ]);
      setAllCourses(allCourseRes.data);

      if (setupRes.data) {
        const ay = setupRes.data.academic_year.replace(/(\d{4})(\d{2})/, "$1 - $2");
        setAcademicYear(ay);

        // Cache globally so other components can use semester_type
        localStorage.setItem('academicSetup', JSON.stringify(setupRes.data));
      }
    } catch (error) {
      console.error("Error fetching initial academic data:", error);
    }
  };

  // Handle incoming navigation state from Direct Attainment Preview
  useEffect(() => {
    if (location.state) {
      isSyncingRef.current = true;
      const {
        course_id, academic_year, batch_id,
        class_year, semester, division, tool,
        program_id, scheme_id
      } = location.state;

      if (program_id) setSelectedProgram(program_id);
      if (scheme_id) setSelectedScheme(scheme_id);
      if (course_id) setSelectedCourse(String(course_id));
      if (academic_year) setSelectedYear(academic_year);
      if (batch_id) setSelectedBatch(batch_id);
      if (class_year) setSelectedClass(class_year);
      if (semester) setSelectedSemester(String(semester));
      if (division) setSelectedDivision(division);
      if (tool) {
        setSelectedTool(tool);
        // Set assessment type based on tool
        if (tool.startsWith('SA-')) setAssessmentType('External');
        else setAssessmentType('Internal');
      }

      // Release sync lock after context updates have settled
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 1000);
    }
  }, [location.state]);

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
  }, [selectedProgram, selectedScheme, selectedClass, selectedSemester, selectedDivision, selectedIntroYear, selectedBatch, selectedYear]);

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
        academic_year: selectedYear,
        batch_id: selectedBatch,
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
        semester: selectedSemester,
        batch_id: selectedBatch
      };

      if (role === 'FACULTY') {
        endpoint = `/academics/my-courses/`;
      }

      setCoursesLoading(true);
      const response = await api.get(endpoint, { params });

      // The backend now handles filtering, but we keep the client-side fallback just in case
      let filtered = response.data;
      if (role !== 'FACULTY') {
        if (selectedSemester && selectedSemester !== 'All') filtered = filtered.filter(c => c.semester === parseInt(selectedSemester));
        if (selectedClass && selectedClass !== 'All') filtered = filtered.filter(c => c.class_year === selectedClass);
        if (selectedBatch && selectedBatch !== 'All') filtered = filtered.filter(c => c.batch_list && c.batch_list.includes(selectedBatch));
      }

      setCourses(filtered);
      setCoursesLoading(false);

      // Auto-clear selected course if it's no longer in the filtered list
      // BUT skip this if we are currently syncing from navigation
      if (selectedCourse && !isSyncingRef.current) {
        const isValid = filtered.some(c => String(c.course_id) === String(selectedCourse));
        if (!isValid) {
          setSelectedCourse('');
        }
      }
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
    // Reset data state before loading new tool data to prevent cross-tool state leakage
    setMarksData({});
    setCustomQuestions(new Array(60).fill(''));
    setCustomWeights(new Array(60).fill(''));
    setUserCos(new Array(60).fill(''));
    setAssessmentId(null);

    // Always calculate max marks from course configuration (not from localStorage)
    let configMax = 0;
    let toolKey = selectedTool;
    if (selectedTool.startsWith('FA-TH')) toolKey = 'FA-TH';
    if (assessmentTools && assessmentTools[toolKey] && assessmentTools[toolKey].maxMarks) {
      configMax = parseInt(assessmentTools[toolKey].maxMarks, 10);
    }

    if (selectedTool === 'FA-PR') {
      setColumnCount(10); // Template generates 10 practicals by default
      setTotalMaxMarks(configMax || 25);
    } else if (selectedTool.startsWith('SLA')) {
      setColumnCount(4); // Template generates 4 SLA assignments by default
      setTotalMaxMarks(configMax || 20);
    } else if (selectedTool === 'SA-TH' || selectedTool === 'SA-PR') {
      setColumnCount(1);
      setTotalMaxMarks(configMax || 100);
    } else if (selectedTool.startsWith('FA-TH')) {
      setColumnCount(14);
      setTotalMaxMarks(configMax || 30);
    } else {
      setColumnCount(14);
      setTotalMaxMarks(configMax || 30);
    }

    try {
      const params = { course_id: selectedCourse, tool_name: selectedTool, academic_year: selectedYear, semester: selectedSemester };
      const res = await api.get('/assessments/marks/', { params });

      if (res.data && res.data.assessment_id) {
        setAssessmentId(res.data.assessment_id);
        const config = res.data.configuration || {};

        // Prioritize backend data if it exists
        if (config.userCos) setUserCos(config.userCos);
        if (config.customQuestions) setCustomQuestions(config.customQuestions);
        if (config.customWeights) setCustomWeights(config.customWeights);
        if (config.columnCount) setColumnCount(config.columnCount);
        if (config.minPassingMarks !== undefined) setMinPassingMarks(config.minPassingMarks);
        else setMinPassingMarks(0);

          // Detailed marks breakdown if stored in config
          if (config.marksData) {
            const parsedData = { ...config.marksData };
            
            // Recalculate totals for all students to ensure choice rule alignment
            const isTheoryTest = selectedTool.startsWith('FA-TH') || selectedTool.includes('CT') || selectedTool.includes('TEST');
            
            Object.keys(parsedData).forEach(enroll => {
              if (enroll === 'total') return;
              const studentMarks = parsedData[enroll];
              let total = 0;
              
              if (isTheoryTest) {
                const getBest5Sum = (start, end) => {
                  const vals = [];
                  for (let i = start; i <= end; i++) {
                    const v = parseFloat(studentMarks[i]);
                    if (!isNaN(v)) vals.push(v);
                  }
                  vals.sort((a, b) => b - a);
                  return vals.slice(0, 5).reduce((a, c) => a + c, 0);
                };
                total = getBest5Sum(0, 6) + getBest5Sum(7, 13);
              } else if (selectedTool === 'FA-PR' || selectedTool.startsWith('SLA')) {
                let sum = 0;
                let count = 0;
                for (let i = 0; i < (config.columnCount || 10); i++) {
                  const m = parseFloat(studentMarks[i]);
                  if (!isNaN(m)) { sum += m; count++; }
                }
                total = count > 0 ? (sum / count) : 0;
              } else {
                for (let i = 0; i < (config.columnCount || 14); i++) {
                  const m = parseFloat(studentMarks[i]);
                  if (!isNaN(m)) total += m;
                }
              }
              parsedData[enroll]['total'] = total.toFixed(2);
            });

            setMarksData(parsedData);

          // Populate uploaded files from backend
          if (res.data.evidence) {
            setUploadedFiles(prev => ({
              ...prev,
              [selectedTool]: res.data.evidence
            }));
          }

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
      const parsedData = parsed.marksData || {};

      if (selectedTool === 'FA-PR' || selectedTool.startsWith('SLA')) {
        const colCount = parsed.columnCount || (selectedTool === 'FA-PR' ? 10 : 4);
        Object.keys(parsedData).forEach(enroll => {
          if (enroll !== 'total') {
            let sum = 0;
            for (let i = 0; i < colCount; i++) {
              const mark = parsedData[enroll][i];
              if (mark && !isNaN(parseFloat(mark))) {
                sum += parseFloat(mark);
              }
            }
            const correctTotal = colCount > 0 ? (sum / colCount) : 0;
            parsedData[enroll]['total'] = correctTotal === 0 ? '0' : (Math.round(correctTotal * 100) / 100).toString();
          }
        });
      }

      setMarksData(parsedData);
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
      setMinPassingMarks(0);
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
    isSyncingRef.current = true;
    const course = allCourses.find(c => c.course_id === courseId);
    if (course) {
      if (course.program_id) setSelectedProgram(course.program_id);
      if (course.scheme_id) setSelectedScheme(course.scheme_id);
      if (course.class_year) setSelectedClass(course.class_year);
      if (course.semester) setSelectedSemester(course.semester.toString());
    }
    setSelectedCourse(courseId);
    setSearchTerm('');

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 1000);
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
      const isTheoryTest = selectedTool.startsWith('FA-TH') || selectedTool.includes('CT') || selectedTool.includes('TEST');
      if (isTheoryTest) {
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
        // Normalization: Average
        let sum = 0;
        for (let i = 0; i < columnCount; i++) {
          const mark = studentMarks[i];
          if (mark && !isNaN(parseFloat(mark))) {
            sum += parseFloat(mark);
          }
        }
        total = columnCount > 0 ? (sum / columnCount) : 0;
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
      studentMarks['total'] = total.toFixed(2);

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
      const weight = parseFloat(weights[col]) || 0;
      const threshold = weight / 2;
      const aboveThresholdCount = marks.filter(m => m >= threshold).length;
      const percentAboveThreshold = appearedCount > 0 ? (aboveThresholdCount / appearedCount) * 100 : 0;
      const coAttainment = (percentAboveThreshold / 100) * 3;
      stats.push({
        average: average.toFixed(2),
        aboveAvgCount: aboveThresholdCount,
        appearedCount,
        absentCount: students.length - appearedCount,
        percentAboveAvg: percentAboveThreshold.toFixed(2),
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
      // Linear scaling: level = (percent / 100) * 3, capped at 3.00
      return parseFloat(Math.min((percent / 100) * 3, 3).toFixed(2));
    };

    const stats = calculateAttainmentStats();
    const attainment = Object.entries(stats.coAttainmentLevels).map(([coId, data]) => ({
      co_id: coId,
      percent: data.percent,
      level: parseFloat(data.level)
    }));

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
          let marksValue = null;
          if (data.total !== undefined && data.total !== '') {
            marksValue = data.total;
          } else if (data[0] !== undefined && data[0] !== '') {
            marksValue = data[0];
          }
          return { enrollment_no: enrollment, marks: marksValue };
        }),
        co_mappings: slicedUserCos.map((co, idx) => ({ co_id: (co || '').toString().trim(), weight: weights[idx] })).filter(m => m.co_id),
        configuration: {
          columnCount,
          customQuestions,
          customWeights,
          userCos,
          marksData, // Include full breakdown for CT/PR tools
          minPassingMarks,
          toolKey: selectedTool
        },
        semester: parseInt(selectedSemester)
      };

      // Calculate correct max_marks for payload if tool is average-based
      if (selectedTool === 'FA-PR' || selectedTool.startsWith('SLA')) {
        const floatWeights = weights.map(w => parseFloat(w)).filter(w => !isNaN(w));
        const avgMax = floatWeights.length > 0 ? (floatWeights.reduce((a, b) => a + b, 0) / floatWeights.length) : totalMaxMarks;
        payload.max_marks = avgMax;
      }

      // Correct tool_type logic
      let backendToolType = 'FA_TH';
      if (selectedTool.startsWith('FA-TH')) backendToolType = 'FA_TH';
      else if (selectedTool === 'FA-PR') backendToolType = 'FA_PR';
      else if (selectedTool === 'SLA') backendToolType = 'SLA';
      else if (selectedTool === 'SA-TH') backendToolType = 'SA_TH';
      else if (selectedTool === 'SA-PR') backendToolType = 'SA_PR';
      else if (selectedTool === 'CES') backendToolType = 'CES';

      payload.tool_type = backendToolType;

      const response = await api.post('/assessments/marks/', payload);
      const data = response.data;

      // Handle ATR Requirement
      if (data.attainment_results?.atr_required) {
        setPendingAtrCos(data.attainment_results.pending_cos || []);
        setShowAtrModal(true);
      } else if (data.report_generated) {
        alert('Marks saved and Direct Attainment Report generated successfully!');
      } else {
        if (showAlert) alert('Marks saved to database!');
      }

      // Clear localStorage for this entry to avoid double storage
      localStorage.removeItem(`cis_entry_${selectedCourse}_${selectedTool}`);
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

  const submitAtr = async (actionText) => {
    setAtrSubmitLoading(true);
    try {
      const res = await api.post('/attainment/atr/submit/', {
        course_id: selectedCourse,
        academic_year: selectedYear,
        action_proposed: actionText
      });

      if (res.data.report_generated) {
        alert('Consolidated ATR submitted and Direct Attainment Report generated successfully!');
      } else {
        alert('Consolidated ATR submitted successfully!');
      }

      setPendingAtrCos([]);
      setShowAtrModal(false);

    } catch (error) {
      alert('Failed to submit ATR: ' + (error.response?.data?.error || error.message));
    } finally {
      setAtrSubmitLoading(false);
    }
  };


  const handleEdit = () => {
    setViewMode('edit');
  };


  const isBelowMinimum = (enrollment) => {
    const total = parseFloat(marksData[enrollment]?.total);
    if (!isNaN(total) && minPassingMarks > 0 && total < minPassingMarks) {
      return true;
    }
    return false;
  };

  const renderTableHeaders = (toolTitle) => {
    const isSLA = selectedTool.startsWith('SLA');
    const isSATH = selectedTool === 'SA-TH';

    if (isSATH || selectedTool === 'SA-PR') {
      const headerLabel = isSATH ? 'Theory Marks (SA-TH)' : 'Practical Marks (SA-PR)';
      return (
        <thead>
          <tr>
            <th className="student-col-header fw-bold" style={{ width: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', backgroundColor: '#e7e6e6' }}>Enrollment No.</th>
            <th className="student-col-header fw-bold" style={{ width: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', backgroundColor: '#e7e6e6' }}>Roll No.</th>
            <th className="student-col-header fw-bold" style={{ width: 'auto', minWidth: '250px', verticalAlign: 'middle', backgroundColor: '#e7e6e6' }}>Name of Student</th>
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
            <th rowSpan="3" className="student-col-header fw-bold" style={{ width: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', backgroundColor: '#e7e6e6' }}>Enrollment No.</th>
            <th rowSpan="3" className="student-col-header fw-bold" style={{ width: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', backgroundColor: '#e7e6e6' }}>Roll No.</th>
            <th rowSpan="3" className="student-col-header fw-bold" style={{ width: 'auto', minWidth: '250px', verticalAlign: 'middle', backgroundColor: '#e7e6e6' }}>Name of Student</th>

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
                  placeholder="CO"
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
            <th rowSpan="3" className="student-col-header fw-bold" style={{ width: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', backgroundColor: '#e7e6e6' }}>Enrollment No.</th>
            <th rowSpan="3" className="student-col-header fw-bold" style={{ width: 'auto', whiteSpace: 'nowrap', verticalAlign: 'middle', backgroundColor: '#e7e6e6' }}>Roll No.</th>
            <th rowSpan="3" className="student-col-header fw-bold" style={{ width: 'auto', minWidth: '250px', verticalAlign: 'middle', backgroundColor: '#e7e6e6' }}>Name of Student</th>

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
                  placeholder="CO"
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
                placeholder="CO"
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

  const handleBulkApply = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBulkUploadButtonText('Uploading...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('course_id', selectedCourse);
    formData.append('academic_year', selectedYear);
    formData.append('semester', selectedSemester);
    if (selectedDivision) {
      formData.append('division', selectedDivision);
    }

    try {
      const response = await api.post('/bulk_upload/cis/bulk-apply/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const resData = response.data;
      let summary = "Bulk Apply completed!\n\n";
      let hasErrors = false;
      if (resData.report) {
        Object.entries(resData.report).forEach(([tool, info]) => {
          const isError = typeof info === 'string' && (info.startsWith('Error') || info.startsWith('Validation') || info === 'No valid students found');
          if (isError) hasErrors = true;
          summary += `${tool}: ${info}\n`;
        });
      }
      if (hasErrors) {
        summary += "\n⚠️ Some sheets had errors. Check the messages above. Make sure:\n";
        summary += "• Roll numbers in the sheet match those in the system\n";
        summary += "• Mark values do not exceed the configured maximum weights\n";
        summary += "• You have selected the correct Course and Academic Year";
      }

      alert(summary);
      loadSavedData(); // Refresh the current view
    } catch (error) {
      console.error("Bulk apply failed:", error);
      alert(`Bulk apply failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setBulkUploadButtonText('Bulk Upload Marks');
      if (bulkApplyRef.current) bulkApplyRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const openFile = (file) => {
    if (file.file) { // Server URL
      // Construct absolute URL: remove '/api/' from base URL and append file path
      const baseUrl = api.defaults.baseURL.replace(/\/api\/$/, '');
      const absoluteUrl = file.file.startsWith('http') ? file.file : `${baseUrl}${file.file}`;
      window.open(absoluteUrl, '_blank');
    } else if (file.content) { // Fallback Base64 for legacy or unsaved
      try {
        const parts = file.content.split(';base64,');
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
        window.open(file.content, '_blank');
      }
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const MAX_FILES = 5;
    const MAX_SIZE_MB = 10;
    const currentFiles = uploadedFiles[selectedTool] || [];

    if (currentFiles.length + files.length > MAX_FILES) {
      alert(`You can upload a maximum of ${MAX_FILES} files.`);
      return;
    }

    for (const file of files) {
      if (file.type !== 'application/pdf') {
        alert(`File "${file.name}" is not a PDF. Only PDF files are allowed.`);
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the ${MAX_SIZE_MB}MB limit.`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('course_id', selectedCourse);
      formData.append('academic_year', selectedYear);
      formData.append('semester', selectedSemester);
      formData.append('assessment_tool', selectedTool);

      try {
        const response = await api.post('/assessments/cis-evidence/upload/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        setUploadedFiles(prev => ({
          ...prev,
          [selectedTool]: [...(prev[selectedTool] || []), response.data]
        }));
      } catch (error) {
        console.error("Upload failed:", error);
        alert(`Failed to upload "${file.name}": ${error.response?.data?.error || error.message}`);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = async (tool, fileId, index) => {
    if (window.confirm("Are you sure you want to remove this evidence file?")) {
      // Note: Normally we'd call a DELETE endpoint here if it exists.
      // For now, we'll just update state and rely on backend cleanup later if needed.
      // If evidence_id is present, it's a server file.
      setUploadedFiles(prev => ({
        ...prev,
        [tool]: prev[tool].filter((_, i) => i !== index)
      }));
    }
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
                      onClick={() => openFile(file)}
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
                className="btn btn-outline-primary d-flex align-items-center gap-2 px-4 py-2 shadow-sm fw-bold"
                onClick={() => fileInputRef.current.click()}
              >
                <FaUpload /> Upload Evidence
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
                        onClick={() => removeFile(selectedTool, file.evidence_id, idx)}
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

        <div className="d-flex justify-content-center mt-4 pb-4">
          <button className="btn btn-outline-success px-5 py-2 fs-5 fw-bold shadow-sm" style={{ borderRadius: '8px' }} onClick={handleSave}>
            Save Data
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="p-4" style={{ backgroundColor: '#f0f8ff', minHeight: '100vh' }}>
      {!isValid && (
        <div className="alert alert-warning shadow-sm border-warning d-flex align-items-center gap-3 p-4 mb-4">
          <FaExclamationCircle className="text-warning fs-3" />
          <div>
            <h5 className="fw-bold mb-1">Academic Context Required</h5>
            <p className="mb-0">Please select the remaining filters in the top bar to proceed: <span className="fw-bold text-dark">{missingFields.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ')}</span></p>
          </div>
        </div>
      )}

      {isValid && (
        <>
          {/* Card 1: Search and Info */}
          <div className="bg-white p-4 rounded shadow-sm mb-4">
            <div className="search-section bg-light p-3 rounded shadow-sm" style={{ border: '1px solid #adcaf8' }}>
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
                            ((c.course_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (c.course_code || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
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

                  <div className="d-flex align-items-center gap-4 text-start" style={{ width: '100%', maxWidth: '700px' }}>
                    <div className="flex-grow-1">
                      <label className="form-label fw-bold mb-1 text-muted small text-uppercase" style={{ color: '#2c3e50', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
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

                    <div className="d-flex flex-column align-items-start mt-auto">
                      <div className="d-flex gap-2">
                        <input
                          type="file"
                          accept=".xlsx, .xls"
                          ref={bulkApplyRef}
                          onChange={handleBulkApply}
                          style={{ display: 'none' }}
                        />
                        <button
                          className="btn btn-outline-primary d-flex align-items-center gap-2 shadow-sm fw-bold"
                          onClick={() => bulkApplyRef.current.click()}
                          title="Download Multi-Sheet Excel from Downloads section, fill it, and upload here to apply marks to ALL tools at once"
                          disabled={bulkUploadButtonText === 'Uploading...'}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          <FaUpload /> {bulkUploadButtonText} (Multi-Sheet)
                        </button>
                      </div>
                      <small className="text-muted mt-1" style={{ fontSize: '0.65rem', maxWidth: '300px', lineHeight: '1.2' }}>
                        * Note: For Bulk Upload please download the template from the Downloads section to ensure correct format.
                      </small>
                    </div>
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
                          <span className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Min Passing:</span>
                          <input
                            type="number"
                            className="form-control form-control-sm fw-bold text-center"
                            style={{ width: '60px', backgroundColor: viewMode === 'view' ? '#f8f9fa' : 'white' }}
                            value={minPassingMarks}
                            readOnly={viewMode === 'view'}
                            onChange={(e) => setMinPassingMarks(parseFloat(e.target.value) || 0)}
                          />
                        </div>
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
                                      {marksData[student.enrollment_no]?.[colIndex] !== undefined && marksData[student.enrollment_no]?.[colIndex] !== '' && marksData[student.enrollment_no]?.[colIndex] !== null ? marksData[student.enrollment_no]?.[colIndex] : '-'}
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      className="form-control border-0 text-center table-input shadow-none"
                                      style={{ borderRadius: 0, backgroundColor: isMarkExcluded(student.enrollment_no, colIndex) ? '#ffcccc' : 'transparent' }}
                                      value={marksData[student.enrollment_no]?.[colIndex] !== undefined && marksData[student.enrollment_no]?.[colIndex] !== null ? marksData[student.enrollment_no]?.[colIndex] : ''}
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
                              <td className="p-0" style={{ backgroundColor: isBelowMinimum(student.enrollment_no) ? '#ffcdd2' : '#f0f7ff' }}>
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
                            <td colSpan="3" className="text-start ps-3 fw-bold small text-uppercase" style={{ backgroundColor: '#cfe2f3' }}>NUMBER OF STUDENTS APPEARED</td>
                            <td className="label-col-cell" style={{ backgroundColor: '#cfe2f3' }}></td>
                            {attainmentStats.appeared.map((val, i) => (
                              <td key={i} className="fw-bold small" style={{ backgroundColor: '#e9f2fb' }}>{val}</td>
                            ))}
                            <td className="bg-light"></td>
                            <td className="fw-bold small text-primary" style={{ backgroundColor: '#f8f9fa' }}>
                              {Object.keys(attainmentStats.coStats).reduce((max, co) => Math.max(max, attainmentStats.coAttainmentLevels[co].appeared), 0)}
                            </td>
                          </tr>
                          <tr className="bg-light">
                            <td colSpan="3" className="text-start ps-3 fw-bold small text-uppercase" style={{ backgroundColor: '#cfe2f3' }}>NUMBER OF STUDENTS GETTING EQUAL AND MORE THAN AVERAGE</td>
                            <td className="label-col-cell" style={{ backgroundColor: '#cfe2f3' }}></td>
                            {attainmentStats.equalOrMoreAvg.map((val, i) => (
                              <td key={i} className="fw-bold small" style={{ backgroundColor: '#cfe2f3' }}>{val}</td>
                            ))}
                            <td colSpan="2" style={{ backgroundColor: '#cfe2f3' }}></td>
                          </tr>
                          <tr className="bg-light">
                            <td colSpan="3" className="text-start ps-3 fw-bold small text-uppercase" style={{ backgroundColor: '#cfe2f3' }}>AVERAGE MARKS</td>
                            <td className="label-col-cell" style={{ backgroundColor: '#cfe2f3' }}></td>
                            {attainmentStats.averages.map((avg, i) => (
                              <td key={i} className="fw-bold small" style={{ backgroundColor: '#e9f2fb' }}>{avg.toFixed(2)}</td>
                            ))}
                            <td className="bg-light"></td>
                            <td className="fw-bold small" style={{ backgroundColor: '#e9f2fb' }}>{(attainmentStats.totalAverage || 0).toFixed(2)}</td>
                          </tr>
                          <tr className="bg-light">
                            <td colSpan="3" className="text-start ps-3 fw-bold small text-uppercase" style={{ backgroundColor: '#cfe2f3' }}>QUESTION-WISE ATTAINMENT (%)</td>
                            <td className="label-col-cell" style={{ backgroundColor: '#cfe2f3' }}></td>
                            {attainmentStats.percentMoreAvg.map((val, i) => (
                              <td key={i} className="fw-bold small" style={{ backgroundColor: '#e9f2fb' }}>{val}%</td>
                            ))}
                            <td className="bg-light"></td>
                            <td className="fw-bold small" style={{ backgroundColor: '#e9f2fb' }}>
                              {(() => {
                                const avg = attainmentStats.totalAverage || 0;
                                const totalWeight = parseFloat(totalMaxMarks) || 30;
                                const percent = totalWeight > 0 ? (avg / totalWeight) * 100 : 0;
                                return percent.toFixed(2);
                              })()}%
                            </td>
                          </tr>
                          <tr className="bg-light">
                            <td colSpan="3" className="text-start ps-3 fw-bold small text-uppercase" style={{ backgroundColor: '#cfe2f3' }}>QUESTION-WISE ATTAINMENT LEVEL</td>
                            <td className="label-col-cell" style={{ backgroundColor: '#cfe2f3' }}></td>
                            {attainmentStats.columnAttainmentLevels.map((val, i) => {
                              const percent = ((parseFloat(val) / 3) * 100).toFixed(2);


                              return (
                                <td key={i} className="fw-bold small" style={{ backgroundColor: '#b4c7e7' }}>
                                  {val} ({percent}%)
                                </td>
                              );
                            })}
                            <td colSpan="2" style={{ backgroundColor: '#b4c7e7' }}></td>
                          </tr>
                        </tbody>

                      </table>
                      <div className='mt-4 overflow-hidden border rounded shadow-sm'>
                        <table className='table table-bordered table-sm mb-0'>
                          <thead>
                            <tr style={{ backgroundColor: '#1a4e8a', color: 'white' }}>
                              <th className='py-2 text-uppercase'>CO Statement</th>
                              <th className='py-2 text-uppercase'>Students Appeared</th>
                              <th className='py-2 text-uppercase'>Attainment (%)</th>
                              <th className='py-2 text-uppercase'>Attainment Level (0-3)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(attainmentStats.coAttainmentLevels).sort().map(([co, stats]) => (
                              <tr key={co}>
                                <td className='fw-bold'>{formatCO(co)}</td>
                                <td>{stats.appeared}</td>
                                <td className='fw-bold text-primary'>{stats.percent}%</td>
                                <td className='fw-bold' style={{ backgroundColor: '#e9f2fb' }}>{stats.level}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div> {renderActionFooter()}
                  </>
                )}

                {(selectedTool === 'SLA' || selectedTool.startsWith('SLA-')) && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h4 className="test-title text-start fs-5 fw-bold mb-0" style={{ color: '#2c3e50' }}>Self Learning Assessment (SLA)</h4>
                      <div className="d-flex align-items-center gap-4 pe-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Min Passing:</span>
                          <input
                            type="number"
                            className="form-control form-control-sm fw-bold text-center"
                            style={{ width: '60px', backgroundColor: viewMode === 'view' ? '#f8f9fa' : 'white' }}
                            value={minPassingMarks}
                            readOnly={viewMode === 'view'}
                            onChange={(e) => setMinPassingMarks(parseFloat(e.target.value) || 0)}
                          />
                        </div>
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
                              <td className="bg-light">{student.enrollment_no}</td>
                              <td className="bg-light">{student.roll_no}</td>
                              <td className="text-start ps-3 bg-light">{student.name}</td>
                              <td style={{ backgroundColor: '#6c8ebf' }}></td>
                              {questions.map((_, colIndex) => (
                                <td key={colIndex} className="p-0">
                                  {viewMode === 'view' ? (
                                    <div className="p-2 text-center fw-bold">
                                      {marksData[student.enrollment_no]?.[colIndex] !== undefined && marksData[student.enrollment_no]?.[colIndex] !== '' && marksData[student.enrollment_no]?.[colIndex] !== null ? marksData[student.enrollment_no]?.[colIndex] : '-'}
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      className="form-control border-0 text-center table-input shadow-none"
                                      style={{ borderRadius: 0 }}
                                      value={marksData[student.enrollment_no]?.[colIndex] !== undefined && marksData[student.enrollment_no]?.[colIndex] !== null ? marksData[student.enrollment_no]?.[colIndex] : ''}
                                      onChange={(e) => handleMarkChange(student.enrollment_no, colIndex, e.target.value)}
                                      data-type="mark"
                                      data-row={rowIndex}
                                      data-col={colIndex}
                                      onKeyDown={(e) => handleKeyDown(e, 'mark', rowIndex, colIndex)}
                                    />
                                  )}
                                </td>
                              ))}
                              <td className="bg-light"></td>
                              <td className="p-0" style={{ backgroundColor: isBelowMinimum(student.enrollment_no) ? '#ffcdd2' : '#f0f7ff' }}>
                                <input
                                  type="text"
                                  className="form-control border-0 text-center table-input shadow-none bg-transparent fw-bold"
                                  style={{ borderRadius: 0 }}
                                  value={marksData[student.enrollment_no]?.['total'] !== undefined && marksData[student.enrollment_no]?.['total'] !== null ? marksData[student.enrollment_no]?.['total'] : '0'}
                                  readOnly
                                />
                              </td>
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
                            <td colSpan="3" className="text-start ps-3 fw-bold small text-uppercase" style={{ backgroundColor: '#cfe2f3' }}>QUESTION-WISE ATTAINMENT LEVEL</td>
                            <td className="label-col-cell" style={{ backgroundColor: '#cfe2f3' }}></td>
                            {attainmentStats.columnAttainmentLevels.map((val, i) => {
                              const percent = ((parseFloat(val) / 3) * 100).toFixed(2);
                              return (
                                <td key={i} className="fw-bold small" style={{ backgroundColor: '#b4c7e7' }}>
                                  {val} ({percent}%)
                                </td>
                              );
                            })}
                            <td colSpan="2"></td>
                          </tr>
                        </tbody>

                      </table>
                      <div className='mt-4 overflow-hidden border rounded shadow-sm'>
                        <table className='table table-bordered table-sm mb-0'>
                          <thead>
                            <tr style={{ backgroundColor: '#1a4e8a', color: 'white' }}>
                              <th className='py-2'>CO Statement</th>
                              <th className='py-2'>Students Appeared</th>
                              <th className='py-2'>Attainment (%)</th>
                              <th className='py-2'>Attainment Level (0-3)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(attainmentStats.coAttainmentLevels).sort().map(([co, stats]) => (
                              <tr key={co}>
                                <td className='fw-bold'>{formatCO(co)}</td>
                                <td>{stats.appeared}</td>
                                <td className='fw-bold text-primary'>{stats.percent}%</td>
                                <td className='fw-bold' style={{ backgroundColor: '#e9f2fb' }}>{stats.level}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div> {renderActionFooter()}
                  </>
                )}

                {selectedTool === 'FA-PR' && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h4 className="test-title text-start fs-5 fw-bold mb-0" style={{ color: '#2c3e50' }}>FA PR (K3) - Manual Practical Assessment</h4>
                      <div className="d-flex align-items-center gap-4 pe-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Min Passing:</span>
                          <input
                            type="number"
                            className="form-control form-control-sm fw-bold text-center"
                            style={{ width: '60px', backgroundColor: viewMode === 'view' ? '#f8f9fa' : 'white' }}
                            value={minPassingMarks}
                            readOnly={viewMode === 'view'}
                            onChange={(e) => setMinPassingMarks(parseFloat(e.target.value) || 0)}
                          />
                        </div>
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
                              <td className="bg-light">{student.enrollment_no}</td>
                              <td className="bg-light">{student.roll_no}</td>
                              <td className="text-start ps-3 bg-light">{student.name}</td>
                              <td style={{ backgroundColor: '#6c8ebf' }}></td>
                              {questions.map((_, colIndex) => (
                                <td key={colIndex} className="p-0">
                                  {viewMode === 'view' ? (
                                    <div className="p-2 text-center fw-bold">
                                      {marksData[student.enrollment_no]?.[colIndex] !== undefined && marksData[student.enrollment_no]?.[colIndex] !== '' && marksData[student.enrollment_no]?.[colIndex] !== null ? marksData[student.enrollment_no]?.[colIndex] : '-'}
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      className="form-control border-0 text-center table-input shadow-none"
                                      style={{ borderRadius: 0 }}
                                      value={marksData[student.enrollment_no]?.[colIndex] !== undefined && marksData[student.enrollment_no]?.[colIndex] !== null ? marksData[student.enrollment_no]?.[colIndex] : ''}
                                      onChange={(e) => handleMarkChange(student.enrollment_no, colIndex, e.target.value)}
                                      data-type="mark"
                                      data-row={rowIndex}
                                      data-col={colIndex}
                                      onKeyDown={(e) => handleKeyDown(e, 'mark', rowIndex, colIndex)}
                                    />
                                  )}
                                </td>
                              ))}
                              <td className="bg-light"></td>
                              <td className="p-0" style={{ backgroundColor: isBelowMinimum(student.enrollment_no) ? '#ffcdd2' : '#f0f7ff' }}>
                                <input
                                  type="text"
                                  className="form-control border-0 text-center table-input shadow-none bg-transparent fw-bold"
                                  style={{ borderRadius: 0 }}
                                  value={marksData[student.enrollment_no]?.['total'] !== undefined && marksData[student.enrollment_no]?.['total'] !== null ? marksData[student.enrollment_no]?.['total'] : '0'}
                                  readOnly
                                />
                              </td>
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
                            <td colSpan="3" className="text-start ps-3 fw-bold small text-uppercase" style={{ backgroundColor: '#cfe2f3' }}>QUESTION-WISE ATTAINMENT LEVEL</td>
                            <td className="label-col-cell" style={{ backgroundColor: '#cfe2f3' }}></td>
                            {attainmentStats.columnAttainmentLevels.map((val, i) => {
                              const percent = ((parseFloat(val) / 3) * 100).toFixed(2);


                              return (
                                <td key={i} className="fw-bold small" style={{ backgroundColor: '#b4c7e7' }}>
                                  {val} ({percent}%)
                                </td>
                              );
                            })}
                            <td colSpan="2" style={{ backgroundColor: '#b4c7e7' }}></td>
                          </tr>
                        </tbody>
                      </table>
                      <div className='mt-4 overflow-hidden border rounded shadow-sm'>
                        <table className='table table-bordered table-sm mb-0'>
                          <thead>
                            <tr style={{ backgroundColor: '#1a4e8a', color: 'white' }}>
                              <th className='py-2'>CO Statement</th>
                              <th className='py-2'>Students Appeared</th>
                              <th className='py-2'>Attainment (%)</th>
                              <th className='py-2'>Attainment Level (0-3)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(attainmentStats.coAttainmentLevels).sort().map(([co, stats]) => (
                              <tr key={co}>
                                <td className='fw-bold'>{formatCO(co)}</td>
                                <td>{stats.appeared}</td>
                                <td className='fw-bold text-primary'>{stats.percent}%</td>
                                <td className='fw-bold' style={{ backgroundColor: '#e9f2fb' }}>{stats.level}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {renderActionFooter("Please upload practical records as evidence.")}
                  </>
                )}

                {(selectedTool === 'SA-TH' || selectedTool === 'SA-PR') && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h4 className="test-title text-start fs-5 fw-bold mb-0" style={{ color: '#2c3e50' }}>{selectedTool === 'SA-TH' ? 'Summative Assessment (Theory)' : 'Summative Assessment (Practical)'}</h4>
                      <div className="d-flex align-items-center gap-4">
                        <div className="d-flex align-items-center gap-2">
                          <span className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Min Passing:</span>
                          <input
                            type="number"
                            className="form-control form-control-sm fw-bold text-center"
                            style={{ width: '60px', backgroundColor: viewMode === 'view' ? '#f8f9fa' : 'white' }}
                            value={minPassingMarks}
                            readOnly={viewMode === 'view'}
                            onChange={(e) => setMinPassingMarks(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Max Total:</span>
                          <span className="fw-bold fs-5 px-2" title="Configured in Course Management">{totalMaxMarks}</span>
                        </div>
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
                              <td className="p-0" style={{ backgroundColor: isBelowMinimum(student.enrollment_no) ? '#ffcdd2' : 'transparent' }}>
                                {viewMode === 'view' ? (
                                  <div className="p-2 text-center fw-bold">
                                    {marksData[student.enrollment_no]?.[0] !== undefined && marksData[student.enrollment_no]?.[0] !== '' && marksData[student.enrollment_no]?.[0] !== null ? marksData[student.enrollment_no]?.[0] : '-'}
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    className="form-control border-0 text-center shadow-none fw-bold text-center bg-transparent"
                                    value={marksData[student.enrollment_no]?.[0] !== undefined && marksData[student.enrollment_no]?.[0] !== null ? marksData[student.enrollment_no]?.[0] : ''}
                                    onChange={(e) => handleMarkChange(student.enrollment_no, 0, e.target.value)}
                                    data-type="mark"
                                    data-row={rowIndex}
                                    data-col={0}
                                    onKeyDown={(e) => handleKeyDown(e, 'mark', rowIndex, 0)}
                                  />
                                )}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-light">
                            <td colSpan="3" className="text-start ps-3 fw-bold small text-uppercase" style={{ backgroundColor: '#cfe2f3' }}>QUESTION-WISE ATTAINMENT LEVEL</td>
                            <td className="fw-bold small" style={{ backgroundColor: '#b4c7e7' }}>
                              {(() => {
                                const val = attainmentStats.columnAttainmentLevels[0] || '0.00';
                                const percent = ((parseFloat(val) / 3) * 100).toFixed(2);
                                return `${val} (${percent}%)`;
                              })()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div className='mt-4 overflow-hidden border rounded shadow-sm'>
                        <table className='table table-bordered table-sm mb-0'>
                          <thead>
                            <tr style={{ backgroundColor: '#1a4e8a', color: 'white' }}>
                              <th className='py-2'>CO Statement</th>
                              <th className='py-2'>Students Appeared</th>
                              <th className='py-2'>Attainment (%)</th>
                              <th className='py-2'>Attainment Level (0-3)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(attainmentStats.coAttainmentLevels).sort().map(([co, stats]) => (
                              <tr key={co}>
                                <td className='fw-bold'>{formatCO(co)}</td>
                                <td>{stats.appeared}</td>
                                <td className='fw-bold text-primary'>{stats.percent}%</td>
                                <td className='fw-bold' style={{ backgroundColor: '#e9f2fb' }}>{stats.level}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {renderActionFooter(selectedTool === 'SA-TH' ? "Please upload 3-5 sample theory papers." : "Please upload practical exam records.")}
                  </>
                )}
              </div>
            </>
          )}

          {showAtrModal && (
            <div className="oit-modal-overlay">
              <div className="oit-modal-content" style={{ maxWidth: '600px' }}>
                <div className="oit-modal-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold">Action Taken Report (ATR) Required</h5>
                  <button className="btn-close" onClick={() => setShowAtrModal(false)}></button>
                </div>
                <div className="oit-modal-body">
                  <p className="text-danger fw-bold mb-3">
                    <FaExclamationCircle className="me-2" />
                    Overall Attainment gaps detected for: {pendingAtrCos.map(c => String(c).toUpperCase().startsWith('CO') ? c : `CO${c}`).join(', ')}
                  </p>

                  <div className="mb-4">
                    <label className="form-label fw-bold small text-uppercase mb-2">Proposed Actions for Course Improvement</label>
                    <textarea
                      className="form-control"
                      placeholder="Enter a consolidated action plan to address these attainment gaps..."
                      rows="4"
                      id="consolidated-atr-text"
                    ></textarea>
                    <div className="text-end mt-3">
                      <button
                        className="btn btn-primary px-4 fw-bold"
                        disabled={atrSubmitLoading}
                        onClick={() => {
                          const txt = document.getElementById('consolidated-atr-text').value;
                          if (!txt.trim()) return alert("Please enter action taken text.");
                          submitAtr(txt);
                        }}
                      >
                        {atrSubmitLoading ? 'Submitting...' : 'Submit Consolidated ATR'}
                      </button>
                    </div>
                  </div>
                  <p className="small text-muted">
                    Note: This action plan applies to the entire course for {selectedYear}. A direct attainment report will be generated upon submission.
                  </p>
                </div>
                <div className="oit-modal-footer">
                  <button className="btn btn-secondary w-100" onClick={() => setShowAtrModal(false)}>Ask me later</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Cisentry;


