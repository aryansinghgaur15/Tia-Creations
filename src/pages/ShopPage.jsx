import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search, SlidersHorizontal, LayoutGrid, Grid3X3, X,
  Truck, Shield, RotateCcw, Award, CheckCircle, ArrowRight,
  Star, MapPin, Users
} from 'lucide-react';
import ShopSidebar from '../components/ShopSidebar';
import ArtworkCard from '../components/ArtworkCard';
import SkeletonCard from '../components/SkeletonCard';
import ShopPagination from '../components/ShopPagination';
import QuickViewModal from '../components/QuickViewModal';
import './ShopPage.css';

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

const img = (id, w = 600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const MOCK_ARTWORKS = [
  { id: 1, name: 'Whispers of Gold', artist: 'Rhea Nair', artistAvatar: AVATARS[1], price: '₹ 45,000', originalPrice: '₹ 55,000', medium: 'Oil Painting', style: 'Abstract', subject: 'Landscape', size: 'Large', dimensions: '36 × 48 in', orientation: 'Vertical', color: 'Gold', rating: 4.8, reviews: 24, image: img('photo-1541961017774-22349e4a1262'), badge: 'Trending', verified: true, freeShipping: true, certificate: true, year: '2024', inStock: true },
  { id: 2, name: 'Beyond Horizons', artist: 'Vikram Iyer', artistAvatar: AVATARS[0], price: '₹ 38,000', medium: 'Acrylic', style: 'Contemporary', subject: 'Nature', size: 'Medium', dimensions: '30 × 40 in', orientation: 'Horizontal', color: 'Blue', rating: 4.6, reviews: 18, image: img('photo-1493246507139-91e8fad9978e'), verified: true, freeShipping: true, certificate: true, year: '2024', inStock: true },
  { id: 3, name: 'Urban Reflections', artist: 'Aisha Qureshi', artistAvatar: AVATARS[3], price: '₹ 35,000', originalPrice: '₹ 42,000', medium: 'Mixed Media', style: 'Modern', subject: 'Cityscape', size: 'Medium', dimensions: '24 × 36 in', orientation: 'Vertical', color: 'Grey', rating: 4.9, reviews: 31, image: img('photo-1579762715111-42f40c7f422a'), badge: 'New', verified: true, freeShipping: false, certificate: true, year: '2025', inStock: true },
  { id: 4, name: 'Eternal Bloom', artist: 'Kavita Singh', artistAvatar: AVATARS[5], price: '₹ 28,000', medium: 'Watercolor', style: 'Traditional', subject: 'Floral', size: 'Small', dimensions: '20 × 28 in', orientation: 'Vertical', color: 'Red', rating: 4.7, reviews: 15, image: img('photo-1590055531615-f16d36ffe8ea'), verified: true, freeShipping: true, certificate: false, year: '2024', inStock: true },
  { id: 5, name: 'Golden Aura', artist: 'Rahul Mehta', artistAvatar: AVATARS[2], price: '₹ 52,000', medium: 'Oil Painting', style: 'Abstract', subject: 'Minimal', size: 'Large', dimensions: '40 × 52 in', orientation: 'Vertical', color: 'Gold', rating: 4.5, reviews: 12, image: img('photo-1515405295579-ba7b45403062'), badge: 'Limited', verified: true, freeShipping: true, certificate: true, year: '2023', inStock: true },
  { id: 6, name: 'Midnight Solace', artist: 'Priya Desai', artistAvatar: AVATARS[7], price: '₹ 41,000', medium: 'Acrylic', style: 'Contemporary', subject: 'Nature', size: 'Medium', dimensions: '32 × 44 in', orientation: 'Vertical', color: 'Blue', rating: 4.8, reviews: 22, image: img('photo-1550684848-fac1c5b4e853'), verified: true, freeShipping: false, certificate: true, year: '2024', inStock: true },
  { id: 7, name: 'Silent Conversations', artist: 'Arjun Malhotra', artistAvatar: AVATARS[4], price: '₹ 68,000', medium: 'Mixed Media', style: 'Abstract', subject: 'Portrait', size: 'Oversized', dimensions: '48 × 60 in', orientation: 'Vertical', color: 'Earth Tone', rating: 4.9, reviews: 28, image: img('photo-1541701494587-cb58502866ab'), badge: 'Bestseller', verified: true, freeShipping: true, certificate: true, year: '2025', inStock: true },
  { id: 8, name: 'Morning Raga', artist: 'Ananya Das', artistAvatar: AVATARS[1], price: '₹ 22,000', medium: 'Watercolor', style: 'Traditional', subject: 'Spiritual', size: 'Small', dimensions: '18 × 24 in', orientation: 'Vertical', color: 'Orange', rating: 4.4, reviews: 9, image: img('photo-1579783902614-a3fb3927b6a5'), verified: true, freeShipping: true, certificate: false, year: '2024', inStock: true },
  { id: 9, name: 'Fractured Light', artist: 'Nisha Gupta', artistAvatar: AVATARS[3], price: '₹ 31,000', medium: 'Photography', style: 'Modern', subject: 'Architecture', size: 'Medium', dimensions: '24 × 36 in', orientation: 'Horizontal', color: 'White', rating: 4.7, reviews: 16, image: img('photo-1513364776144-60967b0f800f'), badge: 'New', verified: true, freeShipping: false, certificate: true, year: '2025', inStock: true },
  { id: 10, name: 'Sacred Geometry', artist: 'Vikram Singh', artistAvatar: AVATARS[6], price: '₹ 75,000', originalPrice: '₹ 85,000', medium: 'Mixed Media', style: 'Abstract', subject: 'Spiritual', size: 'Large', dimensions: '36 × 48 in', orientation: 'Square', color: 'Gold', rating: 4.9, reviews: 35, image: img('photo-1544413660-299165566b1d'), verified: true, freeShipping: true, certificate: true, year: '2024', inStock: true },
  { id: 11, name: 'Coastal Dreams', artist: 'Rhea Nair', artistAvatar: AVATARS[1], price: '₹ 29,000', medium: 'Oil Painting', style: 'Contemporary', subject: 'Landscape', size: 'Medium', dimensions: '28 × 36 in', orientation: 'Horizontal', color: 'Blue', rating: 4.6, reviews: 11, image: img('photo-1505691938895-1758d7feb511'), verified: true, freeShipping: true, certificate: false, year: '2024', inStock: true },
  { id: 12, name: 'Urban Decay', artist: 'Rahul Verma', artistAvatar: AVATARS[2], price: '₹ 33,000', medium: 'Mixed Media', style: 'Modern', subject: 'Cityscape', size: 'Medium', dimensions: '30 × 40 in', orientation: 'Horizontal', color: 'Grey', rating: 4.5, reviews: 8, image: img('photo-1513364776144-60967b0f800f'), verified: true, freeShipping: false, certificate: true, year: '2025', inStock: true },
  { id: 13, name: 'Lotus Awakening', artist: 'Kavita Singh', artistAvatar: AVATARS[5], price: '₹ 18,000', medium: 'Watercolor', style: 'Traditional', subject: 'Floral', size: 'Mini', dimensions: '16 × 20 in', orientation: 'Vertical', color: 'Pink', rating: 4.8, reviews: 19, image: img('photo-1507608616759-54f48f0af0ee'), badge: 'New', verified: true, freeShipping: true, certificate: false, year: '2025', inStock: true },
  { id: 14, name: 'Neon Nights', artist: 'Aisha Qureshi', artistAvatar: AVATARS[3], price: '₹ 44,000', medium: 'Acrylic', style: 'Contemporary', subject: 'Cityscape', size: 'Large', dimensions: '36 × 48 in', orientation: 'Vertical', color: 'Purple', rating: 4.7, reviews: 14, image: img('photo-1490750967868-88aa4f44baee'), verified: true, freeShipping: true, certificate: true, year: '2025', inStock: true },
  { id: 15, name: 'Bronze Solitude', artist: 'Vikram Singh', artistAvatar: AVATARS[6], price: '₹ 1,20,000', medium: 'Mixed Media', style: 'Modern', subject: 'Portrait', size: 'Large', dimensions: '24 × 18 × 16 in', orientation: 'Vertical', color: 'Brown', rating: 5.0, reviews: 6, image: img('photo-1544413660-299165566b1d'), badge: 'Limited', verified: true, freeShipping: true, certificate: true, year: '2023', inStock: false },
  { id: 16, name: 'Emerald Fields', artist: 'Ananya Das', artistAvatar: AVATARS[1], price: '₹ 26,000', medium: 'Oil Painting', style: 'Traditional', subject: 'Landscape', size: 'Medium', dimensions: '22 × 30 in', orientation: 'Horizontal', color: 'Green', rating: 4.6, reviews: 10, image: img('photo-1501854140801-50d01698950b'), verified: true, freeShipping: true, certificate: false, year: '2024', inStock: true },
  { id: 17, name: 'Digital Horizon', artist: 'Nisha Gupta', artistAvatar: AVATARS[3], price: '₹ 15,000', medium: 'Digital Painting', style: 'Modern', subject: 'Minimal', size: 'Small', dimensions: '20 × 28 in', orientation: 'Horizontal', color: 'Blue', rating: 4.3, reviews: 7, image: img('photo-1460661419201-fd4cecdf8a8b'), badge: 'New', verified: true, freeShipping: true, certificate: false, year: '2025', inStock: true },
  { id: 18, name: 'The Wanderer', artist: 'Arjun Malhotra', artistAvatar: AVATARS[4], price: '₹ 58,000', medium: 'Mixed Media', style: 'Abstract', subject: 'People', size: 'Large', dimensions: '40 × 50 in', orientation: 'Vertical', color: 'Earth Tone', rating: 4.8, reviews: 20, image: img('photo-1518837695005-2083093ee35b'), badge: 'Trending', verified: true, freeShipping: true, certificate: true, year: '2024', inStock: true },
  { id: 19, name: 'Twilight Reverie', artist: 'Meera Joshi', artistAvatar: AVATARS[7], price: '₹ 34,000', medium: 'Oil Painting', style: 'Impressionism', subject: 'Sunset', size: 'Medium', dimensions: '24 × 36 in', orientation: 'Horizontal', color: 'Orange', rating: 4.7, reviews: 13, image: img('photo-1475924156734-496f6cac6ec1'), verified: true, freeShipping: false, certificate: true, year: '2024', inStock: true },
  { id: 20, name: 'Monsoon Dreams', artist: 'Deepak Rao', artistAvatar: AVATARS[0], price: '₹ 27,000', originalPrice: '₹ 32,000', medium: 'Acrylic', style: 'Expressionism', subject: 'Nature', size: 'Medium', dimensions: '28 × 36 in', orientation: 'Vertical', color: 'Green', rating: 4.5, reviews: 11, image: img('photo-1470071459604-3b5ec3a7fe05'), verified: true, freeShipping: true, certificate: false, year: '2024', inStock: true },
  { id: 21, name: 'Temple Bell', artist: 'Sanjay Kulkarni', artistAvatar: AVATARS[6], price: '₹ 19,500', medium: 'Watercolor', style: 'Traditional', subject: 'Spiritual', size: 'Small', dimensions: '18 × 24 in', orientation: 'Vertical', color: 'Gold', rating: 4.6, reviews: 9, image: img('photo-1502082553048-f009c37129b9'), verified: true, freeShipping: true, certificate: true, year: '2024', inStock: true },
  { id: 22, name: 'City Lights', artist: 'Fatima Sheikh', artistAvatar: AVATARS[5], price: '₹ 22,500', medium: 'Photography', style: 'Contemporary', subject: 'Cityscape', size: 'Medium', dimensions: '24 × 36 in', orientation: 'Horizontal', color: 'Black', rating: 4.8, reviews: 17, image: img('photo-1519681393784-d120267933ba'), badge: 'Editor\'s Choice', verified: true, freeShipping: true, certificate: true, year: '2025', inStock: true },
  { id: 23, name: 'Cosmic Dance', artist: 'Ravi Shankar', artistAvatar: AVATARS[2], price: '₹ 48,000', medium: 'Acrylic', style: 'Abstract', subject: 'Spiritual', size: 'Large', dimensions: '36 × 48 in', orientation: 'Vertical', color: 'Purple', rating: 4.9, reviews: 26, image: img('photo-1460661419201-fd4cecdf8a8b'), verified: true, freeShipping: true, certificate: true, year: '2024', inStock: true },
  { id: 24, name: 'Village Morning', artist: 'Lakshmi Devi', artistAvatar: AVATARS[1], price: '₹ 36,000', medium: 'Oil Painting', style: 'Realism', subject: 'Village', size: 'Large', dimensions: '36 × 48 in', orientation: 'Horizontal', color: 'Yellow', rating: 4.7, reviews: 14, image: img('photo-1506744038136-46273834b3fb'), verified: true, freeShipping: true, certificate: true, year: '2024', inStock: true },
];

const POPULAR_TAGS = ['Landscape', 'Abstract', 'Krishna', 'Nature', 'Modern', 'Blue', 'Minimal', "Editor's Choice"];

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'trending', label: 'Trending' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price-low', label: 'Price Low → High' },
  { value: 'price-high', label: 'Price High → Low' },
  { value: 'newest', label: 'Newest' },
];

