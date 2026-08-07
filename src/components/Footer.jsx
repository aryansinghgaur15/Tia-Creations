import React from 'react';
import { Heart } from 'lucide-react';
import './Footer.css';

const IconInstagram = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const IconFacebook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const IconLinkedin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
  </svg>
);

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-top">

        {/* Brand */}
        <div className="footer-brand">
          <div className="logo footer-logo">
            <img src="/tia-logo.png" alt="TIA Creations" className="logo__img footer-logo__img" />
          </div>
          <p className="footer-tagline">Curating Art. Creating Impact.</p>
          <div className="social-links">
            <a href="#" aria-label="Instagram"><IconInstagram /></a>
            <a href="#" aria-label="Facebook"><IconFacebook /></a>
            <a href="#" aria-label="LinkedIn"><IconLinkedin /></a>
          </div>
        </div>

        {/* Links Grid */}
        <div className="footer-links">
          <div className="footer-column">
            <h4>COMPANY</h4>
            <a href="#">About</a>
            <a href="#">Blog</a>
            <a href="#">Contact</a>
            <a href="#">Careers</a>
          </div>

          <div className="footer-column">
            <h4>ARTISTS</h4>
            <a href="#" className="footer-sell-link">Sell Your Art</a>
            <a href="#">Artist Login</a>
            <a href="#">Featured Artists</a>
            <a href="#">All Artists</a>
          </div>

          <div className="footer-column">
            <h4>SUPPORT</h4>
            <a href="#">Shipping</a>
            <a href="#">Returns</a>
            <a href="#">FAQ</a>
            <a href="#">Help Center</a>
          </div>

          <div className="footer-column">
            <h4>CORPORATE</h4>
            <a href="#">Corporate Solutions</a>
            <a href="#">Bulk Orders</a>
            <a href="#">Exhibitions</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} TIA Creations. All Rights Reserved.</p>
        <p className="made-with-love">
          Made with <Heart size={13} className="heart-icon" /> for Art Lovers
        </p>
      </div>
    </footer>
  );
};

export default Footer;
