"use client";

import { useRef, useEffect } from "react";

export function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // --- Cursor tracking (desktop only) ---
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, active: true };
    const smoothMouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    window.addEventListener("mousemove", onMouseMove);

    // --- Star types ---
    type Star = {
      x: number; y: number; r: number;
      vx: number; vy: number;
      opacity: number; baseOpacity: number;
      twinkleSpeed: number; twinklePhase: number;
    };

    type CursorStar = {
      x: number; y: number;
      homeOffsetX: number; homeOffsetY: number;
      vx: number; vy: number;
      r: number;
      opacity: number; baseOpacity: number;
      twinkleSpeed: number; twinklePhase: number;
    };

    const stars: Star[] = [];

    // Faint distant dust — 2500 stars (+20% size)
    for (let i = 0; i < 2500; i++) {
      const base = i < 700
        ? 0.35 + Math.random() * 0.30   // ~700 noticeably brighter dust
        : 0.18 + Math.random() * 0.22;  // rest stay faint
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 0.48 + Math.random() * 0.72,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        opacity: base, baseOpacity: base,
        twinkleSpeed: 0.001 + Math.random() * 0.004,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
    // Dense small background stars
    for (let i = 0; i < 320; i++) {
      const base = 0.15 + Math.random() * 0.55;
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 0.3 + Math.random() * 0.7,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        opacity: base, baseOpacity: base,
        twinkleSpeed: 0.003 + Math.random() * 0.008,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
    // Mid-size stars (reduced)
    for (let i = 0; i < 80; i++) {
      const base = 0.35 + Math.random() * 0.45;
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 0.5 + Math.random() * 0.7,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        opacity: base, baseOpacity: base,
        twinkleSpeed: 0.005 + Math.random() * 0.012,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
    // Bright accent stars with soft glow (reduced)
    for (let i = 0; i < 25; i++) {
      const base = 0.7 + Math.random() * 0.3;
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 0.9 + Math.random() * 0.8,
        vx: (Math.random() - 0.5) * 0.10,
        vy: (Math.random() - 0.5) * 0.10,
        opacity: base, baseOpacity: base,
        twinkleSpeed: 0.008 + Math.random() * 0.015,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
    // Hero stars — 38 large bright standout stars with strong glow
    for (let i = 0; i < 38; i++) {
      const base = 0.85 + Math.random() * 0.15;
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 1.1 + Math.random() * 0.7,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        opacity: base, baseOpacity: base,
        twinkleSpeed: 0.005 + Math.random() * 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    // Cursor cluster — 220 dust stars that follow the mouse with spring physics
    const cursorStars: CursorStar[] = [];
    for (let i = 0; i < 220; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 120;
      const base = 0.25 + Math.random() * 0.35;
      cursorStars.push({
        x: smoothMouse.x + Math.cos(angle) * dist,
        y: smoothMouse.y + Math.sin(angle) * dist,
        homeOffsetX: Math.cos(angle) * dist,
        homeOffsetY: Math.sin(angle) * dist,
        vx: 0, vy: 0,
        r: 0.2 + Math.random() * 0.5,
        opacity: base, baseOpacity: base,
        twinkleSpeed: 0.003 + Math.random() * 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    // Shooting stars
    type ShootingStar = {
      x: number; y: number;
      vx: number; vy: number;
      length: number;
      opacity: number;
      life: number; maxLife: number;
    };

    const shootingStars: ShootingStar[] = [];
    let shootingStarTimer = 0;

    const spawnShootingStar = () => {
      const angle = (Math.PI / 6) + Math.random() * (Math.PI / 5);
      const speed = 6 + Math.random() * 6;
      const fromRight = Math.random() > 0.5;
      // Spread across full canvas
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      shootingStars.push({
        x, y,
        vx: fromRight ? -Math.cos(angle) * speed : Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 88 + Math.random() * 110,
        opacity: 0,
        life: 0,
        maxLife: 60 + Math.random() * 40,
      });
    };

    let animationId: number;
    let nebulaPhase = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smooth cursor lerp
      smoothMouse.x += (mouse.x - smoothMouse.x) * 0.04;
      smoothMouse.y += (mouse.y - smoothMouse.y) * 0.04;

      // Galaxy nebula gradients
      nebulaPhase += 0.004;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const pulse = 1 + 0.04 * Math.sin(nebulaPhase);

      const outerGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, canvas.width * 0.72 * pulse);
      outerGrd.addColorStop(0,   "rgba(20, 45, 130, 0.10)");
      outerGrd.addColorStop(0.4, "rgba(15, 30, 90, 0.06)");
      outerGrd.addColorStop(1,   "rgba(0, 0, 0, 0)");
      ctx.fillStyle = outerGrd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const midGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, canvas.width * 0.38 * pulse);
      midGrd.addColorStop(0,   "rgba(60, 45, 160, 0.12)");
      midGrd.addColorStop(0.5, "rgba(30, 38, 120, 0.07)");
      midGrd.addColorStop(1,   "rgba(0, 0, 0, 0)");
      ctx.fillStyle = midGrd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const innerGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, canvas.width * 0.14 * pulse);
      innerGrd.addColorStop(0,   "rgba(130, 140, 230, 0.10)");
      innerGrd.addColorStop(0.6, "rgba(60, 80, 180, 0.05)");
      innerGrd.addColorStop(1,   "rgba(0, 0, 0, 0)");
      ctx.fillStyle = innerGrd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw background stars
      for (const star of stars) {
        star.x += star.vx;
        star.y += star.vy;
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        star.twinklePhase += star.twinkleSpeed;
        star.opacity = star.baseOpacity * (0.6 + 0.4 * Math.sin(star.twinklePhase));

        if (star.r > 1.2) {
          const glowRadius = star.r > 2.0 ? star.r * 5 : star.r * 3;
          const grd = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowRadius);
          grd.addColorStop(0, `rgba(255,255,255,${star.opacity})`);
          grd.addColorStop(0.4, `rgba(200,215,255,${star.opacity * 0.4})`);
          grd.addColorStop(1, "rgba(255,255,255,0)");
          ctx.beginPath();
          ctx.arc(star.x, star.y, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${star.opacity})`;
        ctx.fill();
      }

      // Draw cursor cluster
      for (const s of cursorStars) {
          const targetX = smoothMouse.x + s.homeOffsetX;
          const targetY = smoothMouse.y + s.homeOffsetY;

          // Spring toward home position
          s.vx += (targetX - s.x) * 0.022;
          s.vy += (targetY - s.y) * 0.022;
          // Damping
          s.vx *= 0.88;
          s.vy *= 0.88;

          s.x += s.vx;
          s.y += s.vy;

          s.twinklePhase += s.twinkleSpeed;
          s.opacity = s.baseOpacity * (0.5 + 0.5 * Math.sin(s.twinklePhase));

          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200,210,255,${s.opacity})`;
          ctx.fill();
        }

      // Spawn shooting stars every ~3–6 seconds
      shootingStarTimer++;
      if (shootingStarTimer > 40 + Math.random() * 40) {
        spawnShootingStar();
        spawnShootingStar();
        if (Math.random() > 0.5) spawnShootingStar();
        shootingStarTimer = 0;
      }

      // Draw & update shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life++;
        ss.x += ss.vx;
        ss.y += ss.vy;

        // Fade in then out
        const progress = ss.life / ss.maxLife;
        ss.opacity = progress < 0.2
          ? progress / 0.2
          : 1 - (progress - 0.2) / 0.8;
        ss.opacity *= 0.7;

        const tailX = ss.x - ss.vx * (ss.length / Math.hypot(ss.vx, ss.vy));
        const tailY = ss.y - ss.vy * (ss.length / Math.hypot(ss.vx, ss.vy));

        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, `rgba(255,255,255,0)`);
        grad.addColorStop(0.7, `rgba(220,230,255,${ss.opacity * 0.4})`);
        grad.addColorStop(1, `rgba(255,255,255,${ss.opacity})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Bright head dot
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${ss.opacity})`;
        ctx.fill();

        if (ss.life >= ss.maxLife) shootingStars.splice(i, 1);
      }

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <section
      style={{
        position: "relative",
        height: "130vh",
        overflow: "hidden",
        backgroundColor: "#0c0c10",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "28vh",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Bottom fade into carousel section */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "50%",
          background: "linear-gradient(to bottom, transparent 0%, #0a0a0e 50%, #000000 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "33px",
          padding: "0 24px",
          maxWidth: "720px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "7px",
            alignItems: "center",
            textAlign: "center",
            color: "#ffffff",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-roboto), sans-serif",
              fontSize: "18px",
              letterSpacing: "1.8px",
              textTransform: "uppercase",
              lineHeight: 1.5,
              margin: 0,
              fontWeight: 400,
            }}
          >
            Empathy Meets AI
          </p>

          <div
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "40px",
              lineHeight: 1.3,
              fontWeight: 400,
              color: "#ffffff",
            }}
          >
            <p style={{ margin: 0 }}>Connecting you to</p>
            <p style={{ margin: 0 }}>
              the spirit realm for love, finances + life's purpose
            </p>
          </div>
        </div>

        <button
          style={{
            backgroundColor: "#47429c",
            color: "#ffffff",
            padding: "16px 64px",
            borderRadius: "10px",
            fontSize: "18px",
            fontFamily: "var(--font-roboto), sans-serif",
            letterSpacing: "-0.72px",
            fontWeight: 400,
            border: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Meet our AI spiritual guides
        </button>
      </div>
    </section>
  );
}
