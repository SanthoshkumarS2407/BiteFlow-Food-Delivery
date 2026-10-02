import React, { useState } from 'react';
import { CartItem } from '../types';
import { useApp } from '../contexts/AppContext';

export const calculateBill = (cart: CartItem[], deliveryFee = 30, couponDiscount = 0, freeDeliveryMin = 499, platformFee = 5) => {
  const subtotal = cart.reduce((sum, item) => sum + (item.unit_price || item.price) * item.quantity, 0);
  const effectiveDeliveryFee = (cart.length > 0 && subtotal >= freeDeliveryMin) ? 0 : (cart.length > 0 ? deliveryFee : 0);
  const tax = Math.round(subtotal * 0.05);
  const discount = couponDiscount;
  const total = Math.max(0, subtotal + effectiveDeliveryFee + platformFee + tax - discount);
  return { subtotal, deliveryFee: effectiveDeliveryFee, platformFee, tax, discount, total, isFreeDelivery: subtotal >= freeDeliveryMin };
};

const CartPage: React.FC = () => {
  const { cart, updateCartQty, removeFromCart, clearCart, navigateTo, user } = useApp();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const FREE_DELIVERY_THRESHOLD = 499;
  const bill = calculateBill(cart, 30, couponApplied?.discount || 0, FREE_DELIVERY_THRESHOLD, 5);
  const amountForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - bill.subtotal);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), order_total: bill.subtotal }),
      });
      const data = await res.json();
      if (res.ok) {
        setCouponApplied({ code: couponCode.toUpperCase(), discount: data.discount });
        setCouponCode('');
      } else {
        setCouponError(data.error || 'Invalid coupon');
      }
    } catch { setCouponError('Could not validate coupon'); }
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponError('');
  };

  if (!user) {
    return (
      <div className="empty-state" style={{ paddingTop: '80px' }}>
        <div className="empty-state-icon">🛒</div>
        <p className="empty-state-title">Sign in to view your cart</p>
        <p className="empty-state-desc">You need to be signed in to add items to your cart.</p>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigateTo('login')}>Sign In</button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="empty-state" style={{ paddingTop: '80px' }}>
        <div className="empty-state-icon">🛒</div>
        <p className="empty-state-title">Your cart is empty</p>
        <p className="empty-state-desc">Looks like you haven't added anything yet. Browse our restaurants to get started.</p>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigateTo('restaurants')}>Browse Restaurants</button>
      </div>
    );
  }

  const restaurantName = cart[0]?.restaurant_name || 'Selected Restaurant';

  return (
    <div className="page-container" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '20px' }}>

          {/* Restaurant info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigateTo('restaurants')}>← Back</button>
            <div style={{ height: '16px', width: '1px', background: 'var(--gray-200)' }} />
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gray-900)' }}>Your Cart</span>
            <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>· {restaurantName}</span>
          </div>

          {/* Free delivery progress */}
          {amountForFreeDelivery > 0 ? (
            <div style={{ background: '#FFF7ED', borderRadius: '12px', padding: '12px 16px', border: '1px solid #FFEDD5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#C2410C' }}>
                  Add ₹{amountForFreeDelivery} more for FREE delivery 🎉
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#EA580C' }}>
                  ₹{bill.subtotal} / ₹{FREE_DELIVERY_THRESHOLD}
                </span>
              </div>
              <div style={{ background: '#FED7AA', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                <div style={{
                  background: 'var(--brand-orange)',
                  height: '100%',
                  borderRadius: '4px',
                  width: `${Math.min(100, (bill.subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          ) : (
            <div style={{ background: '#F0FDF4', borderRadius: '12px', padding: '12px 16px', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🎉</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#166534' }}>
                  Free Delivery Unlocked!
                </div>
                <div style={{ fontSize: '12px', color: '#15803D' }}>
                  Your order qualifies for ₹0 delivery charges.
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            {/* Grid: left (items) and right (bill) on desktop */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', alignItems: 'start' }}>
              {/* Cart Items */}
              <div>
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 800 }}>
                      {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
                    </h2>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigateTo('home')}
                      style={{ color: 'var(--brand-orange)', fontWeight: 700, fontSize: '12px' }}
                    >
                      + Add More Items
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cart.map(item => (
                      <CartItemRow
                        key={item.id}
                        item={item}
                        onUpdateQty={(qty) => updateCartQty(item.id, qty)}
                        onRemove={() => removeFromCart(item.food_id)}
                      />
                    ))}
                  </div>
                </div>

                {/* Special Instructions */}
                <div className="card" style={{ padding: '16px', marginTop: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>🗒️ Cooking Instructions</h3>
                  <textarea
                    value={specialInstructions}
                    onChange={e => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Less spicy, no onions, extra sauce..."
                    className="input"
                    rows={3}
                    style={{ resize: 'none', fontSize: '13px' }}
                  />
                </div>

                {/* Coupon */}
                <div className="card" style={{ padding: '16px', marginTop: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>🏷️ Apply Coupon</h3>
                  {couponApplied ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ECFDF5', borderRadius: '8px', padding: '10px 14px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-green)' }}>✓ {couponApplied.code} applied!</div>
                        <div style={{ fontSize: '12px', color: '#065F46' }}>You save ₹{couponApplied.discount}</div>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={removeCoupon} style={{ color: 'var(--error)', fontSize: '12px' }}>Remove</button>
                    </div>
                  ) : (
                    <div>
                      <div className="coupon-input-row">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={e => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Enter coupon code"
                          className="input"
                          style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}
                          onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                        />
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={applyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          style={{ flexShrink: 0 }}
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                      {couponError && <p className="input-error-msg" style={{ marginTop: '6px' }}>{couponError}</p>}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                        {['WELCOME50', 'BITE20', 'FREEDEL', 'BIRYANILOVE', 'SAVE20'].map(code => (
                          <button
                            key={code}
                            className="tag"
                            onClick={() => setCouponCode(code)}
                            style={{ cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                          >
                            {code}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bill Summary */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Bill Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <BillRow label="Item Total" value={`₹${bill.subtotal}`} />
                  <BillRow label="Delivery Fee" value={`₹${bill.deliveryFee}`} sub={bill.subtotal >= FREE_DELIVERY_THRESHOLD ? 'FREE' : undefined} />
                  <BillRow label="Platform Fee" value={`₹${bill.platformFee}`} />
                  <BillRow label="Tax & Charges (5%)" value={`₹${bill.tax}`} />
                  {bill.discount > 0 && <BillRow label={`Coupon (${couponApplied?.code})`} value={`-₹${bill.discount}`} green />}
                </div>
                <div style={{ height: '1px', background: 'var(--gray-100)', margin: '14px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800 }}>Total</span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-orange)' }}>₹{bill.total}</span>
                </div>
                {bill.discount > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--brand-green)', fontWeight: 600, textAlign: 'right' }}>
                    You're saving ₹{bill.discount} 🎉
                  </div>
                )}
                <button
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: '20px' }}
                  onClick={() => navigateTo('checkout')}
                >
                  Proceed to Checkout →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CartItemRow: React.FC<{ item: CartItem; onUpdateQty: (qty: number) => void; onRemove: () => void }> = ({ item, onUpdateQty, onRemove }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      {/* Veg indicator */}
      <div style={{ paddingTop: '2px' }}>
        <div className={`veg-indicator ${item.is_veg ? 'veg' : 'non-veg'}`} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-900)', marginBottom: '2px' }}>{item.name}</div>
        <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>₹{item.unit_price || item.price} each</div>
        {item.restaurant_name && <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '2px' }}>{item.restaurant_name}</div>}
      </div>

      {/* Image */}
      {item.image && !imgError && (
        <img src={item.image} alt={item.name} onError={() => setImgError(true)} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
      )}

      {/* Qty + Price */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
        <div className="qty-stepper" style={{ height: '30px' }}>
          <button onClick={() => item.quantity > 1 ? onUpdateQty(item.quantity - 1) : onRemove()}>−</button>
          <span>{item.quantity}</span>
          <button onClick={() => onUpdateQty(item.quantity + 1)}>+</button>
        </div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gray-900)' }}>
          ₹{((item.unit_price || item.price) * item.quantity).toFixed(0)}
        </div>
      </div>
    </div>
  );
};

const BillRow: React.FC<{ label: string; value: string; green?: boolean; sub?: string }> = ({ label, value, green, sub }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: '13px', color: 'var(--gray-600)' }}>{label}</span>
    <div style={{ textAlign: 'right' }}>
      {sub && <div style={{ fontSize: '11px', color: 'var(--brand-green)', fontWeight: 600 }}>{sub}</div>}
      <span style={{ fontSize: '13px', fontWeight: 600, color: green ? 'var(--brand-green)' : 'var(--gray-900)' }}>{value}</span>
    </div>
  </div>
);

export default CartPage;
