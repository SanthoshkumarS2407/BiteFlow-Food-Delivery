import React, { useState, useEffect, useCallback } from 'react';
import { Restaurant, Food, FoodCategory, Order, User, DeliveryPartner } from '../types';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';

export const RestaurantOwnerDashboard: React.FC = () => {
  const { user, token, navigateTo, login } = useApp();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'categories' | 'restaurant' | 'delivery'>('orders');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);

  // Delivery Fleet State
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | ''>('');
  const [assigningLoading, setAssigningLoading] = useState(false);

  // Modals
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FoodCategory | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('Items temporarily unavailable');

  // New Restaurant Form State (for onboarding)
  const [regForm, setRegForm] = useState({
    name: '',
    description: '',
    cuisine: 'South Indian, Biryani',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    cover_image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
    phone: user?.phone || '9876500000',
    email: user?.email || '',
    address: '42, Grand Southern Trunk Road',
    area: 'T. Nagar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600017',
    latitude: 13.0418,
    longitude: 80.2341,
    opening_time: '09:00',
    closing_time: '23:00',
    avg_delivery_time: '30 min',
    price_for_two: 350
  });

  // Food Form State
  const [foodForm, setFoodForm] = useState({
    name: '',
    description: '',
    price: 180,
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80',
    category: 'South Indian',
    category_id: undefined as number | undefined,
    is_veg: 1,
    prep_time: '20 min',
    spicy_level: 'Medium',
    calories: 320,
    protein: 8,
    carbs: 45,
    fat: 10,
    fiber: 4,
    sugar: 2,
    sodium: 380,
    tags: 'Vegetarian, Balanced'
  });

  // Category Form State
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });

  const authHeaders = useCallback((): HeadersInit => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }), [token]);

  // Fetch restaurant owned by current user (or selected outlet)
  const fetchOwnerRestaurant = useCallback(async (customRestaurantId?: number) => {
    if (!token) return;
    try {
      setLoading(true);
      const url = customRestaurantId ? `/api/owner/restaurant?restaurant_id=${customRestaurantId}` : '/api/owner/restaurant';
      const res = await fetch(url, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRestaurant(data);
        if (data && Array.isArray(data.restaurants)) {
          setAllRestaurants(data.restaurants);
        }
      }
    } catch {
      toast('error', 'Error loading restaurant profile');
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders, toast]);

  // Fetch Delivery Fleet
  const fetchDeliveryPartners = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingPartners(true);
      const res = await fetch('/api/owner/delivery-partners', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDeliveryPartners(data || []);
      }
    } catch {}
    finally {
      setLoadingPartners(false);
    }
  }, [token, authHeaders]);

  const handleAssignDeliveryPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !assigningOrder || !selectedPartnerId) return;
    setAssigningLoading(true);
    try {
      const res = await fetch(`/api/owner/orders/${assigningOrder.id}/assign-delivery`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ partner_id: Number(selectedPartnerId) })
      });
      if (res.ok) {
        const data = await res.json();
        toast('success', `Assigned to ${data.partner?.name || 'Delivery Partner'}!`, 'Status updated to DELIVERY_ASSIGNED');
        setAssigningOrder(null);
        setSelectedPartnerId('');
        fetchOrders();
      } else {
        const err = await res.json();
        toast('error', err.error || 'Failed to assign delivery partner');
      }
    } catch {
      toast('error', 'Network error assigning delivery partner');
    } finally {
      setAssigningLoading(false);
    }
  };

  // Fetch orders for restaurant
  const fetchOrders = useCallback(async () => {
    if (!token || !restaurant?.id) return;
    try {
      const res = await fetch(`/api/owner/orders/${restaurant.id}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch {}
  }, [token, restaurant?.id, authHeaders]);

  // Fetch foods for restaurant
  const fetchFoods = useCallback(async () => {
    if (!token || !restaurant?.id) return;
    try {
      const res = await fetch(`/api/owner/foods/${restaurant.id}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setFoods(data);
      }
    } catch {}
  }, [token, restaurant?.id, authHeaders]);

  // Fetch categories for restaurant
  const fetchCategories = useCallback(async () => {
    if (!token || !restaurant?.id) return;
    try {
      const res = await fetch(`/api/owner/categories/${restaurant.id}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch {}
  }, [token, restaurant?.id, authHeaders]);

  useEffect(() => {
    fetchOwnerRestaurant();
    fetchDeliveryPartners();
  }, [fetchOwnerRestaurant, fetchDeliveryPartners]);

  useEffect(() => {
    if (restaurant?.id) {
      fetchOrders();
      fetchFoods();
      fetchCategories();
      const interval = setInterval(fetchOrders, 4000);
      return () => clearInterval(interval);
    }
  }, [restaurant?.id, fetchOrders, fetchFoods, fetchCategories]);

  // Create Restaurant (Submit for Admin Approval)
  const handleRegisterRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch('/api/owner/restaurant', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(regForm)
      });
      const data = await res.json();
      if (res.ok) {
        toast('success', 'Restaurant registered successfully!', 'Submitted to Admin for review');
        fetchOwnerRestaurant();
      } else {
        toast('error', data.error || 'Failed to register restaurant');
      }
    } catch {
      toast('error', 'Network error registering restaurant');
    }
  };

  // Toggle Restaurant Open / Closed
  const handleToggleOpen = async () => {
    if (!token || !restaurant) return;
    try {
      const res = await fetch(`/api/owner/restaurant/${restaurant.id}/toggle-open`, {
        method: 'PUT',
        headers: authHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setRestaurant(prev => prev ? { ...prev, is_open: data.is_open } : null);
        toast('info', data.is_open ? 'Restaurant is now OPEN for orders' : 'Restaurant is marked as CLOSED');
      }
    } catch {
      toast('error', 'Failed to toggle status');
    }
  };

  // Order Actions
  const handleAcceptOrder = async (orderId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/owner/orders/${orderId}/accept`, {
        method: 'PUT',
        headers: authHeaders()
      });
      if (res.ok) {
        toast('success', 'Order accepted!', 'Status: CONFIRMED');
        fetchOrders();
      }
    } catch {
      toast('error', 'Failed to accept order');
    }
  };

  const handleConfirmRejectOrder = async () => {
    if (!token || !rejectingOrder) return;
    try {
      const res = await fetch(`/api/owner/orders/${rejectingOrder.id}/reject`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ reason: rejectReason })
      });
      if (res.ok) {
        toast('info', 'Order rejected', `Reason: ${rejectReason}`);
        setRejectingOrder(null);
        fetchOrders();
      }
    } catch {
      toast('error', 'Failed to reject order');
    }
  };

  const handleStartPreparing = async (orderId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/owner/orders/${orderId}/prepare`, {
        method: 'PUT',
        headers: authHeaders()
      });
      if (res.ok) {
        toast('info', 'Food preparation started', 'Status: PREPARING');
        fetchOrders();
      }
    } catch {
      toast('error', 'Failed to update order');
    }
  };

  const handleMarkReady = async (orderId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/owner/orders/${orderId}/ready`, {
        method: 'PUT',
        headers: authHeaders()
      });
      if (res.ok) {
        toast('success', 'Food marked READY FOR PICKUP!', 'Available for delivery partner');
        fetchOrders();
      }
    } catch {
      toast('error', 'Failed to mark ready');
    }
  };

  // Food Item Actions
  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !restaurant) return;
    try {
      const url = editingFood ? `/api/owner/foods/${editingFood.id}` : '/api/owner/foods';
      const method = editingFood ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          ...foodForm,
          restaurant_id: restaurant.id
        })
      });
      if (res.ok) {
        toast('success', editingFood ? 'Food updated' : 'Food item added to menu!');
        setShowAddFoodModal(false);
        setEditingFood(null);
        fetchFoods();
      }
    } catch {
      toast('error', 'Failed to save food item');
    }
  };

  const handleToggleFoodAvail = async (foodId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/owner/foods/${foodId}/toggle`, {
        method: 'PUT',
        headers: authHeaders()
      });
      if (res.ok) {
        fetchFoods();
      }
    } catch {}
  };

  const handleDeleteFood = async (foodId: number) => {
    if (!token || !window.confirm('Delete this food item from your menu?')) return;
    try {
      const res = await fetch(`/api/owner/foods/${foodId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (res.ok) {
        toast('info', 'Food item deleted');
        fetchFoods();
      }
    } catch {
      toast('error', 'Failed to delete food');
    }
  };

  // Category Actions
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !restaurant) return;
    try {
      const url = editingCategory ? `/api/owner/categories/${editingCategory.id}` : '/api/owner/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          ...categoryForm,
          restaurant_id: restaurant.id
        })
      });
      if (res.ok) {
        toast('success', editingCategory ? 'Category updated' : 'Category created');
        setShowAddCategoryModal(false);
        setEditingCategory(null);
        fetchCategories();
      }
    } catch {
      toast('error', 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (catId: number) => {
    if (!token || !window.confirm('Delete this category?')) return;
    try {
      const res = await fetch(`/api/owner/categories/${catId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (res.ok) {
        toast('info', 'Category removed');
        fetchCategories();
      }
    } catch {}
  };

  if (!user || (user.role !== 'RESTAURANT_OWNER' && user.role !== 'ADMIN')) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: 32, background: 'var(--surface-card)', borderRadius: 16, textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Restaurant Owner Portal</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>You must be logged in as a registered Restaurant Owner to access this dashboard.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => navigateTo('login')}>Log in as Restaurant Owner</button>
          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: 'owner@biteflow.com', password: 'owner123' })
                });
                if (res.ok) {
                  const d = await res.json();
                  login(d.user, d.token);
                  toast('success', 'Logged in as Restaurant Owner (Vikram Sundaram)');
                }
              } catch {}
            }}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              background: 'var(--surface-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ⚡ 1-Click Demo Login (Vikram Sundaram)
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading Restaurant Owner Dashboard...</p>
      </div>
    );
  }

  // If no restaurant created yet -> Show Onboarding Form
  if (!restaurant) {
    return (
      <div style={{ maxWidth: 840, margin: '40px auto', padding: '0 20px' }}>
        <div style={{ background: 'var(--surface-card)', padding: 36, borderRadius: 16, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(252, 128, 25, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              🍽️
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>Partner With BiteFlow</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Register your restaurant and reach thousands of hungry customers across your city</p>
            </div>
          </div>

          <form onSubmit={handleRegisterRestaurant}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Restaurant Name *</label>
                <input
                  type="text"
                  required
                  value={regForm.name}
                  onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                  placeholder="e.g. Royal Chettinad Kitchen"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Cuisine(s) *</label>
                <input
                  type="text"
                  required
                  value={regForm.cuisine}
                  onChange={e => setRegForm({ ...regForm, cuisine: e.target.value })}
                  placeholder="e.g. South Indian, Biryani, Chinese"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Description</label>
              <textarea
                rows={2}
                value={regForm.description}
                onChange={e => setRegForm({ ...regForm, description: e.target.value })}
                placeholder="Share your restaurant's story, specialities and culinary heritage..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Full Address *</label>
                <input
                  type="text"
                  required
                  value={regForm.address}
                  onChange={e => setRegForm({ ...regForm, address: e.target.value })}
                  placeholder="Door No, Street Name"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Area / Locality *</label>
                <input
                  type="text"
                  required
                  value={regForm.area}
                  onChange={e => setRegForm({ ...regForm, area: e.target.value })}
                  placeholder="e.g. T. Nagar, Gandhipuram"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>City *</label>
                <input
                  type="text"
                  required
                  value={regForm.city}
                  onChange={e => setRegForm({ ...regForm, city: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Pincode *</label>
                <input
                  type="text"
                  required
                  value={regForm.pincode}
                  onChange={e => setRegForm({ ...regForm, pincode: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Opening Time</label>
                <input
                  type="time"
                  value={regForm.opening_time}
                  onChange={e => setRegForm({ ...regForm, opening_time: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Closing Time</label>
                <input
                  type="time"
                  value={regForm.closing_time}
                  onChange={e => setRegForm({ ...regForm, closing_time: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Avg Delivery Time</label>
                <input
                  type="text"
                  value={regForm.avg_delivery_time}
                  onChange={e => setRegForm({ ...regForm, avg_delivery_time: e.target.value })}
                  placeholder="e.g. 25-35 min"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Approx Price for Two (₹)</label>
                <input
                  type="number"
                  value={regForm.price_for_two}
                  onChange={e => setRegForm({ ...regForm, price_for_two: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Restaurant Banner / Image URL</label>
              <input
                type="text"
                value={regForm.image}
                onChange={e => setRegForm({ ...regForm, image: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
              />
            </div>

            <div style={{ background: 'rgba(252, 128, 25, 0.08)', padding: 16, borderRadius: 8, marginBottom: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
              ℹ️ <strong>Approval Workflow:</strong> Once submitted, your restaurant will be set to <code style={{ color: '#fc8019' }}>PENDING_APPROVAL</code>. Platform administrators will review your details before it is published to customers.
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px 20px', fontSize: 16, fontWeight: 700 }}>
              Submit Restaurant for Admin Review ➔
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isApproved = restaurant.status === 'APPROVED' || !restaurant.status;

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 20px 80px' }}>
      {/* Header Profile Bar */}
      <div style={{ background: 'var(--surface-card)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img
              src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'}
              alt={restaurant.name}
              style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{restaurant.name}</h1>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  background: isApproved ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                  color: isApproved ? '#16a34a' : '#ca8a04',
                  border: `1px solid ${isApproved ? '#22c55e' : '#eab308'}`
                }}>
                  {restaurant.status || 'APPROVED'}
                </span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  background: restaurant.is_open ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: restaurant.is_open ? '#16a34a' : '#dc2626'
                }}>
                  {restaurant.is_open ? '● OPEN FOR ORDERS' : '○ CLOSED'}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                {restaurant.cuisine} • {restaurant.area || restaurant.city} • Timings: {restaurant.opening_time || '9:00 AM'} - {restaurant.closing_time || '11:00 PM'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleToggleOpen}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                background: restaurant.is_open ? '#fee2e2' : '#dcfce7',
                color: restaurant.is_open ? '#dc2626' : '#16a34a',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {restaurant.is_open ? '🔴 Close Kitchen' : '🟢 Open Kitchen'}
            </button>
          </div>
        </div>

        {/* Restaurant Switcher for multi-outlet owner or admin */}
        {allRestaurants.length > 1 && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>🏢 Switch Active Restaurant ({allRestaurants.length}):</span>
              <select
                value={restaurant.id}
                onChange={(e) => fetchOwnerRestaurant(Number(e.target.value))}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1.5px solid var(--primary)',
                  background: 'var(--surface-input)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                {allRestaurants.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.city || r.area || 'Active'}
                  </option>
                ))}
              </select>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Manage menu, orders and assign delivery partner for this outlet
            </span>
          </div>
        )}

        {/* Approval Notice Banner */}
        {!isApproved && (
          <div style={{ marginTop: 20, padding: 14, borderRadius: 10, background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#b45309', fontSize: 13 }}>
            ⏳ <strong>Notice:</strong> Your restaurant status is <strong>{restaurant.status}</strong>. Newly added restaurants require Super Admin verification before dishes appear in public search and home carousels. You can still set up your dishes and categories in advance!
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid var(--border-color)', marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { id: 'orders', label: `Live Orders (${orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'CANCELLED_BY_RESTAURANT').length})`, icon: '📋' },
          { id: 'menu', label: `Menu Items (${foods.length})`, icon: '🍲' },
          { id: 'categories', label: `Categories (${categories.length})`, icon: '🏷️' },
          { id: 'delivery', label: `Delivery Fleet (${deliveryPartners.length})`, icon: '🛵' },
          { id: 'restaurant', label: 'Restaurant Settings', icon: '⚙️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0',
              background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: LIVE ORDERS */}
      {activeTab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <div style={{ background: 'var(--surface-card)', borderRadius: 16, padding: 60, textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>No Orders Yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Live customer orders will appear here automatically with sound and instant alerts.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {orders.map(order => {
                const isNew = order.status === 'PLACED' || order.status === 'Pending';
                const isConfirmed = order.status === 'CONFIRMED' || order.status === 'Confirmed';
                const isPreparing = order.status === 'PREPARING' || order.status === 'Preparing';
                const isReady = order.status === 'READY_FOR_PICKUP' || order.status === 'Ready';
                const isCancelled = order.status === 'CANCELLED_BY_RESTAURANT' || order.status === 'CANCELLED';

                return (
                  <div
                    key={order.id}
                    style={{
                      background: 'var(--surface-card)',
                      borderRadius: 14,
                      padding: 20,
                      border: isNew ? '2px solid #fc8019' : '1px solid var(--border-color)',
                      boxShadow: isNew ? '0 4px 16px rgba(252, 128, 25, 0.15)' : 'var(--shadow-xs)'
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                            Order #{order.order_code || `BF${100000 + order.id}`}
                          </span>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            background: isNew ? '#fed7aa' : isConfirmed ? '#bbf7d0' : isPreparing ? '#fef08a' : isReady ? '#e0e7ff' : '#f3f4f6',
                            color: isNew ? '#c2410c' : isConfirmed ? '#15803d' : isPreparing ? '#a16207' : isReady ? '#4338ca' : '#4b5563'
                          }}>
                            {order.status}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                          Customer: <strong style={{ color: 'var(--text-primary)' }}>{order.customer_name}</strong> • Phone: {order.phone || 'N/A'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          📍 Address: {order.address || 'Local Customer Address'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>₹{order.total}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {order.payment_method} ({order.payment_status || 'PAID'})
                        </div>
                      </div>
                    </div>

                    {/* Order Items List */}
                    <div style={{ background: 'var(--surface-input)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>
                        Dishes to Prepare:
                      </div>
                      <div style={{ display: 'grid', gap: 6 }}>
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                              {item.food_name} <span style={{ color: 'var(--primary)' }}>× {item.quantity}</span>
                            </span>
                            <span style={{ color: 'var(--text-secondary)' }}>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sequential Lifecycle Control Buttons */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
                      {isNew && (
                        <>
                          <button
                            onClick={() => { setRejectingOrder(order); }}
                            style={{
                              padding: '8px 16px',
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: '1px solid #fca5a5'
                            }}
                          >
                            ✕ Reject Order
                          </button>
                          <button
                            onClick={() => handleAcceptOrder(order.id)}
                            style={{
                              padding: '8px 20px',
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: '#16a34a',
                              color: '#ffffff',
                              border: 'none',
                              boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
                            }}
                          >
                            ✓ Accept Order
                          </button>
                        </>
                      )}

                      {isConfirmed && (
                        <button
                          onClick={() => handleStartPreparing(order.id)}
                          style={{
                            padding: '8px 20px',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: '#ea580c',
                            color: '#ffffff',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          🍳 Start Preparing Food
                        </button>
                      )}

                      {isPreparing && (
                        <button
                          onClick={() => handleMarkReady(order.id)}
                          style={{
                            padding: '8px 20px',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: '#4f46e5',
                            color: '#ffffff',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          📦 Mark Ready for Pickup
                        </button>
                      )}

                      {/* Delivery Partner Assigned Badge */}
                      {order.delivery_partner && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 12px',
                          borderRadius: 8,
                          background: 'rgba(2, 132, 199, 0.12)',
                          border: '1px solid rgba(2, 132, 199, 0.3)',
                          color: '#0284c7',
                          fontSize: 13,
                          fontWeight: 700
                        }}>
                          <span>🛵 Assigned Courier:</span>
                          <strong style={{ color: 'var(--text-primary)' }}>{order.delivery_partner}</strong>
                          {order.delivery_partner_phone && (
                            <a
                              href={`tel:${order.delivery_partner_phone}`}
                              style={{ color: '#0284c7', textDecoration: 'none', background: 'rgba(2, 132, 199, 0.1)', padding: '2px 8px', borderRadius: 4 }}
                            >
                              📞 {order.delivery_partner_phone}
                            </a>
                          )}
                        </div>
                      )}

                      {/* Assign Delivery Partner Button for pending orders */}
                      {!order.delivery_partner && (isConfirmed || isPreparing || isReady) && (
                        <button
                          onClick={() => {
                            setAssigningOrder(order);
                            if (deliveryPartners.length > 0 && !selectedPartnerId) {
                              setSelectedPartnerId(deliveryPartners[0].id);
                            }
                          }}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                          }}
                        >
                          🛵 Assign Delivery Partner
                        </button>
                      )}

                      {isReady && !order.delivery_partner && (
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#4338ca', display: 'flex', alignItems: 'center', gap: 6 }}>
                          📦 Ready for Pickup (Select courier above or await auto-dispatch)
                        </div>
                      )}

                      {order.status === 'DELIVERY_ASSIGNED' && (
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0284c7' }}>
                          🛵 Delivery partner is on the way to restaurant
                        </div>
                      )}

                      {order.status === 'ARRIVED_AT_RESTAURANT' && (
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>
                          📍 Delivery partner {order.delivery_partner} has arrived at your restaurant! Hand over the package.
                        </div>
                      )}

                      {order.status === 'OUT_FOR_DELIVERY' && (
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                          🚀 Out for delivery with {order.delivery_partner}
                        </div>
                      )}

                      {order.status === 'DELIVERED' && (
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                          ✅ Delivered successfully
                        </div>
                      )}

                      {isCancelled && (
                        <div style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
                          Cancelled ({order.cancel_reason || 'By restaurant'})
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MENU MANAGEMENT */}
      {activeTab === 'menu' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Manage Restaurant Menu</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Add, edit prices, update nutrition info and toggle food availability</p>
            </div>
            <button
              onClick={() => {
                setEditingFood(null);
                setFoodForm({
                  name: '',
                  description: '',
                  price: 180,
                  image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80',
                  category: categories[0]?.name || 'Main Course',
                  category_id: categories[0]?.id,
                  is_veg: 1,
                  prep_time: '20 min',
                  spicy_level: 'Medium',
                  calories: 320,
                  protein: 8,
                  carbs: 45,
                  fat: 10,
                  fiber: 4,
                  sugar: 2,
                  sodium: 380,
                  tags: 'Vegetarian, Balanced'
                });
                setShowAddFoodModal(true);
              }}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              + Add New Dish
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {foods.map(food => (
              <div
                key={food.id}
                style={{
                  background: 'var(--surface-card)',
                  borderRadius: 12,
                  padding: 16,
                  border: '1px solid var(--border-color)',
                  opacity: food.is_available === 0 ? 0.65 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <img
                      src={food.image || 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&q=80'}
                      alt={food.name}
                      style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13 }}>{food.is_veg ? '🟢' : '🔴'}</span>
                        <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{food.name}</h4>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
                        ₹{food.price}
                      </div>
                      <span style={{ fontSize: 11, background: 'var(--surface-input)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-secondary)' }}>
                        {food.category || 'General'}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {food.description}
                  </p>

                  {/* Nutrition pills */}
                  <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 14, flexWrap: 'wrap' }}>
                    <span>🔥 {food.calories || 300} kcal</span>
                    <span>💪 {food.protein || 8}g protein</span>
                    <span>⏱️ {food.prep_time || '20 min'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => handleToggleFoodAvail(food.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      background: food.is_available ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: food.is_available ? '#16a34a' : '#dc2626'
                    }}
                  >
                    {food.is_available ? '● Available' : '○ Disabled'}
                  </button>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => {
                        setEditingFood(food);
                        setFoodForm({
                          name: food.name,
                          description: food.description || '',
                          price: food.price,
                          image: food.image || '',
                          category: food.category || 'Main Course',
                          category_id: food.category_id,
                          is_veg: food.is_veg,
                          prep_time: food.prep_time || '20 min',
                          spicy_level: food.spicy_level || 'Medium',
                          calories: food.calories || 300,
                          protein: food.protein || 8,
                          carbs: food.carbs || 35,
                          fat: food.fat || 10,
                          fiber: food.fiber || 3,
                          sugar: food.sugar || 2,
                          sodium: food.sodium || 400,
                          tags: food.tags || ''
                        });
                        setShowAddFoodModal(true);
                      }}
                      style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteFood(food.id)}
                      style={{ padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES */}
      {activeTab === 'categories' && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Menu Categories</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Create dish categories (e.g. Biryani, Starters, Beverages)</p>
            </div>
            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryForm({ name: '', description: '' });
                setShowAddCategoryModal(true);
              }}
              className="btn-primary"
            >
              + Add Category
            </button>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {categories.map(cat => (
              <div
                key={cat.id}
                style={{
                  background: 'var(--surface-card)',
                  borderRadius: 10,
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{cat.name}</div>
                  {cat.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{cat.description}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setCategoryForm({ name: cat.name, description: cat.description || '' });
                      setShowAddCategoryModal(true);
                    }}
                    style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    style={{ padding: '6px 10px', borderRadius: 6, fontSize: 12, border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RESTAURANT SETTINGS */}
      {activeTab === 'restaurant' && (
        <div style={{ maxWidth: 800, background: 'var(--surface-card)', padding: 28, borderRadius: 14, border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Edit Restaurant Details</h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!token || !restaurant) return;
            try {
              const res = await fetch(`/api/owner/restaurant/${restaurant.id}`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify(restaurant)
              });
              if (res.ok) {
                toast('success', 'Restaurant settings saved');
                fetchOwnerRestaurant();
              }
            } catch {
              toast('error', 'Failed to save settings');
            }
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Restaurant Name</label>
                <input
                  type="text"
                  value={restaurant.name}
                  onChange={e => setRestaurant({ ...restaurant, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Cuisines</label>
                <input
                  type="text"
                  value={restaurant.cuisine}
                  onChange={e => setRestaurant({ ...restaurant, cuisine: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Description</label>
              <textarea
                rows={2}
                value={restaurant.description || ''}
                onChange={e => setRestaurant({ ...restaurant, description: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Opening Time</label>
                <input
                  type="time"
                  value={restaurant.opening_time || '09:00'}
                  onChange={e => setRestaurant({ ...restaurant, opening_time: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Closing Time</label>
                <input
                  type="time"
                  value={restaurant.closing_time || '23:00'}
                  onChange={e => setRestaurant({ ...restaurant, closing_time: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Price for Two (₹)</label>
                <input
                  type="number"
                  value={restaurant.price_for_two || 350}
                  onChange={e => setRestaurant({ ...restaurant, price_for_two: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>Save Changes</button>
          </form>
        </div>
      )}

      {/* TAB 5: DELIVERY FLEET */}
      {activeTab === 'delivery' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                Delivery Partners Fleet
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
                Active BiteFlow delivery partners available in your service area for order pickup and doorstep drop-off
              </p>
            </div>
            <button
              onClick={fetchDeliveryPartners}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: 'var(--surface-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              🔄 Refresh Fleet Status
            </button>
          </div>

          {loadingPartners ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading available delivery fleet...</p>
            </div>
          ) : deliveryPartners.length === 0 ? (
            <div style={{ background: 'var(--surface-card)', borderRadius: 16, padding: 50, textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🛵</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>No Active Delivery Partners Found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 440, margin: '0 auto' }}>
                Super Admin can onboard new delivery partners from the Admin Panel. When partners are approved and online, they will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {deliveryPartners.map(dp => {
                const isOnline = dp.is_available === 1;
                return (
                  <div
                    key={dp.id}
                    style={{
                      background: 'var(--surface-card)',
                      borderRadius: 14,
                      padding: 20,
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-xs)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 16
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: 'rgba(2, 132, 199, 0.12)',
                            color: '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22
                          }}>
                            {dp.vehicle === 'Bicycle' ? '🚲' : dp.vehicle === 'Electric Scooter' ? '⚡' : '🏍️'}
                          </div>
                          <div>
                            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px' }}>
                              {dp.name}
                            </h3>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                              {dp.vehicle || 'Motorcycle'} {dp.vehicle_number ? `• ${dp.vehicle_number}` : ''}
                            </div>
                          </div>
                        </div>

                        <span style={{
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          background: isOnline ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                          color: isOnline ? '#16a34a' : '#dc2626',
                          border: `1px solid ${isOnline ? '#86efac' : '#fca5a5'}`
                        }}>
                          {isOnline ? '🟢 Available' : '🔴 Busy / Offline'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'var(--surface-input)', padding: 12, borderRadius: 10, fontSize: 12 }}>
                        <div>
                          <div style={{ color: 'var(--text-secondary)' }}>Rating</div>
                          <div style={{ fontWeight: 800, color: '#ca8a04', marginTop: 2 }}>
                            ⭐ {dp.rating ? dp.rating.toFixed(1) : '5.0'} / 5.0
                          </div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-secondary)' }}>Total Deliveries</div>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                            📦 {dp.total_deliveries || 0} completed
                          </div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-secondary)' }}>Phone Contact</div>
                          <a href={`tel:${dp.phone}`} style={{ fontWeight: 700, color: '#0284c7', textDecoration: 'none', display: 'block', marginTop: 2 }}>
                            📞 {dp.phone || '9876543210'}
                          </a>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-secondary)' }}>Account Status</div>
                          <div style={{ fontWeight: 700, color: '#16a34a', marginTop: 2 }}>
                            ✓ Verified Partner
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <a
                        href={`tel:${dp.phone}`}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--border-color)',
                          background: 'transparent',
                          color: 'var(--text-primary)',
                          fontWeight: 700,
                          fontSize: 13,
                          textDecoration: 'none',
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        📞 Call Partner
                      </a>
                      {orders.some(o => (o.status === 'CONFIRMED' || o.status === 'PREPARING' || o.status === 'READY_FOR_PICKUP') && !o.delivery_partner) && (
                        <button
                          onClick={() => {
                            const pendingOrder = orders.find(o => (o.status === 'CONFIRMED' || o.status === 'PREPARING' || o.status === 'READY_FOR_PICKUP') && !o.delivery_partner);
                            if (pendingOrder) {
                              setAssigningOrder(pendingOrder);
                              setSelectedPartnerId(dp.id);
                            }
                          }}
                          style={{
                            flex: 1.5,
                            padding: '8px 12px',
                            borderRadius: 8,
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer'
                          }}
                        >
                          🛵 Assign Order
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT FOOD MODAL */}
      {showAddFoodModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--surface-card)', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {editingFood ? 'Edit Dish' : 'Add New Dish to Menu'}
              </h3>
              <button onClick={() => setShowAddFoodModal(false)} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
            </div>

            <form onSubmit={handleSaveFood}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Dish Name *</label>
                  <input
                    type="text"
                    required
                    value={foodForm.name}
                    onChange={e => setFoodForm({ ...foodForm, name: e.target.value })}
                    placeholder="e.g. Chettinad Chicken Biryani"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={foodForm.price}
                    onChange={e => setFoodForm({ ...foodForm, price: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Description</label>
                <textarea
                  rows={2}
                  value={foodForm.description}
                  onChange={e => setFoodForm({ ...foodForm, description: e.target.value })}
                  placeholder="Ingredients, culinary details..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Category</label>
                  <select
                    value={foodForm.category}
                    onChange={e => setFoodForm({ ...foodForm, category: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                  >
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    <option value="South Indian">South Indian</option>
                    <option value="Biryani">Biryani</option>
                    <option value="Starters">Starters</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Diet Type</label>
                  <select
                    value={foodForm.is_veg}
                    onChange={e => setFoodForm({ ...foodForm, is_veg: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                  >
                    <option value={1}>🟢 Vegetarian</option>
                    <option value={0}>🔴 Non-Vegetarian</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Spicy Level</label>
                  <select
                    value={foodForm.spicy_level}
                    onChange={e => setFoodForm({ ...foodForm, spicy_level: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                  >
                    <option value="Mild">Mild</option>
                    <option value="Medium">Medium</option>
                    <option value="Hot">Spicy / Hot</option>
                    <option value="Extra Hot">Extra Fiery 🔥</option>
                  </select>
                </div>
              </div>

              {/* Nutrition Section */}
              <div style={{ background: 'var(--surface-input)', padding: 12, borderRadius: 8, marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Nutrition Information (Per Serving)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Calories (kcal)</label>
                    <input
                      type="number"
                      value={foodForm.calories}
                      onChange={e => setFoodForm({ ...foodForm, calories: Number(e.target.value) })}
                      style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid var(--border-color)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Protein (g)</label>
                    <input
                      type="number"
                      value={foodForm.protein}
                      onChange={e => setFoodForm({ ...foodForm, protein: Number(e.target.value) })}
                      style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid var(--border-color)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Carbs (g)</label>
                    <input
                      type="number"
                      value={foodForm.carbs}
                      onChange={e => setFoodForm({ ...foodForm, carbs: Number(e.target.value) })}
                      style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid var(--border-color)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Fat (g)</label>
                    <input
                      type="number"
                      value={foodForm.fat}
                      onChange={e => setFoodForm({ ...foodForm, fat: Number(e.target.value) })}
                      style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid var(--border-color)' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Dish Image URL</label>
                <input
                  type="text"
                  value={foodForm.image}
                  onChange={e => setFoodForm({ ...foodForm, image: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowAddFoodModal(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 20px' }}>Save Dish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT CATEGORY MODAL */}
      {showAddCategoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--surface-card)', borderRadius: 16, width: '100%', maxWidth: 440, padding: 24 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14 }}>
              {editingCategory ? 'Edit Category' : 'Add Food Category'}
            </h3>
            <form onSubmit={handleSaveCategory}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Starters, Tiffin, Biryani"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Description</label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Brief description"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowAddCategoryModal(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 18px' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT ORDER MODAL */}
      {rejectingOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--surface-card)', borderRadius: 16, width: '100%', maxWidth: 460, padding: 24 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#dc2626', marginBottom: 10 }}>
              Reject Order #{rejectingOrder.order_code || rejectingOrder.id}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Please provide a valid cancellation reason to notify the customer:
            </p>
            <div style={{ marginBottom: 18 }}>
              <select
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-input)', color: 'var(--text-primary)' }}
              >
                <option value="Items temporarily unavailable / Out of stock">Items temporarily unavailable / Out of stock</option>
                <option value="Kitchen overloaded with dinner peak rush">Kitchen overloaded with dinner peak rush</option>
                <option value="Restaurant closing for the shift">Restaurant closing for the shift</option>
                <option value="Delivery address is outside service range">Delivery address is outside service range</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setRejectingOrder(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleConfirmRejectOrder} style={{ padding: '8px 18px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN DELIVERY PARTNER MODAL */}
      {assigningOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: 20 }}>
          <div style={{ background: 'var(--surface-card)', borderRadius: 16, width: '100%', maxWidth: 480, padding: 24, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                🛵 Assign Delivery Partner
              </h3>
              <button
                onClick={() => setAssigningOrder(null)}
                style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: 'var(--surface-input)', borderRadius: 10, padding: 14, marginBottom: 18, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Order:</span>
                <strong style={{ color: 'var(--text-primary)' }}>#{assigningOrder.order_code || assigningOrder.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Customer:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{assigningOrder.customer_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Bill:</span>
                <strong style={{ color: 'var(--text-primary)' }}>₹{assigningOrder.total}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Current Status:</span>
                <span style={{ fontWeight: 700, color: '#ca8a04' }}>{assigningOrder.status}</span>
              </div>
            </div>

            <form onSubmit={handleAssignDeliveryPartner}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Select Available Delivery Courier:
                </label>
                {deliveryPartners.length === 0 ? (
                  <p style={{ color: '#dc2626', fontSize: 13 }}>No delivery partners registered in fleet yet.</p>
                ) : (
                  <select
                    value={selectedPartnerId}
                    onChange={e => setSelectedPartnerId(Number(e.target.value))}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1.5px solid var(--border-color)',
                      background: 'var(--surface-input)',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      fontWeight: 700
                    }}
                  >
                    <option value="">-- Choose Courier --</option>
                    {deliveryPartners.map(dp => (
                      <option key={dp.id} value={dp.id}>
                        {dp.name} • {dp.vehicle || 'Motorcycle'} ({dp.phone}) — ⭐ {dp.rating ? dp.rating.toFixed(1) : '5.0'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setAssigningOrder(null)}
                  style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigningLoading || !selectedPartnerId}
                  className="btn-primary"
                  style={{
                    padding: '10px 22px',
                    borderRadius: 8,
                    fontWeight: 800,
                    opacity: assigningLoading || !selectedPartnerId ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {assigningLoading ? 'Assigning...' : 'Confirm Assignment ➔'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantOwnerDashboard;
