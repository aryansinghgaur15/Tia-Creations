import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import './ShopSidebar.css';

const FILTER_SECTIONS = [
  {
    id: 'type',
    title: 'Artwork Type',
    type: 'checkbox',
    options: ['Original Artwork', 'Limited Edition', 'Open Edition', 'Prints', 'Photography', 'Digital Art', 'Drawing', 'Sculpture', 'Mixed Media'],
  },
  {
    id: 'medium',
    title: 'Medium',
    type: 'checkbox',
    options: ['Oil Painting', 'Acrylic', 'Watercolor', 'Mixed Media', 'Charcoal', 'Ink', 'Pastel', 'Gouache', 'Coffee Painting', 'Digital Painting', 'Pen & Ink', 'Graphite', 'Fabric Art', 'Collage', 'Resin Art', 'Wood Art'],
  },
  {
    id: 'style',
    title: 'Style',
    type: 'checkbox',
    options: ['Abstract', 'Modern', 'Contemporary', 'Minimalism', 'Cubism', 'Realism', 'Hyperrealism', 'Surrealism', 'Expressionism', 'Impressionism', 'Pop Art', 'Street Art', 'Traditional', 'Mandala', 'Fantasy', 'Bohemian', 'Vintage'],
  },
  {
    id: 'subject',
    title: 'Subject',
    type: 'checkbox',
    options: ['Landscape', 'Nature', 'Mountains', 'Forest', 'River', 'Sunset', 'Wildlife', 'Birds', 'Animals', 'Flowers', 'Floral', 'Portrait', 'People', 'Women', 'Children', 'Architecture', 'Cityscape', 'Village', 'Indian Culture', 'Tribal', 'Music', 'Dance', 'Still Life', 'Spiritual', 'Religious', 'Buddha', 'Shiva', 'Krishna', 'Radha Krishna', 'Ganesha', 'Elephant', 'Horse', 'Tiger', 'Peacock', 'Space', 'Ocean', 'Travel', 'Typography', 'Minimal'],
  },
  {
    id: 'theme',
    title: 'Theme',
    type: 'checkbox',
    options: ['Peace', 'Meditation', 'Love', 'Celebration', 'Heritage', 'Indian Culture', 'Village Life', 'Urban Life', 'Social Commentary', 'Women Empowerment', 'Nature', 'Adventure', 'Luxury', 'Royal', 'Dreams', 'Fantasy', 'Emotions', 'Relationships', 'Music', 'Festivals'],
  },
  {
    id: 'price',
    title: 'Price',
    type: 'price',
    range: [0, 2000000],
    quickOptions: ['Under ₹5,000', '₹5k – 15k', '₹15k – 50k', '₹50k – 1L', '₹1L – 5L', '₹5L – 10L', '₹10L+'],
  },
  {
    id: 'size',
    title: 'Size',
    type: 'checkbox',
    options: ['Mini', 'Small', 'Medium', 'Large', 'Oversized', 'Custom'],
  },
  {
    id: 'dimensions',
    title: 'Dimensions',
    type: 'checkbox',
    options: ['12×12', '18×24', '24×36', '36×48', '48×60', '60+'],
  },
  {
    id: 'orientation',
    title: 'Orientation',
    type: 'radio',
    options: ['Vertical', 'Horizontal', 'Square', 'Panorama', 'Round'],
  },
  {
    id: 'color',
    title: 'Color',
    type: 'color',
    options: [
      { name: 'Black', hex: '#222222' },
      { name: 'White', hex: '#F5F5F5' },
      { name: 'Blue', hex: '#3B82F6' },
      { name: 'Red', hex: '#EF4444' },
      { name: 'Yellow', hex: '#EAB308' },
      { name: 'Green', hex: '#22C55E' },
      { name: 'Orange', hex: '#F97316' },
      { name: 'Purple', hex: '#A855F7' },
      { name: 'Brown', hex: '#92400E' },
      { name: 'Grey', hex: '#9CA3AF' },
      { name: 'Gold', hex: '#C8A96A' },
      { name: 'Silver', hex: '#CBD5E1' },
      { name: 'Beige', hex: '#D4C5A9' },
      { name: 'Earth Tone', hex: '#8B7355' },
    ],
  },
  {
    id: 'room',
    title: 'Room',
    type: 'checkbox',
    options: ['Living Room', 'Bedroom', 'Dining Room', 'Office', 'Reception', 'Cafe', 'Hotel', 'Study', 'Hallway', 'Kids Room'],
  },
  {
    id: 'mood',
    title: 'Mood',
    type: 'checkbox',
    options: ['Luxury', 'Minimal', 'Elegant', 'Happy', 'Peaceful', 'Bold', 'Warm', 'Cool', 'Vintage', 'Modern', 'Romantic', 'Calm'],
  },
  {
    id: 'frame',
    title: 'Frame',
    type: 'checkbox',
    options: ['Framed', 'Unframed', 'Floating Frame', 'Wood Frame', 'Metal Frame', 'Canvas'],
  },
  {
    id: 'availability',
    title: 'Availability',
    type: 'checkbox',
    options: ['Ready to Ship', 'Commission Available', 'Made to Order', 'In Stock', 'Only One Left'],
  },
  {
    id: 'certificate',
    title: 'Certificate',
    type: 'checkbox',
    options: ['Certificate Included', 'Hand Signed', 'Gallery Certified', 'Signed Back'],
  },
  {
    id: 'shipping',
    title: 'Shipping',
    type: 'checkbox',
    options: ['Free Shipping', 'Express Delivery', 'Ships in 3 Days', 'International Shipping'],
  },
  {
    id: 'offers',
    title: 'Offers',
    type: 'checkbox',
    options: ['Discount', 'Festival Offer', 'Best Seller', "Editor's Choice", 'Exclusive', 'Trending'],
  },
];

