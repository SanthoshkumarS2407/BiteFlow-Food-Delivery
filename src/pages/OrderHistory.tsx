import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';

const OrderHistory: React.FC = () => {
  const { token, user, navigateTo, addToCart } = useApp();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [reorderingId, setReorderingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
        // Expand the most recent order by default
        if (data.length > 0) setExpandedId(data[0].id);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const handleReorder = async (order: Order) => {
    if (!order.items || order.items.length === 0) return;
    setReorderingId(order.id);
    let count = 0;
    for (const item of order.items) {
      try {
        await addToCart(
          {
            id: item.food_id || item.id,
            name: item.food_name,
            price: item.price,
            is_veg: 1,
            image: item.image,
            restaurant_id: order.restaurant_id,
            restaurant_name: order.restaurant_name
          },
          item.quantity
        );
        count++;
      } catch {}
    }
    setReorderingId(null);
    if (count > 0) {
      toast('success', 'Items added to cart!', `Reordering ${count} item(s) from order #${order.order_code || ('BF' + (100000 + order.id))}`);
      navigateTo('cart');
    } else {
      toast('error', 'Could not reorder', 'Please try adding items individually');
    }
  };

  if (!user) {
    return (
      <div className="page-container" style={{ paddingTop: '80px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Please Sign In</h2>
        <p style={{ fontSize: '14px', color: 'var(--gray-500)', marginBottom: '20px' }}>
          Sign in to view your past orders, live tracking and quick reordering.
        </p>
        <button className="btn btn-primary" onClick={() => navigateTo('login')}>
          Sign In to BiteFlow
        </button>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ paddingTop: '28px', paddingBottom: '48px' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '4px' }}>
            My Orders
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--gray-500)' }}>
            {loading ? 'Fetching your past orders...' : `${orders.length} order${orders.length !== 1 ? 's' : ''} placed with BiteFlow`}
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigateTo('restaurants')}>
          Browse Restaurants
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ padding: '24px' }}>
              <div className="skeleton" style={{ height: '20px', width: '30%', marginBottom: '12px' }} />
              <div className="skeleton" style={{ height: '14px', width: '60%', marginBottom: '16px' }} />
              <div className="skeleton" style={{ height: '36px', width: '100%' }} />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '54px', marginBottom: '16px' }}>🍛</div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', color: 'var(--gray-900)' }}>
            No orders placed yet
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--gray-500)', maxWidth: '420px', margin: '0 auto 20px' }}>
            Explore authentic South Indian dosas, fragrant Biryanis, and rich North Indian curries from top Coimbatore kitchens.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigateTo('home')}>
            Order Food Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map(order => {
            const orderCode = order.order_code || ('BF' + (100000 + order.id));
            const isExpanded = expandedId === order.id;

            return (
              <div
                key={order.id}
                className="card"
                style={{
                  border: isExpanded ? '1.5px solid var(--brand-orange)' : '1px solid var(--gray-200)',
                  boxShadow: isExpanded ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                  borderRadius: '16px',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden'
                }}
              >
                {/* Header Summary */}
                <div
                  style={{
                    padding: '20px 22px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    cursor: 'pointer',
                    background: isExpanded ? '#FFFDFB' : 'white'
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div style={{ display: 'flex', gap: '14px', minWidth: 0 }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: '#FFF7ED',
                      color: 'var(--brand-orange)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      flexShrink: 0
                    }}>
                      🍛
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gray-900)' }}>
                          Order #{orderCode}
                        </span>
                        <span className={`status-badge status-${order.status.replace(' ', '\\ ')}`}>
                          {order.status}
                        </span>
                      </div>

                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand-orange)', marginBottom: '4px' }}>
                        🏪 {order.restaurant_name || 'BiteFlow Restaurant'}
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span>📅 {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span>💳 {order.payment_method}</span>
                      </div>
                    </div>
                  </div>

                  {/* Total & Toggle */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--gray-900)' }}>
                      ₹{order.total}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '2px' }}>
                      {order.items?.length || 1} item(s)
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--brand-orange)', fontWeight: 700, marginTop: '6px' }}>
                      {isExpanded ? '▲ Hide Details' : '▼ View Details'}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div style={{
                    padding: '18px 22px',
                    borderTop: '1px solid var(--gray-100)',
                    background: 'var(--gray-50)'
                  }}>
                    {/* Items List */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                        Ordered Items
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {order.items?.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: 'white',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              border: '1px solid var(--gray-200)',
                              fontSize: '13px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.food_name}
                                  style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
                                />
                              )}
                              <div>
                                <span style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{item.food_name}</span>
                                <span style={{ color: 'var(--gray-500)', marginLeft: '8px' }}>× {item.quantity}</span>
                              </div>
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--gray-900)' }}>
                              ₹{(item.price * item.quantity).toFixed(0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Address */}
                    {order.address && (
                      <div style={{
                        padding: '12px 14px',
                        background: 'white',
                        borderRadius: '10px',
                        border: '1px solid var(--gray-200)',
                        marginBottom: '16px',
                        fontSize: '13px'
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '2px' }}>
                          Delivery Address
                        </div>
                        <div style={{ color: 'var(--gray-800)', fontWeight: 600 }}>
                          📍 {order.address}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons (Requirement #15 & #16) */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {/* Track Order Button */}
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigateTo('order-tracking', { orderId: order.id })}
                        style={{ padding: '8px 16px', fontWeight: 800 }}
                      >
                        🛵 Track Order
                      </button>

                      {/* Reorder Button (Requirement #16) */}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleReorder(order)}
                        disabled={reorderingId === order.id}
                        style={{
                          padding: '8px 16px',
                          fontWeight: 800,
                          border: '1.5px solid var(--brand-orange)',
                          color: 'var(--brand-orange)',
                          background: 'white'
                        }}
                      >
                        {reorderingId === order.id ? 'Adding to Cart...' : '🔄 Reorder'}
                      </button>

                      {/* View Details Collapse */}
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setExpandedId(null)}
                        style={{ color: 'var(--gray-600)' }}
                      >
                        Collapse
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
