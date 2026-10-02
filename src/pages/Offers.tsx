import React, { useState, useEffect } from 'react';
import { Coupon } from '../types';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';

const Offers: React.FC = () => {
  const { navigateTo } = useApp();
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/coupons')
      .then(r => r.json())
      .then(data => { setCoupons(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast('success', `Copied "${code}"`, 'Use this code at checkout');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast('info', `Coupon code: ${code}`, 'Copy it manually from the card');
    }
  };

  const getDiscountLabel = (coupon: Coupon) => {
    if (coupon.discount_type === 'percent') {
      return `${coupon.discount_value}% OFF${coupon.max_discount ? ` up to ₹${coupon.max_discount}` : ''}`;
    } else if (coupon.discount_type === 'flat') {
      return `₹${coupon.discount_value} OFF`;
    } else {
      return 'Free Delivery';
    }
  };

  const OFFER_COLORS = ['#FFF7ED', '#EFF6FF', '#F0FDF4', '#FEF3C7', '#FDF4FF'];
  const OFFER_ACCENT = ['#C2410C', '#1D4ED8', '#047857', '#B45309', '#7E22CE'];

  return (
    <div className="page-container" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(120deg, #E8420E, #FF6B3D)',
        borderRadius: '16px',
        padding: '28px 32px',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '100px', opacity: 0.1 }}>🏷️</div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'white', marginBottom: '6px' }}>
          Exclusive Offers
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
          Grab these deals before they expire. Copy the code and use it at checkout.
        </p>
      </div>

      {/* Coupons */}
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Available Coupons</h2>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '14px' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {coupons.map((coupon, idx) => {
            const bgColor = OFFER_COLORS[idx % OFFER_COLORS.length];
            const accentColor = OFFER_ACCENT[idx % OFFER_ACCENT.length];
            return (
              <div
                key={coupon.id}
                style={{
                  background: bgColor,
                  borderRadius: '14px',
                  padding: '20px',
                  border: `1.5px solid ${accentColor}20`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Dashed left border decoration */}
                <div style={{
                  position: 'absolute',
                  left: '70px',
                  top: 0,
                  bottom: 0,
                  width: '1px',
                  borderLeft: `2px dashed ${accentColor}30`,
                }} />

                <div style={{ fontSize: '22px', fontWeight: 800, color: accentColor, marginBottom: '4px' }}>
                  {getDiscountLabel(coupon)}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--gray-600)', marginBottom: '14px', lineHeight: 1.5 }}>
                  {coupon.description}
                </div>

                {coupon.min_order > 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '12px' }}>
                    Min. order: ₹{coupon.min_order}
                    {coupon.valid_until && ` · Expires ${new Date(coupon.valid_until).toLocaleDateString()}`}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    border: `1.5px dashed ${accentColor}60`,
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '14px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: accentColor,
                    background: `${accentColor}08`,
                  }}>
                    {coupon.code}
                  </div>
                  <button
                    onClick={() => copyCode(coupon.code)}
                    style={{
                      background: accentColor,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {copiedCode === coupon.code ? '✓ Copied!' : 'Copy Code'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tips */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>How to use a coupon</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { step: '1', text: 'Copy the coupon code from above' },
            { step: '2', text: 'Add items to your cart and proceed to checkout' },
            { step: '3', text: 'Enter the code in the "Apply Coupon" section on the cart page' },
            { step: '4', text: 'Discount will be applied automatically to your order total' },
          ].map(s => (
            <div key={s.step} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '13px' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: 'var(--brand-orange)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 800, flexShrink: 0,
              }}>
                {s.step}
              </div>
              <span style={{ color: 'var(--gray-600)', paddingTop: '2px' }}>{s.text}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigateTo('restaurants')}>
          Order Now →
        </button>
      </div>
    </div>
  );
};

export default Offers;
