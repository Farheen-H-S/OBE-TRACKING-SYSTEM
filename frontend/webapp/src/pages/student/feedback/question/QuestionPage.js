import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Question from './Question';
import { getSurveyDetail, submitFeedbackResponse } from '../../../../services/feedbackService';
import api from '../../../../utils/axios';

const QuestionPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const surveyId = location.state?.surveyId;
    const [questions, setQuestions] = useState([]);
    const [surveyInfo, setSurveyInfo] = useState(null);

    const initSurvey = useCallback(async () => {
        try {
            if (!surveyId) {
                navigate('/student/feedback/welcome', { replace: true });
                return;
            }

            const res = await getSurveyDetail(surveyId);
            const surveyData = res.data;
            setSurveyInfo(surveyData);

            const rawQuestions = surveyData.questions || [];

            // 1. Try grouping by existing "Teacher | Statement" format
            let groupedMap = {};
            let isMatrixified = false;

            rawQuestions.forEach(q => {
                const parts = q.question_text.split('|');
                if (parts.length >= 2) {
                    isMatrixified = true;
                    const teacherName = parts[0].trim();
                    const statement = parts.slice(1).join('|').trim();

                    if (!groupedMap[statement]) {
                        groupedMap[statement] = [];
                    }
                    groupedMap[statement].push({
                        id: q.question_id,
                        teacherName: teacherName
                    });
                }
            });

            // 2. If not matrixified, fetch teachers and force matrix for EVERYTHING
            // This handles older surveys or surveys approved before matrix fix
            if (!isMatrixified && rawQuestions.length > 0) {
                const programId = surveyData.program_id;
                // Fetch faculty for this department
                const usersRes = await api.get(`/users/?role=Faculty&department=${programId}`);
                const teachersList = usersRes.data.results || usersRes.data || [];

                if (teachersList.length > 0) {
                    rawQuestions.forEach(q => {
                        const statement = q.question_text.trim();
                        // Special handling: We use a composite key for localized answer state in Question.js
                        groupedMap[statement] = teachersList.map(t => ({
                            id: `${q.question_id}_t${t.user_id || t.id}`, // Virtual unique ID for frontend
                            realQuestionId: q.question_id,
                            teacherName: t.name
                        }));
                    });
                }
            }

            // Convert to format for Question component
            const matrixQuestions = Object.entries(groupedMap).map(([stmt, teachers], index) => ({
                id: `stmt_${index}`,
                text: stmt,
                teachers: teachers, // array of {id, teacherName}
                options: [1, 2, 3, 4, 5]
            }));

            // Final fallback
            const finalQuestions = matrixQuestions.length > 0
                ? matrixQuestions
                : rawQuestions.map(q => ({
                    id: q.question_id,
                    text: q.question_text,
                    options: [1, 2, 3, 4, 5]
                }));

            setQuestions(finalQuestions);
        } catch (err) {
            console.error('Error initializing survey:', err);
            setQuestions([]);
        }
    }, [surveyId, navigate]);

    useEffect(() => {
        initSurvey();
    }, [initSurvey]);

    const handleSubmitAnswers = async (answers) => {
        try {
            const responses = Object.entries(answers).map(([qId, val]) => {
                // Handle virtual IDs like "123_t456" from on-the-fly matrix
                const realId = qId.includes('_t') ? qId.split('_t')[0] : qId;
                return {
                    question_id: Number(realId),
                    answer_value: Number(val)
                };
            });

            const payload = {
                survey_id: surveyId,
                answers: responses // Backend SubmitSurveyResponseView expects 'answers'
            };

            await submitFeedbackResponse(payload);
            navigate('/student/feedback/exit', { state: { surveyId, surveyName: surveyInfo?.survey_name } });
        } catch (err) {
            console.error('Error submitting answers:', err);
            alert('Submission failed. Please check your connection.');
        }
    };

    return <Question key={surveyId} questions={questions} onSubmit={handleSubmitAnswers} title="Teacher Feedback" />;
};

export default QuestionPage;
