import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, X, ShoppingBag, ArrowLeft, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ArtworkCard from '../components/ArtworkCard';
import './ProfilePage.css';

const IMG = (id, w = 600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
];

const MOCK_WISHLIST = [
  { id: 1, name: 'Whispers of Gold', artist: 'Rhea Nair', artistAvatar: AVATARS[1], price: '₹ 45,000', medium: 'Oil Painting', image: IMG('photo-1541961017774-22349e4a1262'), rating: 4.8, badge: 'Trending', verified: true },
  { id: 2, name: 'Beyond Horizons', artist: 'Vikram Iyer', artistAvatar: AVATARS[0], price: '₹ 38,000', medium: 'Acrylic', image: IMG('photo-1493246507139-91e8fad9978e'), rating: 4.6, verified: true },
  { id: 3, name: 'Eternal Bloom', artist: 'Kavita Singh', artistAvatar: AVATARS[5], price: '₹ 28,000', medium: 'Watercolor', image: IMG('photo-1590055531615-f16d36ffe8ea'), rating: 4.7, verified: true },
  { id: 4, name: 'Golden Aura', artist: 'Rahul Mehta', artistAvatar: AVATARS[2], price: '₹ 52,000', medium: 'Oil Painting', image: IMG('photo-1515405295579-ba7b45403062'), badge: 'Limited', rating: 4.5, verified: true },
  { id: 5, name: 'Midnight Solace', artist: 'Priya Desai', artistAvatar: AVATARS[7], price: '₹ 41,000', medium: 'Acrylic', image: IMG('photo-1550684848-fac1c5b4e853'), rating: 4.8, verified: true },
  { id: 6, name: 'Silent Conversations', artist: 'Arjun Malhotra', artistAvatar: AVATARS[4], price: '₹ 68,000', medium: 'Mixed Media', image: IMG('photo-1541701494587-cb58502866ab'), badge: 'Bestseller', rating: 4.9, verified: true },
  { id: 7, name: 'Morning Raga', artist: 'Ananya Das', artistAvatar: AVATARS[1], price: '₹ 22,000', medium: 'Watercolor', image: IMG('photo-1579783902614-a3fb3927b6a5'), rating: 4.4, verified: true },
  { id: 8, name: 'Fractured Light', artist: 'Nisha Gupta', artistAvatar: AVATARS[3], price: '₹ 31,000', medium: 'Photography', image: IMG('photo-1513364776144-60967b0f800f'), rating: 4.7, verified: true },
];

const WishlistPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return; }
    setItems(MOCK_WISHLIST);
  }, [user, navigate]);

  if (!user) return null;

  const handleRemove = (id) => {
    setRemoving(id);
    setTimeout(() => {
      setItems(prev => prev.filter(item => item.id !== id));
      setRemoving(null);
    }, 300);
  };

  const handleMoveToCart = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <main className="wishlist-page">
      <section className="wishlist-hero">
        <div className="wishlist-hero__inner">
          <div className="wishlist-hero__breadcrumb">
            <Link to="/">Home</Link><span>/</span><span className="wishlist-hero__breadcrumb--active">Wishlist</span>
          </div>
          <motion.h1 className="wishlist-hero__title" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            My <em className="accent-text">Wishlist</em>
          </motion.h1>
          <motion.p className="wishlist-hero__count" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <Heart size={14} fill="var(--gold)" stroke="none" /> {items.length} {items.length === 1 ? 'Artwork' : 'Artworks'} Saved
          </motion.p>
        </div>
      </section>

      <div className="wishlist-inner">
        {items.length > 0 ? (
          <div className="wishlist-grid">
            <AnimatePresence>
              {items.map((artwork, i) => (
                <motion.div
                  key={artwork.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.96 }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="wishlist-item"
                >
                  <ArtworkCard artwork={artwork} index={i} variant="grid" />

                  <div className="wishlist-item__actions">
                    <button
                      className="wishlist-item__cart btn-gold"
                      onClick={() => handleMoveToCart(artwork.id)}
                    >
                      <ShoppingBag size={13} />
                      <span>Move to Cart</span>
                    </button>
                    <button
                      className="wishlist-item__remove"
                      onClick={() => handleRemove(artwork.id)}
                      aria-label="Remove from wishlist"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div className="wishlist-empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="wishlist-empty__icon">
              <Heart size={48} strokeWidth={1} />
            </div>
            <h2 className="wishlist-empty__title">Your wishlist is empty</h2>
            <p className="wishlist-empty__desc">Save your favourite artworks to come back to them later.</p>
            <Link to="/shop" className="btn-primary">
              <span>EXPLORE ARTWORKS</span>
            </Link>
          </motion.div>
        )}
      </div>
    </main>
  );
};

export default WishlistPage;
