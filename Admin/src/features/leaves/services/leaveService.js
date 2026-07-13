import api from '../../../services/api';

export const leaveService = {
  getLeaves: async () => {
    try {
      const response = await api.get('/leaves');
      return response.data;
    } catch (error) {
      console.error('Error fetching leaves:', error);
      throw error;
    }
  },

  updateLeaveStatus: async (id, status) => {
    try {
      const response = await api.patch(`/leaves/${id}`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating leave status for ${id}:`, error);
      throw error;
    }
  }
};
