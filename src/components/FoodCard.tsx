import React, { useState } from 'react';
import { Food } from '../types';
import { useApp } from '../contexts/AppContext';

interface FoodCardProps {
  food: Food;
  showRestaurant?: boolean;
}

const FoodCard: React.FC<FoodCardProps> = ({ food, showRestaurant }) => {
  const { addToCart, startDirectOrder, openFoodDetails } = useApp();
  const [adding, setAdding] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setAdding(true);
    await addToCart(food);
    setTimeout(() => setAdding(false), 800);
  };

  const handleDirectOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    startDirectOrder(food, 1);
  };

  return (
    <div
      className="card"
      style={{
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        border: '1px solid var(--gray-200)',
        background: 'white',
        borderRadius: '14px'
      }}
      onClick={() => openFoodDetails(food)}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-4px)';
        el.style.boxShadow = '0 12px 28px rgba(0,0,0,0.09)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {/* Food Image Container */}
      <div style={{ position: 'relative', height: '160px', background: 'var(--gray-100)', overflow: 'hidden' }}>
        {!imgError && food.image ? (
          <img
            src={food.image}
            alt={food.name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.transform = 'scale(1.05)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = 'scale(1.0)')}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '42px' }}>
            🍲
          </div>
        )}

        {/* Veg / Non-Veg Indicator */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(255,255,255,0.95)',
          padding: '4px',
          borderRadius: '6px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className={`veg-indicator ${food.is_veg ? 'veg' : 'non-veg'}`} style={{ width: '14px', height: '14px' }} />
        </div>

        {/* Calories Badge */}
        {food.calories && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            color: 'white',
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '6px'
          }}>
            🔥 {food.calories} cal
          </div>
        )}

        {/* Rating overlay pill */}
        {food.rating && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            background: 'rgba(255,255,255,0.95)',
            color: '#166534',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}>
            ⭐ {food.rating}
          </div>
        )}
      </div>

      {/* Info Body */}
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          {/* Food Name */}
          <div style={{
            fontSize: '15px',
            fontWeight: 800,
            color: 'var(--gray-900)',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {food.name}
          </div>

          {/* Restaurant Subtitle */}
          {showRestaurant && food.restaurant_name && (
            <div style={{ fontSize: '12px', color: 'var(--brand-orange)', fontWeight: 700, marginBottom: '4px' }}>
              🏪 {food.restaurant_name}
            </div>
          )}

          {/* Short Description */}
          {food.description && (
            <div style={{
              fontSize: '12px',
              color: 'var(--gray-500)',
              lineHeight: 1.4,
              marginBottom: '10px',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {food.description}
            </div>
          )}
        </div>

        {/* Bottom Price & Dual CTAs (Add + Order Now) */}
        <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--gray-100)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--gray-900)' }}>
              ₹{food.price}
            </span>
            {food.prep_time && (
              <span style={{ fontSize: '11px', color: 'var(--gray-400)', fontWeight: 500 }}>
                ⏱️ {food.prep_time}
              </span>
            )}
          </div>

          {/* Direct Order Now & Add Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '8px' }}>
            <button
              className={`btn btn-secondary btn-sm ${adding ? 'opacity-80' : ''}`}
              onClick={handleAdd}
              disabled={adding}
              style={{
                borderRadius: '8px',
                padding: '7px 10px',
                fontSize: '12px',
                fontWeight: 700,
                border: '1.5px solid var(--gray-300)',
                color: 'var(--gray-800)',
                background: addedStyle(adding)
              }}
              title="Add to Cart"
            >
              {adding ? '✓ Added' : '+ Add'}
            </button>

            <button
              className="btn btn-primary btn-sm"
              onClick={handleDirectOrder}
              style={{
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '12px',
                fontWeight: 800,
                boxShadow: '0 2px 8px rgba(232, 66, 14, 0.25)'
              }}
              title="Instant Checkout for this item"
            >
              Order Now ⚡
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function addedStyle(adding: boolean) {
  return adding ? '#DCFCE7' : 'white';
}

export default FoodCard;
