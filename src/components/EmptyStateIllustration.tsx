import React from 'react';

export type EmptyStateType = 'search' | 'category' | 'expiry' | 'date' | 'library_empty';

interface EmptyStateIllustrationProps {
  type?: EmptyStateType;
  className?: string;
}

export const EmptyStateIllustration: React.FC<EmptyStateIllustrationProps> = ({
  type = 'search',
  className = 'w-72 h-52 mx-auto'
}) => {
  if (type === 'library_empty') {
    return (
      <svg
        viewBox="0 0 320 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="lib-radial-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </radialGradient>
          
          <linearGradient id="lib-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          <linearGradient id="lib-indigo-card" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#3730A3" />
          </linearGradient>

          <filter id="lib-card-shadow" x="0" y="0" width="320" height="220" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#4338CA" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Ambient Glow Background */}
        <ellipse cx="160" cy="115" rx="130" ry="85" fill="url(#lib-radial-glow)" />

        {/* Ambient Grid Lines */}
        <g stroke="#E2E8F0" className="dark:stroke-slate-800" strokeWidth="1" strokeDasharray="4 4" opacity="0.7">
          <line x1="40" y1="50" x2="280" y2="50" />
          <line x1="40" y1="110" x2="280" y2="110" />
          <line x1="40" y1="170" x2="280" y2="170" />
          <line x1="80" y1="20" x2="80" y2="200" />
          <line x1="160" y1="20" x2="160" y2="200" />
          <line x1="240" y1="20" x2="240" y2="200" />
        </g>

        {/* Left Stacked Document (Rotated) */}
        <g transform="rotate(-8 120 120)" opacity="0.6">
          <rect x="65" y="55" width="130" height="95" rx="14" fill="#EEF2FF" stroke="#C7D2FE" className="dark:fill-slate-800 dark:stroke-slate-700" strokeWidth="1.5" />
          <rect x="80" y="72" width="50" height="6" rx="3" fill="#A5B4FC" className="dark:fill-slate-600" />
          <rect x="80" y="86" width="90" height="4" rx="2" fill="#C7D2FE" className="dark:fill-slate-700" />
          <rect x="80" y="96" width="70" height="4" rx="2" fill="#E0E7FF" className="dark:fill-slate-750" />
        </g>

        {/* Right Stacked Document (Rotated) */}
        <g transform="rotate(8 200 120)" opacity="0.6">
          <rect x="125" y="55" width="130" height="95" rx="14" fill="#F0FDF4" stroke="#BBF7D0" className="dark:fill-slate-800 dark:stroke-slate-700" strokeWidth="1.5" />
          <rect x="140" y="72" width="50" height="6" rx="3" fill="#86EFAC" className="dark:fill-slate-600" />
          <rect x="140" y="86" width="90" height="4" rx="2" fill="#BBF7D0" className="dark:fill-slate-700" />
          <rect x="140" y="96" width="70" height="4" rx="2" fill="#DCFCE7" className="dark:fill-slate-750" />
        </g>

        {/* Primary Certificate Vault Card (Centered) */}
        <g filter="url(#lib-card-shadow)">
          <rect x="85" y="42" width="150" height="116" rx="18" fill="#FFFFFF" stroke="#818CF8" className="dark:fill-slate-850" strokeWidth="2" />
          
          {/* Certificate Inner Guilloche Border */}
          <rect x="93" y="50" width="134" height="100" rx="12" fill="none" stroke="#E0E7FF" className="dark:stroke-slate-750" strokeWidth="1.5" strokeDasharray="5 3" />
          
          {/* Document Top Badge Banner */}
          <rect x="110" y="62" width="55" height="8" rx="4" fill="#4F46E5" />
          <rect x="175" y="62" width="30" height="8" rx="4" fill="#E0E7FF" className="dark:fill-slate-700" />

          {/* Certificate Placeholder Lines */}
          <rect x="110" y="78" width="100" height="5" rx="2.5" fill="#CBD5E1" className="dark:fill-slate-700" />
          <rect x="110" y="88" width="80" height="4" rx="2" fill="#E2E8F0" className="dark:fill-slate-750" />
          <rect x="110" y="97" width="90" height="4" rx="2" fill="#F1F5F9" className="dark:fill-slate-800" />
          
          {/* Signatures & Seal */}
          <line x1="150" y1="126" x2="195" y2="126" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="150" y="132" width="35" height="3" rx="1.5" fill="#CBD5E1" className="dark:fill-slate-700" />
        </g>

        {/* Golden Medal / Wax Seal with Ribbons */}
        <g transform="translate(125, 122)">
          {/* Ribbons */}
          <path d="M-6 8 L-12 26 L-3 22 L2 26 L0 8 Z" fill="#EF4444" />
          <path d="M6 8 L12 26 L3 22 L-2 26 L0 8 Z" fill="#DC2626" />
          {/* Gold Coin */}
          <circle cx="0" cy="0" r="16" fill="url(#lib-gold)" stroke="#FEF08A" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="12" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3 1.5" opacity="0.8" />
          {/* Star in Center */}
          <path d="M0 -6 L1.8 -1.8 L6 -1.8 L2.8 1 L4 5.5 L0 2.8 L-4 5.5 L-2.8 1 L-6 -1.8 L-1.8 -1.8 Z" fill="#FFFFFF" />
        </g>

        {/* Google Drive Cloud Connected Node (Top Right) */}
        <g transform="translate(225, 25)">
          <rect x="0" y="0" width="58" height="32" rx="16" fill="#EEF2FF" stroke="#C7D2FE" className="dark:fill-slate-800 dark:stroke-slate-700" strokeWidth="1.5" />
          {/* Cloud Icon */}
          <path d="M16 20 C14.5 20 13.5 19 13.5 17.5 C13.5 16.2 14.4 15.2 15.7 15.1 C16.1 13.3 17.7 12 19.6 12 C21.8 12 23.6 13.6 23.8 15.8 C24.9 16.1 25.5 16.9 25.5 18 C25.5 19.1 24.6 20 23.5 20 Z" fill="#4F46E5" />
          {/* Green Checkpoint Dot */}
          <circle cx="38" cy="16" r="4" fill="#22C55E" />
          <path d="M36.5 16 L37.5 17 L39.5 15" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Plus Action Floating Pill (Bottom Right) */}
        <g transform="translate(205, 142)">
          <rect x="0" y="0" width="76" height="30" rx="15" fill="url(#lib-indigo-card)" stroke="#818CF8" strokeWidth="1" />
          <path d="M18 15 H28 M23 10 V20" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          <text x="48" y="19" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Unggah</text>
        </g>

        {/* Sparkles & Star Accents */}
        <path d="M50 130 Q54 130 54 126 Q54 130 58 130 Q54 130 54 134 Q54 130 50 130 Z" fill="#F59E0B" />
        <path d="M260 90 Q264 90 264 86 Q264 90 268 90 Q264 90 264 94 Q264 90 260 90 Z" fill="#6366F1" />
        <circle cx="68" cy="70" r="3" fill="#A5B4FC" />
        <circle cx="270" cy="150" r="2.5" fill="#FBBF24" />
      </svg>
    );
  }

  if (type === 'expiry') {
    return (
      <svg
        viewBox="0 0 320 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="exp-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
          
          <linearGradient id="exp-amber" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          <filter id="exp-shadow" x="0" y="0" width="320" height="220" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#D97706" floodOpacity="0.16" />
          </filter>
        </defs>

        <ellipse cx="160" cy="115" rx="120" ry="80" fill="url(#exp-glow)" />

        {/* Background Grid Pattern */}
        <g stroke="#E2E8F0" className="dark:stroke-slate-800" strokeWidth="1" strokeDasharray="4 4" opacity="0.6">
          <line x1="50" y1="60" x2="270" y2="60" />
          <line x1="50" y1="120" x2="270" y2="120" />
          <line x1="50" y1="180" x2="270" y2="180" />
        </g>

        {/* Certificate Card Base */}
        <g filter="url(#exp-shadow)">
          <rect x="75" y="45" width="145" height="115" rx="16" fill="#FFFFFF" stroke="#FDE68A" className="dark:fill-slate-850 dark:stroke-amber-800" strokeWidth="2" />
          
          {/* Inner Dashed Line */}
          <rect x="83" y="53" width="129" height="99" rx="10" fill="none" stroke="#FEF3C7" className="dark:stroke-slate-750" strokeWidth="1.5" strokeDasharray="4 3" />
          
          {/* Top Bar Header */}
          <rect x="98" y="65" width="55" height="7" rx="3.5" fill="#F59E0B" />
          <rect x="98" y="78" width="95" height="5" rx="2.5" fill="#CBD5E1" className="dark:fill-slate-700" />
          <rect x="98" y="88" width="75" height="4" rx="2" fill="#E2E8F0" className="dark:fill-slate-750" />
          <rect x="98" y="98" width="85" height="4" rx="2" fill="#F1F5F9" className="dark:fill-slate-800" />

          {/* Calendar Mini Matrix */}
          <g transform="translate(98, 112)">
            <rect x="0" y="0" width="45" height="26" rx="6" fill="#FEF3C7" stroke="#FDE68A" className="dark:fill-amber-950/50 dark:stroke-amber-900" strokeWidth="1" />
            <circle cx="8" cy="8" r="2" fill="#D97706" />
            <circle cx="16" cy="8" r="2" fill="#D97706" />
            <circle cx="24" cy="8" r="2" fill="#D97706" />
            <circle cx="32" cy="8" r="2" fill="#D97706" />
            <circle cx="8" cy="18" r="2" fill="#D97706" />
            <circle cx="16" cy="18" r="2" fill="#D97706" />
            <circle cx="24" cy="18" r="2" fill="#F59E0B" opacity="0.4" />
          </g>
        </g>

        {/* Large Holographic Clock / Timer Dial (Right Focus) */}
        <g transform="translate(195, 80)">
          {/* Clock Outer Ring */}
          <circle cx="35" cy="35" r="38" fill="#FFFFFF" stroke="#F59E0B" className="dark:fill-slate-900" strokeWidth="4" />
          <circle cx="35" cy="35" r="32" fill="#FFFBEB" className="dark:fill-slate-850" />

          {/* Clock Ticks */}
          <line x1="35" y1="8" x2="35" y2="13" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="35" y1="57" x2="35" y2="62" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="8" y1="35" x2="13" y2="35" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="57" y1="35" x2="62" y2="35" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />

          {/* Clock Hands pointing to alert time */}
          <line x1="35" y1="35" x2="35" y2="18" stroke="#B45309" strokeWidth="3" strokeLinecap="round" />
          <line x1="35" y1="35" x2="50" y2="35" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="35" cy="35" r="4.5" fill="#B45309" />

          {/* Glowing Alert Pill */}
          <g transform="translate(42, -10)">
            <rect x="0" y="0" width="32" height="20" rx="10" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
            <text x="16" y="14" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">!</text>
          </g>
        </g>

        {/* Filter Reset Pill (Bottom Right) */}
        <g transform="translate(170, 168)">
          <rect x="0" y="0" width="105" height="28" rx="14" fill="#F8FAFC" stroke="#E2E8F0" className="dark:fill-slate-800 dark:stroke-slate-700" strokeWidth="1.5" />
          <circle cx="14" cy="14" r="5" fill="#F59E0B" />
          <text x="58" y="18" textAnchor="middle" fill="#475569" className="dark:fill-slate-300" fontSize="10" fontWeight="bold" fontFamily="sans-serif">Filter Masa Berlaku</text>
        </g>

        {/* Floating Sparkles */}
        <path d="M52 85 Q56 85 56 81 Q56 85 60 85 Q56 85 56 89 Q56 85 52 85 Z" fill="#F59E0B" />
        <circle cx="65" cy="165" r="3" fill="#FBBF24" />
        <circle cx="280" cy="50" r="2.5" fill="#F59E0B" />
      </svg>
    );
  }

  // Default: Optical Search & Multi-Filter No Results Illustration
  return (
    <svg
      viewBox="0 0 320 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="src-spotlight" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#818CF8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="src-lens-glass" x1="160" y1="70" x2="230" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="40%" stopColor="#EEF2FF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#818CF8" stopOpacity="0.6" />
        </linearGradient>

        <linearGradient id="src-handle" x1="210" y1="120" x2="265" y2="175" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#312E81" />
        </linearGradient>

        <filter id="src-doc-shadow" x="0" y="0" width="320" height="220" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#0F172A" floodOpacity="0.08" />
        </filter>

        <filter id="src-lens-shadow" x="140" y="50" width="140" height="140" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#4338CA" floodOpacity="0.28" />
        </filter>
      </defs>

      {/* Ambient Spotlight */}
      <ellipse cx="160" cy="110" rx="125" ry="85" fill="url(#src-spotlight)" />

      {/* Modern Scanning Matrix Coordinate Points */}
      <g opacity="0.4" fill="#94A3B8" className="dark:fill-slate-600">
        <circle cx="50" cy="45" r="1.5" />
        <circle cx="80" cy="45" r="1.5" />
        <circle cx="240" cy="45" r="1.5" />
        <circle cx="270" cy="45" r="1.5" />
        <circle cx="50" cy="175" r="1.5" />
        <circle cx="80" cy="175" r="1.5" />
        <circle cx="240" cy="175" r="1.5" />
        <circle cx="270" cy="175" r="1.5" />
      </g>

      {/* Scan Radar Orbit Rings */}
      <circle cx="160" cy="105" r="85" stroke="#CBD5E1" className="dark:stroke-slate-750" strokeWidth="1" strokeDasharray="5 5" opacity="0.6" />
      <circle cx="160" cy="105" r="60" stroke="#C7D2FE" className="dark:stroke-slate-700" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />

      {/* Background Scaffold Certificate Document */}
      <g filter="url(#src-doc-shadow)">
        <rect x="75" y="38" width="135" height="130" rx="18" fill="#FFFFFF" stroke="#CBD5E1" className="dark:fill-slate-850 dark:stroke-slate-700" strokeWidth="1.5" />
        
        {/* Document Fold Top Right */}
        <path d="M192 38 L210 56 L192 56 Z" fill="#E2E8F0" className="dark:fill-slate-700" />
        
        {/* Frame Dashed Border */}
        <rect x="85" y="48" width="115" height="110" rx="12" fill="none" stroke="#F1F5F9" className="dark:stroke-slate-750" strokeWidth="1.5" strokeDasharray="4 3" />

        {/* Certificate Header Bar */}
        <rect x="98" y="60" width="50" height="7" rx="3.5" fill="#6366F1" opacity="0.85" />
        <rect x="154" y="60" width="30" height="7" rx="3.5" fill="#E2E8F0" className="dark:fill-slate-700" />

        {/* Document Content Skeletal Lines */}
        <rect x="98" y="74" width="88" height="5" rx="2.5" fill="#CBD5E1" className="dark:fill-slate-700" />
        <rect x="98" y="84" width="70" height="4" rx="2" fill="#E2E8F0" className="dark:fill-slate-750" />
        <rect x="98" y="93" width="80" height="4" rx="2" fill="#E2E8F0" className="dark:fill-slate-750" />
        <rect x="98" y="102" width="60" height="4" rx="2" fill="#F1F5F9" className="dark:fill-slate-800" />

        {/* Seal Stamp Outline */}
        <circle cx="114" cy="132" r="12" fill="#EEF2FF" stroke="#C7D2FE" className="dark:fill-slate-750 dark:stroke-slate-700" strokeWidth="1.2" />
        <path d="M109 132 L113 136 L119 128" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

        {/* Signature Line */}
        <line x1="140" y1="138" x2="185" y2="138" stroke="#CBD5E1" className="dark:stroke-slate-700" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Floating Query Filter Tag Chip (Left) */}
      <g transform="translate(42, 92)">
        <rect x="0" y="0" width="62" height="26" rx="13" fill="#F8FAFC" stroke="#E2E8F0" className="dark:fill-slate-800 dark:stroke-slate-700" strokeWidth="1.5" />
        <circle cx="12" cy="13" r="4" fill="#F59E0B" />
        <rect x="22" y="11" width="30" height="4" rx="2" fill="#94A3B8" className="dark:fill-slate-600" />
      </g>

      {/* Floating Question Orb (Top Left) */}
      <g transform="translate(56, 32)">
        <circle cx="16" cy="16" r="16" fill="#EEF2FF" stroke="#C7D2FE" className="dark:fill-slate-800 dark:stroke-slate-700" strokeWidth="1.5" />
        <text x="16" y="22" textAnchor="middle" fill="#4F46E5" fontSize="16" fontWeight="bold" fontFamily="sans-serif">?</text>
      </g>

      {/* Optical Magnifying Glass Floating Center-Right */}
      <g filter="url(#src-lens-shadow)">
        {/* Ergonomic Handle */}
        <path d="M222 132 L262 172" stroke="url(#src-handle)" strokeWidth="14" strokeLinecap="round" />
        <path d="M224 134 L258 168" stroke="#818CF8" strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />
        <circle cx="261" cy="171" r="7" fill="#312E81" />

        {/* Metallic Bezel Ring */}
        <circle cx="190" cy="100" r="40" fill="#FFFFFF" stroke="#4F46E5" className="dark:fill-slate-900" strokeWidth="5" />

        {/* Ultra Clear Glass Lens */}
        <circle cx="190" cy="100" r="35" fill="url(#src-lens-glass)" />

        {/* Reticle Focus Grid Inside Lens */}
        <g stroke="#4F46E5" strokeWidth="1.5" opacity="0.6" strokeDasharray="4 3">
          <line x1="190" y1="74" x2="190" y2="126" />
          <line x1="164" y1="100" x2="216" y2="100" />
        </g>
        <circle cx="190" cy="100" r="12" fill="none" stroke="#4F46E5" strokeWidth="1.5" />
        <circle cx="190" cy="100" r="3.5" fill="#4F46E5" />

        {/* Glass Glare Highlights */}
        <path d="M168 84 A 28 28 0 0 1 212 84" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      </g>

      {/* Result Count Indicator Pill (Bottom Right) */}
      <g transform="translate(178, 154)">
        <rect x="0" y="0" width="84" height="28" rx="14" fill="#FEF2F2" stroke="#FECACA" className="dark:fill-rose-950/80 dark:stroke-rose-800" strokeWidth="1.5" />
        <circle cx="14" cy="14" r="4.5" fill="#EF4444" />
        <text x="49" y="18" textAnchor="middle" fill="#991B1B" className="dark:fill-rose-200" fontSize="11" fontWeight="bold" fontFamily="sans-serif">0 Ditemukan</text>
      </g>

      {/* Dynamic Floating Sparkles */}
      <path d="M85 170 Q89 170 89 166 Q89 170 93 170 Q89 170 89 174 Q89 170 85 170 Z" fill="#F59E0B" />
      <path d="M255 45 Q259 45 259 41 Q259 45 263 45 Q259 45 259 49 Q259 45 255 45 Z" fill="#6366F1" />
      <circle cx="270" cy="95" r="3" fill="#FBBF24" />
      <circle cx="58" cy="140" r="2.5" fill="#818CF8" />
    </svg>
  );
};
