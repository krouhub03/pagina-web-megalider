export interface PucCuentaItem {
  codigo: string;
  nombre: string | null;
  nivel: number | null;
  naturaleza: string | null;
  descripcion: string | null;
  creadoEn?: string | Date | null;
}

export interface FiltrosPuc {
  search?: string;
  nivel?: number;
  naturaleza?: string;
  tipoEstado?: "BALANCE_GENERAL" | "ESTADO_RESULTADOS";
}

export type TipoEstadoFinanciero = "BALANCE_GENERAL" | "ESTADO_RESULTADOS";

export interface ClasePucInfo {
  clase: number;
  nombre: string;
  tipoEstado: TipoEstadoFinanciero;
  naturalezaDominante: "DEBITO" | "CREDITO";
  descripcion: string;
}

export const CLASES_PUC_MAP: Record<number, ClasePucInfo> = {
  1: {
    clase: 1,
    nombre: "Activo",
    tipoEstado: "BALANCE_GENERAL",
    naturalezaDominante: "DEBITO",
    descripcion: "Bienes y derechos tangibles e intangibles que generarán beneficios económicos futuros.",
  },
  2: {
    clase: 2,
    nombre: "Pasivo",
    tipoEstado: "BALANCE_GENERAL",
    naturalezaDominante: "CREDITO",
    descripcion: "Obligaciones financieras y deudas contraídas con terceros.",
  },
  3: {
    clase: 3,
    nombre: "Patrimonio",
    tipoEstado: "BALANCE_GENERAL",
    naturalezaDominante: "CREDITO",
    descripcion: "Valor neto que pertenece a los dueños, socios o accionistas (aportes + resultados acumulados).",
  },
  4: {
    clase: 4,
    nombre: "Ingresos",
    tipoEstado: "ESTADO_RESULTADOS",
    naturalezaDominante: "CREDITO",
    descripcion: "Beneficios económicos percibidos por la venta de bienes, servicios u otros conceptos.",
  },
  5: {
    clase: 5,
    nombre: "Gastos",
    tipoEstado: "ESTADO_RESULTADOS",
    naturalezaDominante: "DEBITO",
    descripcion: "Cargos operativos, administrativos y financieros indispensables para el desarrollo de la actividad.",
  },
  6: {
    clase: 6,
    nombre: "Costos de Ventas",
    tipoEstado: "ESTADO_RESULTADOS",
    naturalezaDominante: "DEBITO",
    descripcion: "Inversión acumulada ligada a la adquisición o fabricación de productos o servicios vendidos.",
  },
  7: {
    clase: 7,
    nombre: "Costos de Producción o de Operación",
    tipoEstado: "ESTADO_RESULTADOS",
    naturalezaDominante: "DEBITO",
    descripcion: "Erogaciones directas e indirectas durante el proceso de manufactura o prestación del servicio.",
  },
};

export function calcularNivelPuc(codigo: string): number {
  const len = codigo.trim().length;
  if (len === 1) return 1; // Clase
  if (len === 2) return 2; // Grupo
  if (len <= 4) return 3; // Cuenta
  if (len <= 6) return 4; // Subcuenta
  return 5; // Auxiliar
}

export function obtenerInfoClasePuc(codigo: string): ClasePucInfo | null {
  if (!codigo || codigo.trim().length === 0) return null;
  const primerDigito = parseInt(codigo.trim().charAt(0), 10);
  return CLASES_PUC_MAP[primerDigito] || null;
}

export function obtenerTipoEstadoFinanciero(codigo: string): TipoEstadoFinanciero | "DESCONOCIDO" {
  const info = obtenerInfoClasePuc(codigo);
  return info ? info.tipoEstado : "DESCONOCIDO";
}

