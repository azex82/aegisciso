'use client';

import Image from 'next/image';

interface SharpLogoProps {
  className?: string;
  variant?: 'full' | 'default' | 'icon' | 'dark';
  width?: number;
  height?: number;
}

export function SharpLogo({
  className = '',
  variant = 'default',
  width,
  height
}: SharpLogoProps) {
  const logoMap = {
    full: { src: '/logos/sharp-logo-full.svg', defaultWidth: 380, defaultHeight: 120 },
    default: { src: '/logos/sharp-logo.svg', defaultWidth: 300, defaultHeight: 100 },
    icon: { src: '/logos/sharp-logo-icon.svg', defaultWidth: 60, defaultHeight: 60 },
    dark: { src: '/logos/sharp-logo-dark.svg', defaultWidth: 300, defaultHeight: 100 },
  };

  const logo = logoMap[variant];
  const w = width || logo.defaultWidth;
  const h = height || logo.defaultHeight;

  return (
    <Image
      src={logo.src}
      alt="SHARP - Enterprise Security Platform"
      width={w}
      height={h}
      className={className}
      priority
    />
  );
}

// Inline SVG version for better control
export function SharpLogoSVG({
  className = '',
  variant = 'default',
  color = 'gradient'
}: {
  className?: string;
  variant?: 'full' | 'default' | 'icon';
  color?: 'gradient' | 'white' | 'dark';
}) {
  const gradientId = `sharpGradient-${Math.random().toString(36).substr(2, 9)}`;

  const getGradient = () => (
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#1a237e' }} />
        <stop offset="30%" style={{ stopColor: '#1565c0' }} />
        <stop offset="60%" style={{ stopColor: '#42a5f5' }} />
        <stop offset="100%" style={{ stopColor: '#90caf9' }} />
      </linearGradient>
    </defs>
  );

  const getFillColor = () => {
    if (color === 'white') return '#ffffff';
    if (color === 'dark') return '#1a237e';
    return `url(#${gradientId})`;
  };

  if (variant === 'icon') {
    return (
      <svg viewBox="0 0 60 60" className={className} aria-label="SHARP">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#1a237e' }} />
            <stop offset="50%" style={{ stopColor: '#1565c0' }} />
            <stop offset="100%" style={{ stopColor: '#42a5f5' }} />
          </linearGradient>
        </defs>
        <circle cx="30" cy="30" r="28" fill={color === 'white' ? '#ffffff' : `url(#${gradientId})`} />
        <text
          x="30"
          y="42"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="36"
          fontWeight="300"
          fill={color === 'white' ? '#1565c0' : 'white'}
          textAnchor="middle"
        >
          S
        </text>
      </svg>
    );
  }

  if (variant === 'full') {
    const iconGradientId = `iconGradient-${Math.random().toString(36).substr(2, 9)}`;
    return (
      <svg viewBox="0 0 380 100" className={className} aria-label="SHARP - Enterprise Security Platform">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: color === 'white' ? '#ffffff' : '#0d47a1' }} />
            <stop offset="25%" style={{ stopColor: color === 'white' ? '#ffffff' : '#1565c0' }} />
            <stop offset="50%" style={{ stopColor: color === 'white' ? '#ffffff' : '#1e88e5' }} />
            <stop offset="75%" style={{ stopColor: color === 'white' ? '#e3f2fd' : '#42a5f5' }} />
            <stop offset="100%" style={{ stopColor: color === 'white' ? '#bbdefb' : '#64b5f6' }} />
          </linearGradient>
          <linearGradient id={iconGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: color === 'white' ? '#ffffff' : '#1565c0' }} />
            <stop offset="100%" style={{ stopColor: color === 'white' ? '#e3f2fd' : '#42a5f5' }} />
          </linearGradient>
        </defs>
        {/* Shield icon */}
        <g transform="translate(15, 15)">
          <path
            d="M25 0 L50 10 L50 35 C50 50 25 60 25 60 C25 60 0 50 0 35 L0 10 Z"
            fill={`url(#${iconGradientId})`}
            opacity="0.9"
          />
          <text
            x="25"
            y="40"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="28"
            fontWeight="bold"
            fill={color === 'white' ? '#1565c0' : 'white'}
            textAnchor="middle"
          >
            S
          </text>
        </g>
        {/* SHARP text */}
        <text
          x="80"
          y="55"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="48"
          fontWeight="300"
          letterSpacing="5"
          fill={`url(#${gradientId})`}
        >
          SHARP
        </text>
        {/* TM */}
        <text
          x="315"
          y="28"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="12"
          fill={color === 'white' ? '#e3f2fd' : '#1565c0'}
        >
          ™
        </text>
        {/* Tagline */}
        <text
          x="80"
          y="78"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="13"
          fontWeight="400"
          letterSpacing="1"
          fill={color === 'white' ? 'rgba(255,255,255,0.7)' : '#757575'}
        >
          Enterprise Security Platform
        </text>
      </svg>
    );
  }

  // Default variant
  return (
    <svg viewBox="0 0 300 80" className={className} aria-label="SHARP">
      {getGradient()}
      <text
        x="20"
        y="45"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="42"
        fontWeight="300"
        letterSpacing="4"
        fill={getFillColor()}
      >
        SHARP
      </text>
      <text
        x="235"
        y="22"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="11"
        fill={color === 'white' ? 'rgba(255,255,255,0.7)' : '#1565c0'}
      >
        ™
      </text>
      <text
        x="20"
        y="68"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="12"
        fontWeight="400"
        letterSpacing="0.5"
        fill={color === 'white' ? 'rgba(255,255,255,0.6)' : '#757575'}
      >
        Enterprise Security Platform
      </text>
    </svg>
  );
}
