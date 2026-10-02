import React, { useState, useEffect, useCallback } from 'react';
import { Order, DeliveryPartner } from '../types';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';

export const DeliveryPartnerDashboard: React.FC = () => {
  const { user, token, navigateTo } = useApp();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed' | 'profile'>('available');
  const [partner, setPartner] = useState<DeliveryPartner | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const authHeaders = useCallback((): HeadersInit => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }), [token]);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/delivery/profile', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPartner(data);
      }
    } catch {}
  }, [token, authHeaders]);

  const fetchAvailable = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/delivery/available-orders', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAvailableOrders(data);
      }
    } catch {}
  }, [token, authHeaders]);

  const fetchActive = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/delivery/active-order', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setActiveOrder(data);
        if (data) {
          // If there is an active order, switch tab to active
          setActiveTab(prev => prev === 'available' ? 'active' : prev);
        }
      }
    } catch {}
  }, [token, authHeaders]);

  const fetchCompleted = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/delivery/completed-orders', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCompletedOrders(data);
      }
    } catch {}
  }, [token, authHeaders]);

  useEffect(() => {
    if (token) {
      setLoading(true);
      Promise.all([fetchProfile(), fetchAvailable(), fetchActive(), fetchCompleted()])
        .finally(() => setLoading(false));

      const interval = setInterval(() => {
        fetchAvailable();
        fetchActive();
        fetchCompleted();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [token, fetchProfile, fetchAvailable, fetchActive, fetchCompleted]);

  // Toggle Availability Switch
  const handleToggleOnline = async () => {
    if (!token || !partner) return;
    const nextAvail = partner.is_available ? 0 : 1;
    try {
      const res = await fetch('/api/delivery/availability', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ is_available: nextAvail })
      });
      if (res.ok) {
        setPartner(p => p ? { ...p, is_available: nextAvail } : null);
        toast('info', nextAvail ? '🟢 You are now ONLINE & ready to receive orders' : '⚪ You are now OFFLINE');
      }
    } catch {
      toast('error', 'Failed to update status');
    }
  };

  // Accept Order
  const handleAcceptDelivery = async (orderId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/delivery/accept/${orderId}`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        toast('success', 'Delivery Accepted!', 'Navigate to pickup point at restaurant');
        fetchActive();
        fetchAvailable();
        setActiveTab('active');
      } else {
        toast('error', data.error || 'Failed to accept order');
      }
    } catch {
      toast('error', 'Network error');
    }
  };

  // Progress Delivery Status
  const handleUpdateStatus = async (orderId: number, nextStatus: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/delivery/orders/${orderId}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        const statusMsgs: Record<string, string> = {
          'GOING_TO_RESTAURANT': 'En route to restaurant',
          'ARRIVED_AT_RESTAURANT': 'Arrived at restaurant location',
          'FOOD_PICKED_UP': 'Food package collected',
          'OUT_FOR_DELIVERY': 'Out for delivery to customer',
          'ARRIVED_AT_CUSTOMER': 'Arrived at customer door',
          'DELIVERED': 'Delivery completed! Payout credited to wallet.'
        };
        toast('success', statusMsgs[nextStatus] || 'Status updated', `Current: ${nextStatus}`);
        fetchActive();
        fetchCompleted();
        fetchProfile();
      }
    } catch {
      toast('error', 'Failed to update delivery status');
    }
  };

  if (!user || (user.role !== 'DELIVERY_PARTNER' && user.role !== 'ADMIN')) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: 32, background: 'var(--surface-card)', borderRadius: 16, textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🛵</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Delivery Partner Portal</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>You must be logged in as a registered Delivery Partner to view trips and manage live deliveries.</p>
        <button className="btn-primary" onClick={() => navigateTo('login')}>Log in as Delivery Partner</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading Delivery Partner Portal...</p>
      </div>
    );
  }

  const isOnline = partner?.is_available === 1;

  return (
    <div style={{ maxWidth: 1100, margin: '24px auto', padding: '0 20px 80px' }}>
      {/* Partner Status & KPI Header */}
      <div style={{ background: 'var(--surface-card)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, background: 'rgba(2, 132, 199, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
              🛵
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{user.name}</h1>
                <span style={{ fontSize: 13, background: 'rgba(234, 179, 8, 0.15)', color: '#b45309', padding: '3px 8px', borderRadius: 12, fontWeight: 700 }}>
                  ⭐ {partner?.rating || 4.8}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                Vehicle: {partner?.vehicle || 'Motorcycle'} ({partner?.vehicle_number || 'TN 09 AB 1234'}) • Phone: {partner?.phone || user.phone || 'N/A'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={handleToggleOnline}
              style={{
                padding: '10px 20px',
                borderRadius: 30,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                background: isOnline ? '#16a34a' : '#6b7280',
                color: '#ffffff',
                border: 'none',
                boxShadow: isOnline ? '0 4px 12px rgba(22, 163, 74, 0.3)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span>{isOnline ? '🟢 ONLINE' : '⚪ OFFLINE'}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-color)' }}>
          <div style={{ background: 'var(--surface-input)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Today's Earnings</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>₹{partner?.today_earnings || completedOrders.length * 45}</div>
          </div>
          <div style={{ background: 'var(--surface-input)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Completed Trips</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{completedOrders.length}</div>
          </div>
          <div style={{ background: 'var(--surface-input)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Active Delivery</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: activeOrder ? '#0284c7' : 'var(--text-secondary)', marginTop: 4 }}>
              {activeOrder ? '1 IN PROGRESS' : 'None'}
            </div>
          </div>
          <div style={{ background: 'var(--surface-input)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Available Orders Nearby</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: availableOrders.length > 0 ? '#fc8019' : 'var(--text-secondary)', marginTop: 4 }}>
              {availableOrders.length}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid var(--border-color)', marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { id: 'available', label: `Available Orders (${availableOrders.length})`, icon: '📦' },
          { id: 'active', label: `Active Delivery ${activeOrder ? '🔴' : ''}`, icon: '🛵' },
          { id: 'completed', label: `Completed Deliveries (${completedOrders.length})`, icon: '✅' },
          { id: 'profile', label: 'My Vehicle & Settings', icon: '⚙️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0',
              background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: AVAILABLE DELIVERIES */}
      {activeTab === 'available' && (
        <div>
          {!isOnline && (
            <div style={{ padding: 16, borderRadius: 12, background: 'rgba(234, 179, 8, 0.15)', border: '1px solid #eab308', color: '#b45309', marginBottom: 20, fontSize: 14, fontWeight: 600 }}>
              ⚠️ You are currently OFFLINE. Switch your status to <strong>ONLINE</strong> to receive and accept delivery tasks.
            </div>
          )}

          {availableOrders.length === 0 ? (
            <div style={{ background: 'var(--surface-card)', borderRadius: 16, padding: 60, textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>No Orders Ready for Pickup</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>When restaurants mark prepared orders as ready, they will instantly appear here for pickup.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {availableOrders.map(order => (
                <div
                  key={order.id}
                  style={{
                    background: 'var(--surface-card)',
                    borderRadius: 14,
                    padding: 22,
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                          Order #{order.order_code || `BF${100000 + order.id}`}
                        </span>
                        <span style={{ fontSize: 11, background: '#dcfce7', color: '#16a34a', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
                          READY FOR PICKUP
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                        Ordered {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {(order.items || []).length} items
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>
                        ₹45 payout
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Order Total: ₹{order.total}</div>
                    </div>
                  </div>

                  {/* Route Overview */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, background: 'var(--surface-input)', padding: 14, borderRadius: 10, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>📍 Pickup Point</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{order.restaurant_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{order.address || 'Restaurant Hub, Main Road'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>🏠 Delivery Drop</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{order.customer_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{order.address || 'Customer Residence'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      Est. distance: <strong>2.8 km</strong> • Est. time: <strong>22 min</strong>
                    </div>
                    <button
                      onClick={() => handleAcceptDelivery(order.id)}
                      disabled={!isOnline}
                      style={{
                        padding: '10px 24px',
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: isOnline ? 'pointer' : 'not-allowed',
                        background: isOnline ? '#16a34a' : '#9ca3af',
                        color: '#ffffff',
                        border: 'none',
                        boxShadow: isOnline ? '0 2px 8px rgba(22, 163, 74, 0.3)' : 'none'
                      }}
                    >
                      🛵 Accept Delivery
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE DELIVERY */}
      {activeTab === 'active' && (
        <div>
          {!activeOrder ? (
            <div style={{ background: 'var(--surface-card)', borderRadius: 16, padding: 60, textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛵</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>No Active Delivery</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>Go to the "Available Orders" tab to accept an incoming food delivery.</p>
              <button className="btn-primary" onClick={() => setActiveTab('available')}>Browse Available Orders</button>
            </div>
          ) : (
            <div style={{ background: 'var(--surface-card)', borderRadius: 16, padding: 24, border: '2px solid #0284c7', boxShadow: '0 4px 20px rgba(2, 132, 199, 0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <span style={{ fontSize: 12, background: '#e0f2fe', color: '#0284c7', padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>
                    ACTIVE TRIP
                  </span>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '6px 0 0' }}>
                    Order #{activeOrder.order_code || activeOrder.id}
                  </h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>₹45 payout</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Status: <strong>{activeOrder.status}</strong></div>
                </div>
              </div>

              {/* Progress Flow Stepper */}
              <div style={{ background: 'var(--surface-input)', borderRadius: 12, padding: 18, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  DELIVERY STAGE PROGRESS:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflowX: 'auto', paddingBottom: 8 }}>
                  {[
                    { key: 'DELIVERY_ASSIGNED', label: 'Assigned' },
                    { key: 'GOING_TO_RESTAURANT', label: 'To Restaurant' },
                    { key: 'ARRIVED_AT_RESTAURANT', label: 'At Restaurant' },
                    { key: 'FOOD_PICKED_UP', label: 'Picked Up' },
                    { key: 'OUT_FOR_DELIVERY', label: 'On Way' },
                    { key: 'ARRIVED_AT_CUSTOMER', label: 'At Door' },
                    { key: 'DELIVERED', label: 'Delivered' }
                  ].map((step, idx) => {
                    const statusOrder = ['DELIVERY_ASSIGNED', 'GOING_TO_RESTAURANT', 'ARRIVED_AT_RESTAURANT', 'FOOD_PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVED_AT_CUSTOMER', 'DELIVERED'];
                    const currentIdx = statusOrder.indexOf(activeOrder.status);
                    const isDone = currentIdx >= idx;
                    const isCurrent = currentIdx === idx;

                    return (
                      <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 75 }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: isDone ? '#16a34a' : 'var(--border-color)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          boxShadow: isCurrent ? '0 0 0 4px rgba(22, 163, 74, 0.25)' : 'none'
                        }}>
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: isCurrent ? 800 : 500, color: isCurrent ? '#16a34a' : 'var(--text-secondary)', marginTop: 4, textAlign: 'center' }}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Map Style Visual Route Card */}
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: 20, background: '#1e293b' }}>
                <div style={{ padding: '16px 20px', background: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>🗺️ ROUTE NAVIGATION (SIMULATION)</span>
                  <span style={{ color: '#38bdf8', fontSize: 12, fontWeight: 700 }}>2.4 km • 14 mins</span>
                </div>
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ea580c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      🍽️
                    </div>
                    <div>
                      <div style={{ color: '#fdba74', fontSize: 12, fontWeight: 700 }}>PICKUP LOCATION</div>
                      <div style={{ color: '#f8fafc', fontSize: 16, fontWeight: 700 }}>{activeOrder.restaurant_name}</div>
                      <div style={{ color: '#94a3b8', fontSize: 13 }}>{activeOrder.address || 'Restaurant Kitchen, City Centre'}</div>
                      <a href={`tel:${activeOrder.phone || '9876500000'}`} style={{ color: '#38bdf8', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginTop: 4 }}>
                        📞 Call Restaurant ({activeOrder.phone || '044-28123456'})
                      </a>
                    </div>
                  </div>

                  <div style={{ width: 2, height: 24, background: '#334155', marginLeft: 17 }} />

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      🏠
                    </div>
                    <div>
                      <div style={{ color: '#86efac', fontSize: 12, fontWeight: 700 }}>DELIVERY DROP LOCATION</div>
                      <div style={{ color: '#f8fafc', fontSize: 16, fontWeight: 700 }}>{activeOrder.customer_name}</div>
                      <div style={{ color: '#94a3b8', fontSize: 13 }}>{activeOrder.address || 'Customer Delivery Address'}</div>
                      <a href={`tel:${activeOrder.phone || '9876500001'}`} style={{ color: '#38bdf8', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginTop: 4 }}>
                        📞 Call Customer ({activeOrder.phone || '9876500001'})
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sequential Action Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                {activeOrder.status === 'DELIVERY_ASSIGNED' && (
                  <button
                    onClick={() => handleUpdateStatus(activeOrder.id, 'GOING_TO_RESTAURANT')}
                    className="btn-primary"
                    style={{ padding: '12px 28px', fontSize: 15, fontWeight: 700 }}
                  >
                    🛵 Start Heading to Restaurant ➔
                  </button>
                )}

                {activeOrder.status === 'GOING_TO_RESTAURANT' && (
                  <button
                    onClick={() => handleUpdateStatus(activeOrder.id, 'ARRIVED_AT_RESTAURANT')}
                    className="btn-primary"
                    style={{ padding: '12px 28px', fontSize: 15, fontWeight: 700, background: '#ea580c' }}
                  >
                    📍 I Have Arrived at Restaurant ➔
                  </button>
                )}

                {activeOrder.status === 'ARRIVED_AT_RESTAURANT' && (
                  <button
                    onClick={() => handleUpdateStatus(activeOrder.id, 'FOOD_PICKED_UP')}
                    className="btn-primary"
                    style={{ padding: '12px 28px', fontSize: 15, fontWeight: 700, background: '#4f46e5' }}
                  >
                    📦 Food Package Picked Up ➔
                  </button>
                )}

                {activeOrder.status === 'FOOD_PICKED_UP' && (
                  <button
                    onClick={() => handleUpdateStatus(activeOrder.id, 'OUT_FOR_DELIVERY')}
                    className="btn-primary"
                    style={{ padding: '12px 28px', fontSize: 15, fontWeight: 700, background: '#0284c7' }}
                  >
                    🚀 Start Moving: Out for Delivery to Customer ➔
                  </button>
                )}

                {activeOrder.status === 'OUT_FOR_DELIVERY' && (
                  <button
                    onClick={() => handleUpdateStatus(activeOrder.id, 'ARRIVED_AT_CUSTOMER')}
                    className="btn-primary"
                    style={{ padding: '12px 28px', fontSize: 15, fontWeight: 700, background: '#059669' }}
                  >
                    🏠 I Have Arrived at Customer Location ➔
                  </button>
                )}

                {activeOrder.status === 'ARRIVED_AT_CUSTOMER' && (
                  <button
                    onClick={() => handleUpdateStatus(activeOrder.id, 'DELIVERED')}
                    className="btn-primary"
                    style={{ padding: '14px 32px', fontSize: 16, fontWeight: 800, background: '#16a34a' }}
                  >
                    ✅ Complete Order & Mark Delivered (Earn ₹45)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPLETED DELIVERIES */}
      {activeTab === 'completed' && (
        <div>
          {completedOrders.length === 0 ? (
            <div style={{ background: 'var(--surface-card)', borderRadius: 16, padding: 60, textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏁</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>No Completed Deliveries Today</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Completed food deliveries and earned payouts will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {completedOrders.map(order => (
                <div
                  key={order.id}
                  style={{
                    background: 'var(--surface-card)',
                    borderRadius: 12,
                    padding: '16px 20px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Order #{order.order_code || `BF${100000 + order.id}`}
                      </span>
                      <span style={{ fontSize: 11, background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                        DELIVERED
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                      Restaurant: <strong>{order.restaurant_name}</strong> • Customer: {order.customer_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Completed at: {new Date(order.updated_at || order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>+ ₹45</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Delivery Fee Credited</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PROFILE */}
      {activeTab === 'profile' && (
        <div style={{ maxWidth: 640, background: 'var(--surface-card)', padding: 28, borderRadius: 14, border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Delivery Partner Profile</h2>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Full Name</label>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Contact Phone</label>
              <div style={{ fontSize: 15, color: 'var(--text-primary)' }}>{partner?.phone || user.phone || '9876543210'}</div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Registered Vehicle</label>
              <div style={{ fontSize: 15, color: 'var(--text-primary)' }}>{partner?.vehicle || 'Motorcycle'} ({partner?.vehicle_number || 'TN 09 AB 1234'})</div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Driver Rating</label>
              <div style={{ fontSize: 15, color: 'var(--text-primary)' }}>⭐ {partner?.rating || 4.8} / 5.0 (Based on customer reviews)</div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Account Status</label>
              <div style={{ fontSize: 14, color: '#16a34a', fontWeight: 700 }}>✅ Verified & Approved by BiteFlow Operations</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryPartnerDashboard;
