import React from 'react';
import { OrderStatus } from '../types';

interface DeliveryTrackingMapProps {
  status: OrderStatus;
  restaurantName?: string;
  restaurantAddress?: string;
  customerAddress?: string;
  estimatedTime?: string;
  distance?: string;
}

const DeliveryTrackingMap: React.FC<DeliveryTrackingMapProps> = ({
  status,
  restaurantName = 'BiteFlow Restaurant',
  restaurantAddress = 'Cross Cut Road, Gandhipuram, Coimbatore',
  customerAddress = '123 Example Street, RS Puram, Coimbatore',
  estimatedTime = '28 minutes',
  distance = '2.4 km'
}) => {
  // Compute rider position along route based on status
  let riderProgress = 0.15; // default near restaurant
  if (status === 'Pending' || status === 'Confirmed') riderProgress = 0.05;
  else if (status === 'Preparing') riderProgress = 0.15;
  else if (status === 'Ready') riderProgress = 0.3;
  else if (status === 'Picked Up') riderProgress = 0.45;
  else if (status === 'Out for Delivery') riderProgress = 0.72;
  else if (status === 'Delivered') riderProgress = 0.98;

  // Path coordinates for a 500x260 SVG map
  // Start: Restaurant (80, 190), End: Customer (420, 70)
  // Control points: (180, 210), (280, 110), (360, 60)
  const riderX = 80 + (420 - 80) * riderProgress;
  const riderY = 190 + (70 - 190) * riderProgress + Math.sin(riderProgress * Math.PI) * -30;

  return (
    <div style={{
      background: '#F1F5F9',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1.5px solid var(--gray-200)',
      position: 'relative',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Top Banner Status Chip */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        right: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 5,
        pointerEvents: 'none'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(6px)',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 800,
          color: 'var(--gray-900)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ color: 'var(--brand-orange)' }}>●</span>
          <span>{status === 'Delivered' ? 'Delivered safely' : `Arriving in ${estimatedTime}`}</span>
        </div>

        <div style={{
          background: 'rgba(17,24,39,0.85)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '14px',
          fontSize: '11px',
          fontWeight: 700,
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
        }}>
          🛣️ {distance} route
        </div>
      </div>

      {/* SVG Stylized Vector Map */}
      <svg
        viewBox="0 0 500 260"
        style={{ width: '100%', height: '240px', display: 'block', background: '#E2E8F0' }}
      >
        <defs>
          {/* Street grid pattern */}
          <pattern id="streetGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect width="60" height="60" fill="#E2E8F0" />
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#CBD5E1" strokeWidth="2.5" />
            <path d="M 30 0 L 30 60 M 0 30 L 60 30" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3,3" />
          </pattern>

          {/* Glowing dot filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Map Background Pattern */}
        <rect width="500" height="260" fill="url(#streetGrid)" />

        {/* Stylized Park Areas */}
        <rect x="20" y="20" width="80" height="70" rx="8" fill="#DCFCE7" opacity="0.7" />
        <text x="60" y="58" fontSize="10" fill="#166534" fontWeight="600" textAnchor="middle">VOC Park</text>

        <rect x="360" y="160" width="110" height="75" rx="8" fill="#DCFCE7" opacity="0.7" />
        <text x="415" y="202" fontSize="10" fill="#166534" fontWeight="600" textAnchor="middle">Race Course</text>

        {/* Stylized Main Roads */}
        <path d="M 0 130 Q 250 140 500 120" stroke="#FFFFFF" strokeWidth="12" fill="none" opacity="0.9" />
        <path d="M 0 130 Q 250 140 500 120" stroke="#F59E0B" strokeWidth="2" strokeDasharray="6,6" fill="none" opacity="0.6" />
        <text x="250" y="126" fontSize="9" fill="#64748B" fontWeight="600" textAnchor="middle">Avinashi Road</text>

        <path d="M 220 0 Q 240 130 260 260" stroke="#FFFFFF" strokeWidth="10" fill="none" opacity="0.9" />
        <text x="255" y="240" fontSize="8" fill="#64748B" fontWeight="600">Trichy Rd</text>

        {/* Planned Delivery Route */}
        <path
          d="M 80 190 Q 180 160 250 135 T 420 70"
          stroke="#E8420E"
          strokeWidth="4.5"
          strokeDasharray="6,4"
          fill="none"
        />

        {/* Completed Segment of Route */}
        <path
          d={`M 80 190 Q 180 160 ${riderX} ${riderY}`}
          stroke="#16A34A"
          strokeWidth="5"
          fill="none"
        />

        {/* ─── Restaurant Marker ─── */}
        <g transform="translate(80, 190)">
          <circle r="18" fill="rgba(232, 66, 14, 0.2)" />
          <circle r="11" fill="#E8420E" stroke="white" strokeWidth="2.5" />
          <text y="4" textAnchor="middle" fill="white" fontSize="11" fontWeight="800">🏪</text>
          <rect x="-60" y="16" width="120" height="20" rx="4" fill="white" stroke="#E2E8F0" />
          <text y="29" textAnchor="middle" fill="#0F172A" fontSize="9" fontWeight="700">📍 Restaurant</text>
        </g>

        {/* ─── Customer Destination Marker ─── */}
        <g transform="translate(420, 70)">
          <circle r="18" fill="rgba(22, 163, 74, 0.2)" />
          <circle r="11" fill="#16A34A" stroke="white" strokeWidth="2.5" />
          <text y="4" textAnchor="middle" fill="white" fontSize="11" fontWeight="800">🏠</text>
          <rect x="-55" y="-30" width="110" height="20" rx="4" fill="white" stroke="#E2E8F0" />
          <text y="-17" textAnchor="middle" fill="#0F172A" fontSize="9" fontWeight="700">🎯 Deliver to You</text>
        </g>

        {/* ─── Dynamic Delivery Rider Marker ─── */}
        <g transform={`translate(${riderX}, ${riderY})`}>
          <circle r="16" fill="rgba(234, 88, 12, 0.3)" filter="url(#glow)" />
          <circle r="12" fill="#EA580C" stroke="white" strokeWidth="2" />
          <text y="4" textAnchor="middle" fill="white" fontSize="11">🛵</text>
        </g>
      </svg>

      {/* Bottom Route Details Bar */}
      <div style={{
        padding: '12px 16px',
        background: 'white',
        borderTop: '1px solid var(--gray-200)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{ fontSize: '18px' }}>📍</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: 600 }}>From: {restaurantName}</div>
            <div style={{ fontSize: '12px', color: 'var(--gray-900)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
              To: {customerAddress}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-green)' }}>
            {status === 'Delivered' ? '✅ Arrived at location' : `● ${status}`}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>
            Map visualization · Live route preview
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTrackingMap;
