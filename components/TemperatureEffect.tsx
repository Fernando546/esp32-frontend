"use client";
import React, { useEffect, useRef } from 'react';

type AccentKey = 'cold' | 'normal' | 'warm' | 'hot';

interface TemperatureEffectProps {
  accent: AccentKey;
  theme: 'night' | 'day';
  active?: boolean; // allow disabling later
}

/* Lightweight temperature-based ambient animation.
   hot  : rising flame particles
   warm : gentle heat-wave sine lines
   cold : slow falling snowflakes
   normal: minimal (no animation to keep calm)
*/
const TemperatureEffect: React.FC<TemperatureEffectProps> = ({ accent, theme, active = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>();
  const particlesRef = useRef<any[]>([]);
  const lastAccentRef = useRef<AccentKey | null>(null);

  useEffect(() => {
    if (!active) { if (rafRef.current) cancelAnimationFrame(rafRef.current); return; }
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;

    function resize() { if (!canvas) return; canvas.width = window.innerWidth; canvas.height = window.innerHeight; init(); }
    function init() {
      if (!canvas) return; const w = canvas.width, h = canvas.height;
      particlesRef.current = [];
      if (accent === 'hot') {
        const count = Math.min(160, Math.floor(w * 0.14));
        for (let i=0;i<count;i++) particlesRef.current.push({
          x: Math.random()*w,
          y: h + Math.random()*120,
          r: 4 + Math.random()*10,
          vy: 2.2 + Math.random()*2.8, // faster rise
          vx: (Math.random()-0.5)*0.45,
          life: 140 + Math.random()*160 // shorter life for more flicker
        });
      } else if (accent === 'cold') {
        const count = Math.min(110, Math.floor(w * 0.08));
        for (let i=0;i<count;i++) particlesRef.current.push({
          x: Math.random()*w,
          y: Math.random()*h,
          r: 1 + Math.random()*3,
          vy: 0.6 + Math.random()*0.9, // faster fall
          vx: (Math.random()-0.5)*0.45
        });
      } else if (accent === 'warm') {
        // heat waves quicker & more amplitude
        const lines = 7;
        for (let i=0;i<lines;i++) particlesRef.current.push({ phase: Math.random()*Math.PI*2, speed: 0.004 + Math.random()*0.004, amp: 14+Math.random()*18, y: h*0.38 + i* (h*0.018) });
      } else if (accent === 'normal') {
        // gentle floating translucent orbs (now a bit more lively)
        const orbCount = 38;
        for (let i=0;i<orbCount;i++) {
          const baseX = Math.random()*w;
          const baseY = Math.random()*h;
          particlesRef.current.push({
            type: 'orb',
            baseX,
            baseY,
            r: 6 + Math.random()*14,
            driftPhase: Math.random()*Math.PI*2,
            driftSpeed: 0.0015 + Math.random()*0.002, // faster drift
            ampX: 30 + Math.random()*34,
            ampY: 22 + Math.random()*30,
            hueShift: Math.random()*20
          });
        }
        // wind streaks: horizontal flowing lines implying breeze
        const windCount = 55;
        for (let i=0;i<windCount;i++) {
          particlesRef.current.push({
            type: 'wind',
            x: Math.random()*w,
            y: Math.random()*h,
            len: 40 + Math.random()*140,
            th: 0.6 + Math.random()*1.2,
            speed: 0.8 + Math.random()*1.8,
            opacity: 0.05 + Math.random()*0.12,
            wobble: Math.random()*Math.PI*2,
            wobbleSpeed: 0.01 + Math.random()*0.02,
            wobbleAmp: 4 + Math.random()*10
          });
        }
      } else {
        // normal: no particles for calm
      }
    }

  function drawHot(w:number,h:number){ if (!ctx) return;
      ctx.globalCompositeOperation = 'lighter';
      for (const p of particlesRef.current) {
  p.y -= p.vy; p.x += p.vx; p.life -= 1.4; // faster life decay
  const alpha = Math.max(0, Math.min(1, p.life/200));
  const grd = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
        grd.addColorStop(0, `rgba(255,255,255,${0.6*alpha})`);
        grd.addColorStop(0.4, `rgba(255,180,0,${0.45*alpha})`);
        grd.addColorStop(1, `rgba(255,0,0,0)`);
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
        if (p.y < h*0.32 || p.life <=0) { // recycle sooner
          p.y = h + Math.random()*80; p.x = Math.random()*w; p.life = 140 + Math.random()*160; p.r = 4+Math.random()*10; }
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    function drawCold(w:number,h:number){ if (!ctx) return;
      ctx.fillStyle = theme==='night'? 'rgba(255,255,255,0.8)' : 'rgba(0,64,128,0.9)';
      for (const f of particlesRef.current) {
        f.y += f.vy; f.x += f.vx; if (f.y>h) { f.y = -5; f.x = Math.random()*w; }
        ctx.beginPath(); ctx.arc(f.x,f.y,f.r,0,Math.PI*2); ctx.fill();
      }
    }

  function drawWarm(w:number,h:number){ if (!ctx) return;
      ctx.strokeStyle = theme==='night'? 'rgba(255,200,80,0.25)' : 'rgba(255,140,0,0.3)';
      ctx.lineWidth = 2;
      for (const l of particlesRef.current) {
        l.phase += l.speed;
        ctx.beginPath();
        const segments = 24; const baseY = l.y + Math.sin(l.phase)*4;
        for (let i=0;i<=segments;i++) {
          const x = (i/segments)*w;
          const y = baseY + Math.sin(l.phase + i*0.6)*l.amp;
          if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.stroke();
      }
    }

    function drawNormal(w:number,h:number){ if (!ctx) return;
      for (const p of particlesRef.current) {
        if (p.type === 'orb') {
          p.driftPhase += p.driftSpeed;
          const x = p.baseX + Math.cos(p.driftPhase)*p.ampX;
          const y = p.baseY + Math.sin(p.driftPhase*0.8)*p.ampY;
          const r = p.r * (0.85 + 0.15*Math.sin(p.driftPhase*1.5));
          const alpha = theme==='night'? 0.10 : 0.14;
            const edge = theme==='night'? 0.0 : 0.02;
          const grd = ctx.createRadialGradient(x,y,0,x,y,r);
          grd.addColorStop(0, `rgba(16,185,129,${alpha*1.25})`);
          grd.addColorStop(0.55, `rgba(16,185,129,${alpha*0.38})`);
          grd.addColorStop(1, `rgba(16,185,129,${edge})`);
          ctx.fillStyle = grd;
          ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
        } else if (p.type === 'wind') {
          p.x += p.speed;
          p.wobble += p.wobbleSpeed;
          const y = p.y + Math.sin(p.wobble)*p.wobbleAmp;
          if (p.x - p.len > w) { p.x = -p.len; p.y = Math.random()*h; }
          const grad = ctx.createLinearGradient(p.x - p.len, y, p.x, y);
          const glow = '16,185,129'; // emerald-ish
          grad.addColorStop(0, `rgba(${glow},0)`);
          grad.addColorStop(0.25, `rgba(${glow},${p.opacity*0.6})`);
          grad.addColorStop(0.6, `rgba(${glow},${p.opacity})`);
          grad.addColorStop(1, `rgba(${glow},0)`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = p.th;
          ctx.beginPath();
          ctx.moveTo(p.x - p.len, y);
          ctx.lineTo(p.x, y);
          ctx.stroke();
        }
      }
    }

  function loop(){ if (!canvas || !ctx) return; const w = canvas.width, h = canvas.height; ctx.clearRect(0,0,w,h);
  if (accent==='hot') drawHot(w,h); else if (accent==='cold') drawCold(w,h); else if (accent==='warm') drawWarm(w,h); else if (accent==='normal') drawNormal(w,h);
      rafRef.current = requestAnimationFrame(loop);
    }

    if (lastAccentRef.current !== accent) { init(); lastAccentRef.current = accent; }
    resize();
    window.addEventListener('resize', resize);
    loop();
    return () => { window.removeEventListener('resize', resize); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [accent, theme, active]);

  return <canvas ref={canvasRef} className={`pointer-events-none fixed inset-0 z-[4] transition-opacity duration-700 ${active ? 'opacity-60' : 'opacity-0'}`} aria-hidden="true" />;
};

export default TemperatureEffect;
