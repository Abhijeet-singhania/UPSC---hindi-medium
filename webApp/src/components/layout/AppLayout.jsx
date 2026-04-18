import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AppLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="flex-1 flex flex-col overflow-y-auto h-screen">
        <Topbar />
        <div className="p-8 w-full max-w-[1200px] mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
