import { Camera, Upload, ImagePlus } from "lucide-react";

export function ScanUploader({ 
  onFileChange, 
  error 
}: { 
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string | null;
}) {
  return (
    <>
      <div className="mb-6 flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-center">
        <Camera className="w-12 h-12 text-slate-400 mb-3" />
        <h3 className="font-semibold text-slate-700 mb-1">Cargar Facturas</h3>
        <p className="text-slate-500 text-sm mb-5">
          Toma una foto directamente o selecciona imágenes de tu galería
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Botón exclusivo para abrir la Cámara en móviles */}
          <label className="cursor-pointer bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto">
            <Camera className="w-5 h-5" />
            Tomar Foto
            <input
              type="file"
              accept="image/*"
              capture="environment" // Fuerza la cámara trasera en móviles
              className="hidden"
              onChange={onFileChange}
            />
          </label>

          {/* Botón para abrir la Galería o Explorador de Archivos */}
          <label className="cursor-pointer bg-white border border-slate-300 text-slate-700 px-5 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto">
            <ImagePlus className="w-5 h-5 text-slate-500" />
            Subir desde Archivos
            <input
              type="file"
              accept="image/*"
              multiple // Permite seleccionar varios archivos a la vez
              className="hidden"
              onChange={onFileChange}
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}
    </>
  );
}