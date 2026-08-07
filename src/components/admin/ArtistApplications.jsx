import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ArtistApplications.css';
import {
  Palette, Search, Filter, RefreshCw, Download, ChevronRight, ChevronDown,
  CheckCircle, XCircle, Clock, AlertTriangle, Eye, Ban, UserX, MoreHorizontal,
  FileText, Shield, Star, ExternalLink, ArrowUpRight, ArrowLeft, Send,
  Edit3, MessageSquare, Globe, Camera, MapPin,
  Calendar, Award, BookOpen, Link2, Image as ImageIcon, ZoomIn,
  X, ChevronLeft, AlertCircle, User, Mail, Phone, Building2, GraduationCap,
  Briefcase, Languages, Hash, Flag, AlertOctagon, Info
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || window.location.origin;

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
const fmtDateTime = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const initials = (s) => (s || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const STATUS_META = {
  pending: { label: 'Pending', color: '#D97706', bg: 'rgba(217,119,6,0.1)', icon: Clock },
  under_review: { label: 'Under Review', color: '#4F46E5', bg: 'rgba(79,70,229,0.1)', icon: Eye },
  needs_info: { label: 'Needs Information', color: '#DC2626', bg: 'rgba(220,38,38,0.1)', icon: AlertCircle },
  approved: { label: 'Approved', color: '#059669', bg: 'rgba(5,150,105,0.1)', icon: CheckCircle },
  rejected: { label: 'Rejected', color: '#6B7280', bg: 'rgba(107,114,128,0.1)', icon: XCircle },
};

const PRIORITY_META = {
  normal: { label: 'Normal', color: '#6B7280', bg: 'rgba(107,114,128,0.08)' },
  high: { label: 'High', color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
  urgent: { label: 'Urgent', color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
};

const VERIFY_STATUS = {
  not_started: { label: 'Not Started', color: '#9CA3AF' },
  pending: { label: 'Pending', color: '#D97706' },
  under_review: { label: 'Under Review', color: '#4F46E5' },
  verified: { label: 'Verified', color: '#059669' },
  needs_attention: { label: 'Needs Attention', color: '#DC2626' },
};

/* ═══════════════════════════════════════════════════════════════ */
/*  MAIN WRAPPER                                                  */
/* ═══════════════════════════════════════════════════════════════ */
const ArtistApplications = ({ searchQuery }) => {
  const [view, setView] = useState('list');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);

  const openDetail = (userId) => {
    setSelectedUserId(userId);
    setView('detail');
  };

  const backToList = () => {
    setView('list');
    setSelectedUserId(null);
    setListRefreshKey(k => k + 1);
  };

  return (
    <AnimatePresence mode="wait">
      {view === 'list' ? (
        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <ApplicationsList searchQuery={searchQuery} onSelect={openDetail} refreshKey={listRefreshKey} />
        </motion.div>
      ) : (
        <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <ApplicationDetail userId={selectedUserId} onBack={backToList} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  APPLICATIONS LIST                                             */
/* ═══════════════════════════════════════════════════════════════ */
const ApplicationsList = ({ searchQuery, onSelect, refreshKey }) => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [counts, setCounts] = useState({ all: 0, pending: 0, under_review: 0, needs_info: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selected, setSelected] = useState(new Set());
  const [showBulk, setShowBulk] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('');

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('status', activeTab);
      if (priorityFilter) params.set('priority', priorityFilter);
      params.set('sort', sortBy);
      params.set('limit', '100');
      const qs = params.toString();
      const [appData, statsData] = await Promise.all([
        apiFetch(`/api/admin/applications?${qs}`),
        apiFetch('/api/admin/applications/stats'),
      ]);
      setItems(appData.items);
      setCounts(appData.counts);
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, sortBy, priorityFilter, refreshKey]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const filtered = items.filter(a => {
    if (!search && !searchQuery) return true;
    const q = (search || searchQuery).toLowerCase();
    const u = a.user || {};
    return (u.displayName || '').toLowerCase().includes(q)
      || (u.fullName || '').toLowerCase().includes(q)
      || (u.email || '').toLowerCase().includes(q)
      || (a.id || '').toLowerCase().includes(q);
  });

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(a => a.userId)));
  };

  const handleBulk = async (action, value) => {
    try {
      await apiFetch('/api/admin/applications/bulk', {
        method: 'POST',
        body: JSON.stringify({ userIds: [...selected], action, value }),
      });
      setSelected(new Set());
      setShowBulk(false);
      fetchApplications();
    } catch (err) { alert(err.message); }
  };

  const TABS = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'under_review', label: 'Under Review' },
    { id: 'needs_info', label: 'Needs Info' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ];

  const AVATAR_COLORS = ['#B88945','#4F46E5','#059669','#7C3AED','#D97706','#0891B2','#BE185D','#DC2626'];

  return (
    <div className="aa">
      {/* Header */}
      <div className="admin-content__header">
        <div className="admin-content__title-row">
          <div>
            <h1 className="admin-content__title">Artist Applications</h1>
            <p className="admin-content__subtitle">Review, verify, and manage artist applications.</p>
          </div>
          <div className="admin-topbar__filters">
            <button className="admin-ghost-btn" onClick={() => fetchApplications()}><RefreshCw size={14} /> Refresh</button>
            <button className="admin-ghost-btn"><Download size={14} /> Export</button>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      {stats && (
        <div className="aa-metrics">
          {[
            { key: 'pending', label: 'Pending Applications', value: stats.pending, icon: Clock, color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
            { key: 'under_review', label: 'Under Review', value: stats.underReview, icon: Eye, color: '#4F46E5', bg: 'rgba(79,70,229,0.08)' },
            { key: 'approved', label: 'Approved', value: stats.approved, icon: CheckCircle, color: '#059669', bg: 'rgba(5,150,105,0.08)' },
            { key: 'needs_info', label: 'Needs Information', value: stats.needsInfo, icon: AlertCircle, color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
          ].map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.button
                key={m.key}
                className={`aa-metric-card ${activeTab === m.key ? 'aa-metric-card--active' : ''}`}
                onClick={() => setActiveTab(activeTab === m.key ? 'all' : m.key)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
              >
                <div className="aa-metric-card__icon" style={{ background: m.bg, color: m.color }}><Icon size={20} /></div>
                <div className="aa-metric-card__info">
                  <span className="aa-metric-card__value">{m.value.toLocaleString()}</span>
                  <span className="aa-metric-card__label">{m.label}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Status Tabs */}
      <div className="aa-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`aa-tab ${activeTab === tab.id ? 'aa-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            <span className="aa-tab__count">{counts[tab.id] || 0}</span>
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="aa-toolbar">
        <div className="aa-toolbar__search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name, email, application ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch('')}><X size={14} /></button>}
        </div>
        <div className="aa-toolbar__filters">
          <button className="aa-toolbar__filter-btn" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={14} /> Filters
            {(priorityFilter) && <span className="aa-toolbar__filter-badge" />}
          </button>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="admin-select">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="updated">Recently Updated</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="aa-filter-panel">
          <div className="aa-filter-panel__row">
            <label>Priority</label>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="admin-select">
              <option value="">All</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <button className="aa-filter-panel__clear" onClick={() => { setPriorityFilter(''); setSearch(''); }}>Clear Filters</button>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="aa-bulk-bar">
          <span>{selected.size} application{selected.size !== 1 ? 's' : ''} selected</span>
          <div className="aa-bulk-bar__actions">
            <button className="admin-ghost-btn" onClick={() => handleBulk('move_to_review')}>Move to Review</button>
            <button className="admin-ghost-btn" onClick={() => handleBulk('change_priority', 'high')}>Set High Priority</button>
            <button className="admin-ghost-btn" onClick={() => setShowBulk(true)}>More Actions</button>
            <button className="admin-ghost-btn" onClick={() => setSelected(new Set())}><X size={14} /> Clear</button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="admin-loading"><div className="admin-loading__spinner" /><p>Loading applications...</p></div>
      ) : filtered.length === 0 ? (
        <div className="admin-panel"><div className="admin-panel__empty"><Palette size={40} /><p>No applications found</p></div></div>
      ) : (
        <div className="admin-table-scroll">
          <table className="admin-table aa-table">
            <thead>
              <tr>
                <th className="aa-table__check">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={selectAll} />
                </th>
                <th>Applicant</th>
                <th>Application ID</th>
                <th>Location</th>
                <th>Specialization</th>
                <th>Portfolio</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app, i) => {
                const u = app.user || {};
                const status = STATUS_META[app.status] || STATUS_META.pending;
                const priority = PRIORITY_META[app.priority] || PRIORITY_META.normal;
                const personal = app.personal || {};
                const info = app.info || {};
                const portfolio = app.portfolio || {};
                const images = Array.isArray(portfolio.images) ? portfolio.images : [];
                const StatusIcon = status.icon;
                return (
                  <tr key={app.userId} className={selected.has(app.userId) ? 'aa-table__row--selected' : ''}>
                    <td className="aa-table__check">
                      <input type="checkbox" checked={selected.has(app.userId)} onChange={() => toggleSelect(app.userId)} />
                    </td>
                    <td className="aa-table__user">
                      <div className="admin-table__avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                        {u.avatarUrl ? <img src={u.avatarUrl} alt="" /> : initials(u.displayName)}
                      </div>
                      <div className="aa-table__user-info">
                        <span className="admin-table__name">{u.displayName || '—'}</span>
                        <span className="aa-table__email">{u.email}</span>
                      </div>
                    </td>
                    <td className="aa-table__mono">APP-{(app.userId || '').slice(-6).toUpperCase()}</td>
                    <td>
                      {personal.city || personal.country ? (
                        <span className="aa-table__location"><MapPin size={12} /> {personal.city}{personal.city && personal.country ? ', ' : ''}{personal.country}</span>
                      ) : '—'}
                    </td>
                    <td>{info.specialization || '—'}</td>
                    <td className="aa-table__mono">{images.length} artwork{images.length !== 1 ? 's' : ''}</td>
                    <td>
                      <span className="aa-status-badge" style={{ color: status.color, background: status.bg }}>
                        <StatusIcon size={12} /> {status.label}
                      </span>
                    </td>
                    <td className="admin-table__date">{fmtDate(app.submittedAt || app.createdAt)}</td>
                    <td>
                      <span className="aa-priority-badge" style={{ color: priority.color, background: priority.bg }}>
                        {app.priority === 'urgent' && <AlertOctagon size={12} />}
                        {app.priority === 'high' && <AlertTriangle size={12} />}
                        {priority.label}
                      </span>
                    </td>
                    <td className="admin-table__actions-cell">
                      <button className="admin-action-btn" onClick={() => onSelect(app.userId)}>
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {showBulk && (
        <BulkActionsModal
          count={selected.size}
          onAssignReviewer={(v) => handleBulk('assign_reviewer', v)}
          onChangePriority={(v) => handleBulk('change_priority', v)}
          onClose={() => setShowBulk(false)}
        />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  APPLICATION DETAIL                                            */
/* ═══════════════════════════════════════════════════════════════ */
const ApplicationDetail = ({ userId, onBack }) => {
  const [data, setData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showRequestInfo, setShowRequestInfo] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const fetchApp = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/applications/${userId}`);
      setData(res.application);
      setTimeline(res.timeline || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchApp(); }, [fetchApp]);

  const handleAction = async (action, body = {}) => {
    setSubmitting(true);
    try {
      await apiFetch(`/api/admin/applications/${userId}/${action}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setShowApprove(false);
      setShowReject(false);
      setShowRequestInfo(false);
      fetchApp();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await apiFetch(`/api/admin/applications/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      fetchApp();
    } catch (err) { alert(err.message); }
  };

  const handlePriorityChange = async (priority) => {
    try {
      await apiFetch(`/api/admin/applications/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ priority }),
      });
      fetchApp();
    } catch (err) { alert(err.message); }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    try {
      await apiFetch(`/api/admin/applications/${userId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content: noteText }),
      });
      setNoteText('');
      fetchApp();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="admin-loading"><div className="admin-loading__spinner" /><p>Loading application...</p></div>;
  if (!data) return <div className="admin-panel"><div className="admin-panel__empty"><AlertTriangle size={40} /><p>Application not found</p></div></div>;

  const app = data;
  const u = app.user || {};
  const personal = app.personal || {};
  const info = app.info || {};
  const portfolio = app.portfolio || {};
  const kycDocs = app.kycDocs || {};
  const notes = app.notes || [];
  const images = Array.isArray(portfolio.images) ? portfolio.images : [];
  const status = STATUS_META[app.status] || STATUS_META.pending;
  const priority = PRIORITY_META[app.priority] || PRIORITY_META.normal;
  const StatusIcon = status.icon;

  const EDUCATION = Array.isArray(info.education) ? info.education : [];
  const AWARDS = Array.isArray(info.awards) ? info.awards : [];
  const MEDIUMS = Array.isArray(info.mediums) ? info.mediums : [];
  const STYLES = Array.isArray(info.styles) ? info.styles : [];
  const SUBJECTS = Array.isArray(info.subjects) ? info.subjects : [];
  const LANGUAGES = Array.isArray(info.languages) ? info.languages : [];

  const TIMELINE_ACTIONS = {
    approve_artist: { icon: CheckCircle, color: '#059669', label: 'Application Approved' },
    reject_artist: { icon: XCircle, color: '#DC2626', label: 'Application Rejected' },
    request_info_artist: { icon: MessageSquare, color: '#D97706', label: 'Information Requested' },
    application_status_updated: { icon: RefreshCw, color: '#4F46E5', label: 'Status Updated' },
    application_status_under_review: { icon: Eye, color: '#4F46E5', label: 'Moved to Review' },
    application_status_pending: { icon: Clock, color: '#D97706', label: 'Set to Pending' },
    application_status_needs_info: { icon: AlertCircle, color: '#DC2626', label: 'Needs Information' },
    application_status_approved: { icon: CheckCircle, color: '#059669', label: 'Approved' },
    application_status_rejected: { icon: XCircle, color: '#DC2626', label: 'Rejected' },
    bulk_change_priority: { icon: Flag, color: '#D97706', label: 'Priority Changed' },
    bulk_move_to_review: { icon: Eye, color: '#4F46E5', label: 'Moved to Review' },
    bulk_assign_reviewer: { icon: User, color: '#4F46E5', label: 'Reviewer Assigned' },
  };

  return (
    <div className="aa-detail">
      {/* Header */}
      <div className="aa-detail__header">
        <button className="aa-detail__back" onClick={onBack}>
          <ArrowLeft size={18} /> Back to Applications
        </button>
        <div className="aa-detail__header-actions">
          {app.status !== 'approved' && (
            <button className="aa-detail__action-btn aa-detail__action-btn--approve" onClick={() => setShowApprove(true)} disabled={submitting}>
              <CheckCircle size={16} /> Approve Application
            </button>
          )}
          {app.status !== 'rejected' && (
            <button className="aa-detail__action-btn aa-detail__action-btn--info" onClick={() => setShowRequestInfo(true)} disabled={submitting}>
              <MessageSquare size={16} /> Request Information
            </button>
          )}
          {app.status !== 'rejected' && (
            <button className="aa-detail__action-btn aa-detail__action-btn--reject" onClick={() => setShowReject(true)} disabled={submitting}>
              <XCircle size={16} /> Reject
            </button>
          )}
        </div>
      </div>

      {/* Applicant Identity Bar */}
      <div className="aa-detail__identity">
        <div className="aa-detail__avatar" style={{ background: '#B88945' }}>
          {u.avatarUrl ? <img src={u.avatarUrl} alt="" /> : initials(u.displayName)}
        </div>
        <div className="aa-detail__identity-info">
          <h2>{u.displayName || personal.displayName || 'Unknown'}</h2>
          <p>{u.fullName || personal.fullName || ''}</p>
          <div className="aa-detail__identity-meta">
            <span className="aa-detail__app-id">APP-{(app.userId || '').slice(-6).toUpperCase()}</span>
            <span className="aa-status-badge" style={{ color: status.color, background: status.bg }}>
              <StatusIcon size={12} /> {status.label}
            </span>
            <span className="aa-priority-badge" style={{ color: priority.color, background: priority.bg }}>
              {app.priority === 'urgent' && <AlertOctagon size={12} />}
              {app.priority === 'high' && <AlertTriangle size={12} />}
              {priority.label}
            </span>
            <span className="aa-detail__date"><Calendar size={12} /> Submitted {fmtDate(app.submittedAt || app.createdAt)}</span>
            {personal.city && <span className="aa-detail__location"><MapPin size={12} /> {personal.city}{personal.country ? `, ${personal.country}` : ''}</span>}
          </div>
        </div>
        <div className="aa-detail__identity-status">
          <label>Priority</label>
          <select value={app.priority} onChange={(e) => handlePriorityChange(e.target.value)} className="admin-select">
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <label>Status</label>
          <select value={app.status} onChange={(e) => handleStatusChange(e.target.value)} className="admin-select">
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="needs_info">Needs Info</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="aa-detail__grid">
        {/* LEFT — Main Content */}
        <div className="aa-detail__main">

          {/* Section 1: Applicant Profile */}
          <div className="aa-detail__section">
            <h3 className="aa-detail__section-title"><User size={18} /> Applicant Profile</h3>
            <div className="aa-detail__profile-grid">
              <div className="aa-detail__field">
                <label>Full Name</label>
                <span>{u.fullName || personal.fullName || '—'}</span>
              </div>
              <div className="aa-detail__field">
                <label>Display Name</label>
                <span>{u.displayName || personal.displayName || '—'}</span>
              </div>
              <div className="aa-detail__field">
                <label>Email</label>
                <span><Mail size={12} /> {u.email || '—'}</span>
              </div>
              <div className="aa-detail__field">
                <label>Phone</label>
                <span><Phone size={12} /> {u.phone || personal.phone || '—'}</span>
              </div>
              <div className="aa-detail__field">
                <label>Country</label>
                <span>{personal.country || '—'}</span>
              </div>
              <div className="aa-detail__field">
                <label>State</label>
                <span>{personal.state || '—'}</span>
              </div>
              <div className="aa-detail__field">
                <label>City</label>
                <span>{personal.city || '—'}</span>
              </div>
              <div className="aa-detail__field">
                <label>Profile Photo</label>
                {personal.photo ? (
                  <div className="aa-detail__photo-preview"><img src={personal.photo} alt="" /></div>
                ) : <span className="aa-detail__muted">Not provided</span>}
              </div>
              <div className="aa-detail__field">
                <label>Account Created</label>
                <span>{fmtDate(u.createdAt)}</span>
              </div>
              <div className="aa-detail__field">
                <label>Account Status</label>
                <span className={`admin-badge ${u.userStatus === 'banned' ? 'admin-badge--pending' : 'admin-badge--success'}`}>{u.userStatus || 'active'}</span>
              </div>
            </div>
            <button className="aa-detail__link-btn"><ExternalLink size={12} /> View User Profile</button>
          </div>

          {/* Section 2: Artist Information */}
          <div className="aa-detail__section">
            <h3 className="aa-detail__section-title"><Palette size={18} /> Artist Information</h3>
            {info.bio && (
              <div className="aa-detail__bio">
                <label>Biography</label>
                <p>{info.bio}</p>
              </div>
            )}
            <div className="aa-detail__profile-grid">
              <div className="aa-detail__field">
                <label>Years of Experience</label>
                <span>{info.experience || '—'}</span>
              </div>
              <div className="aa-detail__field">
                <label>Specialization</label>
                <span>{info.specialization || '—'}</span>
              </div>
              {MEDIUMS.length > 0 && (
                <div className="aa-detail__field aa-detail__field--full">
                  <label>Preferred Mediums</label>
                  <div className="aa-detail__tags">{MEDIUMS.map((m, i) => <span key={i} className="aa-detail__tag">{m}</span>)}</div>
                </div>
              )}
              {STYLES.length > 0 && (
                <div className="aa-detail__field aa-detail__field--full">
                  <label>Preferred Styles</label>
                  <div className="aa-detail__tags">{STYLES.map((s, i) => <span key={i} className="aa-detail__tag">{s}</span>)}</div>
                </div>
              )}
              {SUBJECTS.length > 0 && (
                <div className="aa-detail__field aa-detail__field--full">
                  <label>Preferred Subjects</label>
                  <div className="aa-detail__tags">{SUBJECTS.map((s, i) => <span key={i} className="aa-detail__tag">{s}</span>)}</div>
                </div>
              )}
              {LANGUAGES.length > 0 && (
                <div className="aa-detail__field aa-detail__field--full">
                  <label>Languages</label>
                  <div className="aa-detail__tags">{LANGUAGES.map((l, i) => <span key={i} className="aa-detail__tag">{l}</span>)}</div>
                </div>
              )}
            </div>
            {EDUCATION.length > 0 && (
              <div className="aa-detail__subsection">
                <h4><GraduationCap size={14} /> Education</h4>
                <div className="aa-detail__list">
                  {EDUCATION.map((e, i) => (
                    <div key={i} className="aa-detail__list-item">
                      <span className="aa-detail__list-title">{e.school || e.institution || '—'}</span>
                      <span className="aa-detail__list-meta">{e.degree || e.degreee || ''} {e.year ? `• ${e.year}` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {AWARDS.length > 0 && (
              <div className="aa-detail__subsection">
                <h4><Award size={14} /> Awards</h4>
                <div className="aa-detail__list">
                  {AWARDS.map((a, i) => (
                    <div key={i} className="aa-detail__list-item">
                      <span className="aa-detail__list-title">{a.title || a.name || '—'}</span>
                      <span className="aa-detail__list-meta">{a.issuer || ''} {a.year ? `• ${a.year}` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(info.exhibitions || info.exhibitionsList) && (
              <div className="aa-detail__subsection">
                <h4><Building2 size={14} /> Exhibitions</h4>
                <p className="aa-detail__text-block">{info.exhibitions || info.exhibitionsList}</p>
              </div>
            )}
          </div>

          {/* Section 3: Portfolio Review */}
          <div className="aa-detail__section">
            <h3 className="aa-detail__section-title"><ImageIcon size={18} /> Portfolio Review</h3>
            {images.length === 0 ? (
              <div className="aa-detail__empty-state"><ImageIcon size={32} /><p>No portfolio images submitted</p></div>
            ) : (
              <>
                <p className="aa-detail__section-subtitle">{images.length} artwork{images.length !== 1 ? 's' : ''} submitted for review</p>
                <div className="aa-detail__portfolio-grid">
                  {images.map((img, i) => {
                    const src = typeof img === 'string' ? img : img.url || img.full || img.thumb || '';
                    const title = typeof img === 'object' ? (img.title || img.caption || `Artwork ${i + 1}`) : `Artwork ${i + 1}`;
                    const medium = typeof img === 'object' ? img.medium : '';
                    const year = typeof img === 'object' ? img.year : '';
                    const dimensions = typeof img === 'object' ? img.dimensions : '';
                    return (
                      <div key={i} className="aa-detail__portfolio-card" onClick={() => { setLightboxImg(src); setZoomLevel(1); }}>
                        <div className="aa-detail__portfolio-img">
                          {src ? <img src={src} alt={title} /> : <div className="aa-detail__portfolio-placeholder"><ImageIcon size={32} /></div>}
                          <div className="aa-detail__portfolio-overlay">
                            <ZoomIn size={20} />
                          </div>
                        </div>
                        <div className="aa-detail__portfolio-info">
                          <span className="aa-detail__portfolio-title">{title}</span>
                          {medium && <span className="aa-detail__portfolio-meta">{medium}</span>}
                          <div className="aa-detail__portfolio-meta-row">
                            {year && <span>{year}</span>}
                            {dimensions && <span>{dimensions}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {portfolio.description && (
                  <div className="aa-detail__portfolio-desc">
                    <label>Artist Statement</label>
                    <p>{portfolio.description}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Section 4: Verification */}
          <div className="aa-detail__section">
            <h3 className="aa-detail__section-title"><Shield size={18} /> Verification</h3>
            <div className="aa-detail__verify-grid">
              {[
                { key: 'govId', label: 'Identity Verification', doc: kycDocs.govId },
                { key: 'addressProof', label: 'Address Verification', doc: kycDocs.addressProof },
                { key: 'pan', label: 'Portfolio Verification', doc: kycDocs.pan },
                { key: 'tax', label: 'Artist Information Verification', doc: kycDocs.tax },
              ].map((v) => {
                const hasDoc = !!v.doc;
                return (
                  <div key={v.key} className={`aa-detail__verify-card ${hasDoc ? 'aa-detail__verify-card--submitted' : ''}`}>
                    <div className="aa-detail__verify-header">
                      <Shield size={16} />
                      <span>{v.label}</span>
                    </div>
                    <div className="aa-detail__verify-status">
                      {hasDoc ? (
                        <>
                          <span className="aa-status-badge" style={{ color: '#D97706', background: 'rgba(217,119,6,0.1)' }}>
                            <FileText size={12} /> Document Submitted
                          </span>
                          <div className="aa-detail__verify-doc-type">
                            <FileText size={12} />
                            <span>{typeof v.doc === 'string' ? v.doc.split('/').pop() : 'Document'}</span>
                          </div>
                        </>
                      ) : (
                        <span className="aa-status-badge" style={{ color: '#9CA3AF', background: 'rgba(156,163,175,0.1)' }}>
                          <AlertCircle size={12} /> Not Provided
                        </span>
                      )}
                    </div>
                    {hasDoc && (
                      <div className="aa-detail__verify-actions">
                        <button className="admin-ghost-btn admin-ghost-btn--sm"><Eye size={12} /> View</button>
                        <button className="admin-ghost-btn admin-ghost-btn--sm"><CheckCircle size={12} /> Mark Verified</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: Social & External Presence */}
          <div className="aa-detail__section">
            <h3 className="aa-detail__section-title"><Globe size={18} /> Social & External Presence</h3>
            <div className="aa-detail__social-grid">
              {[
                { key: 'website', label: 'Website', icon: Globe, url: info.website },
                { key: 'ig', label: 'Instagram', icon: Camera, url: info.ig || info.instagram },
                { key: 'fb', label: 'Facebook', icon: Globe, url: info.fb || info.facebook },
                { key: 'behance', label: 'Behance', icon: Palette, url: info.behance },
              ].map((s) => (
                <div key={s.key} className={`aa-detail__social-item ${s.url ? 'aa-detail__social-item--active' : ''}`}>
                  <s.icon size={16} />
                  <span className="aa-detail__social-label">{s.label}</span>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="aa-detail__social-link">
                      {s.url} <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="aa-detail__muted">Not Provided</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Sidebar */}
        <div className="aa-detail__sidebar">

          {/* Section 6: Application Timeline */}
          <div className="aa-detail__section">
            <h3 className="aa-detail__section-title"><Clock size={18} /> Application Timeline</h3>
            <div className="aa-detail__timeline">
              {/* Always show initial submission */}
              <div className="aa-detail__timeline-item aa-detail__timeline-item--first">
                <div className="aa-detail__timeline-dot" style={{ background: '#059669' }} />
                <div className="aa-detail__timeline-content">
                  <span className="aa-detail__timeline-action">Application Submitted</span>
                  <span className="aa-detail__timeline-date">{fmtDateTime(app.submittedAt || app.createdAt)}</span>
                  <span className="aa-detail__timeline-actor">Applicant</span>
                </div>
              </div>
              {timeline.map((entry, i) => {
                const config = TIMELINE_ACTIONS[entry.action] || { icon: Clock, color: '#6B7280', label: entry.action };
                const Icon = config.icon;
                return (
                  <div key={entry.id} className="aa-detail__timeline-item">
                    <div className="aa-detail__timeline-dot" style={{ background: config.color }} />
                    <div className="aa-detail__timeline-content">
                      <span className="aa-detail__timeline-action">
                        <Icon size={12} /> {config.label}
                      </span>
                      <span className="aa-detail__timeline-date">{fmtDateTime(entry.createdAt)}</span>
                      {entry.admin && <span className="aa-detail__timeline-actor">Admin: {entry.admin.displayName}</span>}
                      {entry.meta?.reason && <span className="aa-detail__timeline-reason">Reason: {entry.meta.reason}</span>}
                      {entry.meta?.message && <span className="aa-detail__timeline-reason">{entry.meta.message}</span>}
                    </div>
                  </div>
                );
              })}
              {!timeline.length && (
                <div className="aa-detail__timeline-item">
                  <div className="aa-detail__timeline-dot" style={{ background: '#D97706' }} />
                  <div className="aa-detail__timeline-content">
                    <span className="aa-detail__timeline-action">Awaiting Review</span>
                    <span className="aa-detail__timeline-date">—</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 7: Internal Admin Notes */}
          <div className="aa-detail__section">
            <h3 className="aa-detail__section-title"><MessageSquare size={18} /> Internal Admin Notes</h3>
            <div className="aa-detail__notes">
              <div className="aa-detail__notes-list">
                {notes.length === 0 ? (
                  <div className="aa-detail__empty-state aa-detail__empty-state--sm">
                    <MessageSquare size={20} />
                    <p>No notes yet</p>
                  </div>
                ) : notes.map((note) => (
                  <div key={note.id} className="aa-detail__note">
                    <div className="aa-detail__note-header">
                      <span className="aa-detail__note-author">{note.admin?.displayName || note.admin?.fullName || 'Admin'}</span>
                      <span className="aa-detail__note-date">{fmtDateTime(note.createdAt)}</span>
                    </div>
                    <p className="aa-detail__note-content">{note.content}</p>
                  </div>
                ))}
              </div>
              <div className="aa-detail__notes-input">
                <textarea
                  placeholder="Add an internal note (not visible to applicant)..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                />
                <button className="aa-detail__note-submit" onClick={addNote} disabled={!noteText.trim()}>
                  <Send size={14} /> Add Note
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="aa-detail__mobile-bar">
        {app.status !== 'approved' && (
          <button className="aa-detail__mobile-btn aa-detail__mobile-btn--approve" onClick={() => setShowApprove(true)}>
            <CheckCircle size={16} /> Approve
          </button>
        )}
        <button className="aa-detail__mobile-btn aa-detail__mobile-btn--info" onClick={() => setShowRequestInfo(true)}>
          <MessageSquare size={16} /> Info
        </button>
        {app.status !== 'rejected' && (
          <button className="aa-detail__mobile-btn aa-detail__mobile-btn--reject" onClick={() => setShowReject(true)}>
            <XCircle size={16} /> Reject
          </button>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div className="aa-lightbox" onClick={() => setLightboxImg(null)}>
          <div className="aa-lightbox__content" onClick={(e) => e.stopPropagation()}>
            <button className="aa-lightbox__close" onClick={() => setLightboxImg(null)}><X size={20} /></button>
            <button className="aa-lightbox__zoom-out" onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))}>-</button>
            <button className="aa-lightbox__zoom-in" onClick={() => setZoomLevel(z => Math.min(3, z + 0.25))}>+</button>
            <div className="aa-lightbox__img-wrap" style={{ transform: `scale(${zoomLevel})` }}>
              <img src={lightboxImg} alt="" />
            </div>
            <span className="aa-lightbox__zoom-level">{Math.round(zoomLevel * 100)}%</span>
          </div>
        </div>
      )}

      {/* Modals */}
      {showApprove && (
        <ApproveModal
          app={app}
          user={u}
          loading={submitting}
          onConfirm={() => handleAction('approve')}
          onClose={() => setShowApprove(false)}
        />
      )}
      {showReject && (
        <RejectModal
          loading={submitting}
          onConfirm={(reason) => handleAction('reject', { reason })}
          onClose={() => setShowReject(false)}
        />
      )}
      {showRequestInfo && (
        <RequestInfoModal
          loading={submitting}
          onConfirm={(message, categories) => handleAction('request-info', { message, categories })}
          onClose={() => setShowRequestInfo(false)}
        />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  MODALS                                                        */
/* ═══════════════════════════════════════════════════════════════ */

const ApproveModal = ({ app, user, loading, onConfirm, onClose }) => (
  <div className="aa-modal-overlay" onClick={onClose}>
    <motion.div className="aa-modal" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
      <div className="aa-modal__header aa-modal__header--approve">
        <CheckCircle size={24} />
        <div>
          <h3>Approve Artist Application?</h3>
          <p>This will enable Artist capabilities for this user and activate their Artist Dashboard.</p>
        </div>
      </div>
      <div className="aa-modal__body">
        <div className="aa-modal__info-row">
          <span>Applicant</span>
          <strong>{user.displayName || user.fullName}</strong>
        </div>
        <div className="aa-modal__info-row">
          <span>Application ID</span>
          <strong>APP-{(app.userId || '').slice(-6).toUpperCase()}</strong>
        </div>
      </div>
      <div className="aa-modal__footer">
        <button className="aa-modal__cancel" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="aa-modal__confirm aa-modal__confirm--approve" onClick={onConfirm} disabled={loading}>
          {loading ? 'Approving...' : 'Approve Artist'}
        </button>
      </div>
    </motion.div>
  </div>
);

const RejectModal = ({ loading, onConfirm, onClose }) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const reasons = [
    'Incomplete Application',
    'Insufficient Portfolio',
    'Verification Issue',
    'Policy Violation',
    'Other',
  ];
  return (
    <div className="aa-modal-overlay" onClick={onClose}>
      <motion.div className="aa-modal" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
        <div className="aa-modal__header aa-modal__header--reject">
          <XCircle size={24} />
          <div>
            <h3>Reject Artist Application</h3>
            <p>Please provide a reason for rejection. The applicant will be notified.</p>
          </div>
        </div>
        <div className="aa-modal__body">
          <label className="aa-modal__label">Reason for Rejection</label>
          <div className="aa-modal__reasons">
            {reasons.map(r => (
              <button key={r} className={`aa-modal__reason-btn ${reason === r ? 'aa-modal__reason-btn--active' : ''}`} onClick={() => setReason(r)}>
                {r}
              </button>
            ))}
          </div>
          <textarea
            className="aa-modal__textarea"
            placeholder="Provide a detailed explanation..."
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            rows={3}
          />
        </div>
        <div className="aa-modal__footer">
          <button className="aa-modal__cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="aa-modal__confirm aa-modal__confirm--reject" onClick={() => onConfirm(reason === 'Other' ? customReason : reason)} disabled={loading || (!reason && !customReason)}>
            {loading ? 'Rejecting...' : 'Reject Application'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const RequestInfoModal = ({ loading, onConfirm, onClose }) => {
  const [message, setMessage] = useState('');
  const [categories, setCategories] = useState([]);
  const ALL_CATS = ['Additional Portfolio', 'Identity Document', 'Biography Update', 'Bank Information', 'Other Information'];
  const toggleCat = (c) => setCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  return (
    <div className="aa-modal-overlay" onClick={onClose}>
      <motion.div className="aa-modal" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
        <div className="aa-modal__header aa-modal__header--info">
          <MessageSquare size={24} />
          <div>
            <h3>Request More Information</h3>
            <p>The applicant will be notified and asked to provide the requested information.</p>
          </div>
        </div>
        <div className="aa-modal__body">
          <label className="aa-modal__label">Information Required</label>
          <div className="aa-modal__cats">
            {ALL_CATS.map(c => (
              <button key={c} className={`aa-modal__cat-btn ${categories.includes(c) ? 'aa-modal__cat-btn--active' : ''}`} onClick={() => toggleCat(c)}>
                {c}
              </button>
            ))}
          </div>
          <label className="aa-modal__label">Message to Applicant</label>
          <textarea
            className="aa-modal__textarea"
            placeholder="Explain what information is needed and why..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
        </div>
        <div className="aa-modal__footer">
          <button className="aa-modal__cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="aa-modal__confirm aa-modal__confirm--info" onClick={() => onConfirm(message, categories)} disabled={loading || !message}>
            {loading ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const BulkActionsModal = ({ count, onAssignReviewer, onChangePriority, onClose }) => (
  <div className="aa-modal-overlay" onClick={onClose}>
    <motion.div className="aa-modal aa-modal--sm" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
      <div className="aa-modal__header">
        <h3>Bulk Actions — {count} Application{count !== 1 ? 's' : ''}</h3>
      </div>
      <div className="aa-modal__body">
        <p className="aa-modal__note">Bulk approval and rejection are not allowed. Each application requires individual review.</p>
        <div className="aa-modal__bulk-actions">
          <button className="aa-modal__bulk-btn" onClick={() => { onChangePriority('normal'); onClose(); }}>Set Normal Priority</button>
          <button className="aa-modal__bulk-btn" onClick={() => { onChangePriority('high'); onClose(); }}>Set High Priority</button>
          <button className="aa-modal__bulk-btn" onClick={() => { onChangePriority('urgent'); onClose(); }}>Set Urgent Priority</button>
        </div>
      </div>
      <div className="aa-modal__footer">
        <button className="aa-modal__cancel" onClick={onClose}>Close</button>
      </div>
    </motion.div>
  </div>
);

export default ArtistApplications;
