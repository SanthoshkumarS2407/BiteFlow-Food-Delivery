import React, { useState, useEffect } from 'react';
import { Restaurant, Food, Review } from '../types';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';

interface Props { restaurantId: number; }

const RestaurantDetail: React.FC<Props> = ({ restaurantId }) => {
  const { addToCart, removeFromCart, updateCartQty, cart, cartCount, cartTotal, user, token, navigateTo } = useApp();
  const { toast } = useToast();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [vegFilter, setVegFilter] = useState(false);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/restaurants/${restaurantId}`);
        const data: Restaurant = await res.json();
        setRestaurant(data);
        const cats = [...new Set(data.foods?.map(f => f.category).filter(Boolean))];
        if (cats.length > 0) setActiveCategory(cats[0] || '');
      } catch { toast('error', 'Could not load restaurant'); }
      setLoading(false);
    };
    fetchData();

    // Check favorite
    if (user && token) {
      fetch(`/api/favorites/check/${restaurantId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => setIsFav(d.favorited)).catch(() => {});
    }
  }, [restaurantId]);

  const toggleFav = async () => {
    if (!user) { navigateTo('login'); return; }
    const res = await fetch(`/api/favorites/restaurant/${restaurantId}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token!}` },
    });
    if (res.ok) {
      const d = await res.json();
      setIsFav(d.favorited);
      toast('success', d.favorited ? 'Added to favorites' : 'Removed from favorites');
    }
  };

  const handleAdd = async (food: Food) => {
    await addToCart(food);
  };

  const handleRemove = async (food: Food) => {
    const existing = cart.find(c => c.food_id === food.id);
    if (existing) {
      if (existing.quantity > 1) {
        await updateCartQty(existing.id, existing.quantity - 1);
      } else {
        await removeFromCart(food.id);
      }
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ paddingTop: '24px' }}>
        <div className="skeleton" style={{ height: '240px', borderRadius: '16px', marginBottom: '24px' }} />
        <div className="skeleton" style={{ height: '24px', width: '40%', marginBottom: '12px' }} />
        <div className="skeleton" style={{ height: '16px', width: '60%' }} />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="empty-state" style={{ paddingTop: '80px' }}>
        <div className="empty-state-icon">😕</div>
        <p className="empty-state-title">Restaurant not found</p>
        <button className="btn btn-primary" onClick={() => navigateTo('restaurants')}>Browse Restaurants</button>
      </div>
    );
  }

  const foods = restaurant.foods || [];
  const categories = [...new Set(foods.map(f => f.category).filter(Boolean))] as string[];
  const filteredFoods = vegFilter ? foods.filter(f => f.is_veg) : foods;
  const foodsByCategory = categories.reduce<Record<string, Food[]>>((acc, cat) => {
    acc[cat] = filteredFoods.filter(f => f.category === cat);
    return acc;
  }, {});

  return (
    <div>
      {/* Cover Image */}
      <div style={{ height: '240px', background: 'var(--gray-200)', position: 'relative', overflow: 'hidden' }}>
        {restaurant.image && (
          <img src={restaurant.image} alt={restaurant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigateTo('restaurants')}
            style={{ borderRadius: '8px' }}
          >
            ← Back
          </button>
        </div>
        <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
          <button
            onClick={toggleFav}
            style={{
              background: 'rgba(255,255,255,0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px',
            }}
            aria-label="Favorite"
          >
            {isFav ? '❤️' : '🤍'}
          </button>
        </div>
      </div>

      <div className="page-container" style={{ paddingTop: '0', paddingBottom: '40px' }}>
        {/* Restaurant Info Card */}
        <div className="card" style={{ marginTop: '-32px', position: 'relative', zIndex: 10, marginBottom: '0' }}>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '4px' }}>
                  {restaurant.name}
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--gray-500)', marginBottom: '10px' }}>
                  {restaurant.cuisine}
                </p>
                <p style={{ fontSize: '14px', color: 'var(--gray-600)', maxWidth: '500px' }}>
                  {restaurant.description}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#F0FDF4',
                  color: '#166534',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '16px',
                  fontWeight: 800,
                  marginBottom: '4px',
                }}>
                  ★ {restaurant.rating}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{restaurant.rating_count.toLocaleString()} ratings</div>
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--gray-100)', margin: '16px 0' }} />

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {[
                { icon: '🕐', label: restaurant.delivery_time },
                { icon: '📍', label: restaurant.distance },
                { icon: '💰', label: `₹${restaurant.price_for_two} for two` },
                { icon: '🕐', label: restaurant.opening_hours || '9 AM – 11 PM' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--gray-600)' }}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '13px',
                fontWeight: 600,
                color: restaurant.is_open ? 'var(--brand-green)' : 'var(--error)',
              }}>
                <span>{restaurant.is_open ? '●' : '○'}</span>
                <span>{restaurant.is_open ? 'Open Now' : 'Closed'}</span>
              </div>
            </div>

            {restaurant.offer && (
              <div style={{
                marginTop: '14px',
                background: '#FFF7ED',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span>🏷️</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#C2410C' }}>{restaurant.offer}</span>
                {restaurant.offer_code && (
                  <span style={{ fontSize: '12px', color: '#C2410C', border: '1px dashed #C2410C', borderRadius: '4px', padding: '1px 6px', marginLeft: '4px' }}>
                    Use: {restaurant.offer_code}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginTop: '20px' }}>
          {/* Menu Section */}
          <div>
            {/* Menu Header & Filters */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Menu</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className={`filter-chip ${vegFilter ? 'active' : ''}`}
                  onClick={() => setVegFilter(v => !v)}
                  style={{ fontSize: '12px' }}
                >
                  🌿 Veg only
                </button>
              </div>
            </div>

            {/* Category Tabs */}
            {categories.length > 1 && (
              <div className="scroll-row no-scrollbar" style={{ marginBottom: '20px', gap: '6px' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => {
                      setActiveCategory(cat);
                      document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    style={{ flexShrink: 0 }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Menu Items by Category */}
            {categories.map(cat => {
              const items = foodsByCategory[cat];
              if (!items || items.length === 0) return null;
              return (
                <div key={cat} id={`cat-${cat}`} style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gray-800)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--gray-100)' }}>
                    {cat} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--gray-400)' }}>({items.length})</span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {items.map(food => {
                      const itemInCart = cart.find(c => c.food_id === food.id);
                      const currentQty = itemInCart?.quantity || 0;
                      return (
                        <FoodMenuItem
                          key={food.id}
                          food={food}
                          onAdd={() => handleAdd(food)}
                          onRemove={() => handleRemove(food)}
                          qty={currentQty}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {filteredFoods.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">🌿</div>
                <p className="empty-state-title">No veg items found</p>
                <p className="empty-state-desc">This restaurant may not have veg options.</p>
                <button className="btn btn-secondary" onClick={() => setVegFilter(false)}>Show all items</button>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        {restaurant.reviews && restaurant.reviews.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Customer Reviews</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {restaurant.reviews.slice(0, 5).map(review => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Swiggy Style Floating Bottom Cart Bar */}
      {cartCount > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 900,
          width: 'calc(100% - 32px)',
          maxWidth: '540px',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: 'white',
          borderRadius: '16px',
          padding: '12px 20px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1.5px solid rgba(255, 255, 255, 0.15)',
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {cartCount} {cartCount === 1 ? 'ITEM' : 'ITEMS'} ADDED
            </div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF' }}>
              ₹{cartTotal} <span style={{ fontSize: '12px', fontWeight: 500, color: '#10B981' }}>+ taxes</span>
            </div>
          </div>

          <button
            onClick={() => navigateTo('cart')}
            style={{
              background: 'var(--brand-orange)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 22px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(232, 66, 14, 0.4)'
            }}
          >
            <span>View Cart</span>
            <span>➔</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Food Menu Item Component ─────────────────────────────────────────────────
const FoodMenuItem: React.FC<{ food: Food; onAdd: () => void; onRemove: () => void; qty: number }> = ({ food, onAdd, onRemove, qty }) => {
  const { openFoodDetails, startDirectOrder } = useApp();
  const [imgError, setImgError] = useState(false);

  return (
    <div
      onClick={() => openFoodDetails(food)}
      style={{
        display: 'flex',
        gap: '16px',
        padding: '16px',
        background: 'white',
        borderRadius: '14px',
        border: '1px solid var(--gray-200)',
        transition: 'all 0.2s',
        position: 'relative',
        cursor: 'pointer'
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(252, 128, 25, 0.4)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--gray-200)';
      }}
    >
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <div className={`veg-indicator ${food.is_veg ? 'veg' : 'non-veg'}`} />
          {food.rating && (
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534', background: '#F0FDF4', padding: '1px 6px', borderRadius: '4px' }}>
              ★ {food.rating}
            </span>
          )}
        </div>
        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '4px' }}>{food.name}</div>
        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '6px' }}>₹{food.price}</div>
        {food.description && (
          <div style={{ fontSize: '13px', color: 'var(--gray-500)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {food.description}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
          {food.calories && (
            <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>🔥 {food.calories} kcal</span>
          )}
          <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            🔍 Click for details & nutrition
          </span>
        </div>
      </div>

      {/* Image + Quick Order & Swiggy Style Add / Counter */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <div style={{ width: '110px', height: '90px', borderRadius: '12px', overflow: 'hidden', background: 'var(--gray-100)' }}>
          {!imgError && food.image ? (
            <img src={food.image} alt={food.name} onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '28px' }}>🍜</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', alignItems: 'center' }}>
          {/* Quick Direct Order Button (Opens QR / Cash / UPI checkout) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              startDirectOrder(food, 1);
            }}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #FC8019 0%, #E8420E 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              boxShadow: '0 2px 6px rgba(252, 128, 25, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
            title="Instant Quick Order with GPay, PhonePe, Paytm, QR or Cash"
          >
            <span>⚡ Order Now</span>
          </button>

          {/* Add to Cart or Counter */}
          {qty > 0 ? (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FFFFFF',
                border: '2px solid var(--brand-orange)',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                overflow: 'hidden',
                height: '28px',
                width: '100%'
              }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                style={{
                  padding: '2px 8px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand-orange)',
                  fontWeight: 900,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                −
              </button>
              <span style={{
                fontSize: '12px',
                fontWeight: 800,
                color: 'var(--brand-orange)',
                textAlign: 'center'
              }}>
                {qty} in cart
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onAdd(); }}
                style={{
                  padding: '2px 8px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand-orange)',
                  fontWeight: 900,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              style={{
                width: '100%',
                background: 'white',
                color: 'var(--brand-orange)',
                border: '1.5px solid var(--brand-orange)',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                whiteSpace: 'nowrap',
              }}
            >
              + ADD TO CART
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


// ─── Review Card ──────────────────────────────────────────────────────────────
const ReviewCard: React.FC<{ review: Review }> = ({ review }) => (
  <div style={{
    padding: '14px 16px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid var(--gray-100)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'var(--brand-orange)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 800,
        }}>
          {review.user_name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700 }}>{review.user_name || 'Anonymous'}</div>
          <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{new Date(review.created_at).toLocaleDateString()}</div>
        </div>
      </div>
      {review.restaurant_rating && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: '#F0FDF4', color: '#166534', borderRadius: '6px', padding: '3px 8px', fontSize: '13px', fontWeight: 700 }}>
          ★ {review.restaurant_rating}
        </div>
      )}
    </div>
    {review.comment && <p style={{ fontSize: '13px', color: 'var(--gray-600)', lineHeight: 1.6 }}>{review.comment}</p>}
  </div>
);

export default RestaurantDetail;
