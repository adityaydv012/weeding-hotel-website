
import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import AdminHeader from './AdminHeader.jsx';
import AdminSidebar from './AdminSidebar.jsx';

export default function AdminLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const handleOpenSidebar = () => {
    setMobileSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f7f3ed]">
      {/* Sidebar */}
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onClose={handleCloseSidebar}
      />

      {/* Main application area */}
      <div className="min-h-screen lg:pl-[270px]">
        {/* Top header */}
        <AdminHeader
          onMenuClick={handleOpenSidebar}
        />

        {/* Active page rendered by React Router */}
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
