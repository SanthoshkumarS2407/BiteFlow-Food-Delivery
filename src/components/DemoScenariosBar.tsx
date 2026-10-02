import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';

const DemoScenariosBar: React.FC = () => {
  const { navigateTo, user, token, addToCart } = useApp();
  const { toast } = useToast();
  const [resetting, setResetting] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      if (res.ok) {
        toast('success', 'Demo Data Reset', 'Demo 1 (Rescue) and Demo 2 (Group) re-seeded to initial state!');
        window.location.reload();
      }
    } catch {
      toast('error', 'Reset failed');
    }
    setResetting(false);
  };

  const handleDemo1 = () => {
    toast('info', 'Demo 1: Smart Surplus Rescue', 'Viewing active rescue meals. Claim one to see real-time quantity update!');
    navigateTo('rescue');
  };

  const handleDemo2 = async () => {
    // Stage an item from Spice Garden into cart and go to checkout
    try {
      const res = await fetch('/api/restaurants');
      if (res.ok) {
        const restaurants = await res.json();
        const spiceGarden = restaurants.find((r: { name: string }) => r.name === 'Spice Garden') || restaurants[0];
        
        // Fetch food for Spice Garden
        const foodRes = await fetch(`/api/rescue`);
        const rescueData = await foodRes.json();
        const demoFood = {
          id: 1,
          restaurant_id: spiceGarden.id,
          restaurant_name: spiceGarden.name,
          name: 'Special Thali',
          price: 199,
          is_veg: 1,
          category: 'Meals'
        };

        if (user && token) {
          await addToCart(demoFood, 1);
          toast('success', 'Demo 2: Group Delivery Staged', 'Items added from Spice Garden. Check out to see nearby order batching!');
          navigateTo('checkout');
        } else {
          toast('info', 'Please Sign In First', 'Signing in will allow you to checkout with Group Delivery.');
          navigateTo('login');
        }
      }
    } catch {
      navigateTo('checkout');
    }
  };

  if (minimized) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 9999,
      }}>
        <button
          onClick={() => setMinimized(false)}
          style={{
            background: '#1E293B',
            color: 'white',
            border: '1.5px solid #334155',
            borderRadius: '24px',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>🎯 Feature Demos</span>
          <span style={{ fontSize: '10px', color: '#94A3B8' }}>▲</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: 9999,
      background: '#0F172A',
      color: 'white',
      borderRadius: '16px',
      padding: '12px 18px',
      boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
      border: '1px solid #334155',
      maxWidth: '480px',
      fontFamily: 'var(--font-sans)',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            background: '#10B981',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            display: 'inline-block'
          }} />
          <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.05em', color: '#F1F5F9', textTransform: 'uppercase' }}>
            Interactive Feature Demos
          </span>
        </div>
        <button
          onClick={() => setMinimized(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '2px 4px'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={handleDemo1}
          style={{
            background: '#065F46',
            color: '#A7F3D0',
            border: '1px solid #059669',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span>♻️</span>
          <span>Demo 1: Surplus Rescue</span>
        </button>

        <button
          onClick={handleDemo2}
          style={{
            background: '#1E3A8A',
            color: '#BFDBFE',
            border: '1px solid #2563EB',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span>🚚</span>
          <span>Demo 2: Group Delivery</span>
        </button>

        <button
          onClick={() => navigateTo('admin')}
          style={{
            background: '#334155',
            color: '#E2E8F0',
            border: '1px solid #475569',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          ⚙️ Admin Panel
        </button>

        <button
          onClick={handleReset}
          disabled={resetting}
          style={{
            background: 'none',
            color: '#CBD5E1',
            border: '1px solid #475569',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {resetting ? '↻...' : '↻ Reset'}
        </button>
      </div>
    </div>
  );
};

export default DemoScenariosBar;
