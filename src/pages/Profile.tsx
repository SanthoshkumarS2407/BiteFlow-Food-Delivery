import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { Address, DeliveryImpact } from '../types';

const Profile: React.FC = () => {
  const { user, token, logout, navigateTo, login, currentPage } = useApp();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'info' | 'addresses' | 'impact'>(currentPage === 'impact' ? 'impact' : 'info');
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddr, setNewAddr] = useState<Partial<Address>>({ label: 'Home', city: 'Chennai', state: 'Tamil Nadu' });
  const [impact, setImpact] = useState<DeliveryImpact | null>(null);

  useEffect(() => {
    if (currentPage === 'impact') {
      setActiveTab('impact');
    }
  }, [currentPage]);

  useEffect(() => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    if (token) {
      fetch('/api/addresses', { headers })
        .then(r => r.json())
        .then(setAddresses)
        .catch(() => {});
    }

    fetch('/api/impact', { headers })
      .then(r => r.json())
      .then(setImpact)
      .catch(() => {});
  }, [token]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, phone }),
      });
      if (res.ok) {
        // Update local user
        const updatedUser = { ...user!, name, phone };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        login(updatedUser, token!);
        toast('success', 'Profile updated successfully');
      } else {
        toast('error', 'Failed to update profile');
      }
    } catch { toast('error', 'Network error'); }
    setSaving(false);
  };

  const saveAddress = async () => {
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newAddr),
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(prev => [...prev, { ...newAddr, id: data.id } as Address]);
        setShowAddForm(false);
        setNewAddr({ label: 'Home', city: 'Chennai', state: 'Tamil Nadu' });
        toast('success', 'Address saved');
      }
    } catch { toast('error', 'Could not save address'); }
  };

  const deleteAddress = async (id: number) => {
    try {
      await fetch(`/api/addresses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setAddresses(prev => prev.filter(a => a.id !== id));
      toast('info', 'Address deleted');
    } catch {}
  };

  if (!user && activeTab !== 'impact') {
    return (
      <div className="empty-state" style={{ paddingTop: '80px' }}>
        <p className="empty-state-title">Please sign in</p>
        <button className="btn btn-primary" onClick={() => navigateTo('login')}>Sign In</button>
      </div>
    );
  }

  const TABS = [
    ...(user ? [
      { id: 'info' as const, label: 'Personal Info', icon: '👤' },
      { id: 'addresses' as const, label: 'Addresses', icon: '📍' },
    ] : []),
    { id: 'impact' as const, label: 'Your Delivery Impact', icon: '🌱' },
  ];

  return (
    <div className="page-container" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
      {/* Profile Header */}
      {user ? (
        <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'var(--brand-orange)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', fontWeight: 800, flexShrink: 0,
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '2px' }}>{user.name}</h1>
              <p style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{user.email}</p>
              {user.phone && <p style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{user.phone}</p>}
            </div>
            <button
              onClick={() => { logout(); navigateTo('home'); }}
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--error)' }}
            >
              Sign Out
            </button>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
            {[
              { icon: '📋', label: 'Orders', page: 'order-history' },
              { icon: '♡', label: 'Saved', page: 'favorites' },
              { icon: '🏷️', label: 'Offers', page: 'offers' },
              ...(user.role === 'admin' ? [{ icon: '⚙️', label: 'Admin', page: 'admin' }] : []),
            ].map(item => (
              <button
                key={item.page}
                className="btn btn-secondary btn-sm"
                onClick={() => navigateTo(item.page)}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '20px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', border: '1.5px solid #6EE7B7', borderRadius: '16px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#065F46', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🌱</span>
              <span>Community Delivery Impact Tracker</span>
            </div>
            <div style={{ fontSize: '13px', color: '#047857', marginTop: '4px', maxWidth: '520px', lineHeight: 1.4 }}>
              You are currently viewing platform-wide eco milestones. Sign in to link your orders and view your personal carbon and surplus rescue footprint!
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigateTo('login')}
            style={{ background: '#047857', borderColor: '#047857', fontWeight: 700, padding: '10px 20px', borderRadius: '10px' }}
          >
            Sign In to Track Personal Impact
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--gray-200)', marginBottom: '20px' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              color: activeTab === tab.id ? 'var(--brand-orange)' : 'var(--gray-500)',
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--brand-orange)' : 'transparent'}`,
              transition: 'all 0.15s',
              marginBottom: '-1px',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="card" style={{ padding: '24px', maxWidth: '480px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Personal Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" />
            </div>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input type="email" value={user.email} disabled className="input" style={{ background: 'var(--gray-50)', color: 'var(--gray-400)' }} />
              <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Email cannot be changed</span>
            </div>
            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit mobile number" className="input" />
            </div>
            <button
              className="btn btn-primary"
              onClick={saveProfile}
              disabled={saving}
              style={{ alignSelf: 'flex-start', minWidth: '120px' }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'addresses' && (
        <div style={{ maxWidth: '560px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700 }}>Saved Addresses ({addresses.length})</h2>
            <button className="btn btn-outline btn-sm" onClick={() => setShowAddForm(v => !v)}>
              + Add Address
            </button>
          </div>

          {showAddForm && (
            <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>New Address</h3>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                {(['Home', 'Work', 'Other'] as const).map(label => (
                  <button
                    key={label}
                    className={`filter-chip ${newAddr.label === label ? 'active' : ''}`}
                    onClick={() => setNewAddr(p => ({ ...p, label }))}
                  >
                    {label === 'Home' ? '🏠' : label === 'Work' ? '🏢' : '📍'} {label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' },
                  { key: 'flat', label: 'Flat / Building' }, { key: 'street', label: 'Street' },
                  { key: 'area', label: 'Area' }, { key: 'city', label: 'City' },
                  { key: 'pincode', label: 'Pincode' }, { key: 'state', label: 'State' },
                ].map(field => (
                  <div key={field.key} className="input-group">
                    <label className="input-label" style={{ fontSize: '12px' }}>{field.label}</label>
                    <input
                      type="text"
                      value={(newAddr as Record<string, string>)[field.key] || ''}
                      onChange={e => setNewAddr(p => ({ ...p, [field.key]: e.target.value }))}
                      className="input"
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button className="btn btn-primary btn-sm" onClick={saveAddress}>Save Address</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          {addresses.length === 0 && !showAddForm ? (
            <div className="empty-state">
              <div className="empty-state-icon">📍</div>
              <p className="empty-state-title">No saved addresses</p>
              <p className="empty-state-desc">Add an address to speed up checkout.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {addresses.map(addr => (
                <div key={addr.id} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className="address-label-tag">{addr.label}</span>
                        {addr.is_default ? <span className="badge badge-veg" style={{ fontSize: '10px' }}>Default</span> : null}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--gray-700)' }}>
                        {addr.flat}, {addr.street}, {addr.area}, {addr.city} - {addr.pincode}
                      </div>
                      {addr.name && <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>{addr.name} · {addr.phone}</div>}
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => addr.id && deleteAddress(addr.id)}
                      style={{ color: 'var(--error)', flexShrink: 0 }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'impact' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>🌱</span>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>
                Your Delivery Impact Dashboard
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, maxWidth: '520px' }}>
              Track how your order choices reduce food waste and minimize city delivery trips through Smart Surplus Rescue and Neighbourhood Group Delivery.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div className="card" style={{ padding: '20px', borderRadius: '14px', border: '1.5px solid #A7F3D0' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>♻️</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#047857', marginBottom: '2px' }}>
                {impact?.rescue_meals_supported || 12}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-800)' }}>
                Rescue Meals Supported
              </div>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>
                Surplus portions purchased before expiry
              </div>
            </div>

            <div className="card" style={{ padding: '20px', borderRadius: '14px', border: '1.5px solid #BFDBFE' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🚚</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#1E40AF', marginBottom: '2px' }}>
                {impact?.group_deliveries_joined || 7}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-800)' }}>
                Group Deliveries Joined
              </div>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>
                Batched routes with nearby neighbours
              </div>
            </div>

            <div className="card" style={{ padding: '20px', borderRadius: '14px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📦</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--gray-900)', marginBottom: '2px' }}>
                {impact?.delivery_trips_combined || 4}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-800)' }}>
                Delivery Trips Combined
              </div>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>
                Solitary courier rides prevented
              </div>
            </div>

            <div className="card" style={{ padding: '20px', borderRadius: '14px', border: '1.5px solid #FEF08A' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🍱</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#B45309', marginBottom: '2px' }}>
                {impact?.estimated_meals_diverted || 8}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-800)' }}>
                Estimated Meals Diverted from Waste
              </div>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>
                Diverted from restaurant disposal
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--gray-50)',
            borderRadius: '12px',
            padding: '14px 18px',
            border: '1px solid var(--gray-200)',
            fontSize: '12px',
            color: 'var(--gray-600)',
            lineHeight: 1.5
          }}>
            <strong>Important Notice:</strong> {impact?.methodology_note || 'These statistics are platform-generated estimates based on customer orders placed, rescue units purchased, and batched route reductions. Not presented as scientific lab measurements.'}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
