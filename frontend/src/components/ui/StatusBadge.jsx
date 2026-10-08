import React from 'react';
import { FiCheckCircle, FiAlertTriangle, FiXCircle, FiClock, FiInfo } from 'react-icons/fi';

const StatusBadge = ({ status, showIcon = true }) => {
  const config = {
    Ready:       { bg: '#D1FAE5', color: '#065F46', icon: <FiCheckCircle /> },
    Recoverable: { bg: '#FEF3C7', color: '#92400E', icon: <FiAlertTriangle /> },
    Blocked:     { bg: '#FEE2E2', color: '#991B1B', icon: <FiXCircle /> },
    Pending:     { bg: '#F1F5F9', color: '#475569', icon: <FiClock /> },
    Active:      { bg: '#DBEAFE', color: '#1E40AF', icon: <FiInfo /> },
    Inactive:    { bg: '#FEE2E2', color: '#991B1B', icon: <FiXCircle /> },
  };

  const style = config[status] || config.Pending;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color,
        letterSpacing: '0.01em',
      }}
    >
      {showIcon && <span style={{ display: 'flex', fontSize: '0.85rem' }}>{style.icon}</span>}
      {status}
    </span>
  );
};

export default StatusBadge;