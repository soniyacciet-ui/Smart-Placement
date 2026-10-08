import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  FiHome, FiUploadCloud, FiPieChart, FiTrendingUp, FiUsers, FiUserCheck,
  FiSettings, FiLogOut, FiBookOpen, FiBriefcase, FiCheckSquare,
  FiActivity, FiTarget, FiGrid
} from 'react-icons/fi';

const Sidebar = ({ isCollapsed }) => {
  const { user, setUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  const role = user.role;

  const navItems = [
    // ============ ADMIN ONLY ============
    { label: 'Admin Dashboard', path: '/admin', icon: <FiGrid />, roles: ['Admin'] },
    { label: 'User Management', path: '/admin/users', icon: <FiUsers />, roles: ['Admin'] },
    { label: 'Create User', path: '/admin/create-user', icon: <FiUserCheck />, roles: ['Admin'] },

    // ============ IMPORT (Admin + Dept Users) ============
    { label: 'Import Students', path: '/admin/import', icon: <FiUploadCloud />, roles: ['Admin', 'HOD/Admin', 'Faculty/Trainer', 'Placement Officer'] },
    { label: 'Import History', path: '/admin/import-history', icon: <FiActivity />, roles: ['Admin', 'HOD/Admin', 'Faculty/Trainer', 'Placement Officer'] },

    // ============ EXISTING NAVIGATION ============
    { label: 'Dashboard', path: '/dashboard', icon: <FiHome />, roles: ['Student', 'Placement Officer', 'Faculty/Trainer', 'HOD/Admin', 'Recruiter'] },
    { label: 'Upload JD', path: '/jd-upload', icon: <FiUploadCloud />, roles: ['Placement Officer', 'HOD/Admin'] },
    { label: 'Upload Resume', path: '/resume-upload', icon: <FiUploadCloud />, roles: ['Student'] },
    { label: 'Batch Diagnosis', path: '/segmentation', icon: <FiPieChart />, roles: ['Placement Officer', 'HOD/Admin', 'Faculty/Trainer'] },
    { label: 'Blocker Fingerprint', path: '/blockers', icon: <FiActivity />, roles: ['Placement Officer', 'HOD/Admin', 'Faculty/Trainer'] },
    { label: 'Recovery Engine', path: '/recovery', icon: <FiTrendingUp />, roles: ['Placement Officer', 'HOD/Admin'] },
    { label: 'What-if Simulator', path: '/simulator', icon: <FiTarget />, roles: ['Placement Officer', 'HOD/Admin', 'Faculty/Trainer'] },
    { label: 'Resource Optimizer', path: '/optimizer', icon: <FiSettings />, roles: ['Placement Officer', 'HOD/Admin', 'Faculty/Trainer'] },
    { label: 'Intervention Plan', path: '/plan', icon: <FiBookOpen />, roles: ['Student'] },
    { label: 'Why Not Me?', path: '/why-not-me', icon: <FiCheckSquare />, roles: ['Student'] },
    { label: 'Recruiter Memory', path: '/recruiter-memory', icon: <FiBriefcase />, roles: ['Placement Officer', 'HOD/Admin', 'Recruiter'] },
    { label: 'Verification', path: '/verification', icon: <FiCheckSquare />, roles: ['Placement Officer', 'HOD/Admin'] },
    { label: 'Drive Execution', path: '/drive-execution', icon: <FiUsers />, roles: ['Placement Officer', 'HOD/Admin', 'Recruiter'] },
    { label: 'Learning Loop', path: '/learning-loop', icon: <FiActivity />, roles: ['Placement Officer', 'HOD/Admin', 'Faculty/Trainer'] },
    { label: 'Missed Opportunity', path: '/missed-opportunity', icon: <FiTrendingUp />, roles: ['Placement Officer', 'HOD/Admin'] },
    { label: 'Curriculum Gap', path: '/curriculum-gap', icon: <FiPieChart />, roles: ['Placement Officer', 'HOD/Admin', 'Faculty/Trainer'] },
  ];

  return (
    <div
      className="d-flex flex-column"
      style={{
        width: isCollapsed ? '78px' : '260px',
        minHeight: '100vh',
        position: 'fixed',
        backgroundColor: 'var(--bg-sidebar)',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 1000,
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Logo Area */}
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ height: '70px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
      >
        <div className="d-flex align-items-center gap-2">
          <div
            className="d-flex align-items-center justify-content-center fw-bold text-white"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              fontSize: '0.9rem',
            }}
          >
            DX
          </div>
          {!isCollapsed && (
            <div className="text-white fw-bold" style={{ fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
              DRIVE-X
            </div>
          )}
        </div>
      </div>

      {/* Role Badge */}
      {!isCollapsed && (
        <div className="px-3 py-3">
          <div
            className="text-center fw-semibold"
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(79, 70, 229, 0.2)',
              border: '1px solid rgba(79, 70, 229, 0.3)',
              color: '#A5B4FC',
            }}
          >
            {role}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div
        className="flex-grow-1 overflow-auto px-3 pb-3"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {navItems.map((item) => {
          if (!item.roles.includes(role)) return null;
          const isActive = location.pathname === item.path;
          return (
            <div
              key={item.path}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              title={isCollapsed ? item.label : ''}
            >
              {item.icon}
              {!isCollapsed && <span>{item.label}</span>}
            </div>
          );
        })}
      </div>

      {/* Logout */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div
          className="sidebar-link"
          onClick={handleLogout}
          style={{ color: '#F87171' }}
          title={isCollapsed ? 'Logout' : ''}
        >
          <FiLogOut />
          {!isCollapsed && <span>Logout</span>}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;