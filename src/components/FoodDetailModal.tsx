import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';

const FoodDetailModal: React.FC = () => {
  const { detailsFood, closeFoodDetails, addToCart, startDirectOrder } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!detailsFood) return null;

  const food = detailsFood;

  const handleAddToCart = async () => {
    setAdded(true);
    await addToCart(food, quantity);
    setTimeout(() => {
      setAdded(false);
      closeFoodDetails();
    }, 600);
  };

  const handleOrderNow = () => {
    closeFoodDetails();
    startDirectOrder(food, quantity);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(5px)',
      zIndex: 1150,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Close Button */}
        <button
          onClick={closeFoodDetails}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255,255,255,0.9)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            fontSize: '18px',
            color: 'var(--gray-700)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          ✕
        </button>

        {/* Large Food Image */}
        <div style={{ position: 'relative', height: '260px', background: 'var(--gray-200)', overflow: 'hidden' }}>
          <img
            src={food.image || 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80'}
            alt={food.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />

          {/* Badges */}
          <div style={{ position: 'absolute', bottom: '16px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className={`veg-indicator ${food.is_veg ? 'veg' : 'non-veg'}`} style={{ width: '20px', height: '20px' }} />
              <span style={{ color: 'white', fontWeight: 700, fontSize: '14px', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                {food.is_veg ? 'Pure Vegetarian' : 'Non-Vegetarian'}
              </span>
            </div>
            {food.rating && (
              <div style={{ background: '#166534', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 800 }}>
                ★ {food.rating} ({food.rating_count || 120}+)
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '4px' }}>
                {food.name}
              </h2>
              {food.restaurant_name && (
                <div style={{ fontSize: '13px', color: 'var(--brand-orange)', fontWeight: 700 }}>
                  🏪 {food.restaurant_name}
                </div>
              )}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gray-900)' }}>
              ₹{food.price}
            </div>
          </div>

          {/* Description */}
          {food.description && (
            <p style={{ fontSize: '14px', color: 'var(--gray-600)', lineHeight: 1.6, marginBottom: '20px' }}>
              {food.description}
            </p>
          )}

          {/* Key Attributes Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: 'var(--gray-100)', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: 'var(--gray-700)' }}>
              <span>⏱️</span> Prep Time: {food.prep_time || '20-25 min'}
            </div>
            {food.calories && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: '#FFF7ED', borderRadius: '20px', fontSize: '12px', fontWeight: 700, color: '#C2410C' }}>
                <span>🔥</span> {food.calories} kcal
              </div>
            )}
            {food.category && (
              <div style={{ padding: '6px 12px', background: '#EFF6FF', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: '#1D4ED8' }}>
                🏷️ {food.category}
              </div>
            )}
          </div>

          {/* Nutrition Breakdown */}
          <div style={{
            background: 'var(--gray-50)',
            borderRadius: '14px',
            padding: '16px',
            border: '1px solid var(--gray-200)',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--gray-800)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Nutritional Profile
              </span>
              <span style={{ fontSize: '11px', color: 'var(--gray-400)', fontStyle: 'italic' }}>
                *Values are approximate
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div style={{ background: 'white', padding: '10px 8px', borderRadius: '10px', border: '1px solid var(--gray-200)' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gray-900)' }}>
                  {food.calories || 320}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>Calories (kcal)</div>
              </div>

              <div style={{ background: 'white', padding: '10px 8px', borderRadius: '10px', border: '1px solid var(--gray-200)' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#2563EB' }}>
                  {food.protein ? `${food.protein}g` : '12g'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>Protein</div>
              </div>

              <div style={{ background: 'white', padding: '10px 8px', borderRadius: '10px', border: '1px solid var(--gray-200)' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#D97706' }}>
                  {food.carbs ? `${food.carbs}g` : '42g'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>Carbs</div>
              </div>

              <div style={{ background: 'white', padding: '10px 8px', borderRadius: '10px', border: '1px solid var(--gray-200)' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#DC2626' }}>
                  {food.fat ? `${food.fat}g` : '14g'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>Fat</div>
              </div>
            </div>
          </div>

          {/* Health Tags */}
          {food.tags && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Health & Dietary Tags
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {food.tags.split(',').map(tag => (
                  <span
                    key={tag}
                    style={{
                      background: '#F0FDF4',
                      color: '#166534',
                      border: '1px solid #DCFCE7',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 700
                    }}
                  >
                    ✓ {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector & Action Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderTop: '1px solid var(--gray-100)',
            paddingTop: '16px'
          }}>
            {/* Quantity */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '2px solid var(--gray-200)',
              borderRadius: '10px',
              padding: '4px 8px',
              background: 'white'
            }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ background: 'none', border: 'none', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 800, fontSize: '16px', color: 'var(--gray-700)' }}
              >
                -
              </button>
              <span style={{ padding: '0 12px', fontSize: '15px', fontWeight: 800, color: 'var(--gray-900)' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                style={{ background: 'none', border: 'none', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 800, fontSize: '16px', color: 'var(--brand-orange)' }}
              >
                +
              </button>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: '10px',
                border: '1.5px solid var(--brand-orange)',
                background: added ? 'var(--brand-green)' : 'white',
                color: added ? 'white' : 'var(--brand-orange)',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-sans)'
              }}
            >
              {added ? '✓ Added' : `Add to Cart (₹${food.price * quantity})`}
            </button>

            {/* Order Now */}
            <button
              onClick={handleOrderNow}
              className="btn btn-primary"
              style={{
                flex: 1.3,
                padding: '12px 18px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '14px',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              Order Now ⚡ (UPI QR / Cash)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDetailModal;
