import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [visible, setVisible] = useState(true);

  const handleEnded = () => {
    setVisible(false);
    setTimeout(onComplete, 600);
  };

  useEffect(() => {
    const fallback = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 600);
    }, 8000);
    return () => clearTimeout(fallback);
  }, [onComplete]);

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
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: visible ? 'all' : 'none',
      }}
    >
      <video
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          inset: 0,
        }}
      >
        <source src="/welcome.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
