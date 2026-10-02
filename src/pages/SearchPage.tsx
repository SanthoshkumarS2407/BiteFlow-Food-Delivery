import React, { useState, useEffect, useRef } from 'react';
import { Restaurant, Food } from '../types';
import { useApp } from '../contexts/AppContext';
import RestaurantCard from '../components/RestaurantCard';
import FoodCard from '../components/FoodCard';

interface Props { initialQuery?: string; }

const POPULAR = ['Biryani', 'Pizza', 'Burger', 'Dosa', 'Noodles', 'Paneer', 'Shawarma', 'Idli'];

const SearchPage: React.FC<Props> = ({ initialQuery }) => {
  const { navigateTo } = useApp();
  const [query, setQuery] = useState(initialQuery || '');
  const [results, setResults] = useState<{ restaurants: Restaurant[]; foods: Food[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('recentSearches') || '[]'); } catch { return []; }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { if (initialQuery) doSearch(initialQuery); }, [initialQuery]);

  const doSearch = async (q: string) => {
    if (!q || q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      // Save to recent
      const updated = [q, ...recent.filter(r => r !== q)].slice(0, 6);
      setRecent(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch { setResults({ restaurants: [], foods: [] }); }
    setLoading(false);
  };

  const handleChange = (v: string) => {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(v), 400);
  };

  const clearRecent = () => { setRecent([]); localStorage.removeItem('recentSearches'); };

  const hasResults = results && (results.restaurants.length > 0 || results.foods.length > 0);
  const noResults = results && !hasResults;

  return (
    <div className="page-container" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: 'var(--gray-400)', pointerEvents: 'none' }}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          placeholder="Search restaurants, dishes, cuisines..."
          className="input"
          style={{ paddingLeft: '44px', paddingRight: '44px', fontSize: '15px', height: '48px' }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults(null); inputRef.current?.focus(); }}
            style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'var(--gray-200)', border: 'none', borderRadius: '50%', width: '22px', height: '22px',
              cursor: 'pointer', fontSize: '12px', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '20px', width: '80px', borderRadius: '20px' }} />)}
        </div>
      )}

      {/* No results */}
      {noResults && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p className="empty-state-title">No results for "{query}"</p>
          <p className="empty-state-desc">Try different keywords or browse all restaurants.</p>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigateTo('restaurants')}>Browse Restaurants</button>
        </div>
      )}

      {/* Results */}
      {hasResults && (
        <div className="animate-fade-in">
          {results.restaurants.length > 0 && (
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '14px' }}>
                Restaurants ({results.restaurants.length})
              </h2>
              <div className="restaurant-grid">
                {results.restaurants.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
              </div>
            </section>
          )}

          {results.foods.length > 0 && (
            <section>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '14px' }}>
                Dishes ({results.foods.length})
              </h2>
              <div className="food-grid">
                {results.foods.map(f => <FoodCard key={f.id} food={f} showRestaurant />)}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Empty state (no query yet) */}
      {!query && !results && (
        <div>
          {/* Recent Searches */}
          {recent.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gray-700)' }}>Recent Searches</h2>
                <button className="btn btn-ghost btn-sm" onClick={clearRecent} style={{ fontSize: '12px', color: 'var(--gray-400)' }}>Clear</button>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {recent.map(r => (
                  <button
                    key={r}
                    className="tag"
                    onClick={() => { setQuery(r); doSearch(r); }}
                    style={{ cursor: 'pointer' }}
                  >
                    🕐 {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches */}
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gray-700)', marginBottom: '12px' }}>Popular Searches</h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {POPULAR.map(p => (
                <button
                  key={p}
                  className="filter-chip"
                  onClick={() => { setQuery(p); doSearch(p); }}
                >
                  🔥 {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
