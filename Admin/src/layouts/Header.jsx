import React from 'react';
import { FiMenu, FiBell, FiSearch, FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const Header = ({ toggleMobileMenu }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const adminInfo = useSelector((state) => state.auth.adminInfo || {});
  const adminName = adminInfo.name || 'Admin User';
  const adminRole = adminInfo.role || 'Super Admin';
  const initials = adminName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleLogout = async () => {
    try {
      await api.post('/auth/admin/logout', {});
      dispatch(logout());
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
      // Even if API fails, clear local storage and redirect
      dispatch(logout());
      navigate('/login');
    }
  };

  return (
    <header className="glass-panel border-b border-white/5 h-20 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4 w-1/2">
        <button onClick={toggleMobileMenu} className="md:hidden text-slate-300 hover:text-white transition-colors">
          <FiMenu className="w-6 h-6" />
        </button>
        <div className="relative w-full max-w-lg hidden sm:block">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search employees, projects..." 
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-800/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-slate-200 placeholder-slate-500 transition-all outline-none backdrop-blur-sm shadow-inner"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-5">
        <button className="relative p-2.5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800/60 transition-all border border-transparent hover:border-slate-700/50 group">
          <FiBell className="w-5 h-5 group-hover:animate-pulse-slow" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border border-slate-900 box-glow"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-5 border-l border-white/10">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-semibold text-slate-100">{adminName}</span>
            <span className="text-xs text-blue-400 tracking-wider uppercase font-medium">{adminRole}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white font-bold flex items-center justify-center border border-white/10 shadow-lg cursor-pointer hover:scale-105 transition-transform">
            {initials}
          </div>
          <button 
            onClick={handleLogout}
            className="ml-2 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Logout"
          >
            <FiLogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
