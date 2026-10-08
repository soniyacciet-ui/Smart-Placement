import React from 'react';

const PageHeader = ({ title, subtitle, actions, breadcrumb }) => {
  return (
    <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
      <div>
        {breadcrumb && (
          <div className="text-muted mb-1" style={{ fontSize: '0.78rem', letterSpacing: '0.02em' }}>
            {breadcrumb}
          </div>
        )}
        <h1 className="fw-bold mb-1" style={{ fontSize: '1.65rem', letterSpacing: '-0.03em' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="d-flex gap-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;