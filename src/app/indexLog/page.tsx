// /app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export default function Page() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [tooltipText, setTooltipText] = useState("");

  useEffect(() => {
    let GSAP: typeof import("gsap").gsap | undefined;
    let Draggable: typeof import("gsap/Draggable").Draggable | undefined;
    const instances: unknown[] = [];
    const removeListeners: Array<() => void> = [];

    // 스크롤 잠금
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const isDraggingRef = { current: false };
    const hideTimerRef = { current: 0 as number | NodeJS.Timeout };
    const TOOLTIP_OFFSET_X = 15;
    const TOOLTIP_FADE = 0.15;
    const HIDE_DELAY = 180; // ms

    const clearHideTimer = () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = 0;
      }
    };

    const showTooltipNow = (e: PointerEvent) => {
      if (!tooltipRef.current || !GSAP) return;
      tooltipRef.current.style.visibility = "visible";
      GSAP?.to(tooltipRef.current, { opacity: 1, duration: TOOLTIP_FADE });
      moveTooltip(e);
    };

    const scheduleHide = () => {
      clearHideTimer();
      hideTimerRef.current = setTimeout(() => {
        if (!tooltipRef.current || !GSAP) return;
        GSAP?.to(tooltipRef.current, {
          opacity: 0,
          duration: TOOLTIP_FADE,
          onComplete: () => {
            if (tooltipRef.current) tooltipRef.current.style.visibility = "hidden";
          },
        });
      }, HIDE_DELAY);
    };

    const moveTooltip = (e: PointerEvent) => {
      const el = tooltipRef.current;
      if (!el) return;
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      el.style.left = `${mouseX + TOOLTIP_OFFSET_X}px`;
      el.style.top = `${mouseY}px`;
      const rect = el.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        el.style.left = `${mouseX - rect.width - 10}px`;
      }
    };

    (async () => {
      const g = await import("gsap");
      const d = await import("gsap/Draggable");
      GSAP = (g as unknown as { gsap: typeof import("gsap").gsap }).gsap ?? (g as unknown as { default: typeof import("gsap").gsap }).default ?? (g as typeof import("gsap"));
      Draggable = (d as unknown as { Draggable: typeof import("gsap/Draggable").Draggable }).Draggable ?? (d as unknown as { default: typeof import("gsap/Draggable").Draggable }).default ?? (d as typeof import("gsap/Draggable"));
      GSAP?.registerPlugin(Draggable!);

      const root = containerRef.current!;
      if (tooltipRef.current) {
        tooltipRef.current.style.visibility = "hidden";
        tooltipRef.current.style.opacity = "0";
      }

      const draggableEls = Array.from(
        root.querySelectorAll<HTMLElement>(".draggable-path")
      );

      // 초기 랜덤 배치
      const bounds = root.getBoundingClientRect();
      draggableEls.forEach((el) => {
        el.style.position = "absolute";
        const w = el.offsetWidth || 180;
        const h = el.offsetHeight || 120;
        const left = Math.max(0, Math.min(bounds.width - w, Math.random() * (bounds.width - w)));
        const top = Math.max(0, Math.min(bounds.height - h, Math.random() * (bounds.height - h)));
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
      });

      // Draggable
      draggableEls.forEach((el) => {
        const [inst] = Draggable!.create(el, {
          type: "x,y",
          bounds: root,
          inertia: true,
          onDragStart: function () {
            isDraggingRef.current = true;
            GSAP?.to(this.target, { opacity: 0.85, duration: 0.2 });
            clearHideTimer();
            scheduleHide(); // 드래그 시작 시 tooltip 숨김
          },
          onDragEnd: function () {
            isDraggingRef.current = false;
            GSAP?.to(this.target, { opacity: 1, duration: 0.2 });
          },
          onPress: function () {
            const parent = (this.target as Element).parentNode;
            if (parent) parent.appendChild(this.target);
          },
        });
        instances.push(inst);

        // Tooltip 이벤트 (pointer 이벤트로 통일)
        const onEnter = (e: PointerEvent) => {
          if (isDraggingRef.current) return;
          clearHideTimer();
          setTooltipText(el.dataset.name || "");
          showTooltipNow(e);
        };
        const onLeave = () => {
          if (isDraggingRef.current) return;
          scheduleHide();
        };
        const onMove = (e: PointerEvent) => {
          if (isDraggingRef.current) return;
          clearHideTimer();
          moveTooltip(e);
        };

        el.addEventListener("pointerenter", onEnter, { passive: true });
        el.addEventListener("pointerleave", onLeave, { passive: true });
        el.addEventListener("pointermove", onMove, { passive: true });

        removeListeners.push(() => {
          el.removeEventListener("pointerenter", onEnter);
          el.removeEventListener("pointerleave", onLeave);
          el.removeEventListener("pointermove", onMove);
        });
      });

      // 디버그
      // console.log("Draggable initialized:", draggableEls.length);
    })();

    return () => {
      document.body.style.overflow = prevOverflow;
      clearHideTimer();
      removeListeners.forEach((fn) => fn());
      instances.forEach((i) => (i as { kill?: () => void })?.kill?.());
    };
  }, []);

  return (
    <div ref={containerRef} className="index-page">
      {[...Array(7)].map((_, i) => (
        <div
          className="draggable-path folder"
          key={i}
          data-name={`Folder ${i + 1}`}
        >
          <span>Folder {i + 1}</span>
        </div>
      ))}

      <div ref={tooltipRef} id="tooltip" className="tooltip" aria-hidden>
        {tooltipText}
      </div>
    </div>
  );
}
