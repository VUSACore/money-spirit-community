import { useEffect, useRef } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fallback = setTimeout(() => {
      onComplete();
    }, 15000);

    // Force play the video in case autoPlay is blocked
    const video = videoRef.current;
    if (video) {
      video.load();
      video.play().catch(() => {
        // autoplay blocked — skip to dashboard
        onComplete();
      });
    }

    return () => clearTimeout(fallback);
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#4169E1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={onComplete}
        src="/welcomeV6.mp4"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
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
          borderRadius: '999px',
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
