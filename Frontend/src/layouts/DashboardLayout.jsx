import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="dark">
      <div className="flex min-h-screen w-full overflow-x-hidden bg-slate-900 font-sans text-slate-100 transition-colors duration-200">
        <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
        <div className="flex-1 md:ml-64 flex flex-col min-h-screen min-w-0 overflow-hidden">
          <Header toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
          <main className="flex-1 p-6 lg:p-8 overflow-x-hidden w-full relative">
            {/* Bright decorative background elements */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-6xl mx-auto w-full relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
