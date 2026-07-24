import api from '../../../services/api';

const mapId = (item) => ({
  ...item,
  id: item.id || item._id,
});

export const orgService = {
  getDepartments: async () => {
    const { data } = await api.get('/departments');
    return data.map(mapId);
  },
  createDepartment: async (payload) => {
    const { data } = await api.post('/departments', payload);
    return mapId(data);
  },
  updateDepartment: async (id, payload) => {
    const { data } = await api.put(`/departments/${id}`, payload);
    return mapId(data);
  },
  deleteDepartment: async (id) => {
    await api.delete(`/departments/${id}`);
  },
  getDesignations: async () => {
    const { data } = await api.get('/designations');
    return data.map(mapId);
  },
  createDesignation: async (payload) => {
    const { data } = await api.post('/designations', payload);
    return mapId(data);
  },
  updateDesignation: async (id, payload) => {
    const { data } = await api.put(`/designations/${id}`, payload);
    return mapId(data);
  },
  deleteDesignation: async (id) => {
    await api.delete(`/designations/${id}`);
  },
};
