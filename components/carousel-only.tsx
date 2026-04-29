"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";

const CARD_W = 260;
const CARD_H = 380;
const GAP = 80;
const STEP = CARD_W + GAP;
const ACTIVE_SCALE = 1.2;
const SCALE_DROP_PER_STEP = 0.07;
const OPACITY_DROP_PER_STEP = 0.18;
const TILT_VELOCITY_MULTIPLIER = 0.35;
const TILT_LERP = 0.25;
const TILT_DECAY = 0.88;
const SCROLL_LERP = 0.18;
const SNAP_DURATION = 0.55;
const SNAP_EASE = "power2.out";
const FLING_MULTIPLIER = 32;
const DRAG_MULTIPLIER = 1.4;
const LIFT_MULTIPLIER = 8;
const PERSPECTIVE_TILT = 0.6;

interface Card {
  id: number;
  image: string;
}

interface CarouselOnlyProps {
  cards: Card[];
  initialIndex?: number;
}

export function CarouselOnly({ cards, initialIndex }: CarouselOnlyProps) {
  const startIndex = initialIndex ?? Math.floor(cards.length / 2);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

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
  const dragDistanceRef = useRef(0);


  useEffect(() => {
    const updateCards = () => {
      cardRefs.current.forEach((el, i) => {
        if (!el) return;

        const offsetPx = i * STEP - scrollX.current;
        const offsetSteps = offsetPx / STEP;
        const absOffset = Math.abs(offsetSteps);

        const baseScale =
          absOffset < 0.5
            ? ACTIVE_SCALE - absOffset * (ACTIVE_SCALE - 1) * 2
            : 1.0 - (absOffset - 0.5) * SCALE_DROP_PER_STEP * 2;

        const tiltDirection = groupTilt.current > 0 ? 1 : -1;
        const cardSide = offsetSteps > 0 ? 1 : -1;
        const liftAmount =
          Math.abs(groupTilt.current) *
          LIFT_MULTIPLIER *
          (tiltDirection === cardSide ? 1 : -1) *
          (1 - absOffset * 0.3);

        const perspectiveRotateX =
          groupTilt.current * PERSPECTIVE_TILT * (offsetSteps * 0.15);

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

      const newIndex = Math.round(scrollX.current / STEP);
      if (
        newIndex !== currentIndex.current &&
        newIndex >= 0 &&
        newIndex < cards.length
      ) {
        currentIndex.current = newIndex;
        setActiveIndex(newIndex);
      }
    };

    const tick = () => {
      if (!isDragging.current && !isAnimating.current) {
        scrollX.current +=
          (targetScrollX.current - scrollX.current) * SCROLL_LERP;
      }

      if (isDragging.current) {
        targetTilt.current = -velX.current * TILT_VELOCITY_MULTIPLIER;
      } else {
        targetTilt.current *= TILT_DECAY;
      }

      targetTilt.current = Math.max(-4, Math.min(4, targetTilt.current));
      groupTilt.current +=
        (targetTilt.current - groupTilt.current) * TILT_LERP;

      updateCards();
    };

    gsap.ticker.add(tick);

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

  // Reset to middle card whenever section scrolls into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Start hidden — slides down into place on scroll
    gsap.set(el, { y: -160, opacity: 0, scale: 0.92 });

    let hasAnimated = false;

    const onScroll = () => {
      if (hasAnimated) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.75) {
        hasAnimated = true;
        snapToIndex(startIndex);
        gsap.to(el, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: "power4.out",
        });
        window.removeEventListener("scroll", onScroll);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartScrollX.current = scrollX.current;
    lastX.current = e.clientX;
    velX.current = 0;
    dragDistanceRef.current = 0;

    gsap.killTweensOf(scrollX);
    isAnimating.current = false;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;

    const currentX = e.clientX;
    velX.current = currentX - lastX.current;
    dragDistanceRef.current += Math.abs(velX.current);
    lastX.current = currentX;

    const dragDelta = (currentX - dragStartX.current) * DRAG_MULTIPLIER;
    scrollX.current = dragStartScrollX.current - dragDelta;

    const maxScroll = (cards.length - 1) * STEP;
    scrollX.current = Math.max(
      -STEP * 0.5,
      Math.min(maxScroll + STEP * 0.5, scrollX.current)
    );
  };

  const handlePointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const flingTarget = scrollX.current - velX.current * FLING_MULTIPLIER;
    const nearestIndex = Math.round(flingTarget / STEP);

    snapToIndex(nearestIndex);
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        snapToIndex(Math.round(scrollX.current / STEP) - 1);
      } else if (e.key === "ArrowRight") {
        snapToIndex(Math.round(scrollX.current / STEP) + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cards.length]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
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
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            onClick={() => { if (dragDistanceRef.current < 8) snapToIndex(i); }}
            className="absolute top-0 left-0 rounded-[20px] overflow-hidden cursor-pointer"
            style={{
              width: CARD_W,
              height: CARD_H,
              boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
              visibility: visible ? "visible" : "hidden",
              willChange: "transform, opacity",
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

      {/* Start chat CTA — below active card */}
      <div
        style={{
          position: "absolute",
          top: `calc(50% + ${CARD_H * ACTIVE_SCALE / 2 + 28}px)`,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
        }}
      >
        <button
          style={{
            backgroundColor: "#47429c",
            color: "#ffffff",
            padding: "12px 64px",
            borderRadius: "10px",
            fontSize: "20px",
            fontFamily: "var(--font-roboto), sans-serif",
            letterSpacing: "-0.8px",
            fontWeight: 400,
            border: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Start chat
        </button>
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
              backgroundColor:
                i === activeIndex
                  ? "rgba(255,255,255,0.9)"
                  : "rgba(255,255,255,0.4)",
            }}
            aria-label={`Go to card ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
