"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { 
  Search, 
  PenTool, 
  ChevronLeft, 
  ChevronRight, 
  Eraser, 
  ZoomIn, 
  ZoomOut, 
  Undo2, 
  Redo2, 
  Square, 
  Circle, 
  EyeOff,
  Eye,
  FileImage,
  Layers
} from "lucide-react";

export interface DocumentImageEditorHandle {
  getCompositeDataUrl: (pageIndex?: number) => string | null;
  getScreenshotDataUrl: (pageIndex?: number) => string | null;
  getAllCompositeDataUrls: () => Record<number, string>;
  getDrawings: () => Record<number, any[]>;
  setDrawings: (drawings: Record<number, any[]>) => void;
  clearAllMarks: () => void;
  getImageVersion: () => "censored" | "original";
  setImageVersion: (version: "censored" | "original") => void;
}

export interface DocumentImageEditorProps {
  images: Array<string | { 
    id?: number; 
    datosBase64?: string; 
    datos_base64?: string; 
    datosBase64Censurada?: string | null; 
    datos_base64_censurada?: string | null; 
    censoredUrl?: string; 
    censoredDataUrl?: string; 
    url?: string; 
    [key: string]: any; 
  }>;
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  initialDrawings?: Record<number, any[]>;
  onDrawingsChange?: (drawings: Record<number, any[]>) => void;
  readOnly?: boolean;
  className?: string;
  showToolbar?: boolean;
  showPagination?: boolean;
  showSheetZoom?: boolean;
  defaultVersion?: "censored" | "original";
}

