'use client';

interface SabicLogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'text';
  color?: 'blue' | 'white' | 'dark';
}

// Official SABIC Brand Colors
const SABIC_BLUE = '#0047AF';
const SABIC_WHITE = '#FFFFFF';
const SABIC_DARK = '#1a1a1a';

export function SabicLogo({
  className = '',
  variant = 'full',
  color = 'blue'
}: SabicLogoProps) {
  const fillColor = color === 'blue' ? SABIC_BLUE : color === 'white' ? SABIC_WHITE : SABIC_DARK;

  if (variant === 'icon') {
    // Simple "S" icon version
    return (
      <svg
        viewBox="0 0 40 40"
        className={className}
        aria-label="SABIC"
      >
        <rect width="40" height="40" rx="8" fill={SABIC_BLUE} />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fill="white"
          style={{
            fontSize: '24px',
            fontWeight: 700,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          S
        </text>
      </svg>
    );
  }

  if (variant === 'text') {
    // Text only version
    return (
      <svg
        viewBox="0 0 120 40"
        className={className}
        aria-label="SABIC"
      >
        <text
          x="0"
          y="30"
          fill={fillColor}
          style={{
            fontSize: '32px',
            fontWeight: 700,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '2px'
          }}
        >
          SABIC
        </text>
      </svg>
    );
  }

  // Full logo with English and Arabic
  return (
    <svg
      viewBox="0 0 160 50"
      className={className}
      aria-label="SABIC - Saudi Basic Industries Corporation"
    >
      {/* English text: SABIC */}
      <text
        x="0"
        y="32"
        fill={fillColor}
        style={{
          fontSize: '32px',
          fontWeight: 700,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '1px'
        }}
      >
        SABIC
      </text>
      {/* Arabic text: سابك */}
      <text
        x="110"
        y="30"
        fill={fillColor}
        style={{
          fontSize: '22px',
          fontWeight: 600,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          direction: 'rtl'
        }}
        textAnchor="start"
      >
        سابك
      </text>
    </svg>
  );
}

// Horizontal logo with tagline
export function SabicLogoWithTagline({
  className = '',
  color = 'blue',
  tagline = 'Chemistry that Matters'
}: SabicLogoProps & { tagline?: string }) {
  const fillColor = color === 'blue' ? SABIC_BLUE : color === 'white' ? SABIC_WHITE : SABIC_DARK;
  const taglineColor = color === 'white' ? 'rgba(255,255,255,0.7)' : '#666666';

  return (
    <div className={`flex flex-col ${className}`}>
      <svg
        viewBox="0 0 120 35"
        className="h-8 w-auto"
        aria-label="SABIC"
      >
        <text
          x="0"
          y="26"
          fill={fillColor}
          style={{
            fontSize: '28px',
            fontWeight: 700,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '1px'
          }}
        >
          SABIC
        </text>
      </svg>
      {tagline && (
        <span
          className="text-xs tracking-wide mt-0.5"
          style={{ color: taglineColor }}
        >
          {tagline}
        </span>
      )}
    </div>
  );
}
