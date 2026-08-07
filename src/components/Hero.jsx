import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Hero.css';

const useCountUp = (end, duration = 2000, start = 0) => {
  const [count, setCount] = useState(start);

  useEffect(() => {
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      const easeOut = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      setCount(Math.floor(start + (end - start) * easeOut));
      if (percentage < 1) requestAnimationFrame(animate);
    };
    const timer = setTimeout(() => requestAnimationFrame(animate), 500);
    return () => clearTimeout(timer);
  }, [end, duration, start]);

  return count;
};

const StatItem = ({ label, value, suffix = "", isRating = false }) => {
  const count = useCountUp(value);
  return (
    <div className="stat-item-glass">
      <span className="stat-num-glass">{count.toLocaleString()}{suffix}</span>
      <span className="stat-label-glass">{label}</span>
      {isRating && (
        <div className="glass-rating">
          <Star size={10} /><Star size={10} /><Star size={10} /><Star size={10} /><Star size={10} />
          <span className="glass-rating-text">5.0</span>
        </div>
      )}
    </div>
  );
};

const SplitText = ({ text, className, delay = 0 }) => {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((word, wi) => (
        <span key={wi} style={{ display: 'inline-block', overflow: 'hidden' }}>
          {word.split('').map((char, ci) => (
            <motion.span
              key={ci}
              style={{ display: 'inline-block' }}
              initial={{ y: '110%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.5,
                delay: delay + wi * 0.08 + ci * 0.03,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {char}
            </motion.span>
          ))}
          {wi < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </span>
  );
};

const MagneticButton = ({ children, className, to, href, ...props }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    setPosition({ x: (clientX - centerX) * 0.15, y: (clientY - centerY) * 0.15 });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  const Tag = to ? Link : 'a';
  const linkProps = to ? { to } : { href };

  return (
    <motion.div
      ref={ref}
      style={{ display: 'inline-block' }}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Tag {...linkProps} className={className} {...props}>
        {children}
      </Tag>
    </motion.div>
  );
};

const TrustLogos = () => (
  <div className="hero__trust-strip">
    <div className="hero__trust-strip-inner">
      <span className="hero__trust-label">TRUSTED BY</span>
      <div className="hero__trust-logos">
        <svg className="hero__trust-logo" width="70" height="20" viewBox="0 0 100 24" fill="currentColor">
          <text x="0" y="18" fontFamily="var(--font-heading)" fontSize="20" fontWeight="600" letterSpacing="1">Forbes</text>
        </svg>
        <svg className="hero__trust-logo" width="70" height="20" viewBox="0 0 100 24" fill="currentColor">
          <text x="0" y="18" fontFamily="var(--font-heading)" fontSize="20" fontWeight="400" letterSpacing="2">VOGUE</text>
        </svg>
        <svg className="hero__trust-logo" width="160" height="20" viewBox="0 0 180 24" fill="currentColor">
          <text x="0" y="18" fontFamily="var(--font-body)" fontSize="14" fontWeight="500" letterSpacing="1">ARCHITECTURAL DIGEST</text>
        </svg>
        <svg className="hero__trust-logo" width="80" height="20" viewBox="0 0 100 24" fill="currentColor">
          <text x="0" y="18" fontFamily="var(--font-heading)" fontSize="18" fontWeight="600">THE HINDU</text>
        </svg>
      </div>
    </div>
  </div>
);

const Hero = () => {
  const { scrollY } = useScroll();
  const yMaster = useTransform(scrollY, [0, 500], [0, -40]);
  const yBg1 = useTransform(scrollY, [0, 500], [0, -20]);
  const yBg2 = useTransform(scrollY, [0, 500], [0, -80]);
  const trackY = useTransform(scrollY, [0, 300], [0, 48]);
  const smoothTrackY = useSpring(trackY, { stiffness: 400, damping: 90 });

  return (
    <section className="hero">
      <div className="hero__grain" />
      <div className="hero-main">
        <div className="hero__left">
          <motion.div
            className="hero__eyebrow"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            CURATED FINE ART <span className="hero__eyebrow-dot" />
          </motion.div>

          <h1 className="hero__headline">
            <SplitText text="Invest in" className="" delay={0.15} />
            <br />
            <SplitText text="Timeless" className="hero__headline-em" delay={0.4} />
            <br />
            <SplitText text="Beauty" className="" delay={0.6} />
          </h1>

          <motion.p
            className="hero__subheading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            Discover authenticated masterpieces from emerging and established artists. Bring museum-quality art directly into your private collection.
          </motion.p>

          <motion.p
            className="hero__micro-cta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            Free shipping on orders over ₹10,000
          </motion.p>

          <motion.div
            className="hero__ctas"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
          >
            <MagneticButton to="/shop" className="sell-art-btn">
              <span>EXPLORE COLLECTION</span>
            </MagneticButton>
            <MagneticButton to="/artists" className="btn-secondary">
              <span>MEET ARTISTS</span>
            </MagneticButton>
          </motion.div>
        </div>

        <div className="hero__right">
          <div className="hero__artwork-stack">
            <motion.div
              className="artwork-frame artwork-frame--bg-1"
              initial={{ opacity: 0, x: 20, y: 20, rotate: 2 }}
              animate={{ opacity: 0.9, x: 0, y: 0, rotate: 4 }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ y: yBg1 }}
            >
              <div className="artwork-image-wrap">
                <img src="https://images.unsplash.com/photo-1544413660-299165566b1d?auto=format&fit=crop&w=600&q=80" alt="Abstract sculpture" className="artwork-img" />
              </div>
            </motion.div>

            <motion.div
              className="artwork-frame artwork-frame--bg-2"
              initial={{ opacity: 0, x: -20, y: -20, rotate: -3 }}
              animate={{ opacity: 0.85, x: 0, y: 0, rotate: -5 }}
              transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ y: yBg2 }}
            >
              <div className="artwork-image-wrap">
                <img src="https://images.unsplash.com/photo-1579762593175-20226054cad0?auto=format&fit=crop&w=600&q=80" alt="Classical painting detail" className="artwork-img" />
              </div>
            </motion.div>

            <motion.div
              className="artwork-frame artwork-frame--main"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ y: yMaster }}
            >
              <div className="artwork-image-wrap">
                <img src="https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?auto=format&fit=crop&w=800&q=80" alt="Featured Masterpiece" className="artwork-img" />
              </div>
            </motion.div>
          </div>

          <motion.div
            className="hero__glass-stats"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <StatItem label="Verified Artists" value={380} suffix="+" />
            <StatItem label="Original Artworks" value={15000} suffix="+" />
            <StatItem label="Collectors" value={8500} suffix="+" />
            <StatItem label="Collector Rating" value={5} isRating={true} />
          </motion.div>
        </div>

        <motion.div
          className="hero__scroll"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.6 }}
        >
          <span className="hero__scroll-text">SCROLL</span>
          <div className="hero__scroll-track">
            <motion.div className="hero__scroll-thumb" style={{ y: smoothTrackY }} />
          </div>
        </motion.div>
      </div>
      <TrustLogos />
    </section>
  );
};

export default Hero;
