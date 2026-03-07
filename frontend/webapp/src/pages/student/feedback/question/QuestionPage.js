import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Question from './Question';
import { getSurveyDetail, submitFeedbackResponse } from '../../../../services/feedbackService';

const QuestionPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const surveyId = location.state?.surveyId;
    const [questions, setQuestions] = useState([]);
    const [surveyInfo, setSurveyInfo] = useState(null);

    const OPTION_SET = [
        { id: 1, value: 1, label: 'Never', emoji: '😐' },
        { id: 2, value: 2, label: 'Rarely', emoji: '🙂' },
        { id: 3, value: 3, label: 'Sometimes', emoji: '😊' },
        { id: 4, value: 4, label: 'Often', emoji: '😃' },
        { id: 5, value: 5, label: 'Always', emoji: '🤩' }
    ];

    const initSurvey = useCallback(async () => {
        try {
            if (!surveyId) {
                navigate('/student/feedback/welcome', { replace: true });
                return;
            }

            const res = await getSurveyDetail(surveyId);
            setSurveyInfo(res.data);

            const normalizedQuestions = (res.data.questions || []).map(q => ({
                id: q.question_id,
                text: q.question_text,
                options: OPTION_SET
            }));

            setQuestions(normalizedQuestions);
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
