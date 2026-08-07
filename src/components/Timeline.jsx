import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import './Timeline.css';

const Timeline = () => {
  const steps = [
    { id: "01", title: "INSPIRATION", desc: "Ideas born from life", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=400&q=80" },
    { id: "02", title: "SKETCH", desc: "Concepts take shape", image: "https://images.unsplash.com/photo-1544413660-299165566b1d?auto=format&fit=crop&w=400&q=80" },
    { id: "03", title: "CREATION", desc: "Artwork comes to life", image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=400&q=80" },
    { id: "04", title: "FINISHING", desc: "Details that bring the soul out", image: "https://images.unsplash.com/photo-1579762593175-20226054cad0?auto=format&fit=crop&w=400&q=80" },
    { id: "05", title: "AUTHENTICATION", desc: "Certificate signed", image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=400&q=80" },
    { id: "06", title: "EXHIBITION", desc: "Showcasing to the world", image: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=400&q=80" },
    { id: "07", title: "ACQUISITION", desc: "Finding its rightful owner", image: "https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?auto=format&fit=crop&w=400&q=80" },
    { id: "08", title: "COLLECTOR'S HOME", desc: "Made for your space", image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=400&q=80" },
  ];

  const duplicatedSteps = [...steps, ...steps];
  const carouselRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      const progress = (scrollLeft / (scrollWidth - clientWidth)) * 100;
      setScrollProgress(progress || 0);
    }
  };

  const handleSliderChange = (e) => {
    const progress = parseFloat(e.target.value);
    setScrollProgress(progress);
    if (carouselRef.current) {
      const { scrollWidth, clientWidth } = carouselRef.current;
      carouselRef.current.scrollLeft = (progress / 100) * (scrollWidth - clientWidth);
    }
  };

  useEffect(() => {
    let animationFrameId;
    let isInteracting = false;

    const scroll = () => {
      if (carouselRef.current && !isInteracting) {
        carouselRef.current.scrollLeft += 1;
        // Since array is duplicated, when we scroll past the first set, snap back to 0
        if (carouselRef.current.scrollLeft >= carouselRef.current.scrollWidth / 2) {
          carouselRef.current.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    const container = carouselRef.current;
    
    const handleInteractionStart = () => isInteracting = true;
    const handleInteractionEnd = () => isInteracting = false;

    if (container) {
      container.addEventListener('mouseenter', handleInteractionStart);
      container.addEventListener('mouseleave', handleInteractionEnd);
      container.addEventListener('touchstart', handleInteractionStart);
      container.addEventListener('touchend', handleInteractionEnd);
      container.addEventListener('mousedown', handleInteractionStart);
      container.addEventListener('mouseup', handleInteractionEnd);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (container) {
        container.removeEventListener('mouseenter', handleInteractionStart);
        container.removeEventListener('mouseleave', handleInteractionEnd);
        container.removeEventListener('touchstart', handleInteractionStart);
        container.removeEventListener('touchend', handleInteractionEnd);
        container.removeEventListener('mousedown', handleInteractionStart);
        container.removeEventListener('mouseup', handleInteractionEnd);
      }
    };
  }, []);  return (
    <section className="timeline-section">
      <div className="timeline-container">
        <div className="timeline-header">
          <h2 className="timeline-title">FROM STUDIO TO YOUR WALL</h2>
          <p className="timeline-desc">Every brushstroke is a journey. Explore the process behind the masterpiece you love.</p>
        </div>
        
        <div className="timeline-carousel-container" ref={carouselRef} onScroll={handleScroll}>
          <div className="timeline-track">
          <div className="timeline-thread"></div>
          {duplicatedSteps.map((step, index) => (
            <React.Fragment key={index}>
              <motion.div 
                className={`timeline-step ${hoveredIndex !== null && hoveredIndex !== index ? 'dimmed' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="watermark-id">{step.id}</div>
                <div className="step-image-wrapper">
                  <img src={step.image} alt={step.title} />
                </div>
                <div className="step-content">
                  <h4 className="step-title">{step.title}</h4>
                  <p className="step-desc">{step.desc}</p>
                </div>
              </motion.div>
            </React.Fragment>
          ))}
          </div>
        </div>

        <div className="custom-scrollbar-wrapper">
          <span className="scroll-label">DRAG TO EXPLORE</span>
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="0.1"
            value={scrollProgress} 
            onChange={handleSliderChange}
            className="luxury-slider"
            onMouseEnter={() => setHoveredIndex(999)} // Use 999 to dim all cards when using slider
            onMouseLeave={() => setHoveredIndex(null)}
            onTouchStart={() => setHoveredIndex(999)}
            onTouchEnd={() => setHoveredIndex(null)}
            onMouseDown={() => setHoveredIndex(999)}
            onMouseUp={() => setHoveredIndex(null)}
          />
        </div>
      </div>
    </section>
  );
};

export default Timeline;
