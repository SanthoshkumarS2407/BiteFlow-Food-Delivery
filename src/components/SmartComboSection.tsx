import React, { useState } from 'react';
import { Food } from '../types';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';

interface ComboPreset {
  id: string;
  title: string;
  tagline: string;
  badge: string;
  items: {
    name: string;
    category: string;
    price: number;
    calories: number;
    is_veg: number;
    image: string;
  }[];
  discountPercent: number;
}

const PRESET_COMBOS: ComboPreset[] = [
  {
    id: 'biryani-feast',
    title: 'The Royal Biryani Feast',
    tagline: 'Authentic Dindigul Chicken Biryani with spicy Chicken 65, Fresh Lime Soda & hot Gulab Jamun',
    badge: '🔥 MOST POPULAR',
    discountPercent: 18,
    items: [
      {
        name: 'Chicken Biryani',
        category: 'Biryani',
        price: 220,
        calories: 620,
        is_veg: 0,
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80'
      },
      {
        name: 'Chicken 65',
        category: 'Tamil Nadu Special',
        price: 170,
        calories: 380,
        is_veg: 0,
        image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=300&q=80'
      },
      {
        name: 'Fresh Lime Soda',
        category: 'Beverages',
        price: 55,
        calories: 50,
        is_veg: 1,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300&q=80'
      },
      {
        name: 'Gulab Jamun (2 pcs)',
        category: 'Desserts',
        price: 70,
        calories: 280,
        is_veg: 1,
        image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=300&q=80'
      }
    ]
  },
  {
    id: 'tiffin-delight',
    title: 'Madras Morning Tiffin Combo',
    tagline: 'Crispy Ghee Roast Dosa, soft Sambar Vadas & traditional Kumbakonam Degree Filter Coffee',
    badge: '🌿 PURE VEG FAVORITE',
    discountPercent: 15,
    items: [
      {
        name: 'Ghee Roast Dosa',
        category: 'South Indian',
        price: 110,
        calories: 410,
        is_veg: 1,
        image: 'https://images.unsplash.com/photo-1681287955519-c6e3926cb12d?w=300&q=80'
      },
      {
        name: 'Medu Vada (2 pcs)',
        category: 'South Indian',
        price: 55,
        calories: 245,
        is_veg: 1,
        image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=300&q=80'
      },
      {
        name: 'Filter Coffee',
        category: 'Beverages',
        price: 40,
        calories: 85,
        is_veg: 1,
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80'
      }
    ]
  },
  {
    id: 'punjabi-platter',
    title: 'Royal Punjabi Dhaba Combo',
    tagline: 'Creamy Paneer Butter Masala, 2 Butter Naan, Dal Tadka & Sweet Mango Lassi',
    badge: '👑 CHEF RECOMMENDED',
    discountPercent: 20,
    items: [
      {
        name: 'Paneer Butter Masala',
        category: 'North Indian',
        price: 210,
        calories: 420,
        is_veg: 1,
        image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&q=80'
      },
      {
        name: 'Butter Naan (2 pcs)',
        category: 'North Indian',
        price: 100,
        calories: 360,
        is_veg: 1,
        image: 'https://images.unsplash.com/photo-1619860860774-1e2e17343432?w=300&q=80'
      },
      {
        name: 'Dal Tadka',
        category: 'North Indian',
        price: 150,
        calories: 240,
        is_veg: 1,
        image: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=300&q=80'
      },
      {
        name: 'Mango Lassi',
        category: 'Beverages',
        price: 90,
        calories: 220,
        is_veg: 1,
        image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=300&q=80'
      }
    ]
  },
  {
    id: 'burger-fiesta',
    title: 'Burger & Cooldrink Chill Combo',
    tagline: 'Juicy Crispy Chicken Burger, zesty Peri Peri Fries, Chilled Cooldrink & Ice Cream Sundae',
    badge: '🍔 BURGER & CHILL',
    discountPercent: 22,
    items: [
      {
        name: 'Crispy Chicken Burger',
        category: 'Snacks & Fast Food',
        price: 160,
        calories: 480,
        is_veg: 0,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80'
      },
      {
        name: 'Peri Peri Fries',
        category: 'Snacks & Fast Food',
        price: 115,
        calories: 325,
        is_veg: 1,
        image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300&q=80'
      },
      {
        name: 'Chilled Cooldrinks',
        category: 'Beverages',
        price: 40,
        calories: 130,
        is_veg: 1,
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80'
      },
      {
        name: 'Ice Cream Sundae',
        category: 'Desserts',
        price: 130,
        calories: 380,
        is_veg: 1,
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&q=80'
      }
    ]
  }
];

