import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, RotateCcw, Droplet, Compass, Leaf, Lightbulb, Diamond, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import './ArtQuiz.css';

const QUESTIONS = [
  {
    question: 'Which color palette speaks to you?',
    options: [
      { label: 'Warm earth tones', icon: '🏜️', style: 'Traditional' },
      { label: 'Bold & vibrant', icon: '🔥', style: 'Abstract' },
      { label: 'Cool & muted', icon: '🌊', style: 'Contemporary' },
      { label: 'Monochrome', icon: '⚫', style: 'Minimalist' },
    ],
  },
  {
    question: 'Where will this artwork live?',
    options: [
      { label: 'Living room focal point', icon: '🛋️', style: 'Bold' },
      { label: 'Bedroom sanctuary', icon: '🛏️', style: 'Calm' },
      { label: 'Home office', icon: '💼', style: 'Modern' },
      { label: 'Entryway / hallway', icon: '🚪', style: 'Statement' },
    ],
  },
  {
    question: 'What feeling do you want the art to evoke?',
    options: [
      { label: 'Peace & tranquility', icon: '🕊️', style: 'Traditional' },
      { label: 'Energy & excitement', icon: '⚡', style: 'Abstract' },
      { label: 'Sophistication', icon: '✨', style: 'Contemporary' },
      { label: 'Wonder & curiosity', icon: '🔮', style: 'Modern' },
    ],
  },
  {
    question: 'Which art form intrigues you most?',
    options: [
      { label: 'Paintings on canvas', icon: '🎨', medium: 'Oil' },
      { label: 'Photography', icon: '📷', medium: 'Photography' },
      { label: 'Sculptures & 3D', icon: '🗿', medium: 'Sculpture' },
      { label: 'Digital & mixed media', icon: '💻', medium: 'Mixed Media' },
    ],
  },
  {
    question: 'What\'s your budget range?',
    options: [
      { label: 'Under ₹5,000', icon: '💰', price: 'Under ₹5,000' },
      { label: '₹5,000 – 20,000', icon: '💎', price: '₹5,000 – 20,000' },
      { label: '₹20,000 – 50,000', icon: '👑', price: '₹20,000 – 50,000' },
      { label: 'Premium', icon: '🏆', price: 'Premium' },
    ],
  },
];

const RESULTS = {
  Traditional: {
    title: 'The Classic Connoisseur',
    description: 'You appreciate timeless beauty and cultural heritage. Your taste leans towards rich textures, classical compositions, and art that tells a story spanning generations.',
    icon: <Globe size={32} />,
    color: '#8B6914',
    shopStyle: 'Traditional',
  },
  Abstract: {
    title: 'The Bold Visionary',
    description: 'You are drawn to art that challenges perception and stirs emotion. Vibrant colors, dynamic compositions, and expressive brushwork speak to your adventurous spirit.',
    icon: <Compass size={32} />,
    color: '#D62828',
    shopStyle: 'Abstract',
  },
  Contemporary: {
    title: 'The Modern Aesthete',
    description: 'You value sophistication with a contemporary edge. Clean lines, thoughtful concepts, and refined palettes define your impeccable taste in modern art.',
    icon: <Diamond size={32} />,
    color: '#2D6A4F',
    shopStyle: 'Contemporary',
  },
  Minimalist: {
    title: 'The Refined Minimalist',
    description: 'Less is more for you. You appreciate the power of negative space, subtle tones, and art that whispers rather than shouts — creating calm in your world.',
    icon: <Droplet size={32} />,
    color: '#4A4A4A',
    shopStyle: 'Minimalist',
  },
  Modern: {
    title: 'The Contemporary Explorer',
    description: 'You embrace art that pushes boundaries. Digital innovation, mixed media experimentation, and unconventional perspectives fuel your creative curiosity.',
    icon: <Lightbulb size={32} />,
    color: '#6B4FA0',
    shopStyle: 'Modern',
  },
  Bold: {
    title: 'The Statement Collector',
    description: 'You want art that commands attention. Large-scale pieces, striking contrasts, and conversation starters define your fearless approach to collecting.',
    icon: <Leaf size={32} />,
    color: '#B88945',
    shopStyle: 'Abstract',
  },
  default: {
    title: 'The Curious Collector',
    description: 'Your taste is uniquely yours. You appreciate art across styles and are driven by personal connection rather than trends.',
    icon: <Compass size={32} />,
    color: '#B88945',
    shopStyle: 'Contemporary',
  },
};

