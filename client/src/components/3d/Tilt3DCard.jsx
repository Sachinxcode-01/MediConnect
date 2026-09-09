import React, { useRef, useState } from 'react';

/**
 * 3D Tilt Card with dynamic cursor-following spotlight sheen
 * Features:
 * - Real-time perspective calculation (rotX, rotY, scale)
 * - Specular reflection tracking mouse position
 * - Smooth spring-like reset on mouse leave
 * - Supports preserve-3d multi-layered child elevation
 */
const Tilt3DCard = ({
  children,
  className = '',
  maxTilt = 12,
  scale = 1.02,
  glowColor = 'rgba(16, 185, 129, 0.25)',
  borderColor = 'rgba(16, 185, 129, 0.3)',
}) => {
  const cardRef = useRef(null);
  const [transformStyle, setTransformStyle] = useState('');
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -maxTilt;
    const rotY = ((x - centerX) / centerX) * maxTilt;

    setTransformStyle(`perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`);
    setSpotlight({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 1,
    });
  };

  const handleMouseLeave = () => {
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setSpotlight((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transition: 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        transformStyle: 'preserve-3d',
      }}
      className={`relative group rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 shadow-xl overflow-hidden ${className}`}
    >
      {/* Specular Spotlight Gradient */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl transition-opacity duration-300 z-10"
        style={{
          opacity: spotlight.opacity,
          background: `radial-gradient(400px circle at ${spotlight.x}% ${spotlight.y}%, ${glowColor}, transparent 70%)`,
        }}
      />

      {/* Dynamic Luminous Border Highlight */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl border transition-opacity duration-300 z-10"
        style={{
          borderColor: borderColor,
          opacity: spotlight.opacity,
        }}
      />

      {/* Card Content with 3D child preservation */}
      <div className="relative z-20 h-full w-full">{children}</div>
    </div>
  );
};

export default Tilt3DCard;
