import React, { useState, useEffect } from 'react';
import { Restaurant } from '../types';
import { useApp } from '../contexts/AppContext';
import RestaurantCard from '../components/RestaurantCard';
import { FALLBACK_RESTAURANTS } from '../data/fallbackRestaurants';

const CUISINES = ['All', 'South Indian', 'Biryani', 'Chinese', 'North Indian', 'Burgers', 'Pizza', 'Desserts', 'Healthy', 'Street Food', 'Japanese'];
const SORT_OPTIONS = [
  { value: 'rating', label: '⭐ Top Rated' },
  { value: 'delivery', label: '⚡ Fastest Delivery' },
  { value: 'price', label: '💰 Price: Low to High' },
  { value: 'popular', label: '🔥 Most Popular' },
];

const Restaurants: React.FC = () => {
  const { navParams } = useApp();
  const [restaurants, setRestaurants] = useState<Restaurant[]>(FALLBACK_RESTAURANTS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>((navParams.cuisine as string) || 'All');
  const [sort, setSort] = useState<string>((navParams.sort as string) || 'rating');
  const [vegOnly, setVegOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [visibleCount, setVisibleCount] = useState(24);

  const fetchRestaurants = async () => {
    setLoading(true);
    setVisibleCount(24);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedCuisine && selectedCuisine !== 'All') params.set('cuisine', selectedCuisine);
    if (vegOnly) params.set('veg', '1');
    if (minRating > 0) params.set('min_rating', String(minRating));
    params.set('sort', sort);

    try {
      const res = await fetch(`/api/restaurants?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setRestaurants(data);
          setLoading(false);
          return;
        }
      }
    } catch {}

    // Resilient fallback filtering
    let filtered = [...FALLBACK_RESTAURANTS];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q));
    }
    if (selectedCuisine && selectedCuisine !== 'All') {
      filtered = filtered.filter(r => r.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase()));
    }
    if (vegOnly) {
      filtered = filtered.filter(r => r.is_veg === 1);
    }
    if (minRating > 0) {
      filtered = filtered.filter(r => r.rating >= minRating);
    }
    if (sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);
    if (sort === 'delivery') filtered.sort((a, b) => parseInt(a.delivery_time) - parseInt(b.delivery_time));
    if (sort === 'price') filtered.sort((a, b) => a.price_for_two - b.price_for_two);
    setRestaurants(filtered);
    setLoading(false);
  };

  useEffect(() => { fetchRestaurants(); }, [selectedCuisine, sort, vegOnly, minRating]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchRestaurants(); };

  return (
    <div className="page-container" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '4px' }}>
          Restaurants
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--gray-500)' }}>
          {loading ? 'Loading...' : `${restaurants.length} restaurant${restaurants.length !== 1 ? 's' : ''} near you`}
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ marginBottom: '16px' }}>
        <div style={{ position: 'relative', maxWidth: '480px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search restaurants or cuisines..."
            className="input"
            style={{ paddingLeft: '38px' }}
          />
        </div>
      </form>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="input"
          style={{ width: 'auto', padding: '7px 12px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Veg only */}
        <button
          className={`filter-chip ${vegOnly ? 'active' : ''}`}
          onClick={() => setVegOnly(v => !v)}
        >
          🌿 Veg Only
        </button>

        {/* Rating filter */}
        {[4, 4.5].map(r => (
          <button
            key={r}
            className={`filter-chip ${minRating === r ? 'active' : ''}`}
            onClick={() => setMinRating(minRating === r ? 0 : r)}
          >
            ⭐ {r}+
          </button>
        ))}

        {/* Offers */}
        <button
          className="filter-chip"
          onClick={() => setSelectedCuisine('All')}
        >
          🏷️ Offers
        </button>
      </div>

      {/* Cuisine Chips */}
      <div className="scroll-row no-scrollbar" style={{ marginBottom: '24px', paddingBottom: '4px' }}>
        {CUISINES.map(c => (
          <button
            key={c}
            className={`filter-chip ${selectedCuisine === c ? 'active' : ''}`}
            onClick={() => setSelectedCuisine(c)}
            style={{ borderRadius: '8px', flexShrink: 0 }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="restaurant-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton" style={{ height: '160px', borderRadius: 0 }} />
              <div style={{ padding: '12px 14px' }}>
                <div className="skeleton" style={{ height: '16px', width: '60%', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '12px', width: '80%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🍽️</div>
          <p className="empty-state-title">No restaurants found</p>
          <p className="empty-state-desc">Try adjusting your filters or search term.</p>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => { setSearch(''); setSelectedCuisine('All'); setVegOnly(false); setMinRating(0); }}>
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="restaurant-grid">
            {restaurants.slice(0, visibleCount).map(r => <RestaurantCard key={r.id} restaurant={r} />)}
          </div>
          {visibleCount < restaurants.length && (
            <div style={{ textAlign: 'center', marginTop: '36px' }}>
              <button
                onClick={() => setVisibleCount(c => c + 24)}
                className="btn btn-primary"
                style={{
                  padding: '12px 32px',
                  fontSize: '15px',
                  fontWeight: 800,
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                Show More Restaurants (Showing {Math.min(visibleCount, restaurants.length)} of {restaurants.length}) ↓
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Restaurants;
