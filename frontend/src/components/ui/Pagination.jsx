import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Pagination = ({ currentPage, totalPages, goToPage, startIndex, endIndex, totalItems }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="d-flex justify-content-between align-items-center p-3 border-top">
      <div className="text-muted" style={{ fontSize: '0.8rem' }}>
        Showing <strong>{startIndex + 1}</strong>–<strong>{Math.min(endIndex, totalItems)}</strong> of{' '}
        <strong>{totalItems}</strong>
      </div>

      <div className="d-flex gap-1">
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <FiChevronLeft size={14} />
        </button>

        {getPageNumbers().map(page => (
          <button
            key={page}
            className={`btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => goToPage(page)}
          >
            {page}
          </button>
        ))}

        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <FiChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;