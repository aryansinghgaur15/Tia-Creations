import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Heart, Users, Globe2, Sparkles } from 'lucide-react';
import './Impact.css';

const AnimatedNumber = ({ value, duration = 1500 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  
  // Extract number and suffix/prefix
  const parseValue = (val) => {
    const cleanStr = val.replace(/,/g, '');
    const numMatch = cleanStr.match(/\d+/);
    const num = numMatch ? parseInt(numMatch[0], 10) : 0;
    const prefix = val.startsWith('₹') ? '₹' : '';
    const suffix = val.includes('+') ? '+' : '';
    return { num, prefix, suffix };
  };

  const { num, prefix, suffix } = parseValue(value);

  useEffect(() => {
    if (!isInView) return;
    
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = progress * (2 - progress); // easeOutQuad
      
      setCount(Math.floor(easedProgress * num));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [isInView, num, duration]);

  const formatNumber = (n) => {
    if (prefix === '₹') {
      return n.toLocaleString('en-IN');
    }
    return n.toLocaleString('en-US');
  };

  return (
    <span ref={ref}>
      {prefix}{formatNumber(count)}{suffix}
    </span>
  );
};

const Impact = () => {
  const metrics = [
    { 
      icon: <Sparkles size={24} />, 
      value: "₹12,50,000+", 
      label: "IMPACT CREATED",
      subtitle: "Your purchase creates impact."
    },
    { 
      icon: <Users size={24} />, 
      value: "200+", 
      label: "ARTISTS SUPPORTED",
      subtitle: "A portion of every purchase supports meaningful causes like education, environment and community development."
    },
    { 
      icon: <Globe2 size={24} />, 
      value: "75+", 
      label: "CAUSES SUPPORTED",
      subtitle: "Empowering grassroots organizations and environmental conservation initiatives globally."
    },
    { 
      icon: <Heart size={24} />, 
      value: "1,500+", 
      label: "LIVES TOUCHED",
      subtitle: "Directly improving livelihoods, providing educational resources, and restoring ecosystems."
    }
  ];

  return (
    <section className="impact-section">
      <div className="impact-container">
        <div className="impact-grid">
          {metrics.map((metric, index) => (
            <div className="metric-box" key={index}>
              <div className="metric-icon">
                {metric.icon}
              </div>
              <div className="metric-details">
                <h4 className="metric-value">
                  <AnimatedNumber value={metric.value} />
                </h4>
                <p className="metric-label">{metric.label}</p>
              </div>
              <div className="metric-tooltip">
                {metric.subtitle}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Impact;
