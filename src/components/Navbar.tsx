import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Notification } from '../types';

const Navbar: React.FC = () => {
  const {
    user, cart, cartCount, navigateTo, logout, currentPage, unreadCount,
    deliveryLocation, setShowLocationModal
  } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFeaturesMenu, setShowFeaturesMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  // Fetch notifications when panel opens
  const fetchNotifications = async () => {
    if (!user) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        // Mark as read
        await fetch('/api/notifications/read', { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      }
    } catch {}
  };

  useEffect(() => {
    if (showNotifications) fetchNotifications();
  }, [showNotifications]);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (featuresRef.current && !featuresRef.current.contains(e.target as Node)) setShowFeaturesMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigateTo('search', { query: searchQuery.trim() });
      setSearchQuery('');
    }
  };

  const isActive = (page: string) => currentPage === page;

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '64px',
      background: 'white',
      borderBottom: '1px solid var(--gray-100)',
      zIndex: 800,
      display: 'flex',
      alignItems: 'center',
    }}>
      <div className="page-container" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Logo */}
        <button
          onClick={() => navigateTo('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
            textDecoration: 'none',
          }}
          aria-label="BiteFlow home"
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0D1117',
            boxShadow: '0 2px 8px rgba(232, 66, 14, 0.25)',
            border: '1.5px solid rgba(255, 107, 61, 0.3)',
            flexShrink: 0
          }}>
            <img
              src="/logo.png"
              alt="BiteFlow Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--gray-900)', letterSpacing: '-0.6px', lineHeight: 1.1 }}>
              Bite<span style={{ color: 'var(--brand-orange)' }}>Flow</span>
            </span>
            <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--brand-orange)', letterSpacing: '1px', textTransform: 'uppercase', lineHeight: 1 }}>
              SUPERFAST
            </span>
          </div>
        </button>

        {/* Location Selector (Deliver To) */}
        <button
          onClick={() => setShowLocationModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--gray-50)',
            border: '1.5px solid var(--gray-200)',
            borderRadius: '10px',
            padding: '5px 10px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s',
            maxWidth: '220px',
            flexShrink: 0
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--brand-orange)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--gray-200)')}
          title="Change delivery location"
        >
          <span style={{ fontSize: '15px' }}>📍</span>
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Deliver to
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {deliveryLocation.label} · {deliveryLocation.area || deliveryLocation.city}
            </div>
          </div>
          <span style={{ fontSize: '9px', color: 'var(--gray-400)', marginLeft: '2px' }}>▼</span>
        </button>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          style={{ flex: 1, maxWidth: '380px' }}
          className="hide-mobile"
        >
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--gray-400)',
              fontSize: '15px',
              pointerEvents: 'none',
            }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search restaurants, dishes, cuisines..."
              style={{
                width: '100%',
                padding: '9px 16px 9px 38px',
                border: '1.5px solid var(--gray-200)',
                borderRadius: '10px',
                fontSize: '14px',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                color: 'var(--gray-900)',
                background: 'var(--gray-50)',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--brand-orange)';
                e.target.style.background = 'white';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--gray-200)';
                e.target.style.background = 'var(--gray-50)';
              }}
            />
          </div>
        </form>

        {/* Right nav items */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          {/* Features Dropdown Menu */}
          <div style={{ position: 'relative' }} ref={featuresRef}>
            <button
              className="hide-mobile"
              onClick={() => setShowFeaturesMenu(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: showFeaturesMenu ? 'var(--gray-100)' : 'rgba(232, 66, 14, 0.08)',
                border: '1.5px solid rgba(232, 66, 14, 0.3)',
                cursor: 'pointer',
                padding: '7px 12px',
                borderRadius: '10px',
                color: 'var(--brand-orange)',
                fontWeight: 700,
                fontSize: '13px',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s',
              }}
              aria-label="Features menu"
            >
              <span>✨ Features</span>
              <span style={{ fontSize: '9px', transition: 'transform 0.2s', transform: showFeaturesMenu ? 'rotate(180deg)' : 'none' }}>▼</span>
            </button>

            {showFeaturesMenu && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '320px',
                background: 'white',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--gray-100)',
                overflow: 'hidden',
                zIndex: 950,
              }}>
                <div style={{
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
                  color: 'white',
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: '#9ca3af', textTransform: 'uppercase' }}>
                    Implemented Innovations
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px', color: '#ffffff' }}>
                    Select an Innovative Feature
                  </div>
                </div>

                <div style={{ padding: '6px' }}>
                  <button
                    onClick={() => { navigateTo('rescue'); setShowFeaturesMenu(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      width: '100%',
                      padding: '10px 12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#ECFDF5')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>♻️</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#047857' }}>
                        Smart Surplus Rescue
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px', lineHeight: 1.3 }}>
                        Dynamic discounted surplus meals (up to 50% off) preventing kitchen waste.
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => { navigateTo('group-tracking'); setShowFeaturesMenu(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      width: '100%',
                      padding: '10px 12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>🚚</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1D4ED8' }}>
                        Neighbourhood Group Delivery
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px', lineHeight: 1.3 }}>
                        Group nearby orders for ₹0 delivery fees, sequential stops & privacy.
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => { navigateTo('impact'); setShowFeaturesMenu(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      width: '100%',
                      padding: '10px 12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F0FDF4')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>🌱</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#15803D' }}>
                        Your Delivery Impact
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px', lineHeight: 1.3 }}>
                        Diverted meal metrics & combined delivery trip statistics.
                      </div>
                    </div>
                  </button>

                  <div style={{ height: '1px', background: 'var(--gray-100)', margin: '4px 8px' }} />

                  <button
                    onClick={() => { navigateTo('admin', { tab: 'rescue' }); setShowFeaturesMenu(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      width: '100%',
                      padding: '10px 12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: '18px', lineHeight: 1 }}>⚙️</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-800)' }}>
                        Restaurant Surplus & Operations
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px', lineHeight: 1.3 }}>
                        Staff forecast table, listing creator & group route controls.
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Smart Surplus Rescue direct button */}
          <button
            className="hide-mobile"
            onClick={() => navigateTo('rescue')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: isActive('rescue') ? '#ECFDF5' : 'none',
              border: isActive('rescue') ? '1px solid #A7F3D0' : 'none',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '8px',
              color: isActive('rescue') ? '#047857' : '#10B981',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#ECFDF5')}
            onMouseLeave={e => (e.currentTarget.style.background = isActive('rescue') ? '#ECFDF5' : 'none')}
            title="Smart Surplus Rescue"
          >
            <span style={{ fontSize: '18px' }}>♻️</span>
            <span style={{ fontSize: '11px', fontWeight: 700 }}>Rescue</span>
          </button>

          {/* Neighbourhood Group Delivery direct button */}
          <button
            className="hide-mobile"
            onClick={() => navigateTo('group-tracking')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: isActive('group-tracking') ? '#EFF6FF' : 'none',
              border: isActive('group-tracking') ? '1px solid #BFDBFE' : 'none',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '8px',
              color: isActive('group-tracking') ? '#1D4ED8' : '#3B82F6',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')}
            onMouseLeave={e => (e.currentTarget.style.background = isActive('group-tracking') ? '#EFF6FF' : 'none')}
            title="Neighbourhood Group Delivery Tracking"
          >
            <span style={{ fontSize: '18px' }}>🚚</span>
            <span style={{ fontSize: '11px', fontWeight: 700 }}>Group</span>
          </button>

          {/* Offers */}
          <button
            className="hide-mobile"
            onClick={() => navigateTo('offers')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '8px',
              color: isActive('offers') ? 'var(--brand-orange)' : 'var(--gray-600)',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-100)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <span style={{ fontSize: '18px' }}>🏷️</span>
            <span style={{ fontSize: '11px', fontWeight: 600 }}>Offers</span>
          </button>

          {/* Favorites */}
          {user && (
            <button
              className="hide-mobile"
              onClick={() => navigateTo('favorites')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: '8px',
                color: isActive('favorites') ? 'var(--brand-orange)' : 'var(--gray-600)',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-100)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ fontSize: '18px' }}>♡</span>
              <span style={{ fontSize: '11px', fontWeight: 600 }}>Saved</span>
            </button>
          )}



          {user && (user.role as string).toUpperCase() === 'RESTAURANT_OWNER' && (
            <button
              className="hide-mobile"
              onClick={() => navigateTo('owner-dashboard')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: isActive('owner-dashboard') ? '#C2410C' : '#FFF7ED',
                border: '1px solid #FDBA74',
                cursor: 'pointer',
                padding: '5px 10px',
                borderRadius: '8px',
                color: isActive('owner-dashboard') ? '#FFFFFF' : '#C2410C',
                transition: 'all 0.15s',
              }}
              title="Restaurant Owner Dashboard"
            >
              <span style={{ fontSize: '16px' }}>🍽️</span>
              <span style={{ fontSize: '11px', fontWeight: 800 }}>Owner Hub</span>
            </button>
          )}

          {user && (user.role as string).toUpperCase() === 'DELIVERY_PARTNER' && (
            <button
              className="hide-mobile"
              onClick={() => navigateTo('delivery-dashboard')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: isActive('delivery-dashboard') ? '#0369A1' : '#F0F9FF',
                border: '1px solid #7DD3FC',
                cursor: 'pointer',
                padding: '5px 10px',
                borderRadius: '8px',
                color: isActive('delivery-dashboard') ? '#FFFFFF' : '#0369A1',
                transition: 'all 0.15s',
              }}
              title="Delivery Partner Dashboard"
            >
              <span style={{ fontSize: '16px' }}>🛵</span>
              <span style={{ fontSize: '11px', fontWeight: 800 }}>Delivery Hub</span>
            </button>
          )}

          {/* Notifications */}
          {user && (
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                className="hide-mobile"
                onClick={() => setShowNotifications(v => !v)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  color: 'var(--gray-600)',
                  transition: 'color 0.15s, background 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-100)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <span style={{ fontSize: '18px' }}>🔔</span>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>Alerts</span>
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    right: '6px',
                    background: 'var(--brand-orange)',
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    minWidth: '16px',
                    textAlign: 'center',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '320px',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-xl)',
                  border: '1px solid var(--gray-100)',
                  overflow: 'hidden',
                  zIndex: 900,
                }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--gray-100)', fontWeight: 700, fontSize: '14px' }}>
                    Notifications
                  </div>
                  <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--gray-400)', fontSize: '13px' }}>
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--gray-50)',
                          background: n.is_read ? 'white' : 'rgba(232, 66, 14, 0.03)',
                        }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-900)' }}>{n.title}</div>
                          {n.message && <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>{n.message}</div>}
                          <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '4px' }}>
                            {new Date(n.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cart (for customers) */}
          <button
            onClick={() => navigateTo('cart')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: cartCount > 0 ? 'var(--brand-orange)' : 'var(--gray-100)',
              color: cartCount > 0 ? 'white' : 'var(--gray-700)',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 14px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '14px',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.2s',
              position: 'relative',
            }}
          >
            <span style={{ fontSize: '16px' }}>🛒</span>
            <span className="hide-mobile">Cart</span>
            {cartCount > 0 && (
              <span style={{
                background: cartCount > 0 ? 'rgba(255,255,255,0.3)' : 'var(--brand-orange)',
                color: cartCount > 0 ? 'white' : 'white',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 800,
                padding: '0 6px',
                minWidth: '20px',
                textAlign: 'center',
              }}>
                {cartCount}
              </span>
            )}
          </button>

          {/* User Menu */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            {user ? (
              <>
                <button
                  onClick={() => setShowUserMenu(v => !v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'none',
                    border: '1.5px solid var(--gray-200)',
                    cursor: 'pointer',
                    padding: '6px 10px',
                    borderRadius: '10px',
                    color: 'var(--gray-700)',
                    fontWeight: 600,
                    fontSize: '13px',
                    fontFamily: 'var(--font-sans)',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand-orange)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--gray-200)')}
                >
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'var(--brand-orange)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 800,
                  }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hide-mobile">{user.name.split(' ')[0]}</span>
                  <span style={{ fontSize: '10px', color: 'var(--gray-400)' }}>▾</span>
                </button>
                {showUserMenu && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '230px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid var(--gray-100)',
                    overflow: 'hidden',
                    zIndex: 900,
                  }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-100)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700 }}>{user.name}</div>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>{user.email}</div>
                      <div style={{ marginTop: '6px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          textTransform: 'uppercase',
                          background: (user.role as string).toUpperCase() === 'ADMIN' ? '#0F172A' : (user.role as string).toUpperCase() === 'RESTAURANT_OWNER' ? '#EA580C' : (user.role as string).toUpperCase() === 'DELIVERY_PARTNER' ? '#0284C7' : '#16A34A',
                          color: '#FFFFFF'
                        }}>
                          {(user.role as string).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {[
                      { label: '👤  Profile Settings', page: 'profile' },
                      ...(((user.role as string).toUpperCase() === 'RESTAURANT_OWNER' || (user.role as string).toUpperCase() === 'ADMIN') ? [
                        { label: '🍽️  Restaurant Dashboard', page: 'owner-dashboard' }
                      ] : []),
                      ...(((user.role as string).toUpperCase() === 'DELIVERY_PARTNER' || (user.role as string).toUpperCase() === 'ADMIN') ? [
                        { label: '🛵  Delivery Partner Portal', page: 'delivery-dashboard' }
                      ] : []),
                      ...((user.role as string).toUpperCase() === 'ADMIN' ? [
                        { label: '🛡️  Super Admin Console', page: 'admin' }
                      ] : []),
                      { label: '📋  My Orders', page: 'order-history' },
                      { label: '♡  Saved Items', page: 'favorites' },
                      { label: '♻️  Smart Surplus Rescue', page: 'rescue' },
                      { label: '🚚  Group Delivery', page: 'group-tracking' },
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={() => { navigateTo(item.page); setShowUserMenu(false); }}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '10px 16px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: 'var(--gray-700)',
                          fontFamily: 'var(--font-sans)',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        {item.label}
                      </button>
                    ))}
                    <div style={{ borderTop: '1px solid var(--gray-100)' }}>
                      <button
                        onClick={() => { logout(); setShowUserMenu(false); }}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '10px 16px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--error)',
                          fontFamily: 'var(--font-sans)',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => navigateTo('login', { role: 'admin' })}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    borderColor: '#CBD5E1',
                    background: '#0F172A',
                    color: '#F8FAFC',
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                  title="Login as Administrator"
                >
                  <span style={{ fontSize: '14px' }}>🛡️</span>
                  <span>Admin</span>
                </button>
                <button
                  onClick={() => navigateTo('login')}
                  className="btn btn-primary btn-sm"
                >
                  Sign in
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
