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
        <stop offset="0%" style={{ stopColor: '#1e3a5f' }} />
        <stop offset="40%" style={{ stopColor: '#0047af' }} />
        <stop offset="70%" style={{ stopColor: '#0066ff' }} />
        <stop offset="100%" style={{ stopColor: '#3385ff' }} />
      </linearGradient>
    </defs>
  );

  const getFillColor = () => {
    if (color === 'white') return '#ffffff';
    if (color === 'dark') return '#1e3a5f';
    return `url(#${gradientId})`;
  };

  if (variant === 'icon') {
    const goldGradientId = `goldAccent-${Math.random().toString(36).substr(2, 9)}`;
    return (
      <svg viewBox="0 0 80 80" className={className} width="80" height="80" aria-label="SHARP" style={{ maxHeight: '100%', width: 'auto' }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#1e3a5f' }} />
            <stop offset="50%" style={{ stopColor: '#0047af' }} />
            <stop offset="100%" style={{ stopColor: '#0066ff' }} />
          </linearGradient>
          <linearGradient id={goldGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ff9700' }} />
            <stop offset="100%" style={{ stopColor: '#ffca28' }} />
          </linearGradient>
        </defs>
        {/* Shield shape */}
        <path
          d="M40 4 L76 18 L76 50 C76 68 40 78 40 78 C40 78 4 68 4 50 L4 18 Z"
          fill={color === 'white' ? '#ffffff' : `url(#${gradientId})`}
        />
        {/* Gold accent arc */}
        <path
          d="M40 12 L68 24 L68 48 C68 62 40 70 40 70"
          stroke={`url(#${goldGradientId})`}
          strokeWidth="2.5"
          fill="none"
          opacity="0.5"
        />
        <text
          x="40"
          y="54"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="40"
          fontWeight="bold"
          fill={color === 'white' ? '#0047af' : 'white'}
          textAnchor="middle"
        >
          S
        </text>
      </svg>
    );
  }

  if (variant === 'full') {
    const iconGradientId = `iconGradient-${Math.random().toString(36).substr(2, 9)}`;
    const goldGradientId = `goldAccent-${Math.random().toString(36).substr(2, 9)}`;
    return (
      <svg viewBox="0 0 400 120" className={className} width="400" height="120" aria-label="SHARP - Enterprise Security Platform" style={{ maxHeight: '100%', width: 'auto' }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: color === 'white' ? '#ffffff' : '#1e3a5f' }} />
            <stop offset="40%" style={{ stopColor: color === 'white' ? '#ffffff' : '#0047af' }} />
            <stop offset="70%" style={{ stopColor: color === 'white' ? '#e3f2fd' : '#0066ff' }} />
            <stop offset="100%" style={{ stopColor: color === 'white' ? '#cce0ff' : '#3385ff' }} />
          </linearGradient>
          <linearGradient id={iconGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: color === 'white' ? '#ffffff' : '#1e3a5f' }} />
            <stop offset="50%" style={{ stopColor: color === 'white' ? '#e3f2fd' : '#0047af' }} />
            <stop offset="100%" style={{ stopColor: color === 'white' ? '#cce0ff' : '#0066ff' }} />
          </linearGradient>
          <linearGradient id={goldGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ff9700' }} />
            <stop offset="100%" style={{ stopColor: '#ffca28' }} />
          </linearGradient>
        </defs>
        {/* Shield icon */}
        <g transform="translate(20, 18)">
          <path
            d="M30 0 L60 12 L60 42 C60 60 30 72 30 72 C30 72 0 60 0 42 L0 12 Z"
            fill={`url(#${iconGradientId})`}
          />
          {/* Gold accent line */}
          <path
            d="M30 8 L52 17 L52 40 C52 54 30 64 30 64"
            stroke={`url(#${goldGradientId})`}
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />
          <text
            x="30"
            y="48"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="32"
            fontWeight="bold"
            fill={color === 'white' ? '#0047af' : 'white'}
            textAnchor="middle"
          >
            S
          </text>
        </g>
        {/* SHARP text */}
        <text
          x="95"
          y="60"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="52"
          fontWeight="300"
          letterSpacing="6"
          fill={`url(#${gradientId})`}
        >
          SHARP
        </text>
        {/* TM */}
        <text
          x="352"
          y="30"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="14"
          fill={color === 'white' ? '#cce0ff' : '#0047af'}
        >
          ™
        </text>
        {/* Tagline */}
        <text
          x="95"
          y="92"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="15"
          fontWeight="400"
          letterSpacing="1.5"
          fill={color === 'white' ? 'rgba(255,255,255,0.7)' : '#6b7280'}
        >
          Enterprise Security Platform
        </text>
      </svg>
    );
  }

  // Default variant
  return (
    <svg viewBox="0 0 320 100" className={className} width="320" height="100" aria-label="SHARP" style={{ maxHeight: '100%', width: 'auto' }}>
      {getGradient()}
      <text
        x="20"
        y="55"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="48"
        fontWeight="300"
        letterSpacing="6"
        fill={getFillColor()}
      >
        SHARP
      </text>
      <text
        x="262"
        y="28"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="12"
        fill={color === 'white' ? 'rgba(255,255,255,0.7)' : '#0047af'}
      >
        ™
      </text>
      <text
        x="20"
        y="78"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="14"
        fontWeight="400"
        letterSpacing="1"
        fill={color === 'white' ? 'rgba(255,255,255,0.6)' : '#6b7280'}
      >
        Enterprise Security Platform
      </text>
    </svg>
  );
}
