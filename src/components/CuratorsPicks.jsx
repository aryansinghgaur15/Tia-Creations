import React, { useRef, useState } from 'react';

import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ArtworkCard from './ArtworkCard';
import QuickViewModal from './QuickViewModal';
import './CuratorsPicks.css';

const ARTWORKS = [
  { name: "Whispers of Gold", artist: "Rhea Nair", price: "₹ 45,000", image: "https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?auto=format&fit=crop&w=600&q=80", verified: true },
  { name: "Beyond Horizons", artist: "Vikram Iyer", price: "₹ 38,000", image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=600&q=80", verified: true, badge: "Trending" },
  { name: "Urban Reflections", artist: "Aisha Qureshi", price: "₹ 35,000", image: "https://images.unsplash.com/photo-1579762715111-42f40c7f422a?auto=format&fit=crop&w=600&q=80", verified: true },
  { name: "Eternal Bloom", artist: "Kavita Singh", price: "₹ 28,000", image: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=600&q=80", verified: true, badge: "New" },
  { name: "Golden Aura", artist: "Rahul Mehta", price: "₹ 52,000", image: "https://images.unsplash.com/photo-1515405295579-ba7b45403062?auto=format&fit=crop&w=600&q=80", verified: true },
  { name: "Midnight Solace", artist: "Priya Desai", price: "₹ 41,000", image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80", verified: true, badge: "Limited" },
];

const CuratorsPicks = () => {
  const carouselRef = useRef(null);
  const [quickViewArtwork, setQuickViewArtwork] = useState(null);

  const scroll = (direction) => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      carouselRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="curators-picks-section">
      <div className="curators-picks-header">
        <h2 className="section-title" style={{ color: 'var(--text-white)' }}>CURATOR'S PICKS</h2>
        <Link to="/shop" className="view-all-link" style={{ color: 'var(--text-white)' }}>
          VIEW ALL ARTWORKS <ArrowRight size={16} />
        </Link>
        <div className="carousel-controls">
          <button className="carousel-btn" onClick={() => scroll('left')}><ChevronLeft size={24} /></button>
          <button className="carousel-btn" onClick={() => scroll('right')}><ChevronRight size={24} /></button>
        </div>
      </div>

      <div className="picks-carousel-container">
        <div className="picks-carousel" ref={carouselRef}>
          {ARTWORKS.map((art, index) => (
            <ArtworkCard
              key={index}
              artwork={art}
              index={index}
              variant="carousel"
              onQuickView={setQuickViewArtwork}
            />
          ))}
        </div>
      </div>

      <QuickViewModal artwork={quickViewArtwork} onClose={() => setQuickViewArtwork(null)} />
    </section>
  );
};

export default CuratorsPicks;
