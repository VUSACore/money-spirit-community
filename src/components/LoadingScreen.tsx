import { useEffect } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  useEffect(() => {
    const fallback = setTimeout(() => {
      onComplete();
    }, 15000);

    return () => clearTimeout(fallback);
  }, [onComplete]);

  const handleVideoEnded = () => {
    onComplete();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#0B1F3A',
      }}
    >
      <video
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnded}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          inset: 0,
          display: 'block',
        }}
      >
        <source src="/welcomeV6.mp4" type="video/mp4" />
      </video>
      <button
        onClick={onComplete}
        style={{
          position: 'absolute',
          bottom: 40,
          right: 40,
          zIndex: 10000,
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(196,151,58,0.3)',
          borderRadius: 'var(--r-pill, 999px)',
          padding: '8px 24px',
          color: '#C4973A',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        Skip
      </button>
    </div>
  );
}
