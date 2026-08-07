import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, MapPin, Camera, Award, CreditCard, FileCheck, Check,
  ChevronRight, ChevronLeft, Upload, X, Image as ImageIcon,
  Shield, Landmark, Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './BecomeArtistPage.css';

const API = import.meta.env.VITE_API_URL || window.location.origin;

const STEPS = [
  { id: 1, label: 'Personal Info', icon: User },
  { id: 2, label: 'Artist Info', icon: Camera },
  { id: 3, label: 'Portfolio', icon: ImageIcon },
  { id: 4, label: 'Verification', icon: Shield },
  { id: 5, label: 'Payment', icon: CreditCard },
  { id: 6, label: 'Review', icon: FileCheck },
];

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Japan', 'Brazil', 'South Africa', 'UAE', 'Singapore',
];

const MEDIUMS = ['Oil', 'Acrylic', 'Watercolor', 'Mixed Media', 'Photography', 'Digital', 'Sculpture'];
const STYLES = ['Abstract', 'Modern', 'Contemporary', 'Traditional', 'Impressionism', 'Realism'];
const SUBJECTS = ['Landscape', 'Portrait', 'Nature', 'Cityscape', 'Spiritual', 'Floral', 'Minimal', 'Wildlife'];

const defaultState = {
  fullName: '', displayName: '', country: '', state: '', city: '', phone: '', avatarFile: null, avatarPreview: '',
  bio: '', experience_years: '', education: '', awards: '', specialization: '',
  mediums: [], styles: [], subjects: [],
  portfolioFiles: [], portfolioPreview: [], portfolioDescription: '',
  govIdFile: null, addressProofFile: null, panFile: null,
  bankAccount: '', ifsc: '', upiId: '', taxInfo: '',
  agreedTerms: false,
};

