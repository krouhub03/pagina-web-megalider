"use client";

import { 
  PenTool, 
  Minus,
  ChevronLeft, 
  ChevronRight, 
  Eraser, 
  Undo2, 
  Redo2, 
  Square, 
  Circle, 
  EyeOff, 
  FileImage 
} from "lucide-react";

interface EditorToolbarProps {
  showToolbar: boolean;
  showPagination: boolean;
  images: any[];
  activeIndex: number;
  handleSetIndex: (index: number) => void;
  hasCensoredVersion: (index: number) => boolean;
  imageVersion: "censored" | "original";
  setImageVersion: (version: "censored" | "original") => void;
  readOnly?: boolean;
  isDrawing: boolean;
  setIsDrawing: (val: boolean) => void;
  isLineMode: boolean;
  setIsLineMode: (val: boolean) => void;
  lineColor: string;
  setLineColor: (val: string) => void;
  lineWidth: number;
  setLineWidth: (val: number) => void;
  lineStartPoint?: { x: number; y: number } | null;
  setIsCensoring: (val: boolean) => void;
  penColor: string;
  setPenColor: (val: string) => void;
  penWidth: number;
  setPenWidth: (val: number) => void;
  isCensoring: boolean;
  censorShape: "rect" | "circle";
  setCensorShape: (val: "rect" | "circle") => void;
  censorColor: string;
  setCensorColor: (val: string) => void;
  handleUndo: () => void;
  handleRedo: () => void;
  drawings: Record<number, any[]>;
  historyUndo: Record<number, any[]>;
  updateDrawings: (updater: (prev: Record<number, any[]>) => Record<number, any[]>) => void;
  setHistoryUndo: React.Dispatch<React.SetStateAction<Record<number, any[]>>>;
  redrawCanvas: (list?: any[]) => void;
}

