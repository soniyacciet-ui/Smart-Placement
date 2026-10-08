import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="d-flex">
      <Sidebar isCollapsed={isCollapsed} />
      <div
        className="flex-grow-1 d-flex flex-column"
        style={{
          marginLeft: isCollapsed ? '78px' : '260px',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '100vh',
          backgroundColor: 'var(--bg-app)',
        }}
      >
        <Topbar toggleSidebar={toggleSidebar} />
        <main className="flex-grow-1 p-4">
          <div className="fade-in-up">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;