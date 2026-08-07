import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Pen, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.25, 1, 0.5, 1] },
  }),
};

const SignupPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!agreed) {
      setError('Please agree to the Terms & Conditions');
      return;
    }

    setLoading(true);
    try {
      await register({ email, password, fullName, displayName });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page signup-page">
      <motion.div
        className="login-left"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
      >
        <div className="login-left__bg">
          <img
            src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=80"
            alt=""
            aria-hidden="true"
          />
          <div className="login-left__overlay" />
        </div>

        <div className="login-left__content">
          <motion.div
            className="login-left__logo"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <img src="/tia-logo.png" alt="TIA Creations" className="login-logo-img" />
          </motion.div>

          <motion.div
            className="login-left__divider-line"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          />

          <motion.h2
            className="login-left__tagline"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            Join Our Creative<br />Community
          </motion.h2>

          <motion.p
            className="login-left__desc"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            Connect with world-class artists,<br />
            collect extraordinary works, and become<br />
            part of something beautiful.
          </motion.p>

          <motion.div
            className="login-left__stats"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
          >
            <div className="login-stat">
              <span className="login-stat__number">12,000+</span>
              <span className="login-stat__label">Collectors</span>
            </div>
            <div className="login-stat__divider" />
            <div className="login-stat">
              <span className="login-stat__number">350+</span>
              <span className="login-stat__label">Artists</span>
            </div>
            <div className="login-stat__divider" />
            <div className="login-stat">
              <span className="login-stat__number">15,000+</span>
              <span className="login-stat__label">Artworks</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="login-right">
        <motion.div
          className="login-form-wrapper"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
        >
          <div className="login-form__header">
            <span className="section-eyebrow">Join TIA</span>
            <h1 className="login-form__title">Create Account</h1>
            <p className="login-form__subtitle">
              Begin your journey into curated art
            </p>
          </div>

          {error && (
            <motion.div
              className="login-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <motion.div
              className="login-field"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              <div className="login-field__input-wrap">
                <User className="login-field__icon" size={18} />
                <input
                  type="text"
                  id="signup-fullname"
                  className="login-field__input"
                  placeholder=" "
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                />
                <label htmlFor="signup-fullname" className="login-field__label">
                  Full Name
                </label>
              </div>
            </motion.div>

            <motion.div
              className="login-field"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
            >
              <div className="login-field__input-wrap">
                <Pen className="login-field__icon" size={18} />
                <input
                  type="text"
                  id="signup-displayname"
                  className="login-field__input"
                  placeholder=" "
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  autoComplete="nickname"
                />
                <label htmlFor="signup-displayname" className="login-field__label">
                  Display Name
                </label>
              </div>
            </motion.div>

            <motion.div
              className="login-field"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
            >
              <div className="login-field__input-wrap">
                <Mail className="login-field__icon" size={18} />
                <input
                  type="email"
                  id="signup-email"
                  className="login-field__input"
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <label htmlFor="signup-email" className="login-field__label">
                  Email Address
                </label>
              </div>
            </motion.div>

            <motion.div
              className="login-field"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
            >
              <div className="login-field__input-wrap">
                <Lock className="login-field__icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="signup-password"
                  className="login-field__input"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <label htmlFor="signup-password" className="login-field__label">
                  Password
                </label>
                <button
                  type="button"
                  className="login-field__toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            <motion.div
              className="login-field"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={5}
            >
              <div className="login-field__input-wrap">
                <Lock className="login-field__icon" size={18} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="signup-confirm"
                  className="login-field__input"
                  placeholder=" "
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <label htmlFor="signup-confirm" className="login-field__label">
                  Confirm Password
                </label>
                <button
                  type="button"
                  className="login-field__toggle"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            <motion.div
              className="login-field__row"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={6}
            >
              <label className="login-checkbox">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span className="login-checkbox__box" />
                <span className="login-checkbox__text">
                  I agree to the{' '}
                  <Link to="/terms" className="login-checkbox__link">
                    Terms &amp; Conditions
                  </Link>
                </span>
              </label>
            </motion.div>

            <motion.button
              type="submit"
              className="btn-gold login-submit"
              disabled={loading}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={7}
            >
              <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              {!loading && <ArrowRight size={16} />}
            </motion.button>
          </form>

          <motion.p
            className="login-footer"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={8}
          >
            Already have an account?{' '}
            <Link to="/login" className="login-footer__link">
              Sign In
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;
