import React, { useState } from 'react';
import { useApp, DeliveryLocation } from '../contexts/AppContext';

const POPULAR_AREAS: Record<string, string[]> = {
  Coimbatore: ['RS Puram', 'Gandhipuram', 'Peelamedu', 'Race Course', 'Saibaba Colony', 'Saravanampatti', 'Ramanathapuram', 'Town Hall'],
  Chennai: ['T. Nagar', 'Anna Nagar', 'Adyar', 'Velachery', 'Nungambakkam', 'Mylapore', 'Besant Nagar', 'Alwarpet'],
  Madurai: ['KK Nagar', 'Anna Nagar', 'Simmakkal', 'Goripalayam', 'SS Colony', 'Mattuthavani'],
  Tiruppur: ['Avinashi Road', 'Kumaran Road', 'Kangeyam Road', 'Palladam Road'],
  Salem: ['Fairlands', 'Alagapuram', 'Hasthampatti', 'Shevapet', 'Suramangalam'],
  Erode: ['Perundurai Road', 'Brough Road', 'Solar', 'Thindal'],
  Karur: ['Jawahar Bazaar', 'Vengamedu', 'Thanthonimalai'],
  Trichy: ['Thillai Nagar', 'Cantonment', 'Srirangam', 'KK Nagar'],
  Bengaluru: ['Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'Jayanagar'],
  Hyderabad: ['Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Madhapur', 'Hitec City']
};

const PRESET_ADDRESSES: DeliveryLocation[] = [
  {
    label: 'Home',
    address: '123 Example Street, RS Puram, Coimbatore',
    street: '123 Example Street',
    area: 'RS Puram',
    city: 'Coimbatore',
    pincode: '641002'
  },
  {
    label: 'Work',
    address: 'Example IT Park, Peelamedu, Coimbatore',
    street: 'Tower 2, 4th Floor, IT Highway',
    area: 'Peelamedu',
    city: 'Coimbatore',
    pincode: '641004'
  },
  {
    label: 'Other',
    address: 'No. 45 Villa, Race Course Road, Coimbatore',
    street: '45 Race Course Road',
    area: 'Race Course',
    city: 'Coimbatore',
    pincode: '641018'
  }
];

const LocationModal: React.FC = () => {
  const { showLocationModal, setShowLocationModal, deliveryLocation, setDeliveryLocation } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCity, setActiveCity] = useState('Coimbatore');
  const [showManualForm, setShowManualForm] = useState(false);
  const [locating, setLocating] = useState(false);

  const [manualForm, setManualForm] = useState<DeliveryLocation>({
    label: 'Home',
    address: '',
    street: '',
    area: '',
    city: 'Coimbatore',
    pincode: ''
  });

  if (!showLocationModal) return null;

  const handleSelect = (loc: DeliveryLocation) => {
    setDeliveryLocation(loc);
    setShowLocationModal(false);
  };

  const handleUseCurrentLocation = () => {
    setLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setTimeout(() => {
            const detected: DeliveryLocation = {
              label: 'Home',
              address: `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} · RS Puram, Coimbatore`,
              street: 'Nearby DB Road',
              area: 'RS Puram',
              city: 'Coimbatore',
              pincode: '641002'
            };
            handleSelect(detected);
            setLocating(false);
          }, 600);
        },
        () => {
          // Graceful fallback to default Coimbatore location
          const detected: DeliveryLocation = {
            label: 'Home',
            address: 'Detected Location: Cross Cut Road, Gandhipuram, Coimbatore',
            street: 'Cross Cut Road',
            area: 'Gandhipuram',
            city: 'Coimbatore',
            pincode: '641012'
          };
          handleSelect(detected);
          setLocating(false);
        },
        { timeout: 5000 }
      );
    } else {
      setLocating(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.area && !manualForm.street) return;
    const fullAddress = `${manualForm.street ? manualForm.street + ', ' : ''}${manualForm.area}, ${manualForm.city} ${manualForm.pincode ? '- ' + manualForm.pincode : ''}`.trim();
    handleSelect({
      ...manualForm,
      address: fullAddress
    });
  };

  // Filter area suggestions based on searchQuery
  const currentAreas = POPULAR_AREAS[activeCity] || [];
  const filteredAreas = searchQuery.trim()
    ? Object.entries(POPULAR_AREAS).flatMap(([city, areas]) =>
        areas.filter(a => a.toLowerCase().includes(searchQuery.toLowerCase()) || city.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(a => ({ city, area: a }))
      )
    : currentAreas.map(a => ({ city: activeCity, area: a }));

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(4px)',
      zIndex: 1100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--gray-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 10
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '2px' }}>
              📍 Where do you want your food delivered?
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
              Select your delivery location to view available restaurants
            </p>
          </div>
          <button
            onClick={() => setShowLocationModal(false)}
            style={{
              background: 'var(--gray-100)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '16px',
              color: 'var(--gray-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '12px', fontSize: '16px' }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search for area, street or locality..."
              style={{
                width: '100%',
                padding: '12px 16px 12px 42px',
                border: '1.5px solid var(--gray-200)',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                transition: 'border-color 0.2s',
                color: 'var(--gray-900)'
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--brand-orange)')}
              onBlur={e => (e.target.style.borderColor = 'var(--gray-200)')}
            />
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={handleUseCurrentLocation}
              disabled={locating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 14px',
                background: '#FFF7ED',
                border: '1px solid #FFEDD5',
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--brand-orange)'
              }}
            >
              <span style={{ fontSize: '18px' }}>🎯</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>{locating ? 'Detecting...' : 'Use current location'}</div>
                <div style={{ fontSize: '11px', color: '#9A3412' }}>Using GPS / network</div>
              </div>
            </button>

            <button
              onClick={() => setShowManualForm(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 14px',
                background: showManualForm ? 'var(--gray-100)' : '#F0FDF4',
                border: '1px solid #DCFCE7',
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'left',
                color: '#166534'
              }}
            >
              <span style={{ fontSize: '18px' }}>✍️</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>{showManualForm ? 'Hide Manual Form' : 'Enter manually'}</div>
                <div style={{ fontSize: '11px', color: '#15803D' }}>Door, street & pin</div>
              </div>
            </button>
          </div>

          {/* Manual Entry Form */}
          {showManualForm && (
            <form onSubmit={handleManualSubmit} style={{
              background: 'var(--gray-50)',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '20px',
              border: '1px solid var(--gray-200)'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: 'var(--gray-800)' }}>
                Enter Delivery Details
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                {(['Home', 'Work', 'Other'] as const).map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setManualForm(p => ({ ...p, label: l }))}
                    style={{
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: `1.5px solid ${manualForm.label === l ? 'var(--brand-orange)' : 'var(--gray-300)'}`,
                      background: manualForm.label === l ? '#FFF7ED' : 'white',
                      color: manualForm.label === l ? 'var(--brand-orange)' : 'var(--gray-700)',
                      cursor: 'pointer'
                    }}
                  >
                    {l === 'Home' ? '🏠' : l === 'Work' ? '💼' : '📍'} {l}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Flat / Door / House No."
                  value={manualForm.street}
                  onChange={e => setManualForm(p => ({ ...p, street: e.target.value }))}
                  style={{ padding: '8px 10px', border: '1px solid var(--gray-300)', borderRadius: '6px', fontSize: '13px' }}
                />
                <input
                  type="text"
                  placeholder="Area / Locality *"
                  required
                  value={manualForm.area}
                  onChange={e => setManualForm(p => ({ ...p, area: e.target.value }))}
                  style={{ padding: '8px 10px', border: '1px solid var(--gray-300)', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="City"
                  value={manualForm.city}
                  onChange={e => setManualForm(p => ({ ...p, city: e.target.value }))}
                  style={{ padding: '8px 10px', border: '1px solid var(--gray-300)', borderRadius: '6px', fontSize: '13px' }}
                />
                <input
                  type="text"
                  placeholder="Pincode (e.g. 641002)"
                  value={manualForm.pincode}
                  onChange={e => setManualForm(p => ({ ...p, pincode: e.target.value }))}
                  style={{ padding: '8px 10px', border: '1px solid var(--gray-300)', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-sm"
                style={{ width: '100%', padding: '9px 16px', borderRadius: '8px', fontWeight: 700 }}
              >
                Save & Set as Delivery Address
              </button>
            </form>
          )}

          {/* Saved Addresses */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              Saved Addresses
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {PRESET_ADDRESSES.map((addr) => {
                const isSelected = deliveryLocation.label === addr.label && deliveryLocation.area === addr.area;
                return (
                  <div
                    key={addr.label}
                    onClick={() => handleSelect(addr)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: `1.5px solid ${isSelected ? 'var(--brand-orange)' : 'var(--gray-200)'}`,
                      background: isSelected ? 'rgba(232, 66, 14, 0.04)' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>
                        {addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '💼' : '📍'}
                      </span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-900)' }}>{addr.label}</span>
                          {isSelected && <span style={{ fontSize: '10px', background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>ACTIVE</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '2px' }}>
                          {addr.address}
                        </div>
                      </div>
                    </div>
                    <span style={{ color: isSelected ? 'var(--brand-orange)' : 'var(--gray-400)', fontSize: '14px' }}>
                      {isSelected ? '✓' : '→'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* City Suggestions */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              Popular Cities & Localities
            </div>
            {/* City Selector Pills */}
            <div className="scroll-row no-scrollbar" style={{ gap: '6px', marginBottom: '12px' }}>
              {Object.keys(POPULAR_AREAS).map(c => (
                <button
                  key={c}
                  onClick={() => { setActiveCity(c); setSearchQuery(''); }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: `1.5px solid ${activeCity === c ? 'var(--brand-orange)' : 'var(--gray-200)'}`,
                    background: activeCity === c ? 'var(--brand-orange)' : 'white',
                    color: activeCity === c ? 'white' : 'var(--gray-700)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Areas list */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
              {filteredAreas.slice(0, 12).map(({ city, area }) => (
                <button
                  key={`${city}-${area}`}
                  onClick={() => handleSelect({
                    label: 'Other',
                    address: `${area}, ${city}`,
                    street: '',
                    area: area,
                    city: city,
                    pincode: ''
                  })}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--gray-50)',
                    border: '1px solid var(--gray-200)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--gray-800)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand-orange)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--brand-orange)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--gray-200)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--gray-800)';
                  }}
                >
                  📍 {area}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
