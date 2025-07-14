"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function FolderStage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const folders = containerRef.current?.querySelectorAll(".folder");
    if (!folders) return;

    folders.forEach((el, i) => {
      const randomX = (Math.random() - 0.5) * 500; // -250~+250px 좌우 랜덤
      const centerY = window.innerHeight * 0.5;
      const finalY = window.innerHeight * 0.9 + 300; // 아래쪽 쌓임 + 간격
      console.log("finalY", finalY);
      // 초기 위치 설정
      gsap.set(el, {
        x: randomX,
        y: "-100%",
      });

      // 애니메이션: 위 → 중앙 → 아래
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: `top+=${i * 120} top`, // 순차적으로 등장
          end: `+=100%`,
          scrub: true,
          markers: true,
        },
      });

      tl.to(el, {
        opacity: 1,
        y: centerY - 100,
        x: 0,
        ease: "power2.out",
      }).to(el, {
        y: finalY,
        duration: 1.2,
        ease: "power1.inOut",
      });
    });
  }, []);

  return (
    <div className="index-page" ref={containerRef}>
      {[...Array(7)].map((_, i) => (
        <div className="folder" key={i}>
          <strong>Folder {i + 1}</strong>
        </div>
      ))}
    </div>
  );
}
