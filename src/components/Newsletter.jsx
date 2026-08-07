import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Compass, Star, Gift, CheckCircle, Users } from 'lucide-react';
import './Newsletter.css';

const COLLECTOR_NAMES = [
  'Priya from Mumbai', 'Rajiv from Delhi', 'Ananya from Kolkata',
  'Vikram from Jaipur', 'Neha from Bangalore', 'Rhea from Chennai',
  'Arjun from Pune', 'Kavita from Hyderabad', 'Rahul from Ahmedabad',
];

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [collectorCount, setCollectorCount] = useState(12847);
  const [currentCollector, setCurrentCollector] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCollector((prev) => (prev + 1) % COLLECTOR_NAMES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCollectorCount((prev) => prev + Math.floor(Math.random() * 3));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.includes('@') || !email.includes('.')) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 600);
      return;
    }
    setStatus('success');
  };

  return (
    <section className="newsletter-section">
      <div className="newsletter-container">
        <div className="newsletter-content">
          <motion.h2
            className="newsletter-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            JOIN THE COLLECTOR'S CIRCLE
          </motion.h2>
          <motion.p
            className="newsletter-desc"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Get early access to new releases, curator picks, artist stories and exclusive offers.
          </motion.p>

          <div className="newsletter-live-count">
            <Users size={14} />
            <span>{collectorCount.toLocaleString()} collectors subscribed</span>
          </div>

          <div style={{ position: 'relative', minHeight: '60px', width: '100%' }}>
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="newsletter-success"
                >
                  <CheckCircle size={24} color="var(--luxury-gold)" />
                  <span>Welcome to the Circle.</span>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  className="newsletter-form"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  animate={status === 'error' ? { x: [-10, 10, -10, 10, 0] } : {}}
                  onSubmit={handleSubmit}
                >
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className={`newsletter-input ${status === 'error' ? 'input-error' : ''}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button type="submit" className="btn-primary">JOIN NOW</button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="newsletter-benefits">
          <div className="benefit-item">
            <Star size={24} color="#C6A46A" />
            <span>EXCLUSIVE PREVIEWS</span>
          </div>
          <div className="benefit-item">
            <Compass size={24} color="#C6A46A" />
            <span>CURATOR INSIGHTS</span>
          </div>
          <div className="benefit-item">
            <Mail size={24} color="#C6A46A" />
            <span>ART WORLD STORIES</span>
          </div>
          <div className="benefit-item">
            <Gift size={24} color="#C6A46A" />
            <span>SPECIAL OFFERS</span>
          </div>
        </div>

        <div className="newsletter-collector-toast">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCollector}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="collector-toast-content"
            >
              <span className="collector-toast-dot" />
              <span>{COLLECTOR_NAMES[currentCollector]} just joined the circle</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
