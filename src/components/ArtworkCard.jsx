import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Eye, Star, Truck, Check } from 'lucide-react';
import './ArtworkCard.css';

const ArtworkCard = ({ artwork, index = 0, onQuickView, variant = 'grid' }) => {
  const [liked, setLiked] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const orient = (artwork.orientation || 'vertical').toLowerCase();

  return (
    <motion.article
      className={`awc awc--${variant}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.3), ease: [0.25, 1, 0.5, 1] }}
    >
      {/* ── Image ── */}
      <div className={`awc__img-wrap awc__img-wrap--${orient}`}>
        {!imgLoaded && <div className="awc__img-skeleton" />}
        <img
          src={artwork.image}
          alt={artwork.name}
          loading="lazy"
          width={orient === 'horizontal' ? 800 : 600}
          height={orient === 'horizontal' ? 600 : orient === 'square' ? 600 : 800}
          className={`awc__img ${imgLoaded ? 'awc__img--loaded' : ''}`}
          onLoad={() => setImgLoaded(true)}
        />
        <div className="awc__overlay">
          <button className="awc__quickview" onClick={() => onQuickView?.(artwork)}>
            <Eye size={15} />
            <span>Quick View</span>
          </button>
        </div>

        {artwork.badge && (
          <span className={`awc__badge awc__badge--${artwork.badge.toLowerCase().replace(/[^a-z]/g, '')}`}>
            {artwork.badge}
          </span>
        )}

        <button
          className={`awc__heart ${liked ? 'awc__heart--on' : ''}`}
          onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
          aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={17} fill={liked ? 'currentColor' : 'none'} />
        </button>

        {artwork.freeShipping && (
          <span className="awc__shipping">
            <Truck size={10} /> Free Shipping
          </span>
        )}
      </div>

      {/* ── Body ── */}
      <div className="awc__body">
        <div className="awc__artist-row">
          {artwork.artistAvatar ? (
            <img src={artwork.artistAvatar} alt="" className="awc__avatar" />
          ) : (
            <div className="awc__avatar awc__avatar--placeholder">
              {artwork.artist?.charAt(0)}
            </div>
          )}
          <div className="awc__artist-info">
            <span className="awc__artist-name">
              {artwork.artist}
              {artwork.verified && (
                <span className="awc__verified" title="Verified Artist">
                  <Check size={9} strokeWidth={3} />
                </span>
              )}
            </span>
            {artwork.medium && <span className="awc__medium">{artwork.medium}</span>}
          </div>
        </div>

        <h4 className="awc__title">{artwork.name}</h4>

        {artwork.dimensions && (
          <span className="awc__dims">{artwork.dimensions}</span>
        )}

        <div className="awc__meta">
          {artwork.rating && (
            <div className="awc__rating">
              <Star size={12} fill="var(--gold)" stroke="none" />
              <span>{artwork.rating}</span>
              {artwork.reviews && <span className="awc__reviews">({artwork.reviews})</span>}
            </div>
          )}
          <div className="awc__tags">
            {artwork.style && <span className="awc__tag awc__tag--style">{artwork.style}</span>}
            {artwork.certificate && <span className="awc__tag awc__tag--cert">Certified</span>}
          </div>
        </div>

        <div className="awc__bottom">
          <div className="awc__pricing">
            <span className="awc__price">{artwork.price}</span>
            {artwork.originalPrice && (
              <span className="awc__original-price">{artwork.originalPrice}</span>
            )}
          </div>
          <button className="awc__view-btn" onClick={() => onQuickView?.(artwork)}>
            View Details
          </button>
        </div>
      </div>
    </motion.article>
  );
};

export default ArtworkCard;