const COLLECTIONS = [
  { title: 'Landscape Collection', desc: 'Breathtaking vistas from mountains to seas', count: 248, image: img('photo-1501854140801-50d01698950b') },
  { title: 'Modern Living', desc: 'Contemporary art for modern spaces', count: 186, image: img('photo-1541961017774-22349e4a1262') },
  { title: 'Indian Heritage', desc: 'Celebrate the richness of Indian culture', count: 312, image: img('photo-1579783902614-a3fb3927b6a5') },
  { title: 'Minimal Interiors', desc: 'Clean, serene pieces for calm spaces', count: 154, image: img('photo-1550684848-fac1c5b4e853') },
  { title: 'Luxury Office', desc: 'Statement art for professional spaces', count: 97, image: img('photo-1541701494587-cb58502866ab') },
  { title: 'Nature Collection', desc: 'The beauty of the natural world', count: 275, image: img('photo-1470071459604-3b5ec3a7fe05') },
  { title: 'Sacred Collection', desc: 'Spiritual and devotional artworks', count: 203, image: img('photo-1544413660-299165566b1d') },
  { title: 'Contemporary India', desc: 'Modern Indian art at its finest', count: 168, image: img('photo-1513364776144-60967b0f800f') },
];

const TRUST_ITEMS = [
  { icon: <Shield size={24} />, label: 'Original Artwork', desc: 'Every piece is an original creation' },
  { icon: <Award size={24} />, label: 'Certificate of Authenticity', desc: 'Verified provenance included' },
  { icon: <Truck size={24} />, label: 'Free Shipping', desc: 'Complimentary worldwide delivery' },
  { icon: <RotateCcw size={24} />, label: 'Easy Returns', desc: '7-day hassle-free returns' },
  { icon: <CheckCircle size={24} />, label: 'Verified Artists', desc: 'Curated & authenticated artists' },
  { icon: <Shield size={24} />, label: 'Secure Payments', desc: 'Bank-grade encryption' },
];

