import React, { useEffect, useRef } from 'react';

/**
 * Real-time Physiological Electrocardiogram (ECG) Waveform Canvas
 * Features:
 * - Dynamic P-Q-R-S-T cardiac cycle generation
 * - Reactive to BPM (beats per minute)
 * - Phosphor green CRT medical oscilloscope glow
 * - Real-time medical telemetry grid with scanning sweep bar
 */
const ECGCanvas = ({ bpm = 75, height = 180 }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const xRef = useRef(0);
  const pointsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = (canvas.width = canvas.parentElement.offsetWidth);
    canvas.height = height;

    const baseLine = height * 0.55;
    const points = [];
    const maxPoints = Math.floor(width);

    for (let i = 0; i < maxPoints; i++) {
      points.push(baseLine);
    }
    pointsRef.current = points;

    let beatProgress = 0;
    const beatInterval = (60 / bpm) * 60; // frames per beat at 60fps

    const render = () => {
      // Advance cardiac cycle
      beatProgress = (beatProgress + 1) % beatInterval;
      const normalizedT = beatProgress / beatInterval; // 0 to 1

      // Generate ECG P-Q-R-S-T wave mathematically
      let yOffset = 0;
      if (normalizedT > 0.15 && normalizedT < 0.25) {
        // P Wave (atrial depolarization)
        yOffset = -Math.sin(((normalizedT - 0.15) / 0.1) * Math.PI) * (height * 0.12);
      } else if (normalizedT >= 0.25 && normalizedT < 0.28) {
        // Q dip
        yOffset = ((normalizedT - 0.25) / 0.03) * (height * 0.08);
      } else if (normalizedT >= 0.28 && normalizedT < 0.33) {
        // R Spike (ventricular depolarization - sharp peak)
        const rNorm = (normalizedT - 0.28) / 0.05;
        if (rNorm < 0.5) {
          yOffset = - (rNorm * 2) * (height * 0.44);
        } else {
          yOffset = - (1 - (rNorm - 0.5) * 2) * (height * 0.44);
        }
      } else if (normalizedT >= 0.33 && normalizedT < 0.38) {
        // S dip
        yOffset = Math.sin(((normalizedT - 0.33) / 0.05) * Math.PI) * (height * 0.14);
      } else if (normalizedT >= 0.48 && normalizedT < 0.65) {
        // T Wave (ventricular repolarization)
        yOffset = -Math.sin(((normalizedT - 0.48) / 0.17) * Math.PI) * (height * 0.18);
      } else {
        // Baseline noise
        yOffset = (Math.random() - 0.5) * 1.5;
      }

      // Shift wave points
      xRef.current = (xRef.current + 2) % width;
      const writeIdx = Math.floor(xRef.current);

      pointsRef.current[writeIdx] = baseLine + yOffset;
      // Clear a small lead ahead to simulate CRT sweep
      for (let c = 1; c <= 14; c++) {
        pointsRef.current[(writeIdx + c) % width] = baseLine;
      }

      // Draw background medical telemetry grid
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Faint grid lines
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.06)';
      ctx.lineWidth = 1;
      const gridSize = 20;

      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Major grid lines
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize * 4) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize * 4) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Render ECG phosphor trail
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#10B981';
      ctx.shadowColor = 'rgba(16, 185, 129, 0.9)';
      ctx.shadowBlur = 10;

      let started = false;
      for (let i = 0; i < width; i++) {
        // Gap near the sweep head
        const distFromHead = (i - writeIdx + width) % width;
        if (distFromHead > 2 && distFromHead < 14) {
          started = false;
          continue;
        }

        const y = pointsRef.current[i];
        if (!started) {
          ctx.moveTo(i, y);
          started = true;
        } else {
          ctx.lineTo(i, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw leading CRT electron dot
      const leadY = pointsRef.current[writeIdx];
      ctx.beginPath();
      ctx.arc(writeIdx, leadY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#6EE7B7';
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      canvas.width = canvas.parentElement.offsetWidth;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [bpm, height]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-950 shadow-2xl">
      <canvas ref={canvasRef} className="w-full block" />
      <div className="absolute top-3 left-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-[11px] font-black tracking-wider uppercase text-emerald-400">LEAD II • ECG REAL-TIME</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 border-l border-slate-700 pl-3">25mm/s • 10mm/mV</span>
      </div>
      <div className="absolute top-3 right-4 flex items-center gap-2 font-mono">
        <span className="text-2xl font-black text-emerald-400">{bpm}</span>
        <span className="text-xs font-bold text-slate-400">BPM</span>
      </div>
    </div>
  );
};

export default ECGCanvas;
