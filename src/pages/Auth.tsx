import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';

interface Props { mode: 'login' | 'register'; }

export const Auth: React.FC<Props> = ({ mode: initialMode }) => {
  const { login, navigateTo, navParams } = useApp();
  const { toast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>('CUSTOMER');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'CUSTOMER'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [quickLoadingRole, setQuickLoadingRole] = useState<string | null>(null);

  useEffect(() => {
    if (navParams?.role) {
      const paramRole = (navParams.role as string).toUpperCase();
      if (['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_PARTNER', 'ADMIN'].includes(paramRole)) {
        setSelectedRole(paramRole as UserRole);
        setForm(prev => ({ ...prev, role: paramRole }));
      }
    }
  }, [navParams]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode === 'register' && !form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email is required';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const redirectAfterAuth = (userObj: User) => {
    const r = (userObj.role || 'CUSTOMER').toUpperCase();
    if (r === 'ADMIN') {
      navigateTo('admin');
    } else if (r === 'RESTAURANT_OWNER') {
      navigateTo('owner-dashboard');
    } else if (r === 'DELIVERY_PARTNER') {
      navigateTo('delivery-dashboard');
    } else {
      navigateTo('home');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          role: selectedRole
        }),
      });
      const data = await res.json();

      if (res.ok) {
        login(data.user as User, data.token);
        toast('success', `Welcome${mode === 'login' ? ' back' : ''}, ${data.user.name}!`);
        redirectAfterAuth(data.user);
      } else {
        setErrors({ general: data.error || 'Authentication failed. Please verify credentials.' });
      }
    } catch {
      setErrors({ general: 'Network error connecting to backend. Please ensure the server is running.' });
    }
    setLoading(false);
  };

  const handle1ClickLogin = async (email: string, pass: string, roleName: string) => {
    setQuickLoadingRole(roleName);
    setErrors({});
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user as User, data.token);
        toast('success', `Logged in as ${data.user.name} (${roleName})`);
        redirectAfterAuth(data.user);
      } else {
        setErrors({ general: data.error || `Could not log in as ${roleName}` });
      }
    } catch {
      setErrors({ general: 'Network connection failed' });
    } finally {
      setQuickLoadingRole(null);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px 16px', background: 'var(--surface-page)' }}>
      <div style={{ width: '100%', maxWidth: 540 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#1c1c1e', padding: '10px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }}>
            <img src="/logo.png" alt="BiteFlow Logo" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>Bite<span style={{ color: '#fc8019' }}>Flow</span></span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your BiteFlow account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            Multi-role food delivery platform for Customers, Restaurant Owners, Delivery Partners & Admins
          </p>
        </div>

        {/* 1-Click Role Login Demo Bar */}
        <div style={{ background: 'var(--surface-card)', borderRadius: 14, padding: 18, border: '1px solid var(--border-color)', marginBottom: 20, boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⚡ 1-CLICK INSTANT DEMO LOGINS:</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            <button
              type="button"
              disabled={!!quickLoadingRole}
              onClick={() => handle1ClickLogin('user@biteflow.com', 'user123', 'Customer')}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--surface-input)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span style={{ fontSize: 16 }}>🛒</span>
              <div>
                <div>Customer</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>user@biteflow.com</div>
              </div>
            </button>

            <button
              type="button"
              disabled={!!quickLoadingRole}
              onClick={() => handle1ClickLogin('owner@biteflow.com', 'owner123', 'Restaurant Owner')}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--surface-input)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span style={{ fontSize: 16 }}>🍽️</span>
              <div>
                <div>Restaurant Owner</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>owner@biteflow.com</div>
              </div>
            </button>

            <button
              type="button"
              disabled={!!quickLoadingRole}
              onClick={() => handle1ClickLogin('delivery@biteflow.com', 'delivery123', 'Delivery Partner')}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--surface-input)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span style={{ fontSize: 16 }}>🛵</span>
              <div>
                <div>Delivery Partner</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>delivery@biteflow.com</div>
              </div>
            </button>

            <button
              type="button"
              disabled={!!quickLoadingRole}
              onClick={() => handle1ClickLogin('admin@biteflow.com', 'admin123', 'Super Admin')}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--surface-input)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span style={{ fontSize: 16 }}>🛡️</span>
              <div>
                <div>Super Admin</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>admin@biteflow.com</div>
              </div>
            </button>
          </div>
        </div>

        {/* Main Auth Card */}
        <div style={{ background: 'var(--surface-card)', borderRadius: 16, padding: 32, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', borderRadius: 8, background: 'var(--surface-input)', padding: 4, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setErrors({}); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                background: mode === 'login' ? 'var(--primary)' : 'transparent',
                color: mode === 'login' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrors({}); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                background: mode === 'register' ? 'var(--primary)' : 'transparent',
                color: mode === 'register' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              Register New Account
            </button>
          </div>

          {errors.general && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fee2e2', color: '#dc2626', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* If Registering, choose Role */}
            {mode === 'register' && (
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  I WANT TO REGISTER AS:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { id: 'CUSTOMER', label: 'Customer', icon: '🛒' },
                    { id: 'RESTAURANT_OWNER', label: 'Restaurant Owner', icon: '🍽️' },
                    { id: 'DELIVERY_PARTNER', label: 'Delivery Partner', icon: '🛵' }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setSelectedRole(r.id as UserRole);
                        setForm(f => ({ ...f, role: r.id }));
                      }}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: selectedRole === r.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        background: selectedRole === r.id ? 'rgba(252, 128, 25, 0.1)' : 'var(--surface-input)',
                        color: selectedRole === r.id ? 'var(--primary)' : 'var(--text-primary)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{r.icon}</span>
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                />
                {errors.name && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 2 }}>{errors.name}</div>}
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="name@example.com"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
              />
              {errors.email && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 2 }}>{errors.email}</div>}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
              />
              {errors.password && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 2 }}>{errors.password}</div>}
            </div>

            {mode === 'register' && (
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Mobile Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="9876543210"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '12px 20px', fontSize: 15, fontWeight: 700, borderRadius: 8 }}
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In ➔' : 'Complete Registration ➔'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
