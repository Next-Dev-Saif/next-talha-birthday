"use client";
import React, { useEffect, useRef } from "react";

/**
 * MusicWave.jsx
 * A responsive canvas-based random rectangle beat animation for Next.js + React.
 * - Does NOT sync to music, generates random rectangle bar animation.
 * - Gradient uses crimson -> firebrick colors.
 *
 * Props:
 * - height: canvas height (default 140)
 * - className: string for outer wrapper styling
 * - canvasClassName: string for canvas styling
 * - barCount: number of bars (default 60)
 * - speed: animation speed multiplier (default 0.05)
 */

const MusicWave = ({
  height = 140,
  className = "",
  canvasClassName = "",
  barCount = 60,
  speed = 0.05,
  style
}) => {
  const canvasRef = useRef(null);
  const rafIdRef = useRef(null);

  useEffect(() => {
   var Resizer;
    if(typeof window!=="undefined"){
        const canvas = canvasRef.current;
        if (!canvas) return;
    
        const ctx = canvas.getContext("2d");
        const dpr = Math.max(1, window.devicePixelRatio || 1);
    
        const resize = () => {
           
            const rect = canvas.getBoundingClientRect();
            canvas.width = Math.floor(rect.width * dpr);
            canvas.height = Math.floor(height * dpr);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
          };
    
        resize();
        Resizer=resize;
        if(typeof window!=="undefined")
        window.addEventListener("resize", resize);
    
        const gradient = ctx.createLinearGradient(0, 0, canvas.width / dpr, 0);
        gradient.addColorStop(0, "rgba(172, 4, 77,0.3)");
        gradient.addColorStop(1, "rgba(172, 4, 77,0.1)");
    
        const amplitudes = new Array(barCount).fill(0).map(() => Math.random());
        let t = 0;
    
        const draw = () => {
          rafIdRef.current = requestAnimationFrame(draw);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
    
          const barWidth = (canvas.width / dpr) / barCount;
    
          for (let i = 0; i < barCount; i++) {
            const v = Math.abs(Math.sin(t + i) * amplitudes[i]);
            const barHeight = v * height;
            const x = i * barWidth;
            const y = (height - barHeight) / 2;
    
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth * 0.8, barHeight);
          }
    
          t += speed;
        };
    
        draw();
    }
   

    return () => {
        if(typeof window!=="undefined"&&typeof Resizer==="function"){
            window.removeEventListener("resize", Resizer);
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        }
     
    };
  }, [height, barCount, speed]);

  return (
    <div className={`p-3  ${className}`} style={style}>
      <canvas ref={canvasRef} className={canvasClassName} style={{ width: "100%", height }} />
    </div>
  );
};

export default MusicWave;
