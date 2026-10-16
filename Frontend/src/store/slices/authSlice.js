import { createSlice } from '@reduxjs/toolkit';

const safeParse = (raw) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const initialState = {
  user: safeParse(localStorage.getItem('employeeUser')),
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
      localStorage.setItem('employeeToken', action.payload.token || 'session');
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
