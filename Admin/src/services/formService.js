import api from './api';

export const getFormSubmissions = async (params = {}) => {
  const { data } = await api.get('/forms', { params });
  return data;
};

export const getFormSubmissionById = async (id) => {
  const { data } = await api.get(`/forms/${id}`);
  return data;
};

export const updateFormStatus = async (id, status, internalNotes) => {
  const { data } = await api.put(`/forms/${id}/status`, { status, internalNotes });
  return data;
};

export const deleteFormSubmission = async (id) => {
  const { data } = await api.delete(`/forms/${id}`);
  return data;
};

