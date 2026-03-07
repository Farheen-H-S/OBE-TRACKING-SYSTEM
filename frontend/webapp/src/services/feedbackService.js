import axios from '../utils/axios';

export const getFeedbackSurveys = (params) => {
    return axios.get('/surveys/', { params: { ...params, survey_category: 'feedback' } });
};

export const createFeedbackSurvey = (payload) =>
    axios.post('/surveys/', { ...payload, survey_category: 'feedback' });

export const updateFeedbackSurvey = (id, payload) =>
    axios.patch(`/surveys/${id}/`, payload);

const SURVEY_BASE = '/surveys/';

export const getFeedbackResponses = (surveyId) => axios.get(`${SURVEY_BASE}${surveyId}/responses/`);
export const getSurveyDetail = (surveyId) => axios.get(`${SURVEY_BASE}${surveyId}/`);
export const submitFeedbackResponse = (data) => axios.post(`${SURVEY_BASE}respond/`, data);

export const exportFeedbackReport = (surveyId) => {
    // Note: Backend might need to support generic survey export.
    // Fallback to CSV export in frontend if backend doesn't support .xlsx for generic surveys.
    return axios.get(`/surveys/${surveyId}/export/`, {
        responseType: 'blob'
    });
};
