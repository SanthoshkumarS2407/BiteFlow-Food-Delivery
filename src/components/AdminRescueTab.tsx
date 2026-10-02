import React, { useState, useEffect } from 'react';
import { RescuePredictionItem, SurplusRescueItem, RescueAdminAnalytics } from '../types';
import { useToast } from '../contexts/ToastContext';

interface Props {
  token: string | null;
  restaurants: Record<string, unknown>[];
}

const AdminRescueTab: React.FC<Props> = ({ token, restaurants }) => {
  const { toast } = useToast();
  const [selectedRestId, setSelectedRestId] = useState<number>(1);
  const [predictions, setPredictions] = useState<RescuePredictionItem[]>([]);
  const [activeListings, setActiveListings] = useState<SurplusRescueItem[]>([]);
  const [analytics, setAnalytics] = useState<RescueAdminAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishingId, setPublishingId] = useState<number | null>(null);

  // Modal for listing activation
  const [selectedItemForListing, setSelectedItemForListing] = useState<RescuePredictionItem | null>(null);
  const [listingQty, setListingQty] = useState<number>(8);
  const [listingPrice, setListingPrice] = useState<number>(99);
  const [listingExpiryMins, setListingExpiryMins] = useState<number>(90);

  const fetchRescueData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [predRes, listRes, anaRes] = await Promise.all([
        fetch(`/api/rescue/prediction/${selectedRestId}`, { headers }),
        fetch(`/api/rescue?include_all=1&restaurant_id=${selectedRestId}`, { headers }),
        fetch(`/api/admin/analytics/rescue`, { headers }),
      ]);

      if (predRes.ok) {
        const predData = await predRes.json();
        setPredictions(predData.items || []);
      }
      if (listRes.ok) {
        setActiveListings(await listRes.json());
      }
      if (anaRes.ok) {
        setAnalytics(await anaRes.json());
      }
    } catch {
      toast('error', 'Could not load rescue data');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRescueData();
  }, [selectedRestId, token]);

  const handleOpenPublishModal = (item: RescuePredictionItem) => {
    setSelectedItemForListing(item);
    setListingQty(item.suggested_rescue_quantity || 8);
    setListingPrice(item.suggested_rescue_price || Math.round(item.price * 0.55));
    setListingExpiryMins(90);
  };

  const handleConfirmPublish = async () => {
    if (!selectedItemForListing) return;
    setPublishingId(selectedItemForListing.food_id);
    try {
      const now = new Date();
      const expiry = new Date(now.getTime() + listingExpiryMins * 60000).toISOString();

      const res = await fetch('/api/rescue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurant_id: selectedRestId,
          food_id: selectedItemForListing.food_id,
          prepared_quantity: selectedItemForListing.prepared_quantity,
          remaining_quantity: listingQty,
          predicted_surplus: selectedItemForListing.estimated_surplus,
          original_price: selectedItemForListing.price,
          rescue_price: listingPrice,
          start_time: now.toISOString(),
          expiry_time: expiry,
        }),
      });

      if (res.ok) {
        toast('success', 'Rescue Listing Published!', `${selectedItemForListing.food_name} is now live for customers at ₹${listingPrice}`);
        setSelectedItemForListing(null);
        await fetchRescueData();
      } else {
        toast('error', 'Failed to publish listing');
      }
    } catch {
      toast('error', 'Network error');
    }
    setPublishingId(null);
  };

  const handleDeactivate = async (id: number) => {
    try {
      const res = await fetch(`/api/rescue/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast('info', 'Listing Cancelled', 'Listing has been withdrawn from customer discovery.');
        await fetchRescueData();
      }
    } catch {
      toast('error', 'Failed to cancel listing');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner & Restaurant Selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '20px',
        background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
        borderRadius: '16px',
        border: '1.5px solid #A7F3D0'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '18px' }}>♻️</span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#065F46' }}>
              Smart Surplus Rescue Dashboard
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#047857' }}>
            Transparent Prototype Prediction Model: Predicts end-of-shift unsold surplus & suggests rescue listings.
          </p>
        </div>

        {/* Restaurant selector dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: '#065F46' }}>
            Restaurant:
          </label>
          <select
            value={selectedRestId}
            onChange={e => setSelectedRestId(Number(e.target.value))}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1.5px solid #10B981',
              fontSize: '13px',
              fontWeight: 700,
              color: '#065F46',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            {restaurants.map(r => (
              <option key={r.id as number} value={r.id as number}>
                {r.name as string}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px'
        }}>
          {[
            { label: 'Listings Created', value: analytics.listings_created, icon: '📋', color: '#1E40AF' },
            { label: 'Rescue Meals Sold', value: analytics.rescue_meals_sold, icon: '🍱', color: '#16A34A' },
            { label: 'Meals Expired', value: analytics.rescue_meals_expired, icon: '⏳', color: '#DC2626' },
            { label: 'Food Saved (Est.)', value: `${analytics.estimated_food_saved_kg} kg`, icon: '🌱', color: '#059669' },
            { label: 'Conversion Rate', value: `${analytics.conversion_rate}%`, icon: '📈', color: '#D97706' },
          ].map(card => (
            <div key={card.label} className="card" style={{ padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{card.icon}</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: card.color, marginBottom: '2px' }}>
                {card.value}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: 600 }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transparent Prototype Prediction Model Section */}
      <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                background: '#FEF3C7',
                color: '#B45309',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                PROTOTYPE PREDICTION MODEL
              </span>
              <span style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: 600 }}>
                Formula: Estimated Surplus = Prepared Quantity - Expected Remaining Demand
              </span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>
              Today's Food Items & Surplus Predictions
            </h3>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
            Current Shift Time: <strong>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
          </div>
        </div>

        {/* Prediction Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['Item & Category', 'Prepared', 'Sold', 'Remaining', 'Hist. Demand', 'Est. Surplus', 'Suggested Rescue Price', 'Rescue Window', 'Action'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {predictions.map(item => {
                const hasActive = !!item.active_listing;

                return (
                  <tr key={item.food_id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '12px', fontWeight: 700 }}>
                      <div>{item.food_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-400)', fontWeight: 500 }}>
                        {item.category} · Normal ₹{item.price}
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{item.prepared_quantity}</td>
                    <td style={{ padding: '12px', color: 'var(--gray-600)' }}>{item.sold_quantity}</td>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#1E3A8A' }}>
                      {item.remaining_quantity}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--gray-500)' }}>
                      {item.historical_demand} / shift
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        background: item.estimated_surplus > 0 ? '#ECFDF5' : 'var(--gray-100)',
                        color: item.estimated_surplus > 0 ? '#047857' : 'var(--gray-600)',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}>
                        {item.estimated_surplus} meals
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 800, color: '#059669' }}>
                      ₹{item.suggested_rescue_price}
                      <span style={{ fontSize: '11px', color: 'var(--gray-400)', textDecoration: 'line-through', marginLeft: '4px' }}>
                        ₹{item.price}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: 'var(--gray-600)', whiteSpace: 'nowrap' }}>
                      {item.rescue_window}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {hasActive ? (
                        <span style={{
                          background: '#ECFDF5',
                          color: '#065F46',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: '6px',
                          whiteSpace: 'nowrap'
                        }}>
                          ✓ Live ({item.active_listing?.remaining} left)
                        </span>
                      ) : (
                        <button
                          className="btn btn-sm"
                          onClick={() => handleOpenPublishModal(item)}
                          disabled={item.remaining_quantity <= 0}
                          style={{
                            background: '#10B981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            cursor: item.remaining_quantity <= 0 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          + Activate Listing
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

      {/* Active Listings Table */}
      <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>
              Live & Recent Rescue Listings ({activeListings.length})
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
              Real-time customer discovery inventory
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchRescueData}>
            ↻ Refresh Listings
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['ID', 'Food Item', 'Price', 'Sold / Remaining', 'Expiry Window', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--gray-700)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeListings.map(listing => (
                <tr key={listing.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>#{listing.id}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                    {listing.food_name}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 800, color: '#047857' }}>
                    ₹{listing.rescue_price}
                    <span style={{ fontSize: '11px', color: 'var(--gray-400)', textDecoration: 'line-through', marginLeft: '4px' }}>
                      ₹{listing.original_price}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <strong>{listing.prepared_quantity - listing.remaining_quantity} sold</strong> · {listing.remaining_quantity} left
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--gray-600)', fontSize: '12px' }}>
                    {new Date(listing.expiry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: listing.status === 'active' ? '#ECFDF5' : listing.status === 'sold_out' ? '#FEF3C7' : '#F3F4F6',
                      color: listing.status === 'active' ? '#047857' : listing.status === 'sold_out' ? '#B45309' : 'var(--gray-600)',
                    }}>
                      {listing.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {listing.status === 'active' && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDeactivate(listing.id)}
                        style={{ color: '#DC2626', fontSize: '12px', fontWeight: 600 }}
                      >
                        Cancel Listing
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activation Modal */}
      {selectedItemForListing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
              Activate Rescue Listing
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '20px' }}>
              Publish <strong>{selectedItemForListing.food_name}</strong> to the "Rescue Food Near You" section for immediate customer purchase.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div className="input-group">
                <label className="input-label">Rescue Quantity (Available Meals)</label>
                <input
                  type="number"
                  min="1"
                  max={selectedItemForListing.remaining_quantity}
                  value={listingQty}
                  onChange={e => setListingQty(Number(e.target.value))}
                  className="input"
                />
                <span style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '2px' }}>
                  Current unreserved kitchen stock: {selectedItemForListing.remaining_quantity}
                </span>
              </div>

              <div className="input-group">
                <label className="input-label">Rescue Price (INR)</label>
                <input
                  type="number"
                  min="10"
                  value={listingPrice}
                  onChange={e => setListingPrice(Number(e.target.value))}
                  className="input"
                />
                <span style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '2px' }}>
                  Original price: ₹{selectedItemForListing.price} (Suggested: ₹{selectedItemForListing.suggested_rescue_price})
                </span>
              </div>

              <div className="input-group">
                <label className="input-label">Expiry Window (Minutes from now)</label>
                <select
                  value={listingExpiryMins}
                  onChange={e => setListingExpiryMins(Number(e.target.value))}
                  className="input"
                >
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours (Recommended)</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedItemForListing(null)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmPublish}
                disabled={publishingId !== null}
                style={{ flex: 1, background: '#10B981', borderColor: '#10B981' }}
              >
                {publishingId !== null ? 'Publishing...' : 'Publish Listing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRescueTab;
