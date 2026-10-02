import React, { useState, useEffect } from 'react';
import { SurplusRescueItem } from '../types';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';

interface Props {
  limit?: number;
  showTitle?: boolean;
}

const RescueFoodSection: React.FC<Props> = ({ limit, showTitle = true }) => {
  const { addToCart, navigateTo } = useApp();
  const { toast } = useToast();
  const [rescueItems, setRescueItems] = useState<SurplusRescueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const fetchRescueItems = async () => {
    try {
      const res = await fetch('/api/rescue');
      if (res.ok) {
        const data = await res.json();
        setRescueItems(data);
      }
    } catch {
      // keep existing
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRescueItems();
    // Poll for real-time quantity & expiry updates every 12 seconds
    const interval = setInterval(fetchRescueItems, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleClaim = async (item: SurplusRescueItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.remaining_quantity <= 0) {
      toast('info', 'Rescue Sold Out', 'All surplus meals for this item have been claimed.');
      return;
    }

    setClaimingId(item.id);
    try {
      // Add rescue item to cart at rescue_price with rescue metadata
      const foodItem = {
        id: item.food_id,
        restaurant_id: item.restaurant_id,
        restaurant_name: item.restaurant_name,
        name: `${item.food_name} (♻ Rescue)`,
        description: item.food_description,
        price: item.rescue_price,
        image: item.food_image,
        category: item.food_category,
        is_veg: item.food_is_veg ?? 1,
        calories: item.food_calories,
      };

      await addToCart(
        foodItem,
        1,
        undefined,
        JSON.stringify({ is_rescue: true, rescue_id: item.id }),
        item.rescue_price
      );

      // Optimistically update remaining quantity in UI
      setRescueItems(prev =>
        prev.map(it =>
          it.id === item.id
            ? {
                ...it,
                remaining_quantity: Math.max(0, it.remaining_quantity - 1),
                status: it.remaining_quantity - 1 <= 0 ? 'sold_out' : it.status,
              }
            : it
        )
      );

      toast('success', 'Rescue Meal Added!', `Saved ₹${item.original_price - item.rescue_price} while reducing food waste 🌱`);
    } catch {
      toast('error', 'Could not claim meal');
    }
    setClaimingId(null);
  };

  const formatExpiryTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMin = Math.round((d.getTime() - now.getTime()) / 60000);
      let h = d.getHours();
      const m = d.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      const formatted = `${h}:${m < 10 ? '0' : ''}${m} ${ampm}`;

      if (diffMin <= 0) return 'Expired';
      if (diffMin < 60) return `Until ${formatted} (${diffMin}m left)`;
      return `Until ${formatted}`;
    } catch {
      return 'Tonight';
    }
  };

  const displayedItems = limit ? rescueItems.slice(0, limit) : rescueItems;

  if (!loading && displayedItems.length === 0) {
    return null; // Gracefully hide section if no surplus listings active
  }

  return (
    <section style={{ marginBottom: '44px' }}>
      {showTitle && (
        <div className="section-header" style={{ alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                background: '#E8F8EF',
                color: '#1CAD5E',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '3px 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                ♻ SMART SURPLUS RESCUE
              </span>
              <span style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: 500 }}>
                • Reduced prices, Zero waste
              </span>
            </div>
            <h2 className="section-title" style={{ fontSize: '22px' }}>
              Rescue Food Near You
            </h2>
            <p className="section-subtitle" style={{ fontSize: '13px' }}>
              High-quality surplus meals prepared fresh today at partner restaurants — discounted to prevent waste.
            </p>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigateTo('rescue')}
            style={{ color: '#1CAD5E', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap' }}
          >
            Explore all ({rescueItems.length}) →
          </button>
        </div>
      )}

      {loading ? (
        <div className="restaurant-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card" style={{ height: '260px', padding: '16px' }}>
              <div className="skeleton" style={{ height: '140px', marginBottom: '12px' }} />
              <div className="skeleton" style={{ height: '18px', width: '70%', marginBottom: '8px' }} />
              <div className="skeleton" style={{ height: '14px', width: '50%' }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '20px'
        }}>
          {displayedItems.map(item => {
            const isSoldOut = item.remaining_quantity <= 0 || item.status === 'sold_out';
            const isClaiming = claimingId === item.id;
            const savings = item.original_price - item.rescue_price;

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: isSoldOut ? '1px solid var(--gray-200)' : '1.5px solid #A7F3D0',
                  background: isSoldOut ? 'var(--gray-50)' : 'white',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  opacity: isSoldOut ? 0.75 : 1
                }}
                onMouseEnter={e => {
                  if (!isSoldOut) {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 25px -5px rgba(16, 185, 129, 0.15), 0 8px 10px -6px rgba(16, 185, 129, 0.1)';
                    (e.currentTarget as HTMLElement).style.borderColor = '#10B981';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSoldOut) {
                    (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
                    (e.currentTarget as HTMLElement).style.borderColor = '#A7F3D0';
                  }
                }}
              >
                {/* Image Banner */}
                <div style={{ position: 'relative', height: '150px', background: 'var(--gray-100)', overflow: 'hidden' }}>
                  <img
                    src={item.food_image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'}
                    alt={item.food_name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: isSoldOut ? 'grayscale(0.6)' : 'none'
                    }}
                  />
                  {/* Top Badges */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <div className={`veg-indicator ${item.food_is_veg ? 'veg' : 'non-veg'}`} style={{ width: '14px', height: '14px' }} />
                    <span style={{
                      background: 'rgba(17, 24, 39, 0.85)',
                      backdropFilter: 'blur(4px)',
                      color: '#10B981',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      ♻ Rescue Meal
                    </span>
                  </div>

                  {/* Discount pill */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: '#10B981',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }}>
                    {item.discount_percent || Math.round((savings / item.original_price) * 100)}% OFF
                  </div>

                  {/* Expiry Pill */}
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '10px',
                    background: 'rgba(0, 0, 0, 0.72)',
                    backdropFilter: 'blur(4px)',
                    color: '#FEF3C7',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>⏳</span> {formatExpiryTime(item.expiry_time)}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Restaurant & Distance */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span
                      onClick={() => navigateTo('restaurant-detail', { restaurantId: item.restaurant_id })}
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--brand-orange)',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.restaurant_name}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: 500, flexShrink: 0 }}>
                      📍 {item.restaurant_distance || '1.2 km'} · ⚡ {item.restaurant_delivery_time || '25 min'}
                    </span>
                  </div>

                  {/* Food Name */}
                  <h3 style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: 'var(--gray-900)',
                    marginBottom: '6px',
                    lineHeight: 1.3
                  }}>
                    {item.food_name}
                  </h3>

                  {/* Remaining Meals live badge */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    background: isSoldOut ? 'var(--gray-200)' : '#ECFDF5',
                    borderRadius: '8px',
                    width: 'fit-content',
                    marginBottom: '12px'
                  }}>
                    <span style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: isSoldOut ? 'var(--gray-500)' : '#059669',
                      display: 'inline-block'
                    }} />
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isSoldOut ? 'var(--gray-600)' : '#065F46'
                    }}>
                      {isSoldOut ? 'Rescue Sold Out' : `${item.remaining_quantity} meals remaining`}
                    </span>
                  </div>

                  {/* Pricing & Claim Button */}
                  <div style={{
                    marginTop: 'auto',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--gray-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 900, color: '#047857' }}>
                          ₹{item.rescue_price}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--gray-400)', textDecoration: 'line-through' }}>
                          ₹{item.original_price}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600 }}>
                        Save ₹{savings}
                      </div>
                    </div>

                    <button
                      className="btn btn-sm"
                      onClick={(e) => handleClaim(item, e)}
                      disabled={isSoldOut || isClaiming}
                      style={{
                        background: isSoldOut ? 'var(--gray-200)' : '#10B981',
                        color: isSoldOut ? 'var(--gray-500)' : 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px 14px',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: isSoldOut ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isSoldOut ? 'Sold Out' : isClaiming ? 'Adding...' : '+ Claim Rescue'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default RescueFoodSection;