const SmartComboSection: React.FC = () => {
  const { addToCart, startDirectOrder } = useApp();
  const { toast } = useToast();
  const [selectedComboId, setSelectedComboId] = useState<string>('biryani-feast');
  const [adding, setAdding] = useState(false);

  const activeCombo = PRESET_COMBOS.find(c => c.id === selectedComboId) || PRESET_COMBOS[0];

  const individualTotal = activeCombo.items.reduce((s, it) => s + it.price, 0);
  const discountAmount = Math.round((individualTotal * activeCombo.discountPercent) / 100);
  const finalPrice = individualTotal - discountAmount;
  const totalCalories = activeCombo.items.reduce((s, it) => s + it.calories, 0);

  const handleAddComboToCart = async () => {
    setAdding(true);
    for (const item of activeCombo.items) {
      const mockFood: Food = {
        id: Math.floor(Math.random() * 10000) + 500,
        name: `${item.name} (${activeCombo.title})`,
        price: Math.round(item.price * (1 - activeCombo.discountPercent / 100)),
        is_veg: item.is_veg,
        category: item.category,
        calories: item.calories,
        image: item.image,
        restaurant_id: 1,
        restaurant_name: 'BiteFlow Smart Combo'
      };
      await addToCart(mockFood, 1);
    }
    toast('success', 'Combo added to cart!', `Saved ₹${discountAmount} with ${activeCombo.title}`);
    setAdding(false);
  };

  const handleOrderComboNow = () => {
    const comboFoodItem: Food = {
      id: 9999,
      name: activeCombo.title,
      description: activeCombo.items.map(i => i.name).join(' + '),
      price: finalPrice,
      is_veg: activeCombo.items.every(i => i.is_veg === 1) ? 1 : 0,
      calories: totalCalories,
      category: 'Smart Combo',
      image: activeCombo.items[0].image,
      restaurant_id: 1,
      restaurant_name: 'BiteFlow Smart Combo Kitchen'
    };
    startDirectOrder(comboFoodItem, 1);
  };

  return (
    <section style={{ marginBottom: '40px' }}>
      {/* Section Header */}
      <div className="section-header" style={{ marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: '#FFF7ED', color: 'var(--brand-orange)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
              AI SAVINGS
            </span>
            <h2 className="section-title">🍱 Smart Combo Builder</h2>
          </div>
          <p className="section-subtitle">
            Curated authentic pairings with instant bundled discounts & estimated calories
          </p>
        </div>
      </div>

      {/* Main Combo Card */}
      <div className="card" style={{
        padding: '24px',
        border: '1.5px solid #FED7AA',
        background: 'linear-gradient(135deg, #FFFDFB 0%, #FFF7ED 100%)',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(232, 66, 14, 0.08)'
      }}>
        {/* Preset Tabs */}
        <div className="scroll-row no-scrollbar" style={{ gap: '8px', marginBottom: '20px' }}>
          {PRESET_COMBOS.map(combo => (
            <button
              key={combo.id}
              onClick={() => setSelectedComboId(combo.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                border: `1.5px solid ${selectedComboId === combo.id ? 'var(--brand-orange)' : 'var(--gray-200)'}`,
                background: selectedComboId === combo.id ? 'white' : 'transparent',
                color: selectedComboId === combo.id ? 'var(--brand-orange)' : 'var(--gray-700)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: selectedComboId === combo.id ? '0 2px 8px rgba(232, 66, 14, 0.15)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              {combo.title}
            </button>
          ))}
        </div>

        {/* Combo Header Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#C2410C', background: '#FFEDD5', padding: '2px 8px', borderRadius: '4px' }}>
              {activeCombo.badge}
            </span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gray-900)', marginTop: '6px', marginBottom: '4px' }}>
              {activeCombo.title}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--gray-600)', maxWidth: '540px' }}>
              {activeCombo.tagline}
            </p>
          </div>

          {/* Pricing Badge */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', color: 'var(--gray-400)', textDecoration: 'line-through' }}>
              Individual: ₹{individualTotal}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--brand-orange)' }}>
                ₹{finalPrice}
              </span>
              <span style={{ background: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 800 }}>
                SAVE ₹{discountAmount} ({activeCombo.discountPercent}% OFF)
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>
              🔥 Total: ~{totalCalories} kcal
            </div>
          </div>
        </div>

        {/* Items Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {activeCombo.items.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: 'white',
                borderRadius: '12px',
                border: '1px solid var(--gray-200)',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ position: 'relative', height: '90px', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                <img
                  src={item.image}
                  alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'white', padding: '2px', borderRadius: '4px' }}>
                  <div className={`veg-indicator ${item.is_veg ? 'veg' : 'non-veg'}`} style={{ width: '10px', height: '10px' }} />
                </div>
              </div>

              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--gray-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-700)' }}>₹{item.price}</span>
                <span style={{ fontSize: '10px', color: 'var(--gray-400)' }}>{item.calories} cal</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-lg"
            onClick={handleAddComboToCart}
            disabled={adding}
            style={{
              flex: 1,
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '14px',
              border: '1.5px solid var(--brand-orange)',
              color: 'var(--brand-orange)'
            }}
          >
            {adding ? 'Adding...' : `Add Combo to Cart (₹${finalPrice})`}
          </button>

          <button
            className="btn btn-primary btn-lg"
            onClick={handleOrderComboNow}
            style={{
              flex: 1.2,
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '14px',
              boxShadow: '0 4px 14px rgba(232, 66, 14, 0.3)'
            }}
          >
            Order Combo Now ⚡ (₹{finalPrice})
          </button>
        </div>
      </div>
    </section>
  );
};

export default SmartComboSection;
