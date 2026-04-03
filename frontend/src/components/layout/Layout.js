import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      
      {/* Sidebar */}
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content */}
      <div className="main-content">
        
        {/* Topbar (Menu Button Opens Sidebar) */}
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>

      </div>
    </div>
  );
}