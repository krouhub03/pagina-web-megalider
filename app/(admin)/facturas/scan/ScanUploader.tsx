"use client";

import { useState, useEffect } from "react";
import { Camera, ImagePlus } from "lucide-react";

export function ScanUploader({ 
  onFileChange, 
  error 
}: { 
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string | null;
}) {
  const [showCameraButton, setShowCameraButton] = useState<boolean>(false);
  const [isCheckingDevice, setIsCheckingDevice] = useState<boolean>(true);

  useEffect(() => {
    async function checkDeviceCapabilities() {
      // 1. Detectar si es un dispositivo móvil o táctil (celular/tablet)
const isMobileDevice = Boolean(
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
  (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 2)
);

      // 2. Verificar si tiene cámaras disponibles
      let hasVideoInput = false;
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          hasVideoInput = devices.some(device => device.kind === "videoinput");
        } catch (err) {
          console.error("Error al detectar la cámara:", err);
        }
      }

      // Forzamos un booleano estricto para evitar que React renderice un "0"
      setShowCameraButton(Boolean(isMobileDevice && hasVideoInput));
      setIsCheckingDevice(false);
    }

    checkDeviceCapabilities();
  }, []);

  return (
    <>
      <div className="mb-6 flex flex-col items-center justify-center p-6 md:p-10 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors text-center group w-full">
        <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-105 transition-transform duration-300">
          <Camera className="w-8 h-8 md:w-10 md:h-10 text-slate-400" />
        </div>
        
        <h3 className="text-lg md:text-xl font-bold text-slate-700 mb-1">Cargar Facturas</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-xs md:max-w-md">
          {showCameraButton 
            ? "Toma una foto directamente desde tu celular o selecciona imágenes de tu galería."
            : "Selecciona o arrastra las imágenes de tu factura desde tus archivos."}
        </p>
        
        {/* Contenedor de botones */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto">
          
          {/* Botón de Cámara - Solo se muestra en Celulares/Tablets con cámara */}
          {!isCheckingDevice && showCameraButton && (
            <label className="cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-medium shadow-sm transition-all active:scale-[0.98] select-none touch-manipulation">
              <Camera className="w-5 h-5" />
              <span>Tomar Foto</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onFileChange}
              />
            </label>
          )}

          {/* Botón de Galería (Se muestra siempre) */}
          {!isCheckingDevice && (
            <label className={`cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium shadow-sm transition-all active:scale-[0.98] select-none touch-manipulation ${
              showCameraButton 
                ? "bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 text-slate-700" 
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white" 
            }`}>
              <ImagePlus className="w-5 h-5" />
              <span>Subir Archivos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onFileChange}
              />
            </label>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
          {error}
        </div>
      )}
    </>
  );
}