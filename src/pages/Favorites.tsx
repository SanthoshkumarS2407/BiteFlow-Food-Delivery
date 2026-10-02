import React, { useState, useEffect } from 'react';
import { Restaurant } from '../types';
import { useApp } from '../contexts/AppContext';
import RestaurantCard from '../components/RestaurantCard';

const Favorites: React.FC = () => {
  const { user, token, navigateTo } = useApp();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/api/favorites/restaurants', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setRestaurants(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  if (!user) {
    return (
      <div className="empty-state" style={{ paddingTop: '80px' }}>
        <div className="empty-state-icon">♡</div>
        <p className="empty-state-title">Sign in to see your favorites</p>
        <button className="btn btn-primary" onClick={() => navigateTo('login')}>Sign In</button>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Saved Restaurants</h1>
      <p style={{ fontSize: '14px', color: 'var(--gray-500)', marginBottom: '24px' }}>
        {loading ? 'Loading...' : `${restaurants.length} saved`}
      </p>

      {loading ? (
        <div className="restaurant-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="card">
              <div className="skeleton" style={{ height: '160px', borderRadius: 0 }} />
              <div style={{ padding: '12px' }}>
                <div className="skeleton" style={{ height: '16px', width: '60%', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '12px', width: '80%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">♡</div>
          <p className="empty-state-title">No saved restaurants</p>
          <p className="empty-state-desc">Tap the heart icon on any restaurant to save it here.</p>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigateTo('restaurants')}>
            Browse Restaurants
          </button>
        </div>
      ) : (
        <div className="restaurant-grid">
          {restaurants.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
        </div>
      )}
    </div>
  );
};

export default Favorites;
