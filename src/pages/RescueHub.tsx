import React, { useState, useEffect } from 'react';
import { SurplusRescueItem } from '../types';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';

const RescueHub: React.FC = () => {
  const { addToCart, navigateTo } = useApp();
  const { toast } = useToast();
  const [items, setItems] = useState<SurplusRescueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterVeg, setFilterVeg] = useState<number | null>(null);
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const fetchRescue = async () => {
    try {
      const res = await fetch('/api/rescue');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchRescue();
    const interval = setInterval(fetchRescue, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleClaim = async (item: SurplusRescueItem) => {
    if (item.remaining_quantity <= 0) {
      toast('info', 'Rescue Sold Out', 'All surplus meals for this listing have been claimed.');
      return;
    }

    setClaimingId(item.id);
    try {
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

      setItems(prev =>
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

      toast('success', 'Rescue Meal Added!', `Saved ₹${item.original_price - item.rescue_price} while reducing food waste! 🌱`);
    } catch {
      toast('error', 'Could not claim meal');
    }
    setClaimingId(null);
  };

  const filteredItems = items.filter(it => {
    if (filterVeg === null) return true;
    return it.food_is_veg === filterVeg;
  });

  return (
    <div className="page-container" style={{ paddingTop: '28px', paddingBottom: '50px' }}>
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #064E3B 0%, #065F46 50%, #047857 100%)',
        borderRadius: '20px',
        padding: '36px 32px',
        color: 'white',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '640px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(4px)',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.05em',
            marginBottom: '12px',
            textTransform: 'uppercase'
          }}>
            ♻ SMART SURPLUS RESCUE
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 900, lineHeight: 1.2, marginBottom: '10px', color: 'white' }}>
            Rescue Meals. Cut Food Waste. Enjoy Great Prices.
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.5, marginBottom: '20px' }}>
            Restaurants prepare fresh meals every shift. When forecasted demand drops near the close of a service window, surplus dishes become eligible for rescue pricing at 40%–55% off.
          </p>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>⚡</span>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Connected to real-time predicted surplus</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>⏳</span>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Strict expiry windows</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🍱</span>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>100% freshly cooked food</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Available Rescue Items ({filteredItems.length})</h2>
          <p style={{ fontSize: '13px', color: 'var(--gray-500)' }}>Live quantity remaining updates in real time</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`filter-chip ${filterVeg === null ? 'active' : ''}`}
            onClick={() => setFilterVeg(null)}
          >
            All Items
          </button>
          <button
            className={`filter-chip ${filterVeg === 1 ? 'active' : ''}`}
            onClick={() => setFilterVeg(1)}
          >
            🟢 Pure Veg
          </button>
          <button
            className={`filter-chip ${filterVeg === 0 ? 'active' : ''}`}
            onClick={() => setFilterVeg(0)}
          >
            🔴 Non-Veg
          </button>
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="restaurant-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ height: '300px', padding: '16px' }}>
              <div className="skeleton" style={{ height: '160px', marginBottom: '12px' }} />
              <div className="skeleton" style={{ height: '20px', width: '70%', marginBottom: '8px' }} />
              <div className="skeleton" style={{ height: '14px', width: '40%' }} />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌱</div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>No Active Rescue Meals Right Now</h3>
          <p style={{ fontSize: '14px', color: 'var(--gray-500)', maxWidth: '400px', margin: '0 auto 16px' }}>
            Restaurants publish rescue listings as their dinner shift progresses and surplus is estimated. Check back shortly or explore regular menus!
          </p>
          <button className="btn btn-primary" onClick={() => navigateTo('restaurants')}>Browse Restaurants</button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {filteredItems.map(item => {
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
                  boxShadow: 'var(--shadow-sm)',
                  opacity: isSoldOut ? 0.75 : 1
                }}
              >
                <div style={{ position: 'relative', height: '170px', background: 'var(--gray-100)', overflow: 'hidden' }}>
                  <img
                    src={item.food_image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'}
                    alt={item.food_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
                    <div className={`veg-indicator ${item.food_is_veg ? 'veg' : 'non-veg'}`} />
                    <span style={{
                      background: 'rgba(17, 24, 39, 0.85)',
                      color: '#10B981',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      ♻ Smart Rescue
                    </span>
                  </div>

                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: '#10B981',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '8px'
                  }}>
                    {item.discount_percent || Math.round((savings / item.original_price) * 100)}% OFF
                  </div>

                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '10px',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#FEF3C7',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    ⏳ Available until {new Date(item.expiry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span
                      onClick={() => navigateTo('restaurant-detail', { restaurantId: item.restaurant_id })}
                      style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-orange)', cursor: 'pointer' }}
                    >
                      {item.restaurant_name}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                      📍 {item.restaurant_distance || '1.2 km'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '6px' }}>
                    {item.food_name}
                  </h3>

                  {item.food_description && (
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--gray-500)',
                      marginBottom: '12px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {item.food_description}
                    </p>
                  )}

                  {/* Real-time remaining stock */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    background: isSoldOut ? 'var(--gray-200)' : '#ECFDF5',
                    borderRadius: '8px',
                    width: 'fit-content',
                    marginBottom: '14px'
                  }}>
                    <span style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: isSoldOut ? 'var(--gray-500)' : '#059669'
                    }} />
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isSoldOut ? 'var(--gray-600)' : '#065F46'
                    }}>
                      {isSoldOut ? 'Rescue Sold Out' : `${item.remaining_quantity} meals remaining`}
                    </span>
                  </div>

                  {/* Pricing and Action */}
                  <div style={{
                    marginTop: 'auto',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--gray-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 900, color: '#047857' }}>
                          ₹{item.rescue_price}
                        </span>
                        <span style={{ fontSize: '14px', color: 'var(--gray-400)', textDecoration: 'line-through' }}>
                          ₹{item.original_price}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                        Save ₹{savings}
                      </div>
                    </div>

                    <button
                      className="btn btn-sm"
                      onClick={() => handleClaim(item)}
                      disabled={isSoldOut || isClaiming}
                      style={{
                        background: isSoldOut ? 'var(--gray-200)' : '#10B981',
                        color: isSoldOut ? 'var(--gray-500)' : 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '9px 16px',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: isSoldOut ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isSoldOut ? 'Sold Out' : isClaiming ? 'Adding...' : '+ Claim Rescue Meal'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RescueHub;
