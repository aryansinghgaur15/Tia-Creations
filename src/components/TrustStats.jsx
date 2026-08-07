import React from 'react';
import { Image, Users, LayoutGrid, Truck, ShieldCheck, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import './TrustStats.css';

const TrustStats = () => {
  const stats = [
    { icon: <Image size={24} />, value: "15,000+", label: "ARTWORKS" },
    { icon: <Users size={24} />, value: "3,000+", label: "ARTISTS" },
    { icon: <LayoutGrid size={24} />, value: "50+", label: "CATEGORIES" },
    { icon: <Truck size={24} />, value: "WORLDWIDE", label: "DELIVERY" },
    { icon: <ShieldCheck size={24} />, value: "100%", label: "AUTHENTIC ART" },
    { icon: <Lock size={24} />, value: "SECURE", label: "PAYMENTS" },
  ];

  return (
    <section className="trust-stats-section">
      <div className="trust-stats-container">
        {stats.map((stat, index) => (
          <motion.div 
            className="stat-item"
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-text">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default TrustStats;
