import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import CommandPalette from '../components/CommandPalette';
import Receptionist from '../components/Receptionist';
import ContextCopilot from '../components/ContextCopilot';
import { SocketProvider } from '../context/SocketContext';

const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const workspace = location.pathname.startsWith('/workspace');

  return (
    <SocketProvider>
      <div className="app-shell flex min-h-screen w-full bg-canvas">
        <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-[220px]">
          <Header toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
          <main className={workspace ? 'min-h-0 flex-1 overflow-hidden bg-white' : 'flex-1 overflow-x-hidden bg-canvas'}>
            <Outlet />
          </main>
        </div>
        <CommandPalette />
        <Receptionist />
        <ContextCopilot />
      </div>
    </SocketProvider>
  );
};

export default DashboardLayout;
