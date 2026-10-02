import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, CartItem, Food } from '../types';
import { useToast } from './ToastContext';

const API = '/api';

export interface DeliveryLocation {
  label: 'Home' | 'Work' | 'Other';
  address: string;
  street: string;
  area: string;
  city: string;
  pincode: string;
}

const DEFAULT_LOCATION: DeliveryLocation = {
  label: 'Home',
  address: '123 Example Street, RS Puram, Coimbatore',
  street: '123 Example Street',
  area: 'RS Puram',
  city: 'Coimbatore',
  pincode: '641002'
};

interface AppContextValue {
  // Auth
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  ensureUserLoggedIn: () => Promise<string | null>;
  loginAsAdmin: () => Promise<boolean>;

  // Location System
  deliveryLocation: DeliveryLocation;
  setDeliveryLocation: (loc: DeliveryLocation) => void;
  showLocationModal: boolean;
  setShowLocationModal: (show: boolean) => void;

  // Direct Order Now Flow
  directOrderFood: Food | null;
  directOrderQuantity: number;
  setDirectOrderQuantity: (qty: number) => void;
  startDirectOrder: (food: Food, quantity?: number) => void;
  closeDirectOrder: () => void;

  // Food Details Modal
  detailsFood: Food | null;
  openFoodDetails: (food: Food) => void;
  closeFoodDetails: () => void;

  // Cart
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (food: Food, quantity?: number, customizations?: Record<string, string>, specialInstructions?: string, unitPrice?: number) => Promise<void>;
  updateCartQty: (cartId: number, quantity: number) => Promise<void>;
  removeFromCart: (foodId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;

  // Navigation
  currentPage: string;
  navigateTo: (page: string, params?: Record<string, unknown>) => void;
  navParams: Record<string, unknown>;

  // Notifications
  unreadCount: number;
  refreshNotifications: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentPage, setCurrentPage] = useState('home');
  const [navParams, setNavParams] = useState<Record<string, unknown>>({});
  const [unreadCount, setUnreadCount] = useState(0);

  // Delivery Location State
  const [deliveryLocation, setDeliveryLocationState] = useState<DeliveryLocation>(() => {
    try {
      const stored = localStorage.getItem('deliveryLocation');
      return stored ? JSON.parse(stored) : DEFAULT_LOCATION;
    } catch {
      return DEFAULT_LOCATION;
    }
  });
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Direct Order Modal State
  const [directOrderFood, setDirectOrderFood] = useState<Food | null>(null);
  const [directOrderQuantity, setDirectOrderQuantity] = useState(1);

