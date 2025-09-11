// /app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export default function Page() {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const [tooltipText, setTooltipText] = useState("");
    const [scale, setScale] = useState(1);
    const [isGridMode, setIsGridMode] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        let GSAP: typeof import("gsap") | undefined;
        let Draggable: typeof import("gsap/Draggable") | undefined;
        let Flip: typeof import("gsap/Flip") | undefined;
        const instances: unknown[] = [];
        const removeListeners: Array<() => void> = [];
        let draggableEls: HTMLElement[] = [];

        // 스크롤 잠금
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const isDraggingRef = { current: false };
        const hideTimerRef = { current: 0 as number | NodeJS.Timeout };
        const TOOLTIP_OFFSET_X = 15;
        const TOOLTIP_FADE = 0.15;
        const HIDE_DELAY = 180; // ms
        const MIN_SCALE = 0.0001;
        const MAX_SCALE = 10;
        const ZOOM_SPEED = 0.08;
        const GRID_GAP = 20;

        const clearHideTimer = () => {
            if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current);
                hideTimerRef.current = 0;
            }
        };

        const handleZoom = (delta: number, centerX: number, centerY: number) => {
            const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
            if (newScale !== scale) {
                setScale(newScale);
                const root = containerRef.current;
                if (root && GSAP) {
                    // 현재 transform 값들 가져오기
                    const currentScale = GSAP.getProperty(root, "scaleX") as number;
                    const currentX = GSAP.getProperty(root, "x") as number;
                    const currentY = GSAP.getProperty(root, "y") as number;

                    // 컨테이너 기준 마우스 위치
                    const rect = root.getBoundingClientRect();
                    const mouseX = centerX - rect.left;
                    const mouseY = centerY - rect.top;

                    // 줌 중심점을 마우스 위치로 설정하기 위한 계산
                    const scaleFactor = newScale / currentScale;

                    // 마우스 위치를 기준으로 새로운 x, y 위치 계산
                    const newX = mouseX - (mouseX - currentX) * scaleFactor;
                    const newY = mouseY - (mouseY - currentY) * scaleFactor;

                    GSAP.to(root, {
                        scaleX: newScale,
                        scaleY: newScale,
                        x: newX,
                        y: newY,
                        duration: 0.4,
                        ease: "power2.out",
                    });
                }
            }
        };

        const arrangeInGrid = (elements: HTMLElement[]) => {
            const root = containerRef.current;
            if (!root || !Flip) return;

            // Flip의 첫 번째 단계: 현재 상태 기록
            const state = Flip.getState(elements);

            const bounds = root.getBoundingClientRect();
            const itemWidth = 180;
            const itemHeight = 120;
            const minGap = 20; // 최소 간격

            // 아이템 개수에 따라 최적의 그리드 크기 계산
            const itemCount = elements.length;
            let cols = Math.ceil(Math.sqrt(itemCount));
            let rows = Math.ceil(itemCount / cols);

            // 컨테이너 비율을 고려해서 그리드 형태 최적화
            const containerRatio = bounds.width / bounds.height;

            // 여러 그리드 옵션을 시도해서 가장 적합한 것 선택
            let bestCols = cols;
            let bestRows = rows;
            let bestRatio = Math.abs((cols * itemWidth) / (rows * itemHeight) - containerRatio);

            for (let testCols = 1; testCols <= itemCount; testCols++) {
                const testRows = Math.ceil(itemCount / testCols);
                const testRatio = Math.abs((testCols * itemWidth) / (testRows * itemHeight) - containerRatio);
                if (testRatio < bestRatio) {
                    bestCols = testCols;
                    bestRows = testRows;
                    bestRatio = testRatio;
                }
            }

            cols = bestCols;
            rows = bestRows;

            // 그리드 전체 크기 계산 (겹치지 않도록 충분한 간격 확보)
            const totalGridWidth = cols * itemWidth + (cols - 1) * minGap;
            const totalGridHeight = rows * itemHeight + (rows - 1) * minGap;

            // 중앙 정렬을 위한 시작 위치 계산
            const startX = (bounds.width - totalGridWidth) / 2;
            const startY = (bounds.height - totalGridHeight) / 2;

            // DOM 변경: 새로운 위치 설정 (겹치지 않도록)
            elements.forEach((el, index) => {
                const col = index % cols;
                const row = Math.floor(index / cols);
                const x = startX + col * (itemWidth + minGap);
                const y = startY + row * (itemHeight + minGap);

                el.style.transform = `translate(${x}px, ${y}px)`;
            });

            // Flip의 두 번째 단계: 애니메이션 실행
            Flip.from(state, {
                duration: 0.6,
                ease: "power2.out",
                stagger: 0.02,
            });
        };

        const arrangeRandomly = (elements: HTMLElement[]) => {
            const root = containerRef.current;
            if (!root || !Flip) return;

            // Flip의 첫 번째 단계: 현재 상태 기록
            const state = Flip.getState(elements);

            const bounds = root.getBoundingClientRect();

            // DOM 변경: 새로운 랜덤 위치 설정
            elements.forEach((el) => {
                const w = el.offsetWidth || 180;
                const h = el.offsetHeight || 120;
                const x = Math.max(0, Math.min(bounds.width - w, Math.random() * (bounds.width - w)));
                const y = Math.max(0, Math.min(bounds.height - h, Math.random() * (bounds.height - h)));

                el.style.transform = `translate(${x}px, ${y}px)`;
            });

            // Flip의 두 번째 단계: 애니메이션 실행
            Flip.from(state, {
                duration: 0.6,
                ease: "power2.out",
                stagger: 0.03,
            });
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
            const gsapModule = await import("gsap");
            const draggableModule = await import("gsap/Draggable");
            const flipModule = await import("gsap/Flip");

            GSAP = gsapModule.gsap || gsapModule.default;
            Draggable = draggableModule.Draggable || draggableModule.default;
            Flip = flipModule.Flip || flipModule.default;

            GSAP?.registerPlugin(Draggable!, Flip!);

            const root = containerRef.current!;
            if (tooltipRef.current) {
                tooltipRef.current.style.visibility = "hidden";
                tooltipRef.current.style.opacity = "0";
            }

            draggableEls = Array.from(root.querySelectorAll<HTMLElement>(".draggable-path"));

            // 초기 배치 설정
            draggableEls.forEach((el) => {
                el.style.position = "absolute";
            });

            if (isInitialLoad) {
                // 처음 로드 시에만 가운데에서 시작
                const bounds = root.getBoundingClientRect();
                const centerX = bounds.width / 2;
                const centerY = bounds.height / 2;

                draggableEls.forEach((el) => {
                    // 모든 요소를 가운데에 초기 배치
                    el.style.transform = `translate(${centerX - 90}px, ${centerY - 60}px)`;
                });

                // 잠시 대기 후 목표 위치로 배치 (Flip 애니메이션을 위해)
                setTimeout(() => {
                    if (isGridMode) {
                        arrangeInGrid(draggableEls);
                    } else {
                        arrangeRandomly(draggableEls);
                    }
                    setIsInitialLoad(false); // 초기 로드 완료
                }, 100);
            } else {
                // 이후 레이아웃 변경 시에는 바로 배치
                if (isGridMode) {
                    arrangeInGrid(draggableEls);
                } else {
                    arrangeRandomly(draggableEls);
                }
            }

            // Draggable
            draggableEls.forEach((el) => {
                const [inst] = Draggable!.create(el, {
                    type: "x,y",
                    bounds: root,
                    inertia: true,
                    onDragStart: function () {
                        if (isGridMode) return false; // 그리드 모드에서는 드래그 비활성화
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
                        if (isGridMode) return false;
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

            // 휠 줌 이벤트
            const handleWheel = (e: WheelEvent) => {
                e.preventDefault();
                const rect = root.getBoundingClientRect();
                const centerX = e.clientX - rect.left;
                const centerY = e.clientY - rect.top;
                const delta = e.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED;
                handleZoom(delta, centerX, centerY);
            };

            // 휠 클릭 드래그로 화면 이동
            let isPanning = false;
            let lastPanX = 0;
            let lastPanY = 0;

            const handleMouseDown = (e: MouseEvent) => {
                if (e.button === 1) {
                    // 휠 클릭 (중간 버튼)
                    e.preventDefault();
                    isPanning = true;
                    lastPanX = e.clientX;
                    lastPanY = e.clientY;
                    root.style.cursor = "grabbing";
                }
            };

            const handleMouseMove = (e: MouseEvent) => {
                if (isPanning) {
                    e.preventDefault();
                    const deltaX = (e.clientX - lastPanX) * 1.5; // 1.5배 더 빠르게
                    const deltaY = (e.clientY - lastPanY) * 1.5;

                    const currentX = GSAP.getProperty(root, "x") as number;
                    const currentY = GSAP.getProperty(root, "y") as number;

                    // 부드러운 팬 애니메이션
                    GSAP.to(root, {
                        x: currentX + deltaX,
                        y: currentY + deltaY,
                        duration: 0.05, // 더 빠른 반응
                        ease: "none",
                        overwrite: true,
                    });

                    lastPanX = e.clientX;
                    lastPanY = e.clientY;
                }
            };

            const handleMouseUp = (e: MouseEvent) => {
                if (e.button === 1 && isPanning) {
                    isPanning = false;
                    root.style.cursor = "";
                }
            };

            // 터치 줌 이벤트
            let initialDistance = 0;
            let initialScale = scale;

            const getDistance = (touches: TouchList) => {
                if (touches.length < 2) return 0;
                const touch1 = touches[0];
                const touch2 = touches[1];
                return Math.sqrt(Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2));
            };

            const handleTouchStart = (e: TouchEvent) => {
                if (e.touches.length === 2) {
                    initialDistance = getDistance(e.touches);
                    initialScale = scale;
                }
            };

            const handleTouchMove = (e: TouchEvent) => {
                if (e.touches.length === 2 && initialDistance > 0) {
                    e.preventDefault();
                    const currentDistance = getDistance(e.touches);
                    const scaleChange = (currentDistance - initialDistance) * 0.01;
                    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, initialScale + scaleChange));

                    const rect = root.getBoundingClientRect();
                    const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
                    const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

                    setScale(newScale);
                    if (GSAP) {
                        GSAP.set(root, {
                            scale: newScale,
                            transformOrigin: `${centerX}px ${centerY}px`,
                        });
                    }
                }
            };

            const handleTouchEnd = () => {
                initialDistance = 0;
            };

            root.addEventListener("wheel", handleWheel, { passive: false });
            root.addEventListener("mousedown", handleMouseDown, { passive: false });

            // 전역에서 마우스 이벤트 처리 (브라우저 밖으로 나가도 계속 추적)
            document.addEventListener("mousemove", handleMouseMove, { passive: false });
            document.addEventListener("mouseup", handleMouseUp, { passive: false });
            document.addEventListener("mouseleave", handleMouseUp, { passive: false }); // 브라우저 밖으로 나갈 때
            root.addEventListener("touchstart", handleTouchStart, { passive: true });
            root.addEventListener("touchmove", handleTouchMove, { passive: false });
            root.addEventListener("touchend", handleTouchEnd, { passive: true });

            removeListeners.push(() => {
                root.removeEventListener("wheel", handleWheel);
                root.removeEventListener("mousedown", handleMouseDown);
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
                document.removeEventListener("mouseleave", handleMouseUp);
                root.removeEventListener("touchstart", handleTouchStart);
                root.removeEventListener("touchmove", handleTouchMove);
                root.removeEventListener("touchend", handleTouchEnd);
            });

            // 그리드/자유 모드 토글 처리 (초기 배치에서 이미 처리됨)
            instances.forEach((inst) => {
                if (isGridMode) {
                    (inst as any).disable();
                } else {
                    (inst as any).enable();
                }
            });
        })();

        return () => {
            document.body.style.overflow = prevOverflow;
            clearHideTimer();
            removeListeners.forEach((fn) => fn());
            instances.forEach((i) => (i as { kill?: () => void })?.kill?.());
        };
    }, [isGridMode, isInitialLoad]);

    return (
        <>
            <div ref={containerRef} className="index-page">
                {[...Array(7)].map((_, i) => (
                    <div className="draggable-path folder" key={i} data-name={`Folder ${i + 1}`}>
                        <span>Folder {i + 1}</span>
                    </div>
                ))}

                <div ref={tooltipRef} id="tooltip" className="tooltip" aria-hidden>
                    {tooltipText}
                </div>
            </div>

            {/* 스위치 형태 토글 버튼 */}
            <div
                style={{
                    position: "fixed",
                    bottom: "4rem",
                    right: "4rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.5rem",
                    zIndex: 1000,
                }}
            >
                <div
                    onClick={() => setIsGridMode(!isGridMode)}
                    style={{
                        width: "72px",
                        height: "40px",
                        borderRadius: "40px",
                        backgroundColor: isGridMode ? "#333" : "#333",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        padding: "2px",
                        transition: "all 0.3s ease",
                        position: "relative",
                    }}
                    title={isGridMode ? "Switch to Free Layout" : "Switch to Grid Layout"}
                >
                    <span
                        style={{
                            fontSize: "10px",
                            color: "#10BFFF",
                            fontWeight: "500",
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            width: "50%",
                            textAlign: "center",
                            transform: isGridMode ? "translate(-100%, -50%)" : "translate(0%, -50%)",
                        }}
                    >
                        {isGridMode ? "Free" : "Grid"}
                    </span>
                    <div
                        style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            backgroundColor: "#131313",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transform: isGridMode ? "translateX(32px)" : "translateX(0px)",
                            transition: "transform 0.3s ease",
                        }}
                    >
                        {isGridMode ? (
                            <svg width="20px" height="20px" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M16.0494 3.55722C15.6746 3.55722 15.3187 3.63468 14.9981 3.77386L14.9978 3.63986L14.9978 3.63777L14.9978 3.64227L14.9978 3.63986C15.0029 2.29299 13.865 1.19824 12.4592 1.19824C11.0572 1.19824 9.92057 2.28747 9.92057 3.6311V4.8528C9.60179 4.71506 9.24809 4.63841 8.8757 4.63841C7.47021 4.63841 6.33083 5.73032 6.33083 7.07725V10.2203C5.24524 9.42531 3.57711 9.58947 2.7371 10.797C2.38687 11.3004 2.24224 11.9215 2.36135 12.5308C2.88852 15.2274 3.73203 17.5725 5.43234 19.2353C7.15836 20.9231 9.65429 21.8024 13.2347 21.8024C16.9493 21.8024 19.077 19.9707 20.2474 18.0572C21.3934 16.1837 21.6302 14.2324 21.6684 13.8397C21.6755 13.7664 21.677 13.7029 21.677 13.6464V8.79733H20.927C21.677 8.79733 21.677 8.79733 21.677 8.79733V8.79619L21.677 8.79485L21.677 8.79163L21.6769 8.783L21.6764 8.75729C21.6758 8.73654 21.6748 8.70857 21.6729 8.67442C21.6691 8.60631 21.6617 8.51241 21.6472 8.40103C21.6186 8.18199 21.5602 7.87715 21.4369 7.56206C21.3148 7.24995 21.1138 6.88909 20.7762 6.60148C20.4231 6.30068 19.9575 6.11277 19.3885 6.11277C19.0984 6.11277 18.8352 6.16162 18.6001 6.24937V6.00164C18.6001 4.65162 17.4581 3.55722 16.0494 3.55722ZM11.4206 3.6311C11.4206 3.08138 11.8856 2.63574 12.4592 2.63574C13.0347 2.63574 13.5005 3.08417 13.4978 3.63567L13.4978 3.64017L13.5017 5.88081C13.5 5.91561 13.499 5.9506 13.4987 5.98576L13.4987 5.9921L13.5103 10.7643C13.5112 11.1612 13.8476 11.4827 14.2617 11.4819C14.6759 11.4811 15.0109 11.1588 15.0103 10.7619L15.0018 5.92316C15.0437 5.40335 15.497 4.99472 16.0494 4.99472C16.6296 4.99472 17.1001 5.44553 17.1001 6.00164V11.2546C17.1001 11.6516 17.4358 11.9733 17.8501 11.9733C18.2643 11.9733 18.6001 11.6516 18.6001 11.2546V8.80002L18.6002 8.79322C18.6004 8.78518 18.6009 8.77091 18.602 8.75132C18.6042 8.71192 18.6088 8.65224 18.6183 8.57933C18.6378 8.42977 18.6756 8.24316 18.7446 8.0668C18.8148 7.88745 18.9023 7.75686 18.9974 7.67588C19.077 7.60809 19.1883 7.55027 19.3885 7.55027C19.5887 7.55027 19.7001 7.60809 19.7797 7.67588C19.8747 7.75686 19.9622 7.88745 20.0324 8.0668C20.1014 8.24316 20.1392 8.42977 20.1587 8.57933C20.1682 8.65224 20.1728 8.71192 20.1751 8.75132C20.1752 8.75376 20.1753 8.75613 20.1754 8.75841C20.1763 8.77438 20.1767 8.78619 20.1768 8.79322L20.177 8.7991L20.177 13.6464C20.177 13.6772 20.1762 13.6929 20.1748 13.7065C20.1442 14.0215 19.935 15.7255 18.9534 17.3303C17.9962 18.8951 16.3148 20.3649 13.2347 20.3649C9.91413 20.3649 7.86099 19.5564 6.50366 18.2291C5.12064 16.8767 4.34654 14.8792 3.8357 12.2661C3.7915 12.0399 3.84345 11.7981 3.98518 11.5944C4.40916 10.9849 5.36201 11.0417 5.70384 11.6969L6.41001 13.0504C6.56556 13.3485 6.91461 13.5051 7.25314 13.4285C7.59167 13.3519 7.83083 13.0623 7.83083 12.729V7.07725C7.83083 6.52423 8.29863 6.07591 8.8757 6.07591C9.45277 6.07591 9.92057 6.52423 9.92057 7.07725V11.2546C9.92057 11.6516 10.2564 11.9733 10.6706 11.9733C11.0848 11.9733 11.4206 11.6516 11.4206 11.2546V3.6311Z" fill="#10BFFF" />
                            </svg>
                        ) : (
                            <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="4" y="4" width="7" height="7" rx="2.5" stroke="#10BFFF" strokeWidth="1.5" />
                                <rect opacity="0.8" x="4" y="14" width="7" height="7" rx="2.5" stroke="#10BFFF" strokeWidth="1.5" />
                                <rect opacity="0.8" x="14" y="4" width="7" height="7" rx="2.5" stroke="#10BFFF" strokeWidth="1.5" />
                                <rect x="14" y="14" width="7" height="7" rx="2.5" stroke="#10BFFF" strokeWidth="1.5" />
                            </svg>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
