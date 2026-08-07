import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Check, ShoppingCart, ArrowRight, Star, Share2, Truck, Shield, Eye } from 'lucide-react';
import './QuickViewModal.css';

const QuickViewModal = ({ artwork, onClose }) => {
  const [liked, setLiked] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <AnimatePresence>
      {artwork && (
        <motion.div
          className="qv-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            className="qv-modal"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="qv-close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>

            <div className="qv-content">
              <div className="qv-image-col">
                <div className="qv-image-wrap">
                  {!imgLoaded && <div className="qv-image-skeleton" />}
                  <img
                    src={artwork.image}
                    alt={artwork.name}
                    className={`qv-image ${imgLoaded ? 'qv-image--loaded' : ''}`}
                    onLoad={() => setImgLoaded(true)}
                  />
                  {artwork.badge && <span className="qv-badge">{artwork.badge}</span>}
                  <button className="qv-image-share" aria-label="Share">
                    <Share2 size={14} />
                  </button>
                </div>
              </div>

              <div className="qv-info-col">
                <div className="qv-artist-row">
                  {artwork.artistAvatar ? (
                    <img src={artwork.artistAvatar} alt="" className="qv-artist-avatar" />
                  ) : (
                    <div className="qv-artist-avatar qv-artist-avatar--placeholder">{artwork.artist?.charAt(0)}</div>
                  )}
                  <div className="qv-artist-info">
                    <span className="qv-artist-name">
                      {artwork.artist}
                      {artwork.verified && (
                        <span className="qv-verified"><Check size={9} strokeWidth={3} /></span>
                      )}
                    </span>
                    <span className="qv-artist-sub">Verified Artist</span>
                  </div>
                </div>

                <h2 className="qv-title">{artwork.name}</h2>

                <div className="qv-rating-row">
                  {artwork.rating && (
                    <div className="qv-rating">
                      <Star size={14} fill="var(--gold)" stroke="none" />
                      <span>{artwork.rating}</span>
                      {artwork.reviews && <span className="qv-reviews">({artwork.reviews} reviews)</span>}
                    </div>
                  )}
                </div>

                <div className="qv-divider" />

                <div className="qv-pricing">
                  <span className="qv-price">{artwork.price}</span>
                  {artwork.originalPrice && (
                    <span className="qv-original-price">{artwork.originalPrice}</span>
                  )}
                </div>

                <div className="qv-tags">
                  {artwork.style && <span className="qv-tag qv-tag--gold">{artwork.style}</span>}
                  {artwork.medium && <span className="qv-tag">{artwork.medium}</span>}
                  {artwork.dimensions && <span className="qv-tag">{artwork.dimensions}</span>}
                  {artwork.orientation && <span className="qv-tag">{artwork.orientation}</span>}
                </div>

                <p className="qv-description">
                  {artwork.description || 'A stunning original artwork, carefully curated and authenticated. Each piece comes with a certificate of authenticity and premium packaging.'}
                </p>

                <div className="qv-details">
                  {artwork.year && <div className="qv-detail"><span>Year</span><span>{artwork.year}</span></div>}
                  {artwork.medium && <div className="qv-detail"><span>Medium</span><span>{artwork.medium}</span></div>}
                  {artwork.dimensions && <div className="qv-detail"><span>Dimensions</span><span>{artwork.dimensions}</span></div>}
                  {artwork.size && <div className="qv-detail"><span>Size</span><span>{artwork.size}</span></div>}
                </div>

                <div className="qv-actions">
                  <button className="qv-btn-main">
                    <ShoppingCart size={16} />
                    ADD TO CART
                  </button>
                  <button
                    className={`qv-btn-wishlist ${liked ? 'qv-btn-wishlist--on' : ''}`}
                    onClick={() => setLiked(!liked)}
                  >
                    <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
                    {liked ? 'WISHLISTED' : 'WISHLIST'}
                  </button>
                </div>

                <div className="qv-perks">
                  {artwork.freeShipping && (
                    <span className="qv-perk"><Truck size={12} /> Free Shipping</span>
                  )}
                  {artwork.certificate && (
                    <span className="qv-perk"><Shield size={12} /> Certificate Included</span>
                  )}
                  <span className="qv-perk"><Eye size={12} /> 7-Day Returns</span>
                </div>

                <button className="qv-full-link">
                  VIEW FULL DETAILS <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuickViewModal;
