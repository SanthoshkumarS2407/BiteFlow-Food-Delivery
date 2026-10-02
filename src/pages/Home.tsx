import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { Restaurant } from '../types';
import RestaurantCard from '../components/RestaurantCard';
import RescueFoodSection from '../components/RescueFoodSection';
import { FALLBACK_RESTAURANTS } from '../data/fallbackRestaurants';

// Swiggy "What's on your mind?" visual categories with authentic dish & drink imagery
const CATEGORIES = [
  {
    name: 'Biryani',
    query: 'Biryani',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=260&auto=format&fit=crop&q=80',
    tag: 'Dum Biryani'
  },
  {
    name: 'Dosa & Tiffins',
    query: 'South Indian',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=260&auto=format&fit=crop&q=80',
    tag: 'Crispy Dosa'
  },
  {
    name: 'Burgers',
    query: 'Burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=260&auto=format&fit=crop&q=80',
    tag: 'Juicy Burgers'
  },
  {
    name: 'Pizza',
    query: 'Pizza',
    image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=260&auto=format&fit=crop&q=80',
    tag: 'Cheesy Slices'
  },
  {
    name: 'Tea & Coffee',
    query: 'Beverages',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=260&auto=format&fit=crop&q=80',
    tag: 'Chai & Filter Coffee'
  },
  {
    name: 'Cooldrinks & Shakes',
    query: 'Beverages',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=260&auto=format&fit=crop&q=80',
    tag: 'Chilled Fizz & Shakes'
  },
  {
    name: 'Ice Creams',
    query: 'Desserts',
    image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=260&auto=format&fit=crop&q=80',
    tag: 'Scoops & Sundaes'
  },
  {
    name: 'North Indian',
    query: 'North Indian',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=260&auto=format&fit=crop&q=80',
    tag: 'Butter Chicken & Naan'
  },
  {
    name: 'Indo-Chinese',
    query: 'Chinese',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=260&auto=format&fit=crop&q=80',
    tag: 'Noodles & Rice'
  },
  {
    name: 'Parotta & Starters',
    query: 'Tamil Nadu Special',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=260&auto=format&fit=crop&q=80',
    tag: 'Malabar & Bun Parotta'
  },
  {
    name: 'Desserts & Sweets',
    query: 'Desserts',
    image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=260&auto=format&fit=crop&q=80',
    tag: 'Gulab Jamun & Sweets'
  },
  {
    name: 'Juices & Lassi',
    query: 'Beverages',
    image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=260&auto=format&fit=crop&q=80',
    tag: 'Fresh Mango & Lassi'
  },
];

const SEARCH_EXAMPLES = ['Chicken Biryani', 'Ghee Roast Dosa', 'Crispy Chicken Burger', 'Filter Coffee', 'Butter Chicken', 'Paneer Tikka', 'Chilled Cooldrinks', 'Ice Cream Sundae'];

const SkeletonCard: React.FC = () => (
  <div className="card" style={{ overflow: 'hidden', borderRadius: '16px' }}>
    <div className="skeleton" style={{ height: '175px', borderRadius: 0 }} />
    <div style={{ padding: '14px' }}>
      <div className="skeleton" style={{ height: '18px', width: '70%', marginBottom: '8px' }} />
      <div className="skeleton" style={{ height: '14px', width: '50%', marginBottom: '8px' }} />
      <div className="skeleton" style={{ height: '12px', width: '80%' }} />
    </div>
  </div>
);

