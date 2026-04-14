import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [phase, setPhase] = useState<'fadein' | 'playing' | 'fadeout'>('fadein');

  useEffect(() => {
    const fadeInTimer = setTimeout(() => {
      setPhase('playing');
    }, 800);

    const fadeOutTimer = setTimeout(() => {
      setPhase('fadeout');
    }, 7200);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 8000);

    const fallback = setTimeout(() => {
      onComplete();
    }, 12000);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
      clearTimeout(fallback);
    };
  }, [onComplete]);

  const opacity = phase === 'fadein' ? 0 : phase === 'playing' ? 1 : 0;

  const transition = phase === 'fadein'
    ? 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
    : phase === 'fadeout'
    ? 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
    : 'none';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#0B1F3A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <video
        autoPlay
        muted
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          inset: 0,
          opacity,
          transition,
        }}
      >
        <source src="/welcome.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
