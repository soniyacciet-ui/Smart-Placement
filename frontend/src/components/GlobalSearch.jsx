import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiUser, FiBriefcase } from 'react-icons/fi';
import { globalSearch } from '../services/mockApi';

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ students: [], users: [], jds: [] });
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ students: [], users: [], jds: [] });
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await globalSearch(query);
        setResults(data);
        setShowDropdown(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = () => {
    setShowDropdown(false);
    setQuery('');
    navigate('/segmentation');
  };

  const hasResults =
    results.students.length > 0 ||
    results.users.length > 0 ||
    results.jds.length > 0;

  return (
    <div ref={wrapperRef} className="position-relative d-none d-md-block">
      <FiSearch
        className="position-absolute text-muted"
        style={{ left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', zIndex: 10 }}
      />
      <input
        type="text"
        className="form-control ps-5"
        placeholder="Search students, users, JDs..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && setShowDropdown(true)}
        style={{
          width: '340px',
          height: '38px',
          backgroundColor: 'var(--slate-100)',
          border: '1px solid transparent',
          fontSize: '0.85rem',
        }}
      />

      {/* Dropdown */}
      {showDropdown && query.length >= 2 && (
        <div
          className="position-absolute bg-white shadow-lg rounded"
          style={{
            top: '44px',
            left: 0,
            width: '420px',
            maxHeight: '400px',
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            zIndex: 1001,
          }}
        >
          {loading && (
            <div className="p-3 text-center text-muted small">Searching...</div>
          )}

          {!loading && !hasResults && (
            <div className="p-3 text-center text-muted small">
              No results for "{query}"
            </div>
          )}

          {/* Students */}
          {results.students.length > 0 && (
            <div>
              <div className="px-3 pt-3 pb-1 text-muted fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                STUDENTS
              </div>
              {results.students.map(s => (
                <div
                  key={s.id}
                  className="px-3 py-2 d-flex align-items-center gap-2"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={handleResultClick}
                >
                  <FiUser className="text-primary" size={14} />
                  <div>
                    <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{s.name}</div>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                      {s.register_number} · {s.department}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Users */}
          {results.users.length > 0 && (
            <div>
              <div className="px-3 pt-3 pb-1 text-muted fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                USERS
              </div>
              {results.users.map(u => (
                <div
                  key={u.id}
                  className="px-3 py-2 d-flex align-items-center gap-2"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={handleResultClick}
                >
                  <FiUser className="text-info" size={14} />
                  <div>
                    <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{u.name || u.login_id}</div>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                      {u.role} · {u.department || 'No dept'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* JDs */}
          {results.jds.length > 0 && (
            <div>
              <div className="px-3 pt-3 pb-1 text-muted fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                JOB DESCRIPTIONS
              </div>
              {results.jds.map(j => (
                <div
                  key={j.id}
                  className="px-3 py-2 d-flex align-items-center gap-2"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={handleResultClick}
                >
                  <FiBriefcase className="text-success" size={14} />
                  <div>
                    <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{j.company_name}</div>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                      {j.role} · Due {j.deadline}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-2 border-top text-center" style={{ fontSize: '0.7rem' }}>
            <span className="text-muted">Type at least 2 characters</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;