const ArtQuiz = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [started, setStarted] = useState(false);

  const handleAnswer = (option) => {
    const newAnswers = [...answers, option];
    setAnswers(newAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const styleCount = {};
      newAnswers.forEach((a) => {
        const key = a.style || a.medium || 'default';
        styleCount[key] = (styleCount[key] || 0) + 1;
      });
      const topStyle = Object.entries(styleCount).sort((a, b) => b[1] - a[1])[0][0];
      setResult(RESULTS[topStyle] || RESULTS.default);
    }
  };

  const restart = () => {
    setCurrentStep(0);
    setAnswers([]);
    setResult(null);
    setStarted(false);
  };

  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  return (
    <section className="art-quiz-section" id="art-quiz">
      <div className="art-quiz-container">
        <div className="quiz-left">
          <motion.h2
            className="quiz-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            WHAT KIND OF<br />
            COLLECTOR ARE YOU?
          </motion.h2>
          <motion.p
            className="quiz-desc"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Take our 2-minute personality quiz and discover artworks that truly match your taste and style.
          </motion.p>

          {!started && !result && (
            <motion.button
              className="btn-primary quiz-btn"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              onClick={() => setStarted(true)}
            >
              TAKE THE QUIZ
            </motion.button>
          )}

          <motion.div
            className="quiz-social-proof"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            <div className="avatar-group">
              <div className="avatar"></div>
              <div className="avatar"></div>
              <div className="avatar"></div>
              <div className="avatar"></div>
            </div>
            <p><strong>8,500+ collectors</strong><br />already discovered their style</p>
          </motion.div>
        </div>

        <div className="quiz-right">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                className="quiz-result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="result-icon" style={{ color: result.color }}>{result.icon}</div>
                <h3 className="result-title">{result.title}</h3>
                <p className="result-desc">{result.description}</p>
                <div className="result-actions">
                  <Link to={`/shop?style=${result.shopStyle}`} className="btn-primary">
                    EXPLORE {result.shopStyle.toUpperCase()} ART <ArrowRight size={14} />
                  </Link>
                  <button className="btn-ghost" onClick={restart}>
                    <RotateCcw size={14} /> RETAKE QUIZ
                  </button>
                </div>
              </motion.div>
            ) : started ? (
              <motion.div
                key={`step-${currentStep}`}
                className="quiz-step"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="quiz-progress">
                  <div className="quiz-progress__bar">
                    <motion.div
                      className="quiz-progress__fill"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                    />
                  </div>
                  <span className="quiz-progress__text">
                    {currentStep + 1} / {QUESTIONS.length}
                  </span>
                </div>

                <h3 className="quiz-question">{QUESTIONS[currentStep].question}</h3>

                <div className="quiz-options">
                  {QUESTIONS[currentStep].options.map((option, i) => (
                    <motion.button
                      key={i}
                      className="quiz-option"
                      onClick={() => handleAnswer(option)}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.3 }}
                      whileHover={{ scale: 1.02, borderColor: 'var(--gold)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="quiz-option__icon">{option.icon}</span>
                      <span className="quiz-option__label">{option.label}</span>
                      <ArrowRight size={16} className="quiz-option__arrow" />
                    </motion.button>
                  ))}
                </div>

                {currentStep > 0 && (
                  <button className="quiz-back" onClick={() => setCurrentStep(currentStep - 1)}>
                    <ArrowLeft size={14} /> Back
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="intro"
                className="quiz-types-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {[
                  { icon: <Droplet size={24} />, name: 'MINIMALIST', desc: 'Simplicity is your language' },
                  { icon: <Compass size={24} />, name: 'BOLD EXPLORER', desc: 'You love statement pieces' },
                  { icon: <Leaf size={24} />, name: 'NATURE LOVER', desc: 'Inspired by nature and landscapes' },
                  { icon: <Lightbulb size={24} />, name: 'CONTEMPORARY', desc: 'You appreciate modern vision' },
                  { icon: <Diamond size={24} />, name: 'LUXURY', desc: 'You value timeless elegance' },
                  { icon: <Globe size={24} />, name: 'CULTURAL', desc: 'You cherish heritage & stories' },
                ].map((type, index) => (
                  <motion.div
                    className="quiz-type-card"
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    whileHover={{ y: -5, borderColor: 'var(--gold)' }}
                  >
                    <div className="type-icon">{type.icon}</div>
                    <h4 className="type-name">{type.name}</h4>
                    <p className="type-desc">{type.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default ArtQuiz;
