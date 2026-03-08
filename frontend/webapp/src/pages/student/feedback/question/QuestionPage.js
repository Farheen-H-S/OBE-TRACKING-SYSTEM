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
            setSurveyInfo(res.data);

            const rawQuestions = res.data.questions || [];

            // Group by Statement
            // Format: "Teacher Name | Statement"
            const groupedMap = {};

            rawQuestions.forEach(q => {
                const parts = q.question_text.split('|');
                if (parts.length >= 2) {
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

            // Convert to format for Question component
            const matrixQuestions = Object.entries(groupedMap).map(([stmt, teachers], index) => ({
                id: `stmt_${index}`,
                text: stmt,
                teachers: teachers, // array of {id, teacherName}
                options: [1, 2, 3, 4, 5]
            }));

            // Fallback for non-matrix surveys
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
            const payload = {
                survey_id: surveyId,
                // Generic survey module does not use anonymous tokens in the same way 
                // but requires student_id if logged in or handle as guest.
                // Assuming students are logged in based on other CIS modules.
                responses: Object.entries(answers).map(([qId, val]) => ({
                    question_id: Number(qId),
                    answer_value: Number(val)
                }))
            };

            await submitFeedbackResponse(payload);
            navigate('/student/feedback/exit', { state: { surveyId, surveyName: surveyInfo?.survey_name } });
        } catch (err) {
            console.error('Error submitting answers:', err);
            alert('Submission failed. Please ensure you are logged in.');
        }
    };

    return <Question key={surveyId} questions={questions} onSubmit={handleSubmitAnswers} title="Teacher Feedback" />;
};

export default QuestionPage;
