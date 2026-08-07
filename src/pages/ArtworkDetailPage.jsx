import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronDown, ChevronUp, Heart, Share2, Truck, Shield,
  Award, RotateCcw, CheckCircle, Star, MapPin, Calendar, Eye, MessageCircle,
  ThumbsUp, ArrowRight, ArrowLeft, ZoomIn, ZoomOut, Maximize2, Minimize2,
  X, Send, Info, Package, FileCheck, Clock, Phone, Mail
} from 'lucide-react';
import ArtworkCard from '../components/ArtworkCard';
import './ArtworkDetailPage.css';

const img = (id, w = 600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
];

const MOCK_ARTWORKS = [
  { id: 1, name: 'Whispers of Gold', artist: 'Rhea Nair', artistAvatar: AVATARS[1], price: '₹ 45,000', originalPrice: '₹ 55,000', medium: 'Oil Painting', style: 'Abstract', subject: 'Landscape', size: 'Large', dimensions: '36 × 48 in', orientation: 'Vertical', color: 'Gold', rating: 4.8, reviews: 24, image: img('photo-1541961017774-22349e4a1262'), badge: 'Trending', verified: true, freeShipping: true, certificate: true, year: '2024', inStock: true, story: 'This piece captures the ethereal beauty of golden hour light filtering through ancient forests. The artist spent three months studying light patterns in Himachal Pradesh before translating those observations onto canvas. Each brushstroke layers warm golds and ambers to create a luminous depth that shifts as you move around the piece.', location: 'Mumbai, India', featured: true },
  { id: 2, name: 'Beyond Horizons', artist: 'Vikram Iyer', artistAvatar: AVATARS[0], price: '₹ 38,000', medium: 'Acrylic', style: 'Contemporary', subject: 'Nature', size: 'Medium', dimensions: '30 × 40 in', orientation: 'Horizontal', color: 'Blue', rating: 4.6, reviews: 18, image: img('photo-1493246507139-91e8fad9978e'), verified: true, freeShipping: true, certificate: true, year: '2024', inStock: true, story: 'Inspired by the vast landscapes of Ladakh, this contemporary piece pushes the boundaries of traditional landscape painting. Bold acrylic layers create a sense of infinite space, while the cool blue palette evokes the crisp mountain air of the Himalayas.', location: 'Delhi, India', featured: false },
  { id: 3, name: 'Urban Reflections', artist: 'Aisha Qureshi', artistAvatar: AVATARS[3], price: '₹ 35,000', originalPrice: '₹ 42,000', medium: 'Mixed Media', style: 'Modern', subject: 'Cityscape', size: 'Medium', dimensions: '24 × 36 in', orientation: 'Vertical', color: 'Grey', rating: 4.9, reviews: 31, image: img('photo-1579762715111-42f40c7f422a'), badge: 'New', verified: true, freeShipping: false, certificate: true, year: '2025', inStock: true, story: 'A mixed media exploration of urban life, combining photography, paint, and metallic leaf. The piece captures the reflected light of city buildings at dusk, blending reality with abstraction to create a dreamlike urban landscape.', location: 'Bangalore, India', featured: true },
  { id: 4, name: 'Eternal Bloom', artist: 'Kavita Singh', artistAvatar: AVATARS[5], price: '₹ 28,000', medium: 'Watercolor', style: 'Traditional', subject: 'Floral', size: 'Small', dimensions: '20 × 28 in', orientation: 'Vertical', color: 'Red', rating: 4.7, reviews: 15, image: img('photo-1590055531615-f16d36ffe8ea'), verified: true, freeShipping: true, certificate: false, year: '2024', inStock: true, story: 'Traditional Indian watercolor techniques meet contemporary composition in this floral masterpiece. The artist uses hand-made paper sourced from Rajasthan and natural pigments to create petals that seem to float off the surface.', location: 'Jaipur, India', featured: false },
  { id: 5, name: 'Golden Aura', artist: 'Rahul Mehta', artistAvatar: AVATARS[2], price: '₹ 52,000', medium: 'Oil Painting', style: 'Abstract', subject: 'Minimal', size: 'Large', dimensions: '40 × 52 in', orientation: 'Vertical', color: 'Gold', rating: 4.5, reviews: 12, image: img('photo-1515405295579-ba7b45403062'), badge: 'Limited', verified: true, freeShipping: true, certificate: true, year: '2023', inStock: true, story: 'Part of the limited "Aura" series, this oil painting uses gold leaf and layered glazing techniques to create a meditative focal point. Each piece in the series took over 200 hours to complete, with 15+ layers of transparent oil glazes.', location: 'Ahmedabad, India', featured: true },
  { id: 6, name: 'Midnight Solace', artist: 'Priya Desai', artistAvatar: AVATARS[7], price: '₹ 41,000', medium: 'Acrylic', style: 'Contemporary', subject: 'Nature', size: 'Medium', dimensions: '32 × 44 in', orientation: 'Vertical', color: 'Blue', rating: 4.8, reviews: 22, image: img('photo-1550684848-fac1c5b4e853'), verified: true, freeShipping: false, certificate: true, year: '2024', inStock: true, story: 'The interplay of deep indigo and midnight blue creates a sense of peaceful solitude. This contemporary piece draws inspiration from nocturnal landscapes and the meditative quality of darkness.', location: 'Pune, India', featured: false },
  { id: 7, name: 'Silent Conversations', artist: 'Arjun Malhotra', artistAvatar: AVATARS[4], price: '₹ 68,000', medium: 'Mixed Media', style: 'Abstract', subject: 'Portrait', size: 'Oversized', dimensions: '48 × 60 in', orientation: 'Vertical', color: 'Earth Tone', rating: 4.9, reviews: 28, image: img('photo-1541701494587-cb58502866ab'), badge: 'Bestseller', verified: true, freeShipping: true, certificate: true, year: '2025', inStock: true, story: 'This oversized mixed media portrait captures unspoken emotions through layered textures and earth tones. The artist combines charcoal, acrylic, and found materials to create depth that invites prolonged contemplation.', location: 'Delhi, India', featured: true },
  { id: 8, name: 'Morning Raga', artist: 'Ananya Das', artistAvatar: AVATARS[1], price: '₹ 22,000', medium: 'Watercolor', style: 'Traditional', subject: 'Spiritual', size: 'Small', dimensions: '18 × 24 in', orientation: 'Vertical', color: 'Orange', rating: 4.4, reviews: 9, image: img('photo-1579783902614-a3fb3927b6a5'), verified: true, freeShipping: true, certificate: false, year: '2024', inStock: true, story: 'Inspired by the morning ragas of Indian classical music, this watercolor translates auditory beauty into visual poetry. Warm oranges and saffrons evoke the first light of dawn and the meditative quality of morning prayers.', location: 'Kolkata, India', featured: false },
  { id: 9, name: 'Fractured Light', artist: 'Nisha Gupta', artistAvatar: AVATARS[3], price: '₹ 31,000', medium: 'Photography', style: 'Modern', subject: 'Architecture', size: 'Medium', dimensions: '24 × 36 in', orientation: 'Horizontal', color: 'White', rating: 4.7, reviews: 16, image: img('photo-1513364776144-60967b0f800f'), badge: 'New', verified: true, freeShipping: false, certificate: true, year: '2025', inStock: true, story: 'A fine art photograph capturing fractured light through architectural glass. Shot on medium format film and printed on archival Hahnemühle paper, this piece transforms ordinary light into extraordinary visual poetry.', location: 'Mumbai, India', featured: false },
  { id: 10, name: 'Sacred Geometry', artist: 'Vikram Singh', artistAvatar: AVATARS[6], price: '₹ 75,000', originalPrice: '₹ 85,000', medium: 'Mixed Media', style: 'Abstract', subject: 'Spiritual', size: 'Large', dimensions: '36 × 48 in', orientation: 'Square', color: 'Gold', rating: 4.9, reviews: 35, image: img('photo-1544413660-299165566b1d'), verified: true, freeShipping: true, certificate: true, year: '2024', inStock: true, story: 'This masterpiece explores the mathematical beauty underlying all natural forms. Using gold leaf, metallic pigments, and precise geometric construction, the artist reveals the hidden order that connects galaxies to seashells.', location: 'Bangalore, India', featured: true },
];

