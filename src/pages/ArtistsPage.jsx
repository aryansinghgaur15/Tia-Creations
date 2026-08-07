import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Filter, ChevronDown } from 'lucide-react';
import FeaturedArtist from '../components/FeaturedArtist';
import './ArtistsPage.css';

const MOCK_ARTISTS = [
  { id: 1, name: 'Arjun Malhotra', style: 'Abstract', mediums: ['Acrylic', 'Mixed Media'], image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', location: 'New Delhi', worksCount: 42 },
  { id: 2, name: 'Priya Sen', style: 'Contemporary', mediums: ['Oil', 'Canvas'], image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', location: 'Mumbai', worksCount: 18 },
  { id: 3, name: 'Vikram Singh', style: 'Modern', mediums: ['Sculpture', 'Bronze'], image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80', location: 'Jaipur', worksCount: 24 },
  { id: 4, name: 'Ananya Das', style: 'Traditional', mediums: ['Watercolor', 'Paper'], image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80', location: 'Kolkata', worksCount: 56 },
  { id: 5, name: 'Rahul Verma', style: 'Abstract', mediums: ['Digital Art', 'Mixed Media'], image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80', location: 'Bangalore', worksCount: 31 },
  { id: 6, name: 'Nisha Gupta', style: 'Contemporary', mediums: ['Photography'], image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80', location: 'Pune', worksCount: 12 },
];

const STYLES = ['All Styles', 'Abstract', 'Contemporary', 'Modern', 'Traditional'];
const MEDIUMS = ['All Mediums', 'Oil', 'Acrylic', 'Watercolor', 'Sculpture', 'Digital Art', 'Photography', 'Mixed Media'];

const ArtistsPage = () => {
  const [activeStyle, setActiveStyle] = useState('All Styles');
  const [activeMedium, setActiveMedium] = useState('All Mediums');
  
  const filteredArtists = MOCK_ARTISTS.filter(artist => {
    const styleMatch = activeStyle === 'All Styles' || artist.style === activeStyle;
    const mediumMatch = activeMedium === 'All Mediums' || artist.mediums.includes(activeMedium);
    return styleMatch && mediumMatch;
  });

  return (
    <main className="artists-page">
      {/* ─── Hero Section ─── */}
      <section className="artists-hero">
        <div className="artists-hero-content">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            MEET THE <span className="accent-text">CREATORS</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Discover the visionary artists behind our curated collections. 
            From emerging talents to established masters, explore their stories, 
            inspirations, and masterpieces.
          </motion.p>
        </div>
      </section>

      {/* ─── Featured Artist Component ─── */}
      <div className="featured-wrapper">
        <FeaturedArtist />
      </div>

      {/* ─── All Artists Section ─── */}
      <section className="all-artists-section">
        <div className="container">
          <div className="section-header">
            <h2>ALL ARTISTS</h2>
            
            <div className="filters-bar">
              <div className="filter-group">
                <span className="filter-label"><Filter size={14} /> Style:</span>
                <div className="custom-select">
                  <select value={activeStyle} onChange={(e) => setActiveStyle(e.target.value)}>
                    {STYLES.map(style => <option key={style} value={style}>{style}</option>)}
                  </select>
                  <ChevronDown size={14} className="select-icon" />
                </div>
              </div>
              
              <div className="filter-group">
                <span className="filter-label"><Filter size={14} /> Medium:</span>
                <div className="custom-select">
                  <select value={activeMedium} onChange={(e) => setActiveMedium(e.target.value)}>
                    {MEDIUMS.map(medium => <option key={medium} value={medium}>{medium}</option>)}
                  </select>
                  <ChevronDown size={14} className="select-icon" />
                </div>
              </div>
            </div>
          </div>

          <div className="artists-grid">
            {filteredArtists.length > 0 ? (
              filteredArtists.map((artist, i) => (
                <motion.div 
                  className="artist-grid-card" 
                  key={artist.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <div className="card-img-wrapper">
                    <img src={artist.image} alt={artist.name} loading="lazy" />
                  </div>
                  <div className="card-content">
                    <h3>{artist.name}</h3>
                    <p className="artist-meta">{artist.location} • {artist.worksCount} Artworks</p>
                    <div className="artist-tags">
                      <span className="tag">{artist.style}</span>
                      {artist.mediums.map(m => (
                        <span key={m} className="tag tag-outline">{m}</span>
                      ))}
                    </div>
                    <button className="view-profile-btn">
                      View Profile <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="no-results">
                <p>No artists found matching your criteria.</p>
                <button onClick={() => { setActiveStyle('All Styles'); setActiveMedium('All Mediums'); }}>
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Become An Artist CTA ─── */}
      <section className="become-artist-cta">
        <div className="cta-content">
          <h2>Are you an <span className="accent-text">Artist?</span></h2>
          <p>
            Join TIA Creations and showcase your work to thousands of passionate art collectors worldwide. 
            We handle the logistics, so you can focus on creating.
          </p>
          <button className="btn-primary cta-btn">
            APPLY TO SELL <ArrowRight size={16} />
          </button>
        </div>
        <div className="cta-image-wrapper">
          <img src="https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80" alt="Artist working in studio" />
        </div>
      </section>
    </main>
  );
};

export default ArtistsPage;
