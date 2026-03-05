import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Question from './Question';
import {
    getSurveyQuestions,
    submitStressResponses,
    generateAnonymousToken
} from '../../../../services/stressService';

const QuestionPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const surveyId = location.state?.surveyId || 2;
    const [questions, setQuestions] = useState([]);
    const [token, setToken] = useState(null);

    const OPTION_SET = [
        { id: 1, value: 0, label: 'Never', emoji: '😊' },
        { id: 2, value: 1, label: 'Rarely', emoji: '😐' },
        { id: 3, value: 2, label: 'Sometimes', emoji: '😟' },
        { id: 4, value: 3, label: 'Often', emoji: '😰' },
        { id: 5, value: 4, label: 'Always', emoji: '😭' }
    ];

    useEffect(() => {
        const initSurvey = async () => {
            try {
                if (!surveyId) {
                    navigate('/stress/welcome', { replace: true });
                    return;
                }

                const tokenRes = await generateAnonymousToken(surveyId);
                setToken(tokenRes.data.token);

                const qRes = await getSurveyQuestions(surveyId);
                const normalizedQuestions = qRes.data.questions.map(q => ({
                    id: q.question_id,
                    text: q.question_text,
                    category: q.category_name,
                    isReverse: q.is_reverse,
                    options: OPTION_SET
                }));
                setQuestions(normalizedQuestions);
            } catch (err) {
                console.error('Error initializing survey:', err);
                setQuestions([]);
            }
        };

        initSurvey();
    }, [surveyId, navigate]);

    const handleSubmitAnswers = async (answers) => {
        try {
            const payload = {
                survey_id: surveyId,
                token: token,
                responses: Object.entries(answers).map(([qId, val]) => ({
                    question_id: Number(qId),
                    response_value: Number(val)
                }))
            };

            const response = await submitStressResponses(payload);
            const result = response.data;

            navigate('/stress/exit', { state: { surveyId, result } });
        } catch (err) {
            console.error('Error submitting answers:', err);
            alert('Submit failed. Check console.');
        }
    };

    return <Question key={surveyId} questions={questions} onSubmit={handleSubmitAnswers} />;
};

export default QuestionPage;
