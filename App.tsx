
import React, { useState, useEffect } from 'react';
import { Page, Food, CartItem, OrderDetails, User } from './types';
import { DUMMY_FOODS } from './data';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home';
import Menu from './components/Menu';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import Auth from './components/Auth';
import Admin from './components/Admin';
import OrderHistory from './components/OrderHistory';
import OrderConfirmation from './components/OrderConfirmation';

// Use relative path since frontend and backend share the same port (5000)
const API_BASE = '/api';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [foods, setFoods] = useState<Food[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastOrder, setLastOrder] = useState<OrderDetails | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/foods`)
      .then(res => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then(data => {
        setFoods(data);
        setIsDemoMode(false);
      })
      .catch(err => {
        console.warn("Backend unreachable. Falling back to dummy data for demonstration.", err);
        setFoods(DUMMY_FOODS);
        setIsDemoMode(true);
      });
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && token) {
        try {
            setUser(JSON.parse(savedUser));
        } catch (e) {
            handleLogout();
        }
    }
  }, [token]);

  const fetchCart = async () => {
    if (user && token) {
        try {
          const res = await fetch(`${API_BASE}/cart`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              const data = await res.json();
              setCart(data);
          } else if (res.status === 401) {
              handleLogout();
          }
        } catch (e) {
          console.warn("Server disconnected. Cart will not sync with DB.");
        }
    } else {
        setCart([]);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user, token]);

  const handleLogin = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setCurrentPage(Page.HOME);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentPage(Page.HOME);
  };

  const addToCart = async (food: Food) => {
    if (!user || !token) {
      setCurrentPage(Page.LOGIN);
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/cart`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ food_id: food.id, quantity: 1 })
      });
      
      if (res.ok) {
          fetchCart();
      } else {
        updateCartLocally(food, 1);
      }
    } catch (e) {
      updateCartLocally(food, 1);
    }
  };

  const updateCartLocally = (food: Food, delta: number) => {
    const existing = cart.find(c => c.id === food.id);
    if (existing) {
      setCart(cart.map(c => c.id === food.id ? {...c, quantity: Math.max(0, c.quantity + delta)} : c).filter(c => c.quantity > 0));
    } else if (delta > 0) {
      setCart([...cart, { ...food, quantity: delta }]);
    }
  };

  const updateQuantity = async (id: number, delta: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/cart`, {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ food_id: id, quantity: delta })
      });
      if (res.ok) {
        fetchCart();
      } else {
        setCart(cart.map(c => c.id === id ? {...c, quantity: Math.max(0, c.quantity + delta)} : c).filter(c => c.quantity > 0));
      }
    } catch (e) {
      setCart(cart.map(c => c.id === id ? {...c, quantity: Math.max(0, c.quantity + delta)} : c).filter(c => c.quantity > 0));
    }
  };

  const removeFromCart = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/cart/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCart();
      } else {
        setCart(cart.filter(c => c.id !== id));
      }
    } catch (e) {
      setCart(cart.filter(c => c.id !== id));
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.HOME: return <Home onOrderNow={() => setCurrentPage(Page.MENU)} />;
      case Page.MENU: return <Menu foods={foods} onAddToCart={addToCart} />;
      case Page.LOGIN: return <Auth mode="login" onAuthSuccess={handleLogin} onToggleMode={() => setCurrentPage(Page.REGISTER)} />;
      case Page.REGISTER: return <Auth mode="register" onAuthSuccess={handleLogin} onToggleMode={() => setCurrentPage(Page.LOGIN)} />;
      case Page.CART: return <Cart items={cart} onUpdateQty={updateQuantity} onRemove={removeFromCart} onCheckout={() => setCurrentPage(Page.CHECKOUT)} onGoToMenu={() => setCurrentPage(Page.MENU)} />;
      case Page.CHECKOUT: return <Checkout user={user!} token={token!} cart={cart} onPlaceOrder={(o) => { setLastOrder(o); setCurrentPage(Page.CONFIRMATION); }} onBackToCart={() => setCurrentPage(Page.CART)} />;
      case Page.CONFIRMATION: return <OrderConfirmation order={lastOrder} onReturnHome={() => setCurrentPage(Page.HOME)} />;
      case Page.HISTORY: return <OrderHistory token={token!} />;
      case Page.ADMIN: return <Admin token={token!} />;
      default: return <Home onOrderNow={() => setCurrentPage(Page.MENU)} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={user} cartCount={cart.length} onNavigate={setCurrentPage} currentPage={currentPage} onLogout={handleLogout} />
      <main className="flex-grow pt-20">
        {isDemoMode && (
           <div className="bg-amber-50 border-b border-amber-100 text-amber-800 text-[10px] py-1 text-center font-bold uppercase tracking-widest">
             Demo Mode: Server not detected. Running with local data.
           </div>
        )}
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
};

export default App;
