import React from 'react';
import { motion } from 'framer-motion';
import { Scan } from 'lucide-react';
import './RoomPreview.css';

const RoomPreview = () => {
  return (
    <section className="room-preview-section">
      <div className="room-preview-container">
        <div className="room-preview-content">
          <h2 className="room-preview-title">VIEW IN YOUR ROOM</h2>
          <p className="room-preview-desc">See how artwork looks in your space using AI.</p>
          <button className="btn-primary" style={{marginTop: '24px'}}>TRY ROOM PREVIEW</button>
        </div>
        
        <motion.div 
          className="hotspot"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="hotspot-inner">
            <Scan size={16} color="var(--primary-bg)" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default RoomPreview;
