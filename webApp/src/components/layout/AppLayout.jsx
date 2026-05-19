import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useUI } from '../../context/UIContext';

const AppLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const scrollRef = useRef(null);
  const { testMode } = useUI();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen">
      {!testMode && <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />}
      <div ref={scrollRef} className="flex-1 flex flex-col overflow-y-auto h-screen">
        {!testMode && <Topbar />}
        <div className={testMode ? 'p-0 w-full h-full' : 'p-8 w-full max-w-[1200px] mx-auto'}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
