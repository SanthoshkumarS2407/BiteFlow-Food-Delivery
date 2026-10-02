import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Order } from '../types';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import DeliveryTrackingMap from '../components/DeliveryTrackingMap';

interface Props { orderId: number; }

interface TrackingStep {
  key: string;
  icon: string;
  label: string;
  desc: string;
}

const TRACKING_STAGES: TrackingStep[] = [
  { key: 'PLACED', icon: '📋', label: 'Order Placed', desc: 'Received & sent to restaurant' },
  { key: 'CONFIRMED', icon: '👨‍🍳', label: 'Restaurant Confirmed', desc: 'Kitchen accepted your order' },
  { key: 'PREPARING', icon: '🍳', label: 'Preparing Food', desc: 'Master chef is cooking fresh' },
  { key: 'READY_FOR_PICKUP', icon: '📦', label: 'Ready for Pickup', desc: 'Packed & delivery partner assigned' },
  { key: 'OUT_FOR_DELIVERY', icon: '🛵', label: 'Out for Delivery', desc: 'Driver is on the way to you' },
  { key: 'DELIVERED', icon: '🎉', label: 'Delivered', desc: 'Enjoy your hot meal!' },
];

function getStageIndex(status?: string): number {
  if (!status) return 0;
  const s = status.toUpperCase();
  if (s === 'PLACED' || s === 'PENDING') return 0;
  if (s === 'CONFIRMED') return 1;
  if (s === 'PREPARING') return 2;
  if (s === 'READY_FOR_PICKUP' || s === 'READY' || s === 'DELIVERY_ASSIGNED' || s === 'GOING_TO_RESTAURANT' || s === 'ARRIVED_AT_RESTAURANT') return 3;
  if (s === 'FOOD_PICKED_UP' || s === 'PICKED UP' || s === 'OUT_FOR_DELIVERY' || s === 'OUT FOR DELIVERY' || s === 'ARRIVED_AT_CUSTOMER') return 4;
  if (s === 'DELIVERED') return 5;
  return 0;
}

