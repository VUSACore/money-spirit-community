const LotusIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Center petal */}
    <ellipse cx="16" cy="14" rx="4" ry="10" fill="currentColor" opacity="0.9" />
    {/* Left petal */}
    <ellipse cx="10" cy="16" rx="3.5" ry="9" fill="currentColor" opacity="0.6" transform="rotate(-20 10 16)" />
    {/* Right petal */}
    <ellipse cx="22" cy="16" rx="3.5" ry="9" fill="currentColor" opacity="0.6" transform="rotate(20 22 16)" />
    {/* Far left petal */}
    <ellipse cx="6" cy="18" rx="3" ry="7.5" fill="currentColor" opacity="0.35" transform="rotate(-35 6 18)" />
    {/* Far right petal */}
    <ellipse cx="26" cy="18" rx="3" ry="7.5" fill="currentColor" opacity="0.35" transform="rotate(35 26 18)" />
  </svg>
);

export default LotusIcon;
