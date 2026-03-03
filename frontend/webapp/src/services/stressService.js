import axios from '../utils/axios';

export const getSurveyQuestions = (surveyId) =>
    axios.get(`/stress/surveys/${surveyId}/questions/`);

export const submitStressResponses = (payload) =>
    axios.post(`/stress/responses/`, payload);

export const generateAnonymousToken = (surveyId) =>
    axios.post(`/stress/surveys/${surveyId}/public-entry/`);

export const getStressSurveys = (year = null) => {
    const params = year ? { year } : {};
    return axios.get('/stress/surveys/', { params });
};


export const createStressSurvey = (payload) =>
    axios.post('/stress/surveys/', payload);

export const getStressQuestionSets = () =>
    axios.get('/stress/question-sets/');

export const updateStressSurvey = (id, payload) =>
    axios.patch(`/stress/surveys/${id}/`, payload);

export const updateStressQuestion = (id, payload) =>
    axios.patch(`/stress/questions/${id}/`, payload);

export const exportStressReport = (surveyId) => {
    return axios.get(`/stress/surveys/${surveyId}/export/`, {
        responseType: 'blob'
    });
};

export const previewReport = (surveyId) => {
    return axios.get(`/stress/surveys/${surveyId}/preview/`);
};
