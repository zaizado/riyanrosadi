import React from 'react';

interface FsbnLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export const FsbnLogo: React.FC<FsbnLogoProps> = ({ 
  className = "w-10 h-10", 
  size,
  showText = true 
}) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Background Red Frame */}
      <rect width="200" height="200" rx="24" fill="#DC2626" />

      {/* Outer Gear Wheel (Roda Gigi) - Black */}
      <g fill="#000000">
        {/* Gear teeth (10 teeth) */}
        {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((angle) => (
          <rect
            key={angle}
            x="91"
            y="20"
            width="18"
            height="14"
            rx="2"
            transform={`rotate(${angle} 100 82)`}
          />
        ))}
        {/* Outer Ring Circle */}
        <circle cx="100" cy="82" r="54" />
      </g>

      {/* Red Circle Ring for Text */}
      <circle cx="100" cy="82" r="44" fill="#DC2626" />

      {/* Text Path for "FEDERASI SERIKAT BURUH NUSANTARA" */}
      <defs>
        <path
          id="fsbnTextArc"
          d="M 60,82 A 40,40 0 1,1 140,82"
          fill="none"
        />
      </defs>

      {/* Yellow Text along Arc */}
      <text fill="#FACC15" fontSize="10.5" fontWeight="900" letterSpacing="0.8">
        <textPath href="#fsbnTextArc" startOffset="50%" textAnchor="middle">
          FEDERASI SERIKAT BURUH NUSANTARA
        </textPath>
      </text>

      {/* Inner Red Field for Star */}
      <circle cx="100" cy="82" r="28" fill="#DC2626" />

      {/* Yellow 5-Pointed Star */}
      <polygon
        points="100,56 106,73 124,73 110,84 115,101 100,91 85,101 90,84 76,73 94,73"
        fill="#FACC15"
      />

      {/* Torch (Obor) with Flame in Center */}
      <g>
        {/* Black Torch Handle & Cup */}
        <path d="M96,82 L104,82 L102,96 L98,96 Z" fill="#000000" />
        <path d="M94,80 L106,80 L104,84 L96,84 Z" fill="#000000" />

        {/* Outer Flame (Orange) */}
        <path
          d="M100,66 C105,71 106,76 103,79 C101,81 99,81 97,79 C94,76 95,71 100,66 Z"
          fill="#F97316"
        />
        {/* Inner Flame (Yellow/White) */}
        <path
          d="M100,70 C103,73 103,76 101,78 C100,79 99,79 98,78 C96,76 97,73 100,70 Z"
          fill="#FEF08A"
        />
      </g>

      {/* FSBN Text at Bottom */}
      {showText && (
        <text
          x="100"
          y="174"
          fill="#FACC15"
          fontSize="36"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          textAnchor="middle"
          letterSpacing="2"
        >
          FSBN
        </text>
      )}
    </svg>
  );
};
