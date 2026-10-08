import React from 'react';

const PasswordStrength = ({ password }) => {
  const getStrength = (pwd) => {
    let score = 0;
    if (!pwd) return { score: 0, label: '', color: '' };
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, label: 'Weak', color: '#DC2626' };
    if (score === 3) return { score, label: 'Fair', color: '#D97706' };
    if (score === 4) return { score, label: 'Good', color: '#2563EB' };
    return { score, label: 'Strong', color: '#059669' };
  };

  const strength = getStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="d-flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            style={{
              height: '4px',
              flex: 1,
              borderRadius: '2px',
              backgroundColor: i <= strength.score ? strength.color : '#E2E8F0',
              transition: 'background-color 0.2s',
            }}
          />
        ))}
      </div>
      <div className="d-flex justify-content-between">
        <small style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</small>
        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
          8+ chars, upper, lower, number, symbol
        </small>
      </div>
    </div>
  );
};

export default PasswordStrength;