export default function BecomeArtistPage() {
  const { user, token, isArtist, isPending } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => {
    try { return { ...defaultState, ...JSON.parse(localStorage.getItem('ba_form') || '{}') }; } catch { return defaultState; }
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const portfolioInputRef = useRef(null);

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
    else if (isArtist) navigate('/artist/dashboard', { replace: true });
  }, [user, isArtist, navigate]);

  useEffect(() => {
    localStorage.setItem('ba_form', JSON.stringify(form));
  }, [form]);

  const set = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleChip = useCallback((field, value) => {
    setForm(prev => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  }, []);

  const uploadFile = async (file, purpose) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('purpose', purpose);
    const res = await fetch(`${API}/api/upload`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url || data.path;
  };

  const submitStep = async (stepNum) => {
    const payload = { ...form };
    delete payload.avatarFile;
    delete payload.portfolioFiles;
    delete payload.govIdFile;
    delete payload.addressProofFile;
    delete payload.panFile;

    const res = await fetch(`${API}/api/artist/application/step/${stepNum}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Step submission failed');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      for (let i = 1; i <= 6; i++) await submitStep(i);
      await fetch(`${API}/api/artist/application/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      localStorage.removeItem('ba_form');
      setSubmitted(true);
    } catch (err) {
      alert('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set('avatarFile', file);
    set('avatarPreview', URL.createObjectURL(file));
  };

  const handlePortfolioDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    setForm(prev => ({
      ...prev,
      portfolioFiles: [...prev.portfolioFiles, ...files],
      portfolioPreview: [...prev.portfolioPreview, ...files.map(f => URL.createObjectURL(f))],
    }));
  };

  const handleDocUpload = async (field, e) => {
    const file = e.target.files?.[0];
    if (file) set(field, file);
  };

  if (!user) return null;

  if (isPending || user.artistStatus === 'pending' || submitted) {
    return (
      <div className="ba-page">
        <div className="ba-pending">
          <div className="ba-pending__icon">
            <FileCheck size={48} />
          </div>
          <h2>Application {submitted ? 'Submitted' : 'Under Review'}</h2>
          <p>
            {submitted
              ? 'Thank you! Your artist application has been submitted. Our team will review it within 2-3 business days.'
              : 'Your application is currently under review by our curatorial team. You\'ll receive an email once a decision is made.'}
          </p>
          <button className="btn-primary" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="ba-page">
      <section className="ba-hero">
        <p className="section-eyebrow">Join Our Community</p>
        <h1 className="ba-hero__title">Become a TIA Artist</h1>
        <p className="ba-hero__sub">Join 350+ verified artists and reach 12,000+ collectors worldwide</p>
      </section>

      <div className="ba-wizard">
        <div className="ba-steps">
          <div className="ba-steps__track">
            <div className="ba-steps__fill" style={{ width: `${progress}%` }} />
          </div>
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`ba-step ${step === s.id ? 'ba-step--active' : ''} ${step > s.id ? 'ba-step--done' : ''}`}
              onClick={() => { if (s.id < step) setStep(s.id); }}
            >
              <div className="ba-step__dot">
                {step > s.id ? <Check size={14} /> : <s.icon size={14} />}
              </div>
              <span className="ba-step__label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="ba-form">
          {step === 1 && (
            <div className="ba-form__content">
              <h2 className="ba-form__heading">Personal Information</h2>
              <p className="ba-form__sub">Tell us about yourself so collectors can connect with you.</p>

              <div className="ba-avatar-upload" onClick={() => fileInputRef.current?.click()}>
                {form.avatarPreview ? (
                  <img src={form.avatarPreview} alt="" className="ba-avatar-img" />
                ) : (
                  <div className="ba-avatar-placeholder"><Camera size={28} /><span>Upload Photo</span></div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
              </div>

              <div className="ba-field-grid">
                <div className="ba-field">
                  <label>Full Name</label>
                  <input type="text" placeholder="e.g. Aisha Mehta" value={form.fullName} onChange={e => set('fullName', e.target.value)} />
                </div>
                <div className="ba-field">
                  <label>Display Name</label>
                  <input type="text" placeholder="Your artist alias" value={form.displayName} onChange={e => set('displayName', e.target.value)} />
                </div>
                <div className="ba-field">
                  <label>Country</label>
                  <select value={form.country} onChange={e => set('country', e.target.value)}>
                    <option value="">Select country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="ba-field">
                  <label>State</label>
                  <input type="text" placeholder="State / Province" value={form.state} onChange={e => set('state', e.target.value)} />
                </div>
                <div className="ba-field">
                  <label>City</label>
                  <input type="text" placeholder="City" value={form.city} onChange={e => set('city', e.target.value)} />
                </div>
                <div className="ba-field">
                  <label>Phone</label>
                  <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="ba-form__content">
              <h2 className="ba-form__heading">Artist Information</h2>
              <p className="ba-form__sub">Showcase your expertise and artistic identity.</p>

              <div className="ba-field ba-field--full">
                <label>Bio</label>
                <textarea rows={4} placeholder="Tell collectors your artistic journey..." value={form.bio} onChange={e => set('bio', e.target.value)} />
              </div>

              <div className="ba-field-grid">
                <div className="ba-field">
                  <label>Years of Experience</label>
                  <input type="number" min={0} placeholder="0" value={form.experience_years} onChange={e => set('experience_years', e.target.value)} />
                </div>
                <div className="ba-field">
                  <label>Education</label>
                  <input type="text" placeholder="e.g. BFA, MFA..." value={form.education} onChange={e => set('education', e.target.value)} />
                </div>
                <div className="ba-field">
                  <label>Awards & Recognition</label>
                  <input type="text" placeholder="e.g. National Art Award 2023" value={form.awards} onChange={e => set('awards', e.target.value)} />
                </div>
                <div className="ba-field">
                  <label>Specialization</label>
                  <input type="text" placeholder="Your primary art form" value={form.specialization} onChange={e => set('specialization', e.target.value)} />
                </div>
              </div>

              <div className="ba-field ba-field--full">
                <label>Mediums</label>
                <div className="ba-chip-group">
                  {MEDIUMS.map(m => (
                    <button key={m} className={`ba-chip ${form.mediums.includes(m) ? 'ba-chip--active' : ''}`} onClick={() => toggleChip('mediums', m)}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ba-field ba-field--full">
                <label>Styles</label>
                <div className="ba-chip-group">
                  {STYLES.map(s => (
                    <button key={s} className={`ba-chip ${form.styles.includes(s) ? 'ba-chip--active' : ''}`} onClick={() => toggleChip('styles', s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ba-field ba-field--full">
                <label>Subjects</label>
                <div className="ba-chip-group">
                  {SUBJECTS.map(s => (
                    <button key={s} className={`ba-chip ${form.subjects.includes(s) ? 'ba-chip--active' : ''}`} onClick={() => toggleChip('subjects', s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="ba-form__content">
              <h2 className="ba-form__heading">Portfolio</h2>
              <p className="ba-form__sub">Upload at least 3 of your best artworks for review.</p>

              <div
                className={`ba-upload-zone ${dragOver ? 'ba-upload-zone--over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handlePortfolioDrop}
                onClick={() => portfolioInputRef.current?.click()}
              >
                <Upload size={40} />
                <p className="ba-upload-zone__title">Drag & drop images here</p>
                <p className="ba-upload-zone__sub">or click to browse — JPG, PNG, WEBP up to 10MB each</p>
                <input ref={portfolioInputRef} type="file" accept="image/*" multiple hidden onChange={e => {
                  const files = Array.from(e.target.files || []);
                  setForm(prev => ({
                    ...prev,
                    portfolioFiles: [...prev.portfolioFiles, ...files],
                    portfolioPreview: [...prev.portfolioPreview, ...files.map(f => URL.createObjectURL(f))],
                  }));
                }} />
              </div>

              {form.portfolioPreview.length > 0 && (
                <div className="ba-portfolio-grid">
                  {form.portfolioPreview.map((src, i) => (
                    <div key={i} className="ba-portfolio-thumb">
                      <img src={src} alt={`Portfolio ${i + 1}`} />
                      <button
                        className="ba-portfolio-remove"
                        onClick={() => {
                          setForm(prev => ({
                            ...prev,
                            portfolioFiles: prev.portfolioFiles.filter((_, idx) => idx !== i),
                            portfolioPreview: prev.portfolioPreview.filter((_, idx) => idx !== i),
                          }));
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="ba-field ba-field--full" style={{ marginTop: '1.5rem' }}>
                <label>Portfolio Description</label>
                <textarea rows={4} placeholder="Describe your collection, artistic themes, and what inspires you..." value={form.portfolioDescription} onChange={e => set('portfolioDescription', e.target.value)} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="ba-form__content">
              <h2 className="ba-form__heading">Identity Verification</h2>
              <p className="ba-form__sub">Required for artist verification and secure payouts.</p>

              <div className="ba-doc-grid">
                <div className="ba-doc-card">
                  <div className="ba-doc-card__icon"><Shield size={32} /></div>
                  <h3>Government ID</h3>
                  <p>Passport, Driver's License, or Aadhaar</p>
                  <label className="ba-doc-btn">
                    <Upload size={16} /> {form.govIdFile ? form.govIdFile.name : 'Choose File'}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={e => handleDocUpload('govIdFile', e)} />
                  </label>
                </div>

                <div className="ba-doc-card">
                  <div className="ba-doc-card__icon"><MapPin size={32} /></div>
                  <h3>Address Proof</h3>
                  <p>Utility bill or bank statement (last 3 months)</p>
                  <label className="ba-doc-btn">
                    <Upload size={16} /> {form.addressProofFile ? form.addressProofFile.name : 'Choose File'}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={e => handleDocUpload('addressProofFile', e)} />
                  </label>
                </div>

                <div className="ba-doc-card">
                  <div className="ba-doc-card__icon"><Landmark size={32} /></div>
                  <h3>PAN Card</h3>
                  <p>Required for tax compliance in India</p>
                  <label className="ba-doc-btn">
                    <Upload size={16} /> {form.panFile ? form.panFile.name : 'Choose File'}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={e => handleDocUpload('panFile', e)} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="ba-form__content">
              <h2 className="ba-form__heading">Payment Details</h2>
              <p className="ba-form__sub">Set up how you'd like to receive your earnings.</p>

              <div className="ba-field-grid">
                <div className="ba-field">
                  <label>Bank Account Number</label>
                  <input type="text" placeholder="Account number" value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)} />
                </div>
                <div className="ba-field">
                  <label>IFSC Code</label>
                  <input type="text" placeholder="e.g. SBIN0001234" value={form.ifsc} onChange={e => set('ifsc', e.target.value)} />
                </div>
                <div className="ba-field">
                  <label>UPI ID</label>
                  <input type="text" placeholder="e.g. name@upi" value={form.upiId} onChange={e => set('upiId', e.target.value)} />
                </div>
                <div className="ba-field ba-field--full">
                  <label>Tax Information</label>
                  <textarea rows={3} placeholder="GST number or other tax details (if applicable)" value={form.taxInfo} onChange={e => set('taxInfo', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="ba-form__content">
              <h2 className="ba-form__heading">Review & Submit</h2>
              <p className="ba-form__sub">Please review your information before submitting.</p>

              <div className="ba-review">
                <div className="ba-review__card">
                  <h4><User size={16} /> Personal Info</h4>
                  <div className="ba-review__grid">
                    <span>Name: {form.fullName || '—'}</span>
                    <span>Display: {form.displayName || '—'}</span>
                    <span>Location: {[form.city, form.state, form.country].filter(Boolean).join(', ') || '—'}</span>
                    <span>Phone: {form.phone || '—'}</span>
                  </div>
                </div>

                <div className="ba-review__card">
                  <h4><Camera size={16} /> Artist Info</h4>
                  <div className="ba-review__grid">
                    <span>Experience: {form.experience_years || '—'} years</span>
                    <span>Specialization: {form.specialization || '—'}</span>
                    <span>Mediums: {form.mediums.join(', ') || '—'}</span>
                    <span>Styles: {form.styles.join(', ') || '—'}</span>
                    <span>Subjects: {form.subjects.join(', ') || '—'}</span>
                  </div>
                </div>

                <div className="ba-review__card">
                  <h4><ImageIcon size={16} /> Portfolio</h4>
                  <div className="ba-review__grid">
                    <span>Works: {form.portfolioFiles.length} images uploaded</span>
                    <span>{form.portfolioDescription ? form.portfolioDescription.substring(0, 100) + '...' : 'No description'}</span>
                  </div>
                </div>

                <div className="ba-review__card">
                  <h4><CreditCard size={16} /> Payment</h4>
                  <div className="ba-review__grid">
                    <span>Account: {form.bankAccount ? '****' + form.bankAccount.slice(-4) : '—'}</span>
                    <span>IFSC: {form.ifsc || '—'}</span>
                    <span>UPI: {form.upiId || '—'}</span>
                  </div>
                </div>
              </div>

              <label className="ba-terms">
                <input type="checkbox" checked={form.agreedTerms} onChange={e => set('agreedTerms', e.target.checked)} />
                <span>I agree to the <a href="/terms" target="_blank" rel="noreferrer">Artist Terms of Service</a>, <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>, and the commission structure outlined in our Artist Agreement.</span>
              </label>
            </div>
          )}
        </div>

        <div className="ba-nav">
          <button
            className="btn-ghost"
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
          >
            <ChevronLeft size={18} /> Back
          </button>

          {step < 6 ? (
            <button className="btn-primary" onClick={() => setStep(s => Math.min(6, s + 1))}>
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button
              className="btn-gold"
              onClick={handleSubmit}
              disabled={submitting || !form.agreedTerms}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
