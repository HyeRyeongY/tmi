// app/carousel/page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

const images = Array.from({ length: 10 }).map((_, i) => ({
  title: `Image ${i + 1}`,
  image: `https://picsum.photos/500/700?random=${i + 1}`,
}));

export default function CarouselPage() {
  const [active, setActive] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const cursorsRef = useRef<NodeListOf<HTMLElement> | null>(null);
  const itemCount = images.length;

  const getZIndex = (i: number) => (i === active ? itemCount : itemCount - Math.abs(active - i));

  const getWaveY = (index: number) => {
    const relative = (index - active) / itemCount;
    return Math.sin(relative * Math.PI * 2) * 40;
  };

  const getWaveRotation = (index: number) => {
    const offset = (index - active) / itemCount;
    const amplitude = 10;
    return Math.sin(offset * Math.PI * (1 / 0.3)) * amplitude;
  };

  const animateToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, itemCount - 1));
      setActive(clamped);
    },
    [itemCount]
  );

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const direction = e.deltaY > 0 ? 1 : -1;
      requestAnimationFrame(() => animateToIndex(active + direction));
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const x = "touches" in e ? e.touches[0]?.clientX || 0 : (e as MouseEvent).clientX;
      const y = "touches" in e ? e.touches[0]?.clientY || 0 : (e as MouseEvent).clientY;

      cursorsRef.current?.forEach((cursor) => {
        cursor.style.transform = `translate(${x}px, ${y}px)`;
      });

      if (!isDragging) return;

      const delta = x - startX.current;
      if (Math.abs(delta) > 30) {
        const direction = delta > 0 ? -1 : 1;
        requestAnimationFrame(() => animateToIndex(active + direction));
        setIsDragging(false); // 한 번만 이동
      }
    };

    const handleDown = (e: MouseEvent | TouchEvent) => {
      if ("button" in e && e.button !== 0) return;
      setIsDragging(true);
      startX.current = "touches" in e ? e.touches[0]?.clientX || 0 : (e as MouseEvent).clientX;
    };

    const handleUp = () => setIsDragging(false);

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchstart", handleDown);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleUp);

    cursorsRef.current = document.querySelectorAll(".cursor");

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchstart", handleDown);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [active, isDragging, animateToIndex]);

  const handleItemClick = (i: number) => {
    animateToIndex(i);
  };

  return (
    <div className="timeline">
      {images.map((img, i) => (
        <div
          key={i}
          className="carousel-item"
          style={
            {
              zIndex: getZIndex(i),
              "--zIndex": getZIndex(i),
              "--active": (i - active) / itemCount,
              "--y": `${getWaveY(i)}%`,
              "--rot": `${getWaveRotation(i)}deg`,
            } as React.CSSProperties
          }
          onClick={() => handleItemClick(i)}
        >
          <div className="carousel-box">
            <div className="title">{img.title}</div>
            <div className="num">{String(i + 1).padStart(2, "0")}</div>
            <Image src={img.image} alt={img.title} fill style={{ objectFit: "cover" }} priority />
          </div>
        </div>
      ))}
      <div className="cursor"></div>
      <div className="cursor cursor2"></div>
    </div>
  );
}
