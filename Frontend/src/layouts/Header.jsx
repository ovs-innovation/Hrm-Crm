import React, { useState, useEffect } from 'react';
import { FiMenu, FiBell } from 'react-icons/fi';
import { useSelector } from 'react-redux';

const Header = ({ toggleMobileMenu }) => {
  const user = useSelector((state) => state.auth.user || { name: 'Employee', designation: 'Staff' });

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 18) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    };
    
    updateGreeting();
    const timer = setInterval(updateGreeting, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 sticky top-0 z-40 transition-colors">
      <div className="flex items-center gap-4">
        <button onClick={toggleMobileMenu} className="md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          <FiMenu className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white hidden sm:block">{greeting}, {user.name}!</h2>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <FiBell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user.name}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{user.designation || 'Employee'}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white font-bold flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800">
            {getInitials(user.name)}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
