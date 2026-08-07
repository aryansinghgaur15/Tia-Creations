import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Palette, Image, ShoppingBag, FileText,
  Clock, CheckCircle, XCircle, Eye, ChevronRight, Search, Filter,
  DollarSign, Shield, TrendingUp, AlertTriangle, Ban, UserX,
  ExternalLink, ArrowUpRight, RefreshCw, Download, Bell, Settings,
  BarChart3, CreditCard, FolderOpen, Layers, ChevronDown, LogOut,
  Menu, X, Plus, Edit3, Trash2, MoreHorizontal, Calendar,
  Tag, Package, Star, Zap, MessageSquare
} from 'lucide-react';
import ArtistApplications from '../components/admin/ArtistApplications';
import './AdminPage.css';

const API = import.meta.env.VITE_API_URL || window.location.origin;

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Manage',
    items: [
      { id: 'artists', label: 'Artist Applications', icon: Palette },
      { id: 'moderation', label: 'Artwork Moderation', icon: Image },
      { id: 'users', label: 'Users', icon: Users },
      { id: 'artworks', label: 'All Artworks', icon: Layers },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { id: 'orders', label: 'Orders', icon: ShoppingBag },
      { id: 'payments', label: 'Payments', icon: CreditCard },
      { id: 'collections', label: 'Collections', icon: FolderOpen },
    ],
  },
  {
    label: 'Taxonomy',
    items: [
      { id: 'categories', label: 'Categories', icon: Tag },
      { id: 'mediums', label: 'Mediums', icon: Palette },
      { id: 'styles', label: 'Styles', icon: Layers },
      { id: 'themes', label: 'Themes', icon: Star },
      { id: 'subjects', label: 'Subjects', icon: Image },
    ],
  },
  {
    label: 'Content',
    items: [
      { id: 'cms', label: 'CMS Pages', icon: FileText },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'audit', label: 'Audit Log', icon: Shield },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

const ALL_NAV = NAV_SECTIONS.flatMap(s => s.items);

const apiFetch = async (path, opts = {}) => {
  const token = JSON.parse(localStorage.getItem('tia_auth') || '{}').accessToken;
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.json();
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const initials = (s) => (s || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API}${url}`;
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.04 } }),
};

/* ═══════════════════════════════════════════════════════════════ */
/*  MAIN SHELL                                                    */
/* ═══════════════════════════════════════════════════════════════ */
const AdminPage = () => {
  const { user, isAdmin, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingCounts, setPendingCounts] = useState({ artists: 0, artworks: 0 });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
    else if (!loading && user && !isAdmin) navigate('/', { replace: true });
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    apiFetch('/api/admin/reports').then(d => {
      setPendingCounts({ artists: d.kpis.pendingArtists, artworks: d.kpis.pendingArtworks });
    }).catch(() => {});
  }, [isAdmin, activeTab]);

  const fetchNotifications = useCallback(() => {
    if (!isAdmin) return;
    apiFetch('/api/admin/notifications?limit=10').then(d => {
      setNotifications(d.items);
      setUnreadCount(d.unreadCount);
    }).catch(() => {});
  }, [isAdmin]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications, activeTab]);

  const markNotifRead = async (id) => {
    try {
      await apiFetch(`/api/admin/notifications/${id}/read`, { method: 'PATCH' });
      fetchNotifications();
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await apiFetch('/api/admin/notifications/mark-all-read', { method: 'POST' });
      fetchNotifications();
    } catch {}
  };

  useEffect(() => {
    const close = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (loading) return <div className="admin-page"><div className="admin-loading"><div className="admin-loading__spinner" /><p>Loading Admin Console...</p></div></div>;
  if (!user || !isAdmin) return null;

  const currentNav = ALL_NAV.find(n => n.id === activeTab);
  const totalPending = pendingCounts.artists + pendingCounts.artworks;

  const navigateTab = (tab) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
    setSearchQuery('');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab onNavigate={navigateTab} />;
      case 'analytics': return <AnalyticsTab />;
      case 'artists': return <ArtistsTab searchQuery={searchQuery} />;
      case 'moderation': return <ModerationTab />;
      case 'users': return <UsersTab searchQuery={searchQuery} />;
      case 'artworks': return <AllArtworksTab searchQuery={searchQuery} />;
      case 'orders': return <OrdersTab searchQuery={searchQuery} />;
      case 'payments': return <PaymentsTab searchQuery={searchQuery} />;
      case 'collections': return <CollectionsTab searchQuery={searchQuery} />;
      case 'categories': return <CategoriesTab searchQuery={searchQuery} />;
      case 'mediums': return <TaxonomyTab type="medium" label="Mediums" icon={Palette} searchQuery={searchQuery} />;
      case 'styles': return <TaxonomyTab type="style" label="Styles" icon={Layers} searchQuery={searchQuery} />;
      case 'themes': return <TaxonomyTab type="theme" label="Themes" icon={Star} searchQuery={searchQuery} />;
      case 'subjects': return <TaxonomyTab type="subject" label="Subjects" icon={Image} searchQuery={searchQuery} />;
      case 'cms': return <CMSTab searchQuery={searchQuery} />;
      case 'notifications': return <NotificationsTab />;
      case 'audit': return <AuditTab />;
      case 'settings': return <SettingsTab user={user} />;
      default: return <DashboardTab onNavigate={navigateTab} />;
    }
  };

  return (
    <div className="admin-page">
      {/* ── Desktop Sidebar ── */}
      <aside className={`admin-sidebar ${sidebarOpen ? '' : 'admin-sidebar--collapsed'}`}>
        <div className="admin-sidebar__header">
          <div className="admin-sidebar__logo">
            <Shield size={20} />
            {sidebarOpen && <span>TIA Admin</span>}
          </div>
          <button className="admin-sidebar__toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <ChevronRight size={16} style={{ transform: sidebarOpen ? 'rotate(180deg)' : '' }} />
          </button>
        </div>

        <nav className="admin-sidebar__nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="admin-sidebar__section">
              {sidebarOpen && <span className="admin-sidebar__section-label">{section.label}</span>}
              {section.items.map((item) => {
                const Icon = item.icon;
                const badge = item.id === 'artists' ? pendingCounts.artists : item.id === 'moderation' ? pendingCounts.artworks : 0;
                return (
                  <button
                    key={item.id}
                    className={`admin-sidebar__item ${activeTab === item.id ? 'admin-sidebar__item--active' : ''}`}
                    onClick={() => navigateTab(item.id)}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <Icon size={18} />
                    {sidebarOpen && (
                      <>
                        <span>{item.label}</span>
                        {badge > 0 && <span className="admin-sidebar__badge">{badge}</span>}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__avatar">{initials(user.fullName || user.displayName)}</div>
            {sidebarOpen && (
              <div className="admin-sidebar__user-info">
                <span className="admin-sidebar__user-name">{user.fullName || user.displayName || 'Admin'}</span>
                <span className="admin-sidebar__user-role">Administrator</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileSidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />}
      <aside className={`admin-mobile-sidebar ${mobileSidebarOpen ? 'admin-mobile-sidebar--open' : ''}`}>
        <div className="admin-mobile-sidebar__header">
          <div className="admin-sidebar__logo"><Shield size={20} /><span>TIA Admin</span></div>
          <button onClick={() => setMobileSidebarOpen(false)}><X size={20} /></button>
        </div>
        <nav className="admin-mobile-sidebar__nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <span className="admin-sidebar__section-label">{section.label}</span>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} className={`admin-sidebar__item ${activeTab === item.id ? 'admin-sidebar__item--active' : ''}`} onClick={() => navigateTab(item.id)}>
                    <Icon size={18} /><span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── Main Area ── */}
      <div className="admin-main">
        {/* ── Top Header Bar ── */}
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <button className="admin-topbar__menu-btn" onClick={() => setMobileSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="admin-topbar__breadcrumb">
              <span className="admin-topbar__breadcrumb-section">Admin</span>
              <ChevronRight size={14} />
              <span className="admin-topbar__breadcrumb-current">{currentNav?.label || 'Dashboard'}</span>
            </div>
          </div>

          <div className="admin-topbar__right">
            <div className="admin-topbar__search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search users, artworks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && <button onClick={() => setSearchQuery('')}><X size={14} /></button>}
            </div>

            <div className="admin-topbar__actions" ref={notifRef}>
              <button className="admin-topbar__icon-btn" onClick={() => setNotifOpen(!notifOpen)}>
                <Bell size={18} />
                {unreadCount > 0 && <span className="admin-topbar__notif-badge">{unreadCount}</span>}
              </button>
              {notifOpen && (
                <div className="admin-topbar__dropdown">
                  <div className="admin-topbar__dropdown-header">
                    <span>Notifications</span>
                    {unreadCount > 0 && <button className="admin-topbar__link-btn" onClick={markAllRead}>Mark all read</button>}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="admin-topbar__dropdown-empty">
                      <Bell size={24} />
                      <span>No notifications</span>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        className={`admin-topbar__dropdown-item ${!n.readAt ? 'admin-topbar__dropdown-item--unread' : ''}`}
                        onClick={() => { markNotifRead(n.id); }}
                      >
                        <Bell size={16} style={{ color: n.readAt ? '#9CA3AF' : 'var(--gold)' }} />
                        <div>
                          <span>{n.body}</span>
                          <small>{fmtDate(n.createdAt)}</small>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="admin-topbar__actions" ref={profileRef}>
              <button className="admin-topbar__profile-btn" onClick={() => setProfileOpen(!profileOpen)}>
                <div className="admin-topbar__profile-avatar">{initials(user.fullName || user.displayName)}</div>
                <span className="admin-topbar__profile-name">{user.fullName || user.displayName || 'Admin'}</span>
                <ChevronDown size={14} />
              </button>
              {profileOpen && (
                <div className="admin-topbar__dropdown admin-topbar__dropdown--profile">
                  <div className="admin-topbar__dropdown-user">
                    <div className="admin-topbar__profile-avatar admin-topbar__profile-avatar--lg">{initials(user.fullName || user.displayName)}</div>
                    <div>
                      <strong>{user.fullName || user.displayName}</strong>
                      <small>{user.email}</small>
                    </div>
                  </div>
                  <div className="admin-topbar__dropdown-divider" />
                  <button className="admin-topbar__dropdown-item" onClick={() => { navigateTab('settings'); setProfileOpen(false); }}>
                    <Settings size={16} /><span>Settings</span>
                  </button>
                  <button className="admin-topbar__dropdown-item" onClick={() => { logout(); navigate('/'); }}>
                    <LogOut size={16} /><span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="admin-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  DASHBOARD OVERVIEW                                            */
/* ═══════════════════════════════════════════════════════════════ */
const DashboardTab = ({ onNavigate }) => {
  const [kpis, setKpis] = useState(null);
  const [audit, setAudit] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/admin/reports'),
      apiFetch('/api/admin/audit'),
      apiFetch('/api/admin/revenue'),
    ]).then(([r, a, rev]) => { setKpis(r.kpis); setAudit(a.log); setRevenue(rev); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading"><div className="admin-loading__spinner" /><p>Loading dashboard...</p></div>;

  const metricCards = [
    { label: 'Total Users', value: kpis?.users ?? 0, icon: Users, color: '#4F46E5', bg: 'rgba(79,70,229,0.08)' },
    { label: 'Approved Artists', value: kpis?.artists ?? 0, icon: Palette, color: '#B88945', bg: 'rgba(184,137,69,0.08)' },
    { label: 'Published Artworks', value: kpis?.published ?? 0, icon: Image, color: '#059669', bg: 'rgba(5,150,105,0.08)' },
    { label: 'Total Orders', value: kpis?.orders ?? 0, icon: ShoppingBag, color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
    { label: 'Total Artworks', value: kpis?.artworks ?? 0, icon: Layers, color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
    { label: 'Pending Reviews', value: (kpis?.pendingArtists ?? 0) + (kpis?.pendingArtworks ?? 0), icon: Clock, color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
  ];

  const AUDIT_ICONS = {
    approve_artist: { icon: CheckCircle, color: '#059669', label: 'Approved artist' },
    reject_artist: { icon: XCircle, color: '#DC2626', label: 'Rejected artist' },
    approve_artwork: { icon: CheckCircle, color: '#4F46E5', label: 'Published artwork' },
    reject_artwork: { icon: XCircle, color: '#DC2626', label: 'Rejected artwork' },
    ban_user: { icon: Ban, color: '#DC2626', label: 'Banned user' },
    unban_user: { icon: CheckCircle, color: '#059669', label: 'Unbanned user' },
    feature_artwork: { icon: Star, color: '#B88945', label: 'Featured artwork' },
    unfeature_artwork: { icon: Star, color: '#6B7280', label: 'Unfeatured artwork' },
    request_info_artist: { icon: MessageSquare, color: '#F59E0B', label: 'Requested info' },
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-content__header">
        <div className="admin-content__title-row">
          <h1 className="admin-content__title">Dashboard Overview</h1>
          <p className="admin-content__subtitle">Welcome back. Here's your marketplace at a glance.</p>
        </div>
      </div>

      <div className="admin-kpi">
        {metricCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} className="admin-kpi__card" variants={fadeUp} initial="hidden" animate="visible" custom={i}>
              <div className="admin-kpi__icon" style={{ background: kpi.bg, color: kpi.color }}><Icon size={20} /></div>
              <div className="admin-kpi__info">
                <span className="admin-kpi__label">{kpi.label}</span>
                <span className="admin-kpi__value">{kpi.value.toLocaleString()}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="admin-dashboard__grid">
        {/* Pending Actions */}
        <motion.div className="admin-panel" variants={fadeUp} initial="hidden" animate="visible" custom={6}>
          <div className="admin-panel__head">
            <h3><Zap size={18} /> Pending Actions</h3>
          </div>
          <div className="admin-panel__body">
            {(kpis?.pendingArtists ?? 0) > 0 && (
              <button className="admin-action-row" onClick={() => onNavigate('artists')}>
                <div className="admin-action-row__left">
                  <div className="admin-action-row__icon" style={{ background: 'rgba(184,137,69,0.1)', color: '#B88945' }}><Palette size={16} /></div>
                  <div>
                    <span className="admin-action-row__title">{kpis.pendingArtists} Artist Application{kpis.pendingArtists !== 1 ? 's' : ''}</span>
                    <span className="admin-action-row__sub">Awaiting review and approval</span>
                  </div>
                </div>
                <ChevronRight size={16} />
              </button>
            )}
            {(kpis?.pendingArtworks ?? 0) > 0 && (
              <button className="admin-action-row" onClick={() => onNavigate('moderation')}>
                <div className="admin-action-row__left">
                  <div className="admin-action-row__icon" style={{ background: 'rgba(5,150,105,0.1)', color: '#059669' }}><Image size={16} /></div>
                  <div>
                    <span className="admin-action-row__title">{kpis.pendingArtworks} Artwork{kpis.pendingArtworks !== 1 ? 's' : ''}</span>
                    <span className="admin-action-row__sub">Awaiting moderation</span>
                  </div>
                </div>
                <ChevronRight size={16} />
              </button>
            )}
            {(kpis?.pendingArtists ?? 0) === 0 && (kpis?.pendingArtworks ?? 0) === 0 && (
              <div className="admin-panel__empty">
                <CheckCircle size={32} />
                <p>All caught up! No pending actions.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Revenue Summary */}
        <motion.div className="admin-panel" variants={fadeUp} initial="hidden" animate="visible" custom={7}>
          <div className="admin-panel__head">
            <h3><DollarSign size={18} /> Revenue Summary</h3>
          </div>
          <div className="admin-panel__body">
            {revenue ? (
              <>
                <div className="admin-revenue-bars">
                  {revenue.bars.map((bar) => (
                    <div key={bar.day} className="admin-revenue-bar">
                      <div className="admin-revenue-bar__track">
                        <div
                          className="admin-revenue-bar__fill"
                          style={{ height: `${bar.height}%`, background: bar.revenue > 0 ? 'var(--gold)' : '#E5E7EB' }}
                          title={bar.revenue > 0 ? `${bar.date}: ${fmtCurrency(bar.revenue)}` : `${bar.date}: No sales`}
                        />
                      </div>
                      <span className="admin-revenue-bar__label">{bar.day}</span>
                    </div>
                  ))}
                </div>
                <div className="admin-revenue-summary">
                  <div className="admin-revenue-stat">
                    <span className="admin-revenue-stat__label">This Week</span>
                    <span className="admin-revenue-stat__value">{fmtCurrency(revenue.weekTotal)}</span>
                  </div>
                  <div className="admin-revenue-stat">
                    <span className="admin-revenue-stat__label">This Month</span>
                    <span className="admin-revenue-stat__value">{fmtCurrency(revenue.monthTotal)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="admin-panel__empty"><DollarSign size={32} /><p>Loading revenue data...</p></div>
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div className="admin-panel admin-panel--wide" variants={fadeUp} initial="hidden" animate="visible" custom={8}>
          <div className="admin-panel__head">
            <h3><Clock size={18} /> Recent Activity</h3>
            <button className="admin-panel__link" onClick={() => onNavigate('audit')}>View All <ChevronRight size={14} /></button>
          </div>
          <div className="admin-panel__body">
            {audit.length === 0 ? (
              <div className="admin-panel__empty"><FileText size={32} /><p>No recent activity.</p></div>
            ) : (
              <div className="admin-activity-list">
                {audit.slice(0, 5).map((entry, i) => {
                  const config = AUDIT_ICONS[entry.action] || { icon: Clock, color: '#6B7280', label: entry.action };
                  const Icon = config.icon;
                  return (
                    <div key={entry.id} className="admin-activity-item">
                      <div className="admin-activity-item__icon" style={{ color: config.color, background: `${config.color}12` }}>
                        <Icon size={14} />
                      </div>
                      <div className="admin-activity-item__content">
                        <span>{config.label}</span>
                        <small>{fmtDate(entry.createdAt)}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  ARTIST APPLICATIONS (full module)                             */
/* ═══════════════════════════════════════════════════════════════ */
const ArtistsTab = ({ searchQuery }) => <ArtistApplications searchQuery={searchQuery} />;

/* ═══════════════════════════════════════════════════════════════ */
/*  ARTWORK MODERATION                                            */
/* ═══════════════════════════════════════════════════════════════ */
const MOD_STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'in_review', label: 'Under Review' },
  { key: 'changes_requested', label: 'Changes Requested' },
  { key: 'published', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'archived', label: 'Archived' },
  { key: 'draft', label: 'Drafts' },
];

const ModerationTab = () => {
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [selected, setSelected] = useState({});
  const [detailArtwork, setDetailArtwork] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchStats = useCallback(() => {
    apiFetch('/api/admin/moderation/stats').then(setStats).catch(() => {});
  }, []);

  const fetchQueue = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20', sort });
    if (statusTab) params.set('status', statusTab);
    if (debouncedSearch) params.set('search', debouncedSearch);
    apiFetch(`/api/admin/moderation/queue?${params}`)
      .then(d => { setItems(d.items); setTotal(d.total); setTotalPages(d.totalPages); })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [page, statusTab, sort, debouncedSearch]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const refresh = () => { fetchStats(); fetchQueue(); };

  const toggleSelect = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  const pageIds = items.map(a => a.id);
  const selectedIds = pageIds.filter(id => selected[id]);
  const clearSelection = () => setSelected({});

    const openDetail = async (artworkId) => {
    try {
      const d = await apiFetch(`/api/artworks/${artworkId}`);
      setDetailArtwork(d.artwork);
    } catch { setDetailArtwork(null); }
  };

  const executeAction = async (artworkId, action, body = {}) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await apiFetch(`/api/artworks/${artworkId}/${action}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setActionModal(null);
      refresh();
      setDetailArtwork(null);
    } catch (err) { setActionError(err.message); }
    setActionLoading(false);
  };

  const handleBulk = async (action) => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Apply "${action}" to ${selectedIds.length} artwork(s)?`)) return;
    setActionError(null);
    try {
      await apiFetch('/api/admin/moderation/bulk', {
        method: 'POST',
        body: JSON.stringify({ action, artworkIds: selectedIds }),
      });
      clearSelection();
      refresh();
    } catch (err) { setActionError(err.message); }
  };

  const IMG = (artwork) => {
    const imgs = artwork?.images;
    if (Array.isArray(imgs) && imgs.length > 0) {
      const first = imgs[0]?.thumb || imgs[0]?.featured || imgs[0]?.full || null;
      return resolveImageUrl(first);
    }
    return resolveImageUrl(artwork?.thumbnail || null);
  };

  const statusBadge = (s) => {
    const m = { in_review: 'warning', changes_requested: 'info', published: 'success', rejected: 'pending', archived: 'neutral', draft: 'neutral', sold: 'admin' };
    return m[s] || 'neutral';
  };

  return (
    <div>
      <div className="admin-content__header">
        <div className="admin-content__title-row">
          <div>
            <h1 className="admin-content__title">Artwork Moderation</h1>
            <p className="admin-content__subtitle">Review and manage artwork submissions before they are published on the marketplace.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {selectedIds.length > 0 && (
              <>
                <button className="admin-action-btn" onClick={() => handleBulk('move_to_review')}><Eye size={14} /> Move to Review ({selectedIds.length})</button>
                <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleBulk('archive')}><Trash2 size={14} /> Archive ({selectedIds.length})</button>
                <button className="admin-ghost-btn" onClick={clearSelection}>Clear</button>
              </>
            )}
            <button className="admin-ghost-btn" onClick={refresh}><RefreshCw size={14} /> Refresh</button>
          </div>
        </div>
      </div>
      {actionError && (
        <div className="admin-banner admin-banner--error" style={{ margin: '0 0 16px' }}>
          <span>{actionError}</span>
          <button className="admin-banner__close" onClick={() => setActionError(null)}>✕</button>
        </div>
      )}

      {stats && (
        <div className="admin-kpi">
          <div className="admin-kpi__card" style={{ cursor: 'pointer' }} onClick={() => { setStatusTab('in_review'); setPage(1); }}>
            <div className="admin-kpi__icon" style={{ background: '#FEF3C7', color: '#D97706' }}><Clock size={20} /></div>
            <div className="admin-kpi__info"><p className="admin-kpi__label">Pending Review</p><p className="admin-kpi__value">{stats.inReview}</p></div>
          </div>
          <div className="admin-kpi__card" style={{ cursor: 'pointer' }} onClick={() => { setStatusTab('changes_requested'); setPage(1); }}>
            <div className="admin-kpi__icon" style={{ background: '#DBEAFE', color: '#2563EB' }}><MessageSquare size={20} /></div>
            <div className="admin-kpi__info"><p className="admin-kpi__label">Changes Requested</p><p className="admin-kpi__value">{stats.changesRequested}</p></div>
          </div>
          <div className="admin-kpi__card" style={{ cursor: 'pointer' }} onClick={() => { setStatusTab('published'); setPage(1); }}>
            <div className="admin-kpi__icon" style={{ background: '#D1FAE5', color: '#059669' }}><CheckCircle size={20} /></div>
            <div className="admin-kpi__info"><p className="admin-kpi__label">Approved</p><p className="admin-kpi__value">{stats.published}</p></div>
          </div>
          <div className="admin-kpi__card" style={{ cursor: 'pointer' }} onClick={() => { setStatusTab('rejected'); setPage(1); }}>
            <div className="admin-kpi__icon" style={{ background: '#FEE2E2', color: '#DC2626' }}><XCircle size={20} /></div>
            <div className="admin-kpi__info"><p className="admin-kpi__label">Rejected</p><p className="admin-kpi__value">{stats.rejected}</p></div>
          </div>
        </div>
      )}

      <div className="admin-filters">
        <div className="admin-filters__row">
          <div className="admin-filters__group">
            <Search size={14} />
            <input className="admin-filters__input" placeholder="Search title, artist, ID..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="admin-filters__group">
            <Filter size={14} />
            <select className="admin-filters__select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_high">Highest Price</option>
              <option value="price_low">Lowest Price</option>
              <option value="updated">Recently Updated</option>
            </select>
          </div>
        </div>
      </div>

      <div className="admin-moderation-tabs">
        {MOD_STATUS_TABS.map(tab => {
          const count = tab.key === '' ? total : (tab.key === 'in_review' ? stats?.inReview : tab.key === 'changes_requested' ? stats?.changesRequested : tab.key === 'published' ? stats?.published : tab.key === 'rejected' ? stats?.rejected : tab.key === 'archived' ? stats?.archived : stats?.draft);
          return (
            <button key={tab.key} className={`admin-moderation-tab ${statusTab === tab.key ? 'admin-moderation-tab--active' : ''}`}
              onClick={() => { setStatusTab(tab.key); setPage(1); }}>
              {tab.label}{count !== undefined && <span className="admin-moderation-tab__count">{count}</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="admin-loading"><div className="admin-loading__spinner" /><p>Loading artworks...</p></div>
      ) : items.length === 0 ? (
        <div className="admin-panel"><div className="admin-panel__empty"><Image size={40} /><p>No artworks found</p></div></div>
      ) : (
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}><input type="checkbox" onChange={e => {
                  const checked = e.target.checked;
                  const next = {};
                  if (checked) items.forEach(a => { next[a.id] = true; });
                  setSelected(prev => {
                    const cleaned = {};
                    Object.keys(prev).forEach(k => { if (!pageIds.includes(k)) cleaned[k] = prev[k]; });
                    return { ...cleaned, ...next };
                  });
                }} checked={selectedIds.length === items.length && items.length > 0} /></th>
                <th>Artwork</th>
                <th>Artist</th>
                <th>Medium</th>
                <th>Price</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(art => (
                <tr key={art.id}>
                  <td><input type="checkbox" checked={!!selected[art.id]} onChange={() => toggleSelect(art.id)} /></td>
                  <td>
                    <div className="admin-table__artwork-cell">
                      {IMG(art) ? <img src={IMG(art)} alt="" className="admin-table__thumb" /> : <div className="admin-table__thumb admin-table__thumb--empty"><Image size={16} /></div>}
                      <span className="admin-table__name" style={{ cursor: 'pointer' }} onClick={() => openDetail(art.id)}>{art.title}</span>
                    </div>
                  </td>
                  <td>{art.artist?.displayName || 'Unknown'}</td>
                  <td>{art.medium || '—'}</td>
                  <td className="admin-table__amount">{fmtCurrency(art.price)}</td>
                  <td className="admin-table__date">{fmtDate(art.createdAt)}</td>
                  <td><span className={`admin-badge admin-badge--${statusBadge(art.status)}`}>{art.status?.replace('_', ' ')}</span></td>
                  <td className="admin-table__actions-cell">
                    <div className="admin-table__actions">
                      <button className="admin-action-btn" onClick={() => openDetail(art.id)} title="Review"><Eye size={14} /></button>
                      {art.status === 'in_review' && (
                        <>
                          <button className="admin-approve-btn" onClick={() => setActionModal({ type: 'approve', artwork: art })} title="Approve"><CheckCircle size={14} /></button>
                          <button className="admin-reject-btn" onClick={() => setActionModal({ type: 'reject', artwork: art })} title="Reject"><XCircle size={14} /></button>
                        </>
                      )}
                      {art.status === 'published' && (
                        <button className="admin-action-btn" onClick={() => setActionModal({ type: 'feature', artwork: art })} title={art.isFeatured ? 'Unfeature' : 'Feature'}>
                          <Star size={14} style={{ color: art.isFeatured ? '#B88945' : undefined }} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button className="admin-pagination__btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="admin-pagination__info">Page {page} of {totalPages} ({total} total)</span>
          <button className="admin-pagination__btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {detailArtwork && (
        <ArtworkDetailModal artwork={detailArtwork} onClose={() => setDetailArtwork(null)}
          onAction={(type, art) => setActionModal({ type, artwork: art })} />
      )}

      {/* ── ACTION MODALS ── */}
      {actionModal && (
        <ModerationActionModal modal={actionModal} onClose={() => setActionModal(null)}
          onExecute={executeAction} loading={actionLoading} />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  ARTWORK DETAIL MODAL                                          */
/* ═══════════════════════════════════════════════════════════════ */
const ArtworkDetailModal = ({ artwork, onClose, onAction }) => {
  const [imgIdx, setImgIdx] = useState(0);
  const [auditLog, setAuditLog] = useState([]);
  const images = Array.isArray(artwork.images) ? artwork.images : [];
  const imgUrl = (img) => img?.full || img?.featured || img?.thumb || null;
  const currentImg = resolveImageUrl(imgUrl(images[imgIdx]) || artwork.thumbnail || null);

  useEffect(() => {
    setImgIdx(0);
  }, [artwork.id]);

  useEffect(() => {
    apiFetch(`/api/admin/audit?entityType=artwork&entityId=${artwork.id}&limit=20`)
      .then(d => setAuditLog(d.log || []))
      .catch(() => {});
  }, [artwork.id]);

  const canApprove = artwork.status === 'in_review';
  const canReject = artwork.status === 'in_review';
  const canRequestChanges = artwork.status === 'in_review';
  const canFeature = artwork.status === 'published';
  const canArchive = ['published', 'rejected'].includes(artwork.status);

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2>{artwork.title}</h2>
          <button className="admin-ghost-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="admin-modal__body">
          <div className="mod-detail-layout">
            <div className="mod-detail-gallery">
              {currentImg ? (
                <img src={currentImg} alt={artwork.title} className="mod-detail-gallery__main" />
              ) : (
                <div className="mod-detail-gallery__empty"><Image size={48} /><p>No images</p></div>
              )}
              {images.length > 1 && (
                <div className="mod-detail-gallery__thumbs">
                  {images.map((img, i) => {
                    const thumb = imgUrl(img);
                    const resolved = resolveImageUrl(thumb);
                    return resolved ? (
                      <img key={i} src={resolved} alt="" className={`mod-detail-gallery__thumb ${i === imgIdx ? 'mod-detail-gallery__thumb--active' : ''}`}
                        onClick={() => setImgIdx(i)} />
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <div className="mod-detail-info">
              <div className="mod-detail-section">
                <h3>Artwork Information</h3>
                <div className="mod-detail-grid">
                  <div className="mod-detail-field"><label>Title</label><span>{artwork.title}</span></div>
                  {artwork.description && <div className="mod-detail-field mod-detail-field--full"><label>Description</label><span>{artwork.description}</span></div>}
                  {artwork.medium && <div className="mod-detail-field"><label>Medium</label><span>{artwork.medium}</span></div>}
                  {artwork.style && <div className="mod-detail-field"><label>Style</label><span>{artwork.style}</span></div>}
                  {artwork.subject && <div className="mod-detail-field"><label>Subject</label><span>{artwork.subject}</span></div>}
                  {artwork.dimensions && <div className="mod-detail-field"><label>Dimensions</label><span>{artwork.dimensions}</span></div>}
                  {artwork.orientation && <div className="mod-detail-field"><label>Orientation</label><span>{artwork.orientation}</span></div>}
                  {artwork.year && <div className="mod-detail-field"><label>Year</label><span>{artwork.year}</span></div>}
                  <div className="mod-detail-field"><label>Price</label><span>{fmtCurrency(artwork.price)}</span></div>
                  <div className="mod-detail-field"><label>Certificate</label><span>{artwork.certificate ? 'Included' : 'None'}</span></div>
                  {artwork.tags && artwork.tags.length > 0 && (
                    <div className="mod-detail-field mod-detail-field--full">
                      <label>Tags</label>
                      <div className="mod-detail-tags">{(Array.isArray(artwork.tags) ? artwork.tags : []).map(t => <span key={t} className="admin-badge admin-badge--neutral">{t}</span>)}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mod-detail-section">
                <h3>Artist</h3>
                <div className="mod-detail-artist">
                  {artwork.artist?.avatarUrl ? <img src={artwork.artist.avatarUrl} alt="" className="mod-detail-artist__avatar" /> : <div className="mod-detail-artist__avatar mod-detail-artist__avatar--empty"><Users size={20} /></div>}
                  <div>
                    <p className="mod-detail-artist__name">{artwork.artist?.displayName || 'Unknown'}</p>
                    <span className={`admin-badge admin-badge--${artwork.artist?.artistStatus === 'approved' ? 'success' : 'neutral'}`}>{artwork.artist?.artistStatus || 'unknown'}</span>
                  </div>
                </div>
              </div>

              <div className="mod-detail-section">
                <h3>Status & History</h3>
                <div className="mod-detail-grid">
                  <div className="mod-detail-field"><label>Current Status</label><span className={`admin-badge admin-badge--${artwork.status === 'published' ? 'success' : artwork.status === 'in_review' ? 'warning' : artwork.status === 'rejected' ? 'pending' : 'neutral'}`}>{artwork.status?.replace('_', ' ')}</span></div>
                  <div className="mod-detail-field"><label>Featured</label><span>{artwork.isFeatured ? 'Yes' : 'No'}</span></div>
                  <div className="mod-detail-field"><label>Views</label><span>{artwork.views || 0}</span></div>
                  <div className="mod-detail-field"><label>Saves</label><span>{artwork.saves || 0}</span></div>
                  <div className="mod-detail-field"><label>Created</label><span>{fmtDate(artwork.createdAt)}</span></div>
                  {artwork.publishedAt && <div className="mod-detail-field"><label>Published</label><span>{fmtDate(artwork.publishedAt)}</span></div>}
                </div>
              </div>

              {auditLog.length > 0 && (
                <div className="mod-detail-section">
                  <h3>Moderation History</h3>
                  <div className="admin-audit" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                    {auditLog.map((entry, i) => {
                      const AUDIT_ICONS = { approve_artwork: CheckCircle, reject_artwork: XCircle, feature_artwork: Star, unfeature_artwork: Star, request_changes_artwork: MessageSquare, archive_artwork: Package, move_artwork_to_review: Eye };
                      const AUDIT_COLORS = { approve_artwork: '#059669', reject_artwork: '#DC2626', feature_artwork: '#B88945', unfeature_artwork: '#6B7280', request_changes_artwork: '#2563EB', archive_artwork: '#6B7280', move_artwork_to_review: '#D97706' };
                      const Icon = AUDIT_ICONS[entry.action] || Clock;
                      const color = AUDIT_COLORS[entry.action] || '#6B7280';
                      return (
                        <div key={entry.id} className="admin-audit__item">
                          <div className="admin-audit__timeline">
                            <div className="admin-audit__icon" style={{ color, background: `${color}12` }}><Icon size={14} /></div>
                            {i < auditLog.length - 1 && <div className="admin-audit__line" />}
                          </div>
                          <div className="admin-audit__content">
                            <p className="admin-audit__text"><strong>{entry.action?.replace(/_/g, ' ')}</strong>
                              {entry.meta?.reason && <span> — {entry.meta.reason}</span>}
                              {entry.meta?.feedback && <span> — {entry.meta.feedback}</span>}
                            </p>
                            <div className="admin-audit__meta">
                              <span>{entry.admin?.displayName || 'Admin'}</span>
                              <span>·</span>
                              <Clock size={12} />
                              <span>{fmtDate(entry.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="admin-modal__footer">
          {canApprove && <button className="admin-approve-btn" onClick={() => onAction('approve', artwork)}><CheckCircle size={14} /> Approve</button>}
          {canRequestChanges && <button className="admin-action-btn" style={{ borderColor: '#2563EB', color: '#2563EB' }} onClick={() => onAction('request_changes', artwork)}><MessageSquare size={14} /> Request Changes</button>}
          {canReject && <button className="admin-reject-btn" onClick={() => onAction('reject', artwork)}><XCircle size={14} /> Reject</button>}
          {canFeature && <button className="admin-action-btn" onClick={() => onAction('feature', artwork)}><Star size={14} /> {artwork.isFeatured ? 'Unfeature' : 'Feature'}</button>}
          {canArchive && <button className="admin-action-btn admin-action-btn--danger" onClick={() => onAction('archive', artwork)}><Package size={14} /> Archive</button>}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  MODERATION ACTION MODAL                                       */
/* ═══════════════════════════════════════════════════════════════ */
const ModerationActionModal = ({ modal, onClose, onExecute, loading }) => {
  const { type, artwork } = modal;
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    if (type === 'reject' && !reason.trim()) return;
    if (type === 'request_changes' && !feedback.trim()) return;
    if (type === 'approve') onExecute(artwork.id, 'approve');
    else if (type === 'reject') onExecute(artwork.id, 'reject', { reason });
    else if (type === 'request_changes') onExecute(artwork.id, 'request-changes', { feedback });
    else if (type === 'feature') onExecute(artwork.id, 'feature', { featured: !artwork.isFeatured });
    else if (type === 'archive') onExecute(artwork.id, 'archive');
  };

  const titles = { approve: 'Approve Artwork', reject: 'Reject Artwork', request_changes: 'Request Changes', feature: artwork.isFeatured ? 'Unfeature Artwork' : 'Feature Artwork', archive: 'Archive Artwork' };
  const icons = { approve: CheckCircle, reject: XCircle, request_changes: MessageSquare, feature: Star, archive: Package };
  const colors = { approve: '#059669', reject: '#DC2626', request_changes: '#2563EB', feature: '#B88945', archive: '#6B7280' };
  const Icon = icons[type] || Clock;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="admin-modal__header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon size={20} style={{ color: colors[type] }} /> {titles[type]}</h2>
          <button className="admin-ghost-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="admin-modal__body">
          <p style={{ marginBottom: 12, color: 'var(--body)' }}>
            {type === 'approve' && `Approve "${artwork.title}" and publish it on the marketplace?`}
            {type === 'reject' && `Reject "${artwork.title}". The artist will be notified.`}
            {type === 'request_changes' && `Request changes for "${artwork.title}". Provide clear feedback for the artist.`}
            {type === 'feature' && `${artwork.isFeatured ? 'Remove' : 'Add'} "${artwork.title}" ${artwork.isFeatured ? 'from' : 'to'} featured artworks?`}
            {type === 'archive' && `Archive "${artwork.title}"? It will no longer be visible on the marketplace.`}
          </p>
          {type === 'reject' && (
            <div className="admin-form-group">
              <label>Rejection Reason *</label>
              <textarea className="admin-input" rows={3} placeholder="Explain why this artwork is being rejected..." value={reason} onChange={e => setReason(e.target.value)} />
            </div>
          )}
          {type === 'request_changes' && (
            <div className="admin-form-group">
              <label>Feedback for Artist *</label>
              <textarea className="admin-input" rows={4} placeholder="Describe what changes are needed. Be specific about image quality, description, pricing, etc..." value={feedback} onChange={e => setFeedback(e.target.value)} />
            </div>
          )}
        </div>
        <div className="admin-modal__footer">
          <button className="admin-ghost-btn" onClick={onClose} disabled={loading}>Cancel</button>
          <button className={type === 'approve' ? 'admin-approve-btn' : type === 'reject' ? 'admin-reject-btn' : 'admin-primary-btn'}
            onClick={handleSubmit} disabled={loading || (type === 'reject' && !reason.trim()) || (type === 'request_changes' && !feedback.trim())}>
            {loading ? 'Processing...' : titles[type]}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  USERS                                                         */
/* ═══════════════════════════════════════════════════════════════ */
const UsersTab = ({ searchQuery }) => {
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [artistFilter, setArtistFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionConfirm, setActionConfirm] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchStats = useCallback(() => {
    apiFetch('/api/admin/users/stats').then(setStats).catch(() => {});
  }, []);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20', sort });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (roleFilter) params.set('role', roleFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (artistFilter) params.set('artistStatus', artistFilter);
    apiFetch(`/api/admin/users?${params}`)
      .then(d => { setItems(d.items); setTotal(d.total); setTotalPages(d.totalPages); })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, roleFilter, statusFilter, artistFilter, sort]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const refresh = () => { fetchStats(); fetchUsers(); };

  const openDetail = async (userId) => {
    setDetailUser(userId);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const d = await apiFetch(`/api/admin/users/${userId}`);
      setDetailData(d);
    } catch { setDetailData(null); }
    setDetailLoading(false);
  };

  const executeAction = async (userId, action) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await apiFetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        body: JSON.stringify(action === 'ban' ? { ban: true } : {}),
      });
      setActionConfirm(null);
      refresh();
      if (detailUser === userId) openDetail(userId);
    } catch (err) { setActionError(err.message); }
    setActionLoading(false);
  };

  const COLORS = ['#4F46E5','#B88945','#059669','#7C3AED','#D97706','#DC2626','#0891B2','#BE185D'];

  const userStatusLabel = (s) => ({ active: 'Active', suspended: 'Suspended', banned: 'Banned' }[s] || s);
  const userStatusBadge = (s) => ({ active: 'success', suspended: 'warning', banned: 'pending' }[s] || 'neutral');
  const artistStatusLabel = (s) => ({ none: '—', pending: 'Pending', approved: 'Approved', rejected: 'Rejected', revoked: 'Revoked' }[s] || s);
  const artistStatusBadge = (s) => ({ approved: 'success', pending: 'warning', rejected: 'pending', revoked: 'admin' }[s] || 'neutral');

  return (
    <div>
      <div className="admin-content__header">
        <div className="admin-content__title-row">
          <div>
            <h1 className="admin-content__title">Users Management</h1>
            <p className="admin-content__subtitle">Manage platform accounts, roles, and access.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="admin-ghost-btn" onClick={refresh}><RefreshCw size={14} /> Refresh</button>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="admin-banner admin-banner--error" style={{ margin: '0 0 16px' }}>
          <span>{actionError}</span>
          <button className="admin-banner__close" onClick={() => setActionError(null)}>✕</button>
        </div>
      )}

      {stats && (
        <div className="admin-kpi">
          <div className="admin-kpi__card" style={{ cursor: 'pointer' }} onClick={() => { setRoleFilter(''); setStatusFilter(''); setArtistFilter(''); setPage(1); }}>
            <div className="admin-kpi__icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}><Users size={20} /></div>
            <div className="admin-kpi__info"><p className="admin-kpi__label">Total Users</p><p className="admin-kpi__value">{stats.total}</p></div>
          </div>
          <div className="admin-kpi__card" style={{ cursor: 'pointer' }} onClick={() => { setRoleFilter('user'); setArtistFilter('none'); setStatusFilter(''); setPage(1); }}>
            <div className="admin-kpi__icon" style={{ background: '#FEF3C7', color: '#D97706' }}><ShoppingBag size={20} /></div>
            <div className="admin-kpi__info"><p className="admin-kpi__label">Buyers</p><p className="admin-kpi__value">{stats.buyers}</p></div>
          </div>
          <div className="admin-kpi__card" style={{ cursor: 'pointer' }} onClick={() => { setRoleFilter(''); setArtistFilter('approved'); setStatusFilter(''); setPage(1); }}>
            <div className="admin-kpi__icon" style={{ background: '#F0FDF4', color: '#059669' }}><Palette size={20} /></div>
            <div className="admin-kpi__info"><p className="admin-kpi__label">Artists</p><p className="admin-kpi__value">{stats.artists}</p></div>
          </div>
          <div className="admin-kpi__card" style={{ cursor: 'pointer' }} onClick={() => { setRoleFilter(''); setStatusFilter('active'); setArtistFilter(''); setPage(1); }}>
            <div className="admin-kpi__icon" style={{ background: '#ECFDF5', color: '#10B981' }}><CheckCircle size={20} /></div>
            <div className="admin-kpi__info"><p className="admin-kpi__label">Active</p><p className="admin-kpi__value">{stats.active}</p></div>
          </div>
          <div className="admin-kpi__card" style={{ cursor: 'pointer' }} onClick={() => { setRoleFilter(''); setStatusFilter('suspended'); setArtistFilter(''); setPage(1); }}>
            <div className="admin-kpi__icon" style={{ background: '#FEF2F2', color: '#DC2626' }}><UserX size={20} /></div>
            <div className="admin-kpi__info"><p className="admin-kpi__label">Suspended</p><p className="admin-kpi__value">{(stats.suspended || 0) + (stats.banned || 0)}</p></div>
          </div>
        </div>
      )}

      <div className="admin-topbar" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div className="admin-search" style={{ flex: '1 1 200px' }}>
          <Search size={14} />
          <input type="text" placeholder="Search by name, email, or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="admin-select">
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="admin-select">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
        <select value={artistFilter} onChange={(e) => { setArtistFilter(e.target.value); setPage(1); }} className="admin-select">
          <option value="">All Types</option>
          <option value="none">Buyer</option>
          <option value="approved">Artist</option>
          <option value="pending">Pending Artist</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="admin-select">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name_asc">Name A-Z</option>
          <option value="name_desc">Name Z-A</option>
          <option value="recently_updated">Recently Updated</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loading"><div className="admin-loading__spinner" /><p>Loading users...</p></div>
      ) : items.length === 0 ? (
        <div className="admin-empty">
          <Users size={40} strokeWidth={1} />
          <h3>No users found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <p className="admin-pagination-info" style={{ marginBottom: 8 }}>Showing {items.length} of {total} users</p>
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Artist Status</th>
                  <th>Account Status</th>
                  <th>Artworks</th>
                  <th>Orders</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u, i) => (
                  <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(u.id)}>
                    <td className="admin-table__user">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" className="admin-table__avatar" />
                      ) : (
                        <div className="admin-table__avatar" style={{ background: COLORS[i % COLORS.length] }}>{initials(u.displayName)}</div>
                      )}
                      <span className="admin-table__name">{u.displayName}</span>
                    </td>
                    <td className="admin-table__email">{u.email}</td>
                    <td><span className={`admin-badge ${u.role === 'admin' ? 'admin-badge--admin' : 'admin-badge--user'}`}>{u.role}</span></td>
                    <td><span className={`admin-badge admin-badge--${artistStatusBadge(u.artistStatus)}`}>{artistStatusLabel(u.artistStatus)}</span></td>
                    <td><span className={`admin-badge admin-badge--${userStatusBadge(u.userStatus)}`}>{userStatusLabel(u.userStatus)}</span></td>
                    <td className="admin-table__num">{u._count?.artworks ?? 0}</td>
                    <td className="admin-table__num">{u._count?.orders ?? 0}</td>
                    <td className="admin-table__date">{fmtDate(u.createdAt)}</td>
                    <td className="admin-table__actions-cell" onClick={(e) => e.stopPropagation()}>
                      {u.role !== 'admin' && u.userStatus === 'active' && (
                        <button className="admin-action-btn" onClick={() => setActionConfirm({ userId: u.id, action: 'suspend', label: 'Suspend' })}>
                          <Ban size={14} /> Suspend
                        </button>
                      )}
                      {u.role !== 'admin' && u.userStatus === 'active' && (
                        <button className="admin-action-btn admin-action-btn--danger" onClick={() => setActionConfirm({ userId: u.id, action: 'ban', label: 'Ban' })}>
                          <UserX size={14} /> Ban
                        </button>
                      )}
                      {u.role !== 'admin' && (u.userStatus === 'suspended' || u.userStatus === 'banned') && (
                        <button className="admin-action-btn" onClick={() => setActionConfirm({ userId: u.id, action: 'reactivate', label: 'Reactivate' })}>
                          <CheckCircle size={14} /> Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button className="admin-ghost-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <span className="admin-pagination__info">Page {page} of {totalPages}</span>
              <button className="admin-ghost-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {actionConfirm && (
        <div className="admin-modal-backdrop" onClick={() => setActionConfirm(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal__title">
              {actionConfirm.action === 'suspend' && <><Ban size={18} /> Suspend User</>}
              {actionConfirm.action === 'ban' && <><UserX size={18} /> Ban User</>}
              {actionConfirm.action === 'reactivate' && <><CheckCircle size={18} /> Reactivate User</>}
            </h2>
            <p className="admin-modal__text">
              {actionConfirm.action === 'suspend' && 'This user will not be able to log in or perform actions. They will remain visible on the platform.'}
              {actionConfirm.action === 'ban' && 'This user will be permanently banned from the platform. They will not be able to log in.'}
              {actionConfirm.action === 'reactivate' && 'This user will regain full access to the platform.'}
            </p>
            <div className="admin-modal__actions">
              <button className="admin-ghost-btn" onClick={() => setActionConfirm(null)} disabled={actionLoading}>Cancel</button>
              <button
                className={`admin-action-btn ${actionConfirm.action === 'ban' ? 'admin-action-btn--danger' : ''}`}
                onClick={() => executeAction(actionConfirm.userId, actionConfirm.action)}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : `Confirm ${actionConfirm.label}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailUser && (
        <div className="admin-modal-backdrop" onClick={() => { setDetailUser(null); setDetailData(null); }}>
          <div className="admin-modal admin-modal--wide" onClick={(e) => e.stopPropagation()}>
            <button className="admin-modal__close" onClick={() => { setDetailUser(null); setDetailData(null); }}><X size={18} /></button>
            {detailLoading ? (
              <div className="admin-loading"><div className="admin-loading__spinner" /><p>Loading user details...</p></div>
            ) : detailData ? (
              <div className="user-detail">
                <div className="user-detail__header">
                  {detailData.user.avatarUrl ? (
                    <img src={detailData.user.avatarUrl} alt="" className="user-detail__avatar" />
                  ) : (
                    <div className="user-detail__avatar user-detail__avatar--placeholder" style={{ background: COLORS[0] }}>{initials(detailData.user.displayName)}</div>
                  )}
                  <div className="user-detail__header-info">
                    <h2 className="user-detail__name">{detailData.user.displayName}</h2>
                    <p className="user-detail__email">{detailData.user.email}</p>
                    <div className="user-detail__badges">
                      <span className={`admin-badge ${detailData.user.role === 'admin' ? 'admin-badge--admin' : 'admin-badge--user'}`}>{detailData.user.role}</span>
                      <span className={`admin-badge admin-badge--${userStatusBadge(detailData.user.userStatus)}`}>{userStatusLabel(detailData.user.userStatus)}</span>
                      {detailData.user.artistStatus !== 'none' && (
                        <span className={`admin-badge admin-badge--${artistStatusBadge(detailData.user.artistStatus)}`}>{detailData.user.artistStatus}</span>
                      )}
                    </div>
                  </div>
                  <div className="user-detail__actions">
                    {detailData.user.role !== 'admin' && detailData.user.userStatus === 'active' && (
                      <>
                        <button className="admin-action-btn" onClick={() => executeAction(detailUser, 'suspend')} disabled={actionLoading}><Ban size={14} /> Suspend</button>
                        <button className="admin-action-btn admin-action-btn--danger" onClick={() => executeAction(detailUser, 'ban')} disabled={actionLoading}><UserX size={14} /> Ban</button>
                      </>
                    )}
                    {detailData.user.role !== 'admin' && (detailData.user.userStatus === 'suspended' || detailData.user.userStatus === 'banned') && (
                      <button className="admin-action-btn" onClick={() => executeAction(detailUser, 'reactivate')} disabled={actionLoading}><CheckCircle size={14} /> Reactivate</button>
                    )}
                  </div>
                </div>

                <div className="user-detail__grid">
                  <div className="user-detail__section">
                    <h3 className="user-detail__section-title">Profile</h3>
                    <div className="user-detail__fields">
                      <div className="user-detail__field"><span className="user-detail__field-label">Full Name</span><span>{detailData.user.fullName}</span></div>
                      <div className="user-detail__field"><span className="user-detail__field-label">Display Name</span><span>{detailData.user.displayName}</span></div>
                      <div className="user-detail__field"><span className="user-detail__field-label">Email</span><span>{detailData.user.email}</span></div>
                      {detailData.user.phone && <div className="user-detail__field"><span className="user-detail__field-label">Phone</span><span>{detailData.user.phone}</span></div>}
                      <div className="user-detail__field"><span className="user-detail__field-label">Joined</span><span>{fmtDate(detailData.user.createdAt)}</span></div>
                      <div className="user-detail__field"><span className="user-detail__field-label">Last Updated</span><span>{fmtDate(detailData.user.updatedAt)}</span></div>
                    </div>
                  </div>

                  <div className="user-detail__section">
                    <h3 className="user-detail__section-title">Activity</h3>
                    <div className="user-detail__counts">
                      <div className="user-detail__count-card">
                        <p className="user-detail__count-value">{detailData.user._count?.artworks ?? 0}</p>
                        <p className="user-detail__count-label">Artworks</p>
                      </div>
                      <div className="user-detail__count-card">
                        <p className="user-detail__count-value">{detailData.user._count?.orders ?? 0}</p>
                        <p className="user-detail__count-label">Orders</p>
                      </div>
                      <div className="user-detail__count-card">
                        <p className="user-detail__count-value">{detailData.user._count?.reviews ?? 0}</p>
                        <p className="user-detail__count-label">Reviews</p>
                      </div>
                      <div className="user-detail__count-card">
                        <p className="user-detail__count-value">{detailData.user._count?.wishlistItems ?? 0}</p>
                        <p className="user-detail__count-label">Wishlist</p>
                      </div>
                      <div className="user-detail__count-card">
                        <p className="user-detail__count-value">{detailData.user._count?.following ?? 0}</p>
                        <p className="user-detail__count-label">Following</p>
                      </div>
                      <div className="user-detail__count-card">
                        <p className="user-detail__count-value">{detailData.user._count?.followedBy ?? 0}</p>
                        <p className="user-detail__count-label">Followers</p>
                      </div>
                    </div>
                  </div>

                  {detailData.artistProfile && (
                    <div className="user-detail__section">
                      <h3 className="user-detail__section-title">Artist Profile</h3>
                      <div className="user-detail__fields">
                        {detailData.artistProfile.bio && <div className="user-detail__field"><span className="user-detail__field-label">Bio</span><span>{detailData.artistProfile.bio}</span></div>}
                        {detailData.artistProfile.experienceYears != null && <div className="user-detail__field"><span className="user-detail__field-label">Experience</span><span>{detailData.artistProfile.experienceYears} years</span></div>}
                        {detailData.artistProfile.specialization && <div className="user-detail__field"><span className="user-detail__field-label">Specialization</span><span>{detailData.artistProfile.specialization}</span></div>}
                        <div className="user-detail__field"><span className="user-detail__field-label">Rating</span><span>{detailData.artistProfile.ratingAvg?.toFixed(1) ?? '—'}</span></div>
                        <div className="user-detail__field"><span className="user-detail__field-label">Followers</span><span>{detailData.artistProfile.followersCount ?? 0}</span></div>
                        <div className="user-detail__field"><span className="user-detail__field-label">KYC</span><span><span className={`admin-badge admin-badge--${detailData.artistProfile.kycStatus === 'verified' ? 'success' : 'warning'}`}>{detailData.artistProfile.kycStatus}</span></span></div>
                      </div>
                    </div>
                  )}

                  {detailData.recentArtworks?.length > 0 && (
                    <div className="user-detail__section">
                      <h3 className="user-detail__section-title">Recent Artworks</h3>
                      <div className="user-detail__list">
                        {detailData.recentArtworks.map(a => (
                          <div key={a.id} className="user-detail__list-item">
                            <span className="user-detail__list-title">{a.title}</span>
                            <span className={`admin-badge admin-badge--${a.status === 'published' ? 'success' : a.status === 'draft' ? 'neutral' : 'warning'}`}>{a.status}</span>
                            <span className="user-detail__list-meta">{fmtDate(a.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {detailData.recentOrders?.length > 0 && (
                    <div className="user-detail__section">
                      <h3 className="user-detail__section-title">Recent Orders</h3>
                      <div className="user-detail__list">
                        {detailData.recentOrders.map(o => (
                          <div key={o.id} className="user-detail__list-item">
                            <span className="user-detail__list-title">{o.id.slice(0, 8)}...</span>
                            <span className={`admin-badge admin-badge--${o.status === 'completed' ? 'success' : 'warning'}`}>{o.status}</span>
                            <span className="user-detail__list-meta">₹{Number(o.amount).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {detailData.auditHistory?.length > 0 && (
                    <div className="user-detail__section">
                      <h3 className="user-detail__section-title">Audit History</h3>
                      <div className="user-detail__list">
                        {detailData.auditHistory.map(a => (
                          <div key={a.id} className="user-detail__list-item">
                            <span className="user-detail__list-title">{a.action}</span>
                            <span className="user-detail__list-meta">by {a.admin?.displayName ?? 'System'}</span>
                            <span className="user-detail__list-meta">{fmtDate(a.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="admin-empty"><UserX size={40} strokeWidth={1} /><h3>User not found</h3></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  ALL ARTWORKS                                                  */
/* ═══════════════════════════════════════════════════════════════ */
const AllArtworksTab = ({ searchQuery }) => {
  const [artworks, setArtworks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchArtworks = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter) params.set('status', statusFilter);
    if (searchQuery) params.set('search', searchQuery);
    apiFetch(`/api/admin/artworks?${params}`)
      .then(d => { setArtworks(d.items); setTotal(d.total); setTotalPages(Math.ceil(d.total / 20)); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, statusFilter, searchQuery]);

  useEffect(() => { fetchArtworks(); }, [fetchArtworks]);

  const STATUS_COLORS = { published: 'success', in_review: 'warning', draft: 'neutral', rejected: 'pending' };

  return (
    <div>
      <div className="admin-content__header">
        <div className="admin-content__title-row">
          <div>
            <h1 className="admin-content__title">All Artworks</h1>
            <p className="admin-content__subtitle">Browse and manage all artworks ({total} total)</p>
          </div>
          <div className="admin-topbar__filters">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="admin-select">
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="in_review">In Review</option>
              <option value="draft">Draft</option>
              <option value="rejected">Rejected</option>
            </select>
            <button className="admin-ghost-btn" onClick={fetchArtworks}><RefreshCw size={14} /> Refresh</button>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="admin-loading"><div className="admin-loading__spinner" /><p>Loading artworks...</p></div>
      ) : artworks.length === 0 ? (
        <div className="admin-panel"><div className="admin-panel__empty"><Image size={40} /><p>No artworks found</p></div></div>
      ) : (
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Artwork</th>
                <th>Artist</th>
                <th>Price</th>
                <th>Status</th>
                <th>Views</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {artworks.map((art) => (
                <tr key={art.id}>
                  <td className="admin-table__user">
                    <span className="admin-table__name">{art.title}</span>
                  </td>
                  <td>{art.artist?.displayName || '—'}</td>
                  <td className="admin-table__amount">{fmtCurrency(art.price)}</td>
                  <td><span className={`admin-badge admin-badge--${STATUS_COLORS[art.status] || 'neutral'}`}>{art.status}</span></td>
                  <td>{art.views || 0}</td>
                  <td className="admin-table__date">{fmtDate(art.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button className="admin-pagination__btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="admin-pagination__info">Page {page} of {totalPages} ({total} total)</span>
          <button className="admin-pagination__btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  CATEGORIES (Taxonomy Management)                              */
/* ═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════ */
/*  TAXONOMY TAB (Mediums, Styles, Themes, Subjects)             */
/* ═══════════════════════════════════════════════════════════════ */
const TaxonomyTab = ({ type, label, icon: Icon, searchQuery }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const fetchItems = useCallback(() => {
    setLoading(true);
    apiFetch(`/api/admin/taxonomy/${type}`)
      .then(d => setItems(d.items))
      .catch(() => {}).finally(() => setLoading(false));
  }, [type]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleCreate = async (data) => {
    try {
      await apiFetch(`/api/admin/taxonomy/${type}`, { method: 'POST', body: JSON.stringify(data) });
      setShowCreate(false);
      fetchItems();
    } catch (err) { alert(err.message); }
  };

  const handleUpdate = async (id, data) => {
    try {
      await apiFetch(`/api/admin/taxonomy/${type}/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
      setEditingItem(null);
      fetchItems();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/api/admin/taxonomy/${type}/${id}`, { method: 'DELETE' });
      setDeletingItem(null);
      fetchItems();
    } catch (err) { alert(err.message); }
  };

  const filtered = searchQuery
    ? items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  return (
    <div>
      <div className="admin-content__header">
        <div className="admin-content__title-row">
          <div>
            <h1 className="admin-content__title">{label}</h1>
            <p className="admin-content__subtitle">{items.length} predefined {label.toLowerCase()}</p>
          </div>
          <div className="admin-topbar__filters">
            <button className="admin-primary-btn" onClick={() => setShowCreate(true)}><Plus size={14} /> New {label.slice(0, -1)}</button>
            <button className="admin-ghost-btn" onClick={fetchItems}><RefreshCw size={14} /> Refresh</button>
          </div>
        </div>
      </div>

      {(showCreate || editingItem) && (
        <TaxonomyFormModal
          type={type}
          item={editingItem}
          onClose={() => { setShowCreate(false); setEditingItem(null); }}
          onSave={(data) => editingItem ? handleUpdate(editingItem.id, data) : handleCreate(data)}
        />
      )}

      {deletingItem && (
        <div className="admin-modal-overlay" onClick={() => setDeletingItem(null)}>
          <motion.div className="admin-modal admin-modal--sm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>Delete {label.slice(0, -1)}</h2>
              <button onClick={() => setDeletingItem(null)}><X size={20} /></button>
            </div>
            <div className="admin-modal__body">
              <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#6B7280', lineHeight: 1.6 }}>
                Are you sure you want to delete <strong>{deletingItem.name}</strong>?
              </p>
              <div className="admin-modal__footer">
                <button className="admin-ghost-btn" onClick={() => setDeletingItem(null)}>Cancel</button>
                <button className="admin-primary-btn admin-primary-btn--danger" onClick={() => handleDelete(deletingItem.id)}><Trash2 size={14} /> Delete</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {loading ? (
        <div className="admin-loading"><div className="admin-loading__spinner" /><p>Loading {label.toLowerCase()}...</p></div>
      ) : filtered.length === 0 ? (
        <div className="admin-panel"><div className="admin-panel__empty"><Icon size={40} /><p>No {label.toLowerCase()} yet. Create the first one!</p></div></div>
      ) : (
        <div className="admin-panel" style={{ padding: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <motion.tr key={item.id} variants={fadeUp} initial="hidden" animate="visible" custom={i}>
                  <td><strong>{item.name}</strong></td>
                  <td><span className="admin-badge admin-badge--neutral">/{item.slug}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="admin-action-btn" onClick={() => setEditingItem(item)}><Edit3 size={13} /> Edit</button>
                      <button className="admin-action-btn admin-action-btn--danger" onClick={() => setDeletingItem(item)}><Trash2 size={13} /> Delete</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const TaxonomyFormModal = ({ type, item, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: item?.name || '',
    slug: item?.slug || '',
  });
  const [saving, setSaving] = useState(false);

  const autoSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSubmit = async () => {
    if (!form.name.trim()) { alert('Name is required'); return; }
    if (!form.slug.trim()) { alert('Slug is required'); return; }
    setSaving(true);
    try {
      await onSave({ name: form.name.trim(), slug: form.slug.trim() });
    } finally { setSaving(false); }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <motion.div className="admin-modal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2>{item ? `Edit ${item.name}` : `New ${type.charAt(0).toUpperCase() + type.slice(1, -1)}`}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="admin-modal__body">
          <div className="admin-form-group">
            <label>Name <span style={{ color: '#DC2626' }}>*</span></label>
            <input type="text" className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: item ? form.slug : autoSlug(e.target.value) })} placeholder="e.g. Oil" />
          </div>
          <div className="admin-form-group">
            <label>Slug <span style={{ color: '#DC2626' }}>*</span></label>
            <input type="text" className="admin-input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="oil" />
          </div>
          <div className="admin-modal__footer">
            <button className="admin-ghost-btn" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="admin-primary-btn" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : item ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  CATEGORIES (Taxonomy Management)                              */
/* ═══════════════════════════════════════════════════════════════ */
const CategoriesTab = ({ searchQuery }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [deletingCat, setDeletingCat] = useState(null);

  const fetchCategories = useCallback(() => {
    setLoading(true);
    apiFetch('/api/admin/categories')
      .then(d => setCategories(d.categories))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleCreate = async (data) => {
    try {
      await apiFetch('/api/admin/categories', { method: 'POST', body: JSON.stringify(data) });
      setShowCreate(false);
      fetchCategories();
    } catch (err) { alert(err.message); }
  };

  const handleUpdate = async (id, data) => {
    try {
      await apiFetch(`/api/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
      setEditingCat(null);
      fetchCategories();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      setDeletingCat(null);
      fetchCategories();
    } catch (err) { alert(err.message); }
  };

  const parents = categories.filter(c => !c.parentId);
  const children = categories.filter(c => c.parentId);

  const filteredParents = searchQuery
    ? parents.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.children?.some(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : parents;

  return (
    <div>
      <div className="admin-content__header">
        <div className="admin-content__title-row">
          <div>
            <h1 className="admin-content__title">Categories</h1>
            <p className="admin-content__subtitle">Manage artwork taxonomy ({parents.length} parent, {children.length} child categories)</p>
          </div>
          <div className="admin-topbar__filters">
            <button className="admin-primary-btn" onClick={() => setShowCreate(true)}><Plus size={14} /> New Category</button>
            <button className="admin-ghost-btn" onClick={fetchCategories}><RefreshCw size={14} /> Refresh</button>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreate || editingCat) && (
        <CategoryFormModal
          category={editingCat}
          parents={parents}
          onClose={() => { setShowCreate(false); setEditingCat(null); }}
          onSave={(data) => editingCat ? handleUpdate(editingCat.id, data) : handleCreate(data)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingCat && (
        <div className="admin-modal-overlay" onClick={() => setDeletingCat(null)}>
          <motion.div className="admin-modal admin-modal--sm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>Delete Category</h2>
              <button onClick={() => setDeletingCat(null)}><X size={20} /></button>
            </div>
            <div className="admin-modal__body">
              <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#6B7280', lineHeight: 1.6 }}>
                Are you sure you want to delete <strong>{deletingCat.name}</strong>?
                {deletingCat._count?.artworks > 0 && (
                  <span style={{ display: 'block', marginTop: '0.5rem', color: '#DC2626' }}>
                    This category has {deletingCat._count.artworks} artwork(s) referencing it. It cannot be deleted.
                  </span>
                )}
                {deletingCat.children?.length > 0 && (
                  <span style={{ display: 'block', marginTop: '0.5rem', color: '#D97706' }}>
                    This will also delete {deletingCat.children.length} child subcategor{deletingCat.children.length === 1 ? 'y' : 'ies'}.
                  </span>
                )}
              </p>
              <div className="admin-modal__footer">
                <button className="admin-ghost-btn" onClick={() => setDeletingCat(null)}>Cancel</button>
                <button
                  className="admin-primary-btn admin-primary-btn--danger"
                  onClick={() => handleDelete(deletingCat.id)}
                  disabled={deletingCat._count?.artworks > 0}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {loading ? (
        <div className="admin-loading"><div className="admin-loading__spinner" /><p>Loading categories...</p></div>
      ) : filteredParents.length === 0 ? (
        <div className="admin-panel"><div className="admin-panel__empty"><Tag size={40} /><p>No categories yet. Create your first category!</p></div></div>
      ) : (
        <div className="admin-panel" style={{ padding: 0 }}>
          {filteredParents.map((parent, i) => (
            <motion.div key={parent.id} variants={fadeUp} initial="hidden" animate="visible" custom={i}>
              <div className="admin-category-row" style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem 1.5rem', borderBottom: '1px solid #E5E7EB',
                background: '#F9FAFB',
              }}>
                <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <Tag size={16} style={{ color: '#B88945', flexShrink: 0 }} />
                  <strong style={{ fontSize: '0.95rem', whiteSpace: 'nowrap' }}>{parent.name}</strong>
                  <span className="admin-badge admin-badge--neutral" style={{ fontSize: '0.7rem' }}>/{parent.slug}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                  {parent._count?.artworks || 0} artwork{(parent._count?.artworks || 0) !== 1 ? 's' : ''}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                  {parent.children?.length || 0} subcategor{(parent.children?.length || 0) !== 1 ? 'ies' : 'y'}
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                  <button className="admin-action-btn" onClick={() => setEditingCat(parent)}><Edit3 size={13} /> Edit</button>
                  <button className="admin-action-btn admin-action-btn--danger" onClick={() => setDeletingCat(parent)}><Trash2 size={13} /> Delete</button>
                </div>
              </div>
              {parent.children?.length > 0 && (
                <div style={{ padding: '0 1.5rem 0 3rem', borderBottom: '1px solid #E5E7EB' }}>
                  {parent.children.map((child) => (
                    <div key={child.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.65rem 0', borderBottom: '1px solid #F3F4F6',
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D1D5DB', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.88rem' }}>{child.name}</span>
                      <span className="admin-badge admin-badge--neutral" style={{ fontSize: '0.65rem' }}>/{child.slug}</span>
                      <span style={{ fontSize: '0.75rem', color: '#9CA3AF', marginLeft: 'auto' }}>
                        {child._count?.artworks || 0} artwork{(child._count?.artworks || 0) !== 1 ? 's' : ''}
                      </span>
                      <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                        <button className="admin-action-btn" onClick={() => setEditingCat(child)}><Edit3 size={13} /></button>
                        <button className="admin-action-btn admin-action-btn--danger" onClick={() => setDeletingCat(child)}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const CategoryFormModal = ({ category, parents, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    parentId: category?.parentId || '',
  });
  const [saving, setSaving] = useState(false);

  const autoSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSubmit = async () => {
    if (!form.name.trim()) { alert('Name is required'); return; }
    if (!form.slug.trim()) { alert('Slug is required'); return; }
    setSaving(true);
    try {
      await onSave({ name: form.name.trim(), slug: form.slug.trim(), parentId: form.parentId || null });
    } finally { setSaving(false); }
  };

  const isEditing = !!category;
  const isChild = !!category?.parentId;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <motion.div className="admin-modal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2>{isEditing ? `Edit ${isChild ? 'Subcategory' : 'Category'}` : 'New Category'}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="admin-modal__body">
          <div className="admin-form-group">
            <label>Name <span style={{ color: '#DC2626' }}>*</span></label>
            <input type="text" className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: isEditing ? form.slug : autoSlug(e.target.value) })} placeholder="e.g. Painting" />
          </div>
          <div className="admin-form-group">
            <label>Slug <span style={{ color: '#DC2626' }}>*</span></label>
            <input type="text" className="admin-input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="painting" />
          </div>
          <div className="admin-form-group">
            <label>Parent Category (leave empty for top-level category)</label>
            <select className="admin-input" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
              <option value="">— Top-level Category —</option>
              {parents.filter(p => !isEditing || p.id !== category.id).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="admin-modal__footer">
            <button className="admin-ghost-btn" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="admin-primary-btn" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  PLACEHOLDER TABS                                              */
/* ═══════════════════════════════════════════════════════════════ */
const PlaceholderTab = ({ icon: Icon, title, subtitle }) => (
  <div>
    <div className="admin-content__header">
      <div className="admin-content__title-row">
        <div>
          <h1 className="admin-content__title">{title}</h1>
          <p className="admin-content__subtitle">{subtitle}</p>
        </div>
      </div>
    </div>
    <div className="admin-panel">
      <div className="admin-panel__empty">
        <Icon size={48} />
        <h3>{title}</h3>
        <p>This section is coming soon. It will be connected to the backend API.</p>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════ */
/*  ORDERS                                                        */
/* ═══════════════════════════════════════════════════════════════ */
const OrdersTab = ({ searchQuery }) => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter) params.set('status', statusFilter);
    if (searchQuery) params.set('search', searchQuery);
    Promise.all([
      apiFetch(`/api/admin/orders?${params}`),
      apiFetch('/api/admin/orders/stats'),
    ]).then(([o, s]) => { setOrders(o.items); setTotal(o.total); setTotalPages(Math.ceil(o.total / 20)); setStats(s); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, statusFilter, searchQuery]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await apiFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH', body: JSON.stringify({ status: newStatus }),
      });
      fetchOrders();
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
    } catch (err) { alert(err.message); }
  };

  const viewOrder = async (orderId) => {
    setDetailLoading(true);
    try {
      const data = await apiFetch(`/api/admin/orders/${orderId}`);
      setSelectedOrder(data.order);
    } catch (err) { alert(err.message); }
    setDetailLoading(false);
  };

  const STATUS_COLORS = { placed: 'neutral', paid: 'warning', shipped: 'warning', delivered: 'success', completed: 'success', cancelled: 'pending', disputed: 'pending', refunded: 'neutral' };
  const NEXT_STATUS = { placed: ['paid', 'cancelled'], paid: ['shipped', 'cancelled', 'refunded'], shipped: ['delivered'], delivered: ['completed'], completed: [], cancelled: [], disputed: ['refunded'], refunded: [] };

  return (
    <div>
      <div className="admin-content__header">
        <div className="admin-content__title-row">
          <div>
            <h1 className="admin-content__title">Orders</h1>
            <p className="admin-content__subtitle">Manage customer orders and fulfillment</p>
          </div>
          <div className="admin-topbar__filters">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="admin-select">
              <option value="">All Status</option>
              <option value="placed">Placed</option>
              <option value="paid">Paid</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="disputed">Disputed</option>
              <option value="refunded">Refunded</option>
            </select>
            <button className="admin-ghost-btn" onClick={fetchOrders}><RefreshCw size={14} /> Refresh</button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="admin-kpi" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: '#4F46E5', bg: 'rgba(79,70,229,0.08)' },
            { label: 'Total Revenue', value: fmtCurrency(stats.totalRevenue), icon: DollarSign, color: '#059669', bg: 'rgba(5,150,105,0.08)' },
            { label: 'This Week', value: `${stats.weekOrders} / ${fmtCurrency(stats.weekRevenue)}`, icon: TrendingUp, color: '#B88945', bg: 'rgba(184,137,69,0.08)' },
            { label: 'Avg Order', value: fmtCurrency(stats.avgOrderValue), icon: BarChart3, color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
          ].map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div key={kpi.label} className="admin-kpi__card" variants={fadeUp} initial="hidden" animate="visible" custom={i}>
                <div className="admin-kpi__icon" style={{ background: kpi.bg, color: kpi.color }}><Icon size={20} /></div>
                <div className="admin-kpi__info">
                  <span className="admin-kpi__label">{kpi.label}</span>
                  <span className="admin-kpi__value">{typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <motion.div className="admin-modal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>Order #{selectedOrder.id.slice(0, 8)}...</h2>
              <button onClick={() => setSelectedOrder(null)}><X size={20} /></button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-settings-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="admin-settings-row"><label>Buyer</label><span>{selectedOrder.buyer?.displayName || '—'}</span></div>
                <div className="admin-settings-row"><label>Email</label><span>{selectedOrder.buyer?.email || '—'}</span></div>
                <div className="admin-settings-row"><label>Total</label><span style={{ fontWeight: 600 }}>{fmtCurrency(selectedOrder.amount)}</span></div>
                <div className="admin-settings-row"><label>Status</label><span className={`admin-badge admin-badge--${STATUS_COLORS[selectedOrder.status]}`}>{selectedOrder.status}</span></div>
                <div className="admin-settings-row"><label>Created</label><span>{fmtDate(selectedOrder.createdAt)}</span></div>
                <div className="admin-settings-row"><label>Updated</label><span>{fmtDate(selectedOrder.updatedAt)}</span></div>
              </div>
              {selectedOrder.items?.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#6B7280' }}>Items</h4>
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="admin-action-row" style={{ cursor: 'default' }}>
                      <div className="admin-action-row__left">
                        <div>
                          <span className="admin-action-row__title">{item.artwork?.title || 'Untitled'}</span>
                          <span className="admin-action-row__sub">{fmtCurrency(item.price)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {NEXT_STATUS[selectedOrder.status]?.length > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {NEXT_STATUS[selectedOrder.status].map((s) => (
                    <button key={s} className={s === 'cancelled' || s === 'refunded' ? 'admin-reject-btn' : 'admin-approve-btn'} onClick={() => handleStatusChange(selectedOrder.id, s)}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {loading ? (
        <div className="admin-loading"><div className="admin-loading__spinner" /><p>Loading orders...</p></div>
      ) : orders.length === 0 ? (
        <div className="admin-panel"><div className="admin-panel__empty"><ShoppingBag size={40} /><p>No orders found</p></div></div>
      ) : (
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Buyer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="admin-table__name" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{order.id.slice(0, 8)}...</td>
                  <td>{order.buyer?.displayName || '—'}</td>
                  <td>{order.items?.length || 0}</td>
                  <td className="admin-table__amount">{fmtCurrency(order.amount)}</td>
                  <td><span className={`admin-badge admin-badge--${STATUS_COLORS[order.status]}`}>{order.status}</span></td>
                  <td className="admin-table__date">{fmtDate(order.createdAt)}</td>
                  <td className="admin-table__actions-cell">
                    <button className="admin-action-btn" onClick={() => viewOrder(order.id)}><Eye size={14} /> View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button className="admin-pagination__btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="admin-pagination__info">Page {page} of {totalPages} ({total} total)</span>
          <button className="admin-pagination__btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
};
/* ═══════════════════════════════════════════════════════════════ */
/*  PAYMENTS / PAYOUTS                                            */
/* ═══════════════════════════════════════════════════════════════ */
const PaymentsTab = ({ searchQuery }) => {
  const [payouts, setPayouts] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchPayouts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter) params.set('status', statusFilter);
    apiFetch(`/api/admin/payouts?${params}`)
      .then(d => { setPayouts(d.items); setTotal(d.total); setTotalPages(Math.ceil(d.total / 20)); setStats(d); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  const handleStatusChange = async (payoutId, newStatus) => {
    try {
      await apiFetch(`/api/admin/payouts/${payoutId}/status`, {
        method: 'PATCH', body: JSON.stringify({ status: newStatus }),
      });
      fetchPayouts();
    } catch (err) { alert(err.message); }
  };

  const handleCreate = async (data) => {
    try {
      await apiFetch('/api/admin/payouts', { method: 'POST', body: JSON.stringify(data) });
      setShowCreate(false);
      fetchPayouts();
    } catch (err) { alert(err.message); }
  };

  const STATUS_COLORS = { pending: 'neutral', held: 'warning', settled: 'success', failed: 'pending' };

  return (
    <div>
      <div className="admin-content__header">
        <div className="admin-content__title-row">
          <div>
            <h1 className="admin-content__title">Payments & Payouts</h1>
            <p className="admin-content__subtitle">Track payments and artist payouts</p>
          </div>
          <div className="admin-topbar__filters">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="admin-select">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="held">Held</option>
              <option value="settled">Settled</option>
              <option value="failed">Failed</option>
            </select>
            <button className="admin-primary-btn" onClick={() => setShowCreate(true)}><Plus size={14} /> New Payout</button>
            <button className="admin-ghost-btn" onClick={fetchPayouts}><RefreshCw size={14} /> Refresh</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="admin-kpi" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Pending Payouts', value: stats.pendingCount || 0, icon: Clock, color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
            { label: 'Pending Amount', value: fmtCurrency(stats.pendingAmount || 0), icon: DollarSign, color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
            { label: 'Total Payouts', value: stats.total || 0, icon: CreditCard, color: '#4F46E5', bg: 'rgba(79,70,229,0.08)' },
          ].map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div key={kpi.label} className="admin-kpi__card" variants={fadeUp} initial="hidden" animate="visible" custom={i}>
                <div className="admin-kpi__icon" style={{ background: kpi.bg, color: kpi.color }}><Icon size={20} /></div>
                <div className="admin-kpi__info">
                  <span className="admin-kpi__label">{kpi.label}</span>
                  <span className="admin-kpi__value">{typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Payout Modal */}
      {showCreate && <CreatePayoutModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}

      {loading ? (
        <div className="admin-loading"><div className="admin-loading__spinner" /><p>Loading payouts...</p></div>
      ) : payouts.length === 0 ? (
        <div className="admin-panel"><div className="admin-panel__empty"><CreditCard size={40} /><p>No payouts found</p></div></div>
      ) : (
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Artist</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td className="admin-table__user">
                    <span className="admin-table__name">{p.user?.displayName || '—'}</span>
                  </td>
                  <td className="admin-table__amount">{fmtCurrency(p.amount)}</td>
                  <td>{p.method || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.txnRef || '—'}</td>
                  <td><span className={`admin-badge admin-badge--${STATUS_COLORS[p.status]}`}>{p.status}</span></td>
                  <td className="admin-table__date">{fmtDate(p.createdAt)}</td>
                  <td className="admin-table__actions-cell">
                    {p.status === 'pending' && <button className="admin-action-btn" onClick={() => handleStatusChange(p.id, 'held')}><ArrowUpRight size={14} /> Hold</button>}
                    {p.status === 'held' && <button className="admin-action-btn" onClick={() => handleStatusChange(p.id, 'settled')}><CheckCircle size={14} /> Settle</button>}
                    {(p.status === 'pending' || p.status === 'held') && <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleStatusChange(p.id, 'failed')}><XCircle size={14} /> Fail</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button className="admin-pagination__btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="admin-pagination__info">Page {page} of {totalPages} ({total} total)</span>
          <button className="admin-pagination__btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
};

const CreatePayoutModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({ userId: '', amount: '', method: 'bank', txnRef: '' });
  const handleSubmit = () => {
    if (!form.userId || !form.amount) { alert('Artist ID and amount are required'); return; }
    onCreate({ ...form, amount: parseFloat(form.amount) });
  };
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <motion.div className="admin-modal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2>Create Payout</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="admin-modal__body">
          <div className="admin-form-group">
            <label>Artist User ID</label>
            <input type="text" className="admin-input" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} placeholder="Enter artist user ID" />
          </div>
          <div className="admin-form-group">
            <label>Amount (₹)</label>
            <input type="number" className="admin-input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" min="0" step="0.01" />
          </div>
          <div className="admin-form-group">
            <label>Method</label>
            <select className="admin-select" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option value="bank">Bank Transfer</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label>Transaction Reference</label>
            <input type="text" className="admin-input" value={form.txnRef} onChange={(e) => setForm({ ...form, txnRef: e.target.value })} placeholder="Optional" />
          </div>
          <div className="admin-modal__footer">
            <button className="admin-ghost-btn" onClick={onClose}>Cancel</button>
            <button className="admin-primary-btn" onClick={handleSubmit}>Create Payout</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
/* ═══════════════════════════════════════════════════════════════ */
/*  COLLECTIONS                                                   */
/* ═══════════════════════════════════════════════════════════════ */
const CollectionsTab = ({ searchQuery }) => {
  const [collections, setCollections] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingCol, setEditingCol] = useState(null);

  const fetchCollections = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (searchQuery) params.set('search', searchQuery);
    apiFetch(`/api/admin/collections?${params}`)
      .then(d => { setCollections(d.items); setTotal(d.total); setTotalPages(Math.ceil(d.total / 20)); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, searchQuery]);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);

  const handleCreate = async (data) => {
    try {
      await apiFetch('/api/admin/collections', { method: 'POST', body: JSON.stringify(data) });
      setShowCreate(false);
      fetchCollections();
    } catch (err) { alert(err.message); }
  };

  const handleUpdate = async (id, data) => {
    try {
      await apiFetch(`/api/admin/collections/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
      setEditingCol(null);
      fetchCollections();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete collection "${title}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/admin/collections/${id}`, { method: 'DELETE' });
      fetchCollections();
    } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div className="admin-content__header">
        <div className="admin-content__title-row">
          <div>
            <h1 className="admin-content__title">Collections</h1>
            <p className="admin-content__subtitle">Manage curated artwork collections ({total} total)</p>
          </div>
          <div className="admin-topbar__filters">
            <button className="admin-primary-btn" onClick={() => setShowCreate(true)}><Plus size={14} /> New Collection</button>
            <button className="admin-ghost-btn" onClick={fetchCollections}><RefreshCw size={14} /> Refresh</button>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreate || editingCol) && (
        <CollectionFormModal
          collection={editingCol}
          onClose={() => { setShowCreate(false); setEditingCol(null); }}
          onSave={(data) => editingCol ? handleUpdate(editingCol.id, data) : handleCreate(data)}
        />
      )}

      {loading ? (
        <div className="admin-loading"><div className="admin-loading__spinner" /><p>Loading collections...</p></div>
      ) : collections.length === 0 ? (
        <div className="admin-panel"><div className="admin-panel__empty"><FolderOpen size={40} /><p>No collections yet. Create your first collection!</p></div></div>
      ) : (
        <div className="admin-card-grid">
          {collections.map((col, i) => (
            <motion.div key={col.id} className="admin-card" variants={fadeUp} initial="hidden" animate="visible" custom={i}>
              <div className="admin-card__body">
                <div className="admin-card__header">
                  <h3 className="admin-card__name">{col.title}</h3>
                  <span className="admin-badge admin-badge--neutral">/{col.slug}</span>
                </div>
                <p className="admin-card__meta">
                  <span>{col.artworkCount} artwork{col.artworkCount !== 1 ? 's' : ''}</span>
                  <span className="admin-card__dot" />
                  <span>{fmtDate(col.createdAt)}</span>
                </p>
                {col.thumbnails?.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem' }}>
                    {col.thumbnails.map((t) => (
                      <div key={t.id} style={{ width: 40, height: 40, borderRadius: 4, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#9CA3AF', overflow: 'hidden' }}>
                        {t.thumbnail ? <img src={t.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Image size={14} />}
                      </div>
                    ))}
                  </div>
                )}
                <div className="admin-card__actions">
                  <button className="admin-action-btn" onClick={() => setEditingCol(col)}><Edit3 size={14} /> Edit</button>
                  <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDelete(col.id, col.title)}><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button className="admin-pagination__btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="admin-pagination__info">Page {page} of {totalPages} ({total} total)</span>
          <button className="admin-pagination__btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
};

const CollectionFormModal = ({ collection, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: collection?.title || '',
    slug: collection?.slug || '',
    artworkIdsText: Array.isArray(collection?.artworkIds) ? collection.artworkIds.join(', ') : '',
  });

  const handleSubmit = () => {
    if (!form.title || !form.slug) { alert('Title and slug are required'); return; }
    const artworkIds = form.artworkIdsText.split(',').map(s => s.trim()).filter(Boolean);
    onSave({ title: form.title, slug: form.slug, artworkIds });
  };

  const autoSlug = (title) => form.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <motion.div className="admin-modal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2>{collection ? 'Edit Collection' : 'New Collection'}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="admin-modal__body">
          <div className="admin-form-group">
            <label>Title</label>
            <input type="text" className="admin-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: autoSlug(e.target.value) })} placeholder="e.g. Monsoon Collection" />
          </div>
          <div className="admin-form-group">
            <label>Slug</label>
            <input type="text" className="admin-input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="monsoon-collection" />
          </div>
          <div className="admin-form-group">
            <label>Artwork IDs (comma-separated)</label>
            <textarea className="admin-input" rows={3} value={form.artworkIdsText} onChange={(e) => setForm({ ...form, artworkIdsText: e.target.value })} placeholder="uuid1, uuid2, uuid3..." style={{ resize: 'vertical' }} />
          </div>
          <div className="admin-modal__footer">
            <button className="admin-ghost-btn" onClick={onClose}>Cancel</button>
            <button className="admin-primary-btn" onClick={handleSubmit}>{collection ? 'Save Changes' : 'Create Collection'}</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
/* ═══════════════════════════════════════════════════════════════ */
/*  NOTIFICATIONS                                                 */
/* ═══════════════════════════════════════════════════════════════ */
const NotificationsTab = () => {
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterUnread, setFilterUnread] = useState(false);

  const fetchNotifications = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filterUnread) params.set('unread', 'true');
    apiFetch(`/api/admin/notifications?${params}`)
      .then(d => { setNotifications(d.items); setTotal(d.total); setTotalPages(Math.ceil(d.total / 20)); setUnreadCount(d.unreadCount); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, filterUnread]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id) => {
    try {
      await apiFetch(`/api/admin/notifications/${id}/read`, { method: 'PATCH' });
      fetchNotifications();
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await apiFetch('/api/admin/notifications/mark-all-read', { method: 'POST' });
      fetchNotifications();
    } catch {}
  };

  const deleteNotif = async (id) => {
    try {
      await apiFetch(`/api/admin/notifications/${id}`, { method: 'DELETE' });
      fetchNotifications();
    } catch {}
  };

  const TYPE_ICONS = {
    user_registered: { icon: Users, color: '#4F46E5', label: 'New user registered' },
    artist_application_submitted: { icon: Palette, color: '#B88945', label: 'Artist application submitted' },
    artist_approved: { icon: CheckCircle, color: '#059669', label: 'Artist approved' },
    artist_rejected: { icon: XCircle, color: '#DC2626', label: 'Artist rejected' },
    artwork_submitted: { icon: Image, color: '#7C3AED', label: 'Artwork submitted for review' },
    artwork_published: { icon: CheckCircle, color: '#059669', label: 'Artwork published' },
    artwork_rejected: { icon: XCircle, color: '#DC2626', label: 'Artwork rejected' },
    order_placed: { icon: ShoppingBag, color: '#D97706', label: 'Order placed' },
    payout_processed: { icon: DollarSign, color: '#059669', label: 'Payout processed' },
  };

  return (
    <div>
      <div className="admin-content__header">
        <div className="admin-content__title-row">
          <div>
            <h1 className="admin-content__title">Notifications</h1>
            <p className="admin-content__subtitle">Platform notifications ({unreadCount} unread)</p>
          </div>
          <div className="admin-topbar__filters">
            <button className={`admin-ghost-btn ${filterUnread ? 'admin-ghost-btn--active' : ''}`} onClick={() => { setFilterUnread(!filterUnread); setPage(1); }}>
              <Bell size={14} /> {filterUnread ? 'Show All' : 'Unread Only'}
            </button>
            {unreadCount > 0 && <button className="admin-primary-btn" onClick={markAllRead}><CheckCircle size={14} /> Mark All Read</button>}
            <button className="admin-ghost-btn" onClick={fetchNotifications}><RefreshCw size={14} /> Refresh</button>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="admin-loading"><div className="admin-loading__spinner" /><p>Loading notifications...</p></div>
      ) : notifications.length === 0 ? (
        <div className="admin-panel"><div className="admin-panel__empty"><Bell size={40} /><p>No notifications</p></div></div>
      ) : (
        <div className="admin-audit">
          {notifications.map((n, i) => {
            const config = TYPE_ICONS[n.type] || { icon: Bell, color: '#6B7280', label: n.type };
            const Icon = config.icon;
            return (
              <div key={n.id} className={`admin-audit__item ${!n.readAt ? 'admin-audit__item--unread' : ''}`} style={{ cursor: 'pointer' }} onClick={() => markRead(n.id)}>
                <div className="admin-audit__timeline">
                  <div className="admin-audit__icon" style={{ color: config.color, background: `${config.color}12` }}><Icon size={16} /></div>
                  {i < notifications.length - 1 && <div className="admin-audit__line" />}
                </div>
                <div className="admin-audit__content" style={{ flex: 1 }}>
                  <p className="admin-audit__text">
                    <strong>{config.label}</strong>
                    <span style={{ marginLeft: 8, fontWeight: 400, color: '#6B7280' }}>{n.body}</span>
                  </p>
                  <div className="admin-audit__meta">
                    <Clock size={12} />
                    <span>{fmtDate(n.createdAt)}</span>
                    <span className={`admin-badge ${n.readAt ? 'admin-badge--neutral' : 'admin-badge--warning'}`} style={{ marginLeft: 8 }}>
                      {n.readAt ? 'read' : 'unread'}
                    </span>
                  </div>
                </div>
                <button className="admin-action-btn admin-action-btn--danger" onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}>
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button className="admin-pagination__btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="admin-pagination__info">Page {page} of {totalPages} ({total} total)</span>
          <button className="admin-pagination__btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  CMS PAGES                                                     */
/* ═══════════════════════════════════════════════════════════════ */
const CMSTab = ({ searchQuery }) => {
  const [pages, setPages] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingPage, setEditingPage] = useState(null);

  const fetchPages = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (searchQuery) params.set('search', searchQuery);
    const qs = params.toString();
    apiFetch(`/api/admin/cms${qs ? '?' + qs : ''}`)
      .then(d => { setPages(d.items); setCounts(d.counts); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [statusFilter, searchQuery]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const handleCreate = async (data) => {
    try {
      await apiFetch('/api/admin/cms', { method: 'POST', body: JSON.stringify(data) });
      setShowCreate(false);
      fetchPages();
    } catch (err) { alert(err.message); }
  };

  const handleUpdate = async (id, data) => {
    try {
      await apiFetch(`/api/admin/cms/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
      setEditingPage(null);
      fetchPages();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete CMS page "${title}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/admin/cms/${id}`, { method: 'DELETE' });
      fetchPages();
    } catch (err) { alert(err.message); }
  };

  const STATUS_COLORS = { draft: 'neutral', published: 'success', archived: 'pending' };

  return (
    <div>
      <div className="admin-content__header">
        <div className="admin-content__title-row">
          <div>
            <h1 className="admin-content__title">CMS Pages</h1>
            <p className="admin-content__subtitle">Manage static pages and content ({counts.all || 0})</p>
          </div>
          <div className="admin-topbar__filters">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-select">
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <button className="admin-primary-btn" onClick={() => setShowCreate(true)}><Plus size={14} /> New Page</button>
            <button className="admin-ghost-btn" onClick={fetchPages}><RefreshCw size={14} /> Refresh</button>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="admin-kpi" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Draft', value: counts.draft || 0, color: '#6B7280' },
          { label: 'Published', value: counts.published || 0, color: '#059669' },
          { label: 'Archived', value: counts.archived || 0, color: '#DC2626' },
        ].map((kpi) => (
          <div key={kpi.label} className="admin-kpi__card">
            <div className="admin-kpi__icon" style={{ background: `${kpi.color}12`, color: kpi.color }}><FileText size={20} /></div>
            <div className="admin-kpi__info">
              <span className="admin-kpi__label">{kpi.label}</span>
              <span className="admin-kpi__value">{kpi.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(showCreate || editingPage) && (
        <CMSFormModal
          page={editingPage}
          onClose={() => { setShowCreate(false); setEditingPage(null); }}
          onSave={(data) => editingPage ? handleUpdate(editingPage.id, data) : handleCreate(data)}
        />
      )}

      {loading ? (
        <div className="admin-loading"><div className="admin-loading__spinner" /><p>Loading pages...</p></div>
      ) : pages.length === 0 ? (
        <div className="admin-panel"><div className="admin-panel__empty"><FileText size={40} /><p>No CMS pages yet</p></div></div>
      ) : (
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id}>
                  <td className="admin-table__name">{p.title}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>/{p.slug}</td>
                  <td><span className={`admin-badge admin-badge--${STATUS_COLORS[p.status]}`}>{p.status}</span></td>
                  <td className="admin-table__date">{fmtDate(p.updatedAt)}</td>
                  <td className="admin-table__actions-cell">
                    <button className="admin-action-btn" onClick={() => setEditingPage(p)}><Edit3 size={14} /> Edit</button>
                    <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDelete(p.id, p.title)}><Trash2 size={14} /> Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const CMSFormModal = ({ page, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: page?.title || '',
    slug: page?.slug || '',
    body: page?.body || '',
    status: page?.status || 'draft',
  });

  const handleSubmit = () => {
    if (!form.title || !form.slug) { alert('Title and slug are required'); return; }
    onSave(form);
  };

  const autoSlug = (title) => form.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <motion.div className="admin-modal" style={{ maxWidth: '700px' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2>{page ? 'Edit Page' : 'New Page'}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="admin-modal__body">
          <div className="admin-settings-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="admin-form-group">
              <label>Title</label>
              <input type="text" className="admin-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: autoSlug(e.target.value) })} placeholder="Page Title" />
            </div>
            <div className="admin-form-group">
              <label>Slug</label>
              <input type="text" className="admin-input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="page-slug" />
            </div>
          </div>
          <div className="admin-form-group">
            <label>Status</label>
            <select className="admin-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label>Content (HTML)</label>
            <textarea className="admin-input" rows={12} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="<h1>About Us</h1><p>Content here...</p>" style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }} />
          </div>
          <div className="admin-modal__footer">
            <button className="admin-ghost-btn" onClick={onClose}>Cancel</button>
            <button className="admin-primary-btn" onClick={handleSubmit}>{page ? 'Save Changes' : 'Create Page'}</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  ANALYTICS                                                     */
/* ═══════════════════════════════════════════════════════════════ */
const AnalyticsTab = () => {
  const [kpis, setKpis] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/admin/reports'),
      apiFetch('/api/admin/revenue'),
    ]).then(([r, rev]) => {
      setKpis(r.kpis);
      setGrowth(r.growth || {});
      setRevenue(rev);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="admin-content__header">
        <div className="admin-content__title-row">
          <div>
            <h1 className="admin-content__title">Analytics</h1>
            <p className="admin-content__subtitle">Platform performance insights</p>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="admin-loading"><div className="admin-loading__spinner" /><p>Loading analytics...</p></div>
      ) : (
        <div className="admin-dashboard">
          <div className="admin-kpi">
            {[
              { label: 'Total Users', value: kpis?.users ?? 0, icon: Users, color: '#4F46E5', bg: 'rgba(79,70,229,0.08)' },
              { label: 'Approved Artists', value: kpis?.artists ?? 0, icon: Palette, color: '#B88945', bg: 'rgba(184,137,69,0.08)' },
              { label: 'Total Artworks', value: kpis?.artworks ?? 0, icon: Image, color: '#059669', bg: 'rgba(5,150,105,0.08)' },
              { label: 'Published', value: kpis?.published ?? 0, icon: Layers, color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
              { label: 'Total Revenue', value: fmtCurrency(revenue?.totalRevenue || 0), icon: DollarSign, color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
              { label: 'Artwork Saves', value: growth?.totalSaves ?? 0, icon: Star, color: '#BE185D', bg: 'rgba(190,24,93,0.08)' },
              { label: 'Reviews', value: growth?.totalReviews ?? 0, icon: FileText, color: '#0891B2', bg: 'rgba(8,145,178,0.08)' },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <motion.div key={kpi.label} className="admin-kpi__card" variants={fadeUp} initial="hidden" animate="visible" custom={i}>
                  <div className="admin-kpi__icon" style={{ background: kpi.bg, color: kpi.color }}><Icon size={20} /></div>
                  <div className="admin-kpi__info">
                    <span className="admin-kpi__label">{kpi.label}</span>
                    <span className="admin-kpi__value">{typeof kpi.value === 'string' ? kpi.value : kpi.value.toLocaleString()}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="admin-dashboard__grid">
            <motion.div className="admin-panel" variants={fadeUp} initial="hidden" animate="visible" custom={7}>
              <div className="admin-panel__head"><h3><TrendingUp size={18} /> Weekly Growth</h3></div>
              <div className="admin-panel__body">
                <div className="admin-settings-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="admin-settings-row">
                    <label>New Users (7d)</label>
                    <span className="admin-kpi__value">{growth?.newUsersWeek ?? 0}</span>
                  </div>
                  <div className="admin-settings-row">
                    <label>New Users (30d)</label>
                    <span className="admin-kpi__value">{growth?.newUsersMonth ?? 0}</span>
                  </div>
                  <div className="admin-settings-row">
                    <label>New Artworks (7d)</label>
                    <span className="admin-kpi__value">{growth?.newArtworksWeek ?? 0}</span>
                  </div>
                  <div className="admin-settings-row">
                    <label>New Artworks (30d)</label>
                    <span className="admin-kpi__value">{growth?.newArtworksMonth ?? 0}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div className="admin-panel" variants={fadeUp} initial="hidden" animate="visible" custom={8}>
              <div className="admin-panel__head"><h3><DollarSign size={18} /> Revenue Breakdown</h3></div>
              <div className="admin-panel__body">
                <div className="admin-settings-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="admin-settings-row">
                    <label>This Week</label>
                    <span className="admin-kpi__value">{fmtCurrency(revenue?.weekTotal || 0)}</span>
                  </div>
                  <div className="admin-settings-row">
                    <label>This Month</label>
                    <span className="admin-kpi__value">{fmtCurrency(revenue?.monthTotal || 0)}</span>
                  </div>
                  <div className="admin-settings-row">
                    <label>All Time</label>
                    <span className="admin-kpi__value">{fmtCurrency(revenue?.totalRevenue || 0)}</span>
                  </div>
                  <div className="admin-settings-row">
                    <label>Total Orders</label>
                    <span className="admin-kpi__value">{kpis?.orders ?? 0}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  AUDIT LOG                                                     */
/* ═══════════════════════════════════════════════════════════════ */
const AuditTab = () => {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ action: '', entityType: '', search: '' });

  const fetchLog = useCallback(async (p, f) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '50' });
      if (f.action) params.set('action', f.action);
      if (f.entityType) params.set('entityType', f.entityType);
      if (f.search) params.set('search', f.search);
      const d = await apiFetch(`/api/admin/audit?${params}`);
      setLog(d.log);
      setTotalPages(d.totalPages);
      setTotal(d.total);
      setPage(d.page);
    } catch { setLog([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLog(1, filters); }, []);

  const applyFilter = (key, val) => {
    const next = { ...filters, [key]: val };
    setFilters(next);
    fetchLog(1, next);
  };

  const AUDIT_ICONS = {
    approve_artist: { icon: CheckCircle, color: '#059669', label: 'Approved artist' },
    reject_artist: { icon: XCircle, color: '#DC2626', label: 'Rejected artist' },
    approve_artwork: { icon: CheckCircle, color: '#4F46E5', label: 'Published artwork' },
    reject_artwork: { icon: XCircle, color: '#DC2626', label: 'Rejected artwork' },
    ban_user: { icon: Ban, color: '#DC2626', label: 'Banned user' },
    unban_user: { icon: CheckCircle, color: '#059669', label: 'Unbanned user' },
    feature_artwork: { icon: Star, color: '#B88945', label: 'Featured artwork' },
    unfeature_artwork: { icon: Star, color: '#6B7280', label: 'Unfeatured artwork' },
    request_info_artist: { icon: MessageSquare, color: '#F59E0B', label: 'Requested info' },
  };

  const uniqueActions = [...new Set(log.map(e => e.action))].sort();
  const uniqueEntities = [...new Set(log.map(e => e.entityType))].sort();

  return (
    <div>
      <div className="admin-content__header">
        <div className="admin-content__title-row">
          <div>
            <h1 className="admin-content__title">Audit Log</h1>
            <p className="admin-content__subtitle">Immutable history of all admin actions ({total} total)</p>
          </div>
        </div>
      </div>
      <div className="admin-filters">
        <div className="admin-filters__row">
          <div className="admin-filters__group">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search action, entity, ID..."
              value={filters.search}
              onChange={e => applyFilter('search', e.target.value)}
              className="admin-filters__input"
            />
          </div>
          <div className="admin-filters__group">
            <Filter size={14} />
            <select value={filters.action} onChange={e => applyFilter('action', e.target.value)} className="admin-filters__select">
              <option value="">All actions</option>
              {uniqueActions.map(a => <option key={a} value={a}>{AUDIT_ICONS[a]?.label || a}</option>)}
            </select>
          </div>
          <div className="admin-filters__group">
            <select value={filters.entityType} onChange={e => applyFilter('entityType', e.target.value)} className="admin-filters__select">
              <option value="">All entity types</option>
              {uniqueEntities.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="admin-loading"><div className="admin-loading__spinner" /><p>Loading audit log...</p></div>
      ) : log.length === 0 ? (
        <div className="admin-panel"><div className="admin-panel__empty"><Shield size={40} /><p>No audit entries found</p></div></div>
      ) : (
        <>
          <div className="admin-audit">
            {log.map((entry, i) => {
              const config = AUDIT_ICONS[entry.action] || { icon: Clock, color: '#6B7280', label: entry.action };
              const Icon = config.icon;
              const adminName = entry.admin?.displayName || entry.admin?.email || 'Unknown';
              return (
                <div key={entry.id} className="admin-audit__item">
                  <div className="admin-audit__timeline">
                    <div className="admin-audit__icon" style={{ color: config.color, background: `${config.color}12` }}><Icon size={16} /></div>
                    {i < log.length - 1 && <div className="admin-audit__line" />}
                  </div>
                  <div className="admin-audit__content">
                    <p className="admin-audit__text">
                      <strong>{config.label}</strong>
                      {entry.meta?.reason && <span> — {entry.meta.reason}</span>}
                      {entry.meta?.newStatus && entry.meta?.previousStatus && <span> ({entry.meta.previousStatus} → {entry.meta.newStatus})</span>}
                    </p>
                    <div className="admin-audit__meta">
                      <span className="admin-audit__admin">{adminName}</span>
                      <span>·</span>
                      <Clock size={12} />
                      <span>{fmtDate(entry.createdAt)}</span>
                      <span>·</span>
                      <span className="admin-audit__entity">{entry.entityType}:{entry.entityId?.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button className="admin-pagination__btn" disabled={page <= 1} onClick={() => fetchLog(page - 1, filters)}>← Prev</button>
              <span className="admin-pagination__info">Page {page} of {totalPages}</span>
              <button className="admin-pagination__btn" disabled={page >= totalPages} onClick={() => fetchLog(page + 1, filters)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  SETTINGS                                                      */
/* ═══════════════════════════════════════════════════════════════ */
const SettingsTab = ({ user }) => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/admin/system-status')
      .then(d => setSystemStatus(d))
      .catch(() => setSystemStatus({ api: { status: 'error' }, database: { status: 'error' }, frontend: { status: 'unknown' } }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="admin-content__header">
        <div className="admin-content__title-row">
          <div>
            <h1 className="admin-content__title">Settings</h1>
            <p className="admin-content__subtitle">Platform and account settings</p>
          </div>
        </div>
      </div>
      <div className="admin-settings-grid">
        <div className="admin-panel">
          <div className="admin-panel__head"><h3><Shield size={18} /> Account</h3></div>
          <div className="admin-panel__body">
            <div className="admin-settings-row">
              <label>Email</label>
              <span>{user.email}</span>
            </div>
            <div className="admin-settings-row">
              <label>Name</label>
              <span>{user.fullName || user.displayName}</span>
            </div>
            <div className="admin-settings-row">
              <label>Role</label>
              <span className="admin-badge admin-badge--admin">{user.role}</span>
            </div>
          </div>
        </div>
        <div className="admin-panel">
          <div className="admin-panel__head"><h3><Settings size={18} /> Platform</h3></div>
          <div className="admin-panel__body">
            {loading ? (
              <div className="admin-panel__empty"><p>Checking system status...</p></div>
            ) : systemStatus ? (
              <>
                <div className="admin-settings-row">
                  <label>API Server</label>
                  <span className={`admin-badge ${systemStatus.api?.status === 'running' ? 'admin-badge--success' : 'admin-badge--pending'}`}>
                    {systemStatus.api?.status === 'running' ? `Running on :${systemStatus.api.port}` : 'Error'}
                  </span>
                </div>
                <div className="admin-settings-row">
                  <label>Database</label>
                  <span className={`admin-badge ${systemStatus.database?.status === 'connected' ? 'admin-badge--success' : 'admin-badge--pending'}`}>
                    {systemStatus.database?.status === 'connected' ? `${systemStatus.database.type} Connected (${systemStatus.database.latency})` : 'Disconnected'}
                  </span>
                </div>
                <div className="admin-settings-row">
                  <label>Frontend</label>
                  <span className={`admin-badge ${systemStatus.frontend?.status === 'running' ? 'admin-badge--success' : 'admin-badge--pending'}`}>
                    {systemStatus.frontend?.status === 'running' ? `Running on :${systemStatus.frontend.port}` : 'Unknown'}
                  </span>
                </div>
                <div className="admin-settings-row">
                  <label>Node.js</label>
                  <span>{systemStatus.nodeVersion || '—'}</span>
                </div>
                <div className="admin-settings-row">
                  <label>Memory</label>
                  <span>{systemStatus.memory ? `RSS: ${systemStatus.memory.rss} / Heap: ${systemStatus.memory.heap}` : '—'}</span>
                </div>
                <div className="admin-settings-row">
                  <label>API Uptime</label>
                  <span>{systemStatus.api?.uptime ? `${Math.floor(systemStatus.api.uptime / 3600)}h ${Math.floor((systemStatus.api.uptime % 3600) / 60)}m` : '—'}</span>
                </div>
              </>
            ) : (
              <div className="admin-panel__empty"><p>Unable to fetch system status</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