export const OrderTracking: React.FC<Props> = ({ orderId }) => {
  const { token, navigateTo } = useApp();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrder = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        const s = (data.status || '').toUpperCase();
        if (s === 'DELIVERED') {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();

    // 1. Socket.IO Real-time Subscription
    let socket: ReturnType<typeof io> | null = null;
    try {
      socket = io();
      socket.emit('join_order', orderId);
      socket.on('order_status_update', (data: { order_id?: number; id?: number; status: string; delivery_partner?: string; delivery_partner_phone?: string }) => {
        const oId = data.order_id || data.id;
        if (oId === orderId) {
          setOrder(prev => prev ? {
            ...prev,
            status: data.status as Order['status'],
            delivery_partner: data.delivery_partner || prev.delivery_partner,
            delivery_partner_phone: data.delivery_partner_phone || prev.delivery_partner_phone
          } : null);
          toast('info', `Order Status Update: ${data.status}`);
        }
      });
    } catch {}

    // 2. Interval Polling Fallback (every 3 seconds for guaranteed freshness)
    pollRef.current = setInterval(fetchOrder, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (socket) socket.disconnect();
    };
  }, [orderId, token]);

  const currentStage = getStageIndex(order?.status);
  const isDelivered = (order?.status || '').toUpperCase() === 'DELIVERED';
  const isCancelled = (order?.status || '').toUpperCase() === 'CANCELLED' || (order?.status || '').toUpperCase() === 'CANCELLED_BY_RESTAURANT';

  if (loading) {
    return (
      <div className="page-container" style={{ paddingTop: '32px' }}>
        <div className="skeleton" style={{ height: '32px', width: '200px', marginBottom: '24px' }} />
        <div className="skeleton" style={{ height: '300px', borderRadius: '16px' }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="empty-state" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <div className="empty-state-icon" style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
        <p className="empty-state-title" style={{ fontSize: 18, fontWeight: 700 }}>Order not found</p>
        <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => navigateTo('order-history')}>View All Orders</button>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ paddingTop: '24px', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 13, border: '1px solid var(--border-color)', borderRadius: 8 }} onClick={() => navigateTo('home')}>
            ← Home
          </button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Order #{order.order_code || ('BF' + (100000 + order.id))}
            </h1>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Placed at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.restaurant_name}
            </span>
          </div>
        </div>

        <span style={{
          padding: '6px 14px',
          borderRadius: 20,
          fontWeight: 800,
          fontSize: 13,
          background: isDelivered ? '#dcfce7' : isCancelled ? '#fee2e2' : '#fed7aa',
          color: isDelivered ? '#16a34a' : isCancelled ? '#dc2626' : '#c2410c'
        }}>
          {order.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Tracking and Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Cancellation Notice Banner */}
          {isCancelled && (
            <div style={{ background: '#fee2e2', border: '1px solid #f87171', borderRadius: 12, padding: 18, color: '#b91c1c' }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Order Cancelled</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Reason: <strong>{order.cancel_reason || 'Restaurant was unable to accept this order at this time.'}</strong>
              </div>
              <div style={{ fontSize: 12, marginTop: 8, color: '#7f1d1d' }}>
                Any online payment has been refunded to your original payment method.
              </div>
            </div>
          )}

          {/* Realistic Route Map */}
          {!isCancelled && (
            <DeliveryTrackingMap
              status={order.status}
              restaurantName={order.restaurant_name || 'BiteFlow Partner Kitchen'}
              customerAddress={order.address || 'Delivery Address, Coimbatore'}
              estimatedTime={order.estimated_time || '25-30 minutes'}
              distance="2.4 km"
            />
          )}

          {/* Section 13: 6-Stage Customer Stepper */}
          {!isCancelled && (
            <div style={{ background: 'var(--surface-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>
                Live Delivery Tracker
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
                {TRACKING_STAGES.map((stage, idx) => {
                  const isDone = currentStage > idx;
                  const isCurrent = currentStage === idx;
                  const isUpcoming = currentStage < idx;

                  return (
                    <div key={stage.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, position: 'relative' }}>
                      {/* Connecting Line */}
                      {idx < TRACKING_STAGES.length - 1 && (
                        <div style={{
                          position: 'absolute',
                          left: 17,
                          top: 36,
                          width: 2,
                          height: 'calc(100% - 20px)',
                          background: isDone ? '#16a34a' : 'var(--border-color)',
                          zIndex: 1
                        }} />
                      )}

                      {/* Icon Circle */}
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: isDone ? '#16a34a' : isCurrent ? 'var(--primary)' : 'var(--surface-input)',
                        color: isDone || isCurrent ? '#ffffff' : 'var(--text-secondary)',
                        border: isCurrent ? '3px solid #fed7aa' : isUpcoming ? '2px solid var(--border-color)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isDone ? 16 : 14,
                        fontWeight: 800,
                        zIndex: 2,
                        flexShrink: 0
                      }}>
                        {isDone ? '✓' : isCurrent ? '●' : '○'}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, paddingTop: 6 }}>
                        <div style={{
                          fontSize: 15,
                          fontWeight: isCurrent ? 800 : isDone ? 700 : 500,
                          color: isCurrent ? 'var(--primary)' : isDone ? 'var(--text-primary)' : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          <span>{stage.label}</span>
                          {isCurrent && <span style={{ fontSize: 11, background: '#fed7aa', color: '#c2410c', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>In Progress</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {stage.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Delivery Partner Info Card */}
          {order.delivery_partner && !isCancelled && (
            <div style={{ background: 'var(--surface-card)', borderRadius: 14, padding: 18, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>
                  🛵
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>Delivery Partner</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{order.delivery_partner}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>⭐ 4.8 Rating • Vaccinated & Sanitized</div>
                </div>
              </div>
              <a
                href={`tel:${order.delivery_partner_phone || '9876543210'}`}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: '#dcfce7',
                  color: '#16a34a',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                📞 Call Driver
              </a>
            </div>
          )}
        </div>

        {/* Right Column: Order Details & Receipt */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Order Summary Receipt */}
          <div style={{ background: 'var(--surface-card)', borderRadius: 16, padding: 22, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14 }}>
              Order Bill Receipt
            </h3>

            {/* Items */}
            <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
              {(order.items || []).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {item.image && (
                      <img src={item.image} alt={item.food_name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                    )}
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.food_name}</span>
                      <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>× {item.quantity}</span>
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: 'var(--border-color)', margin: '14px 0' }} />

            {/* Bill Breakdown */}
            <div style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Item Subtotal</span>
                <span>₹{order.subtotal || order.total}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Delivery Fee</span>
                <span>{order.delivery_fee === 0 ? <strong style={{ color: '#16a34a' }}>FREE</strong> : `₹${order.delivery_fee}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Platform Fee</span>
                <span>₹{order.platform_fee || 5}</span>
              </div>
              {order.discount ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                  <span>Discount Applied</span>
                  <span>- ₹{order.discount}</span>
                </div>
              ) : null}
            </div>

            <div style={{ height: 1, background: 'var(--border-color)', margin: '14px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
              <span>Total Paid</span>
              <span style={{ color: 'var(--primary)' }}>₹{order.total}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'right', marginTop: 2 }}>
              Paid via {order.payment_method} ({order.payment_status || 'PAID'})
            </div>
          </div>

          {/* Delivery Address Card */}
          <div style={{ background: 'var(--surface-card)', borderRadius: 16, padding: 20, border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              🏠 Delivery Location
            </h4>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{order.customer_name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{order.address}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Phone: {order.phone || '9876500001'}</div>
          </div>

          {/* Rate & Review Button */}
          {isDelivered && (
            <button
              onClick={() => setShowRatingModal(true)}
              className="btn-primary"
              style={{ width: '100%', padding: '14px 20px', fontSize: 15, fontWeight: 800 }}
            >
              ⭐ Rate & Review Your Meal
            </button>
          )}

          <button
            onClick={() => navigateTo('order-history')}
            className="btn-secondary"
            style={{ width: '100%', padding: '10px 16px', fontSize: 13 }}
          >
            📋 View All Past Orders
          </button>
        </div>
      </div>

      {/* RATING MODAL */}
      {showRatingModal && (
        <RatingModal
          order={order}
          token={token!}
          onClose={() => setShowRatingModal(false)}
          onSubmit={() => {
            setShowRatingModal(false);
            toast('success', 'Thank you for your rating & review!');
          }}
        />
      )}
    </div>
  );
};

// ─── Rating Modal ─────────────────────────────────────────────────────────────
const RatingModal: React.FC<{
  order: Order;
  token: string;
  onClose: () => void;
  onSubmit: () => void;
}> = ({ order, token, onClose, onSubmit }) => {
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [foodRating, setFoodRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: order.id,
          restaurant_id: order.restaurant_id || 1,
          restaurant_rating: restaurantRating,
          food_rating: foodRating,
          delivery_rating: deliveryRating,
          comment
        })
      });
      if (res.ok) onSubmit();
    } catch {}
    setSubmitting(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: 'var(--surface-card)', borderRadius: 16, width: '100%', maxWidth: 460, padding: 26, boxShadow: 'var(--shadow-xl)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14 }}>
          Rate Order #{order.order_code || order.id}
        </h3>
        <form onSubmit={handleSubmitReview}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Food Quality (1 to 5 Stars): {foodRating} ★
            </label>
            <input type="range" min="1" max="5" value={foodRating} onChange={e => setFoodRating(Number(e.target.value))} style={{ width: '100%' }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Restaurant Service: {restaurantRating} ★
            </label>
            <input type="range" min="1" max="5" value={restaurantRating} onChange={e => setRestaurantRating(Number(e.target.value))} style={{ width: '100%' }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Delivery Partner Rating: {deliveryRating} ★
            </label>
            <input type="range" min="1" max="5" value={deliveryRating} onChange={e => setDeliveryRating(Number(e.target.value))} style={{ width: '100%' }} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Comments / Feedback
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Tell us about the taste, packaging, and delivery speed..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '8px 20px' }}>
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderTracking;
