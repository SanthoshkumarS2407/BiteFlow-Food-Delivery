import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import AdminRescueTab from '../components/AdminRescueTab';
import AdminGroupDeliveryTab from '../components/AdminGroupDeliveryTab';

type AdminTab = 'overview' | 'restaurants' | 'foods' | 'users' | 'delivery-partners' | 'orders' | 'rescue' | 'group-delivery';

const ORDER_STATUSES = [
  'PLACED',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'DELIVERY_ASSIGNED',
  'GOING_TO_RESTAURANT',
  'ARRIVED_AT_RESTAURANT',
  'FOOD_PICKED_UP',
  'OUT_FOR_DELIVERY',
  'ARRIVED_AT_CUSTOMER',
  'DELIVERED',
  'CANCELLED_BY_RESTAURANT',
  'CANCELLED'
];

export const Admin: React.FC = () => {
  const { user, token, navigateTo, navParams, login } = useApp();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>((navParams?.tab as AdminTab) || 'overview');

  useEffect(() => {
    if (navParams?.tab) {
      setActiveTab(navParams.tab as AdminTab);
    }
  }, [navParams?.tab]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<(Order & { user_account_name?: string; user_email?: string })[]>([]);
  const [restaurants, setRestaurants] = useState<Record<string, unknown>[]>([]);
  const [foods, setFoods] = useState<Record<string, unknown>[]>([]);
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [deliveryPartners, setDeliveryPartners] = useState<Record<string, unknown>[]>([]);
  const [restaurantFilter, setRestaurantFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'SUSPENDED'>('ALL');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'CUSTOMER' | 'RESTAURANT_OWNER' | 'DELIVERY_PARTNER' | 'ADMIN'>('ALL');
  const [loading, setLoading] = useState(true);

  // Search & Pagination States
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [restaurantPage, setRestaurantPage] = useState(1);
  const [foodSearch, setFoodSearch] = useState('');
  const [foodPage, setFoodPage] = useState(1);

  // Restaurant Name Font Color State (Default vibrant blue/indigo, turns to solid Black on click)
  const [blackNamedRestaurantIds, setBlackNamedRestaurantIds] = useState<Set<number>>(new Set());

  // Add Restaurant Modal State
  const [showAddRestaurantModal, setShowAddRestaurantModal] = useState(false);
  const [addingRest, setAddingRest] = useState(false);
  const [newRestForm, setNewRestForm] = useState({
    name: '',
    cuisine: 'South Indian, Biryani',
    description: 'Authentic kitchen with traditional recipes and rapid delivery.',
    address: '42 Anna Salai',
    area: 'T. Nagar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600017',
    phone: '044-28123456',
    price_for_two: 350,
    avg_delivery_time: '25-35 min',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80'
  });

  // Add Delivery Partner Modal State
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [addingPartner, setAddingPartner] = useState(false);
  const [newPartnerForm, setNewPartnerForm] = useState({
    name: '',
    phone: '',
    email: '',
    vehicle: 'Motorcycle',
    vehicle_number: 'TN 38 BL 8912',
    city: 'Chennai'
  });

  const isAdmin = user && (user.role || '').toUpperCase() === 'ADMIN';

  const toggleRestaurantNameBlack = (id: number) => {
    setBlackNamedRestaurantIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Food Name Font Color State (Solid Black on click)
  const [blackNamedFoodIds, setBlackNamedFoodIds] = useState<Set<number>>(new Set());

  const toggleFoodNameBlack = (id: number) => {
    setBlackNamedFoodIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Add Food Item Modal State (Supports adding restaurant for each food, max 10 restaurants)
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [addingFood, setAddingFood] = useState(false);
  const [newFoodForm, setNewFoodForm] = useState({
    name: '',
    category: 'Desserts',
    price: 120,
    is_veg: 1,
    description: 'Freshly prepared specialty dish crafted with authentic ingredients.',
    image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&q=80',
    calories: 280,
    protein: 6,
    restaurant_ids: [] as number[]
  });

  // Assign Food to Restaurants Modal State (Max 10 restaurants)
  const [assignFoodItem, setAssignFoodItem] = useState<Record<string, unknown> | null>(null);
  const [assignRestIds, setAssignRestIds] = useState<number[]>([]);
  const [assigningFood, setAssigningFood] = useState(false);

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newFoodForm.name.trim()) return;
    if (newFoodForm.restaurant_ids.length === 0) {
      toast('error', 'Please select at least 1 restaurant (max 10)');
      return;
    }
    setAddingFood(true);
    try {
      const res = await fetch('/api/admin/foods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...newFoodForm,
          restaurant_ids: newFoodForm.restaurant_ids.slice(0, 10)
        })
      });
      if (res.ok) {
        toast('success', 'Food Item Added!', `${newFoodForm.name} added to ${Math.min(10, newFoodForm.restaurant_ids.length)} restaurant(s).`);
        setShowAddFoodModal(false);
        setNewFoodForm({
          name: '',
          category: 'Desserts',
          price: 120,
          is_veg: 1,
          description: 'Freshly prepared specialty dish crafted with authentic ingredients.',
          image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&q=80',
          calories: 280,
          protein: 6,
          restaurant_ids: []
        });
        fetchData();
      } else {
        toast('error', 'Failed to add food item');
      }
    } catch {
      toast('error', 'Network error');
    } finally {
      setAddingFood(false);
    }
  };

  const handleAssignFoodToRestaurants = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !assignFoodItem) return;
    if (assignRestIds.length === 0) {
      toast('error', 'Please select at least 1 restaurant (max 10)');
      return;
    }
    setAssigningFood(true);
    try {
      const res = await fetch(`/api/admin/foods/${assignFoodItem.id}/assign-restaurants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          restaurant_ids: assignRestIds.slice(0, 10)
        })
      });
      if (res.ok) {
        toast('success', 'Restaurants Assigned!', `Added to ${Math.min(10, assignRestIds.length)} restaurant(s).`);
        setAssignFoodItem(null);
        setAssignRestIds([]);
        fetchData();
      } else {
        toast('error', 'Failed to assign restaurants');
      }
    } catch {
      toast('error', 'Network error');
    } finally {
      setAssigningFood(false);
    }
  };

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newRestForm.name.trim()) return;
    setAddingRest(true);
    try {
      const res = await fetch('/api/admin/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newRestForm)
      });
      if (res.ok) {
        toast('success', 'Restaurant Added!', `${newRestForm.name} is now approved & active.`);
        setShowAddRestaurantModal(false);
        setNewRestForm({
          name: '',
          cuisine: 'South Indian, Biryani',
          description: 'Authentic kitchen with traditional recipes and rapid delivery.',
          address: '42 Anna Salai',
          area: 'T. Nagar',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600017',
          phone: '044-28123456',
          price_for_two: 350,
          avg_delivery_time: '25-35 min',
          image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80'
        });
        fetchData();
      } else {
        toast('error', 'Failed to add restaurant');
      }
    } catch {
      toast('error', 'Network error');
    } finally {
      setAddingRest(false);
    }
  };

  const handleAddDeliveryPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPartnerForm.name.trim() || !newPartnerForm.phone.trim()) return;
    setAddingPartner(true);
    try {
      const res = await fetch('/api/admin/delivery-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newPartnerForm)
      });
      if (res.ok) {
        toast('success', 'Delivery Partner Onboarded!', `${newPartnerForm.name} is now active.`);
        setShowAddPartnerModal(false);
        setNewPartnerForm({
          name: '',
          phone: '',
          email: '',
          vehicle: 'Motorcycle',
          vehicle_number: 'TN 38 BL 8912',
          city: 'Chennai'
        });
        fetchData();
      } else {
        toast('error', 'Failed to onboard partner');
      }
    } catch {
      toast('error', 'Network error');
    } finally {
      setAddingPartner(false);
    }
  };

  const togglePartnerStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'APPROVED' ? 'SUSPENDED' : 'APPROVED';
    try {
      const res = await fetch(`/api/admin/delivery-partners/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setDeliveryPartners(prev => prev.map(p => p.id === id ? { ...p, status: nextStatus } : p));
        toast('info', `Delivery partner status: ${nextStatus}`);
      }
    } catch {
      toast('error', 'Failed to update partner status');
    }
  };

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [statsRes, ordersRes, restaurantsRes, foodsRes, usersRes, partnersRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/orders', { headers }),
        fetch('/api/admin/restaurants', { headers }),
        fetch('/api/admin/foods', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/delivery-partners', { headers }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (restaurantsRes.ok) setRestaurants(await restaurantsRes.json());
      if (foodsRes.ok) setFoods(await foodsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (partnersRes?.ok) setDeliveryPartners(await partnersRes.json());
    } catch {
      toast('error', 'Could not load admin platform data');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [activeTab, isAdmin]);

  if (!user || !isAdmin) {
    const handleQuickAdminLogin = async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@biteflow.com', password: 'admin123' })
        });
        if (res.ok) {
          const data = await res.json();
          login(data.user, data.token);
          toast('success', 'Logged in as Super Admin!', 'Platform controls and staff surplus forecast unlocked.');
        } else {
          toast('error', 'Login failed');
        }
      } catch {
        toast('error', 'Network error');
      }
    };

    return (
      <div style={{ maxWidth: 520, margin: '80px auto', padding: 36, background: 'var(--surface-card)', borderRadius: 20, textAlign: 'center', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🔒</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Admin Access Required</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14, lineHeight: 1.5 }}>
          Access the Super Admin Control Panel to manage kitchen surplus forecasts, listing creator, and group route dispatching.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={handleQuickAdminLogin}
            style={{
              padding: '14px 20px',
              borderRadius: 12,
              background: '#000000',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
            }}
          >
            <span>⚡</span>
            <span>1-Click Super Admin Login (Demo Mode)</span>
          </button>
          <button
            className="btn-secondary"
            style={{ padding: '12px 18px', borderRadius: 10, fontSize: 13 }}
            onClick={() => navigateTo('login', { role: 'admin' })}
          >
            Custom Sign In with Email & Password
          </button>
        </div>
      </div>
    );
  }

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as Order['status'] } : o));
        toast('success', `Order #${orderId} → ${status}`);
      }
    } catch {
      toast('error', 'Failed to update order status');
    }
  };

  const handleUpdateRestaurantStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/restaurants/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setRestaurants(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        toast('success', `Restaurant status updated to ${status}`);
        fetchData();
      }
    } catch {
      toast('error', 'Failed to update restaurant status');
    }
  };

  const toggleFood = async (id: number, is_available: boolean) => {
    await fetch(`/api/admin/foods/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_available: !is_available }),
    });
    setFoods(prev => prev.map(f => f.id === id ? { ...f, is_available: !is_available } : f));
    toast('success', `Item ${!is_available ? 'available' : 'unavailable'}`);
  };

  const toggleUserStatus = async (userId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
        toast('info', `User account ${nextStatus}`);
      }
    } catch {
      toast('error', 'Failed to update user status');
    }
  };

  const TABS: { id: AdminTab; label: string; icon: string; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'restaurants', label: 'Restaurants', icon: '🍽️', badge: stats.pending_restaurants || 0 },
    { id: 'foods', label: 'Food Items', icon: '🍜' },
    { id: 'orders', label: 'Orders Audit', icon: '📋' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'delivery-partners', label: 'Delivery Partners', icon: '🛵' },
    { id: 'rescue', label: 'Surplus Rescue', icon: '♻️' },
    { id: 'group-delivery', label: 'Group Deliveries', icon: '🚚' },
  ];

  const searchedRestaurants = restaurants.filter(r => {
    if (restaurantFilter === 'PENDING') return r.status === 'PENDING_APPROVAL';
    if (restaurantFilter === 'APPROVED') return r.status === 'APPROVED' || !r.status;
    if (restaurantFilter === 'SUSPENDED') return r.status === 'SUSPENDED' || r.status === 'REJECTED';
    return true;
  }).filter(r => {
    if (!restaurantSearch.trim()) return true;
    const q = restaurantSearch.toLowerCase();
    return (
      (r.name as string || '').toLowerCase().includes(q) ||
      (r.cuisine as string || '').toLowerCase().includes(q) ||
      (r.city as string || '').toLowerCase().includes(q) ||
      (r.area as string || '').toLowerCase().includes(q)
    );
  });

  const RESTAURANTS_PER_PAGE = 20;
  const totalRestaurantPages = Math.ceil(searchedRestaurants.length / RESTAURANTS_PER_PAGE) || 1;
  const paginatedRestaurants = searchedRestaurants.slice(
    (restaurantPage - 1) * RESTAURANTS_PER_PAGE,
    restaurantPage * RESTAURANTS_PER_PAGE
  );

  const searchedFoods = foods.filter(f => {
    if (!foodSearch.trim()) return true;
    const q = foodSearch.toLowerCase();
    return (
      (f.name as string || '').toLowerCase().includes(q) ||
      (f.restaurant_name as string || '').toLowerCase().includes(q) ||
      (f.category as string || '').toLowerCase().includes(q)
    );
  });

  const FOODS_PER_PAGE = 30;
  const totalFoodPages = Math.ceil(searchedFoods.length / FOODS_PER_PAGE) || 1;
  const paginatedFoods = searchedFoods.slice(
    (foodPage - 1) * FOODS_PER_PAGE,
    foodPage * FOODS_PER_PAGE
  );

  const filteredUsers = users.filter(u => {
    if (userRoleFilter === 'ALL') return true;
    const r = ((u.role as string) || '').toUpperCase();
    if (userRoleFilter === 'CUSTOMER') return r === 'CUSTOMER' || r === 'USER';
    return r === userRoleFilter;
  });

  return (
    <div style={{ maxWidth: 1240, margin: '24px auto', padding: '0 20px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Super Admin Platform Control</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Monitor orders, approve restaurant partners, regulate catalog & manage users
          </p>
        </div>
        <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={fetchData}>
          ↻ Refresh Platform Data
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '2px solid var(--border-color)', marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 18px',
                border: isActive ? '1.5px solid #000000' : '1px solid transparent',
                borderBottom: isActive ? '3px solid #000000' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: isActive ? 800 : 600,
                borderRadius: '8px 8px 0 0',
                background: isActive ? '#f3f4f6' : 'transparent',
                color: isActive ? '#000000' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.icon}</span>
              <span style={{ color: isActive ? '#000000' : 'inherit', fontWeight: isActive ? 800 : 600 }}>{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span style={{
                  background: isActive ? '#000000' : '#ef4444',
                  color: '#ffffff',
                  fontSize: 11,
                  padding: '2px 7px',
                  borderRadius: 10,
                  fontWeight: 900
                }}>
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {loading && (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading platform analytics...</p>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {!loading && activeTab === 'overview' && (
        <div>
          {/* Top KPI Cards (Section 14) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
            <div style={{ background: 'var(--surface-card)', padding: 18, borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 20 }}>👥</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 6 }}>{stats.total_users || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Platform Users</div>
            </div>
            <div style={{ background: 'var(--surface-card)', padding: 18, borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 20 }}>🛒</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 6 }}>{stats.total_customers || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Active Customers</div>
            </div>
            <div style={{ background: 'var(--surface-card)', padding: 18, borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 20 }}>🍽️</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 6 }}>{stats.total_restaurant_owners || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Restaurant Owners</div>
            </div>
            <div style={{ background: 'var(--surface-card)', padding: 18, borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 20 }}>🛵</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 6 }}>{stats.total_delivery_partners || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Delivery Partners</div>
            </div>
            <div style={{ background: 'var(--surface-card)', padding: 18, borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 20 }}>🏪</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 6 }}>{stats.total_restaurants || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Restaurants</div>
            </div>
            <div style={{ background: 'var(--surface-card)', padding: 18, borderRadius: 12, border: stats.pending_restaurants > 0 ? '2px solid #f59e0b' : '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 20 }}>⏳</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: stats.pending_restaurants > 0 ? '#d97706' : 'var(--text-primary)', marginTop: 6 }}>
                {stats.pending_restaurants || 0}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Pending Approvals</div>
            </div>
            <div style={{ background: 'var(--surface-card)', padding: 18, borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 20 }}>📦</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 6 }}>{stats.total_orders || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Orders Placed</div>
            </div>
            <div style={{ background: 'var(--surface-card)', padding: 18, borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 20 }}>💰</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a', marginTop: 6 }}>₹{stats.total_revenue || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Gross Platform Volume</div>
            </div>
          </div>

          {/* Pending Approval Notice if any */}
          {stats.pending_restaurants > 0 && (
            <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid #f59e0b', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: '#b45309', fontSize: 14 }}>⚠️ {stats.pending_restaurants} Restaurant(s) awaiting approval!</strong>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>Review their kitchen and location details before making them visible to customers.</p>
              </div>
              <button
                onClick={() => { setRestaurantFilter('PENDING'); setActiveTab('restaurants'); }}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: 13 }}
              >
                Review Pending ➔
              </button>
            </div>
          )}

          {/* Live Recent Orders List */}
          <div style={{ background: 'var(--surface-card)', borderRadius: 14, padding: 20, border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Recent Orders Overview</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {orders.slice(0, 6).map(order => (
                <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface-input)', borderRadius: 8, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>#{order.order_code || order.id}</span>
                    <span style={{ margin: '0 8px', color: 'var(--text-secondary)' }}>•</span>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{order.customer_name || order.user_account_name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>({order.restaurant_name})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>₹{order.total}</span>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, fontWeight: 700, background: '#dcfce7', color: '#16a34a' }}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RESTAURANTS TAB (Section 15) */}
      {!loading && activeTab === 'restaurants' && (
        <div>
          {/* Top Bar with Add Restaurant Button and Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                Restaurant Partners Directory ({restaurants.length})
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                Click on any restaurant name to highlight and toggle font color to <strong>Solid Black</strong>.
              </p>
            </div>
            <button
              onClick={() => setShowAddRestaurantModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                transition: 'transform 0.15s'
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <span style={{ fontSize: 18 }}>+</span>
              <span>Add New Restaurant</span>
            </button>
          </div>

          {/* Filters & Search Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12, background: 'var(--surface-card)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['ALL', 'PENDING', 'APPROVED', 'SUSPENDED'] as const).map(f => {
                const isSelected = restaurantFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => { setRestaurantFilter(f); setRestaurantPage(1); }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: isSelected ? 800 : 600,
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid #000000' : '1px solid var(--border-color)',
                      background: isSelected ? '#e5e7eb' : 'var(--surface-input)',
                      color: isSelected ? '#000000' : 'var(--text-secondary)',
                      boxShadow: isSelected ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    {f === 'ALL' ? 'All Restaurants' : f === 'PENDING' ? '⏳ Pending Review' : f === 'APPROVED' ? '✅ Approved' : '🚫 Suspended'}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 280px', maxWidth: 420 }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>🔍</span>
                <input
                  type="text"
                  value={restaurantSearch}
                  onChange={e => { setRestaurantSearch(e.target.value); setRestaurantPage(1); }}
                  placeholder="Search restaurants by name, cuisine, city..."
                  style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 13 }}
                />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {searchedRestaurants.length} found
              </div>
            </div>
          </div>

          {/* Restaurant Cards Grid */}
          <div style={{ display: 'grid', gap: 16 }}>
            {paginatedRestaurants.map((r: Record<string, unknown>) => {
              const status = (r.status as string) || 'APPROVED';
              const isPending = status === 'PENDING_APPROVAL';
              const isBlack = blackNamedRestaurantIds.has(r.id as number);

              return (
                <div
                  key={r.id as number}
                  style={{
                    background: 'var(--surface-card)',
                    borderRadius: 14,
                    padding: 20,
                    border: isPending ? '2px solid #f59e0b' : '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16
                  }}
                >
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <img
                      src={(r.image as string) || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'}
                      alt={r.name as string}
                      style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Interactive Restaurant Name: Distinct color by default, solid BLACK on click */}
                        <h3
                          onClick={() => toggleRestaurantNameBlack(r.id as number)}
                          style={{
                            fontSize: 17,
                            fontWeight: 800,
                            color: isBlack ? '#000000' : '#2563EB',
                            margin: 0,
                            cursor: 'pointer',
                            transition: 'color 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            userSelect: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '2px 4px',
                            borderRadius: 6,
                            background: isBlack ? 'rgba(0,0,0,0.06)' : 'transparent'
                          }}
                          title="Click to toggle name color to Solid Black (#000000)"
                        >
                          <span>{r.name as string}</span>
                          {isBlack ? (
                            <span style={{ fontSize: 10, background: '#000000', color: '#FFFFFF', padding: '2px 6px', borderRadius: 4, fontWeight: 900 }}>
                              BLACK
                            </span>
                          ) : (
                            <span style={{ fontSize: 10, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                              CLICK TO BLACK
                            </span>
                          )}
                        </h3>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: isPending ? '#fef3c7' : status === 'APPROVED' ? '#dcfce7' : '#fee2e2',
                          color: isPending ? '#b45309' : status === 'APPROVED' ? '#16a34a' : '#dc2626'
                        }}>
                          {status}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                        {r.cuisine as string} • {r.area as string || r.city as string} • Rating: ★ {r.rating as number || 4.0} • ₹{r.price_for_two as number || 350} for two
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        Owner: <strong>{(r.owner_name as string) || 'BiteFlow Partner'}</strong> • Contact: {(r.owner_phone as string) || (r.phone as string) || '044-28123456'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleUpdateRestaurantStatus(r.id as number, 'APPROVED')}
                          style={{ padding: '8px 18px', borderRadius: 8, background: '#16a34a', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                        >
                          ✅ Approve Restaurant
                        </button>
                        <button
                          onClick={() => handleUpdateRestaurantStatus(r.id as number, 'REJECTED')}
                          style={{ padding: '8px 14px', borderRadius: 8, background: '#fee2e2', color: '#dc2626', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                        >
                          ❌ Reject
                        </button>
                      </>
                    ) : (
                      <>
                        {status === 'APPROVED' ? (
                          <button
                            onClick={() => handleUpdateRestaurantStatus(r.id as number, 'SUSPENDED')}
                            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fee2e2', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateRestaurantStatus(r.id as number, 'APPROVED')}
                            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #86efac', background: '#dcfce7', color: '#16a34a', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => navigateTo('restaurant-detail', { restaurantId: r.id })}
                          style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          View Menu
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls for Restaurants */}
          {totalRestaurantPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setRestaurantPage(p => Math.max(1, p - 1))}
                disabled={restaurantPage === 1}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-card)', cursor: restaurantPage === 1 ? 'not-allowed' : 'pointer', opacity: restaurantPage === 1 ? 0.5 : 1, fontWeight: 700, fontSize: 13 }}
              >
                ← Previous
              </button>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                Page {restaurantPage} of {totalRestaurantPages} ({searchedRestaurants.length} restaurants)
              </span>
              <button
                onClick={() => setRestaurantPage(p => Math.min(totalRestaurantPages, p + 1))}
                disabled={restaurantPage === totalRestaurantPages}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-card)', cursor: restaurantPage === totalRestaurantPages ? 'not-allowed' : 'pointer', opacity: restaurantPage === totalRestaurantPages ? 0.5 : 1, fontWeight: 700, fontSize: 13 }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* FOOD ITEMS TAB (Section 16) */}
      {!loading && activeTab === 'foods' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Platform Food Catalog ({foods.length} items)
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Click on any food dish name to toggle font color to <strong>Solid Black</strong>. Add food across restaurants (max 10).
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  const first10 = restaurants.slice(0, 10).map(r => r.id as number);
                  setNewFoodForm(prev => ({ ...prev, restaurant_ids: first10 }));
                  setShowAddFoodModal(true);
                }}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  background: '#000000',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                <span>+ Add Food Item</span>
                <span style={{ fontSize: 10, background: '#374151', color: '#ffffff', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>
                  MAX 10 RESTAURANTS
                </span>
              </button>

              <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>🔍</span>
                <input
                  type="text"
                  value={foodSearch}
                  onChange={e => { setFoodSearch(e.target.value); setFoodPage(1); }}
                  placeholder="Filter dishes by name, restaurant, category..."
                  style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 13 }}
                />
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto', background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface-input)', borderBottom: '1px solid var(--border-color)' }}>
                  {['Item', 'Restaurant', 'Category', 'Price', 'Type', 'Nutrition', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedFoods.map((f: Record<string, unknown>) => {
                  const isBlackFood = blackNamedFoodIds.has(f.id as number);
                  return (
                    <tr key={f.id as number} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          onClick={() => toggleFoodNameBlack(f.id as number)}
                          style={{
                            cursor: 'pointer',
                            color: isBlackFood ? '#000000' : 'var(--text-primary)',
                            fontWeight: isBlackFood ? 900 : 700,
                            padding: '3px 6px',
                            borderRadius: 4,
                            background: isBlackFood ? 'rgba(0,0,0,0.08)' : 'transparent',
                            transition: 'all 0.15s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                          title="Click to toggle font color to Solid Black (#000000)"
                        >
                          <span>{f.name as string}</span>
                          {isBlackFood ? (
                            <span style={{ fontSize: 9, background: '#000000', color: '#fff', padding: '1px 5px', borderRadius: 3, fontWeight: 900 }}>
                              BLACK
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {f.restaurant_name as string || 'Platform Partner'}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--surface-input)', fontSize: 12, fontWeight: 600 }}>
                          {f.category as string}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-primary)' }}>₹{f.price as number}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span>{f.is_veg ? '🟢 Veg' : '🔴 Non-Veg'}</span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: 12 }}>
                        {Number(f.calories) || 300} kcal • {Number(f.protein) || 8}g prot
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: f.is_available ? '#16a34a' : '#9ca3af' }}>
                          {f.is_available ? '● Available' : '○ Disabled'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => toggleFood(f.id as number, f.is_available as boolean)}
                            style={{ padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: f.is_available ? '#fee2e2' : '#dcfce7', color: f.is_available ? '#dc2626' : '#16a34a' }}
                          >
                            {f.is_available ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => {
                              setAssignFoodItem(f);
                              const curRestId = f.restaurant_id ? [f.restaurant_id as number] : [];
                              setAssignRestIds(curRestId);
                            }}
                            style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid #000000', background: '#000000', color: '#ffffff' }}
                            title="Add this food to more restaurants (Max 10)"
                          >
                            + Add to Restaurant
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls for Foods */}
          {totalFoodPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 18 }}>
              <button
                onClick={() => setFoodPage(p => Math.max(1, p - 1))}
                disabled={foodPage === 1}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-card)', cursor: foodPage === 1 ? 'not-allowed' : 'pointer', opacity: foodPage === 1 ? 0.5 : 1, fontWeight: 700, fontSize: 12 }}
              >
                ← Prev
              </button>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                Page {foodPage} of {totalFoodPages} ({searchedFoods.length} items)
              </span>
              <button
                onClick={() => setFoodPage(p => Math.min(totalFoodPages, p + 1))}
                disabled={foodPage === totalFoodPages}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-card)', cursor: foodPage === totalFoodPages ? 'not-allowed' : 'pointer', opacity: foodPage === totalFoodPages ? 0.5 : 1, fontWeight: 700, fontSize: 12 }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* USERS TAB (Section 17) */}
      {!loading && activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['ALL', 'CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_PARTNER', 'ADMIN'] as const).map(role => {
                const isSelected = userRoleFilter === role;
                return (
                  <button
                    key={role}
                    onClick={() => setUserRoleFilter(role)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: isSelected ? 800 : 600,
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid #000000' : '1px solid var(--border-color)',
                      background: isSelected ? '#e5e7eb' : 'var(--surface-input)',
                      color: isSelected ? '#000000' : 'var(--text-secondary)',
                      boxShadow: isSelected ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Showing {filteredUsers.length} users
            </div>
          </div>

          <div style={{ overflowX: 'auto', background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface-input)', borderBottom: '1px solid var(--border-color)' }}>
                  {['Name', 'Email', 'Phone', 'Role', 'Status', 'Registered', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u: Record<string, unknown>) => {
                  const status = (u.status as string) || 'active';
                  const isSuspended = status === 'suspended';

                  return (
                    <tr key={u.id as number} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>{u.name as string}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{u.email as string}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{(u.phone as string) || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'var(--surface-input)', color: 'var(--text-primary)' }}>
                          {(u.role as string) || 'CUSTOMER'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isSuspended ? '#dc2626' : '#16a34a' }}>
                          {isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        {u.created_at ? new Date(u.created_at as string).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => toggleUserStatus(u.id as number, status)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: 'none',
                              background: isSuspended ? '#dcfce7' : '#fee2e2',
                              color: isSuspended ? '#16a34a' : '#dc2626'
                            }}
                          >
                            {isSuspended ? 'Reactivate' : 'Suspend'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DELIVERY PARTNERS TAB (Section 18) */}
      {!loading && activeTab === 'delivery-partners' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                Delivery Partners Fleet ({deliveryPartners.length})
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                Manage on-field couriers, track active delivery status & assign vehicles.
              </p>
            </div>
            <button
              onClick={() => setShowAddPartnerModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                transition: 'transform 0.15s'
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <span style={{ fontSize: 18 }}>+</span>
              <span>Onboard Delivery Partner</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto', background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface-input)', borderBottom: '1px solid var(--border-color)' }}>
                  {['Partner Name', 'Phone', 'Vehicle', 'Plate Number', 'Rating', 'Availability', 'Status', 'Deliveries', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deliveryPartners.map((dp: Record<string, unknown>) => {
                  const status = (dp.status as string) || 'APPROVED';
                  const isSuspended = status === 'SUSPENDED';

                  return (
                    <tr key={dp.id as number} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>{dp.name as string}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{(dp.phone as string) || 'N/A'}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>{(dp.vehicle as string) || 'Motorcycle'}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{(dp.vehicle_number as string) || 'TN 09 AB 1234'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#ca8a04' }}>★ {(dp.rating as number) || 4.8}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: dp.is_available ? '#16a34a' : '#9ca3af' }}>
                          {dp.is_available ? '🟢 Online' : '⚪ Offline'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: isSuspended ? '#fee2e2' : '#dcfce7',
                          color: isSuspended ? '#dc2626' : '#16a34a'
                        }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>{(dp.total_deliveries as number) || 0}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <button
                          onClick={() => togglePartnerStatus(dp.id as number, status)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: 'none',
                            background: isSuspended ? '#dcfce7' : '#fee2e2',
                            color: isSuspended ? '#16a34a' : '#dc2626'
                          }}
                        >
                          {isSuspended ? 'Activate' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORDERS AUDIT TAB (Section 19) */}
      {!loading && activeTab === 'orders' && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>All Platform Orders ({orders.length})</h2>
          <div style={{ overflowX: 'auto', background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface-input)', borderBottom: '1px solid var(--border-color)' }}>
                  {['Order Code', 'Customer', 'Restaurant', 'Total', 'Payment', 'Status', 'Date', 'Track'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      #{order.order_code || order.id}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order.customer_name || order.user_account_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{order.phone || order.user_email}</div>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{order.restaurant_name}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-primary)' }}>₹{order.total}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {order.payment_method} ({order.payment_status || 'PAID'})
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <select
                        value={order.status}
                        onChange={e => updateOrderStatus(order.id, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          border: '1px solid var(--border-color)',
                          background: 'var(--surface-input)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: 12 }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        onClick={() => navigateTo('order-tracking', { orderId: order.id })}
                        style={{ padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer' }}
                      >
                        Track
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INNOVATIVE TABS PRESERVED */}
      {!loading && activeTab === 'rescue' && (
        <AdminRescueTab token={token} restaurants={restaurants} />
      )}

      {!loading && activeTab === 'group-delivery' && (
        <AdminGroupDeliveryTab token={token} />
      )}

      {/* ─── ADD RESTAURANT MODAL (Super Admin) ─── */}
      {showAddRestaurantModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(5px)',
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: 'var(--surface-card)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 580,
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 28,
            boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Add New Restaurant Partner
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Super Admin direct onboarding. Restaurant will be approved and visible immediately.
                </p>
              </div>
              <button
                onClick={() => setShowAddRestaurantModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRestaurant}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  required
                  value={newRestForm.name}
                  onChange={e => setNewRestForm({ ...newRestForm, name: e.target.value })}
                  placeholder="e.g. Royal Chettinad Bhavan"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 14 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Cuisine(s) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRestForm.cuisine}
                    onChange={e => setNewRestForm({ ...newRestForm, cuisine: e.target.value })}
                    placeholder="e.g. South Indian, Biryani"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Price for Two (₹)
                  </label>
                  <input
                    type="number"
                    value={newRestForm.price_for_two}
                    onChange={e => setNewRestForm({ ...newRestForm, price_for_two: Number(e.target.value) || 300 })}
                    placeholder="350"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 14 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRestForm.city}
                    onChange={e => setNewRestForm({ ...newRestForm, city: e.target.value })}
                    placeholder="e.g. Chennai"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Area / Locality
                  </label>
                  <input
                    type="text"
                    value={newRestForm.area}
                    onChange={e => setNewRestForm({ ...newRestForm, area: e.target.value })}
                    placeholder="e.g. T. Nagar"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 14 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={newRestForm.phone}
                    onChange={e => setNewRestForm({ ...newRestForm, phone: e.target.value })}
                    placeholder="044-28123456"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Avg Delivery Time
                  </label>
                  <input
                    type="text"
                    value={newRestForm.avg_delivery_time}
                    onChange={e => setNewRestForm({ ...newRestForm, avg_delivery_time: e.target.value })}
                    placeholder="25-35 min"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 14 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Cover Image URL
                </label>
                <input
                  type="text"
                  value={newRestForm.image}
                  onChange={e => setNewRestForm({ ...newRestForm, image: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
                <button
                  type="button"
                  onClick={() => setShowAddRestaurantModal(false)}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingRest}
                  style={{ flex: 2, padding: '12px 16px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#ffffff', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)' }}
                >
                  {addingRest ? 'Saving Restaurant...' : '✓ Save & Approve Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD DELIVERY PARTNER MODAL (Super Admin) ─── */}
      {showAddPartnerModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(5px)',
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: 'var(--surface-card)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 520,
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 28,
            boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Onboard Delivery Partner
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Register a courier into the live hyper-local dispatch fleet.
                </p>
              </div>
              <button
                onClick={() => setShowAddPartnerModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDeliveryPartner}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPartnerForm.name}
                  onChange={e => setNewPartnerForm({ ...newPartnerForm, name: e.target.value })}
                  placeholder="e.g. Murugan K"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 14 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPartnerForm.phone}
                    onChange={e => setNewPartnerForm({ ...newPartnerForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Email (Login)
                  </label>
                  <input
                    type="email"
                    value={newPartnerForm.email}
                    onChange={e => setNewPartnerForm({ ...newPartnerForm, email: e.target.value })}
                    placeholder="partner@biteflow.com"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 14 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Vehicle Type
                  </label>
                  <select
                    value={newPartnerForm.vehicle}
                    onChange={e => setNewPartnerForm({ ...newPartnerForm, vehicle: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 14 }}
                  >
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Scooter">Scooter / Activa</option>
                    <option value="Electric Scooter">Electric Scooter (EV)</option>
                    <option value="Bicycle">Bicycle</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Plate Number
                  </label>
                  <input
                    type="text"
                    value={newPartnerForm.vehicle_number}
                    onChange={e => setNewPartnerForm({ ...newPartnerForm, vehicle_number: e.target.value })}
                    placeholder="TN 38 BL 8912"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 14 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
                <button
                  type="button"
                  onClick={() => setShowAddPartnerModal(false)}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingPartner}
                  style={{ flex: 2, padding: '12px 16px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}
                >
                  {addingPartner ? 'Onboarding Partner...' : '✓ Complete Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD FOOD ITEM MODAL (Multi-Restaurant, Max 10) ─── */}
      {showAddFoodModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(5px)',
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: 'var(--surface-card)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 620,
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 28,
            boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Add Food Item
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Distribute and add this dish to platform restaurants (max 10 restaurants).
                </p>
              </div>
              <button
                onClick={() => setShowAddFoodModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFood}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFoodForm.name}
                    onChange={e => setNewFoodForm({ ...newFoodForm, name: e.target.value })}
                    placeholder="e.g. Authentic Mango Kulfi"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newFoodForm.price}
                    onChange={e => setNewFoodForm({ ...newFoodForm, price: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 14 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Category *
                  </label>
                  <select
                    value={newFoodForm.category}
                    onChange={e => setNewFoodForm({ ...newFoodForm, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 14 }}
                  >
                    <option value="Desserts">Desserts & Sweets</option>
                    <option value="Beverages">Beverages & Shakes</option>
                    <option value="Biryani">Biryani</option>
                    <option value="South Indian">South Indian</option>
                    <option value="North Indian">North Indian</option>
                    <option value="Chinese / Indo-Chinese">Chinese / Indo-Chinese</option>
                    <option value="Snacks & Fast Food">Snacks & Fast Food (Burgers / Pizza)</option>
                    <option value="Tamil Nadu Special">Tamil Nadu Special</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Dietary Classification
                  </label>
                  <select
                    value={newFoodForm.is_veg}
                    onChange={e => setNewFoodForm({ ...newFoodForm, is_veg: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 14 }}
                  >
                    <option value={1}>🟢 Pure Vegetarian (Veg)</option>
                    <option value={0}>🔴 Non-Vegetarian (Non-Veg)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newFoodForm.description}
                  onChange={e => setNewFoodForm({ ...newFoodForm, description: e.target.value })}
                  placeholder="Rich and flavorful dish prepared fresh with quality ingredients."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 13, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={newFoodForm.image}
                    onChange={e => setNewFoodForm({ ...newFoodForm, image: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    value={newFoodForm.calories}
                    onChange={e => setNewFoodForm({ ...newFoodForm, calories: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    value={newFoodForm.protein}
                    onChange={e => setNewFoodForm({ ...newFoodForm, protein: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Multi-Restaurant Selection (Max 10) */}
              <div style={{ background: 'var(--surface-input)', padding: 14, borderRadius: 12, marginBottom: 18, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                  <div>
                    <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                      Select Restaurants for this Food
                    </strong>
                    <span style={{ fontSize: 12, marginLeft: 8, color: newFoodForm.restaurant_ids.length > 10 ? '#dc2626' : '#16a34a', fontWeight: 800 }}>
                      ({newFoodForm.restaurant_ids.length} / 10 Selected — Max 10)
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => {
                        const first10 = restaurants.slice(0, 10).map(r => r.id as number);
                        setNewFoodForm({ ...newFoodForm, restaurant_ids: first10 });
                      }}
                      style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border-color)', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Select First 10
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewFoodForm({ ...newFoodForm, restaurant_ids: [] })}
                      style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border-color)', background: '#fff', cursor: 'pointer', color: '#dc2626' }}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                  {restaurants.map((r: Record<string, unknown>) => {
                    const rId = r.id as number;
                    const isChecked = newFoodForm.restaurant_ids.includes(rId);
                    return (
                      <label
                        key={rId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 10px',
                          borderRadius: 6,
                          background: isChecked ? '#e5e7eb' : '#ffffff',
                          border: isChecked ? '1px solid #000000' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          fontSize: 12,
                          userSelect: 'none'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              if (newFoodForm.restaurant_ids.length >= 10) {
                                toast('error', 'Maximum 10 restaurants allowed per food item');
                                return;
                              }
                              setNewFoodForm({ ...newFoodForm, restaurant_ids: [...newFoodForm.restaurant_ids, rId] });
                            } else {
                              setNewFoodForm({ ...newFoodForm, restaurant_ids: newFoodForm.restaurant_ids.filter(id => id !== rId) });
                            }
                          }}
                        />
                        <span style={{ fontWeight: isChecked ? 800 : 500, color: isChecked ? '#000000' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.name as string}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowAddFoodModal(false)}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingFood || newFoodForm.restaurant_ids.length === 0}
                  style={{
                    flex: 2,
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#000000',
                    color: '#ffffff',
                    fontWeight: 800,
                    cursor: (addingFood || newFoodForm.restaurant_ids.length === 0) ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
                  }}
                >
                  {addingFood ? 'Adding Food Item...' : `✓ Add Food across ${Math.min(10, newFoodForm.restaurant_ids.length)} Restaurants`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ASSIGN FOOD TO RESTAURANTS MODAL (Max 10) ─── */}
      {assignFoodItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(5px)',
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: 'var(--surface-card)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 560,
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 28,
            boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Add "{assignFoodItem.name as string}" to Restaurants
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Current partner: <strong>{assignFoodItem.restaurant_name as string || 'Platform'}</strong>. Select up to 10 restaurants.
                </p>
              </div>
              <button
                onClick={() => setAssignFoodItem(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignFoodToRestaurants}>
              <div style={{ background: 'var(--surface-input)', padding: 14, borderRadius: 12, marginBottom: 18, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#000000' }}>
                    Select Target Restaurants ({assignRestIds.length} / 10 Selected — Max 10)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const first10 = restaurants.slice(0, 10).map(r => r.id as number);
                      setAssignRestIds(first10);
                    }}
                    style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border-color)', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Select First 10
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                  {restaurants.map((r: Record<string, unknown>) => {
                    const rId = r.id as number;
                    const isChecked = assignRestIds.includes(rId);
                    return (
                      <label
                        key={rId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 10px',
                          borderRadius: 6,
                          background: isChecked ? '#e5e7eb' : '#ffffff',
                          border: isChecked ? '1px solid #000000' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          fontSize: 12,
                          userSelect: 'none'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              if (assignRestIds.length >= 10) {
                                toast('error', 'Maximum 10 restaurants allowed per food item');
                                return;
                              }
                              setAssignRestIds([...assignRestIds, rId]);
                            } else {
                              setAssignRestIds(assignRestIds.filter(id => id !== rId));
                            }
                          }}
                        />
                        <span style={{ fontWeight: isChecked ? 800 : 500, color: isChecked ? '#000000' : 'var(--text-primary)' }}>
                          {r.name as string}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setAssignFoodItem(null)}
                  style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigningFood || assignRestIds.length === 0}
                  style={{
                    flex: 2,
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#000000',
                    color: '#ffffff',
                    fontWeight: 800,
                    cursor: (assigningFood || assignRestIds.length === 0) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {assigningFood ? 'Assigning...' : `✓ Assign to ${Math.min(10, assignRestIds.length)} Restaurants`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
