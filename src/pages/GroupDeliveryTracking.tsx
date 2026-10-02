import React, { useState, useEffect, useRef } from 'react';
import { DeliveryGroup, DeliveryGroupStatus } from '../types';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';

interface Props {
  groupId?: number;
}

const GROUP_STATUS_STEPS: { status: DeliveryGroupStatus; icon: string; label: string; desc: string }[] = [
  { status: 'Group Created', icon: '👥', label: 'Group Created', desc: 'Nearby orders grouped for route batching' },
  { status: 'Orders Confirmed', icon: '📋', label: 'Orders Confirmed', desc: 'All grouped customer orders confirmed' },
  { status: 'Restaurant Preparing', icon: '👨‍🍳', label: 'Restaurant Preparing', desc: 'Kitchen is preparing batch orders' },
  { status: 'Orders Ready', icon: '📦', label: 'Orders Ready', desc: 'All meals packed and ready at restaurant' },
  { status: 'Delivery Partner Assigned', icon: '🛵', label: 'Partner Assigned', desc: 'Courier partner assigned to group route' },
  { status: 'Picked Up', icon: '🛍️', label: 'Picked Up', desc: 'Courier collected all orders from restaurant' },
  { status: 'Route Started', icon: '🗺️', label: 'Route Started', desc: 'Delivery partner has begun the optimized route' },
  { status: 'Delivering', icon: '🚴', label: 'Delivering to Stops', desc: 'Courier is delivering sequentially to stops' },
  { status: 'Completed', icon: '🎉', label: 'Completed', desc: 'All grouped deliveries safely completed!' },
];

