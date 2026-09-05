"use client";

import { forwardRef, useImperativeHandle } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { DocumentImageEditorHandle, DocumentImageEditorProps } from "./types";
import { useDocumentEditor } from "./useDocumentEditor";
import { EditorToolbar } from "./EditorToolbar";

export type { DocumentImageEditorHandle, DocumentImageEditorProps };

export const DocumentImageEditor = forwardRef<DocumentImageEditorHandle, DocumentImageEditorProps>(
  function DocumentImageEditor(props, ref) {
    const { className = "", showToolbar = true, showPagination = true, showSheetZoom = true, images } = props;

    const editor = useDocumentEditor(props);

    useImperativeHandle(ref, () => ({
      getCompositeDataUrl: (pageIndex?: number) => {
        return editor.generateCompositeDataUrl(pageIndex !== undefined ? pageIndex : editor.activeIndex);
      },
      getScreenshotDataUrl: (pageIndex?: number) => {
        return editor.generateCompositeDataUrl(pageIndex !== undefined ? pageIndex : editor.activeIndex);
      },
      getAllCompositeDataUrls: () => {
        const result: Record<number, string> = {};
        images.forEach((_, idx) => {
          const composite = editor.generateCompositeDataUrl(idx);
          if (composite) result[idx] = composite;
        });
        return result;
      },
      getDrawings: () => editor.drawingsRef.current,
      setDrawings: (newDrawings) => {
        editor.drawingsRef.current = newDrawings;
        editor.setDrawingsState(newDrawings);
        editor.redrawCanvas(newDrawings[editor.activeIndex] || []);
      },
      clearAllMarks: () => {
        editor.drawingsRef.current[editor.activeIndex] = [];
        editor.updateDrawings((prev) => ({ ...prev, [editor.activeIndex]: [] }));
        editor.redrawCanvas([]);
      },
      getImageVersion: () => editor.imageVersion,
      setImageVersion: (version: "censored" | "original") => {
        editor.setImageVersion(version);
      },
    }));

    return (
      <div className={`relative flex flex-col bg-gray-950 overflow-hidden select-none ${className}`}>
        <EditorToolbar showToolbar={showToolbar} showPagination={showPagination} {...props} {...editor} />

        <div
          ref={editor.containerRef}
          className={`flex-1 relative overflow-auto flex bg-slate-950 group p-2 sm:p-4 select-none ${
            editor.isDrawing || editor.isCensoring || editor.isLineMode
              ? "touch-none cursor-crosshair"
              : "touch-pan-x touch-pan-y cursor-default"
          }`}
          role="region"
          aria-label="Visor y editor interactivo de documento"
          onMouseMove={editor.handleMouseMove}
          onMouseDown={editor.handleMouseDown}
          onMouseUp={editor.handleMouseUp}
          onTouchStart={editor.handleTouchStart}
          onTouchMove={editor.handleTouchMove}
          onTouchEnd={editor.handleTouchEnd}
          onMouseLeave={() => editor.setIsDrawingActive(false)}
        >
          {images.length > 0 && editor.getCurrentImageSrc(editor.activeIndex) && (
            <div
              ref={editor.wrapperRef}
              className="relative shadow-2xl rounded-sm shrink-0 m-auto"
              style={{ width: "fit-content", height: "fit-content" }}
            >
              <img
                ref={editor.imageRef}
                src={editor.getCurrentImageSrc(editor.activeIndex)}
                alt={`Página ${editor.activeIndex + 1}`}
                className="select-none block rounded-sm shadow-xl"
                style={{
                  maxHeight: `${Math.round(75 * (editor.sheetZoom / 100))}vh`,
                  maxWidth: `${Math.round(90 * (editor.sheetZoom / 100))}vw`,
                  width: "auto",
                  height: "auto",
                  display: "block",
                }}
                draggable="false"
                onLoad={() => editor.syncCanvasDimensions()}
              />
              <canvas ref={editor.canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
            </div>
          )}

          {showSheetZoom && (
            <div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-1.5 bg-slate-900/95 backdrop-blur-md px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full border border-slate-700/80 shadow-2xl text-slate-200 select-none"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  editor.setSheetZoom((prev) => Math.max(30, prev - 10));
                }}
                disabled={editor.sheetZoom <= 30}
                aria-label="Alejar documento (-10%)"
                className="p-1 sm:p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                title="Alejar hoja (-10%)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  editor.setSheetZoom(100);
                }}
                aria-label="Restablecer zoom al 100%"
                className="px-2 py-0.5 text-[10px] sm:text-[11px] font-mono font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
                title="Restablecer al 100%"
              >
                {editor.sheetZoom}%
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  editor.setSheetZoom((prev) => Math.min(400, prev + 10));
                }}
                disabled={editor.sheetZoom >= 400}
                aria-label="Acercar documento (+10%)"
                className="p-1 sm:p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                title="Acercar hoja (+10%)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);