import React from 'react';
import { AvailableGroupResponse } from '../types';

interface Props {
  groupInfo: AvailableGroupResponse | null;
  isGroupSelected: boolean;
  onSelectOption: (joinGroup: boolean) => void;
  restaurantName?: string;
}

const GroupDeliveryOptimizationCard: React.FC<Props> = ({
  groupInfo,
  isGroupSelected,
  onSelectOption,
  restaurantName = 'this restaurant',
}) => {
  if (!groupInfo) return null;

  const currentCount = (groupInfo.current_orders || 2);
  const totalCountWithUser = currentCount + 1;

  return (
    <div
      className="card"
      style={{
        padding: '20px',
        borderRadius: '16px',
        border: isGroupSelected ? '2px solid #2563EB' : '1.5px solid #DBEAFE',
        background: isGroupSelected
          ? 'linear-gradient(135deg, rgba(239, 246, 255, 0.95), rgba(219, 234, 254, 0.4))'
          : 'white',
        boxShadow: isGroupSelected
          ? '0 10px 25px -5px rgba(37, 99, 235, 0.15), 0 8px 10px -6px rgba(37, 99, 235, 0.1)'
          : 'var(--shadow-sm)',
        marginBottom: '16px',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Banner Tag */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: '#2563EB',
            color: 'white',
            fontSize: '11px',
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: '6px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            DELIVERY OPTIMIZATION
          </span>
          <span style={{ fontSize: '12px', color: '#1E40AF', fontWeight: 700 }}>
            ⚡ Smart Route Batching
          </span>
        </div>
        <span style={{
          background: '#DCFCE7',
          color: '#15803D',
          fontSize: '11px',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: '12px'
        }}>
          Save ₹30
        </span>
      </div>

      {/* Main Title & Description */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          background: '#EFF6FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          flexShrink: 0
        }}>
          🚚
        </div>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E3A8A', marginBottom: '4px' }}>
            Neighbourhood Group Delivery Available
          </h3>
          <p style={{ fontSize: '13px', color: '#3B82F6', lineHeight: 1.4 }}>
            <strong>{currentCount} other customers nearby</strong> are ordering from {restaurantName}. Join their route to eliminate delivery fees and reduce courier emissions!
          </p>
        </div>
      </div>

      {/* Group Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        background: 'rgba(255, 255, 255, 0.85)',
        borderRadius: '10px',
        padding: '10px',
        marginBottom: '16px',
        border: '1px solid #E0E7FF'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: 600 }}>Group Size</div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E40AF' }}>{totalCountWithUser} Orders</div>
        </div>
        <div style={{ textAlign: 'center', borderLeft: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: 600 }}>Est. Arrival</div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E40AF' }}>{groupInfo.estimated_delivery || '28 min'}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: 600 }}>Delivery Fee</div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#16A34A' }}>FREE (₹0)</div>
        </div>
      </div>

      {/* Customer Choice Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Option 1: Join Group Delivery */}
        <div
          onClick={() => onSelectOption(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderRadius: '10px',
            border: `1.5px solid ${isGroupSelected ? '#2563EB' : '#E5E7EB'}`,
            background: isGroupSelected ? 'white' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              border: `2px solid ${isGroupSelected ? '#2563EB' : 'var(--gray-300)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isGroupSelected ? '#2563EB' : 'white'
            }}>
              {isGroupSelected && (
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />
              )}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: isGroupSelected ? '#1E3A8A' : 'var(--gray-800)' }}>
                Join Group Delivery (Recommended)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                Combined eco-friendly delivery to nearby addresses
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#16A34A' }}>₹0</span>
            <div style={{ fontSize: '10px', color: '#15803D', fontWeight: 600 }}>Save ₹30</div>
          </div>
        </div>

        {/* Option 2: Individual Delivery */}
        <div
          onClick={() => onSelectOption(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: '10px',
            border: `1.5px solid ${!isGroupSelected ? 'var(--brand-orange)' : '#E5E7EB'}`,
            background: !isGroupSelected ? 'white' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              border: `2px solid ${!isGroupSelected ? 'var(--brand-orange)' : 'var(--gray-300)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: !isGroupSelected ? 'var(--brand-orange)' : 'white'
            }}>
              {!isGroupSelected && (
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />
              )}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: !isGroupSelected ? 'var(--gray-900)' : 'var(--gray-600)' }}>
                Continue Individual Delivery
              </div>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                Direct solitary courier dispatch
              </div>
            </div>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-700)' }}>₹30</span>
        </div>
      </div>
    </div>
  );
};

export default GroupDeliveryOptimizationCard;
