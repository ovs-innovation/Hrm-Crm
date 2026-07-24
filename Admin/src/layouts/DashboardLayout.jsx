import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="app-shell flex min-h-screen w-full">
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-[220px]">
        <Header toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="flex-1 overflow-x-hidden bg-canvas">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