  // Food Details Modal State
  const [detailsFood, setDetailsFood] = useState<Food | null>(null);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + (item.unit_price || item.price) * item.quantity, 0);

  const setDeliveryLocation = useCallback((loc: DeliveryLocation) => {
    setDeliveryLocationState(loc);
    localStorage.setItem('deliveryLocation', JSON.stringify(loc));
    toast('info', `Delivery location updated: ${loc.area || loc.city}`);
  }, [toast]);

  const authHeaders = useCallback((): HeadersInit => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  const login = useCallback((userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setCart([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentPage('home');
  }, []);

  // Ensure demo user is logged in for seamless demo ordering
  const ensureUserLoggedIn = useCallback(async (): Promise<string | null> => {
    if (token) return token;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@biteflow.com', password: 'user123' })
      });
      if (res.ok) {
        const data = await res.json();
        login(data.user as User, data.token);
        return data.token;
      }
    } catch {}
    return null;
  }, [token, login]);

  // Quick 1-click admin login
  const loginAsAdmin = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@savorit.com', password: 'admin123' })
      });
      if (res.ok) {
        const data = await res.json();
        login(data.user as User, data.token);
        toast('success', `Welcome back, ${data.user.name}! (Admin mode)`);
        return true;
      } else {
        const err = await res.json().catch(() => ({}));
        toast('error', err.error || 'Failed to login as admin');
      }
    } catch {
      toast('error', 'Network error connecting to backend server');
    }
    return false;
  }, [login, toast]);

  const refreshCart = useCallback(async () => {
    if (!token) { setCart([]); return; }
    try {
      const res = await fetch(`${API}/cart`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const mapped: CartItem[] = data.map((row: Record<string, unknown>) => ({
          id: row.id as number,
          food_id: row.food_id as number,
          name: row.name as string,
          description: row.description as string | undefined,
          price: row.price as number,
          image: row.image as string | undefined,
          category: row.category as string | undefined,
          is_veg: row.is_veg as number,
          calories: row.calories as number | undefined,
          quantity: row.quantity as number,
          unit_price: (row.unit_price as number | null) || row.price as number,
          customizations: row.customizations ? JSON.parse(row.customizations as string) : undefined,
          special_instructions: row.special_instructions as string | undefined,
          restaurant_id: row.restaurant_id as number | undefined,
          restaurant_name: row.restaurant_name as string | undefined,
        }));
        setCart(mapped);
      } else if (res.status === 401 || res.status === 403) {
        logout();
      }
    } catch {
      // Keep existing cart on transient error
    }
  }, [token, logout]);

  const refreshNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.filter((n: { is_read: number }) => !n.is_read).length);
      }
    } catch {}
  }, [token]);

  useEffect(() => { refreshCart(); }, [token]);
  useEffect(() => { refreshNotifications(); }, [token]);
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }, [token, refreshNotifications]);

  const navigateTo = useCallback((page: string, params: Record<string, unknown> = {}) => {
    setCurrentPage(page);
    setNavParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const addToCart = useCallback(async (
    food: Food,
    quantity = 1,
    customizations?: Record<string, string>,
    specialInstructions?: string,
    unitPrice?: number,
  ) => {
    let currentToken = token;
    if (!currentToken) {
      currentToken = await ensureUserLoggedIn();
    }
    if (!currentToken) {
      navigateTo('login');
      return;
    }
    try {
      const res = await fetch(`${API}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          food_id: food.id,
          quantity,
          customizations,
          special_instructions: specialInstructions,
          unit_price: unitPrice || food.price,
        }),
      });
      if (res.ok || res.status === 201) {
        await refreshCart();
        toast('success', `Added to cart (${quantity})`, food.name);
      } else {
        toast('error', 'Could not add to cart');
      }
    } catch {
      toast('error', 'Network error', 'Please check your connection');
    }
  }, [token, ensureUserLoggedIn, refreshCart, navigateTo, toast]);

  const updateCartQty = useCallback(async (cartId: number, quantity: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/cart/${cartId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) await refreshCart();
    } catch {}
  }, [token, authHeaders, refreshCart]);

  const removeFromCart = useCallback(async (foodId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/cart/${foodId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await refreshCart();
        toast('info', 'Item removed from cart');
      }
    } catch {}
  }, [token, refreshCart, toast]);

  const clearCart = useCallback(async () => {
    if (!token) return;
    try {
      await fetch(`${API}/cart`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setCart([]);
    } catch {}
  }, [token]);

  // Direct Order helpers
  const startDirectOrder = useCallback(async (food: Food, quantity = 1) => {
    await ensureUserLoggedIn();
    setDirectOrderQuantity(quantity);
    setDirectOrderFood(food);
  }, [ensureUserLoggedIn]);

  const closeDirectOrder = useCallback(() => {
    setDirectOrderFood(null);
  }, []);

  // Food Details helpers
  const openFoodDetails = useCallback((food: Food) => {
    setDetailsFood(food);
  }, []);

  const closeFoodDetails = useCallback(() => {
    setDetailsFood(null);
  }, []);

  return (
    <AppContext.Provider value={{
      user, token, login, logout, ensureUserLoggedIn, loginAsAdmin,
      deliveryLocation, setDeliveryLocation, showLocationModal, setShowLocationModal,
      directOrderFood, directOrderQuantity, setDirectOrderQuantity, startDirectOrder, closeDirectOrder,
      detailsFood, openFoodDetails, closeFoodDetails,
      cart, cartCount, cartTotal, addToCart, updateCartQty, removeFromCart, clearCart, refreshCart,
      currentPage, navigateTo, navParams,
      unreadCount, refreshNotifications,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
