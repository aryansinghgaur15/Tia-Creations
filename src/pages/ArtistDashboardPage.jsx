import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Eye, Heart, DollarSign, BarChart3, Upload, FolderOpen,
  MessageCircle, TrendingUp, ExternalLink, MoreHorizontal,
  Image as ImageIcon, AlertCircle, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './BecomeArtistPage.css';

const API = import.meta.env.VITE_API_URL || window.location.origin;

const STATUS_MAP = {
  published: { label: 'Published', color: 'green' },
  in_review: { label: 'In Review', color: 'amber' },
  draft: { label: 'Draft', color: 'gray' },
  rejected: { label: 'Rejected', color: 'red' },
};

export default function ArtistDashboardPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
    else if (user.artistStatus !== 'approved') navigate('/become-artist', { replace: true });
  }, [user, navigate]);

  const fetchArtworks = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/artworks/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setArtworks(data.artworks || []);
      }
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchArtworks(); }, [fetchArtworks]);

  if (!user || user.artistStatus !== 'approved') return null;

  const totalViews = artworks.reduce((sum, a) => sum + (a.views || 0), 0);
  const totalSaves = artworks.reduce((sum, a) => sum + (a.saves || 0), 0);
  const publishedCount = artworks.filter(a => a.status === 'published').length;
  const pendingCount = artworks.filter(a => a.status === 'in_review').length;
  const rejectedCount = artworks.filter(a => a.status === 'rejected').length;

  const kpiData = [
    { label: 'Total Artworks', value: artworks.length, icon: ImageIcon, change: `${publishedCount} published` },
    { label: 'Profile Views', value: totalViews.toLocaleString(), icon: Eye, change: `${artworks.length > 0 ? 'across all artworks' : 'no artworks yet'}` },
    { label: 'Total Saves', value: totalSaves.toLocaleString(), icon: Heart, change: `${totalSaves} saves` },
    { label: 'Published', value: publishedCount, icon: DollarSign, change: `${pendingCount} in review, ${rejectedCount} rejected` },
  ];

  return (
    <div className="ad-page">
      <div className="ad-top">
        <div className="ad-greeting">
          <h1>Welcome back, <span>{user.displayName || user.fullName || 'Artist'}</span></h1>
          <p>Here's how your art is performing today.</p>
        </div>
        <Link to="/upload" className="btn-gold">
          <Upload size={18} /> Upload Artwork
        </Link>
      </div>

      <div className="ad-kpi">
        {kpiData.map((kpi) => (
          <div key={kpi.label} className="ad-kpi__card">
            <div className="ad-kpi__icon"><kpi.icon size={22} /></div>
            <div className="ad-kpi__info">
              <span className="ad-kpi__label">{kpi.label}</span>
              <span className="ad-kpi__value">{loading ? '...' : kpi.value}</span>
              <span className="ad-kpi__change">{kpi.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="ad-content-grid">
        <div className="ad-main">
          <div className="ad-section">
            <div className="ad-section__head">
              <h2>Your Artworks</h2>
            </div>
            {loading ? (
              <p style={{ padding: '2rem', opacity: 0.5 }}>Loading artworks...</p>
            ) : artworks.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                <ImageIcon size={48} style={{ marginBottom: 12 }} />
                <p>No artworks yet. Upload your first piece!</p>
              </div>
            ) : (
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Artwork</th>
                      <th>Status</th>
                      <th>Price</th>
                      <th>Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {artworks.map((art) => (
                      <tr key={art.id}>
                        <td className="ad-table__art">
                          <span className="ad-table__title">{art.title}</span>
                        </td>
                        <td>
                          <span className={`ad-status-badge ad-status-badge--${STATUS_MAP[art.status]?.color || 'gray'}`}>
                            {STATUS_MAP[art.status]?.label || art.status}
                          </span>
                        </td>
                        <td className="ad-table__price">₹{Number(art.price).toLocaleString()}</td>
                        <td className="ad-table__views">
                          <Eye size={14} /> {art.views || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="ad-sidebar">
          <div className="ad-panel ad-panel--alert">
            <div className="ad-panel__head">
              <AlertCircle size={18} /> Action Required
            </div>
            <div className="ad-panel__items">
              {pendingCount > 0 && (
                <div className="ad-panel__item">
                  <div className="ad-panel__dot ad-panel__dot--amber" />
                  <span>{pendingCount} artwork{pendingCount !== 1 ? 's' : ''} pending review</span>
                </div>
              )}
              {rejectedCount > 0 && (
                <div className="ad-panel__item">
                  <div className="ad-panel__dot ad-panel__dot--red" />
                  <span>{rejectedCount} artwork{rejectedCount !== 1 ? 's' : ''} need revision</span>
                </div>
              )}
              {pendingCount === 0 && rejectedCount === 0 && (
                <div className="ad-panel__item">
                  <div className="ad-panel__dot ad-panel__dot--blue" />
                  <span>All clear! No actions needed.</span>
                </div>
              )}
            </div>
          </div>

          <div className="ad-panel">
            <div className="ad-panel__head">
              <Star size={18} /> Quick Links
            </div>
            <div className="ad-panel__links">
              <Link to="/upload" className="ad-quicklink">
                <Upload size={18} /> Upload Artwork
              </Link>
              <Link to="/artist/portfolio" className="ad-quicklink">
                <FolderOpen size={18} /> Manage Portfolio
              </Link>
              <Link to="/artist/analytics" className="ad-quicklink">
                <BarChart3 size={18} /> View Analytics
              </Link>
              <Link to="/artist/messages" className="ad-quicklink">
                <MessageCircle size={18} /> Messages
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
