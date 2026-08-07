import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './ShopPagination.css';

const ShopPagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const delta = 1;
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  return (
    <nav className="shop-pagination" aria-label="Shop pagination">
      <button
        className="shop-pagination__btn shop-pagination__btn--prev"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
        <span>Previous</span>
      </button>

      <div className="shop-pagination__pages">
        {getPageNumbers().map((page, i) =>
          page === '...' ? (
            <span key={`ellipsis-${i}`} className="shop-pagination__ellipsis">...</span>
          ) : (
            <button
              key={page}
              className={`shop-pagination__page ${currentPage === page ? 'shop-pagination__page--active' : ''}`}
              onClick={() => onPageChange(page)}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        className="shop-pagination__btn shop-pagination__btn--next"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <span>Next</span>
        <ChevronRight size={16} />
      </button>
    </nav>
  );
};

export default ShopPagination;
