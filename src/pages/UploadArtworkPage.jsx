~import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Upload, Image, X, Save, Send, ArrowLeft, AlertCircle, CheckCircle,
  HelpCircle, Tag, DollarSign, Ruler, Calendar, Award, ChevronLeft, ChevronRight,
  Layers, FolderOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './UploadArtworkPage.css';

const API = import.meta.env.VITE_API_URL || window.location.origin;

const ORIENTATIONS = ['Portrait', 'Landscape', 'Square'];
const CURRENCIES = [
  { value: 'INR', label: 'INR (₹)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
];

export default function UploadArtworkPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [images, setImages] = useState([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [dragging, setDragging] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    subcategory: '',
    customSubcategory: '',
    medium: '',
    style: '',
    subject: '',
    orientation: '',
    dimensions: '',
    year: '',
    price: '',
    currency: 'INR',
    certificate: false,
    tags: [],
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [artworkId, setArtworkId] = useState(null);
  const [artworkStatus, setArtworkStatus] = useState('draft');
  const [isEditing, setIsEditing] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState('');

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedParent, setSelectedParent] = useState('');
  const [subcategories, setSubcategories] = useState([]);

  const fileInputRef = useRef(null);

  const progressSteps = [
    { label: 'Category & Images', icon: Layers },
    { label: 'Details & Pricing', icon: Tag },
    { label: 'Review & Submit', icon: Send },
  ];

  useEffect(() => {
    if (!user || user.artistStatus !== 'approved') {
      navigate('/become-artist', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const state = location.state;
    if (state?.artworkId) {
      loadArtwork(state.artworkId);
    }
  }, [location]);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetch(`${API}/api/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch {}
    setCategoriesLoading(false);
  };

  const loadArtwork = async (id) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/artworks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load artwork');
      const data = await res.json();
      const a = data.artwork;
      setArtworkId(a.id);
      setArtworkStatus(a.status);
      setIsEditing(true);

      const parentCat = a.categoryId
        ? categories.find(c => c.id === a.categoryId)
        : null;

      setForm({
        title: a.title || '',
        description: a.description || '',
        categoryId: a.categoryId || '',
        subcategory: a.subcategory || '',
        customSubcategory: a.customSubcategory || '',
        medium: a.medium || '',
        style: a.style || '',
        subject: a.subject || '',
        orientation: a.orientation || '',
        dimensions: a.dimensions || '',
        year: a.year || '',
        price: a.price || '',
        currency: a.currency || 'INR',
        certificate: a.certificate || false,
        tags: a.tags || [],
      });

      if (parentCat) {
        setSelectedParent(parentCat.id);
        setSubcategories(parentCat.children || []);
      }

      if (a.images && Array.isArray(a.images)) {
        setImages(a.images.map(img => ({
          preview: img.thumb || img.featured || img.full,
          full: img.full,
          featured: img.featured,
          thumb: img.thumb,
        })));
      } else if (a.thumbnail) {
        setImages([{ preview: a.thumbnail, full: a.thumbnail }]);
      }

      if (a.status === 'changes_requested') {
        fetchAdminFeedback(a.id);
      }
    } catch (err) {
      setError('Failed to load artwork: ' + err.message);
    }
    setLoading(false);
  };

  const fetchAdminFeedback = async (id) => {
    try {
      const res = await fetch(`${API}/api/artworks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
      }
    } catch {}
    try {
      const res = await fetch(`${API}/api/admin/audit?entityType=artwork&search=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.log) {
          const feedbackEntries = data.log.filter(l =>
            l.action === 'request_changes_artwork' && l.entityId === id
          );
          if (feedbackEntries.length > 0) {
            const meta = feedbackEntries[0].meta;
            if (meta && typeof meta === 'object' && meta.feedback) {
              setAdminFeedback(meta.feedback);
            } else if (typeof meta === 'string') {
              try {
                const parsed = JSON.parse(meta);
                setAdminFeedback(parsed.feedback || meta);
              } catch {
                setAdminFeedback(meta);
              }
            }
          }
        }
      }
    } catch {}
  };

  const handleParentChange = (parentId) => {
    setSelectedParent(parentId);
    setForm(prev => ({ ...prev, categoryId: parentId, subcategory: '', customSubcategory: '' }));
    if (!parentId) {
      setSubcategories([]);
      return;
    }
    const parent = categories.find(c => c.id === parentId);
    setSubcategories(parent?.children || []);
  };

  const handleSubcategoryChange = (value) => {
    if (value === 'Other') {
      setForm(prev => ({ ...prev, subcategory: 'Other', customSubcategory: '' }));
    } else if (value) {
      setForm(prev => ({ ...prev, subcategory: value, customSubcategory: '' }));
    } else {
      setForm(prev => ({ ...prev, subcategory: '', customSubcategory: '' }));
    }
  };

  const validateStep = () => {
    const errors = {};
    if (step === 1) {
      if (!selectedParent) errors.category = 'Please select a category';
      if (images.length === 0) errors.images = 'Please upload at least one artwork image';
      if (!form.title.trim()) errors.title = 'Title is required';
      if (subcategories.length > 0 && !form.subcategory) errors.subcategory = 'Please select a subcategory';
      if (form.subcategory === 'Other' && !form.customSubcategory.trim()) errors.customSubcategory = 'Please enter your custom subcategory';
    }
    if (step === 2) {
      if (!form.price || Number(form.price) <= 0) errors.price = 'Please enter a valid price';
      if (!form.dimensions.trim()) errors.dimensions = 'Dimensions are required';
      if (!form.orientation) errors.orientation = 'Orientation is required';
    }
    if (step === 3) {
      if (!selectedParent) errors.category = 'Please select a category';
      if (images.length === 0) errors.images = 'Please upload at least one artwork image';
      if (!form.title.trim()) errors.title = 'Title is required';
      if (!form.price || Number(form.price) <= 0) errors.price = 'Please enter a valid price';
      if (subcategories.length > 0 && !form.subcategory) errors.subcategory = 'Please select a subcategory';
      if (form.subcategory === 'Other' && !form.customSubcategory.trim()) errors.customSubcategory = 'Please enter your custom subcategory';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImageUpload = async (files) => {
    if (!files.length) return;
    if (images.length + files.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => [...prev, { preview: e.target.result, file }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleImageUpload(e.dataTransfer.files); };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    if (primaryIndex >= images.length - 1) setPrimaryIndex(Math.max(0, images.length - 2));
  };

  const uploadImageFile = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('purpose', 'artwork');
    const res = await fetch(`${API}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Image upload failed');
    }
    const data = await res.json();
    return data.url;
  };

  const saveDraft = async (submit = false) => {
    if (!validateStep()) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const imageUrls = [];
      for (const img of images) {
        if (img.file) {
          const url = await uploadImageFile(img.file);
          imageUrls.push({ full: url, featured: url, thumb: url });
        } else {
          imageUrls.push(img);
        }
      }

      const payload = {
        title: form.title,
        description: form.description,
        categoryId: selectedParent || undefined,
        subcategory: form.subcategory || null,
        customSubcategory: form.subcategory === 'Other' && form.customSubcategory.trim()
          ? form.customSubcategory.trim()
          : null,
        medium: form.medium,
        style: form.style,
        subject: form.subject,
        orientation: form.orientation,
        dimensions: form.dimensions,
        year: form.year,
        price: Number(form.price),
        currency: form.currency,
        certificate: form.certificate,
        tags: form.tags,
        images: imageUrls,
        thumbnail: imageUrls[primaryIndex]?.full || imageUrls[0]?.full || '',
      };

      let artwork;
      if (artworkId) {
        const res = await fetch(`${API}/api/artworks/${artworkId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to update artwork');
        }
        artwork = (await res.json()).artwork;
      } else {
        const res = await fetch(`${API}/api/artworks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to create artwork');
        }
        artwork = (await res.json()).artwork;
        setArtworkId(artwork.id);
        setIsEditing(true);
      }

      if (submit) {
        const res = await fetch(`${API}/api/artworks/${artwork.id}/submit`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to submit for review');
        }
        setArtworkStatus('in_review');
        setSuccess('Artwork submitted for review!');
        setTimeout(() => navigate('/artist/dashboard'), 2000);
      } else {
        setArtworkStatus('draft');
        setSuccess('Draft saved successfully!');
      }
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    navigate('/artist/dashboard');
  };

  const nextStep = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, 3));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const progress = ((step - 1) / (progressSteps.length - 1)) * 100;

  if (!user || user.artistStatus !== 'approved') return null;

  return (
    <div className="upload-page">
      <div className="upload-header">
        <Link to="/artist/dashboard" className="upload-back">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
        <div className="upload-title">
          <h1>{isEditing ? 'Edit Artwork' : 'Upload Artwork'}</h1>
          <p className="upload-subtitle">
            {isEditing
              ? `Editing draft${artworkStatus === 'changes_requested' ? ' — changes requested by admin' : ''}`
              : 'Fill in the details below to list your artwork on the marketplace.'}
          </p>
        </div>
        {artworkId && (
          <span className={`ad-status-badge ad-status-badge--${artworkStatus === 'draft' ? 'gray' : artworkStatus === 'in_review' ? 'amber' : artworkStatus === 'changes_requested' ? 'gold' : 'red'}`}>
            {artworkStatus.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="upload-progress">
        <div className="upload-progress__track">
          <div className="upload-progress__fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="upload-progress__steps">
          {progressSteps.map((s, i) => (
            <div key={i} className={`upload-progress__step ${i + 1 < step ? 'done' : i + 1 === step ? 'active' : ''}`} data-step={i + 1}>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && <div className="upload-alert upload-alert--error"><AlertCircle size={18} /> {error}</div>}
      {success && <div className="upload-alert upload-alert--success"><CheckCircle size={18} /> {success}</div>}
      {adminFeedback && artworkStatus === 'changes_requested' && (
        <div className="upload-notice upload-notice--warning upload-notice--feedback">
          <AlertCircle size={18} />
          <div>
            <strong>Admin Feedback:</strong> {adminFeedback}
          </div>
        </div>
      )}

      {/* Main Form */}
      <form className="upload-form" onSubmit={e => e.preventDefault()}>
        {loading && (
          <div className="upload-loading-overlay">
            <div className="upload-loading-spinner" />
            <p>Loading artwork...</p>
          </div>
        )}

        <div className="upload-step" style={{ display: loading ? 'none' : 'block' }}>
          {/* Step 1: Category & Images */}
          {step === 1 && (
            <>
              <section className="upload-section">
                <h2><Layers size={20} /> Category</h2>
                <p className="upload-section__sub">Select a category for your artwork to help collectors find it.</p>
                <div className="upload-field-grid">
                  <div className="upload-field">
                    <label>Category <span className="upload-required">*</span></label>
                    {categoriesLoading ? (
                      <p className="upload-hint">Loading categories...</p>
                    ) : categories.length === 0 ? (
                      <p className="upload-hint">No categories available</p>
                    ) : (
                      <select
                        value={selectedParent}
                        onChange={e => handleParentChange(e.target.value)}
                        className={validationErrors.category ? 'error' : ''}
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    )}
                    {validationErrors.category && <p className="upload-error">{validationErrors.category}</p>}
                  </div>

                  <div className="upload-field">
                    <label>Subcategory <span className="upload-required">*</span></label>
                    <select
                      value={form.subcategory}
                      onChange={e => handleSubcategoryChange(e.target.value)}
                      disabled={!selectedParent}
                      className={validationErrors.subcategory ? 'error' : ''}
                    >
                      <option value="">Select Subcategory</option>
                      {subcategories.map(sub => (
                        <option key={sub.id} value={sub.name}>{sub.name}</option>
                      ))}
                      {selectedParent && <option value="Other">Other</option>}
                    </select>
                    {subcategories.length === 0 && selectedParent && !categoriesLoading && (
                      <p className="upload-hint">No predefined subcategories available</p>
                    )}
                    {validationErrors.subcategory && <p className="upload-error">{validationErrors.subcategory}</p>}
                  </div>

                  {form.subcategory === 'Other' && (
                    <div className="upload-field upload-field--full upload-custom-subcategory">
                      <label>Custom Subcategory <span className="upload-required">*</span></label>
                      <input
                        type="text"
                        value={form.customSubcategory}
                        onChange={e => setForm({...form, customSubcategory: e.target.value})}
                        placeholder="Enter your custom subcategory"
                        className={validationErrors.customSubcategory ? 'error' : ''}
                        maxLength={100}
                      />
                      {validationErrors.customSubcategory && <p className="upload-error">{validationErrors.customSubcategory}</p>}
                    </div>
                  )}
                </div>
              </section>

              <section className="upload-section">
                <h2><Image size={20} /> Artwork Images</h2>
                <div
                  className={`upload-dropzone ${dragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={36} />
                  <p>Drag & drop images here, or click to browse</p>
                  <p className="upload-hint">JPG, PNG, WebP · Max 10 images · 10MB each</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => handleImageUpload(e.target.files)}
                    style={{ display: 'none' }}
                  />
                </div>

                {images.length > 0 && (
                  <div className="upload-preview-grid">
                    {images.map((img, i) => (
                      <div key={i} className={`upload-preview-item ${i === primaryIndex ? 'primary' : ''}`}>
                        <img src={img.preview} alt={`Artwork ${i + 1}`} />
                        {images.length > 1 && (
                          <button
                            type="button"
                            className={`upload-primary-badge ${i === primaryIndex ? 'active' : ''}`}
                            onClick={() => setPrimaryIndex(i)}
                          >
                            {i === primaryIndex ? <CheckCircle size={12} /> : 'Set as Primary'}
                          </button>
                        )}
                        <button type="button" className="upload-remove" onClick={() => removeImage(i)}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
                {validationErrors.images && <p className="upload-error">{validationErrors.images}</p>}
              </section>

              <section className="upload-section">
                <h2><Tag size={20} /> Basic Information</h2>
                <div className="upload-field-grid">
                  <div className="upload-field upload-field--full">
                    <label>Title <span className="upload-required">*</span></label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => setForm({...form, title: e.target.value})}
                      placeholder="Enter artwork title"
                      className={validationErrors.title ? 'error' : ''}
                      maxLength={100}
                    />
                    {validationErrors.title && <p className="upload-error">{validationErrors.title}</p>}
                  </div>

                  <div className="upload-field">
                    <label>Medium</label>
                    <input
                      type="text"
                      value={form.medium}
                      onChange={e => setForm({...form, medium: e.target.value})}
                      placeholder="e.g. Oil, Acrylic"
                    />
                  </div>

                  <div className="upload-field">
                    <label>Style</label>
                    <input
                      type="text"
                      value={form.style}
                      onChange={e => setForm({...form, style: e.target.value})}
                      placeholder="e.g. Abstract, Modern"
                    />
                  </div>

                  <div className="upload-field upload-field--full">
                    <label>Subject</label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={e => setForm({...form, subject: e.target.value})}
                      placeholder="e.g. Landscape, Portrait, Nature"
                    />
                  </div>

                  <div className="upload-field upload-field--full">
                    <label>Description</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm({...form, description: e.target.value})}
                      placeholder="Describe your artwork, inspiration, techniques..."
                      rows={4}
                    />
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Step 2: Details & Pricing */}
          {step === 2 && (
            <>
              <section className="upload-section">
                <h2><Ruler size={20} /> Artwork Details</h2>
                <div className="upload-field-grid">
                  <div className="upload-field">
                    <label>Orientation <span className="upload-required">*</span></label>
                    <select
                      value={form.orientation}
                      onChange={e => setForm({...form, orientation: e.target.value})}
                      className={validationErrors.orientation ? 'error' : ''}
                    >
                      <option value="">Select orientation</option>
                      {ORIENTATIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    {validationErrors.orientation && <p className="upload-error">{validationErrors.orientation}</p>}
                  </div>

                  <div className="upload-field">
                    <label>Year Created</label>
                    <input
                      type="number"
                      value={form.year}
                      onChange={e => setForm({...form, year: e.target.value})}
                      placeholder="e.g. 2024"
                      min={1900}
                      max={new Date().getFullYear()}
                    />
                  </div>

                  <div className="upload-field upload-field--full">
                    <label>Dimensions (cm) <span className="upload-required">*</span></label>
                    <input
                      type="text"
                      value={form.dimensions}
                      onChange={e => setForm({...form, dimensions: e.target.value})}
                      placeholder="e.g. 60 x 80 x 2 (W x H x D)"
                      className={validationErrors.dimensions ? 'error' : ''}
                    />
                    {validationErrors.dimensions && <p className="upload-error">{validationErrors.dimensions}</p>}
                  </div>
                </div>
              </section>

              <section className="upload-section">
                <h2><DollarSign size={20} /> Pricing</h2>
                <div className="upload-field-grid">
                  <div className="upload-field">
                    <label>Price <span className="upload-required">*</span></label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={e => setForm({...form, price: e.target.value})}
                      placeholder="0"
                      min="1"
                      step="1"
                      className={validationErrors.price ? 'error' : ''}
                    />
                    {validationErrors.price && <p className="upload-error">{validationErrors.price}</p>}
                  </div>

                  <div className="upload-field">
                    <label>Currency</label>
                    <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
                      {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              <section className="upload-section">
                <h2><Award size={20} /> Additional Information</h2>
                <div className="upload-field-grid">
                  <div className="upload-field upload-field--full">
                    <label>Tags</label>
                    <div className="upload-tags">
                      <input
                        type="text"
                        placeholder="Add a tag and press Enter"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            e.preventDefault();
                            if (!form.tags.includes(e.target.value.trim())) {
                              setForm(prev => ({...prev, tags: [...prev.tags, e.target.value.trim()]}));
                            }
                            e.target.value = '';
                          }
                        }}
                      />
                      <div className="upload-tag-list">
                        {form.tags.map((tag, i) => (
                          <span key={i} className="upload-tag">
                            {tag}
                            <button type="button" onClick={() => setForm(prev => ({...prev, tags: prev.tags.filter((_, j) => j !== i)}))}>&times;</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="upload-field upload-field--full">
                    <label className="upload-checkbox">
                      <input
                        type="checkbox"
                        checked={form.certificate}
                        onChange={e => setForm({...form, certificate: e.target.checked})}
                      />
                      Include Certificate of Authenticity
                    </label>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <section className="upload-section">
              <h2><CheckCircle size={20} /> Review & Submit</h2>
              <div className="upload-review">
                <div className="upload-review__section">
                  <h3>Category</h3>
                  <p className="upload-review__text">
                    {selectedParent
                      ? categories.find(c => c.id === selectedParent)?.name
                      : 'Not selected'}
                    {form.subcategory && form.subcategory !== 'Other' && (
                      <> → {form.subcategory}</>
                    )}
                    {form.subcategory === 'Other' && form.customSubcategory && (
                      <> → Other ({form.customSubcategory})</>
                    )}
                  </p>
                </div>

                <div className="upload-review__section">
                  <h3>Images ({images.length})</h3>
                  <div className="upload-preview-grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))'}}>
                    {images.map((img, i) => (
                      <div key={i} className={`upload-preview-item ${i === primaryIndex ? 'primary' : ''}`}>
                        <img src={img.preview} alt={`Artwork ${i + 1}`} />
                        {i === primaryIndex && <span className="upload-primary-badge active"><CheckCircle size={10} /> Primary</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="upload-review__section">
                  <h3>Basic Information</h3>
                  <dl className="upload-review__list">
                    <dt>Title</dt><dd>{form.title || '—'}</dd>
                    <dt>Medium</dt><dd>{form.medium || '—'}</dd>
                    <dt>Style</dt><dd>{form.style || '—'}</dd>
                    <dt>Subject</dt><dd>{form.subject || '—'}</dd>
                    <dt>Description</dt><dd>{form.description || '—'}</dd>
                  </dl>
                </div>

                <div className="upload-review__section">
                  <h3>Details & Pricing</h3>
                  <dl className="upload-review__list">
                    <dt>Orientation</dt><dd>{form.orientation || '—'}</dd>
                    <dt>Dimensions</dt><dd>{form.dimensions || '—'}</dd>
                    <dt>Year</dt><dd>{form.year || '—'}</dd>
                    <dt>Price</dt><dd>{form.currency === 'INR' ? '₹' : form.currency === 'USD' ? '$' : '€'}{Number(form.price || 0).toLocaleString()}</dd>
                    <dt>Certificate</dt><dd>{form.certificate ? 'Yes' : 'No'}</dd>
                    <dt>Tags</dt><dd>{form.tags.join(', ') || '—'}</dd>
                  </dl>
                </div>
              </div>

              {isEditing && artworkStatus === 'draft' && (
                <div className="upload-notice upload-notice--info">
                  <HelpCircle size={16} /> This artwork is currently a draft. You can continue editing and submit when ready.
                </div>
              )}
              {isEditing && artworkStatus === 'in_review' && (
                <div className="upload-notice upload-notice--warning">
                  <AlertCircle size={16} /> This artwork is under review. Changes will require re-submission.
                </div>
              )}
              {isEditing && artworkStatus === 'changes_requested' && (
                <div className="upload-notice upload-notice--warning">
                  <AlertCircle size={16} /> Changes were requested. Make edits and re-submit when ready.
                </div>
              )}
              {isEditing && artworkStatus === 'rejected' && (
                <div className="upload-notice upload-notice--error">
                  <AlertCircle size={16} /> This artwork was rejected. You can edit and re-submit for review.
                </div>
              )}
            </section>
          )}
        </div>

        {/* Navigation */}
        <div className="upload-actions">
          {step > 1 && (
            <button type="button" className="btn btn--ghost" onClick={prevStep} disabled={saving}>
              <ChevronLeft size={16} /> Back
            </button>
          )}
          {step < 3 && (
            <button type="button" className="btn btn--secondary" onClick={nextStep} disabled={saving}>
              Continue <ChevronRight size={16} />
            </button>
          )}
          {step === 3 && !isEditing && (
            <>
              <button type="button" className="btn btn--primary" onClick={() => saveDraft(false)} disabled={saving}>
                {saving ? 'Saving...' : <><Save size={16} /> Save as Draft</>}
              </button>
              <button type="button" className="btn btn--gold" onClick={() => saveDraft(true)} disabled={saving}>
                {saving ? 'Submitting...' : <><Send size={16} /> Submit for Review</>}
              </button>
            </>
          )}
          {step === 3 && isEditing && artworkStatus === 'draft' && (
            <>
              <button type="button" className="btn btn--primary" onClick={() => saveDraft(false)} disabled={saving}>
                {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
              </button>
              <button type="button" className="btn btn--gold" onClick={() => saveDraft(true)} disabled={saving}>
                {saving ? 'Submitting...' : <><Send size={16} /> Submit for Review</>}
              </button>
            </>
          )}
          {step === 3 && isEditing && ['changes_requested', 'rejected'].includes(artworkStatus) && (
            <button type="button" className="btn btn--gold" onClick={() => saveDraft(true)} disabled={saving}>
              {saving ? 'Resubmitting...' : <><Send size={16} /> Resubmit for Review</>}
            </button>
          )}
          {step === 3 && isEditing && artworkStatus === 'in_review' && (
            <div className="upload-notice upload-notice--info">
              <HelpCircle size={16} /> Artwork is under review. No further action needed.
            </div>
          )}
          <button type="button" className="btn btn--ghost" onClick={handleCancel} disabled={saving}>
            <ArrowLeft size={16} /> Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
