import React from 'react';

interface VlcConeIconProps {
  className?: string;
  size?: number;
  glowColor?: string;
}

export const VlcConeIcon: React.FC<VlcConeIconProps> = ({
  className = 'w-7 h-7',
  size = 28,
  glowColor = '#ff6b00',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: `drop-shadow(0 0 8px ${glowColor}66)` }}
    >
      <defs>
        <linearGradient id="coneGradient" x1="24" y1="4" x2="24" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff9a3d" />
          <stop offset="45%" stopColor="#ff5a00" />
          <stop offset="100%" stopColor="#d93b00" />
        </linearGradient>
        <linearGradient id="baseGradient" x1="8" y1="39" x2="40" y2="43" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#cc3700" />
          <stop offset="50%" stopColor="#ff6b00" />
          <stop offset="100%" stopColor="#992900" />
        </linearGradient>
        <linearGradient id="stripeGradient" x1="16" y1="18" x2="32" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* Base ring */}
      <ellipse cx="24" cy="41" rx="19" ry="4" fill="url(#baseGradient)" />
      <ellipse cx="24" cy="40.5" rx="17" ry="2.8" fill="#ffffff" fillOpacity="0.25" />

      {/* Main cone body */}
      <path
        d="M24 5L10 39C14.5 41 33.5 41 38 39L24 5Z"
        fill="url(#coneGradient)"
      />

      {/* Top white stripe */}
      <path
        d="M20.5 15.5L18 22C20.5 23 27.5 23 30 22L27.5 15.5C25.5 16 22.5 16 20.5 15.5Z"
        fill="url(#stripeGradient)"
      />

      {/* Bottom white stripe */}
      <path
        d="M16 27L12.5 35C16.5 36.5 31.5 36.5 35.5 35L32 27C28.5 28.2 19.5 28.2 16 27Z"
        fill="url(#stripeGradient)"
      />

      {/* Tip light highlight */}
      <ellipse cx="24" cy="5.5" rx="2.5" ry="1.2" fill="#ffe0b2" />
    </svg>
  );
};
