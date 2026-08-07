import React, { useState, useEffect } from 'react';
import { Star, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Testimonials.css';

const REVIEWS = [
  { name: "Priya Sharma", city: "Mumbai", text: "The painting transformed my living room completely. It's an absolute masterpiece.", rating: 5, initials: "PS", color: "#B88945" },
  { name: "Rajiv Mehta", city: "New Delhi", text: "Exceptional quality and authenticity. Highly recommended! The delivery was seamless.", rating: 5, initials: "RM", color: "#2D6A4F" },
  { name: "Neha Kapoor", city: "Bangalore", text: "Beautiful collection and outstanding customer experience. Will buy again.", rating: 5, initials: "NK", color: "#6B4FA0" },
  { name: "Vikram Singh", city: "Jaipur", text: "TIA Creations made buying art online so easy. The curation is truly world-class.", rating: 5, initials: "VS", color: "#D62828" },
  { name: "Ananya Das", city: "Kolkata", text: "The artist's story behind the piece made it even more special. Love my purchase.", rating: 5, initials: "AD", color: "#4A4A4A" },
  { name: "Rhea Nair", city: "Chennai", text: "Investment-grade art with museum-quality presentation. Couldn't be happier.", rating: 5, initials: "RN", color: "#8B6914" },
];

const RECENT = [
  { id: 1, title: "Golden Gates", location: "Bangalore", time: "Collected 2 hrs ago", image: "https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?auto=format&fit=crop&w=200&q=80" },
  { id: 2, title: "The Wanderer", location: "Mumbai", time: "Collected 5 hrs ago", image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=200&q=80" },
  { id: 3, title: "Abstract Soul", location: "Hyderabad", time: "Collected 8 hrs ago", image: "https://images.unsplash.com/photo-1579762715111-42f40c7f422a?auto=format&fit=crop&w=200&q=80" },
  { id: 4, title: "Coastal Dreams", location: "Chennai", time: "Collected 12 hrs ago", image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=200&q=80" },
];

const Testimonials = () => {
  const [currentReview, setCurrentReview] = useState(0);
  const [items, setItems] = useState(RECENT);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % REVIEWS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) => {
        const newArr = [...prev];
        newArr.push(newArr.shift());
        return newArr;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const visibleReviews = [
    REVIEWS[currentReview],
    REVIEWS[(currentReview + 1) % REVIEWS.length],
    REVIEWS[(currentReview + 2) % REVIEWS.length],
  ];

  return (
    <section className="testimonials-section">
      <div className="testimonials-container">
        <div className="testimonials-col">
          <div className="section-header">
            <h2 className="section-title" style={{ color: 'var(--primary-bg)' }}>WHAT COLLECTORS SAY</h2>
            <a href="#" className="view-all-link" style={{ color: 'var(--primary-bg)' }}>
              VIEW ALL REVIEWS <ArrowRight size={16} />
            </a>
          </div>

          <p className="review-count-label">Based on 2,400+ verified reviews</p>

          <div className="reviews-carousel">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentReview}
                className="reviews-grid"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
              >
                {visibleReviews.map((review, i) => (
                  <div className="review-card" key={`${currentReview}-${i}`}>
                    <div className="review-card__header">
                      <div className="review-avatar" style={{ background: review.color }}>
                        {review.initials}
                      </div>
                      <div className="review-stars">
                        {[...Array(review.rating)].map((_, j) => (
                          <Star key={j} size={12} fill="#C6A46A" color="#C6A46A" />
                        ))}
                      </div>
                    </div>
                    <p className="review-text">"{review.text}"</p>
                    <div className="review-author">
                      <p className="author-name">{review.name}</p>
                      <p className="author-city">{review.city}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>

            <div className="reviews-nav">
              <button
                className="reviews-nav-btn"
                onClick={() => setCurrentReview((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length)}
              >
                <ChevronLeft size={18} />
              </button>
              <div className="reviews-dots">
                {REVIEWS.map((_, i) => (
                  <button
                    key={i}
                    className={`reviews-dot ${i === currentReview ? 'reviews-dot--active' : ''}`}
                    onClick={() => setCurrentReview(i)}
                  />
                ))}
              </div>
              <button
                className="reviews-nav-btn"
                onClick={() => setCurrentReview((prev) => (prev + 1) % REVIEWS.length)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="recent-col">
          <div className="section-header">
            <h2 className="section-title" style={{ color: 'var(--primary-bg)' }}>RECENTLY COLLECTED</h2>
            <a href="#" className="view-all-link" style={{ color: 'var(--primary-bg)' }}>
              VIEW ALL <ArrowRight size={16} />
            </a>
          </div>

          <div className="recent-feed">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  layout
                  className="recent-card"
                  key={item.id}
                  initial={{ opacity: 0, y: 20, x: 40 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -40 }}
                  transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                >
                  <img src={item.image} alt={item.title} className="recent-image" />
                  <div className="recent-info">
                    <h4 className="recent-title">{item.title}</h4>
                    <p className="recent-time">{item.time}</p>
                    <p className="recent-location">{item.location}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
