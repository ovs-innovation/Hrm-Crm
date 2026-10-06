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
    patchUser: (state, action) => {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('employeeUser', JSON.stringify(state.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('employeeUser');
      localStorage.removeItem('employeeToken');
    },
  },
});

export const { setCredentials, patchUser, logout } = authSlice.actions;
export default authSlice.reducer;
