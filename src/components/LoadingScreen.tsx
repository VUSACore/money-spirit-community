import { useEffect, useState } from 'react';

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
        opacity,
        transition: opacity === 1
          ? 'opacity 0.5s ease-in'
          : 'opacity 0.5s ease-out',
        pointerEvents: 'all',
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
        <source src="/welcomeV5.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
