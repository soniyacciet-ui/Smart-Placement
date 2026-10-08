import React from 'react';
import { useApp } from '../context/AppContext';
import { FiBell, FiSearch, FiUser, FiMenu, FiChevronDown } from 'react-icons/fi';

const Topbar = ({ toggleSidebar }) => {
  const { user } = useApp();

  if (!user) return null;

  return (
    <header
      className="d-flex align-items-center justify-content-between px-4"
      style={{
        height: '70px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 999,
      }}
    >
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-light btn-sm d-flex align-items-center justify-content-center"
          onClick={toggleSidebar}
          style={{ width: '36px', height: '36px', padding: 0, borderRadius: '8px' }}
        >
          <FiMenu size={18} />
        </button>

        <div className="position-relative d-none d-md-block">
          <FiSearch
            className="position-absolute text-muted"
            style={{ left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px' }}
          />
          <input
            type="text"
            className="form-control ps-5"
            placeholder="Search drives, students, companies..."
            style={{
              width: '340px',
              height: '38px',
              backgroundColor: 'var(--slate-100)',
              border: '1px solid transparent',
              fontSize: '0.85rem',
            }}
          />
        </div>
      </div>

      <div className="d-flex align-items-center gap-2">
        {/* Notifications */}
        <button
          className="btn btn-light position-relative d-flex align-items-center justify-content-center"
          style={{ width: '38px', height: '38px', padding: 0, borderRadius: '10px' }}
        >
          <FiBell size={17} />
          <span
            className="position-absolute"
            style={{
              top: '8px',
              right: '9px',
              width: '8px',
              height: '8px',
              backgroundColor: 'var(--danger)',
              borderRadius: '50%',
              border: '2px solid white',
            }}
          ></span>
        </button>

        {/* Profile */}
        <div
          className="d-flex align-items-center gap-2 ps-3"
          style={{ borderLeft: '1px solid var(--border-color)' }}
        >
          <div
            className="d-flex align-items-center justify-content-center text-white fw-bold"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              fontSize: '0.85rem',
            }}
          >
            {user.role?.charAt(0) || 'U'}
          </div>
          <div className="d-none d-md-block">
            <div className="fw-semibold" style={{ fontSize: '0.82rem', lineHeight: 1.2 }}>
              {user.role}
            </div>
            <div className="text-muted" style={{ fontSize: '0.72rem' }}>
              {user.email || 'user@drivex.com'}
            </div>
          </div>
          <FiChevronDown size={16} className="text-muted d-none d-md-block" />
        </div>
      </div>
    </header>
  );
};

export default Topbar;