export const DocumentImageEditor = forwardRef<DocumentImageEditorHandle, DocumentImageEditorProps>(
  function DocumentImageEditor(
    {
      images,
      currentIndex: externalIndex,
      onIndexChange,
      initialDrawings,
      onDrawingsChange,
      readOnly = false,
      className = "",
      showToolbar = true,
      showPagination = true,
      showSheetZoom = true,
      defaultVersion = "censored",
    },
    ref
  ) {
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

    // Lupa state
    const [showLoupe, setShowLoupe] = useState(false);
    const [loupePosPx, setLoupePosPx] = useState({ x: 0, y: 0 });
    const [loupePosPct, setLoupePosPct] = useState({ x: 0, y: 0, w: 0, h: 0 });
    const [zoomLevel, setZoomLevel] = useState(300); // 3x
    const [isLoupeEnabled, setIsLoupeEnabled] = useState(true);

    // Herramientas de dibujo y censura
    const [isDrawing, setIsDrawing] = useState(false);
    const [penColor, setPenColor] = useState("#ffc800");
    const [penWidth, setPenWidth] = useState(15);

    const [isCensoring, setIsCensoring] = useState(false);
    const [censorShape, setCensorShape] = useState<"rect" | "circle">("rect");
    const [censorColor, setCensorColor] = useState("#000000");

    const [sheetZoom, setSheetZoom] = useState(100);

    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const loupeCanvasRef = useRef<HTMLCanvasElement>(null);
    const loupeContainerRef = useRef<HTMLDivElement>(null);
    const loupeInnerRef = useRef<HTMLDivElement>(null);

    const [isDrawingActive, setIsDrawingActive] = useState(false);
    const drawStartRef = useRef<{ screenX: number; screenY: number; imgX: number; imgY: number } | null>(null);

    // Formato de trazo:
    // Stroke: { type: 'stroke', color, width, points: [{x, y}] }
    // Censor: { type: 'censor', shape: 'rect'|'circle', color, start: {x,y}, end: {x,y} }
    const [drawings, setDrawingsState] = useState<Record<number, any[]>>(initialDrawings || {});
    const drawingsRef = useRef<Record<number, any[]>>(initialDrawings || {});
    const [historyUndo, setHistoryUndo] = useState<Record<number, any[]>>({});

    useEffect(() => {
      if (initialDrawings) {
        setDrawingsState(initialDrawings);
        drawingsRef.current = initialDrawings;
      }
    }, [initialDrawings]);

    const updateDrawings = (updater: (prev: Record<number, any[]>) => Record<number, any[]>) => {
      setDrawingsState((prev) => {
        const next = updater(prev);
        drawingsRef.current = next;
        if (onDrawingsChange) onDrawingsChange(next);
        return next;
      });
    };

    // Verificar si la página actual dispone de una versión censurada físicamente
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

    // Obtener la URL o DataURL de la imagen actual según la versión seleccionada (censurada por defecto)
    const getCurrentImageSrc = (index: number, version: "censored" | "original" = imageVersion): string => {
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

      // Versión original
      return item.datosBase64 || item.datos_base64 || item.url || "";
    };

    // Sincronizar dimensiones cada vez que se alterne entre versión censurada y original
    useEffect(() => {
      syncCanvasDimensions();
      const timer = setTimeout(syncCanvasDimensions, 50);
      return () => clearTimeout(timer);
    }, [imageVersion]);

    // Sincronización subpíxel del canvas con la imagen física
    const syncCanvasDimensions = () => {
      if (imageRef.current && canvasRef.current && wrapperRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        const targetW = Math.round(rect.width);
        const targetH = Math.round(rect.height);

        if (targetW === 0 || targetH === 0) return;

        let needsRedraw = false;
        if (canvasRef.current.width !== targetW || canvasRef.current.height !== targetH) {
          canvasRef.current.width = targetW;
          canvasRef.current.height = targetH;
          needsRedraw = true;
        }

        if (loupeCanvasRef.current) {
          if (loupeCanvasRef.current.width !== targetW || loupeCanvasRef.current.height !== targetH) {
            loupeCanvasRef.current.width = targetW;
            loupeCanvasRef.current.height = targetH;
            needsRedraw = true;
          }
        }

        redrawCanvas();
      }
    };

    // Observador continuo de redimensionamiento de la imagen (Zoom, ventana, responsive)
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
    }, [activeIndex, images]);

    // Re-sincronizar inmediatamente en cambios de zoom
    useEffect(() => {
      syncCanvasDimensions();
      const raf = requestAnimationFrame(syncCanvasDimensions);
      const timer = setTimeout(syncCanvasDimensions, 20);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }, [sheetZoom]);

    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16) || 0;
      const g = parseInt(hex.slice(3, 5), 16) || 0;
      const b = parseInt(hex.slice(5, 7), 16) || 0;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const redrawCanvas = (customList?: any[]) => {
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
              // Rectángulo de censura sólido
              ctx.fillRect(x1, y1, w, h);
            }
            return;
          }

          // Esfero / Resaltador
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
      };

      drawToContext(canvasRef.current);
      drawToContext(loupeCanvasRef.current);
    };

    const handleUndo = () => {
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
    };

    const handleRedo = () => {
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
    };

    // Atajos de teclado: Ctrl+Z / Ctrl+Y
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
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [drawings, historyUndo, activeIndex, readOnly]);

    const getNormalizedPos = (imgX: number, imgY: number) => {
      if (!imageRef.current) return { x: 0, y: 0 };
      const rect = imageRef.current.getBoundingClientRect();
      const clampedX = Math.max(0, Math.min(1, imgX / rect.width));
      const clampedY = Math.max(0, Math.min(1, imgY / rect.height));
      return { x: clampedX, y: clampedY };
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (readOnly || (!isDrawing && !isCensoring) || !imageRef.current || !canvasRef.current) return;

      syncCanvasDimensions();

      const rect = imageRef.current.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;

      setIsDrawingActive(true);

      const imgX = e.clientX - rect.left;
      const imgY = e.clientY - rect.top;

      drawStartRef.current = {
        screenX: e.clientX,
        screenY: e.clientY,
        imgX,
        imgY,
      };

      const pos = getNormalizedPos(imgX, imgY);
      const currentDrawings = drawingsRef.current[activeIndex] || [];

      if (isCensoring) {
        const censorItem = {
          type: "censor",
          shape: censorShape,
          color: censorColor,
          start: pos,
          end: pos,
        };
        const nextList = [...currentDrawings, censorItem];
        drawingsRef.current[activeIndex] = nextList;
        updateDrawings((prev) => ({
          ...prev,
          [activeIndex]: nextList,
        }));
      } else {
        const strokeItem = {
          type: "stroke",
          color: penColor,
          width: penWidth,
          points: [pos],
        };
        const nextList = [...currentDrawings, strokeItem];
        drawingsRef.current[activeIndex] = nextList;
        updateDrawings((prev) => ({
          ...prev,
          [activeIndex]: nextList,
        }));
      }

      setHistoryUndo((prev) => ({ ...prev, [activeIndex]: [] }));
    };

    const handleMouseUp = () => {
      if (isDrawingActive) {
        const currentDrawings = drawingsRef.current[activeIndex] || [];
        updateDrawings((prev) => ({
          ...prev,
          [activeIndex]: [...currentDrawings],
        }));
      }
      setIsDrawingActive(false);
      drawStartRef.current = null;
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imageRef.current) return;

      const container = e.currentTarget;
      const containerRect = container.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;
      setLoupePosPx({ x: mouseX, y: mouseY });

      const imgRect = imageRef.current.getBoundingClientRect();
      const currentImgX = e.clientX - imgRect.left;
      const currentImgY = e.clientY - imgRect.top;

      if (loupeContainerRef.current) {
        loupeContainerRef.current.style.left = `${mouseX - 125}px`;
        loupeContainerRef.current.style.top = `${mouseY - 125}px`;
      }
      if (loupeInnerRef.current) {
        loupeInnerRef.current.style.left = `${125 - currentImgX * (zoomLevel / 100)}px`;
        loupeInnerRef.current.style.top = `${125 - currentImgY * (zoomLevel / 100)}px`;
      }

      setLoupePosPct({
        x: currentImgX,
        y: currentImgY,
        w: imgRect.width,
        h: imgRect.height,
      });

      if ((isDrawing || isCensoring) && isDrawingActive && canvasRef.current) {
        const pos = getNormalizedPos(currentImgX, currentImgY);
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
      }
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 1 && (isDrawing || isCensoring)) {
        const touch = e.touches[0];
        handleMouseDown({
          clientX: touch.clientX,
          clientY: touch.clientY,
        } as any);
      }
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 1 && (isDrawing || isCensoring)) {
        const touch = e.touches[0];
        handleMouseMove({
          clientX: touch.clientX,
          clientY: touch.clientY,
          currentTarget: e.currentTarget,
        } as any);
      }
    };

    const handleTouchEnd = () => {
      handleMouseUp();
    };

    // Captura compuesta de pantalla y renderizado en resolución nativa
    const generateCompositeDataUrl = (targetIndex: number = activeIndex): string | null => {
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
      // Dimensiones nativas de la imagen física original
      const natW = img.naturalWidth || img.width || 1200;
      const natH = img.naturalHeight || img.height || 1600;
      exportCanvas.width = natW;
      exportCanvas.height = natH;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return null;

      // 1. Dibujar la imagen base original en resolución nativa completa
      ctx.drawImage(img, 0, 0, natW, natH);

      // 2. Quemar explícitamente todas las marcas y censuras con 100% de solidez y opacidad absoluta (negro total)
      const pageDrawings = drawingsRef.current[targetIndex] || drawings[targetIndex] || [];
      pageDrawings.forEach((item) => {
        if (item.type === "censor") {
          const x1 = Math.min(item.start.x, item.end.x) * natW;
          const y1 = Math.min(item.start.y, item.end.y) * natH;
          const x2 = Math.max(item.start.x, item.end.x) * natW;
          const y2 = Math.max(item.start.y, item.end.y) * natH;
          const w = Math.max(2, x2 - x1);
          const h = Math.max(2, y2 - y1);

          // Relleno 100% sólido y negro absoluto para tapar físicamente la información
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
            // Cuadro de censura sólido
            ctx.fillRect(x1, y1, w, h);
          }
          return;
        }

        // Trazos de esfero / resaltador
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
          console.error("Error exportando compuesto en DocumentImageEditor:", e2);
          return null;
        }
      }
    };

    // Imperative Handle
    useImperativeHandle(ref, () => ({
      getCompositeDataUrl: (pageIndex?: number) => {
        return generateCompositeDataUrl(pageIndex !== undefined ? pageIndex : activeIndex);
      },
      getScreenshotDataUrl: (pageIndex?: number) => {
        return generateCompositeDataUrl(pageIndex !== undefined ? pageIndex : activeIndex);
      },
      getAllCompositeDataUrls: () => {
        const result: Record<number, string> = {};
        images.forEach((_, idx) => {
          const composite = generateCompositeDataUrl(idx);
          if (composite) result[idx] = composite;
        });
        return result;
      },
      getDrawings: () => drawingsRef.current,
      setDrawings: (newDrawings) => {
        drawingsRef.current = newDrawings;
        setDrawingsState(newDrawings);
        redrawCanvas(newDrawings[activeIndex] || []);
      },
      clearAllMarks: () => {
        drawingsRef.current[activeIndex] = [];
        updateDrawings((prev) => ({ ...prev, [activeIndex]: [] }));
        redrawCanvas([]);
      },
      getImageVersion: () => imageVersion,
      setImageVersion: (version: "censored" | "original") => {
        setImageVersion(version);
      },
    }));

    return (
      <div className={`relative flex flex-col bg-gray-950 overflow-hidden select-none ${className}`}>
        {/* Barra de Herramientas Superior */}
        {showToolbar && (
          <div className="px-3 py-2 bg-slate-900/95 border-b border-slate-800 text-slate-200 text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm z-10">
            {/* Paginador y Selector de Versión (Censurada / Original) */}
            <div className="flex items-center gap-2">
              {showPagination && images.length > 0 && (
                <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-1 rounded-lg border border-slate-700/60 shadow-inner">
                  <button
                    type="button"
                    disabled={activeIndex === 0}
                    onClick={() => handleSetIndex(activeIndex - 1)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/80 rounded transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-semibold text-slate-300 text-[11px] px-1 min-w-[55px] text-center">
                    Pág. {activeIndex + 1} / {images.length || 1}
                  </span>
                  <button
                    type="button"
                    disabled={activeIndex >= images.length - 1}
                    onClick={() => handleSetIndex(activeIndex + 1)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/80 rounded transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                    title="Página siguiente"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Selector de Versión de la Factura: Censurada (Principal) vs Original */}
              {hasCensoredVersion(activeIndex) && (
                <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/60 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setImageVersion("censored")}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-semibold transition text-xs cursor-pointer ${
                      imageVersion === "censored"
                        ? "bg-rose-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/60"
                    }`}
                    title="Mostrar imagen censurada (con datos confidenciales tachados)"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Censurada</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageVersion("original")}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-semibold transition text-xs cursor-pointer ${
                      imageVersion === "original"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/60"
                    }`}
                    title="Mostrar factura original intacta"
                  >
                    <FileImage className="w-3.5 h-3.5" />
                    <span>Original</span>
                  </button>
                </div>
              )}
            </div>

            {/* Controles de Lupa, Esfero, Censura y Deshacer */}
            {!readOnly && (
              <div className="flex items-center gap-2">
                {/* Esfero / Resaltador */}
                <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/60 shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isDrawing;
                      setIsDrawing(next);
                      if (next) setIsCensoring(false);
                    }}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium transition text-xs cursor-pointer ${
                      isDrawing ? "bg-amber-500 text-white shadow-sm" : "text-slate-300 hover:bg-slate-700/70"
                    }`}
                    title="Activar/Desactivar esfero resaltador"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Esfero</span>
                  </button>

                  {isDrawing && (
                    <div className="flex items-center gap-2 pl-2 pr-1.5 py-0.5 border-l border-slate-700 animate-in fade-in duration-150">
                      <div className="relative flex items-center" title="Color del trazo">
                        <input
                          type="color"
                          value={penColor}
                          onChange={(e) => setPenColor(e.target.value)}
                          className="w-4 h-4 rounded-full cursor-pointer border border-slate-500 p-0 bg-transparent overflow-hidden"
                        />
                      </div>
                      <div className="flex items-center gap-1.5" title={`Grosor: ${penWidth}px`}>
                        <input
                          type="range"
                          min="2"
                          max="40"
                          value={penWidth}
                          onChange={(e) => setPenWidth(Number(e.target.value))}
                          className="w-14 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        <span className="text-[10px] font-mono text-amber-400 w-5 text-right">{penWidth}p</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Censura (Tachar datos) */}
                <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/60 shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isCensoring;
                      setIsCensoring(next);
                      if (next) setIsDrawing(false);
                    }}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium transition text-xs cursor-pointer ${
                      isCensoring ? "bg-rose-600 text-white shadow-sm" : "text-slate-300 hover:bg-slate-700/70"
                    }`}
                    title="Tachar / Censurar datos sensibles con figura"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Censurar</span>
                  </button>

                  {isCensoring && (
                    <div className="flex items-center gap-1.5 pl-2 pr-1.5 py-0.5 border-l border-slate-700 animate-in fade-in duration-150">
                      <button
                        type="button"
                        onClick={() => setCensorShape("rect")}
                        className={`p-1 rounded cursor-pointer ${
                          censorShape === "rect" ? "bg-slate-700 text-rose-400 font-bold" : "text-slate-400 hover:text-slate-200"
                        }`}
                        title="Cuadro / Rectángulo de censura"
                      >
                        <Square className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCensorShape("circle")}
                        className={`p-1 rounded cursor-pointer ${
                          censorShape === "circle" ? "bg-slate-700 text-rose-400 font-bold" : "text-slate-400 hover:text-slate-200"
                        }`}
                        title="Círculo de censura"
                      >
                        <Circle className="w-3.5 h-3.5" />
                      </button>
                      <div className="relative flex items-center ml-1" title="Color de la censura">
                        <input
                          type="color"
                          value={censorColor}
                          onChange={(e) => setCensorColor(e.target.value)}
                          className="w-4 h-4 rounded-full cursor-pointer border border-slate-500 p-0 bg-transparent overflow-hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Deshacer, Rehacer y Borrar */}
                <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/60 shadow-sm">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={!drawings[activeIndex]?.length}
                    className="p-1.5 rounded-md hover:bg-slate-700/80 hover:text-white text-slate-300 transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                    title="Deshacer trazo / figura (Ctrl + Z)"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={!historyUndo[activeIndex]?.length}
                    className="p-1.5 rounded-md hover:bg-slate-700/80 hover:text-white text-slate-300 transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                    title="Rehacer trazo / figura (Ctrl + Y / Ctrl + Shift + Z)"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="h-3 w-[1px] bg-slate-700 mx-0.5" />

                  <button
                    type="button"
                    onClick={() => {
                      const currentList = drawings[activeIndex] || [];
                      if (!currentList.length) return;

                      setHistoryUndo((prev) => ({
                        ...prev,
                        [activeIndex]: [...(prev[activeIndex] || []), ...currentList],
                      }));
                      updateDrawings((prev) => ({ ...prev, [activeIndex]: [] }));
                      redrawCanvas([]);
                    }}
                    disabled={!drawings[activeIndex]?.length}
                    className="p-1.5 rounded-md hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                    title="Borrar todas las marcas"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="h-4 w-[1px] bg-slate-700/80 mx-0.5" />

                {/* Lupa */}
                <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/60 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setIsLoupeEnabled(!isLoupeEnabled)}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium transition text-xs cursor-pointer ${
                      isLoupeEnabled ? "bg-blue-600 text-white shadow-sm" : "text-slate-300 hover:bg-slate-700/70"
                    }`}
                    title="Activar/Desactivar Lupa"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Lupa</span>
                  </button>

                  {isLoupeEnabled && (
                    <div className="flex items-center gap-1.5 pl-2 pr-2 py-0.5 border-l border-slate-700 animate-in fade-in duration-150">
                      <input
                        type="range"
                        min="150"
                        max="800"
                        step="25"
                        value={zoomLevel}
                        onChange={(e) => setZoomLevel(Number(e.target.value))}
                        className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        title={`Zoom: ${(zoomLevel / 100).toFixed(1)}x`}
                      />
                      <span className="text-[10px] font-mono text-blue-400 min-w-[28px] text-right">
                        {(zoomLevel / 100).toFixed(1)}x
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Visor Interactivo y Lienzo */}
        <div
          className={`flex-1 relative overflow-auto flex items-center justify-center bg-slate-950 group p-4 ${
            isDrawing || isCensoring ? "cursor-crosshair" : isLoupeEnabled ? "cursor-zoom-in" : "cursor-default"
          }`}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseEnter={() => setShowLoupe(true)}
          onMouseLeave={() => {
            setShowLoupe(false);
            setIsDrawingActive(false);
          }}
        >
          {images.length > 0 && getCurrentImageSrc(activeIndex) && (
            <div
              ref={wrapperRef}
              className="relative shadow-2xl rounded-sm shrink-0"
              style={{
                width: "fit-content",
                height: "fit-content",
              }}
            >
              <img
                ref={imageRef}
                src={getCurrentImageSrc(activeIndex)}
                alt={`Página ${activeIndex + 1}`}
                className="select-none block rounded-sm shadow-xl"
                style={{
                  maxHeight: `${Math.round(72 * (sheetZoom / 100))}vh`,
                  maxWidth: `${Math.round(85 * (sheetZoom / 100))}vw`,
                  width: "auto",
                  height: "auto",
                  display: "block",
                }}
                draggable="false"
                onLoad={() => {
                  syncCanvasDimensions();
                }}
              />
              <canvas 
                ref={canvasRef} 
                className="absolute top-0 left-0 w-full h-full pointer-events-none" 
              />
            </div>
          )}

          {/* Zoom flotante para la hoja en la parte inferior */}
          {showSheetZoom && (
            <div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-slate-700/80 shadow-2xl text-slate-200 select-none"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSheetZoom((prev) => Math.max(40, prev - 10));
                }}
                disabled={sheetZoom <= 40}
                className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                title="Alejar hoja (-10%)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSheetZoom(100);
                }}
                className="px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
                title="Restablecer tamaño normal (100%)"
              >
                {sheetZoom}%
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSheetZoom((prev) => Math.min(180, prev + 10));
                }}
                disabled={sheetZoom >= 180}
                className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                title="Acercar hoja (+10%)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Lupa Amplificadora */}
          {images.length > 0 && getCurrentImageSrc(activeIndex) && (
            <div
              ref={loupeContainerRef}
              className={`pointer-events-none absolute border-2 border-blue-500 rounded-full shadow-xl z-50 bg-white overflow-hidden transition-opacity duration-150 ${
                showLoupe && isLoupeEnabled ? "opacity-100" : "opacity-0"
              }`}
              style={{
                width: 250,
                height: 250,
                left: loupePosPx.x - 125,
                top: loupePosPx.y - 125,
              }}
            >
              <div
                ref={loupeInnerRef}
                style={{
                  position: "absolute",
                  width: loupePosPct.w,
                  height: loupePosPct.h,
                  transformOrigin: "0 0",
                  transform: `scale(${zoomLevel / 100})`,
                  left: 125 - loupePosPct.x * (zoomLevel / 100),
                  top: 125 - loupePosPct.y * (zoomLevel / 100),
                }}
              >
                <img src={getCurrentImageSrc(activeIndex)} alt="" style={{ width: "100%", height: "100%" }} />
                <canvas ref={loupeCanvasRef} className="absolute top-0 left-0" style={{ width: "100%", height: "100%" }} />
              </div>
              <div className="w-1 h-1 bg-blue-500 rounded-full opacity-50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          )}
        </div>
      </div>
    );
  }
);