const FEATURED_ARTISTS = [
  { name: 'Rhea Nair', location: 'Mumbai', artworks: 42, followers: '2.1k', avatar: AVATARS[1], rating: 4.9 },
  { name: 'Arjun Malhotra', location: 'Delhi', artworks: 38, followers: '3.4k', avatar: AVATARS[4], rating: 4.8 },
  { name: 'Kavita Singh', location: 'Jaipur', artworks: 56, followers: '1.8k', avatar: AVATARS[5], rating: 4.7 },
  { name: 'Vikram Singh', location: 'Bangalore', artworks: 31, followers: '4.2k', avatar: AVATARS[6], rating: 4.9 },
];

const parsePrice = (s) => parseInt(s.replace(/[^\d]/g, ''), 10);

const mapArtwork = (a) => ({
  id: a.id,
  name: a.title,
  artist: a.artist?.displayName || 'Unknown Artist',
  artistAvatar: a.artist?.avatarUrl || AVATARS[0],
  price: `₹ ${Number(a.price).toLocaleString('en-IN')}`,
  medium: a.medium || 'Mixed Media',
  style: a.style || 'Contemporary',
  subject: a.subject || 'Abstract',
  dimensions: a.dimensions || '',
  orientation: a.orientation || 'Vertical',
  rating: a.ratingAvg || 4.5,
  reviews: 0,
  image: a.thumbnail || a.images?.[0]?.thumb || img('photo-1541961017774-22349e4a1262'),
  badge: a.isFeatured ? 'Trending' : null,
  verified: true,
  freeShipping: true,
  certificate: a.certificate || false,
  year: a.year || '2025',
  inStock: true,
});

