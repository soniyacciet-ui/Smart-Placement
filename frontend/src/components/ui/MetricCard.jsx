import React from 'react';

const MetricCard = ({ title, value, subtitle, icon, color = 'primary', trend }) => {
  const colorMap = {
    primary: { bg: '#EEF2FF', text: '#4F46E5' },
    success: { bg: '#D1FAE5', text: '#059669' },
    warning: { bg: '#FEF3C7', text: '#D97706' },
    danger:  { bg: '#FEE2E2', text: '#DC2626' },
    info:    { bg: '#DBEAFE', text: '#2563EB' },
    slate:   { bg: '#F1F5F9', text: '#475569' },
  };

  const palette = colorMap[color] || colorMap.primary;

  return (
    <div className="card h-100" style={{ transition: 'all 0.25s ease' }}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: palette.bg,
              color: palette.text,
              fontSize: '1.1rem',
            }}
          >
            {icon}
          </div>
          {trend && (
            <span
              className="fw-semibold"
              style={{
                fontSize: '0.72rem',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: trend.positive ? '#D1FAE5' : '#FEE2E2',
                color: trend.positive ? '#059669' : '#DC2626',
              }}
            >
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
        <div
          className="text-muted fw-medium mb-1"
          style={{ fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          {title}
        </div>
        <div className="fw-bold" style={{ fontSize: '1.85rem', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
          {value}
        </div>
        {subtitle && (
          <div className="text-muted mt-2" style={{ fontSize: '0.78rem' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;