import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
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

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <motion.div
        className="login-left"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
      >
        <div className="login-left__bg">
          <img
            src="https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=1200&q=80"
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
            Welcome Back to<br />TIA Creations
          </motion.h2>

          <motion.p
            className="login-left__desc"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            Where art meets curation.<br />
            Discover extraordinary works from world-class artists.
          </motion.p>

          <motion.div
            className="login-left__badge"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
          >
            <span className="login-left__badge-text">A Museum-Grade Experience</span>
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
            <span className="section-eyebrow">Account Access</span>
            <h1 className="login-form__title">Sign In</h1>
            <p className="login-form__subtitle">
              Enter your credentials to access your collection
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
                <Mail className="login-field__icon" size={18} />
                <input
                  type="email"
                  id="login-email"
                  className="login-field__input"
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <label htmlFor="login-email" className="login-field__label">
                  Email Address
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
                <Lock className="login-field__icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  className="login-field__input"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <label htmlFor="login-password" className="login-field__label">
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
              className="login-field__row"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
            >
              <label className="login-checkbox">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="login-checkbox__box" />
                <span className="login-checkbox__text">Remember me</span>
              </label>
              <Link to="/forgot-password" className="login-forgot">
                Forgot Password?
              </Link>
            </motion.div>

            <motion.button
              type="submit"
              className="btn-gold login-submit"
              disabled={loading}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
            >
              <span>{loading ? 'Signing In...' : 'Sign In'}</span>
              {!loading && <ArrowRight size={16} />}
            </motion.button>
          </form>

          <motion.div
            className="login-divider"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={5}
          >
            <span>or continue with</span>
          </motion.div>

          <motion.div
            className="login-social"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={6}
          >
            <button type="button" className="login-social__btn">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button type="button" className="login-social__btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple
            </button>
          </motion.div>

          <motion.p
            className="login-footer"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={7}
          >
            Don't have an account?{' '}
            <Link to="/signup" className="login-footer__link">
              Sign Up
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
