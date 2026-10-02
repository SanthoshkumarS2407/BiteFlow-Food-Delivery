import React, { useState } from 'react';
import { Restaurant } from '../types';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';

interface RestaurantCardProps {
  restaurant: Restaurant;
  compact?: boolean;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, compact }) => {
  const { navigateTo, user, token } = useApp();
  const { toast } = useToast();
  const [isFav, setIsFav] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { navigateTo('login'); return; }
    try {
      const res = await fetch(`/api/favorites/restaurant/${restaurant.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsFav(data.favorited);
        toast('success', data.favorited ? 'Added to favorites' : 'Removed from favorites');
      }
    } catch {}
  };

  const cuisines = restaurant.cuisine?.split(',').slice(0, 2).map(c => c.trim()) || [];

  if (compact) {
    return (
      <div
        onClick={() => navigateTo('restaurant-detail', { restaurantId: restaurant.id })}
        style={{
          width: '180px',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: '100%',
          height: '120px',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '8px',
          background: 'var(--gray-100)',
          position: 'relative',
        }}>
          <img
            src={imgError ? '/placeholder-restaurant.jpg' : restaurant.image}
            alt={restaurant.name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          />
          {restaurant.offer && (
            <span className="badge badge-offer" style={{ position: 'absolute', bottom: '6px', left: '6px', fontSize: '10px' }}>
              {restaurant.offer}
            </span>
          )}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {restaurant.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--gray-500)' }}>
          <span className="star-rating" style={{ fontSize: '12px' }}>
            <span className="star-icon">★</span>
            {restaurant.rating}
          </span>
          <span>·</span>
          <span>{restaurant.delivery_time}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card"
      onClick={() => navigateTo('restaurant-detail', { restaurantId: restaurant.id })}
      style={{
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        borderRadius: '16px',
        border: '1px solid var(--gray-200)',
        background: '#FFFFFF',
        position: 'relative'
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {/* Image Container with Swiggy Offer Strip */}
      <div style={{ position: 'relative', height: '175px', overflow: 'hidden', background: '#0F172A' }}>
        <img
          src={imgError ? '' : restaurant.image}
          alt={restaurant.name}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        />
        {imgError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '44px', color: 'white' }}>
            🍽️
          </div>
        )}

        {/* Swiggy Style Bold Gradient Offer Overlay */}
        {restaurant.offer && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '24px 12px 6px',
            background: 'linear-gradient(to top, rgba(2, 6, 23, 0.95) 0%, rgba(2, 6, 23, 0.6) 60%, transparent 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 2
          }}>
            <span style={{
              fontSize: '13px',
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: '-0.3px',
              textTransform: 'uppercase',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)'
            }}>
              🏷️ {restaurant.offer}
            </span>
            {restaurant.offer_code && (
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#FFD700',
                background: 'rgba(255,255,255,0.15)',
                padding: '2px 6px',
                borderRadius: '4px',
                backdropFilter: 'blur(4px)'
              }}>
                {restaurant.offer_code}
              </span>
            )}
          </div>
        )}

        {/* Favorite Heart Button */}
        <button
          onClick={handleFavorite}
          aria-label="Add to favorites"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(255,255,255,0.92)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'transform 0.15s',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            zIndex: 3
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {isFav ? '❤️' : '🤍'}
        </button>

        {/* Pure Veg Pin on Image */}
        {restaurant.is_veg ? (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: '#166534',
            color: 'white',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            zIndex: 3
          }}>
            🌿 PURE VEG
          </div>
        ) : null}

        {/* Closed overlay */}
        {!restaurant.is_open && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 4
          }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '13px', background: 'rgba(0,0,0,0.6)', padding: '5px 14px', borderRadius: '20px', letterSpacing: '0.5px' }}>
              CURRENTLY CLOSED
            </span>
          </div>
        )}
      </div>

      {/* Info Body */}
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 800,
              color: 'var(--gray-900)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.3px'
            }}>
              {restaurant.name}
            </div>
          </div>
          {/* Swiggy Green Rating Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            background: '#0F8A43',
            color: '#FFFFFF',
            borderRadius: '6px',
            padding: '3px 7px',
            fontSize: '12px',
            fontWeight: 800,
            flexShrink: 0,
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
          }}>
            <span>★</span>
            <span>{restaurant.rating}</span>
          </div>
        </div>

        {/* Cuisines */}
        <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {cuisines.join(', ')}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--gray-100)', margin: '8px 0' }} />

        {/* Delivery Time, Distance, and Price for Two */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--gray-600)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
            <span>⚡ {restaurant.delivery_time}</span>
            <span>•</span>
            <span>{restaurant.distance}</span>
          </div>
          <span style={{ fontWeight: 600 }}>₹{restaurant.price_for_two} for two</span>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
