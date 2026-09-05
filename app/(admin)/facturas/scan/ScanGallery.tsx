import { EyeOff, X } from "lucide-react";

interface Props {
  previews: string[];
  censoredImages: Record<number, string>;
  onClearAll: () => void;
  onRemoveFile: (index: number) => void;
  onEditIndex: (index: number) => void;
}

export function ScanGallery({ previews, censoredImages, onClearAll, onRemoveFile, onEditIndex }: Props) {
  if (previews.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="font-semibold text-gray-700">Páginas seleccionadas ({previews.length})</h3>
          <p className="text-xs text-gray-500">
            Haz clic en cualquier página para <span className="font-semibold text-rose-600">censurar datos confidenciales</span> antes de enviarla a la IA.
          </p>
        </div>
        <button onClick={onClearAll} className="text-sm text-red-600 hover:underline">
          Descartar todo
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {previews.map((preview, index) => (
          <div 
            key={index} 
            className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-[3/4] cursor-pointer shadow-sm hover:shadow-md transition bg-gray-900"
            onClick={() => onEditIndex(index)}
          >
            <img 
              src={censoredImages[index] || preview} 
              alt={`Página ${index + 1}`} 
              className="w-full h-full object-cover transition transform group-hover:scale-105" 
            />
            {censoredImages[index] && (
              <div className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                <EyeOff className="w-3 h-3" />
                <span>Censurada</span>
              </div>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); onRemoveFile(index); }}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow"
              title="Eliminar página"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 text-white text-xs p-2 flex items-center justify-between backdrop-blur-xs">
              <span className="font-medium">Pág. {index + 1}</span>
              <span className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                <EyeOff className="w-3 h-3" /> Censurar
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}