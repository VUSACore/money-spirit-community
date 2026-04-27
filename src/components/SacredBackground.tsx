const SacredBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
    {/* Top-right mandala */}
    <svg
      className="sacred-mandala absolute"
      style={{ top: '-120px', right: '-120px', width: 600, height: 600, opacity: 1 }}
      viewBox="0 0 600 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="rgba(224,176,64,0.04)" strokeWidth="0.5" fill="none">
        {[40, 80, 120, 160, 200, 240, 280].map((r) => (
          <circle key={r} cx="300" cy="300" r={r} />
        ))}
        {/* Lotus petals */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <ellipse
            key={angle}
            cx="300"
            cy="220"
            rx="18"
            ry="60"
            transform={`rotate(${angle} 300 300)`}
          />
        ))}
        {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle) => (
          <ellipse
            key={angle}
            cx="300"
            cy="240"
            rx="12"
            ry="45"
            transform={`rotate(${angle} 300 300)`}
          />
        ))}
      </g>
    </svg>

    {/* Bottom-left mandala */}
    <svg
      className="sacred-mandala-reverse absolute"
      style={{ bottom: '-60px', left: '-60px', width: 300, height: 300, opacity: 1 }}
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="rgba(224,176,64,0.025)" strokeWidth="0.5" fill="none">
        {[20, 40, 60, 80, 100, 120, 140].map((r) => (
          <circle key={r} cx="150" cy="150" r={r} />
        ))}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <ellipse
            key={angle}
            cx="150"
            cy="110"
            rx="9"
            ry="30"
            transform={`rotate(${angle} 150 150)`}
          />
        ))}
      </g>
    </svg>
  </div>
);

export default SacredBackground;
