import React, { useState, useEffect } from 'react';
import { Address, AvailableGroupResponse } from '../types';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { calculateBill } from './CartPage';
import GroupDeliveryOptimizationCard from '../components/GroupDeliveryOptimizationCard';

const PAYMENT_METHODS = [
  { id: 'COD', icon: '💵', label: 'Cash on Delivery', desc: 'Pay when your order arrives.' },
  { id: 'GPAY', icon: '🔵', label: 'Google Pay', desc: 'Instant UPI Payment' },
  { id: 'PHONEPE', icon: '🟣', label: 'PhonePe', desc: 'Instant UPI Payment' },
  { id: 'PAYTM', icon: '🔷', label: 'Paytm', desc: 'UPI & Paytm Wallet' },
  { id: 'CARD', icon: '💳', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay' },
];

const Checkout: React.FC = () => {
  const { cart, user, token, navigateTo, clearCart } = useApp();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [couponApplied] = useState<{ code: string; discount: number } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({ label: 'Home', city: 'Chennai', state: 'Tamil Nadu' });

  // Group Delivery state
  const [groupInfo, setGroupInfo] = useState<AvailableGroupResponse | null>(null);
  const [isGroupDelivery, setIsGroupDelivery] = useState<boolean>(true);

  const restaurantId = cart[0]?.restaurant_id;
  const restaurantName = cart[0]?.restaurant_name;

  // Check if Group Delivery is available for this restaurant
  useEffect(() => {
    if (!restaurantId) return;
    fetch(`/api/delivery-groups/available?restaurant_id=${restaurantId}`)
      .then(r => r.json())
      .then((data: AvailableGroupResponse) => {
        if (data && data.available) {
          setGroupInfo(data);
          setIsGroupDelivery(true);
        } else {
          setGroupInfo(null);
          setIsGroupDelivery(false);
        }
      })
      .catch(() => {
        setGroupInfo(null);
        setIsGroupDelivery(false);
      });
  }, [restaurantId]);

  const deliveryFee = isGroupDelivery && groupInfo?.available ? 0 : 30;
  const bill = calculateBill(cart, deliveryFee, couponApplied?.discount || 0, 499, 5);

  const [upiId, setUpiId] = useState('user@okaxis');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('•••');

  useEffect(() => {
    if (!token) return;
    fetch('/api/addresses', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setAddresses(data);
        const def = data.find((a: Address) => a.is_default) || data[0];
        if (def) setSelectedAddress(def);
        if (!def) setShowAddAddress(true);
      })
      .catch(() => setShowAddAddress(true));
  }, [token]);

  const saveAddress = async () => {
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newAddress, is_default: addresses.length === 0 }),
      });
      if (res.ok) {
        const data = await res.json();
        const saved = { ...newAddress, id: data.id } as Address;
        setAddresses(prev => [...prev, saved]);
        setSelectedAddress(saved);
        setShowAddAddress(false);
        toast('success', 'Address saved');
      }
    } catch { toast('error', 'Could not save address'); }
  };

  const placeOrder = async () => {
    if (!selectedAddress && !showAddAddress) {
      toast('error', 'Please select a delivery address');
      return;
    }
    if (cart.length === 0) {
      toast('error', 'Your cart is empty');
      return;
    }

    setPlacing(true);
    try {
      const addressStr = selectedAddress
        ? `${selectedAddress.flat}, ${selectedAddress.street}, ${selectedAddress.area}, ${selectedAddress.city} - ${selectedAddress.pincode}`
        : `${newAddress.flat}, ${newAddress.street}, ${newAddress.area}, ${newAddress.city}`;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: cart.map(item => ({
            food_id: item.food_id,
            food_name: item.name,
            quantity: item.quantity,
            price: item.unit_price || item.price,
            is_rescue: item.name?.includes('Rescue') || false,
            rescue_item_id: item.special_instructions?.includes('rescue_id')
              ? JSON.parse(item.special_instructions).rescue_id
              : null,
          })),
          total: bill.total,
          subtotal: bill.subtotal,
          delivery_fee: bill.deliveryFee,
          platform_fee: bill.platformFee,
          tax: bill.tax,
          discount: bill.discount,
          coupon_code: couponApplied?.code || null,
          payment_method: paymentMethod,
          address: addressStr,
          address_id: selectedAddress?.id || null,
          customer_name: user?.name,
          phone: user?.phone || selectedAddress?.phone,
          restaurant_id: restaurantId,
          restaurant_name: restaurantName,
          delivery_group_id: isGroupDelivery && groupInfo?.available ? groupInfo.group_id : null,
          is_group_delivery: isGroupDelivery,
          delivery_fee_saved: isGroupDelivery ? 30 : 0,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (isGroupDelivery && (data.delivery_group_id || groupInfo?.group_id)) {
          toast('success', 'Group Delivery Joined!', 'You saved ₹30 delivery fee and reduced courier trips! 🚚🌱');
          navigateTo('group-tracking', { groupId: data.delivery_group_id || groupInfo?.group_id });
        } else {
          toast('success', 'Order placed!', 'Your food is on its way 🚀');
          navigateTo('order-tracking', { orderId: data.id });
        }
      } else {
        const err = await res.json();
        toast('error', 'Order failed', err.error || 'Please try again');
      }
    } catch { toast('error', 'Network error', 'Please check your connection'); }
    setPlacing(false);
  };

  if (!user) {
    return (
      <div className="empty-state" style={{ paddingTop: '80px' }}>
        <p className="empty-state-title">Please sign in to checkout</p>
        <button className="btn btn-primary" onClick={() => navigateTo('login')}>Sign In</button>
      </div>
    );
  }

  if (cart.length === 0) {
    navigateTo('cart');
    return null;
  }

  return (
    <div className="page-container" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigateTo('cart')}>← Cart</button>
        <div style={{ height: '16px', width: '1px', background: 'var(--gray-200)' }} />
        <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Checkout</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', alignItems: 'start' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Delivery Address */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700 }}>📍 Delivery Address</h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowAddAddress(v => !v)}
                style={{ color: 'var(--brand-orange)', fontWeight: 600, fontSize: '12px' }}
              >
                + Add New
              </button>
            </div>

            {addresses.length > 0 && !showAddAddress && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                {addresses.map(addr => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr)}
                    style={{
                      padding: '12px 14px',
                      border: `1.5px solid ${selectedAddress?.id === addr.id ? 'var(--brand-orange)' : 'var(--gray-200)'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: selectedAddress?.id === addr.id ? 'rgba(232, 66, 14, 0.04)' : 'white',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="address-label-tag">{addr.label}</span>
                      {addr.is_default ? <span className="badge badge-veg" style={{ fontSize: '10px' }}>Default</span> : null}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--gray-700)' }}>
                      {addr.flat}, {addr.street}, {addr.area}, {addr.city} - {addr.pincode}
                    </div>
                    {addr.name && <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>{addr.name} · {addr.phone}</div>}
                  </div>
                ))}
              </div>
            )}

            {showAddAddress && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {(['Home', 'Work', 'Other'] as const).map(label => (
                    <button
                      key={label}
                      className={`filter-chip ${newAddress.label === label ? 'active' : ''}`}
                      onClick={() => setNewAddress(p => ({ ...p, label }))}
                      style={{ justifyContent: 'center' }}
                    >
                      {label === 'Home' ? '🏠' : label === 'Work' ? '🏢' : '📍'} {label}
                    </button>
                  ))}
                </div>
                {[
                  { key: 'name', label: 'Full Name', placeholder: 'Your name' },
                  { key: 'phone', label: 'Phone Number', placeholder: '10-digit number' },
                  { key: 'flat', label: 'Flat / Door No.', placeholder: 'Flat 2B, Building name' },
                  { key: 'street', label: 'Street', placeholder: 'Street or locality' },
                  { key: 'area', label: 'Area / Landmark', placeholder: 'Area or nearby landmark' },
                  { key: 'city', label: 'City', placeholder: 'Chennai' },
                  { key: 'pincode', label: 'Pincode', placeholder: '600001' },
                ].map(field => (
                  <div key={field.key} className="input-group">
                    <label className="input-label">{field.label}</label>
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={(newAddress as Record<string, string>)[field.key] || ''}
                      onChange={e => setNewAddress(p => ({ ...p, [field.key]: e.target.value }))}
                      className="input"
                    />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary" onClick={saveAddress} style={{ flex: 1 }}>Save Address</button>
                  {addresses.length > 0 && (
                    <button className="btn btn-secondary" onClick={() => setShowAddAddress(false)} style={{ flex: 1 }}>Cancel</button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Delivery Optimization / Group Delivery */}
          {groupInfo && groupInfo.available && (
            <GroupDeliveryOptimizationCard
              groupInfo={groupInfo}
              isGroupSelected={isGroupDelivery}
              onSelectOption={setIsGroupDelivery}
              restaurantName={restaurantName}
            />
          )}

          {/* Payment Method */}
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>💳 Payment Method</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {PAYMENT_METHODS.map(pm => (
                <div
                  key={pm.id}
                  className={`payment-option ${paymentMethod === pm.id ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod(pm.id)}
                >
                  <span className="payment-option-icon">{pm.icon}</span>
                  <div>
                    <div className="payment-option-label">{pm.label}</div>
                    <div className="payment-option-desc">{pm.desc}</div>
                  </div>
                  <div className="payment-radio" />
                </div>
              ))}
            </div>

            {/* Interactive UPI Fields for Google Pay, PhonePe, Paytm */}
            {['GPAY', 'PHONEPE', 'PAYTM'].includes(paymentMethod) && (
              <div style={{
                marginTop: '12px',
                padding: '14px',
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                    {paymentMethod === 'GPAY' ? 'Google Pay UPI' : paymentMethod === 'PHONEPE' ? 'PhonePe UPI' : 'Paytm UPI'}
                  </span>
                  <span style={{ fontSize: '11px', background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    ⚡ 100% Secure UPI
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>
                  VPA / UPI ID connected:
                </div>
                <input
                  type="text"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  placeholder="e.g. mobile@upi or username@okaxis"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13px',
                    fontWeight: 600,
                    outline: 'none',
                    color: '#0F172A'
                  }}
                />
              </div>
            )}

            {/* Interactive Card Details */}
            {paymentMethod === 'CARD' && (
              <div style={{
                marginTop: '12px',
                padding: '14px',
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: '10px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  Credit / Debit Card Details
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    placeholder="Card Number"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '13px',
                        fontWeight: 600
                      }}
                    />
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={e => setCardCvv(e.target.value)}
                      placeholder="CVV"
                      maxLength={4}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '13px',
                        fontWeight: 600
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod !== 'COD' && (
              <div style={{ marginTop: '12px', padding: '10px 12px', background: 'var(--gray-50)', borderRadius: '8px', fontSize: '12px', color: 'var(--gray-500)' }}>
                ℹ️ Demo Environment: Instant payment simulation enabled.
              </div>
            )}
          </div>
        </div>

        {/* Right – Order Summary */}
        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>📋 Order Summary</h2>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                  <div className={`veg-indicator ${item.is_veg ? 'veg' : 'non-veg'}`} style={{ width: '12px', height: '12px' }} />
                  <span style={{ color: 'var(--gray-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </span>
                  <span style={{ color: 'var(--gray-400)' }}>×{item.quantity}</span>
                </div>
                <span style={{ fontWeight: 600, flexShrink: 0, marginLeft: '8px' }}>₹{((item.unit_price || item.price) * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>

          <div style={{ height: '1px', background: 'var(--gray-100)', marginBottom: '14px' }} />

          {/* Bill */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {[
              { label: 'Item Total', value: `₹${bill.subtotal}` },
              {
                label: 'Delivery Fee',
                value: (isGroupDelivery && groupInfo?.available)
                  ? 'FREE (Group Delivery)'
                  : (bill.subtotal >= 499 ? 'FREE (Orders above ₹499)' : `₹${bill.deliveryFee}`),
                green: (isGroupDelivery && groupInfo?.available) || bill.subtotal >= 499
              },
              ...(isGroupDelivery && groupInfo?.available ? [{ label: '🚚 Group Delivery Saving', value: '-₹30', green: true }] : []),
              { label: 'Platform Fee', value: `₹${bill.platformFee}` },
              { label: 'GST & Restaurant Taxes (5%)', value: `₹${bill.tax}` },
              ...(bill.discount > 0 ? [{ label: 'Discount', value: `-₹${bill.discount}`, green: true }] : []),
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--gray-600)' }}>{row.label}</span>
                <span style={{ fontWeight: 600, color: (row as { green?: boolean }).green ? 'var(--brand-green)' : 'var(--gray-900)' }}>{row.value}</span>
              </div>
            ))}
          </div>

          <div style={{ height: '1px', background: 'var(--gray-200)', marginBottom: '14px' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '16px', fontWeight: 800 }}>Total</span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--brand-orange)' }}>₹{bill.total}</span>
          </div>

          {/* Delivery estimate */}
          <div style={{ background: 'var(--gray-50)', borderRadius: '10px', padding: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🚴</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>Estimated Delivery</div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>30–45 minutes from order confirmation</div>
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            onClick={placeOrder}
            disabled={placing || (!selectedAddress && addresses.length > 0 && !showAddAddress)}
          >
            {placing ? '⏳ Placing Order...' : `Place Order · ₹${bill.total}`}
          </button>

          <p style={{ fontSize: '11px', color: 'var(--gray-400)', textAlign: 'center', marginTop: '10px' }}>
            By placing your order, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