export function EditorToolbar({
  showToolbar,
  showPagination,
  images,
  activeIndex,
  handleSetIndex,
  hasCensoredVersion,
  imageVersion,
  setImageVersion,
  readOnly = false,
  isDrawing,
  setIsDrawing,
  isLineMode,
  setIsLineMode,
  lineColor,
  setLineColor,
  lineWidth,
  setLineWidth,
  lineStartPoint,
  setIsCensoring,
  penColor,
  setPenColor,
  penWidth,
  setPenWidth,
  isCensoring,
  censorShape,
  setCensorShape,
  censorColor,
  setCensorColor,
  handleUndo,
  handleRedo,
  drawings,
  historyUndo,
  updateDrawings,
  setHistoryUndo,
  redrawCanvas,
}: EditorToolbarProps) {
  if (!showToolbar) return null;

  return (
    <div className="px-2 sm:px-3 py-2 bg-slate-900/95 border-b border-slate-800 text-slate-200 text-xs flex flex-col gap-2 shadow-sm z-10 select-none">
      
      {/* PRIMERA FILA: Páginas, Borrador, Flechas, Iconos principales y Acciones globales (sin textos) */}
      <div className="flex items-center justify-between gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0">
        
        {/* Controles de Página y Versión */}
        <div className="flex items-center gap-1.5 shrink-0">
          {showPagination && images.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-800/90 px-1.5 py-1 rounded-lg border border-slate-700/60 shadow-inner">
              <button
                type="button"
                disabled={activeIndex === 0}
                onClick={() => handleSetIndex(activeIndex - 1)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/80 rounded transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-300 text-[11px] px-1 min-w-[45px] text-center">
                {activeIndex + 1}/{images.length || 1}
              </span>
              <button
                type="button"
                disabled={activeIndex >= images.length - 1}
                onClick={() => handleSetIndex(activeIndex + 1)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/80 rounded transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {hasCensoredVersion(activeIndex) && (
            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/60 shadow-inner">
              <button
                type="button"
                onClick={() => setImageVersion("censored")}
                className={`p-1.5 rounded-md flex items-center justify-center transition cursor-pointer ${
                  imageVersion === "censored"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/60"
                }`}
                title="Mostrar imagen censurada"
              >
                <EyeOff className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setImageVersion("original")}
                className={`p-1.5 rounded-md flex items-center justify-center transition cursor-pointer ${
                  imageVersion === "original"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/60"
                }`}
                title="Mostrar factura original intacta"
              >
                <FileImage className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Herramientas Principales (Solo Iconos) y Deshacer/Rehacer/Borrar */}
        {!readOnly && (
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/60 shadow-sm gap-1">
              {/* Esfero */}
              <button
                type="button"
                onClick={() => {
                  const next = !isDrawing;
                  setIsDrawing(next);
                  if (next) {
                    setIsCensoring(false);
                    setIsLineMode(false);
                  }
                }}
                className={`p-1.5 rounded-md flex items-center justify-center transition cursor-pointer ${
                  isDrawing ? "bg-amber-500 text-white shadow-sm" : "text-slate-300 hover:bg-slate-700/70"
                }`}
                title="Esfero libre"
              >
                <PenTool className="w-4 h-4" />
              </button>

              {/* Línea Recta */}
              <button
                type="button"
                onClick={() => {
                  const next = !isLineMode;
                  setIsLineMode(next);
                  if (next) {
                    setIsDrawing(false);
                    setIsCensoring(false);
                  }
                }}
                className={`p-1.5 rounded-md flex items-center justify-center transition cursor-pointer ${
                  isLineMode ? "bg-blue-600 text-white shadow-sm" : "text-slate-300 hover:bg-slate-700/70"
                }`}
                title="Línea recta"
              >
                <Minus className="w-4 h-4" />
              </button>

              {/* Censura */}
              <button
                type="button"
                onClick={() => {
                  const next = !isCensoring;
                  setIsCensoring(next);
                  if (next) {
                    setIsDrawing(false);
                    setIsLineMode(false);
                  }
                }}
                className={`p-1.5 rounded-md flex items-center justify-center transition cursor-pointer ${
                  isCensoring ? "bg-rose-600 text-white shadow-sm" : "text-slate-300 hover:bg-slate-700/70"
                }`}
                title="Censurar datos"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>

            {/* Undo / Redo / Clear */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/60 shadow-sm">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!drawings[activeIndex]?.length}
                className="p-1.5 rounded-md hover:bg-slate-700/80 hover:text-white text-slate-300 transition disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                title="Deshacer (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!historyUndo[activeIndex]?.length}
                className="p-1.5 rounded-md hover:bg-slate-700/80 hover:text-white text-slate-300 transition disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                title="Rehacer (Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4" />
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
                className="p-1.5 rounded-md hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                title="Borrar todas las marcas"
              >
                <Eraser className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SEGUNDA FILA: Configuración de la herramienta seleccionada */}
      {!readOnly && (isDrawing || isLineMode || isCensoring) && (
        <div className="flex items-center justify-center gap-2 bg-slate-950/40 px-2 py-1.5 rounded-lg border border-slate-800 animate-in fade-in duration-150 w-full">
          
          {/* Configuración de Esfero */}
          {isDrawing && (
            <div className="flex items-center justify-center gap-3 w-full">
              <span className="text-[11px] text-amber-400 font-medium">Esfero:</span>
              <input
                type="color"
                value={penColor}
                onChange={(e) => setPenColor(e.target.value)}
                className="w-5 h-5 rounded-full cursor-pointer border border-slate-500 p-0 bg-transparent overflow-hidden"
                title="Color del esfero"
              />
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={penWidth}
                  onChange={(e) => setPenWidth(Number(e.target.value))}
                  className="w-32 sm:w-40 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  title="Grosor del esfero"
                />
                <span className="text-[11px] font-mono text-amber-400 w-6 text-right">{penWidth}p</span>
              </div>
            </div>
          )}

          {/* Configuración de Línea */}
          {isLineMode && (
            <div className="flex items-center justify-center gap-3 w-full flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-blue-400 font-medium">Línea:</span>
                <input
                  type="color"
                  value={lineColor}
                  onChange={(e) => setLineColor(e.target.value)}
                  className="w-5 h-5 rounded-full cursor-pointer border border-slate-500 p-0 bg-transparent overflow-hidden"
                  title="Color de la línea"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="2"
                  max="30"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number(e.target.value))}
                  className="w-32 sm:w-40 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  title="Grosor de la línea"
                />
                <span className="text-[11px] font-mono text-blue-400 w-6 text-right">{lineWidth}p</span>
              </div>
            </div>
          )}

          {/* Configuración de Censura */}
          {isCensoring && (
            <div className="flex items-center justify-center gap-3 w-full">
              <span className="text-[11px] text-rose-400 font-medium">Censura:</span>
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-md border border-slate-700">
                <button
                  type="button"
                  onClick={() => setCensorShape("rect")}
                  className={`p-1.5 rounded cursor-pointer ${censorShape === "rect" ? "bg-slate-700 text-rose-400 font-bold" : "text-slate-400 hover:text-slate-200"}`}
                  title="Forma rectangular"
                >
                  <Square className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCensorShape("circle")}
                  className={`p-1.5 rounded cursor-pointer ${censorShape === "circle" ? "bg-slate-700 text-rose-400 font-bold" : "text-slate-400 hover:text-slate-200"}`}
                  title="Forma circular"
                >
                  <Circle className="w-4 h-4" />
                </button>
              </div>
              <input
                type="color"
                value={censorColor}
                onChange={(e) => setCensorColor(e.target.value)}
                className="w-5 h-5 rounded-full cursor-pointer border border-slate-500 p-0 bg-transparent overflow-hidden"
                title="Color de censura"
              />
            </div>
          )}

        </div>
      )}

    </div>
  );
}