const REVIEWS = [
  { id: 1, name: 'Meera Kapoor', avatar: AVATARS[1], rating: 5, date: '2 weeks ago', title: 'Absolutely stunning in person', text: 'The photos don\'t do this justice. The gold leaf work catches light beautifully and the texture is incredible. Our interior designer was speechless when she saw it hung in our living room.', helpful: 24, verified: true },
  { id: 2, name: 'Rajesh Menon', avatar: AVATARS[2], rating: 5, date: '1 month ago', title: 'Museum-quality artwork', text: 'I\'ve been collecting art for 15 years and this piece rivals anything I\'ve seen in galleries. The certificate of authenticity and the packaging were both excellent. Shipping was well within the estimated window.', helpful: 18, verified: true },
  { id: 3, name: 'Sonia Patel', avatar: AVATARS[3], rating: 4, date: '3 weeks ago', title: 'Beautiful piece, minor issue', text: 'The artwork itself is gorgeous and exactly as described. Took one star off because the hanging hardware could be better quality. TIA Creations customer service sent me upgraded hardware within 2 days though.', helpful: 11, verified: true },
  { id: 4, name: 'Arvind Kumar', avatar: AVATARS[4], rating: 5, date: '2 months ago', title: 'Perfect anniversary gift', text: 'Bought this for my wife and she was moved to tears. The craftsmanship is extraordinary and you can feel the artist\'s passion in every brushstroke. Will definitely be buying more from this platform.', helpful: 32, verified: true },
];

