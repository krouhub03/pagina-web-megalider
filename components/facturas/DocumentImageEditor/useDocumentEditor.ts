import { useState, useRef, useEffect, useCallback } from "react";
import { DocumentImageEditorProps } from "./types";

export function useDocumentEditor({
  images,
  currentIndex: externalIndex,
  onIndexChange,
  initialDrawings,
  onDrawingsChange,
  readOnly = false,
  defaultVersion = "censored",
}: DocumentImageEditorProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const activeIndex = externalIndex !== undefined ? externalIndex : internalIndex;
  const [imageVersion, setImageVersion] = useState<"censored" | "original">(defaultVersion);

  const handleSetIndex = (newIndex: number) => {
    if (onIndexChange) {
      onIndexChange(newIndex);
    } else {
      setInternalIndex(newIndex);
    }
  };

  // Herramientas de dibujo, línea y censura
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#ffc800");
  const [penWidth, setPenWidth] = useState(15);

  const [isLineMode, setIsLineMode] = useState(false);
  const [lineColor, setLineColor] = useState("#2563eb");
  const [lineWidth, setLineWidth] = useState(6);
  const [lineStartPoint, setLineStartPoint] = useState<{ x: number; y: number } | null>(null);
  const lineStartPointRef = useRef<{ x: number; y: number } | null>(null);

  const setLineStart = useCallback((pt: { x: number; y: number } | null) => {
    lineStartPointRef.current = pt;
    setLineStartPoint(pt);
  }, []);

  const [isCensoring, setIsCensoring] = useState(false);
  const [censorShape, setCensorShape] = useState<"rect" | "circle">("rect");
  const [censorColor, setCensorColor] = useState("#000000");

  const [sheetZoom, setSheetZoom] = useState(100);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const touchDistanceRef = useRef<number | null>(null);

  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const drawStartRef = useRef<{ screenX: number; screenY: number; imgX: number; imgY: number } | null>(null);
  const currentPosRef = useRef<{ x: number; y: number; screenX: number; screenY: number } | null>(null);

  const [drawings, setDrawingsState] = useState<Record<number, any[]>>(initialDrawings || {});
  const drawingsRef = useRef<Record<number, any[]>>(initialDrawings || {});
  const [historyUndo, setHistoryUndo] = useState<Record<number, any[]>>({});

  useEffect(() => {
    if (initialDrawings) {
      setDrawingsState(initialDrawings);
      drawingsRef.current = initialDrawings;
    }
  }, [initialDrawings]);

  const updateDrawings = useCallback(
    (updater: (prev: Record<number, any[]>) => Record<number, any[]>) => {
      setDrawingsState((prev) => {
        const next = updater(prev);
        drawingsRef.current = next;
        if (onDrawingsChange) onDrawingsChange(next);
        return next;
      });
    },
    [onDrawingsChange]
  );

  const hasCensoredVersion = (index: number): boolean => {
    if (!images || !images[index]) return false;
    const item = images[index];
    if (typeof item === "string") return false;
    return !!(
      item.datosBase64Censurada || 
      item.datos_base64_censurada || 
      item.censoredDataUrl || 
      item.censoredUrl
    );
  };

  const getCurrentImageSrc = useCallback(
    (index: number, version: "censored" | "original" = imageVersion): string => {
      if (!images || images.length === 0 || !images[index]) return "";
      const item = images[index];
      if (typeof item === "string") return item;

      if (version === "censored") {
        const censoredSrc = 
          item.datosBase64Censurada || 
          item.datos_base64_censurada || 
          item.censoredDataUrl || 
          item.censoredUrl;
        if (censoredSrc) return censoredSrc;
      }

      return item.datosBase64 || item.datos_base64 || item.url || "";
    },
    [images, imageVersion]
  );

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const redrawCanvas = useCallback(
    (customList?: any[], previewLine?: { start: { x: number; y: number }; end: { x: number; y: number }; color?: string; width?: number }) => {
      const drawToContext = (canvas: HTMLCanvasElement | null) => {
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const pageDrawings = customList !== undefined ? customList : (drawingsRef.current[activeIndex] || drawings[activeIndex] || []);
        pageDrawings.forEach((item) => {
          if (item.type === "censor") {
            const x1 = Math.min(item.start.x, item.end.x) * canvas.width;
            const y1 = Math.min(item.start.y, item.end.y) * canvas.height;
            const x2 = Math.max(item.start.x, item.end.x) * canvas.width;
            const y2 = Math.max(item.start.y, item.end.y) * canvas.height;
            const w = Math.max(2, x2 - x1);
            const h = Math.max(2, y2 - y1);

            ctx.fillStyle = item.color || "#000000";

            if (item.shape === "circle") {
              const rx = w / 2;
              const ry = h / 2;
              const cx = x1 + rx;
              const cy = y1 + ry;

              ctx.beginPath();
              ctx.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, 2 * Math.PI);
              ctx.fill();
            } else {
              ctx.fillRect(x1, y1, w, h);
            }
            return;
          }

          if (item.type === "line") {
            const startPt = item.start || (item.points && item.points[0]) || { x: 0, y: 0 };
            const endPt = item.end || (item.points && item.points[1]) || { x: 0, y: 0 };
            const x1 = startPt.x * canvas.width;
            const y1 = startPt.y * canvas.height;
            const x2 = endPt.x * canvas.width;
            const y2 = endPt.y * canvas.height;

            ctx.beginPath();
            const color = item.color ? hexToRgba(item.color, 0.85) : "rgba(37, 99, 235, 0.85)";
            const strokeRatio = canvas.width / 800;
            const width = Math.max(2, (item.width || 6) * strokeRatio);
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.lineCap = "round";
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            return;
          }

          ctx.beginPath();
          const color = item.color ? hexToRgba(item.color, 0.6) : "rgba(255, 200, 0, 0.6)";
          const strokeRatio = canvas.width / 800;
          const width = Math.max(2, (item.width || 15) * strokeRatio);
          const points = item.points || item;

          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          points.forEach((point: any, i: number) => {
            const px = point.x * canvas.width;
            const py = point.y * canvas.height;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();
        });

        // Previsualización de línea elástica punto a punto
        if (previewLine) {
          const x1 = previewLine.start.x * canvas.width;
          const y1 = previewLine.start.y * canvas.height;
          const x2 = previewLine.end.x * canvas.width;
          const y2 = previewLine.end.y * canvas.height;

          // Punto ancla inicial
          ctx.beginPath();
          ctx.arc(x1, y1, 4, 0, 2 * Math.PI);
          ctx.fillStyle = previewLine.color || "#2563eb";
          ctx.fill();

          // Línea preview punteada
          ctx.beginPath();
          const strokeRatio = canvas.width / 800;
          ctx.lineWidth = Math.max(2, (previewLine.width || 6) * strokeRatio);
          ctx.strokeStyle = previewLine.color || "#2563eb";
          ctx.setLineDash([6, 4]);
          ctx.lineCap = "round";
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      };

      drawToContext(canvasRef.current);
    },
    [activeIndex]
  );

  const syncCanvasDimensions = useCallback(() => {
    if (imageRef.current && canvasRef.current && wrapperRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const targetW = Math.round(rect.width);
      const targetH = Math.round(rect.height);

      if (targetW === 0 || targetH === 0) return;

      if (canvasRef.current.width !== targetW || canvasRef.current.height !== targetH) {
        canvasRef.current.width = targetW;
        canvasRef.current.height = targetH;
      }

      redrawCanvas();
    }
  }, [redrawCanvas]);

  useEffect(() => {
    syncCanvasDimensions();
    const timer = setTimeout(syncCanvasDimensions, 50);
    return () => clearTimeout(timer);
  }, [imageVersion, syncCanvasDimensions]);

  useEffect(() => {
    syncCanvasDimensions();
    const img = imageRef.current;
    if (!img) return;

    const resizeObserver = new ResizeObserver(() => {
      syncCanvasDimensions();
    });

    resizeObserver.observe(img);
    window.addEventListener("resize", syncCanvasDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", syncCanvasDimensions);
    };
  }, [activeIndex, images, syncCanvasDimensions]);

  useEffect(() => {
    syncCanvasDimensions();
    const raf = requestAnimationFrame(syncCanvasDimensions);
    const timer = setTimeout(syncCanvasDimensions, 20);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [sheetZoom, syncCanvasDimensions]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Si el usuario está trazando activamente o tiene anclado un punto de línea, ignorar zoom accidental de scroll
      if (isDrawingActive || lineStartPointRef.current) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      // Si el delta es negativo (scroll arriba), aumentar zoom; si es positivo (scroll abajo), reducir zoom
      const zoomStep = e.deltaY < 0 ? 10 : -10;
      setSheetZoom((prev) => Math.min(400, Math.max(30, prev + zoomStep)));
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [isDrawingActive]);

  const handleUndo = useCallback(() => {
    const currentList = drawingsRef.current[activeIndex] || [];
    if (currentList.length === 0) return;

    const lastStroke = currentList[currentList.length - 1];
    const newDrawingsList = currentList.slice(0, -1);

    const undoneList = historyUndo[activeIndex] || [];
    const newUndoneList = [...undoneList, lastStroke];

    drawingsRef.current[activeIndex] = newDrawingsList;
    updateDrawings((prev) => ({ ...prev, [activeIndex]: newDrawingsList }));
    setHistoryUndo((prev) => ({ ...prev, [activeIndex]: newUndoneList }));

    redrawCanvas(newDrawingsList);
  }, [activeIndex, historyUndo, redrawCanvas, updateDrawings]);

  const handleRedo = useCallback(() => {
    const undoneList = historyUndo[activeIndex] || [];
    if (undoneList.length === 0) return;

    const strokeToRestore = undoneList[undoneList.length - 1];
    const newUndoneList = undoneList.slice(0, -1);

    const currentList = drawingsRef.current[activeIndex] || [];
    const newDrawingsList = [...currentList, strokeToRestore];

    drawingsRef.current[activeIndex] = newDrawingsList;
    updateDrawings((prev) => ({ ...prev, [activeIndex]: newDrawingsList }));
    setHistoryUndo((prev) => ({ ...prev, [activeIndex]: newUndoneList }));

    redrawCanvas(newDrawingsList);
  }, [activeIndex, drawingsRef, historyUndo, redrawCanvas, updateDrawings]);

  useEffect(() => {
    if (readOnly) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      } else if (e.key === "Escape") {
        if (lineStartPointRef.current) {
          setLineStart(null);
          setIsDrawingActive(false);
          drawStartRef.current = null;
          redrawCanvas();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawings, historyUndo, activeIndex, readOnly, handleUndo, handleRedo, redrawCanvas, setLineStart]);

  const getNormalizedPos = (imgX: number, imgY: number) => {
    if (!imageRef.current) return { x: 0, y: 0 };
    const rect = imageRef.current.getBoundingClientRect();
    const clampedX = Math.max(0, Math.min(1, imgX / rect.width));
    const clampedY = Math.max(0, Math.min(1, imgY / rect.height));
    return { x: clampedX, y: clampedY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || (!isDrawing && !isCensoring && !isLineMode) || !imageRef.current || !canvasRef.current) return;
    if (e.preventDefault) e.preventDefault();

    syncCanvasDimensions();

    const rect = imageRef.current.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;

    const imgX = e.clientX - rect.left;
    const imgY = e.clientY - rect.top;
    const pos = getNormalizedPos(imgX, imgY);

    if (isLineMode) {
      const startPt = lineStartPointRef.current;
      if (!startPt) {
        // Primer clic: anclar Punto A
        setLineStart(pos);
        drawStartRef.current = { screenX: e.clientX, screenY: e.clientY, imgX, imgY };
        setIsDrawingActive(true);
        redrawCanvas(undefined, { start: pos, end: pos, color: lineColor, width: lineWidth });
      } else {
        // Segundo clic: anclar Punto B y consolidar la línea
        const lineItem = { type: "line", start: startPt, end: pos, color: lineColor, width: lineWidth };
        const currentDrawings = drawingsRef.current[activeIndex] || [];
        const nextList = [...currentDrawings, lineItem];
        drawingsRef.current[activeIndex] = nextList;
        updateDrawings((prev) => ({ ...prev, [activeIndex]: nextList }));
        setHistoryUndo((prev) => ({ ...prev, [activeIndex]: [] }));
        setLineStart(null);
        setIsDrawingActive(false);
        drawStartRef.current = null;
        redrawCanvas(nextList);
      }
      return;
    }

    setIsDrawingActive(true);
    drawStartRef.current = { screenX: e.clientX, screenY: e.clientY, imgX, imgY };

    const currentDrawings = drawingsRef.current[activeIndex] || [];

    if (isCensoring) {
      const censorItem = { type: "censor", shape: censorShape, color: censorColor, start: pos, end: pos };
      const nextList = [...currentDrawings, censorItem];
      drawingsRef.current[activeIndex] = nextList;
      updateDrawings((prev) => ({ ...prev, [activeIndex]: nextList }));
    } else {
      const strokeItem = { type: "stroke", color: penColor, width: penWidth, points: [pos] };
      const nextList = [...currentDrawings, strokeItem];
      drawingsRef.current[activeIndex] = nextList;
      updateDrawings((prev) => ({ ...prev, [activeIndex]: nextList }));
    }

    setHistoryUndo((prev) => ({ ...prev, [activeIndex]: [] }));
  };

  const handleMouseUp = (e?: React.MouseEvent<HTMLDivElement>) => {
    if (isLineMode && isDrawingActive && drawStartRef.current && lineStartPointRef.current && e && imageRef.current) {
      const dist = Math.hypot(e.clientX - drawStartRef.current.screenX, e.clientY - drawStartRef.current.screenY);
      if (dist > 15) {
        // El usuario hizo un gesto de arrastre de Punto A a B y soltó
        const rect = imageRef.current.getBoundingClientRect();
        const imgX = e.clientX - rect.left;
        const imgY = e.clientY - rect.top;
        const pos = getNormalizedPos(imgX, imgY);

        const lineItem = { type: "line", start: lineStartPointRef.current, end: pos, color: lineColor, width: lineWidth };
        const currentDrawings = drawingsRef.current[activeIndex] || [];
        const nextList = [...currentDrawings, lineItem];
        drawingsRef.current[activeIndex] = nextList;
        updateDrawings((prev) => ({ ...prev, [activeIndex]: nextList }));
        setHistoryUndo((prev) => ({ ...prev, [activeIndex]: [] }));
        setLineStart(null);
        setIsDrawingActive(false);
        drawStartRef.current = null;
        redrawCanvas(nextList);
        return;
      }
    }

    if (isLineMode) {
      // En modo línea se mantiene el Punto A activo para recibir el segundo clic
      return;
    }

    if (isDrawingActive) {
      const currentDrawings = drawingsRef.current[activeIndex] || [];
      updateDrawings((prev) => ({ ...prev, [activeIndex]: [...currentDrawings] }));
    }
    setIsDrawingActive(false);
    drawStartRef.current = null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !canvasRef.current) return;

    if (isDrawingActive || (isLineMode && lineStartPointRef.current)) {
      if (e.preventDefault) e.preventDefault();
    }

    const imgRect = imageRef.current.getBoundingClientRect();
    const currentImgX = e.clientX - imgRect.left;
    const currentImgY = e.clientY - imgRect.top;
    const pos = getNormalizedPos(currentImgX, currentImgY);

    if (isLineMode && lineStartPointRef.current) {
      redrawCanvas(undefined, { start: lineStartPointRef.current, end: pos, color: lineColor, width: lineWidth });
      return;
    }

    if ((!isDrawing && !isCensoring) || !isDrawingActive) return;

    const currentDrawings = drawingsRef.current[activeIndex] || [];
    if (currentDrawings.length > 0) {
      const lastItem = currentDrawings[currentDrawings.length - 1];
      if (lastItem.type === "censor") {
        lastItem.end = pos;
        redrawCanvas(currentDrawings);
      } else if (lastItem.points) {
        lastItem.points.push(pos);
        redrawCanvas(currentDrawings);
      } else if (Array.isArray(lastItem)) {
        lastItem.push(pos);
        redrawCanvas(currentDrawings);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    } else if (e.touches.length === 1 && (isDrawing || isCensoring || isLineMode)) {
      if (e.cancelable && e.preventDefault) e.preventDefault();
      const touch = e.touches[0];
      handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} } as any);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const diff = dist - touchDistanceRef.current;
      if (Math.abs(diff) > 4) {
        const deltaZoom = diff > 0 ? 3 : -3;
        setSheetZoom((prev) => Math.min(400, Math.max(30, prev + deltaZoom)));
        touchDistanceRef.current = dist;
      }
    } else if (e.touches.length === 1 && (isDrawing || isCensoring || isLineMode)) {
      if (e.cancelable && e.preventDefault) e.preventDefault();
      const touch = e.touches[0];
      handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY, currentTarget: e.currentTarget, preventDefault: () => {} } as any);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      touchDistanceRef.current = null;
    }
    if (isDrawingActive) {
      handleMouseUp();
    }
  };

  const generateCompositeDataUrl = useCallback(
    (targetIndex: number = activeIndex): string | null => {
      if (typeof window === "undefined") return null;

      const imgSrc = getCurrentImageSrc(targetIndex);
      if (!imgSrc) return null;

      let img = targetIndex === activeIndex ? imageRef.current : null;
      if (!img || !img.naturalWidth) {
        const offscreenImg = new Image();
        offscreenImg.src = imgSrc;
        img = offscreenImg;
      }

      const exportCanvas = document.createElement("canvas");
      const natW = img.naturalWidth || img.width || 1200;
      const natH = img.naturalHeight || img.height || 1600;
      exportCanvas.width = natW;
      exportCanvas.height = natH;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return null;

      ctx.drawImage(img, 0, 0, natW, natH);

      const pageDrawings = drawingsRef.current[targetIndex] || drawings[targetIndex] || [];
      pageDrawings.forEach((item) => {
        if (item.type === "censor") {
          const x1 = Math.min(item.start.x, item.end.x) * natW;
          const y1 = Math.min(item.start.y, item.end.y) * natH;
          const x2 = Math.max(item.start.x, item.end.x) * natW;
          const y2 = Math.max(item.start.y, item.end.y) * natH;
          const w = Math.max(2, x2 - x1);
          const h = Math.max(2, y2 - y1);

          ctx.fillStyle = item.color || "#000000";

          if (item.shape === "circle") {
            const rx = w / 2;
            const ry = h / 2;
            const cx = x1 + rx;
            const cy = y1 + ry;

            ctx.beginPath();
            ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, 2 * Math.PI);
            ctx.fill();
          } else {
            ctx.fillRect(x1, y1, w, h);
          }
          return;
        }

        if (item.type === "line") {
          const startPt = item.start || (item.points && item.points[0]) || { x: 0, y: 0 };
          const endPt = item.end || (item.points && item.points[1]) || { x: 0, y: 0 };
          const x1 = startPt.x * natW;
          const y1 = startPt.y * natH;
          const x2 = endPt.x * natW;
          const y2 = endPt.y * natH;

          ctx.beginPath();
          const color = item.color ? hexToRgba(item.color, 0.85) : "rgba(37, 99, 235, 0.85)";
          const strokeRatio = natW / 800;
          ctx.lineWidth = Math.max(2, (item.width || 6) * strokeRatio);
          ctx.strokeStyle = color;
          ctx.lineCap = "round";
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          return;
        }

        ctx.beginPath();
        const color = item.color ? hexToRgba(item.color, 0.6) : "rgba(255, 200, 0, 0.6)";
        const strokeRatio = natW / 800;
        const width = (item.width || 15) * Math.max(1, strokeRatio);
        const points = item.points || item;

        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        points.forEach((point: any, i: number) => {
          const px = point.x * natW;
          const py = point.y * natH;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
      });

      try {
        return exportCanvas.toDataURL("image/jpeg", 0.95);
      } catch (e) {
        try {
          return exportCanvas.toDataURL("image/png");
        } catch (e2) {
          console.error("Error exportando compuesto:", e2);
          return null;
        }
      }
    },
    [activeIndex, drawings, getCurrentImageSrc]
  );

  return {
    activeIndex,
    imageVersion,
    setImageVersion,
    handleSetIndex,
    isDrawing,
    setIsDrawing,
    penColor,
    setPenColor,
    penWidth,
    setPenWidth,
    isLineMode,
    setIsLineMode,
    lineColor,
    setLineColor,
    lineWidth,
    setLineWidth,
    lineStartPoint,
    setLineStart,
    isCensoring,
    setIsCensoring,
    censorShape,
    setCensorShape,
    censorColor,
    setCensorColor,
    sheetZoom,
    setSheetZoom,
    containerRef,
    imageRef,
    canvasRef,
    wrapperRef,
    drawings,
    drawingsRef,
    setDrawingsState,
    historyUndo,
    setHistoryUndo,
    updateDrawings,
    hasCensoredVersion,
    getCurrentImageSrc,
    syncCanvasDimensions,
    redrawCanvas,
    handleUndo,
    handleRedo,
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    setIsDrawingActive,
    generateCompositeDataUrl,
  };
}