const Home: React.FC = () => {
  const { navigateTo, user, cartCount, cartTotal } = useApp();
  const [restaurants, setRestaurants] = useState<Restaurant[]>(FALLBACK_RESTAURANTS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [exampleIdx, setExampleIdx] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      categoryScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Swiggy Filter States
  const [fastDeliveryOnly, setFastDeliveryOnly] = useState(false);
  const [pureVegOnly, setPureVegOnly] = useState(false);
  const [rating4Plus, setRating4Plus] = useState(false);
  const [offersOnly, setOffersOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<'all' | 'under300' | '300to600'>('all');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');
  const [sortBy, setSortBy] = useState<'relevance' | 'delivery' | 'rating' | 'costLow' | 'costHigh'>('relevance');
  const [visibleCount, setVisibleCount] = useState(24);

  const fetchLiveRestaurants = () => {
    fetch('/api/restaurants')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setRestaurants(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLiveRestaurants();
  }, []);

  // Cycle search examples
  useEffect(() => {
    const timer = setInterval(() => setExampleIdx(i => (i + 1) % SEARCH_EXAMPLES.length), 2500);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigateTo('search', { query: searchQuery.trim() });
  };

  const clearAllFilters = () => {
    setFastDeliveryOnly(false);
    setPureVegOnly(false);
    setRating4Plus(false);
    setOffersOnly(false);
    setPriceRange('all');
    setSelectedCuisine('');
    setSortBy('relevance');
  };

  const hasActiveFilters = fastDeliveryOnly || pureVegOnly || rating4Plus || offersOnly || priceRange !== 'all' || selectedCuisine !== '' || sortBy !== 'relevance';

  // Filter & Sort Logic
  const filteredRestaurants = restaurants.filter(r => {
    if (fastDeliveryOnly) {
      const minutes = parseInt(r.delivery_time) || 40;
      if (minutes > 30) return false;
    }
    if (pureVegOnly && !r.is_veg) return false;
    if (rating4Plus && r.rating < 4.0) return false;
    if (offersOnly && !r.offer) return false;
    if (priceRange === 'under300' && r.price_for_two > 300) return false;
    if (priceRange === '300to600' && (r.price_for_two < 300 || r.price_for_two > 600)) return false;
    if (selectedCuisine) {
      const q = selectedCuisine.toLowerCase();
      const rc = (r.cuisine || '').toLowerCase();
      const rn = (r.name || '').toLowerCase();
      const rd = (r.description || '').toLowerCase();
      const cat = (r.category || '').toLowerCase();

      // Check direct inclusion in cuisine, category, name, or description
      let matches = rc.includes(q) || cat.includes(q) || rn.includes(q) || rd.includes(q);

      // Category specific smart matching for complete coverage (at least 10 restaurants)
      if (!matches) {
        if (q === 'desserts' || q.includes('dessert') || q.includes('sweet') || q.includes('ice cream')) {
          matches = rc.includes('dessert') || rc.includes('sweet') || rc.includes('ice cream') || rc.includes('beverage') || rc.includes('cafe');
        } else if (q === 'burgers' || q.includes('burger')) {
          matches = rc.includes('burger') || rc.includes('pizza') || rc.includes('fast food') || rc.includes('cafe') || rc.includes('snacks');
        } else if (q === 'pizza') {
          matches = rc.includes('pizza') || rc.includes('burger') || rc.includes('fast food') || rc.includes('cafe');
        } else if (q === 'beverages' || q.includes('coffee') || q.includes('tea') || q.includes('shake')) {
          matches = rc.includes('beverage') || rc.includes('cafe') || rc.includes('tea') || rc.includes('coffee') || rc.includes('tiffin');
        } else if (q === 'chinese') {
          matches = rc.includes('chinese') || rc.includes('indo-chinese') || rc.includes('asian') || rc.includes('noodles');
        } else if (q === 'biryani') {
          matches = rc.includes('biryani') || rc.includes('mughlai') || rc.includes('hyderabadi');
        } else if (q === 'south indian') {
          matches = rc.includes('south indian') || rc.includes('tiffin') || rc.includes('tamil nadu');
        } else if (q === 'north indian') {
          matches = rc.includes('north indian') || rc.includes('punjabi') || rc.includes('mughlai') || rc.includes('tandoori');
        } else if (q.includes('tamil')) {
          matches = rc.includes('tamil nadu') || rc.includes('chettinad') || rc.includes('parotta') || rc.includes('south indian');
        }
      }

      if (!matches) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'delivery') {
      return (parseInt(a.delivery_time) || 40) - (parseInt(b.delivery_time) || 40);
    }
    if (sortBy === 'rating') {
      return b.rating - a.rating;
    }
    if (sortBy === 'costLow') {
      return a.price_for_two - b.price_for_two;
    }
    if (sortBy === 'costHigh') {
      return b.price_for_two - a.price_for_two;
    }
    return 0; // relevance
  });

  const topRated = restaurants.filter(r => r.rating >= 4.5);
  const withOffers = restaurants.filter(r => r.offer);

  return (
    <div style={{ position: 'relative' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #0B0F19 0%, #171E2E 50%, #1F1D36 100%)',
        padding: '50px 0 36px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Glow */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232, 66, 14, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div className="page-container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
            {/* BiteFlow Official Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              marginBottom: '16px'
            }}>
              <img src="/logo.png" alt="BiteFlow" style={{ width: '20px', height: '20px', borderRadius: '5px' }} />
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'white', letterSpacing: '0.5px' }}>
                Bite<span style={{ color: 'var(--brand-orange)' }}>Flow</span> Delivery Network
              </span>
              <span style={{ fontSize: '10px', background: '#10B981', color: 'white', padding: '1px 6px', borderRadius: '4px', fontWeight: 900 }}>
                LIVE
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(28px, 5.5vw, 44px)', fontWeight: 900, color: 'white', lineHeight: 1.15, marginBottom: '12px', letterSpacing: '-0.5px' }}>
              Order food online from <span style={{ color: 'var(--brand-orange)' }}>top restaurants.</span>
            </h1>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '28px', maxWidth: '520px', margin: '0 auto 28px' }}>
              Superfast 30-minute delivery • Smart Surplus Rescue deals up to 60% OFF • ₹0 Group Deliveries
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch}>
              <div style={{
                display: 'flex',
                background: 'white',
                borderRadius: '16px',
                padding: '6px 6px 6px 18px',
                boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
                border: '2px solid transparent',
                transition: 'border-color 0.2s',
              }}>
                <span style={{ fontSize: '20px', alignSelf: 'center', marginRight: '10px' }}>🔍</span>
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={`Search for "${SEARCH_EXAMPLES[exampleIdx]}" or your favorite restaurant...`}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '15px',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--gray-900)',
                    background: 'transparent',
                  }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    borderRadius: '12px',
                    padding: '12px 28px',
                    flexShrink: 0,
                    fontWeight: 800,
                    fontSize: '14px',
                    boxShadow: '0 4px 14px rgba(232, 66, 14, 0.4)'
                  }}
                >
                  Find Food
                </button>
              </div>
            </form>

            {/* Value Highlights */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '22px', flexWrap: 'wrap' }}>
              {[
                '⚡ Average 28 min delivery',
                '🌱 Smart Surplus 50% OFF',
                '🚚 ₹0 Delivery with Group Order',
                '🛡️ 100% Hygienic Food'
              ].map(tag => (
                <span key={tag} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* Administrator Fast Access Bar (Only for Super Admins) */}
            {user && (user.role === 'admin' || (user.role as string).toUpperCase() === 'ADMIN') && (
              <div style={{
                marginTop: '28px',
                padding: '12px 18px',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                flexWrap: 'wrap',
                textAlign: 'left',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0
                  }}>
                    🛡️
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Administrator Operations Active</span>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: '#10B981',
                        color: 'white',
                        fontWeight: 800
                      }}>
                        SUPER ADMIN
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                      Full operational authority over 500+ restaurants, food catalog, approvals & deliveries.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => navigateTo('admin')}
                    style={{
                      background: 'var(--brand-orange)',
                      color: 'white',
                      fontWeight: 800,
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(232, 66, 14, 0.4)'
                    }}
                  >
                    <span>⚙️ Super Admin Console</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Swiggy "What's on your mind?" Category Slider */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid var(--gray-100)', padding: '28px 0 20px' }}>
        <div className="page-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--gray-900)', letterSpacing: '-0.3px', margin: 0 }}>
                What's on your mind?
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '4px', marginBottom: 0 }}>
                Explore dishes curated by the city's finest chefs
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {selectedCuisine && (
                <button
                  onClick={() => setSelectedCuisine('')}
                  style={{
                    background: 'rgba(232, 66, 14, 0.1)',
                    color: 'var(--brand-orange)',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>Filtering: {selectedCuisine}</span>
                  <span style={{ fontSize: '14px' }}>✕</span>
                </button>
              )}

              {/* Slider Navigation Buttons */}
              <button
                type="button"
                onClick={() => scrollCategories('left')}
                aria-label="Scroll left"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  border: '1px solid var(--gray-200)',
                  background: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gray-700)',
                  fontSize: '16px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.15s'
                }}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => scrollCategories('right')}
                aria-label="Scroll right"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  border: '1px solid var(--gray-200)',
                  background: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gray-700)',
                  fontSize: '16px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.15s'
                }}
              >
                ›
              </button>
            </div>
          </div>

          <div
            ref={categoryScrollRef}
            className="scroll-row no-scrollbar"
            style={{
              gap: '20px',
              paddingBottom: '8px',
              scrollBehavior: 'smooth',
              alignItems: 'flex-start'
            }}
          >
            {CATEGORIES.map(cat => {
              const isSelected = selectedCuisine.toLowerCase() === cat.query.toLowerCase();
              return (
                <div
                  key={cat.name}
                  onClick={() => setSelectedCuisine(isSelected ? '' : cat.query)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    width: '96px',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <div style={{
                    width: '86px',
                    height: '86px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#F1F5F9',
                    boxShadow: isSelected ? '0 0 0 3px var(--brand-orange), 0 6px 16px rgba(232,66,14,0.3)' : '0 4px 12px rgba(0,0,0,0.08)',
                    position: 'relative',
                    marginBottom: '8px',
                    border: isSelected ? '2px solid var(--brand-orange)' : '2px solid white',
                    transition: 'all 0.2s'
                  }}>
                    <img
                      src={cat.image}
                      alt={cat.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: isSelected ? 800 : 700,
                    color: isSelected ? 'var(--brand-orange)' : 'var(--gray-900)',
                    textAlign: 'center',
                    lineHeight: '1.25',
                    width: '96px',
                    minHeight: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {cat.name}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--gray-400)', textAlign: 'center', marginTop: '2px', lineHeight: '1.2' }}>
                    {cat.tag}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="page-container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>

        {/* Smart Surplus Food Rescue Hub Section */}
        <RescueFoodSection />

        {/* Top Restaurant Chains Carousel */}
        {topRated.length > 0 && !selectedCuisine && (
          <section style={{ marginBottom: '44px' }}>
            <div className="section-header" style={{ marginBottom: '18px' }}>
              <div>
                <h2 className="section-title" style={{ fontSize: '22px' }}>
                  ⭐ Top Restaurant Chains in your City
                </h2>
                <p className="section-subtitle">
                  Consistently rated 4.5+ with thousands of verified customer reviews
                </p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setRating4Plus(true); }}
                style={{ color: 'var(--brand-orange)', fontWeight: 700 }}
              >
                View Top Rated →
              </button>
            </div>
            <div className="scroll-row no-scrollbar" style={{ gap: '16px' }}>
              {topRated.map(r => <RestaurantCard key={r.id} restaurant={r} compact />)}
            </div>
          </section>
        )}

        {/* Swiggy Style Promotional Deals Banner */}
        <div
          onClick={() => navigateTo('offers')}
          style={{
            background: 'linear-gradient(120deg, #E8420E 0%, #FF6B3D 50%, #FF8F6B 100%)',
            borderRadius: '18px',
            padding: '24px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            marginBottom: '40px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 8px 24px rgba(232, 66, 14, 0.25)'
          }}
        >
          <div style={{ position: 'absolute', right: -20, top: -20, fontSize: '120px', opacity: 0.12 }}>🏷️</div>
          <div style={{ zIndex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
              ⚡ LIMITED TIME MEGA OFFER
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'white', marginBottom: '4px' }}>
              Flat 50% OFF up to ₹100 on your first order
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>
              Use coupon code <span style={{ background: 'white', color: 'var(--brand-orange)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>WELCOME50</span> at checkout
            </div>
          </div>
          <button
            style={{
              background: 'white',
              color: 'var(--brand-orange)',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              flexShrink: 0,
              fontFamily: 'var(--font-sans)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1
            }}
          >
            Explore Deals →
          </button>
        </div>

        {/* Neighbourhood Group Delivery Spotlight */}
        <div
          onClick={() => navigateTo('group-tracking')}
          style={{
            background: 'linear-gradient(135deg, #0b132b 0%, #1c2541 50%, #3a506b 100%)',
            borderRadius: '18px',
            padding: '24px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            marginBottom: '40px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 8px 24px rgba(58, 80, 107, 0.2)',
          }}
        >
          <div style={{ position: 'absolute', right: -15, top: -25, fontSize: '130px', opacity: 0.12, pointerEvents: 'none' }}>🚚</div>
          <div style={{ zIndex: 1, maxWidth: '620px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.18)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
              <span>🚚 SUSTAINABLE DISCOVERY</span>
              <span>•</span>
              <span>Neighbourhood Group Delivery</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: 'white', marginBottom: '6px', lineHeight: 1.25 }}>
              Order together with nearby neighbors. Pay ₹0 delivery fee!
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
              When neighbors order from the same restaurant within a 15-minute window, BiteFlow consolidates delivery. You save ₹30 on every order!
            </div>
          </div>
          <button
            style={{
              background: 'white',
              color: '#1c2541',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 22px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              flexShrink: 0,
              fontFamily: 'var(--font-sans)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1,
            }}
          >
            Track Group Orders →
          </button>
        </div>

        {/* Restaurants with Online Food Delivery (Main Swiggy Catalog) */}
        <section id="restaurants-catalog" style={{ marginBottom: '40px' }}>
          <div className="section-header" style={{ marginBottom: '16px' }}>
            <div>
              <h2 className="section-title" style={{ fontSize: '24px', letterSpacing: '-0.3px' }}>
                {selectedCuisine ? `${selectedCuisine} Restaurants` : 'Restaurants with online food delivery'}
              </h2>
              <p className="section-subtitle">
                {filteredRestaurants.length} places delivering hot food to your location
              </p>
            </div>
          </div>

          {/* Swiggy Quick Filter Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '24px',
            paddingBottom: '8px'
          }}>
            {/* Fast Delivery Pill */}
            <button
              onClick={() => setFastDeliveryOnly(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s ease',
                border: fastDeliveryOnly ? '1.5px solid var(--brand-orange)' : '1px solid var(--gray-300)',
                background: fastDeliveryOnly ? 'rgba(232, 66, 14, 0.08)' : 'white',
                color: fastDeliveryOnly ? 'var(--brand-orange)' : 'var(--gray-800)',
              }}
            >
              <span>⚡ Fast Delivery</span>
              {fastDeliveryOnly && <span>✕</span>}
            </button>

            {/* Pure Veg Pill */}
            <button
              onClick={() => setPureVegOnly(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s ease',
                border: pureVegOnly ? '1.5px solid #16A34A' : '1px solid var(--gray-300)',
                background: pureVegOnly ? 'rgba(22, 163, 74, 0.08)' : 'white',
                color: pureVegOnly ? '#16A34A' : 'var(--gray-800)',
              }}
            >
              <span className="veg-indicator veg" style={{ width: '12px', height: '12px' }} />
              <span>Pure Veg</span>
              {pureVegOnly && <span>✕</span>}
            </button>

            {/* Rating 4.0+ Pill */}
            <button
              onClick={() => setRating4Plus(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s ease',
                border: rating4Plus ? '1.5px solid #0F8A43' : '1px solid var(--gray-300)',
                background: rating4Plus ? 'rgba(15, 138, 67, 0.08)' : 'white',
                color: rating4Plus ? '#0F8A43' : 'var(--gray-800)',
              }}
            >
              <span>⭐ Ratings 4.0+</span>
              {rating4Plus && <span>✕</span>}
            </button>

            {/* Great Offers Pill */}
            <button
              onClick={() => setOffersOnly(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s ease',
                border: offersOnly ? '1.5px solid var(--brand-orange)' : '1px solid var(--gray-300)',
                background: offersOnly ? 'rgba(232, 66, 14, 0.08)' : 'white',
                color: offersOnly ? 'var(--brand-orange)' : 'var(--gray-800)',
              }}
            >
              <span>🏷️ Great Offers</span>
              {offersOnly && <span>✕</span>}
            </button>

            {/* Price Under 300 */}
            <button
              onClick={() => setPriceRange(p => (p === 'under300' ? 'all' : 'under300'))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s ease',
                border: priceRange === 'under300' ? '1.5px solid #2563EB' : '1px solid var(--gray-300)',
                background: priceRange === 'under300' ? 'rgba(37, 99, 235, 0.08)' : 'white',
                color: priceRange === 'under300' ? '#2563EB' : 'var(--gray-800)',
              }}
            >
              <span>💵 Less than ₹300</span>
              {priceRange === 'under300' && <span>✕</span>}
            </button>

            {/* Price 300 to 600 */}
            <button
              onClick={() => setPriceRange(p => (p === '300to600' ? 'all' : '300to600'))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s ease',
                border: priceRange === '300to600' ? '1.5px solid #2563EB' : '1px solid var(--gray-300)',
                background: priceRange === '300to600' ? 'rgba(37, 99, 235, 0.08)' : 'white',
                color: priceRange === '300to600' ? '#2563EB' : 'var(--gray-800)',
              }}
            >
              <span>💰 ₹300 - ₹600</span>
              {priceRange === '300to600' && <span>✕</span>}
            </button>

            {/* Sorting Dropdown */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--gray-500)', fontWeight: 600 }}>Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--gray-300)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--gray-900)',
                  background: 'white',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="relevance">Relevance (Default)</option>
                <option value="delivery">⚡ Delivery Time</option>
                <option value="rating">⭐ Rating (High to Low)</option>
                <option value="costLow">Cost: Low to High</option>
                <option value="costHigh">Cost: High to Low</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--error)',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                Reset All Filters
              </button>
            )}
          </div>

          {/* Restaurant Grid */}
          {loading ? (
            <div className="restaurant-grid">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredRestaurants.length > 0 ? (
            <>
              <div className="restaurant-grid">
                {filteredRestaurants.slice(0, visibleCount).map(r => <RestaurantCard key={r.id} restaurant={r} />)}
              </div>
              {visibleCount < filteredRestaurants.length && (
                <div style={{ textAlign: 'center', marginTop: '36px' }}>
                  <button
                    onClick={() => setVisibleCount(c => c + 24)}
                    style={{
                      background: 'white',
                      color: 'var(--brand-orange)',
                      border: '2px solid var(--brand-orange)',
                      borderRadius: '12px',
                      padding: '12px 32px',
                      fontSize: '15px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(252, 128, 25, 0.15)',
                      fontFamily: 'var(--font-sans)',
                      transition: 'all 0.2s'
                    }}
                  >
                    Explore More Places (Showing {Math.min(visibleCount, filteredRestaurants.length)} of {filteredRestaurants.length}) ↓
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state" style={{ background: 'white', borderRadius: '16px', padding: '40px 20px', border: '1px solid var(--gray-200)' }}>
              <div className="empty-state-icon" style={{ fontSize: '48px' }}>🍽️</div>
              <p className="empty-state-title" style={{ fontSize: '18px', fontWeight: 800 }}>No restaurants match your selected filters</p>
              <p className="empty-state-desc" style={{ fontSize: '14px', color: 'var(--gray-500)' }}>
                Try relaxing your filters or resetting to see all available restaurants.
              </p>
              <button
                className="btn btn-primary"
                onClick={clearAllFilters}
                style={{ marginTop: '16px' }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>

        {/* Best Offers Row */}
        {withOffers.length > 0 && !hasActiveFilters && (
          <section style={{ marginBottom: '40px' }}>
            <div className="section-header">
              <div>
                <h2 className="section-title">🏷️ Special Deals & Discounts</h2>
                <p className="section-subtitle">Exclusive offers curated for BiteFlow members</p>
              </div>
            </div>
            <div className="restaurant-grid">
              {withOffers.slice(0, 4).map(r => <RestaurantCard key={r.id} restaurant={r} />)}
            </div>
          </section>
        )}

        {/* Feature Badges Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginTop: '16px',
        }}>
          {[
            { icon: '🚀', title: 'Lightning Delivery', desc: 'Average 28 minute drop-off time' },
            { icon: '📱', title: 'UPI & Instant Pay', desc: 'GPay, PhonePe, Paytm & Cards' },
            { icon: '🌱', title: 'Zero Food Waste', desc: 'Smart AI Surplus Food Rescue' },
            { icon: '📍', title: 'Live GPS Tracking', desc: 'Watch your rider on map' },
          ].map(feature => (
            <div key={feature.title} style={{
              background: 'white',
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              border: '1px solid var(--gray-200)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <span style={{ fontSize: '28px' }}>{feature.icon}</span>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '3px' }}>{feature.title}</div>
                <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{feature.desc}</div>
              </div>
            </div>
          ))}
        </div>
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
          background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
          color: 'white',
          borderRadius: '16px',
          padding: '12px 18px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1.5px solid rgba(255, 255, 255, 0.15)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(232, 66, 14, 0.4)'
            }}
          >
            <span>View Cart</span>
            <span>➔</span>
          </button>
        </div>
      )}

      {/* Swiggy / Zomato Style Rich Footer */}
      <footer style={{
        background: '#0B0F19',
        color: '#94A3B8',
        padding: '50px 0 32px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        <div className="page-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px', marginBottom: '40px' }}>
            {/* Col 1: Brand & Logo */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <img
                  src="/logo.png"
                  alt="BiteFlow Logo"
                  style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#000', border: '1px solid rgba(255,255,255,0.2)' }}
                />
                <span style={{ fontSize: '22px', fontWeight: 900, color: 'white' }}>
                  Bite<span style={{ color: 'var(--brand-orange)' }}>Flow</span>
                </span>
              </div>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#94A3B8', marginBottom: '16px' }}>
                India's hyper-fast food delivery platform with built-in Surplus Food Rescue and Neighbourhood Group Deliveries.
              </p>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                © 2026 BiteFlow Technologies Private Limited
              </div>
            </div>

            {/* Col 2: Company */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'white', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Company
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                {['About Us', 'BiteFlow Corporate', 'Careers', 'Team', 'BiteFlow One', 'Swiggy & Zomato Comparator'].map(item => (
                  <span key={item} style={{ cursor: 'pointer', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'white')} onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Col 3: Contact & Legal */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'white', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Contact & Legal
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                {['Help & Support', 'Partner with us', 'Ride with us', 'Terms & Conditions', 'Cookie Policy', 'Privacy Policy'].map(item => (
                  <span key={item} style={{ cursor: 'pointer', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = 'white')} onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Col 4: We Deliver To */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'white', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Available in Cities
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['Bengaluru', 'Chennai', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune', 'Kolkata', 'Coimbatore', 'Jaipur', 'Ahmedabad'].map(city => (
                  <span key={city} style={{ fontSize: '12px', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '6px', color: '#CBD5E1' }}>
                    {city}
                  </span>
                ))}
              </div>

              {/* Mobile App Download Badges */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
                  EXPERIENCE BITEFLOW APP
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{
                    background: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}>
                    <span>🤖</span>
                    <div>
                      <div style={{ fontSize: '8px', color: '#94A3B8' }}>GET IT ON</div>
                      <div>Google Play</div>
                    </div>
                  </div>

                  <div style={{
                    background: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}>
                    <span>🍏</span>
                    <div>
                      <div style={{ fontSize: '8px', color: '#94A3B8' }}>Download on</div>
                      <div>App Store</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', marginBottom: '24px' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#64748B' }}>
            <div>
              By continuing past this page, you agree to our Terms of Service, Cookie Policy, and Privacy Policy. All trademarks are properties of their respective owners.
            </div>
            <div>
              ⚡ BiteFlow Food Delivery Engine v2.0
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