const SIZE_GUIDE = [
  { size: 'Small', dims: '16 × 20 in', fits: 'Bedrooms, entryways, gallery walls' },
  { size: 'Medium', dims: '24 × 36 in', fits: 'Living rooms, offices' },
  { size: 'Large', dims: '36 × 48 in', fits: 'Feature walls, above sofas' },
  { size: 'Oversized', dims: '48 × 60+ in', fits: 'Statement walls, lofts' },
];

const ArtworkDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);
  const [liked, setLiked] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState('story');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [relatedTab, setRelatedTab] = useState('similar');
  const [quantity, setQuantity] = useState(1);
  const [frameOption, setFrameOption] = useState('none');
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const mainImageRef = useRef(null);

  useEffect(() => {
    const found = MOCK_ARTWORKS.find(a => a.id === parseInt(id));
    setArtwork(found || MOCK_ARTWORKS[0]);
    setSelectedImage(0);
    setZoomed(false);
    setFullscreen(false);
    window.scrollTo(0, 0);
  }, [id]);

  const handleZoom = useCallback(() => {
    setZoomed(prev => !prev);
  }, []);

  const handleFullscreen = useCallback(() => {
    setFullscreen(prev => !prev);
  }, []);

  const toggleAccordion = useCallback((section) => {
    setOpenAccordion(prev => prev === section ? null : section);
  }, []);

  const relatedArtworks = MOCK_ARTWORKS.filter(a => a.id !== artwork?.id).slice(0, 4);

  if (!artwork) {
    return (
      <main className="detail-page">
        <div className="detail-loading">
          <div className="detail-loading__spinner" />
          <p>Loading artwork...</p>
        </div>
      </main>
    );
  }

  const images = [artwork.image, img('photo-1541961017774-22349e4a1262', 800), img('photo-1579783902614-a3fb3927b6a5', 800)];

  return (
    <main className="detail-page">
      {/* ── Breadcrumb ── */}
      <motion.nav className="detail-breadcrumb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="detail-breadcrumb__inner">
          <Link to="/">Home</Link>
          <ChevronRight size={12} />
          <Link to="/shop">Artworks</Link>
          <ChevronRight size={12} />
          <Link to="/shop">{artwork.style}</Link>
          <ChevronRight size={12} />
          <span className="detail-breadcrumb--active">{artwork.name}</span>
        </div>
      </motion.nav>

      {/* ── Main Gallery + Info ── */}
      <section className="detail-main">
        <div className="detail-main__inner">
          {/* ── Gallery ── */}
          <motion.div className="detail-gallery" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}>
            <div className="detail-gallery__main" ref={mainImageRef}>
              <div className={`detail-gallery__img-wrap ${zoomed ? 'detail-gallery__img-wrap--zoomed' : ''}`} onClick={handleZoom}>
                <img src={images[selectedImage]} alt={artwork.name} className="detail-gallery__img" />
                <div className="detail-gallery__img-overlay">
                  <button className="detail-gallery__zoom-btn" onClick={(e) => { e.stopPropagation(); handleZoom(); }}>
                    {zoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
                  </button>
                  <button className="detail-gallery__fullscreen-btn" onClick={(e) => { e.stopPropagation(); handleFullscreen(); }}>
                    {fullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                </div>
                {artwork.badge && (
                  <span className={`detail-gallery__badge detail-gallery__badge--${artwork.badge.toLowerCase().replace(/[^a-z]/g, '')}`}>
                    {artwork.badge}
                  </span>
                )}
                <button className={`detail-gallery__heart ${liked ? 'detail-gallery__heart--on' : ''}`} onClick={() => setLiked(!liked)} aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}>
                  <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            <div className="detail-gallery__thumbs">
              {images.map((imgSrc, i) => (
                <button key={i} className={`detail-gallery__thumb ${selectedImage === i ? 'detail-gallery__thumb--active' : ''}`} onClick={() => setSelectedImage(i)}>
                  <img src={imgSrc} alt={`${artwork.name} view ${i + 1}`} />
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── Info Panel ── */}
          <motion.div className="detail-info" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}>
            <div className="detail-info__top">
              <div className="detail-info__artist-row">
                <img src={artwork.artistAvatar} alt={artwork.artist} className="detail-info__avatar" />
                <div>
                  <span className="detail-info__artist-name">
                    {artwork.artist}
                    {artwork.verified && <span className="detail-info__verified"><CheckCircle size={14} /></span>}
                  </span>
                  <span className="detail-info__location"><MapPin size={11} /> {artwork.location}</span>
                </div>
                <button className="detail-info__follow-btn">Follow</button>
              </div>

              <h1 className="detail-info__title">{artwork.name}</h1>

              <div className="detail-info__meta">
                <div className="detail-info__rating">
                  <Star size={16} fill="var(--gold)" stroke="none" />
                  <span>{artwork.rating}</span>
                  <span className="detail-info__reviews-count">({artwork.reviews} reviews)</span>
                </div>
                <span className="detail-info__meta-sep">·</span>
                <span className="detail-info__year"><Calendar size={13} /> {artwork.year}</span>
                <span className="detail-info__meta-sep">·</span>
                <span className="detail-info__medium-tag">{artwork.medium}</span>
              </div>

              <div className="detail-info__pricing">
                <span className="detail-info__price">{artwork.price}</span>
                {artwork.originalPrice && (
                  <>
                    <span className="detail-info__original-price">{artwork.originalPrice}</span>
                    <span className="detail-info__discount">Save {Math.round((1 - parseInt(artwork.price.replace(/[^\d]/g, '')) / parseInt(artwork.originalPrice.replace(/[^\d]/g, ''))) * 100)}%</span>
                  </>
                )}
              </div>

              <div className="detail-info__tags">
                <span className="detail-info__tag">{artwork.medium}</span>
                <span className="detail-info__tag">{artwork.style}</span>
                <span className="detail-info__tag">{artwork.subject}</span>
                <span className="detail-info__tag">{artwork.dimensions}</span>
                {artwork.certificate && <span className="detail-info__tag detail-info__tag--cert"><FileCheck size={11} /> Certified</span>}
              </div>
            </div>

            {/* ── Frame Options ── */}
            <div className="detail-info__section">
              <h4 className="detail-info__section-title">Frame Options</h4>
              <div className="detail-info__frame-options">
                {[
                  { value: 'none', label: 'No Frame', desc: 'Canvas only' },
                  { value: 'black', label: 'Black Frame', desc: '+₹ 3,500' },
                  { value: 'gold', label: 'Gold Frame', desc: '+₹ 5,000' },
                  { value: 'white', label: 'White Frame', desc: '+₹ 3,500' },
                ].map(opt => (
                  <button key={opt.value} className={`detail-info__frame-btn ${frameOption === opt.value ? 'detail-info__frame-btn--active' : ''}`} onClick={() => setFrameOption(opt.value)}>
                    <span className="detail-info__frame-label">{opt.label}</span>
                    <span className="detail-info__frame-desc">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Quantity + Add to Cart ── */}
            <div className="detail-info__actions">
              <div className="detail-info__quantity">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(5, q + 1))} disabled={quantity >= 5}>+</button>
              </div>

              <button className="detail-info__add-to-cart btn-gold">
                <Package size={16} />
                Add to Cart
              </button>

              <button className="detail-info__wishlist-btn" onClick={() => setLiked(!liked)}>
                <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
              </button>

              <button className="detail-info__share-btn">
                <Share2 size={18} />
              </button>
            </div>

            {!artwork.inStock && (
              <div className="detail-info__out-of-stock">
                <Clock size={14} />
                <span>This artwork is currently sold out. Join the waitlist to be notified when it becomes available.</span>
                <button className="btn-ghost">JOIN WAITLIST</button>
              </div>
            )}

            {/* ── Trust Badges ── */}
            <div className="detail-info__trust">
              {artwork.freeShipping && (
                <div className="detail-info__trust-item">
                  <Truck size={16} />
                  <div>
                    <strong>Free Shipping</strong>
                    <span>Complimentary delivery within 7-10 business days</span>
                  </div>
                </div>
              )}
              {artwork.certificate && (
                <div className="detail-info__trust-item">
                  <Award size={16} />
                  <div>
                    <strong>Certificate of Authenticity</strong>
                    <span>Verified provenance with artist signature</span>
                  </div>
                </div>
              )}
              <div className="detail-info__trust-item">
                <RotateCcw size={16} />
                <div>
                  <strong>7-Day Returns</strong>
                  <span>Hassle-free return policy</span>
                </div>
              </div>
              <div className="detail-info__trust-item">
                <Shield size={16} />
                <div>
                  <strong>Secure Payment</strong>
                  <span>Bank-grade encryption</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Artist Profile ── */}
      <section className="detail-artist">
        <div className="detail-artist__inner">
          <div className="detail-artist__card">
            <img src={artwork.artistAvatar} alt={artwork.artist} className="detail-artist__avatar" />
            <div className="detail-artist__info">
              <h3 className="detail-artist__name">
                {artwork.artist}
                {artwork.verified && <span className="detail-artist__verified"><CheckCircle size={16} /></span>}
              </h3>
              <p className="detail-artist__location"><MapPin size={13} /> {artwork.location}</p>
              <div className="detail-artist__stats">
                <span><Star size={13} fill="var(--gold)" stroke="none" /> {artwork.rating} Rating</span>
                <span>{MOCK_ARTWORKS.filter(a => a.artist === artwork.artist).length} Artworks</span>
                <span>Member since {artwork.year}</span>
              </div>
              <p className="detail-artist__bio">
                A passionate contemporary artist exploring the intersection of tradition and modernity. 
                Their work has been featured in galleries across India and internationally, 
                earning recognition for its unique blend of cultural heritage and contemporary expression.
              </p>
              <div className="detail-artist__actions">
                <button className="btn-primary"><span>VIEW ARTIST PROFILE</span></button>
                <button className="btn-ghost"><MessageCircle size={14} /> MESSAGE ARTIST</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Accordion Sections ── */}
      <section className="detail-accordion">
        <div className="detail-accordion__inner">
          {[
            { key: 'story', icon: <Info size={18} />, title: 'The Story Behind This Artwork', content: (
              <div className="detail-accordion__story">
                <p>{artwork.story}</p>
                <div className="detail-accordion__story-meta">
                  <div><strong>Medium:</strong> {artwork.medium}</div>
                  <div><strong>Dimensions:</strong> {artwork.dimensions}</div>
                  <div><strong>Year:</strong> {artwork.year}</div>
                  <div><strong>Subject:</strong> {artwork.subject}</div>
                  <div><strong>Style:</strong> {artwork.style}</div>
                </div>
              </div>
            )},
            { key: 'certificate', icon: <FileCheck size={18} />, title: 'Certificate of Authenticity', content: (
              <div className="detail-accordion__certificate">
                <div className="detail-accordion__cert-badge">
                  <Award size={48} />
                  <span>Verified Original</span>
                </div>
                <p>Every artwork on TIA Creations comes with a Certificate of Authenticity, verifying it as an original creation by the listed artist. The certificate includes:</p>
                <ul>
                  <li>Artist signature and edition details</li>
                  <li>High-resolution image of the artwork</li>
                  <li>Materials and techniques used</li>
                  <li>Provenance and exhibition history</li>
                  <li>QR code linking to digital verification</li>
                </ul>
              </div>
            )},
            { key: 'shipping', icon: <Truck size={18} />, title: 'Shipping & Delivery', content: (
              <div className="detail-accordion__shipping">
                <div className="detail-accordion__shipping-options">
                  <div className="detail-accordion__shipping-option">
                    <Truck size={20} />
                    <div>
                      <strong>Standard Delivery</strong>
                      <span>7-10 business days · {artwork.freeShipping ? 'FREE' : '₹ 999'}</span>
                    </div>
                  </div>
                  <div className="detail-accordion__shipping-option">
                    <Package size={20} />
                    <div>
                      <strong>Express Delivery</strong>
                      <span>3-5 business days · ₹ 1,999</span>
                    </div>
                  </div>
                </div>
                <div className="detail-accordion__shipping-notes">
                  <p><strong>Packaging:</strong> Museum-grade protective packaging with acid-free materials</p>
                  <p><strong>Tracking:</strong> Real-time tracking provided for all shipments</p>
                  <p><strong>Insurance:</strong> Full transit insurance included</p>
                </div>
              </div>
            )},
          ].map(section => (
            <div key={section.key} className={`detail-accordion__item ${openAccordion === section.key ? 'detail-accordion__item--open' : ''}`}>
              <button className="detail-accordion__trigger" onClick={() => toggleAccordion(section.key)}>
                <span className="detail-accordion__trigger-left">
                  {section.icon}
                  {section.title}
                </span>
                <span className="detail-accordion__trigger-right">
                  {openAccordion === section.key ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </button>
              <AnimatePresence>
                {openAccordion === section.key && (
                  <motion.div className="detail-accordion__content" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}>
                    {section.content}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="detail-reviews">
        <div className="detail-reviews__inner">
          <div className="detail-reviews__header">
            <div>
              <span className="section-eyebrow">Collector Reviews</span>
              <h2 className="detail-reviews__title">What Collectors Say</h2>
            </div>
            <div className="detail-reviews__summary">
              <div className="detail-reviews__avg">
                <span className="detail-reviews__avg-num">{artwork.rating}</span>
                <div className="detail-reviews__avg-stars">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={14} fill={s <= Math.round(artwork.rating) ? 'var(--gold)' : 'none'} stroke={s <= Math.round(artwork.rating) ? 'none' : 'var(--border)'} />
                  ))}
                </div>
                <span className="detail-reviews__avg-count">{artwork.reviews} reviews</span>
              </div>
            </div>
          </div>

          <div className="detail-reviews__list">
            {REVIEWS.map((review, i) => (
              <motion.div key={review.id} className="detail-reviews__card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="detail-reviews__card-header">
                  <img src={review.avatar} alt={review.name} className="detail-reviews__avatar" />
                  <div>
                    <span className="detail-reviews__name">{review.name}</span>
                    <div className="detail-reviews__card-meta">
                      <div className="detail-reviews__stars">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} size={11} fill={s <= review.rating ? 'var(--gold)' : 'none'} stroke={s <= review.rating ? 'none' : 'var(--border)'} />
                        ))}
                      </div>
                      <span>{review.date}</span>
                      {review.verified && <span className="detail-reviews__verified"><CheckCircle size={10} /> Verified Purchase</span>}
                    </div>
                  </div>
                </div>
                <h4 className="detail-reviews__card-title">{review.title}</h4>
                <p className="detail-reviews__card-text">{review.text}</p>
                <div className="detail-reviews__card-footer">
                  <button className="detail-reviews__helpful"><ThumbsUp size={12} /> Helpful ({review.helpful})</button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Write Review ── */}
          <div className="detail-reviews__write">
            <h3>Write a Review</h3>
            <div className="detail-reviews__write-rating">
              <span>Your Rating:</span>
              <div className="detail-reviews__write-stars">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setReviewRating(s)}>
                    <Star size={20} fill={s <= reviewRating ? 'var(--gold)' : 'none'} stroke={s <= reviewRating ? 'none' : 'var(--border)'} />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              className="detail-reviews__write-input"
              placeholder="Share your experience with this artwork..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
            />
            <button className="detail-reviews__submit btn-primary" disabled={!reviewText.trim()}>
              <span><Send size={14} /> SUBMIT REVIEW</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Related Artworks ── */}
      <section className="detail-related">
        <div className="detail-related__inner">
          <div className="detail-related__header">
            <span className="section-eyebrow">You May Also Love</span>
            <h2 className="detail-related__title">Related Artworks</h2>
          </div>
          <div className="detail-related__tabs">
            {['similar', 'same-artist', 'trending'].map(tab => (
              <button key={tab} className={`detail-related__tab ${relatedTab === tab ? 'detail-related__tab--active' : ''}`} onClick={() => setRelatedTab(tab)}>
                {tab === 'similar' ? 'Similar Style' : tab === 'same-artist' ? 'Same Artist' : 'Trending Now'}
              </button>
            ))}
          </div>
          <div className="detail-related__grid">
            {relatedArtworks.map((art, i) => (
              <ArtworkCard key={art.id} artwork={art} index={i} />
            ))}
          </div>
          <div className="detail-related__cta">
            <Link to="/shop" className="btn-ghost">VIEW ALL ARTWORKS <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="detail-newsletter">
        <div className="detail-newsletter__inner">
          <div className="detail-newsletter__content">
            <span className="section-eyebrow">Stay Inspired</span>
            <h2 className="detail-newsletter__title">Join Our Collector's Circle</h2>
            <p className="detail-newsletter__desc">Get early access to new arrivals, exclusive collections, and curated art recommendations delivered to your inbox.</p>
            <form className="detail-newsletter__form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email address" className="detail-newsletter__input" />
              <button type="submit" className="detail-newsletter__submit btn-gold">SUBSCRIBE</button>
            </form>
            <span className="detail-newsletter__note">Join 12,000+ art enthusiasts. Unsubscribe anytime.</span>
          </div>
        </div>
      </section>

      {/* ── Mobile Sticky Bar ── */}
      <div className="detail-mobile-bar">
        <div className="detail-mobile-bar__price">
          <span className="detail-mobile-bar__price-val">{artwork.price}</span>
          {artwork.originalPrice && <span className="detail-mobile-bar__price-old">{artwork.originalPrice}</span>}
        </div>
        <div className="detail-mobile-bar__actions">
          <button className="detail-mobile-bar__cart btn-gold">
            <Package size={16} />
            Add to Cart
          </button>
          <button className="detail-mobile-bar__wishlist" onClick={() => setLiked(!liked)}>
            <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* ── Fullscreen Overlay ── */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div className="detail-fullscreen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleFullscreen}>
            <button className="detail-fullscreen__close" onClick={handleFullscreen}><X size={24} /></button>
            <img src={images[selectedImage]} alt={artwork.name} className="detail-fullscreen__img" />
            <div className="detail-fullscreen__nav">
              <button onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => (prev - 1 + images.length) % images.length); }}><ArrowLeft size={24} /></button>
              <button onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => (prev + 1) % images.length); }}><ArrowRight size={24} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Size Guide Modal ── */}
      <AnimatePresence>
        {showSizeGuide && (
          <motion.div className="detail-size-guide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSizeGuide(false)}>
            <motion.div className="detail-size-guide__modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <button className="detail-size-guide__close" onClick={() => setShowSizeGuide(false)}><X size={18} /></button>
              <h3>Size Guide</h3>
              <table className="detail-size-guide__table">
                <thead>
                  <tr><th>Size</th><th>Dimensions</th><th>Best For</th></tr>
                </thead>
                <tbody>
                  {SIZE_GUIDE.map(row => (
                    <tr key={row.size}><td>{row.size}</td><td>{row.dims}</td><td>{row.fits}</td></tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default ArtworkDetailPage;
