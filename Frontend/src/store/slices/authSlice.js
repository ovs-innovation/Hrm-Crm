import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: localStorage.getItem('employeeUser') ? JSON.parse(localStorage.getItem('employeeUser')) : null,
  token: localStorage.getItem('employeeToken') || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('employeeUser', JSON.stringify(action.payload.user));
      localStorage.setItem('employeeToken', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('employeeUser');
      localStorage.removeItem('employeeToken');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
