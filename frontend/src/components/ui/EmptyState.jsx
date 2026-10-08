import React from 'react';

const EmptyState = ({ icon, title, description, action }) => {
  return (
    <div className="card border-0">
      <div className="card-body text-center py-5">
        <div
          className="d-inline-flex align-items-center justify-content-center mb-3"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#EEF2FF',
            color: '#4F46E5',
            fontSize: '1.75rem',
          }}
        >
          {icon}
        </div>
        <h5 className="fw-bold mb-2">{title}</h5>
        <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '420px', fontSize: '0.875rem' }}>
          {description}
        </p>
        {action}
      </div>
    </div>
  );
};

export default EmptyState;