const GroupDeliveryTracking: React.FC<Props> = ({ groupId: propGroupId }) => {
  const { navParams, token, navigateTo } = useApp();
  const { toast } = useToast();
  const groupId = propGroupId || (navParams.groupId as number) || 1024;

  const [group, setGroup] = useState<DeliveryGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchGroup = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/delivery-groups/${groupId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setGroup(data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchGroup();
    pollRef.current = setInterval(fetchGroup, 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [groupId, token]);

  const handleAdvanceDemo = async () => {
    setAdvancing(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/delivery-groups/${groupId}/advance-demo`, {
        method: 'POST',
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        toast('info', 'Status Updated', `Advanced to: ${data.new_status}`);
        await fetchGroup();
      }
    } catch {
      toast('error', 'Could not advance status');
    }
    setAdvancing(false);
  };

  if (loading) {
    return (
      <div className="page-container" style={{ paddingTop: '32px' }}>
        <div className="skeleton" style={{ height: '32px', width: '240px', marginBottom: '20px' }} />
        <div className="skeleton" style={{ height: '380px', borderRadius: '16px' }} />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="page-container empty-state" style={{ paddingTop: '80px' }}>
        <div className="empty-state-icon">🚚</div>
        <p className="empty-state-title">Group Delivery Not Found</p>
        <p className="empty-state-desc">The requested group delivery ID could not be loaded.</p>
        <button className="btn btn-primary" onClick={() => navigateTo('home')}>Return to Home</button>
      </div>
    );
  }

  const currentStepIdx = Math.max(
    0,
    GROUP_STATUS_STEPS.findIndex(s => s.status === group.status)
  );

  return (
    <div className="page-container" style={{ paddingTop: '24px', paddingBottom: '48px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigateTo('home')}>← Home</button>
          <div style={{ height: '16px', width: '1px', background: 'var(--gray-200)' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800 }}>
                Group Delivery #{group.id}
              </h1>
              <span style={{
                background: '#DBEAFE',
                color: '#1E40AF',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px'
              }}>
                🚚 BATCHED ROUTE
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '2px' }}>
              {group.restaurant_name} · {group.order_count || 3} orders combined
            </p>
          </div>
        </div>

        {/* Demo Fast-Forward Controller */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleAdvanceDemo}
            disabled={advancing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1.5px solid #2563EB',
              color: '#2563EB',
              fontWeight: 700
            }}
          >
            <span>⏩</span>
            <span>{advancing ? 'Advancing...' : 'Advance Status (Demo)'}</span>
          </button>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div style={{
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        borderRadius: '12px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ fontSize: '20px' }}>🛡️</span>
        <div style={{ fontSize: '12px', color: '#1E40AF' }}>
          <strong>Privacy Protected:</strong> Other customer names, phone numbers, and exact addresses are hidden. Only general neighborhood areas are shown.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Group Route & Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status Hero Card */}
          <div className="card" style={{
            padding: '24px',
            background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
            color: 'white',
            borderRadius: '18px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div style={{ fontSize: '46px', marginBottom: '8px' }}>
                {GROUP_STATUS_STEPS[currentStepIdx]?.icon || '🚚'}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>
                {GROUP_STATUS_STEPS[currentStepIdx]?.label || group.status}
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', maxWidth: '400px', margin: '0 auto' }}>
                {GROUP_STATUS_STEPS[currentStepIdx]?.desc}
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '12px',
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Combined Orders</div>
                <div style={{ fontSize: '16px', fontWeight: 800 }}>{group.order_count} Orders</div>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Estimated Arrival</div>
                <div style={{ fontSize: '16px', fontWeight: 800 }}>{group.estimated_time || '28 min'}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Delivery Fee</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#4ADE80' }}>FREE (₹0)</div>
              </div>
            </div>
          </div>

          {/* Sequential Route & Stops */}
          <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800 }}>📍 Optimized Delivery Route</h3>
              <span style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: 600 }}>
                ~{group.estimated_distance || 1.4} km total route
              </span>
            </div>

            {/* Stops Sequence */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' }}>
              {/* Pickup Stop: Restaurant */}
              <div style={{ display: 'flex', gap: '14px', position: 'relative', paddingBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#FEF3C7',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 800,
                    zIndex: 2
                  }}>
                    🏪
                  </div>
                  <div style={{ width: '2px', flex: 1, background: '#E5E7EB', margin: '4px 0' }} />
                </div>
                <div style={{ flex: 1, paddingTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gray-900)' }}>
                      Pickup: {group.restaurant_name}
                    </div>
                    <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 700 }}>✓ Picked Up</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                    {group.restaurant_address || 'Origin restaurant'}
                  </div>
                </div>
              </div>

              {/* Dynamic Customer Stops */}
              {(group.stops || []).map((stop, index) => {
                const isUser = stop.is_current_user;
                const isLast = index === (group.stops || []).length - 1;

                return (
                  <div key={stop.id} style={{ display: 'flex', gap: '14px', position: 'relative', paddingBottom: isLast ? '0' : '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isUser ? '#2563EB' : '#F3F4F6',
                        color: isUser ? 'white' : 'var(--gray-700)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 800,
                        border: isUser ? '2px solid #93C5FD' : '1px solid var(--gray-300)',
                        zIndex: 2
                      }}>
                        {stop.sequence_number}
                      </div>
                      {!isLast && <div style={{ width: '2px', flex: 1, background: '#E5E7EB', margin: '4px 0' }} />}
                    </div>

                    <div style={{
                      flex: 1,
                      padding: '12px 14px',
                      background: isUser ? 'rgba(239, 246, 255, 0.8)' : 'var(--gray-50)',
                      borderRadius: '12px',
                      border: isUser ? '1.5px solid #BFDBFE' : '1px solid var(--gray-200)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 800,
                          color: isUser ? '#1E40AF' : 'var(--gray-900)'
                        }}>
                          {stop.label} {isUser && '(You)'}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: stop.status === 'Completed' || stop.status === 'Delivered' ? '#16A34A' : '#D97706'
                        }}>
                          {stop.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                        📍 {stop.area}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '4px' }}>
                        {stop.distance_note || `Stop ${stop.sequence_number} on batch route`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Courier & Lifecycle Progression */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Delivery Partner View */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '14px' }}>
              🛵 Assigned Delivery Partner
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#E0E7FF',
                color: '#3730A3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 800
              }}>
                👨‍💼
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gray-900)' }}>
                  {group.partner_name || 'Raj Kumar'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                  Vehicle: {group.partner_vehicle || 'Bike (TN09AB1234)'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '12px', color: '#D97706', fontWeight: 700 }}>
                    ⭐ {group.partner_rating || 4.8}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>• 150+ deliveries</span>
                </div>
              </div>
            </div>

            <div style={{
              background: '#F9FAFB',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '12px',
              color: 'var(--gray-600)',
              lineHeight: 1.4
            }}>
              ℹ️ Your partner is delivering <strong>{group.order_count || 3} orders</strong> along a single optimized route. Route updates occur automatically at each drop-off.
            </div>
          </div>

          {/* Environmental Impact Savings Card */}
          <div className="card" style={{
            padding: '20px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
            border: '1.5px solid #A7F3D0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '20px' }}>🌱</span>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#065F46' }}>
                Your Group Delivery Impact
              </h4>
            </div>
            <p style={{ fontSize: '12px', color: '#047857', marginBottom: '14px', lineHeight: 1.4 }}>
              By batching with 2 nearby customers from {group.restaurant_name}:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'white', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#059669' }}>₹30</div>
                <div style={{ fontSize: '11px', color: 'var(--gray-600)', fontWeight: 600 }}>Delivery Fee Saved</div>
              </div>
              <div style={{ background: 'white', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#059669' }}>~0.45 kg</div>
                <div style={{ fontSize: '11px', color: 'var(--gray-600)', fontWeight: 600 }}>CO₂ Prevented</div>
              </div>
            </div>
          </div>

          {/* Group Delivery Lifecycle Progression Stepper */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '14px' }}>
              Full Delivery Lifecycle
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {GROUP_STATUS_STEPS.map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={step.status} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: isPassed ? '#10B981' : 'var(--gray-200)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800
                    }}>
                      {isPassed ? '✓' : idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: isCurrent ? 800 : 500,
                        color: isCurrent ? 'var(--brand-orange)' : isPassed ? 'var(--gray-900)' : 'var(--gray-400)'
                      }}>
                        {step.label}
                      </span>
                    </div>
                    {isCurrent && (
                      <span style={{
                        fontSize: '10px',
                        background: '#FEF3C7',
                        color: '#B45309',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        fontWeight: 700
                      }}>
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDeliveryTracking;
