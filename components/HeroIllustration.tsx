export function HeroIllustration() {
  return (
    <svg viewBox="0 0 640 420" className="w-full h-auto" aria-hidden="true">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E5FBFF" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFE8F9" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="shirt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE8F9" />
          <stop offset="1" stopColor="#F7C5E6" />
        </linearGradient>
      </defs>

      <rect x="40" y="30" width="560" height="360" rx="180" fill="url(#bg)" />
      {/* little hearts */}
      <g fill="#F7B6D8" opacity="0.8">
        <path d="M520 120c10-14 32-10 32 8 0 20-32 36-32 36s-32-16-32-36c0-18 22-22 32-8z"/>
        <path d="M140 120c7-10 23-7 23 6 0 14-23 26-23 26s-23-12-23-26c0-13 16-16 23-6z"/>
      </g>

      {/* person */}
      <g>
        {/* hair */}
        <path d="M420 135c-10-35-46-62-90-56-52 7-76 48-70 92 6 46 15 62 12 92-3 30 21 55 62 55 58 0 92-35 98-80 6-45-4-76-12-103z"
          fill="#6B3F2F"/>
        {/* face */}
        <ellipse cx="362" cy="170" rx="52" ry="58" fill="#F8D7C4"/>
        {/* smile */}
        <path d="M346 196c10 10 22 10 32 0" stroke="#C46B6B" strokeWidth="6" strokeLinecap="round" fill="none"/>
        {/* eyes */}
        <circle cx="344" cy="170" r="6" fill="#3A2A2A"/>
        <circle cx="382" cy="170" r="6" fill="#3A2A2A"/>
        {/* jacket */}
        <path d="M300 250c25-20 100-20 125 0 22 18 35 48 35 88H265c0-40 13-70 35-88z"
          fill="url(#shirt)"/>
        {/* phone */}
        <rect x="435" y="220" width="54" height="82" rx="10" fill="#3D4C6B"/>
        <circle cx="462" cy="290" r="4" fill="#A9B7D3"/>
      </g>

      {/* calendar */}
      <g transform="translate(210 210)">
        <rect x="0" y="0" width="120" height="110" rx="16" fill="#FFFFFF" opacity="0.95"/>
        <rect x="0" y="0" width="120" height="26" rx="16" fill="#F7B6D8" opacity="0.95"/>
        <rect x="18" y="10" width="10" height="18" rx="5" fill="#6B3F2F"/>
        <rect x="92" y="10" width="10" height="18" rx="5" fill="#6B3F2F"/>
        {/* grid dots */}
        <g fill="#D9E6F5">
          {Array.from({length: 16}).map((_,i)=>{
            const col=i%4; const row=Math.floor(i/4);
            return <circle key={i} cx={22+col*24} cy={46+row*18} r="4"/>;
          })}
        </g>
        <circle cx="94" cy="64" r="10" fill="#E5FBFF"/>
        <path d="M90 64l4 4 8-10" stroke="#4A8F7A" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  );
}
