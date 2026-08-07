import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, MapPin, Shield, Bell, Eye, Settings, ChevronRight,
  Camera, Save, Mail, Phone, ChevronDown, Check, X, LogOut,
  Heart, ShoppingBag, Clock, Star, Award, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

const tabVariants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const SIDEBAR_NAV = [
  { key: 'profile', label: 'Profile', icon: <User size={16} /> },
  { key: 'addresses', label: 'Addresses', icon: <MapPin size={16} /> },
  { key: 'security', label: 'Security', icon: <Shield size={16} /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { key: 'privacy', label: 'Privacy', icon: <Eye size={16} /> },
  { key: 'settings', label: 'Settings', icon: <Settings size={16} /> },
];

const MOCK_ADDRESSES = [
  { id: 1, label: 'Home', line1: '42, Lotus Apartments, Marine Drive', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', isDefault: true },
  { id: 2, label: 'Studio', line1: '7th Floor, Artisan Tower, BKC', city: 'Mumbai', state: 'Maharashtra', pincode: '400051', isDefault: false },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, message: 'Your order #TIA-2025-0421 has been shipped', time: '2 hours ago', read: false },
  { id: 2, message: 'New artwork from Rhea Nair — "Golden Hour"', time: '1 day ago', read: false },
  { id: 3, message: 'Payment confirmed for order #TIA-2025-0418', time: '3 days ago', read: true },
  { id: 4, message: 'Kavita Singh is now following you', time: '5 days ago', read: true },
  { id: 5, message: 'Your wishlist item "Whispers of Gold" is on sale', time: '1 week ago', read: true },
];

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [form, setForm] = useState({
    displayName: '',
    fullName: '',
    email: '',
    phone: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return; }
    setForm({
      displayName: user.displayName || '',
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
    });
  }, [user, navigate]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) return null;

  const fallbackAvatar = user.displayName?.charAt(0)?.toUpperCase() || 'T';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <motion.div key="profile" variants={tabVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
            <div className="profile-section">
              <div className="profile-avatar-upload">
                <div className="profile-avatar-upload__preview">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName} />
                  ) : (
                    <span className="profile-avatar-upload__fallback">{fallbackAvatar}</span>
                  )}
                </div>
                <button className="profile-avatar-upload__btn">
                  <Camera size={14} />
                  <span>Change Photo</span>
                </button>
              </div>

              <div className="profile-fields">
                <div className="profile-field">
                  <label>Display Name</label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) => setForm(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Your display name"
                  />
                </div>
                <div className="profile-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>
                <div className="profile-field profile-field--readonly">
                  <label>Email</label>
                  <input type="email" value={form.email} readOnly />
                  <span className="profile-field__hint">Email cannot be changed</span>
                </div>
                <div className="profile-field">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="profile-actions">
                <button className="btn-primary" onClick={handleSave}>
                  {saved ? (
                    <><Check size={14} /><span>Saved</span></>
                  ) : (
                    <><Save size={14} /><span>Save Changes</span></>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        );

      case 'addresses':
        return (
          <motion.div key="addresses" variants={tabVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
            <div className="profile-section">
              <div className="profile-addresses">
                {MOCK_ADDRESSES.map(addr => (
                  <div key={addr.id} className={`profile-address-card ${addr.isDefault ? 'profile-address-card--default' : ''}`}>
                    <div className="profile-address-card__header">
                      <span className="profile-address-card__label">{addr.label}</span>
                      {addr.isDefault && <span className="profile-address-card__badge">Default</span>}
                    </div>
                    <p className="profile-address-card__line">{addr.line1}</p>
                    <p className="profile-address-card__line">{addr.city}, {addr.state} — {addr.pincode}</p>
                    <div className="profile-address-card__actions">
                      <button className="profile-address-card__action">Edit</button>
                      <button className="profile-address-card__action profile-address-card__action--danger">Remove</button>
                    </div>
                  </div>
                ))}
                <button className="profile-address-add">
                  <span>+</span> Add New Address
                </button>
              </div>
            </div>
          </motion.div>
        );

      case 'notifications':
        return (
          <motion.div key="notifications" variants={tabVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
            <div className="profile-section">
              <div className="profile-notifications">
                {MOCK_NOTIFICATIONS.map(n => (
                  <div key={n.id} className={`profile-notif ${n.read ? 'profile-notif--read' : ''}`}>
                    <div className={`profile-notif__dot ${n.read ? '' : 'profile-notif__dot--unread'}`} />
                    <div className="profile-notif__body">
                      <p className="profile-notif__msg">{n.message}</p>
                      <span className="profile-notif__time">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 'security':
      case 'privacy':
      case 'settings':
        return (
          <motion.div key={activeTab} variants={tabVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
            <div className="profile-section">
              <div className="profile-placeholder">
                <Shield size={40} strokeWidth={1} />
                <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings</h3>
                <p>This section is coming soon. We're building premium security and privacy controls for your account.</p>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div className="profile-hero__inner">
          <div className="profile-hero__breadcrumb">
            <Link to="/">Home</Link><span>/</span><span className="profile-hero__breadcrumb--active">My Account</span>
          </div>
          <motion.h1 className="profile-hero__title" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            Welcome back, <em className="accent-text">{user.displayName || 'Collector'}</em>
          </motion.h1>
          <motion.p className="profile-hero__subtitle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }}>
            Manage your profile, orders, and preferences
          </motion.p>
        </div>
      </section>

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-sidebar__user">
            <div className="profile-sidebar__avatar">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} />
              ) : (
                <span className="profile-sidebar__avatar-fallback">{fallbackAvatar}</span>
              )}
            </div>
            <div className="profile-sidebar__info">
              <h3>{user.displayName || 'Collector'}</h3>
              <p>{user.email}</p>
            </div>
          </div>

          <nav className="profile-sidebar__nav">
            {SIDEBAR_NAV.map(item => (
              <button
                key={item.key}
                className={`profile-sidebar__link ${activeTab === item.key ? 'profile-sidebar__link--active' : ''}`}
                onClick={() => { setActiveTab(item.key); setMobileNavOpen(false); }}
              >
                {item.icon}
                <span>{item.label}</span>
                <ChevronRight size={14} className="profile-sidebar__chevron" />
              </button>
            ))}
          </nav>

          <button className="profile-sidebar__logout" onClick={logout}>
            <LogOut size={16} /> Sign Out
          </button>
        </aside>

        <div className="profile-content">
          <div className="profile-mobile-nav">
            <button className="profile-mobile-nav__toggle" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
              {SIDEBAR_NAV.find(n => n.key === activeTab)?.icon}
              <span>{SIDEBAR_NAV.find(n => n.key === activeTab)?.label}</span>
              <ChevronDown size={14} />
            </button>
            <AnimatePresence>
              {mobileNavOpen && (
                <motion.div className="profile-mobile-nav__dropdown" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  {SIDEBAR_NAV.map(item => (
                    <button
                      key={item.key}
                      className={`profile-mobile-nav__item ${activeTab === item.key ? 'profile-mobile-nav__item--active' : ''}`}
                      onClick={() => { setActiveTab(item.key); setMobileNavOpen(false); }}
                    >
                      {item.icon} {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="profile-content__header">
            <h2>{SIDEBAR_NAV.find(n => n.key === activeTab)?.label}</h2>
          </div>

          <AnimatePresence mode="wait">
            {renderTabContent()}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
};

export default ProfilePage;
