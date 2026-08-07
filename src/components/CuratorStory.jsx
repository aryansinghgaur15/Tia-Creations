import React from 'react';
import { motion } from 'framer-motion';
import './CuratorStory.css';

const CuratorStory = () => {
  return (
    <section className="curator-story-section">
      <div className="curator-story-container">
        <motion.div
          className="curator-left"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="curator-image-wrapper">
            <img src="/curator-tia.png" alt="TIA — Founder & Chief Curator" className="curator-image" />
          </div>
        </motion.div>

        <motion.div
          className="curator-right"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <p className="curator-note-label">CURATOR'S NOTE</p>
          <h2 className="curator-quote">
            "Art is not decoration. It is emotion, connection and a sense of belonging."
          </h2>
          <p className="curator-desc">
            At TIA Creations, we curate more than art. We curate stories, expressions and visions that inspire and transform.
          </p>

          <div className="curator-signature">
            <span className="signature-name">TIA</span>
            <span className="signature-title">Founder & Chief Curator</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CuratorStory;