const AccordionFilter = ({ section, activeFilters, onToggle, expanded, onExpand }) => {
  const isOpen = expanded === section.id;
  const activeCount = activeFilters[section.id]?.length || 0;

  return (
    <div className={`filter-accordion ${isOpen ? 'filter-accordion--open' : ''}`}>
      <button
        className="filter-accordion__header"
        onClick={() => onExpand(isOpen ? null : section.id)}
        aria-expanded={isOpen}
      >
        <div className="filter-accordion__header-left">
          <span className="filter-accordion__title">{section.title}</span>
          {activeCount > 0 && (
            <span className="filter-accordion__count">{activeCount}</span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`filter-accordion__chevron ${isOpen ? 'filter-accordion__chevron--open' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            className="filter-accordion__body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
          >
            <div className="filter-accordion__content">
              {section.type === 'checkbox' && (
                <div className="filter-checkbox-list">
                  {section.options.map((opt) => (
                    <label key={opt} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={activeFilters[section.id]?.includes(opt) || false}
                        onChange={() => onToggle(section.id, opt)}
                      />
                      <span className="filter-checkbox__box" />
                      <span className="filter-checkbox__label">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {section.type === 'radio' && (
                <div className="filter-radio-list">
                  {section.options.map((opt) => (
                    <label key={opt} className="filter-radio">
                      <input
                        type="radio"
                        name={section.id}
                        checked={activeFilters[section.id]?.[0] === opt}
                        onChange={() => onToggle(section.id, opt, true)}
                      />
                      <span className="filter-radio__circle" />
                      <span className="filter-radio__label">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {section.type === 'color' && (
                <div className="filter-color-grid">
                  {section.options.map((c) => {
                    const isActive = activeFilters[section.id]?.includes(c.name);
                    return (
                      <button
                        key={c.name}
                        className={`filter-color-swatch ${isActive ? 'filter-color-swatch--active' : ''}`}
                        onClick={() => onToggle(section.id, c.name)}
                        title={c.name}
                      >
                        <span
                          className="filter-color-swatch__circle"
                          style={{ background: c.hex }}
                        />
                        <span className="filter-color-swatch__label">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {section.type === 'price' && (
                <div className="filter-price">
                  <div className="filter-price__slider">
                    <input
                      type="range"
                      min={section.range[0]}
                      max={section.range[1]}
                      step={1000}
                      value={activeFilters[section.id]?.[1] || section.range[1]}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        onToggle(section.id, val, true, true);
                      }}
                      className="filter-price__range"
                    />
                    <div className="filter-price__labels">
                      <span>₹0</span>
                      <span>₹{(activeFilters[section.id]?.[1] || section.range[1]).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="filter-price__quick">
                    {section.quickOptions.map((opt) => (
                      <button
                        key={opt}
                        className={`filter-price__chip ${activeFilters[section.id]?.includes(opt) ? 'filter-price__chip--active' : ''}`}
                        onClick={() => onToggle(section.id, opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ShopSidebar = ({ filters, setFilters, onClose, isMobile }) => {
  const [expanded, setExpanded] = useState(null);

  const activeCount = Object.values(filters).reduce((sum, arr) => {
    if (!arr || arr.length === 0) return sum;
    return sum + (Array.isArray(arr) ? arr.length : 1);
  }, 0);

  const toggleFilter = (sectionId, value, isRadio = false, isSlider = false) => {
    setFilters((prev) => {
      const current = prev[sectionId] || [];

      if (isSlider) {
        return { ...prev, [sectionId]: [0, value] };
      }

      if (isRadio) {
        return { ...prev, [sectionId]: [value] };
      }

      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];

      return { ...prev, [sectionId]: updated.length > 0 ? updated : undefined };
    });
  };

  const clearAll = () => {
    setFilters({});
  };

  const activeFiltersList = [];
  Object.entries(filters).forEach(([key, val]) => {
    if (val && Array.isArray(val)) {
      const section = FILTER_SECTIONS.find((s) => s.id === key);
      val.forEach((v) => {
        if (section?.type === 'price' && typeof v === 'number') return;
        activeFiltersList.push({ sectionId: key, value: v, sectionTitle: section?.title });
      });
    }
  });

  const sidebarContent = (
    <aside className={`shop-sidebar ${isMobile ? 'shop-sidebar--mobile' : ''}`}>
      <div className="shop-sidebar__header">
        <div className="shop-sidebar__header-left">
          <SlidersHorizontal size={16} />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="shop-sidebar__active-badge">{activeCount}</span>
          )}
        </div>
        {isMobile && (
          <button className="shop-sidebar__close" onClick={onClose}>
            <X size={18} />
          </button>
        )}
      </div>

        {activeFiltersList.length > 0 && (
          <div className="shop-sidebar__active-filters">
            {activeFiltersList.map((af, i) => (
              <span key={`${af.sectionId}-${af.value}-${i}`} className="active-filter-pill">
                {af.value}
                <button onClick={() => toggleFilter(af.sectionId, af.value)}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="shop-sidebar__scroll">
          {FILTER_SECTIONS.map((section) => (
            <AccordionFilter
              key={section.id}
              section={section}
              activeFilters={filters}
              onToggle={toggleFilter}
              expanded={expanded}
              onExpand={setExpanded}
            />
          ))}
        </div>

        {activeCount > 0 && (
          <div className="shop-sidebar__footer">
            <button className="shop-sidebar__clear" onClick={clearAll}>
              <RotateCcw size={13} />
              Clear All Filters
            </button>
          </div>
        )}
    </aside>
  );

  if (isMobile) {
    return (
      <motion.div
        key="shop-sidebar-mobile"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <motion.div
          className="filter-sidebar-mobile-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
          style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 1001 }}
        >
          {sidebarContent}
        </motion.div>
      </motion.div>
    );
  }

  return sidebarContent;
};

export default ShopSidebar;