const ShopPage = () => {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('latest');
  const [gridCols, setGridCols] = useState(4);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [quickViewArtwork, setQuickViewArtwork] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [apiArtworks, setApiArtworks] = useState([]);

  const PER_PAGE = 12;

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || window.location.origin;
    fetch(`${API}/api/artworks?limit=100`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.items?.length) setApiArtworks(d.items.map(mapArtwork));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allArtworks = apiArtworks.length > 0 ? apiArtworks : MOCK_ARTWORKS;

  const filtered = useMemo(() => {
    let result = [...allArtworks];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q) ||
        a.medium.toLowerCase().includes(q) || a.style.toLowerCase().includes(q) ||
        a.subject.toLowerCase().includes(q)
      );
    }
    if (filters.medium?.length) result = result.filter(a => filters.medium.includes(a.medium));
    if (filters.style?.length) result = result.filter(a => filters.style.includes(a.style));
    if (filters.subject?.length) result = result.filter(a => filters.subject.includes(a.subject));
    if (filters.orientation?.length) result = result.filter(a => filters.orientation.includes(a.orientation));
    if (filters.color?.length) result = result.filter(a => filters.color.includes(a.color));
    if (filters.size?.length) result = result.filter(a => filters.size.includes(a.size));
    if (filters.room?.length) result = result.filter(() => true);
    if (filters.mood?.length) result = result.filter(() => true);
    if (filters.frame?.length) result = result.filter(() => true);
    if (filters.theme?.length) result = result.filter(() => true);
    if (filters.certificate?.length) result = result.filter(a => a.certificate);
    if (filters.shipping?.length) result = result.filter(a => a.freeShipping);
    if (filters.availability?.length) {
      result = result.filter(a => {
        for (const av of filters.availability) {
          if (av === 'Ready to Ship' && a.freeShipping) return true;
          if (av === 'In Stock' && a.inStock) return true;
          if (av === 'Only One Left' && !a.inStock) return true;
        }
        return false;
      });
    }
    if (filters.offers?.length) {
      result = result.filter(a => {
        for (const o of filters.offers) {
          if (o === 'Best Seller' && a.badge === 'Bestseller') return true;
          if (o === "Editor's Choice" && a.badge === "Editor's Choice") return true;
          if (o === 'Trending' && a.badge === 'Trending') return true;
          if (o === 'Exclusive' && a.badge === 'Limited') return true;
          if (o === 'Discount' && a.originalPrice) return true;
        }
        return false;
      });
    }
    if (filters.price?.length) {
      const q = filters.price;
      if (typeof q[1] === 'number' && q[1] < 2000000) {
        result = result.filter(a => parsePrice(a.price) <= q[1]);
      }
      for (const p of q) {
        if (typeof p !== 'number') {
          result = result.filter(a => {
            const price = parsePrice(a.price);
            switch (p) {
              case 'Under ₹5,000': return price < 5000;
              case '₹5k – 15k': return price >= 5000 && price <= 15000;
              case '₹15k – 50k': return price >= 15000 && price <= 50000;
              case '₹50k – 1L': return price >= 50000 && price <= 100000;
              case '₹1L – 5L': return price >= 100000 && price <= 500000;
              case '₹5L – 10L': return price >= 500000 && price <= 1000000;
              case '₹10L+': return price > 1000000;
              default: return true;
            }
          });
        }
      }
    }
    switch (sortBy) {
      case 'price-low': result.sort((a, b) => parsePrice(a.price) - parsePrice(b.price)); break;
      case 'price-high': result.sort((a, b) => parsePrice(b.price) - parsePrice(a.price)); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'popular': result.sort((a, b) => b.reviews - a.reviews); break;
      default: break;
    }
    return result;
  }, [search, filters, sortBy, allArtworks]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const displayed = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [filters, sortBy, search]);

  const activeChips = useMemo(() => {
    const chips = [];
    Object.entries(filters).forEach(([key, val]) => {
      if (Array.isArray(val)) val.forEach(v => {
        if (typeof v === 'string') chips.push({ key, value: v });
      });
    });
    return chips;
  }, [filters]);

  const removeFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key]?.filter(v => v !== value) || [],
    }));
  };

  const clearAllFilters = () => { setFilters({}); setSearch(''); };

  return (
    <main className="shop">
      <section className="shop-hero">
        <div className="shop-hero__inner">
          <motion.div className="shop-hero__breadcrumb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Link to="/">Home</Link><span>/</span><span className="shop-hero__breadcrumb--active">Shop Art</span>
          </motion.div>
          <motion.h1 className="shop-hero__title" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            Discover <em className="accent-text">Original Art</em>
          </motion.h1>
          <motion.p className="shop-hero__subtitle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
            Explore curated paintings, sculptures, photography and contemporary artworks from talented artists across India.
          </motion.p>
          <motion.div className="shop-hero__search" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
            <Search size={18} className="shop-hero__search-icon" />
            <input type="text" placeholder="Search artwork, artist, collection or style..." value={search} onChange={(e) => setSearch(e.target.value)} className="shop-hero__search-input" />
            {search && <button className="shop-hero__search-clear" onClick={() => setSearch('')}><X size={14} /></button>}
          </motion.div>
          <motion.div className="shop-hero__tags" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
            <span className="shop-hero__tags-label">Popular:</span>
            {POPULAR_TAGS.map(tag => (
              <button key={tag} className="shop-hero__tag" onClick={() => setSearch(tag)}>{tag}</button>
            ))}
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {activeChips.length > 0 && (
          <motion.div className="shop-active-filters" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="shop-active-filters__inner">
              {activeChips.map((chip, i) => (
                <span key={`${chip.key}-${chip.value}-${i}`} className="shop-chip">
                  {chip.value}<button onClick={() => removeFilter(chip.key, chip.value)}><X size={10} /></button>
                </span>
              ))}
              <button className="shop-chip shop-chip--clear" onClick={clearAllFilters}>Clear All</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="shop-layout">
        <div className="shop-layout__sidebar">
          <ShopSidebar filters={filters} setFilters={setFilters} />
        </div>

        <div className="shop-layout__main">
          <div className="shop-toolbar">
            <div className="shop-toolbar__left">
              <span className="shop-toolbar__count">Showing <strong>{filtered.length}</strong> Artworks</span>
            </div>
            <div className="shop-toolbar__right">
              <div className="shop-toolbar__sort">
                <label>Sort:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="shop-toolbar__divider" />
              <div className="shop-toolbar__grid-toggle">
                {[4, 3, 2].map(n => (
                  <button key={n} className={`shop-toolbar__grid-btn ${gridCols === n ? 'shop-toolbar__grid-btn--active' : ''}`} onClick={() => setGridCols(n)} aria-label={`${n} columns`}>
                    {n === 2 ? <LayoutGrid size={15} /> : <Grid3X3 size={15} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button className="shop-mobile-filter" onClick={() => setMobileFiltersOpen(true)}>
            <SlidersHorizontal size={15} /> Filters
            {activeChips.length > 0 && <span className="shop-mobile-filter__badge">{activeChips.length}</span>}
          </button>

          <div className={`shop-grid shop-grid--${gridCols}`}>
            {loading ? (
              Array.from({ length: PER_PAGE }).map((_, i) => <SkeletonCard key={i} index={i} />)
            ) : displayed.length > 0 ? (
              displayed.map((artwork, i) => (
                <ArtworkCard key={artwork.id} artwork={artwork} index={i} onQuickView={setQuickViewArtwork} />
              ))
            ) : (
              <div className="shop-empty">
                <div className="shop-empty__icon"><Search size={48} strokeWidth={1} /></div>
                <h3>No artwork matches your current filters</h3>
                <p>Try adjusting your search or filters to discover more pieces.</p>
                <div className="shop-empty__actions">
                  <button className="btn-primary" onClick={clearAllFilters}><span>CLEAR ALL FILTERS</span></button>
                  <Link to="/" className="btn-ghost">EXPLORE FEATURED</Link>
                </div>
              </div>
            )}
          </div>

          {!loading && totalPages > 1 && (
            <ShopPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          )}
        </div>
      </div>

      <section className="shop-discovery">
        <div className="shop-discovery__inner">
          <div className="shop-discovery__header">
            <span className="section-eyebrow">Continue Exploring</span>
            <h2 className="shop-discovery__title">Recently Viewed</h2>
          </div>
          <div className="shop-discovery__grid">
            {allArtworks.slice(0, 4).map((artwork, i) => (
              <ArtworkCard key={`rv-${artwork.id}`} artwork={artwork} index={i} onQuickView={setQuickViewArtwork} />
            ))}
          </div>
        </div>
      </section>

      <section className="shop-featured-artists">
        <div className="shop-featured-artists__inner">
          <div className="shop-featured-artists__header">
            <div>
              <span className="section-eyebrow">Meet The Artists</span>
              <h2 className="shop-featured-artists__title">Featured Artists</h2>
            </div>
            <Link to="/artists" className="btn-ghost">VIEW ALL ARTISTS <ArrowRight size={14} /></Link>
          </div>
          <div className="shop-featured-artists__grid">
            {FEATURED_ARTISTS.map((artist, i) => (
              <motion.div key={artist.name} className="shop-artist-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <img src={artist.avatar} alt={artist.name} className="shop-artist-card__avatar" />
                <h4 className="shop-artist-card__name">{artist.name}</h4>
                <p className="shop-artist-card__location"><MapPin size={11} /> {artist.location}</p>
                <div className="shop-artist-card__stats">
                  <span><Star size={11} fill="var(--gold)" stroke="none" /> {artist.rating}</span>
                  <span>{artist.artworks} Artworks</span>
                  <span><Users size={11} /> {artist.followers}</span>
                </div>
                <button className="shop-artist-card__follow">Follow</button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="shop-collections">
        <div className="shop-collections__inner">
          <div className="shop-collections__header">
            <span className="section-eyebrow">Curated For You</span>
            <h2 className="shop-collections__title">Explore Collections</h2>
          </div>
          <div className="shop-collections__grid">
            {COLLECTIONS.map((col, i) => (
              <motion.div key={col.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <Link to="/shop" className="shop-collection-card">
                  <div className="shop-collection-card__img-wrap">
                    <img src={col.image} alt={col.title} className="shop-collection-card__img" loading="lazy" />
                    <div className="shop-collection-card__overlay">
                      <span className="shop-collection-card__count">{col.count} Artworks</span>
                    </div>
                  </div>
                  <h3 className="shop-collection-card__title">{col.title}</h3>
                  <p className="shop-collection-card__desc">{col.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="shop-trust">
        <div className="shop-trust__inner">
          <div className="shop-trust__header">
            <span className="section-eyebrow">Why TIA Creations</span>
          </div>
          <div className="shop-trust__grid">
            {TRUST_ITEMS.map((item, i) => (
              <motion.div key={item.label} className="shop-trust__item" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="shop-trust__icon">{item.icon}</div>
                <h4 className="shop-trust__label">{item.label}</h4>
                <p className="shop-trust__desc">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {mobileFiltersOpen && (
          <ShopSidebar filters={filters} setFilters={setFilters} onClose={() => setMobileFiltersOpen(false)} isMobile />
        )}
      </AnimatePresence>

      <QuickViewModal artwork={quickViewArtwork} onClose={() => setQuickViewArtwork(null)} />
    </main>
  );
};

export default ShopPage;
