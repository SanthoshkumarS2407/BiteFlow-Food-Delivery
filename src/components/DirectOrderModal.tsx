import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';

type PaymentMethodType = 'COD' | 'GPAY' | 'PHONEPE' | 'PAYTM' | 'CARD';

const DirectOrderModal: React.FC = () => {
  const {
    directOrderFood,
    closeDirectOrder,
    directOrderQuantity,
    setDirectOrderQuantity,
    deliveryLocation,
    setShowLocationModal,
    token,
    user,
    ensureUserLoggedIn,
    navigateTo
  } = useApp();

  const { toast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('GPAY');
  const [upiId, setUpiId] = useState('santhosh@okaxis');
  const [cardForm, setCardForm] = useState({
    number: '4532 •••• •••• 8821',
    expiry: '12/28',
    cvv: '•••',
    name: 'Santhosh Kumar'
  });

  const [step, setStep] = useState<'checkout' | 'processing' | 'success'>('checkout');
  const [confirmedOrderId, setConfirmedOrderId] = useState<number | null>(null);
  const [confirmedOrderCode, setConfirmedOrderCode] = useState<string>('BF102458');
  const [deliveryFee, setDeliveryFee] = useState<number>(30);
  const [submitting, setSubmitting] = useState(false);

  // Fetch realistic delivery fee based on distance
  useEffect(() => {
    if (!directOrderFood) {
      setStep('checkout');
      return;
    }
    fetch('/api/delivery-fee?distance=2.4')
      .then(r => r.json())
      .then(d => { if (d && d.delivery_fee) setDeliveryFee(d.delivery_fee); })
      .catch(() => setDeliveryFee(30));
  }, [directOrderFood]);

  if (!directOrderFood) return null;

  const food = directOrderFood;
  const itemTotal = food.price * directOrderQuantity;
  const platformFee = 10;
  const taxes = Math.round(itemTotal * 0.05); // 5% GST
  const grandTotal = itemTotal + deliveryFee + platformFee + taxes;

  const handleConfirmOrder = async () => {
    setSubmitting(true);

    // If UPI or Card, show the realistic simulated demo processing screen first
    if (paymentMethod !== 'COD') {
      setStep('processing');
      await new Promise(r => setTimeout(r, 1600)); // 1.6s realistic demo gateway animation
    }

    try {
      const activeToken = token || (await ensureUserLoggedIn());
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          items: [
            {
              food_id: food.id,
              food_name: food.name,
              quantity: directOrderQuantity,
              price: food.price
            }
          ],
          total: grandTotal,
          subtotal: itemTotal,
          delivery_fee: deliveryFee,
          platform_fee: platformFee,
          tax: taxes,
          discount: 0,
          payment_method: paymentMethod === 'COD' ? 'Cash on Delivery' : paymentMethod,
          address: `${deliveryLocation.street ? deliveryLocation.street + ', ' : ''}${deliveryLocation.area}, ${deliveryLocation.city} - ${deliveryLocation.pincode}`,
          customer_name: user?.name || 'Santhosh Kumar',
          phone: user?.phone || '+91 98765 43210',
          restaurant_id: food.restaurant_id || 1,
          restaurant_name: food.restaurant_name || 'BiteFlow Kitchen'
        })
      });

      if (response.ok) {
        const orderData = await response.json();
        const code = orderData.order_code || `BF${100000 + (orderData.id || 102458)}`;
        setConfirmedOrderId(orderData.id);
        setConfirmedOrderCode(code);
        setStep('success');
        toast('success', 'Order Confirmed!', `Order #${code} has been placed.`);
      } else {
        toast('error', 'Order failed', 'Could not process order. Please try again.');
        setStep('checkout');
      }
    } catch {
      toast('error', 'Network error', 'Please check connection.');
      setStep('checkout');
    }
    setSubmitting(false);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(5px)',
      zIndex: 1200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        {/* Step: Processing */}
        {step === 'processing' && (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', animation: 'spin 1.5s linear infinite', marginBottom: '16px' }}>
              ⚡
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', color: 'var(--gray-900)' }}>
              Connecting to {paymentMethod}...
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--gray-500)', marginBottom: '16px' }}>
              Simulating secure payment verification. Please do not close this window.
            </p>
            <div style={{
              display: 'inline-block',
              background: '#FFF7ED',
              border: '1px solid #FFEDD5',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              color: '#9A3412',
              fontWeight: 600
            }}>
              Demo Sandbox Environment · No actual funds are deducted
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div style={{ padding: '36px 24px', textAlign: 'center' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#DCFCE7',
              color: '#166534',
              fontSize: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              ✓
            </div>

            <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              {paymentMethod === 'COD' ? 'Cash on Delivery Selected' : 'Payment Successful'}
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '6px' }}>
              Order Confirmed
            </h2>

            <div style={{
              display: 'inline-block',
              background: 'var(--gray-100)',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '15px',
              fontWeight: 800,
              color: 'var(--brand-orange)',
              marginBottom: '16px'
            }}>
              Order ID: #{confirmedOrderCode}
            </div>

            {paymentMethod === 'COD' && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', color: '#92400E', fontWeight: 600, marginBottom: '16px' }}>
                💵 Pay ₹{grandTotal} when your order arrives.
              </div>
            )}

            <div style={{
              background: 'var(--gray-50)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'left',
              marginBottom: '24px',
              border: '1px solid var(--gray-200)',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--gray-500)' }}>Estimated Delivery</span>
                <span style={{ fontWeight: 700, color: 'var(--gray-900)' }}>⏱️ 30–40 minutes</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--gray-500)' }}>Delivering To</span>
                <span style={{ fontWeight: 600, color: 'var(--gray-800)', textAlign: 'right', maxWidth: '240px' }}>
                  {deliveryLocation.label} ({deliveryLocation.area || deliveryLocation.city})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--gray-500)' }}>Item Ordered</span>
                <span style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{food.name} × {directOrderQuantity}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-primary btn-lg"
                style={{ flex: 1, fontWeight: 800 }}
                onClick={() => {
                  closeDirectOrder();
                  navigateTo('order-tracking', { orderId: confirmedOrderId });
                }}
              >
                Track Order →
              </button>
              <button
                className="btn btn-secondary btn-lg"
                style={{ flex: 1, fontWeight: 700 }}
                onClick={() => {
                  closeDirectOrder();
                  navigateTo('order-history');
                }}
              >
                View Orders
              </button>
            </div>
          </div>
        )}

        {/* Step: Checkout Form */}
        {step === 'checkout' && (
          <>
            {/* Header */}
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid var(--gray-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              background: 'white',
              zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#FFF7ED', color: 'var(--brand-orange)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                  DIRECT ORDER
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--gray-900)' }}>
                  Quick Checkout
                </h3>
              </div>
              <button
                onClick={closeDirectOrder}
                style={{
                  background: 'var(--gray-100)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  color: 'var(--gray-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px 22px' }}>
              {/* Item Card with Quantity Selector */}
              <div style={{
                display: 'flex',
                gap: '14px',
                padding: '14px',
                background: 'var(--gray-50)',
                borderRadius: '12px',
                border: '1px solid var(--gray-200)',
                marginBottom: '16px'
              }}>
                <img
                  src={food.image || 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200&q=80'}
                  alt={food.name}
                  style={{ width: '68px', height: '68px', borderRadius: '10px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <div className={`veg-indicator ${food.is_veg ? 'veg' : 'non-veg'}`} />
                    <span style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: 600 }}>{food.category}</span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gray-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {food.name}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-orange)', marginTop: '2px' }}>
                    ₹{food.price} each
                  </div>
                </div>

                {/* Quantity Controls */}
                <div style={{ alignSelf: 'center', display: 'flex', alignItems: 'center', background: 'white', borderRadius: '8px', border: '1.5px solid var(--gray-200)', padding: '2px 4px' }}>
                  <button
                    onClick={() => setDirectOrderQuantity(Math.max(1, directOrderQuantity - 1))}
                    style={{ background: 'none', border: 'none', width: '26px', height: '26px', cursor: 'pointer', fontWeight: 800, fontSize: '14px', color: 'var(--gray-700)' }}
                  >
                    -
                  </button>
                  <span style={{ padding: '0 8px', fontSize: '14px', fontWeight: 800, color: 'var(--gray-900)' }}>
                    {directOrderQuantity}
                  </span>
                  <button
                    onClick={() => setDirectOrderQuantity(directOrderQuantity + 1)}
                    style={{ background: 'none', border: 'none', width: '26px', height: '26px', cursor: 'pointer', fontWeight: 800, fontSize: '14px', color: 'var(--brand-orange)' }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Delivery Address Row */}
              <div style={{
                padding: '12px 14px',
                background: 'white',
                border: '1.5px solid var(--gray-200)',
                borderRadius: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>📍</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--gray-900)' }}>Deliver to {deliveryLocation.label}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-500)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {deliveryLocation.address}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowLocationModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand-orange)',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Change
                </button>
              </div>

              {/* Payment Methods */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--gray-800)', marginBottom: '8px' }}>
                  Select Payment Method
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  {/* Google Pay */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('GPAY')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1.5px solid ${paymentMethod === 'GPAY' ? 'var(--brand-orange)' : 'var(--gray-200)'}`,
                      background: paymentMethod === 'GPAY' ? '#FFF7ED' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>🔵</span>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800 }}>Google Pay</div>
                      <div style={{ fontSize: '10px', color: 'var(--gray-500)' }}>Instant UPI</div>
                    </div>
                  </button>

                  {/* PhonePe */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PHONEPE')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1.5px solid ${paymentMethod === 'PHONEPE' ? 'var(--brand-orange)' : 'var(--gray-200)'}`,
                      background: paymentMethod === 'PHONEPE' ? '#FFF7ED' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>🟣</span>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800 }}>PhonePe</div>
                      <div style={{ fontSize: '10px', color: 'var(--gray-500)' }}>Instant UPI</div>
                    </div>
                  </button>

                  {/* Paytm */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PAYTM')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1.5px solid ${paymentMethod === 'PAYTM' ? 'var(--brand-orange)' : 'var(--gray-200)'}`,
                      background: paymentMethod === 'PAYTM' ? '#FFF7ED' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>🔷</span>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800 }}>Paytm</div>
                      <div style={{ fontSize: '10px', color: 'var(--gray-500)' }}>UPI / Wallet</div>
                    </div>
                  </button>

                  {/* Cash on Delivery */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1.5px solid ${paymentMethod === 'COD' ? 'var(--brand-orange)' : 'var(--gray-200)'}`,
                      background: paymentMethod === 'COD' ? '#FFF7ED' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>💵</span>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800 }}>Cash on Delivery</div>
                      <div style={{ fontSize: '10px', color: 'var(--gray-500)' }}>Pay when arrives</div>
                    </div>
                  </button>
                </div>

                {/* Credit / Debit Card option */}
                <div
                  onClick={() => setPaymentMethod('CARD')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: `1.5px solid ${paymentMethod === 'CARD' ? 'var(--brand-orange)' : 'var(--gray-200)'}`,
                    background: paymentMethod === 'CARD' ? '#FFF7ED' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>💳</span>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800 }}>Credit / Debit Card</div>
                      <div style={{ fontSize: '10px', color: 'var(--gray-500)' }}>Visa, Mastercard, RuPay</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: paymentMethod === 'CARD' ? 'var(--brand-orange)' : 'var(--gray-400)' }}>
                    {paymentMethod === 'CARD' ? '●' : '○'}
                  </span>
                </div>

                {/* Card Fields when CARD is selected */}
                {paymentMethod === 'CARD' && (
                  <div style={{ marginTop: '8px', padding: '12px', background: 'var(--gray-50)', borderRadius: '10px', border: '1px solid var(--gray-200)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginBottom: '6px' }}>Demo Card Details (No real card data is stored):</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '6px' }}>
                      <input
                        type="text"
                        value={cardForm.number}
                        onChange={e => setCardForm(p => ({ ...p, number: e.target.value }))}
                        style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--gray-300)' }}
                      />
                      <input
                        type="text"
                        value={cardForm.expiry}
                        onChange={e => setCardForm(p => ({ ...p, expiry: e.target.value }))}
                        style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--gray-300)' }}
                      />
                      <input
                        type="text"
                        value={cardForm.cvv}
                        onChange={e => setCardForm(p => ({ ...p, cvv: e.target.value }))}
                        style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--gray-300)' }}
                      />
                    </div>
                  </div>
                )}

                {/* Subtext info */}
                <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🛡️</span>
                  <span>
                    {paymentMethod === 'COD'
                      ? 'Pay ₹' + grandTotal + ' in cash or via UPI to delivery executive at your doorstep.'
                      : 'Scan the UPI QR code below with any UPI application to complete payment.'}
                  </span>
                </div>

                {/* ─── REALISTIC DYNAMIC UPI QR CODE SECTION ─── */}
                {(paymentMethod === 'GPAY' || paymentMethod === 'PHONEPE' || paymentMethod === 'PAYTM') && (
                  <div style={{
                    marginTop: '16px',
                    padding: '18px',
                    borderRadius: '16px',
                    background: paymentMethod === 'GPAY'
                      ? 'linear-gradient(145deg, #EFF6FF 0%, #FFFFFF 100%)'
                      : paymentMethod === 'PHONEPE'
                      ? 'linear-gradient(145deg, #FAF5FF 0%, #FFFFFF 100%)'
                      : 'linear-gradient(145deg, #F0FDF4 0%, #FFFFFF 100%)',
                    border: `2px solid ${
                      paymentMethod === 'GPAY' ? '#3B82F6' : paymentMethod === 'PHONEPE' ? '#9333EA' : '#059669'
                    }`,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    textAlign: 'center'
                  }}>
                    {/* Header with App badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '22px' }}>
                          {paymentMethod === 'GPAY' ? '⚡' : paymentMethod === 'PHONEPE' ? '🟣' : '🔷'}
                        </span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 800,
                            color: paymentMethod === 'GPAY' ? '#1D4ED8' : paymentMethod === 'PHONEPE' ? '#6B21A8' : '#047857'
                          }}>
                            {paymentMethod === 'GPAY' ? 'Google Pay (GPay) UPI' : paymentMethod === 'PHONEPE' ? 'PhonePe UPI' : 'Paytm UPI & Wallet'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                            Verified Merchant: BiteFlow Technologies
                          </div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '10px',
                        background: '#DCFCE7',
                        color: '#15803D',
                        padding: '3px 8px',
                        borderRadius: '20px',
                        fontWeight: 800,
                        letterSpacing: '0.4px'
                      }}>
                        ● LIVE GATEWAY
                      </span>
                    </div>

                    {/* QR Code Container */}
                    <div style={{
                      display: 'inline-block',
                      background: 'white',
                      padding: '12px',
                      borderRadius: '14px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                      border: '1px solid var(--gray-200)',
                      position: 'relative',
                      margin: '6px 0 12px'
                    }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&data=${encodeURIComponent(
                          `upi://pay?pa=biteflow@okaxis&pn=BiteFlow%20Technologies&am=${grandTotal}&cu=INR&tn=BiteFlow%20Order%20${food.name.replace(/\s+/g, '%20')}`
                        )}`}
                        alt="UPI Payment QR Code"
                        style={{ width: '180px', height: '180px', display: 'block', borderRadius: '8px' }}
                      />
                      {/* Center app logo badge over QR */}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        border: '2px solid white'
                      }}>
                        {paymentMethod === 'GPAY' ? '⚡' : paymentMethod === 'PHONEPE' ? '🟣' : '🔷'}
                      </div>
                    </div>

                    {/* Amount & Copy UPI ID */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      marginBottom: '10px',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--gray-900)' }}>
                        Pay: <span style={{ color: 'var(--brand-orange)' }}>₹{grandTotal}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          navigator.clipboard?.writeText('biteflow@okaxis');
                          toast('success', 'UPI ID Copied!', 'biteflow@okaxis');
                        }}
                        style={{
                          background: 'white',
                          border: '1px solid var(--gray-300)',
                          borderRadius: '8px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--gray-700)'
                        }}
                      >
                        📋 Copy: <strong style={{ color: '#2563EB' }}>biteflow@okaxis</strong>
                      </button>
                    </div>

                    {/* Expiry & Apps Accepted */}
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--gray-500)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginBottom: '8px'
                    }}>
                      <span>⏳ QR valid for <strong>04:59 mins</strong></span>
                      <span>•</span>
                      <span>Zero extra transaction fees</span>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '11px',
                      color: 'var(--gray-600)',
                      fontWeight: 600,
                      paddingTop: '6px',
                      borderTop: '1px dashed var(--gray-200)'
                    }}>
                      <span>Accepted:</span>
                      <span style={{ background: '#E2E8F0', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>Google Pay</span>
                      <span style={{ background: '#E2E8F0', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>PhonePe</span>
                      <span style={{ background: '#E2E8F0', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>Paytm</span>
                      <span style={{ background: '#E2E8F0', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>BHIM / Cred</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary breakdown */}
              <div style={{
                background: 'var(--gray-50)',
                borderRadius: '12px',
                padding: '14px',
                border: '1px solid var(--gray-200)',
                marginBottom: '18px',
                fontSize: '13px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--gray-600)' }}>Item Total ({directOrderQuantity} item{directOrderQuantity > 1 ? 's' : ''})</span>
                  <span style={{ fontWeight: 600 }}>₹{itemTotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--gray-600)' }}>Delivery Partner Fee (2.4 km)</span>
                  <span style={{ fontWeight: 600 }}>₹{deliveryFee}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--gray-600)' }}>Platform Fee</span>
                  <span style={{ fontWeight: 600 }}>₹{platformFee}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--gray-600)' }}>GST & Restaurant Charges (5%)</span>
                  <span style={{ fontWeight: 600 }}>₹{taxes}</span>
                </div>

                <div style={{ height: '1px', background: 'var(--gray-200)', margin: '8px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800 }}>
                  <span style={{ color: 'var(--gray-900)' }}>To Pay</span>
                  <span style={{ color: 'var(--brand-orange)' }}>₹{grandTotal}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', borderRadius: '12px', padding: '14px 20px', fontWeight: 800, fontSize: '15px' }}
                onClick={handleConfirmOrder}
                disabled={submitting}
              >
                {submitting ? 'Placing Order...' : (
                  paymentMethod === 'COD'
                    ? `💵 Place Cash on Delivery Order · ₹${grandTotal}`
                    : `⚡ Confirm Payment & Place Order (₹${grandTotal})`
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DirectOrderModal;
