import React, { useState, useEffect } from 'react';
import { DeliveryGroup, GroupDeliveryAdminAnalytics, DeliveryGroupStatus } from '../types';
import { useToast } from '../contexts/ToastContext';

interface Props {
  token: string | null;
}

const LIFECYCLE_STATUSES: DeliveryGroupStatus[] = [
  'Group Created',
  'Orders Confirmed',
  'Restaurant Preparing',
  'Orders Ready',
  'Delivery Partner Assigned',
  'Picked Up',
  'Route Started',
  'Delivering',
  'Completed',
];

const AdminGroupDeliveryTab: React.FC<Props> = ({ token }) => {
  const { toast } = useToast();
  const [groups, setGroups] = useState<DeliveryGroup[]>([]);
  const [analytics, setAnalytics] = useState<GroupDeliveryAdminAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DeliveryGroup | null>(null);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [groupsRes, analyticsRes] = await Promise.all([
        fetch('/api/delivery-groups', { headers }),
        fetch('/api/admin/analytics/group-delivery', { headers }),
      ]);

      if (groupsRes.ok) setGroups(await groupsRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
    } catch {
      toast('error', 'Could not load group delivery data');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const viewGroupDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/delivery-groups/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSelectedGroup(await res.json());
      }
    } catch {}
  };

  const advanceGroupStatus = async (id: number, currentStatus: DeliveryGroupStatus) => {
    const curIdx = LIFECYCLE_STATUSES.indexOf(currentStatus);
    const nextStatus = LIFECYCLE_STATUSES[(curIdx + 1) % LIFECYCLE_STATUSES.length];

    try {
      const res = await fetch(`/api/delivery-groups/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        toast('success', `Status Updated: #${id} → ${nextStatus}`);
        await fetchData();
        if (selectedGroup && selectedGroup.id === id) {
          viewGroupDetails(id);
        }
      } else {
        toast('error', 'Failed to advance status');
      }
    } catch {
      toast('error', 'Network error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '20px',
        background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
        borderRadius: '16px',
        border: '1.5px solid #BFDBFE'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '18px' }}>🚚</span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1E40AF' }}>
              Neighbourhood Group Delivery Operations
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#2563EB' }}>
            Intelligent route batching for customers ordering from the same restaurant within 1.5 km & 15 minutes.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={fetchData} style={{ background: '#2563EB', borderColor: '#2563EB' }}>
          ↻ Refresh Deliveries
        </button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px'
        }}>
          {[
            { label: 'Groups Created', value: analytics.groups_created, icon: '🚚', color: '#1E40AF' },
            { label: 'Orders Grouped', value: analytics.orders_grouped, icon: '📦', color: '#2563EB' },
            { label: 'Average Group Size', value: `${analytics.average_group_size} orders`, icon: '👥', color: '#059669' },
            { label: 'Trips Combined (Saved)', value: analytics.delivery_trips_combined, icon: '🌱', color: '#16A34A' },
            { label: 'Avg Customer Saving', value: `₹${analytics.average_customer_saving}`, icon: '💰', color: '#D97706' },
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

      {/* Active Delivery Groups Table */}
      <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>
          Active Delivery Batches ({groups.length})
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['Group ID', 'Restaurant', 'Orders', 'Current Status', 'Courier Partner', 'Route Dist.', 'Lifecycle Action'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--gray-700)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map(g => (
                <tr key={g.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '12px', fontWeight: 800, color: '#1E40AF' }}>
                    #{g.id}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 700 }}>
                    {g.restaurant_name}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      background: '#DBEAFE',
                      color: '#1E40AF',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '11px'
                    }}>
                      {g.order_count || 3} Orders
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: g.status === 'Completed' ? '#ECFDF5' : '#FEF3C7',
                      color: g.status === 'Completed' ? '#047857' : '#92400E',
                    }}>
                      {g.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--gray-700)' }}>
                    {g.partner_name || 'Raj Kumar'} ({g.partner_vehicle || 'Bike'})
                  </td>
                  <td style={{ padding: '12px', color: 'var(--gray-500)' }}>
                    ~{g.estimated_distance || 1.4} km ({g.estimated_time || '28 min'})
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-sm"
                        onClick={() => advanceGroupStatus(g.id, g.status)}
                        style={{
                          background: '#2563EB',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Advance Step →
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => viewGroupDetails(g.id)}
                        style={{ color: '#2563EB', fontSize: '11px', fontWeight: 700 }}
                      >
                        View Stops
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Group Stops Modal */}
      {selectedGroup && (
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
            maxWidth: '520px',
            width: '100%',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
                  Group Delivery Route #{selectedGroup.id}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                  Pickup: <strong>{selectedGroup.restaurant_name}</strong> · Status: <strong>{selectedGroup.status}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--gray-400)' }}
              >
                ✕
              </button>
            </div>

            {/* Delivery Partner Details */}
            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '12px' }}>
              <div><strong>Courier:</strong> {selectedGroup.partner_name || 'Raj Kumar'} ({selectedGroup.partner_vehicle || 'Bike'})</div>
              <div style={{ color: 'var(--gray-500)', marginTop: '2px' }}>
                Optimized Route: Restaurant → {(selectedGroup.stops || []).map(s => s.label).join(' → ')}
              </div>
            </div>

            {/* Stops list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {(selectedGroup.stops || []).map((stop, idx) => (
                <div key={stop.id} style={{
                  padding: '10px 12px',
                  background: 'var(--gray-50)',
                  borderRadius: '10px',
                  border: '1px solid var(--gray-200)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>
                      Stop {idx + 1}: {stop.label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                      📍 {stop.area} · {stop.distance_note}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A' }}>
                    {stop.status}
                  </span>
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setSelectedGroup(null)}
              style={{ width: '100%', background: '#2563EB', borderColor: '#2563EB' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGroupDeliveryTab;
