"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";

const CARD_W = 260;
const CARD_H = 380;
const GAP = 80;
const STEP = CARD_W + GAP;
const ACTIVE_SCALE = 1.1;              // 10% enlargement for active card
const SCALE_DROP_PER_STEP = 0.07;
const OPACITY_DROP_PER_STEP = 0.28;
// Paper-light physics - highly responsive to input
const TILT_VELOCITY_MULTIPLIER = 0.35;  // More tilt sensitivity
const TILT_LERP = 0.25;                  // Faster tilt response
const TILT_DECAY = 0.88;                 // Slower tilt decay for floaty feel
const SCROLL_LERP = 0.18;                // Much faster scroll response
const SNAP_DURATION = 0.55;              // Quicker snap
const SNAP_EASE = "power2.out";          // Lighter ease curve
const FLING_MULTIPLIER = 32;             // Much higher fling momentum
const DRAG_MULTIPLIER = 1.4;             // Amplify drag movement
const LIFT_MULTIPLIER = 8;               // Vertical lift based on tilt
const PERSPECTIVE_TILT = 0.6;            // 3D perspective tilt multiplier

interface Card {
  id: number;
  image: string;
}

interface PsychicCarouselProps {
  cards: Card[];
  initialIndex?: number;
}

export function PsychicCarousel({ cards, initialIndex }: PsychicCarouselProps) {
  // Default to middle card if no initialIndex provided
  const startIndex = initialIndex ?? Math.floor(cards.length / 2);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const initialScroll = startIndex * STEP;
  const scrollX = useRef(initialScroll);
  const targetScrollX = useRef(initialScroll);
  const groupTilt = useRef(0);
  const targetTilt = useRef(0);
  const velX = useRef(0);
  const lastX = useRef(0);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScrollX = useRef(0);
  const currentIndex = useRef(startIndex);
  const isAnimating = useRef(false);
  
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Starfield animation
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
    
    const stars: { x: number; y: number; r: number; vx: number; vy: number; opacity: number }[] = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 0.3 + Math.random() * 1.2,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        opacity: 0.08 + Math.random() * 0.32,
      });
    }
    
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (const star of stars) {
        star.x += star.vx;
        star.y += star.vy;
        
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
      }
      
      animationId = requestAnimationFrame(animate);
    };
    animate();
    
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Main carousel logic
  useEffect(() => {
    const updateCards = () => {
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        
        const offsetPx = i * STEP - scrollX.current;
        const offsetSteps = offsetPx / STEP;
        const absOffset = Math.abs(offsetSteps);
        
        // Active card gets 10% enlargement, others scale down from base
        const baseScale = absOffset < 0.5 
          ? ACTIVE_SCALE - absOffset * (ACTIVE_SCALE - 1) * 2  // Smooth transition to active
          : 1.0 - (absOffset - 0.5) * SCALE_DROP_PER_STEP * 2;
        
        // Calculate vertical lift based on tilt - both sides move
        // Cards on the "downward" side of tilt lift up, creating paper-floating effect
        const tiltDirection = groupTilt.current > 0 ? 1 : -1;
        const cardSide = offsetSteps > 0 ? 1 : -1;
        const liftAmount = Math.abs(groupTilt.current) * LIFT_MULTIPLIER * (tiltDirection === cardSide ? 1 : -1) * (1 - absOffset * 0.3);
        
        // Add subtle 3D rotateX based on position for depth
        const perspectiveRotateX = groupTilt.current * PERSPECTIVE_TILT * (offsetSteps * 0.15);
        
        gsap.set(el, {
          x: offsetPx,
          y: liftAmount,
          scale: Math.max(0.5, baseScale),
          opacity: Math.max(0, 1.0 - absOffset * OPACITY_DROP_PER_STEP),
          rotateZ: groupTilt.current,
          rotateX: perspectiveRotateX,
          zIndex: Math.round(100 - absOffset * 10),
        });
      });
      
      // Update active index
      const newIndex = Math.round(scrollX.current / STEP);
      if (newIndex !== currentIndex.current && newIndex >= 0 && newIndex < cards.length) {
        currentIndex.current = newIndex;
        setActiveIndex(newIndex);
      }
    };

    const tick = () => {
      if (!isDragging.current && !isAnimating.current) {
        scrollX.current += (targetScrollX.current - scrollX.current) * SCROLL_LERP;
      }
      
      if (isDragging.current) {
        targetTilt.current = -velX.current * TILT_VELOCITY_MULTIPLIER;
      } else {
        targetTilt.current *= TILT_DECAY;
      }
      
      // Clamp tilt to max 4 degrees
      targetTilt.current = Math.max(-4, Math.min(4, targetTilt.current));
      groupTilt.current += (targetTilt.current - groupTilt.current) * TILT_LERP;
      
      updateCards();
    };

    gsap.ticker.add(tick);
    
    // Initial render
    requestAnimationFrame(() => {
      updateCards();
      setVisible(true);
    });

    return () => {
      gsap.ticker.remove(tick);
    };
  }, [cards.length]);

  const snapToIndex = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(cards.length - 1, index));
    isAnimating.current = true;
    
    gsap.to(scrollX, {
      current: clampedIndex * STEP,
      duration: SNAP_DURATION,
      ease: SNAP_EASE,
      onComplete: () => {
        isAnimating.current = false;
        targetScrollX.current = clampedIndex * STEP;
      },
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartScrollX.current = scrollX.current;
    lastX.current = e.clientX;
    velX.current = 0;
    
    gsap.killTweensOf(scrollX);
    isAnimating.current = false;
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    
    const currentX = e.clientX;
    velX.current = currentX - lastX.current;
    lastX.current = currentX;
    
    // Amplified drag for paper-light feel
    const dragDelta = (currentX - dragStartX.current) * DRAG_MULTIPLIER;
    scrollX.current = dragStartScrollX.current - dragDelta;
    
    // Clamp scroll to valid range with elastic overshoot
    const maxScroll = (cards.length - 1) * STEP;
    scrollX.current = Math.max(-STEP * 0.5, Math.min(maxScroll + STEP * 0.5, scrollX.current));
  };

  const handlePointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    // Fling calculation
    const flingTarget = scrollX.current - velX.current * FLING_MULTIPLIER;
    const nearestIndex = Math.round(flingTarget / STEP);
    
    snapToIndex(nearestIndex);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? 1 : -1;
    const newIndex = Math.round(scrollX.current / STEP) + direction;
    snapToIndex(newIndex);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        const newIndex = Math.round(scrollX.current / STEP) - 1;
        snapToIndex(newIndex);
      } else if (e.key === "ArrowRight") {
        const newIndex = Math.round(scrollX.current / STEP) + 1;
        snapToIndex(newIndex);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cards.length]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden select-none touch-none"
      style={{ backgroundColor: "#0c0c10" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* Starfield background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />
      
      {/* Cards container */}
      <div
        className="absolute top-1/2 left-1/2 -translate-y-1/2"
        style={{
          width: CARD_W,
          height: CARD_H,
          marginLeft: -CARD_W / 2,
          perspective: "1200px",
          perspectiveOrigin: "center center",
        }}
      >
        {cards.map((card, i) => (
          <div
            key={card.id}
            ref={(el) => { cardRefs.current[i] = el; }}
            className="absolute top-0 left-0 rounded-[20px] overflow-hidden cursor-pointer"
            style={{
              width: CARD_W,
              height: CARD_H,
              boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
              visibility: visible ? "visible" : "hidden",
              willChange: "transform, opacity",
            }}
            onPointerEnter={() => {
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
              }
              if (!isDragging.current && i !== currentIndex.current) {
                hoverTimeoutRef.current = setTimeout(() => {
                  if (!isDragging.current && i !== currentIndex.current) {
                    snapToIndex(i);
                  }
                }, 200);
              }
            }}
            onPointerLeave={() => {
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
              }
            }}
          >
            <img
              src={card.image}
              alt=""
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
            />
          </div>
        ))}
      </div>
      
      {/* Dot indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => snapToIndex(i)}
            className="h-[5px] rounded-full transition-all duration-300 ease-out"
            style={{
              width: i === activeIndex ? 18 : 5,
              backgroundColor: i === activeIndex ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
            }}
            aria-label={`Go to card ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
