import React from 'react';
import { ToastProvider } from './contexts/ToastContext';
import { AppProvider, useApp } from './contexts/AppContext';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import Home from './pages/Home';
import Restaurants from './pages/Restaurants';
import RestaurantDetail from './pages/RestaurantDetail';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import OrderHistory from './pages/OrderHistory';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import Offers from './pages/Offers';
import Auth from './pages/Auth';
import AdminDashboard from './pages/Admin';
import SearchPage from './pages/SearchPage';
import GroupDeliveryTracking from './pages/GroupDeliveryTracking';
import RescueHub from './pages/RescueHub';
import RestaurantOwnerDashboard from './pages/RestaurantOwnerDashboard';
import DeliveryPartnerDashboard from './pages/DeliveryPartnerDashboard';
import LocationModal from './components/LocationModal';
import DirectOrderModal from './components/DirectOrderModal';
import FoodDetailModal from './components/FoodDetailModal';

const AppContent: React.FC = () => {
  const { currentPage, navParams } = useApp();

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <Home />;
      case 'rescue': return <RescueHub />;
      case 'restaurants': return <Restaurants />;
      case 'restaurant-detail': return <RestaurantDetail restaurantId={navParams.restaurantId as number} />;
      case 'search': return <SearchPage initialQuery={navParams.query as string | undefined} />;
      case 'cart': return <CartPage />;
      case 'checkout': return <Checkout />;
      case 'order-tracking': return <OrderTracking orderId={navParams.orderId as number} />;
      case 'group-tracking': return <GroupDeliveryTracking groupId={navParams.groupId as number} />;
      case 'order-history': return <OrderHistory />;
      case 'favorites': return <Favorites />;
      case 'profile': return <Profile />;
      case 'impact': return <Profile />;
      case 'offers': return <Offers />;
      case 'login': return <Auth mode="login" />;
      case 'register': return <Auth mode="register" />;
      case 'admin': return <AdminDashboard />;
      case 'owner-dashboard': return <RestaurantOwnerDashboard />;
      case 'delivery-dashboard': return <DeliveryPartnerDashboard />;
      default: return <Home />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)' }}>
      <Navbar />
      <main className="page-with-nav">
        {renderPage()}
      </main>
      <MobileBottomNav />
      <LocationModal />
      <DirectOrderModal />
      <FoodDetailModal />
    </div>
  );
};

const App: React.FC = () => (
  <ToastProvider>
    <AppProvider>
      <AppContent />
    </AppProvider>
  </ToastProvider>
);

export default App;
