import React from 'react';
import { useApp } from '../contexts/AppContext';
import { AppPage } from '../types';

interface NavItem {
  icon: string;
  label: string;
  page: AppPage;
  badge?: number;
  requireAuth?: boolean;
}

const MobileBottomNav: React.FC = () => {
  const { currentPage, navigateTo, cartCount, user } = useApp();

  const role = (user?.role || 'CUSTOMER').toUpperCase();

  let items: NavItem[] = [];

  if (role === 'RESTAURANT_OWNER') {
    items = [
      { icon: '📋', label: 'Live Orders', page: 'owner-dashboard' },
      { icon: '🍲', label: 'Menu', page: 'owner-dashboard' },
      { icon: '🏪', label: 'Restaurant', page: 'owner-dashboard' },
      { icon: '👤', label: 'Profile', page: 'profile', requireAuth: true },
    ];
  } else if (role === 'DELIVERY_PARTNER') {
    items = [
      { icon: '📦', label: 'Available', page: 'delivery-dashboard' },
      { icon: '🛵', label: 'Active Trip', page: 'delivery-dashboard' },
      { icon: '✅', label: 'Earnings', page: 'delivery-dashboard' },
      { icon: '👤', label: 'Profile', page: 'profile', requireAuth: true },
    ];
  } else if (role === 'ADMIN') {
    items = [
      { icon: '📊', label: 'Overview', page: 'admin' },
      { icon: '🍽️', label: 'Restaurants', page: 'admin' },
      { icon: '📋', label: 'Orders', page: 'admin' },
      { icon: '👥', label: 'Users', page: 'admin' },
      { icon: '👤', label: 'Profile', page: 'profile', requireAuth: true },
    ];
  } else {
    // Customer / Guest
    items = [
      { icon: '🏠', label: 'Home', page: 'home' },
      { icon: '🍽️', label: 'Restaurants', page: 'restaurants' },
      { icon: '♻️', label: 'Rescue', page: 'rescue' },
      { icon: '🛒', label: 'Cart', page: 'cart', badge: cartCount },
      { icon: '👤', label: user ? 'Profile' : 'Sign In', page: user ? 'profile' : 'login', requireAuth: true },
    ];
  }

  return (
    <nav className="mobile-bottom-nav">
      {items.map(item => {
        const active = currentPage === item.page;
        return (
          <button
            key={item.label}
            className={`mobile-nav-item ${active ? 'active' : ''}`}
            onClick={() => navigateTo(item.page)}
            aria-label={item.label}
          >
            <span style={{ position: 'relative', display: 'inline-block' }}>
              {item.icon}
              {item.badge != null && item.badge > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-8px',
                  background: 'var(--brand-orange)',
                  color: 'white',
                  borderRadius: '10px',
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '1px 4px',
                  minWidth: '14px',
                  textAlign: 'center',
                }}>
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
