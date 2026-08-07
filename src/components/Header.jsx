import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Heart, ShoppingCart, User, ChevronDown, X, ArrowRight,
  Bell, Sparkles, Clock, TrendingUp, Check, LogOut, LayoutDashboard, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const TRUST_ITEMS = [
  'Original Artwork',
  'Verified Artists',
  'Certificate of Authenticity',
  'Secure Payments',
  'Free Shipping Across India',
  'Commission Artwork Available',
];

const NAV_ITEMS = [
  { label: 'Artworks', href: '/shop', hasDropdown: true },
  { label: 'Artists', href: '/artists', hasDropdown: true },
  { label: 'Collections', href: '/shop', hasDropdown: true },
  { label: 'Exhibitions', href: '#exhibitions', hasDropdown: true },
  { label: 'Discover', href: '#discover', hasDropdown: true },
  { label: 'About', href: '#about', hasDropdown: false },
  { label: 'Contact', href: '#contact', hasDropdown: false },
];

const MEGA_MENUS = {
  Artworks: {
    columns: [
      {
        title: 'Browse by Medium',
        links: [
          { label: 'Oil Painting', href: '/shop' },
          { label: 'Acrylic', href: '/shop' },
          { label: 'Watercolor', href: '/shop' },
          { label: 'Mixed Media', href: '/shop' },
          { label: 'Charcoal', href: '/shop' },
        ],
      },
      {
        title: 'Browse by Style',
        links: [
          { label: 'Abstract', href: '/shop' },
          { label: 'Modern', href: '/shop' },
          { label: 'Contemporary', href: '/shop' },
          { label: 'Realism', href: '/shop' },
          { label: 'Minimalism', href: '/shop' },
        ],
      },
      {
        title: 'Browse by Subject',
        links: [
          { label: 'Landscape', href: '/shop' },
          { label: 'Nature', href: '/shop' },
          { label: 'Krishna', href: '/shop' },
          { label: 'Portrait', href: '/shop' },
          { label: 'Wildlife', href: '/shop' },
        ],
      },
      {
        title: 'Browse by Price',
        links: [
          { label: 'Under \u20B95,000', href: '/shop' },
          { label: '\u20B95k \u2013 15k', href: '/shop' },
          { label: '\u20B915k \u2013 50k', href: '/shop' },
          { label: '\u20B950k+', href: '/shop' },
        ],
      },
      {
        title: 'Featured',
        links: [
          { label: "Editor's Picks", href: '/shop', badge: 'CURATED' },
          { label: 'Trending', href: '/shop', badge: 'HOT' },
          { label: 'New Arrivals', href: '/shop', badge: 'NEW' },
          { label: 'Limited Edition', href: '/shop' },
          { label: 'Best Sellers', href: '/shop' },
        ],
      },
    ],
  },
  Artists: {
    columns: [
      {
        title: 'Discover Artists',
        links: [
          { label: 'Featured Artists', href: '/artists' },
          { label: 'Emerging Artists', href: '/artists' },
          { label: 'Verified Artists', href: '/artists' },
          { label: 'Award Winning', href: '/artists' },
          { label: 'Top Selling', href: '/artists' },
        ],
      },
      {
        title: 'Resources',
        links: [
          { label: 'Become an Artist', href: '#', badge: 'NEW' },
          { label: 'Artist Stories', href: '#' },
          { label: 'Art Guidelines', href: '#' },
          { label: 'Pricing Guide', href: '#' },
        ],
      },
    ],
  },
  Collections: {
    columns: [
      {
        title: 'Explore Collections',
        links: [
          { label: 'Featured Collections', href: '/shop' },
          { label: 'Luxury Collection', href: '/shop' },
          { label: 'Nature Collection', href: '/shop' },
          { label: 'Modern Living', href: '/shop' },
          { label: 'Indian Heritage', href: '/shop' },
          { label: 'Sacred Collection', href: '/shop' },
          { label: 'Affordable Collection', href: '/shop' },
        ],
      },
      {
        title: 'Curated For You',
        links: [
          { label: 'Trending Now', href: '/shop', badge: 'HOT' },
          { label: "Editor's Picks", href: '/shop' },
          { label: 'New Arrivals', href: '/shop', badge: 'NEW' },
          { label: 'Limited Edition', href: '/shop' },
        ],
      },
    ],
  },
  Exhibitions: {
    columns: [
      {
        title: 'Exhibitions',
        links: [
          { label: 'Current Exhibition', href: '#', badge: 'LIVE' },
          { label: 'Upcoming Exhibitions', href: '#' },
          { label: 'Past Exhibitions', href: '#' },
          { label: 'Virtual Tours', href: '#' },
          { label: 'Submit Your Work', href: '#' },
        ],
      },
    ],
  },
  Discover: {
    columns: [
      {
        title: 'Discover',
        links: [
          { label: 'Trending Now', href: '#', badge: 'HOT' },
          { label: 'New Arrivals', href: '/shop', badge: 'NEW' },
          { label: "Editor's Picks", href: '/shop' },
          { label: 'Limited Edition', href: '/shop' },
        ],
      },
      {
        title: 'Learn',
        links: [
          { label: 'Art Blog', href: '#' },
          { label: 'Style Guide', href: '#' },
          { label: 'Collecting 101', href: '#' },
          { label: 'Art Investment', href: '#' },
        ],
      },
    ],
  },
};

