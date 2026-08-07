import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import './FilterBar.css';

const FilterBar = ({ filters, setFilters, styles, mediums, priceRanges, sortOptions, resultCount }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const activeCount = [
    filters.style !== 'All',
    filters.medium !== 'All',
    filters.price !== 'All',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({ style: 'All', medium: 'All', price: 'All', sort: 'Newest' });
  };

  const FilterSelect = ({ label, value, options, onChange }) => (
    <div className="filter-select">
      <label className="filter-select__label">{label}</label>
      <div className="filter-select__wrap">
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown size={14} className="filter-select__icon" />
      </div>
    </div>
  );

  const filterContent = (
    <>
      <FilterSelect
        label="Style"
        value={filters.style}
        options={['All', ...styles]}
        onChange={(v) => setFilters({ ...filters, style: v })}
      />
      <FilterSelect
        label="Medium"
        value={filters.medium}
        options={['All', ...mediums]}
        onChange={(v) => setFilters({ ...filters, medium: v })}
      />
      <FilterSelect
        label="Price"
        value={filters.price}
        options={['All', ...priceRanges]}
        onChange={(v) => setFilters({ ...filters, price: v })}
      />
      <FilterSelect
        label="Sort By"
        value={filters.sort}
        options={sortOptions}
        onChange={(v) => setFilters({ ...filters, sort: v })}
      />
    </>
  );

  return (
    <>
      {/* Desktop */}
      <div className="filter-bar">
        <div className="filter-bar__left">
          <SlidersHorizontal size={16} />
          <span className="filter-bar__count">{resultCount} artworks</span>
          {activeCount > 0 && (
            <button className="filter-bar__clear" onClick={clearFilters}>
              <X size={14} /> Clear filters
            </button>
          )}
        </div>
        <div className="filter-bar__desktop">
          {filterContent}
        </div>
        <button className="filter-bar__mobile-toggle" onClick={() => setMobileOpen(true)}>
          <SlidersHorizontal size={16} />
          Filters {activeCount > 0 && <span className="filter-bar__badge">{activeCount}</span>}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="filter-drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="filter-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            >
              <div className="filter-drawer__header">
                <h3>FILTERS</h3>
                <button onClick={() => setMobileOpen(false)}><X size={20} /></button>
              </div>
              <div className="filter-drawer__body">
                {filterContent}
              </div>
              <div className="filter-drawer__footer">
                <button className="btn-ghost" onClick={clearFilters}>CLEAR ALL</button>
                <button className="btn-primary" onClick={() => setMobileOpen(false)}>SHOW {resultCount} ARTWORKS</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default FilterBar;
