import React from 'react';
import './SkeletonCard.css';

const ORIENTATIONS = ['vertical', 'horizontal', 'square', 'vertical', 'horizontal'];

const SkeletonCard = ({ index = 0 }) => {
  const orient = ORIENTATIONS[index % ORIENTATIONS.length];

  return (
    <div className={`skeleton-card skeleton-card--${orient}`} style={{ animationDelay: `${index * 0.08}s` }}>
      <div className={`skeleton-card__img skeleton-card__img--${orient} skeleton-pulse`} />
      <div className="skeleton-card__body">
        <div className="skeleton-card__artist-row">
          <div className="skeleton-card__avatar skeleton-pulse" />
          <div className="skeleton-card__artist-text skeleton-pulse" />
        </div>
        <div className="skeleton-card__title skeleton-pulse" />
        <div className="skeleton-card__subtitle skeleton-pulse" />
        <div className="skeleton-card__tags">
          <div className="skeleton-card__tag skeleton-pulse" />
          <div className="skeleton-card__tag skeleton-pulse" />
        </div>
        <div className="skeleton-card__bottom">
          <div className="skeleton-card__price skeleton-pulse" />
          <div className="skeleton-card__action skeleton-pulse" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