const SEARCH_CATEGORIES = ['All', 'Artworks', 'Artists', 'Collections', 'Styles', 'Medium', 'Subjects'];
const RECENT_SEARCHES = ['Abstract Landscape', 'Krishna Art', 'Oil Painting'];
const POPULAR_SEARCHES = ['Modern Art', 'Nature', 'Portrait', 'Minimal', 'Spiritual'];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isArtist, isAdmin, isPending } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('All');
  const [cartCount] = useState(2);
  const [notifCount] = useState(3);
  const closeTimer = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 60);
      if (currentScrollY > lastScrollY && currentScrollY > 120) {
        setHidden(true);
        setActiveDropdown(null);
      } else {
        setHidden(false);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen || searchOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen, searchOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setActiveDropdown(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  const handleMouseEnter = useCallback((label) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (MEGA_MENUS[label]) setActiveDropdown(label);
    else setActiveDropdown(null);
  }, []);

  const handleNavLeave = useCallback(() => {
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 180);
  }, []);

  const handleDropdownEnter = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const closeMobile = () => setMobileOpen(false);
  const openSearch = () => { setSearchOpen(true); setMobileOpen(false); };

  return (
    <>
      <div className={`trust-bar ${scrolled ? 'trust-bar--hidden' : ''}`} aria-label="Trust badges">
        <div className="trust-bar__inner">
          {TRUST_ITEMS.map((item) => (
            <span key={item} className="trust-bar__item">
              <Check size={10} strokeWidth={3} />
              {item}
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeDropdown && (
          <motion.div
            className="nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.header
        className={`header ${scrolled ? 'header--scrolled' : ''} ${activeDropdown ? 'header--dropdown-open' : ''}`}
        initial={{ y: -100 }}
        animate={{ y: hidden ? -100 : 0 }}
        transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
      >
        <div className="header__container">
          <Link to="/" className="logo" aria-label="TIA Creations Home">
            <img src="/tia-logo.png" alt="TIA Creations" className="logo__img" />
          </Link>

          <nav className="header__nav" onMouseLeave={handleNavLeave} aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className="nav-item"
                onMouseEnter={() => item.hasDropdown && handleMouseEnter(item.label)}
              >
                <Link
                  to={item.href}
                  className={`nav-link ${activeDropdown === item.label ? 'nav-link--active' : ''}`}
                  aria-haspopup={item.hasDropdown || undefined}
                  aria-expanded={activeDropdown === item.label || undefined}
                >
                  {item.label}
                  {item.hasDropdown && (
                    <ChevronDown
                      size={12}
                      className={`nav-chevron ${activeDropdown === item.label ? 'nav-chevron--open' : ''}`}
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </div>
            ))}
          </nav>

          <div className="header__right">
            <div className="header__icons">
              <button className="icon-btn" aria-label="Search artworks" onClick={openSearch}>
                <Search size={18} />
              </button>
              {user ? (
                <>
                  <Link to="/wishlist" className="icon-btn" aria-label="Wishlist">
                    <Heart size={18} />
                  </Link>
                  <button className="icon-btn" aria-label={`Notifications \u2013 ${notifCount} unread`}>
                    <Bell size={18} />
                    {notifCount > 0 && <span className="badge badge--notif">{notifCount}</span>}
                  </button>
                  <button className="icon-btn icon-btn--cart" aria-label={`Cart \u2013 ${cartCount} items`}>
                    <ShoppingCart size={18} />
                    {cartCount > 0 && <span className="badge badge--cart">{cartCount}</span>}
                  </button>
                  <Link to="/profile" className="icon-btn" aria-label="My Account">
                    <User size={18} />
                  </Link>
                </>
              ) : (
                <>
                  <button className="icon-btn icon-btn--cart" aria-label={`Cart \u2013 ${cartCount} items`}>
                    <ShoppingCart size={18} />
                    {cartCount > 0 && <span className="badge badge--cart">{cartCount}</span>}
                  </button>
                  <Link to="/login" className="icon-btn" aria-label="Sign In">
                    <User size={18} />
                  </Link>
                </>
              )}
            </div>

            <div className="header__sep" aria-hidden="true" />

            {user ? (
              <div className="header__user-menu" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isArtist && (
                  <Link to="/artist/dashboard" className="cta-btn cta-btn--small">
                    <LayoutDashboard size={13} />
                    <span>Dashboard</span>
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin" className="cta-btn cta-btn--admin">
                    <Shield size={13} />
                    <span>Admin</span>
                  </Link>
                )}
                {!isArtist && !isAdmin && !isPending && (
                  <Link to="/become-artist" className="cta-btn">
                    <Sparkles size={14} />
                    <span>Become an Artist</span>
                    <ArrowRight size={14} className="cta-btn__arrow" />
                  </Link>
                )}
                {isPending && (
                  <span className="cta-btn cta-btn--pending" style={{ opacity: 0.7, pointerEvents: 'none' }}>
                    <Sparkles size={14} />
                    <span>Artist Pending</span>
                  </span>
                )}
                <button className="icon-btn" aria-label="Sign Out" onClick={() => { logout(); navigate('/'); }} title="Sign Out">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className={location.pathname === '/login' ? 'cta-btn' : 'btn-ghost'} style={{ padding: '10px 18px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>
                  Sign In
                </Link>
                <Link to="/signup" className={location.pathname === '/signup' ? 'cta-btn' : 'btn-ghost'} style={{ padding: '10px 18px', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Sign Up
                </Link>
              </>
            )}

            <button
              className="hamburger-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              <span className={`hamburger ${mobileOpen ? 'hamburger--open' : ''}`}>
                <span /><span /><span />
              </span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {activeDropdown && MEGA_MENUS[activeDropdown] && (
            <motion.div
              className="mega-menu"
              role="region"
              aria-label={`${activeDropdown} menu`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onMouseEnter={handleDropdownEnter}
              onMouseLeave={handleNavLeave}
            >
              <div className="mega-menu__inner">
                {MEGA_MENUS[activeDropdown].columns.map((col, i) => (
                  <div key={i} className="mega-menu__col">
                    <p className="mega-menu__col-title">{col.title}</p>
                    <ul className="mega-menu__list">
                      {col.links.map((link, j) => (
                        <motion.li
                          key={j}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.28, delay: 0.04 + j * 0.035 }}
                        >
                          <Link to={link.href} className="mega-menu__link" onClick={() => setActiveDropdown(null)}>
                            <span>{link.label}</span>
                            {link.badge && <span className="mega-menu__badge">{link.badge}</span>}
                          </Link>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="search-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              className="search-overlay__inner"
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="search-overlay__header">
                <div className="search-overlay__input-wrap">
                  <Search size={20} className="search-overlay__icon" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search artworks, artists, collections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-overlay__input"
                    aria-label="Search"
                  />
                  <button className="search-overlay__close" onClick={() => setSearchOpen(false)} aria-label="Close search">
                    <kbd>ESC</kbd>
                  </button>
                </div>
              </div>

              <div className="search-overlay__body">
                <div className="search-overlay__categories">
                  {SEARCH_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      className={`search-overlay__cat ${searchCategory === cat ? 'search-overlay__cat--active' : ''}`}
                      onClick={() => setSearchCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="search-overlay__content">
                  {!searchQuery && (
                    <>
                      <div className="search-overlay__section">
                        <h4 className="search-overlay__section-title">Recent Searches</h4>
                        <div className="search-overlay__tags">
                          {RECENT_SEARCHES.map((term) => (
                            <button key={term} className="search-overlay__tag" onClick={() => setSearchQuery(term)}>
                              <Clock size={12} /> {term}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="search-overlay__section">
                        <h4 className="search-overlay__section-title">Popular on TIA Creations</h4>
                        <div className="search-overlay__tags">
                          {POPULAR_SEARCHES.map((term) => (
                            <button key={term} className="search-overlay__tag" onClick={() => setSearchQuery(term)}>
                              <TrendingUp size={12} /> {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  {searchQuery && (
                    <div className="search-overlay__section">
                      <p className="search-overlay__hint">Press Enter to search for &ldquo;{searchQuery}&rdquo;</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeMobile}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.36, ease: [0.25, 1, 0.5, 1] }}
          >
            <div className="mobile-drawer__header">
              <Link to="/" className="logo" onClick={closeMobile}>
                <img src="/tia-logo.png" alt="TIA Creations" className="logo__img" />
              </Link>
              <button className="mobile-drawer__close" onClick={closeMobile} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>

            <nav className="mobile-drawer__nav" aria-label="Mobile navigation">
              {NAV_ITEMS.map((item) => (
                <div key={item.label} className="mobile-nav-item">
                  <div className="mobile-nav-item__row">
                    <Link
                      to={item.href}
                      className="mobile-nav-item__link"
                      onClick={() => !item.hasDropdown && closeMobile}
                    >
                      {item.label}
                    </Link>
                    {item.hasDropdown && (
                      <button
                        className={`mobile-nav-item__expand ${mobileExpanded === item.label ? 'mobile-nav-item__expand--open' : ''}`}
                        onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                        aria-label={`Expand ${item.label}`}
                        aria-expanded={mobileExpanded === item.label}
                      >
                        <ChevronDown size={16} />
                      </button>
                    )}
                  </div>
                  <AnimatePresence>
                    {item.hasDropdown && mobileExpanded === item.label && MEGA_MENUS[item.label] && (
                      <motion.div
                        className="mobile-nav-item__sub"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        {MEGA_MENUS[item.label].columns.map((col, ci) =>
                          col.links.map((link, li) => (
                            <Link
                              key={`${ci}-${li}`}
                              to={link.href}
                              className="mobile-sub-link"
                              onClick={closeMobile}
                            >
                              {link.label}
                              {link.badge && <span className="mega-menu__badge">{link.badge}</span>}
                            </Link>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              <div className="mobile-drawer__divider" />

              {user ? (
                <>
                  <Link to="/wishlist" className="mobile-nav-item__link mobile-nav-item__link--icon" onClick={closeMobile}>
                    <Heart size={16} /> Wishlist
                  </Link>
                  <Link to="#" className="mobile-nav-item__link mobile-nav-item__link--icon" onClick={closeMobile}>
                    <Bell size={16} /> Notifications
                    {notifCount > 0 && <span className="badge badge--notif">{notifCount}</span>}
                  </Link>
                  <Link to="/profile" className="mobile-nav-item__link mobile-nav-item__link--icon" onClick={closeMobile}>
                    <User size={16} /> My Profile
                  </Link>
                  {isArtist && (
                    <Link to="/artist/dashboard" className="mobile-nav-item__link mobile-nav-item__link--icon" onClick={closeMobile}>
                      <LayoutDashboard size={16} /> Artist Dashboard
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" className="mobile-nav-item__link mobile-nav-item__link--icon" onClick={closeMobile}>
                      <Shield size={16} /> Admin Console
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link to="/login" className="mobile-nav-item__link mobile-nav-item__link--icon" onClick={closeMobile}>
                    <User size={16} /> Sign In
                  </Link>
                  <Link to="/signup" className="mobile-nav-item__link mobile-nav-item__link--icon" onClick={closeMobile}>
                    <User size={16} /> Create Account
                  </Link>
                </>
              )}
            </nav>

            <div className="mobile-drawer__footer">
              {!user && (
                <Link to="/signup" className="cta-btn cta-btn--full" onClick={closeMobile}>
                  <Sparkles size={14} />
                  <span>Sign Up / Sign In</span>
                  <ArrowRight size={14} />
                </Link>
              )}
              {user && !isArtist && !isAdmin && !isPending && (
                <Link to="/become-artist" className="cta-btn cta-btn--full" onClick={closeMobile}>
                  <Sparkles size={14} />
                  <span>Become an Artist</span>
                  <ArrowRight size={14} />
                </Link>
              )}
              {user && (
                <button className="cta-btn cta-btn--full" style={{ background: 'transparent', border: '1.5px solid var(--border)', color: 'var(--heading)' }} onClick={() => { logout(); closeMobile(); navigate('/'); }}>
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              )}

              <div className="mobile-drawer__actions">
                <button className="mobile-action" onClick={openSearch} aria-label="Search">
                  <Search size={18} />
                  <span>Search</span>
                </button>
                <button className="mobile-action" aria-label="Wishlist">
                  <Heart size={18} />
                  <span>Wishlist</span>
                </button>
                <button className="mobile-action" aria-label="Cart">
                  <ShoppingCart size={18} />
                  <span>Cart</span>
                  {cartCount > 0 && <span className="badge badge--cart">{cartCount}</span>}
                </button>
                <button className="mobile-action" aria-label="Profile">
                  <User size={18} />
                  <span>Profile</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
