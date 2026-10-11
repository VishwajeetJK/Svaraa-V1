/** Refined lotus mark — geometric petals, brand gold on aubergine. */
export function LotusMark({ size = 40, className }: { size?: number; className?: string }) {
  const uid = `lotus-${size}`;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-g`} x1="0.15" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#ecd9a8" />
          <stop offset="45%" stopColor="#c6a15b" />
          <stop offset="100%" stopColor="#8a6a2e" />
        </linearGradient>
        <radialGradient id={`${uid}-bg`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#4a2836" />
          <stop offset="100%" stopColor="#2a1520" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill={`url(#${uid}-bg)`} />
      <g fill={`url(#${uid}-g)`} opacity="0.95">
        {/* Soft petal fans */}
        <path d="M32 14c2.2 6 2.2 12 0 18-2.2-6-2.2-12 0-18z" />
        <path d="M32 14c2.2 6 2.2 12 0 18-2.2-6-2.2-12 0-18z" transform="rotate(40 32 32)" />
        <path d="M32 14c2.2 6 2.2 12 0 18-2.2-6-2.2-12 0-18z" transform="rotate(-40 32 32)" />
        <path d="M32 14c2.2 6 2.2 12 0 18-2.2-6-2.2-12 0-18z" transform="rotate(80 32 32)" />
        <path d="M32 14c2.2 6 2.2 12 0 18-2.2-6-2.2-12 0-18z" transform="rotate(-80 32 32)" />
        <circle cx="32" cy="33" r="3.2" fill="#f7efd8" />
      </g>
      <circle cx="32" cy="32" r="30.2" fill="none" stroke="rgba(236,217,168,0.22)" strokeWidth="1" />
    </svg>
  );
}
