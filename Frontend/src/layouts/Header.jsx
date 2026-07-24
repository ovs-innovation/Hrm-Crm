import React, { useState, useEffect } from 'react';
import { FiMenu } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import NotificationBell from '../components/NotificationBell';

const Header = ({ toggleMobileMenu }) => {
  const user = useSelector((state) => state.auth.user || { name: 'Employee', designation: 'Staff' });
  const initials = (user.name || 'E').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const update = () => {
      const h = new Date().getHours();
      if (h < 12) setGreeting('Good morning');
      else if (h < 18) setGreeting('Good afternoon');
      else setGreeting('Good evening');
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-11 items-center justify-between border-b border-line bg-surface px-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={toggleMobileMenu} className="rounded p-1.5 text-muted hover:bg-soft md:hidden" aria-label="Menu">
          <FiMenu className="h-[18px] w-[18px]" />
        </button>
        <p className="text-[13px] font-semibold text-ink">{greeting}, {user.name?.split(' ')[0]}</p>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="flex items-center gap-2 border-l border-line pl-2">
          <div className="hidden text-right sm:block">
            <p className="text-[13px] font-medium text-ink">{user.name}</p>
            <p className="text-[11px] text-muted">{user.designation || user.department || 'Employee'}</p>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded bg-brand text-[10px] font-semibold text-white">{initials}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
