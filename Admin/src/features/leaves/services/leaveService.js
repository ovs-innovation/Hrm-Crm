import axios from 'axios';

const API_URL = 'http://localhost:5000/api/leaves';

export const leaveService = {
  getLeaves: async () => {
    try {
      const response = await axios.get(API_URL, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('Error fetching leaves:', error);
      throw error;
    }
  },

  updateLeaveStatus: async (id, status) => {
    try {
      const response = await axios.patch(`${API_URL}/${id}`, { status }, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error(`Error updating leave status for ${id}:`, error);
      throw error;
    }
  }
};
