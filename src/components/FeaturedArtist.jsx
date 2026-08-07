import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Award, Eye, Calendar } from 'lucide-react';
import './FeaturedArtist.css';

const FeaturedArtist = () => {
  return (
    <section className="featured-artist-section">
      <div className="featured-artist-inner">

        {/* ─── Section Header ─── */}
        <div className="featured-section-header" style={{ textAlign: 'center', marginBottom: 40 }}>
          <p className="curator-note-label" style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: 3, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 10 }}>FEATURED ARTIST</p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 400, color: 'var(--heading)' }}>Arjun Malhotra</h2>
        </div>

        {/* ─── Artist: Arjun Malhotra ─── */}
        <div className="artist-editorial-container">
          <div className="artist-portrait-col">
            <div className="artist-portrait-wrapper">
              <span className="artist-badge-overlay">FEATURED ARTIST</span>
              <img 
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80" 
                alt="Arjun Malhotra" 
                className="artist-portrait" 
              />
            </div>
          </div>
          
          <div className="artist-content-col">
            <div className="artist-header-row">
              <h3 className="artist-name">Arjun Malhotra</h3>
              <div className="verified-badge" title="Verified Artist">
                <Check size={16} strokeWidth={3} />
              </div>
            </div>
            
            <div className="artist-specialty">Abstract Expressionism</div>
            <div className="editorial-divider"></div>
            
            <blockquote className="artist-quote">
              "Every stroke is a fragment of memory. I paint not what I see, but what I remember feeling."
            </blockquote>
            
            <p className="artist-story">
              Hailing from New Delhi, Arjun Malhotra is an abstract expressionist whose work explores the tension between chaos and harmony. Working primarily in acrylic and mixed media, his canvases are layered landscapes of emotion — raw, spontaneous, and deeply introspective. With 42 original artworks in circulation, Arjun has become a defining voice in India's contemporary abstract movement, captivating collectors who seek art that speaks beyond the visual.
            </p>
            
            <div className="artist-accolades-row">
              <div className="accolades-list">
                <div className="accolade-item">
                  <Award size={16} />
                  <span>National Art Prize Finalist (2025)</span>
                </div>
                <div className="accolade-item">
                  <Eye size={16} />
                  <span>Exhibited at India Art Fair, New Delhi</span>
                </div>
                <div className="accolade-item">
                  <Calendar size={16} />
                  <span>11 Solo Shows Across India & Dubai</span>
                </div>
              </div>
              
              <svg className="signature-svg" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
                <path 
                  className="signature-path" 
                  d="M 30 45 Q 60 15 85 50 T 130 40 Q 150 25 175 55" 
                />
              </svg>
            </div>
            
            <div className="artist-stats-grid">
              <div className="stat-card">
                <span className="stat-value">8</span>
                <span className="stat-label">CURATED COLLECTIONS</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">42</span>
                <span className="stat-label">ORIGINAL ARTWORKS</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">3.2K+</span>
                <span className="stat-label">FOLLOWERS</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">6</span>
                <span className="stat-label">COUNTRIES</span>
              </div>
            </div>
            
            <div className="artist-ctas">
              <button className="btn-primary">DISCOVER ARJUN'S WORK</button>
              <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                VIEW PROFILE <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Horizontal Gallery */}
        <div className="artist-gallery">
          <div className="gallery-header">
            <h4 className="gallery-title">Featured Artworks</h4>
            <a href="#" className="view-all-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              VIEW GALLERY <ArrowRight size={16} />
            </a>
          </div>
          
          <div className="gallery-grid">
            <div className="gallery-item">
              <img 
                src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=500&q=80" 
                alt="Whispering Winds" 
                className="gallery-img" 
              />
              <div className="gallery-overlay">
                <div className="gallery-info">
                  <h5 className="gallery-artwork-title">Whispering Winds</h5>
                  <span className="gallery-artwork-price">$2,400</span>
                </div>
              </div>
            </div>
            
            <div className="gallery-item">
              <img 
                src="https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&w=500&q=80" 
                alt="Echoes of Silence" 
                className="gallery-img" 
              />
              <div className="gallery-overlay">
                <div className="gallery-info">
                  <h5 className="gallery-artwork-title">Echoes of Silence</h5>
                  <span className="gallery-artwork-price">$3,100</span>
                </div>
              </div>
            </div>
            
            <div className="gallery-item">
              <img 
                src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=500&q=80" 
                alt="Urban Rust" 
                className="gallery-img" 
              />
              <div className="gallery-overlay">
                <div className="gallery-info">
                  <h5 className="gallery-artwork-title">Urban Rust</h5>
                  <span className="gallery-artwork-price">$1,850</span>
                </div>
              </div>
            </div>
            
            <div className="gallery-item">
              <img 
                src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=500&q=80" 
                alt="Golden Dawn" 
                className="gallery-img" 
              />
              <div className="gallery-overlay">
                <div className="gallery-info">
                  <h5 className="gallery-artwork-title">Golden Dawn</h5>
                  <span className="gallery-artwork-price">$4,200</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default FeaturedArtist;
