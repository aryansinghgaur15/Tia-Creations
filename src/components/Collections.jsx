import React, { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import './Collections.css';

const TiltCard = ({ collection, index }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });

  const handleMouse = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(px);
    y.set(py);
  };

  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      className={`collection-card ${collection.trending ? 'collection-card--trending' : ''}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay: index * 0.07 }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
    >
      <Link to="/shop" className="collection-card-link">
        <div className="collection-image-wrapper">
          <img src={collection.image} alt={collection.title} className="collection-image" loading="lazy" />
          <div className="collection-overlay" />
          <div className="collection-border" />
          {collection.trending && <span className="collection-badge">TRENDING</span>}
        </div>
        <div className="collection-info">
          <div className="collection-info-text">
            <h3 className="collection-title">{collection.title}</h3>
            <p className="collection-count">{collection.count}</p>
            <p className="collection-price">{collection.price}</p>
          </div>
          <button className="collection-btn" tabIndex={-1}>
            <ArrowRight size={18} />
          </button>
        </div>
      </Link>
    </motion.div>
  );
};

const Collections = () => {
  const collections = [
    { title: "ABSTRACT", count: "1,250 Artworks", price: "From ₹2,500", image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=600&q=80", trending: true },
    { title: "NATURE", count: "1,100 Artworks", price: "From ₹2,000", image: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=600&q=80" },
    { title: "SPIRITUAL", count: "880 Artworks", price: "From ₹3,000", image: "https://images.unsplash.com/photo-1590055531615-f16d36ffe8ea?auto=format&fit=crop&w=600&q=80" },
    { title: "PORTRAITS", count: "950 Artworks", price: "From ₹2,800", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80" },
    { title: "CONTEMPORARY", count: "2,100 Artworks", price: "From ₹3,500", image: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=600&q=80", trending: true },
    { title: "MINIMALIST", count: "670 Artworks", price: "From ₹2,200", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80" },
    { title: "SCULPTURES", count: "320 Artworks", price: "From ₹5,500", image: "https://images.unsplash.com/photo-1544413660-299165566b1d?auto=format&fit=crop&w=600&q=80" },
    { title: "PHOTOGRAPHY", count: "1,540 Artworks", price: "From ₹1,800", image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80", trending: true },
    { title: "MIXED MEDIA", count: "430 Artworks", price: "From ₹4,000", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80" },
  ];

  return (
    <section className="collections-section">
      <div className="collections-header">
        <h2 className="section-title">EXPLORE COLLECTIONS</h2>
        <Link to="/shop" className="view-all-link">
          VIEW ALL COLLECTIONS <ArrowRight size={16} />
        </Link>
      </div>
      <div className="collections-grid">
        {collections.map((collection, index) => (
          <TiltCard key={index} collection={collection} index={index} />
        ))}
      </div>
    </section>
  );
};

export default Collections;
