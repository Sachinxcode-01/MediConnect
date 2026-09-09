import React, { useEffect, useRef, useState } from 'react';

/**
 * High-performance 3D Interactive Canvas
 * Features:
 * - Mathematical 3D DNA Double-Helix / Bio-Constellation / Pulse Network
 * - Real-time mouse parallax & 3D rotation inertia
 * - Zero external heavy 3D library overhead (runs at smooth 60fps on all devices)
 * - Dynamic mode switching (DNA Double Helix, Neural Synapse, Bio-Pulse)
 */
const Hero3DScene = ({ activeMode = 'dna', onModeChange }) => {
  const canvasRef = useRef(null);
  const mousePosRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const animFrameRef = useRef(null);
  const [internalMode, setInternalMode] = useState(activeMode);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = canvas.parentElement.offsetWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / width - 0.5;
      const y = (e.clientY - rect.top) / height - 0.5;
      mousePosRef.current.targetX = x * 2;
      mousePosRef.current.targetY = y * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Particle nodes setup
    const nodeCount = 70;
    const backgroundStars = Array.from({ length: 90 }, () => ({
      x: (Math.random() - 0.5) * 1200,
      y: (Math.random() - 0.5) * 800,
      z: Math.random() * 800 + 100,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.7 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      phase: Math.random() * Math.PI * 2,
    }));

    let angle = 0;

    const render = () => {
      // Smooth mouse interpolation
      mousePosRef.current.x += (mousePosRef.current.targetX - mousePosRef.current.x) * 0.05;
      mousePosRef.current.y += (mousePosRef.current.targetY - mousePosRef.current.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const rotY = angle * 0.6 + mousePosRef.current.x * 0.4;
      const rotX = mousePosRef.current.y * 0.3;

      // Draw background ambient starfield
      backgroundStars.forEach((star) => {
        star.phase += star.pulseSpeed;
        const currentAlpha = star.alpha * (0.6 + 0.4 * Math.sin(star.phase));
        
        // 3D perspective projection
        const fov = 400;
        const scale = fov / (fov + star.z);
        const px = cx + (star.x + mousePosRef.current.x * 60) * scale;
        const py = cy + (star.y + mousePosRef.current.y * 60) * scale;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          ctx.beginPath();
          ctx.arc(px, py, star.size * scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(16, 185, 129, ${currentAlpha * 0.6})`;
          ctx.fill();
        }
      });

      if (internalMode === 'dna') {
        // MODE 1: 3D ROTATING DNA DOUBLE HELIX
        const r = Math.min(width, height) * 0.22;
        const steps = 44;
        const helixHeight = Math.min(height * 0.9, 520);
        const yStep = helixHeight / steps;

        const pointsA = [];
        const pointsB = [];

        for (let i = 0; i < steps; i++) {
          const theta = (i / steps) * Math.PI * 5 + rotY;
          const y = (i - steps / 2) * yStep;

          // Strand 1
          const x1 = Math.cos(theta) * r;
          const z1 = Math.sin(theta) * r;

          // Strand 2 (180 deg offset)
          const x2 = Math.cos(theta + Math.PI) * r;
          const z2 = Math.sin(theta + Math.PI) * r;

          // Apply X-axis rotation tilt
          const y1Rot = y * Math.cos(rotX) - z1 * Math.sin(rotX);
          const z1Rot = y * Math.sin(rotX) + z1 * Math.cos(rotX);

          const y2Rot = y * Math.cos(rotX) - z2 * Math.sin(rotX);
          const z2Rot = y * Math.sin(rotX) + z2 * Math.cos(rotX);

          // Perspective projection
          const fov = 600;
          const scale1 = fov / (fov + z1Rot + 250);
          const scale2 = fov / (fov + z2Rot + 250);

          const px1 = cx + x1 * scale1;
          const py1 = cy + y1Rot * scale1;

          const px2 = cx + x2 * scale2;
          const py2 = cy + y2Rot * scale2;

          pointsA.push({ x: px1, y: py1, z: z1Rot, scale: scale1 });
          pointsB.push({ x: px2, y: py2, z: z2Rot, scale: scale2 });

          // Draw base pair connecting hydrogen rung
          if (i % 2 === 0) {
            const grad = ctx.createLinearGradient(px1, py1, px2, py2);
            const alpha = Math.max(0.15, Math.min(0.85, (z1Rot + z2Rot + 400) / 800));
            grad.addColorStop(0, `rgba(16, 185, 129, ${alpha})`); // Emerald
            grad.addColorStop(0.5, `rgba(6, 182, 212, ${alpha * 0.9})`); // Cyan
            grad.addColorStop(1, `rgba(99, 102, 241, ${alpha})`); // Indigo

            ctx.beginPath();
            ctx.moveTo(px1, py1);
            ctx.lineTo(px2, py2);
            ctx.strokeStyle = grad;
            ctx.lineWidth = Math.max(1, 2.5 * ((scale1 + scale2) / 2));
            ctx.stroke();

            // Center base marker
            const midX = (px1 + px2) / 2;
            const midY = (py1 + py2) / 2;
            ctx.beginPath();
            ctx.arc(midX, midY, 2.5 * scale1, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
            ctx.shadowColor = 'rgba(6, 182, 212, 0.8)';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }

        // Draw Strand A nodes & backbone
        for (let i = 0; i < pointsA.length; i++) {
          const pt = pointsA[i];
          const alpha = Math.max(0.2, Math.min(1, (pt.z + 300) / 600));
          const radius = Math.max(2, 5 * pt.scale);

          ctx.beginPath();
          ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(52, 211, 153, ${alpha})`;
          ctx.shadowColor = 'rgba(16, 185, 129, 0.9)';
          ctx.shadowBlur = 12 * pt.scale;
          ctx.fill();
          ctx.shadowBlur = 0;

          if (i > 0) {
            ctx.beginPath();
            ctx.moveTo(pointsA[i - 1].x, pointsA[i - 1].y);
            ctx.lineTo(pt.x, pt.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${alpha * 0.7})`;
            ctx.lineWidth = 2 * pt.scale;
            ctx.stroke();
          }
        }

        // Draw Strand B nodes & backbone
        for (let i = 0; i < pointsB.length; i++) {
          const pt = pointsB[i];
          const alpha = Math.max(0.2, Math.min(1, (pt.z + 300) / 600));
          const radius = Math.max(2, 5 * pt.scale);

          ctx.beginPath();
          ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(34, 211, 238, ${alpha})`;
          ctx.shadowColor = 'rgba(6, 182, 212, 0.9)';
          ctx.shadowBlur = 12 * pt.scale;
          ctx.fill();
          ctx.shadowBlur = 0;

          if (i > 0) {
            ctx.beginPath();
            ctx.moveTo(pointsB[i - 1].x, pointsB[i - 1].y);
            ctx.lineTo(pt.x, pt.y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.7})`;
            ctx.lineWidth = 2 * pt.scale;
            ctx.stroke();
          }
        }
      } else if (internalMode === 'neural') {
        // MODE 2: NEURAL SYNAPSE / HEALTH INTELLIGENCE NETWORK
        const nodes = [];
        const radius = Math.min(width, height) * 0.32;

        for (let i = 0; i < nodeCount; i++) {
          const phi = Math.acos(-1 + (2 * i) / nodeCount);
          const theta = Math.sqrt(nodeCount * Math.PI) * phi + rotY;

          const x = radius * Math.cos(theta) * Math.sin(phi);
          const y = radius * Math.sin(theta) * Math.sin(phi);
          const z = radius * Math.cos(phi);

          // 3D rotation
          const yRot = y * Math.cos(rotX) - z * Math.sin(rotX);
          const zRot = y * Math.sin(rotX) + z * Math.cos(rotX);

          const fov = 500;
          const scale = fov / (fov + zRot + 250);
          nodes.push({
            x: cx + x * scale,
            y: cy + yRot * scale,
            z: zRot,
            scale,
          });
        }

        // Draw synaptical connections
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 85) {
              const alpha = (1 - dist / 85) * 0.45;
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }

          // Node drawing
          const n = nodes[i];
          const alpha = Math.max(0.3, Math.min(1, (n.z + 300) / 600));
          ctx.beginPath();
          ctx.arc(n.x, n.y, 3.5 * n.scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(52, 211, 153, ${alpha})`;
          ctx.shadowColor = 'rgba(16, 185, 129, 0.8)';
          ctx.shadowBlur = 10 * n.scale;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      } else {
        // MODE 3: ORGANIC BIO-PULSE VORTEX
        const ringCount = 8;
        const ptsPerRing = 24;

        for (let r = 0; r < ringCount; r++) {
          const ringRadius = (r + 1) * (Math.min(width, height) * 0.04);
          const offsetZ = Math.sin(angle * 2 + r * 0.6) * 45;
          const ringAlpha = (1 - r / ringCount) * 0.7 + 0.2;

          ctx.beginPath();
          for (let p = 0; p <= ptsPerRing; p++) {
            const theta = (p / ptsPerRing) * Math.PI * 2 + rotY * (r % 2 === 0 ? 1 : -1);
            const wave = Math.sin(theta * 3 + angle * 3) * 10;
            const x = Math.cos(theta) * (ringRadius + wave);
            const y = Math.sin(theta) * (ringRadius + wave);

            const yRot = y * Math.cos(rotX) - offsetZ * Math.sin(rotX);
            const zRot = y * Math.sin(rotX) + offsetZ * Math.cos(rotX);

            const fov = 500;
            const scale = fov / (fov + zRot + 250);
            const px = cx + x * scale;
            const py = cy + yRot * scale;

            if (p === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.strokeStyle = `rgba(6, 182, 212, ${ringAlpha * 0.6})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      angle += 0.012;
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [internalMode]);

  const modes = [
    { id: 'dna', label: '🧬 3D DNA Helix' },
    { id: 'neural', label: '⚡ Neural Synapse' },
    { id: 'pulse', label: '🌊 Bio-Vortex' },
  ];

  return (
    <div className="relative w-full h-full min-h-[460px] lg:min-h-[620px] flex items-center justify-center overflow-hidden rounded-[2.5rem]">
      {/* Dynamic 3D Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing pointer-events-auto" />

      {/* Floating 3D Mode Selector Pills */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-1.5 rounded-full bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 shadow-2xl">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setInternalMode(m.id);
              if (onModeChange) onModeChange(m.id);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
              internalMode === m.id
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/30 scale-105'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Floating Interactive 3D Depth Badges */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/70 border border-emerald-500/30 backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">60 FPS 3D Engine • Live Reactive</span>
      </div>
    </div>
  );
};

export default Hero3DScene;
