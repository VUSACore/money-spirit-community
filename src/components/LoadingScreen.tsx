import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const fadeIn = setTimeout(() => {
      setOpacity(1);
    }, 50);

    const fallback = setTimeout(() => {
      setOpacity(0);
      setTimeout(onComplete, 500);
    }, 15000);

    return () => {
      clearTimeout(fadeIn);
      clearTimeout(fallback);
    };
  }, [onComplete]);

  const handleVideoEnded = () => {
    setOpacity(0);
    setTimeout(onComplete, 500);
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
