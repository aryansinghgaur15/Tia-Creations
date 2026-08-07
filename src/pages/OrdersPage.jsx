import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package, Search, FileText, Truck, Clock, CheckCircle, XCircle,
  MapPin, ChevronRight, ArrowRight, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

const IMG = (id, w = 120) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const FILTERS = ['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const MOCK_ORDERS = [
  {
    id: 'TIA-2025-0421',
    date: 'April 21, 2025',
    status: 'Shipped',
    items: [{ name: 'Whispers of Gold', artist: 'Rhea Nair', image: IMG('photo-1541961017774-22349e4a1262') }],
    total: '₹ 45,000',
    tracking: true,
    invoice: true,
    eta: 'Apr 28 – May 2',
  },
  {
    id: 'TIA-2025-0418',
    date: 'April 18, 2025',
    status: 'Delivered',
    items: [{ name: 'Beyond Horizons', artist: 'Vikram Iyer', image: IMG('photo-1493246507139-91e8fad9978e') }],
    total: '₹ 38,000',
    tracking: false,
    invoice: true,
    deliveredDate: 'April 24, 2025',
  },
  {
    id: 'TIA-2025-0403',
    date: 'April 3, 2025',
    status: 'Processing',
    items: [
      { name: 'Eternal Bloom', artist: 'Kavita Singh', image: IMG('photo-1590055531615-f16d36ffe8ea') },
      { name: 'Morning Raga', artist: 'Ananya Das', image: IMG('photo-1579783902614-a3fb3927b6a5') },
    ],
    total: '₹ 50,000',
    tracking: false,
    invoice: false,
  },
  {
    id: 'TIA-2025-0322',
    date: 'March 22, 2025',
    status: 'Delivered',
    items: [{ name: 'Golden Aura', artist: 'Rahul Mehta', image: IMG('photo-1515405295579-ba7b45403062') }],
    total: '₹ 52,000',
    tracking: false,
    invoice: true,
    deliveredDate: 'March 30, 2025',
  },
  {
    id: 'TIA-2025-0310',
    date: 'March 10, 2025',
    status: 'Cancelled',
    items: [{ name: 'Silent Conversations', artist: 'Arjun Malhotra', image: IMG('photo-1541701494587-cb58502866ab') }],
    total: '₹ 68,000',
    tracking: false,
    invoice: false,
    reason: 'Requested by customer',
  },
];

const STATUS_COLORS = {
  Processing: 'processing',
  Shipped: 'shipped',
  Delivered: 'delivered',
  Cancelled: 'cancelled',
};

const STATUS_ICONS = {
  Processing: <Clock size={14} />,
  Shipped: <Truck size={14} />,
  Delivered: <CheckCircle size={14} />,
  Cancelled: <XCircle size={14} />,
};

const OrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return; }
  }, [user, navigate]);

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'All') return MOCK_ORDERS;
    return MOCK_ORDERS.filter(o => o.status === activeFilter);
  }, [activeFilter]);

  if (!user) return null;

  return (
    <main className="orders-page">
      <section className="orders-hero">
        <div className="orders-hero__inner">
          <div className="orders-hero__breadcrumb">
            <Link to="/">Home</Link><span>/</span><span className="orders-hero__breadcrumb--active">My Orders</span>
          </div>
          <motion.h1 className="orders-hero__title" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            Order <em className="accent-text">History</em>
          </motion.h1>
          <motion.p className="orders-hero__subtitle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }}>
            Track, manage, and review all your purchases
          </motion.p>
        </div>
      </section>

      <div className="orders-inner">
        <div className="orders-filters">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`orders-filter-btn ${activeFilter === f ? 'orders-filter-btn--active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
              {f !== 'All' && MOCK_ORDERS.filter(o => o.status === f).length > 0 && (
                <span className="orders-filter-btn__count">{MOCK_ORDERS.filter(o => o.status === f).length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="orders-list">
          <AnimatePresence mode="wait">
            {filteredOrders.length > 0 ? (
              <motion.div
                key={activeFilter}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="orders-list__inner"
              >
                {filteredOrders.map((order, i) => (
                  <motion.div
                    key={order.id}
                    className="orders-card"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <div className="orders-card__header">
                      <div className="orders-card__meta">
                        <span className="orders-card__id">Order #{order.id}</span>
                        <span className="orders-card__date">{order.date}</span>
                      </div>
                      <span className={`order-status order-status--${STATUS_COLORS[order.status]}`}>
                        {STATUS_ICONS[order.status]}
                        {order.status}
                      </span>
                    </div>

                    <div className="orders-card__items">
                      {order.items.map((item, j) => (
                        <div key={j} className="orders-card__item">
                          <div className="orders-card__item-img-wrap">
                            <img src={item.image} alt={item.name} className="orders-card__item-img" />
                          </div>
                          <div className="orders-card__item-info">
                            <h4 className="orders-card__item-name">{item.name}</h4>
                            <span className="orders-card__item-artist">by {item.artist}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="orders-card__footer">
                      <div className="orders-card__total">
                        <span className="orders-card__total-label">Total</span>
                        <span className="orders-card__total-value">{order.total}</span>
                      </div>
                      <div className="orders-card__actions">
                        {order.tracking && (
                          <button className="btn-primary">
                            <Truck size={13} />
                            <span>Track</span>
                          </button>
                        )}
                        {order.invoice && (
                          <button className="btn-ghost">
                            <FileText size={13} />
                            <span>View Invoice</span>
                          </button>
                        )}
                        {order.status === 'Shipped' && order.eta && (
                          <span className="orders-card__eta">
                            <Clock size={12} /> Est. {order.eta}
                          </span>
                        )}
                        {order.status === 'Cancelled' && order.reason && (
                          <span className="orders-card__cancel-reason">
                            <AlertCircle size={12} /> {order.reason}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                className="orders-empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="orders-empty__icon">
                  <Package size={48} strokeWidth={1} />
                </div>
                <h2 className="orders-empty__title">No {activeFilter !== 'All' ? activeFilter.toLowerCase() : ''} orders found</h2>
                <p className="orders-empty__desc">
                  {activeFilter === 'All'
                    ? "You haven't placed any orders yet."
                    : `You don't have any ${activeFilter.toLowerCase()} orders at the moment.`}
                </p>
                <Link to="/shop" className="btn-primary">
                  <span>START SHOPPING</span>
                  <ArrowRight size={14} />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
};

export default OrdersPage;
