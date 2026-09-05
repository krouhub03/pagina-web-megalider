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