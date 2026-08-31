/**
 * Helper de Clasificación Financiera para Cigarrería Megalider
 * Permite la doble lectura en el Dashboard:
 * 1. Flujo de Caja (Liquidez saliente total)
 * 2. Estado de Pérdidas y Ganancias (P&G / Gastos Operativos de la Clase 5 del PUC)
 */

export type TipoNaturalezaFinanciera =
  | "GASTO_OPERATIVO"   // Impacta P&G y Flujo de Caja (Clase 5 PUC - Arriendo, luz, nómina, publicidad)
  | "COMPRA_INVENTARIO" // Impacta Flujo de Caja / Activo (Clase 14 PUC - Mercancía para reventa)
  | "ACTIVO_FIJO"        // Impacta Flujo de Caja / CAPEX (Clase 15 PUC - Congeladores, vitrinas, equipos)
  | "PAGO_DEUDA"        // Impacta Flujo de Caja / Pasivo (Clase 2 PUC - Bancos, proveedores)
  | "RETIRO_PERSONAL"   // Impacta Flujo de Caja / Patrimonio (Clase 3 PUC - Retiros de socio)
  | "INGRESO_OPERATIVO" // Impacta P&G (Clase 4 PUC - Ventas de mercancía)
  | "COSTO_VENTAS"      // Impacta P&G (Clase 6 PUC - Costo de ventas de productos)
  | "COSTO_OPERACION";  // Impacta P&G (Clase 7 PUC - Costos de producción/operación)

export interface InfoNaturalezaFinanciera {
  tipo: TipoNaturalezaFinanciera;
  label: string;
  badgeClass: string;
  iconName: string;
  esGastoPyG: boolean; // Si es true, afecta el Estado de Pérdidas y Ganancias
  clasePucDefault: number;
  descripcionCorta: string;
}

export const MAPA_NATURALEZA_FINANCIERA: Record<TipoNaturalezaFinanciera, InfoNaturalezaFinanciera> = {
  GASTO_OPERATIVO: {
    tipo: "GASTO_OPERATIVO",
    label: "Gasto Operativo (P&G)",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    iconName: "TrendingDown",
    esGastoPyG: true,
    clasePucDefault: 5,
    descripcionCorta: "Consumo operativo del mes (Arriendo, Servicios, Nómina)",
  },
  COMPRA_INVENTARIO: {
    tipo: "COMPRA_INVENTARIO",
    label: "Compra de Inventario",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
    iconName: "Package",
    esGastoPyG: false,
    clasePucDefault: 1,
    descripcionCorta: "Mercancía adquirida para reventa",
  },
  ACTIVO_FIJO: {
    tipo: "ACTIVO_FIJO",
    label: "Inversión / Activo Fijo",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
    iconName: "Building2",
    esGastoPyG: false,
    clasePucDefault: 1,
    descripcionCorta: "Equipos, congeladores o bienes de la tienda (CAPEX)",
  },
  PAGO_DEUDA: {
    tipo: "PAGO_DEUDA",
    label: "Pago de Deuda / Préstamo",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    iconName: "CreditCard",
    esGastoPyG: false,
    clasePucDefault: 2,
    descripcionCorta: "Abono a cuota bancaria o crédito de proveedor",
  },
  RETIRO_PERSONAL: {
    tipo: "RETIRO_PERSONAL",
    label: "Retiro Personal / Socio",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
    iconName: "UserCheck",
    esGastoPyG: false,
    clasePucDefault: 3,
    descripcionCorta: "Retiro directo de caja por parte del propietario",
  },
  INGRESO_OPERATIVO: {
    tipo: "INGRESO_OPERATIVO",
    label: "Ingreso Operativo (Ventas)",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-300",
    iconName: "TrendingUp",
    esGastoPyG: false,
    clasePucDefault: 4,
    descripcionCorta: "Venta de mercancías o prestaciones de servicios",
  },
  COSTO_VENTAS: {
    tipo: "COSTO_VENTAS",
    label: "Costo de Ventas (COGS)",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-300",
    iconName: "ShoppingCart",
    esGastoPyG: true,
    clasePucDefault: 6,
    descripcionCorta: "Costo directo de la mercancía vendida",
  },
  COSTO_OPERACION: {
    tipo: "COSTO_OPERACION",
    label: "Costo de Operación",
    badgeClass: "bg-cyan-100 text-cyan-800 border-cyan-300",
    iconName: "Wrench",
    esGastoPyG: true,
    clasePucDefault: 7,
    descripcionCorta: "Costos directos e indirectos de operación/servicios",
  },
};

/**
 * Determina la naturaleza financiera a partir del codigo_puc, tipo_egreso o descripcion.
 */
export function obtenerNaturalezaFinanciera(input: {
  codigoPuc?: string | null;
  tipoEgreso?: string | null;
  categoriaNombre?: string | null;
  descripcion?: string | null;
}): InfoNaturalezaFinanciera {
  const puc = input.codigoPuc?.trim() || "";
  const tipo = (input.tipoEgreso || "").toUpperCase().trim();
  const desc = (input.descripcion || "").toLowerCase();
  const cat = (input.categoriaNombre || "").toLowerCase();

  // 1. Evaluación por Código PUC (Normatividad Contable de Colombia - Clases 1 a 7)
  if (puc.startsWith("7")) return MAPA_NATURALEZA_FINANCIERA.COSTO_OPERACION;
  if (puc.startsWith("6")) return MAPA_NATURALEZA_FINANCIERA.COSTO_VENTAS;
  if (puc.startsWith("5")) return MAPA_NATURALEZA_FINANCIERA.GASTO_OPERATIVO;
  if (puc.startsWith("4")) return MAPA_NATURALEZA_FINANCIERA.INGRESO_OPERATIVO;
  if (puc.startsWith("3")) return MAPA_NATURALEZA_FINANCIERA.RETIRO_PERSONAL;
  if (puc.startsWith("2")) return MAPA_NATURALEZA_FINANCIERA.PAGO_DEUDA;
  if (puc.startsWith("14")) return MAPA_NATURALEZA_FINANCIERA.COMPRA_INVENTARIO;
  if (puc.startsWith("15")) return MAPA_NATURALEZA_FINANCIERA.ACTIVO_FIJO;
  if (puc.startsWith("1")) return MAPA_NATURALEZA_FINANCIERA.ACTIVO_FIJO;

  // 2. Evaluación por Coincidencia Exacta en tipo_egreso
  if (tipo === "GASTO_OPERATIVO" || tipo === "GASTO OPERATIVO" || tipo === "GASTO") {
    return MAPA_NATURALEZA_FINANCIERA.GASTO_OPERATIVO;
  }
  if (tipo === "COMPRA_INVENTARIO" || tipo === "COMPRA INVENTARIO" || tipo === "INVENTARIO" || tipo === "COMPRA") {
    return MAPA_NATURALEZA_FINANCIERA.COMPRA_INVENTARIO;
  }
  if (tipo === "ACTIVO_FIJO" || tipo === "ACTIVO FIJO" || tipo === "ACTIVO" || tipo === "EQUIPO") {
    return MAPA_NATURALEZA_FINANCIERA.ACTIVO_FIJO;
  }
  if (tipo === "PAGO_DEUDA" || tipo === "PAGO DEUDA" || tipo === "DEUDA" || tipo === "PRESTAMO") {
    return MAPA_NATURALEZA_FINANCIERA.PAGO_DEUDA;
  }
  if (tipo === "RETIRO_PERSONAL" || tipo === "RETIRO PERSONAL" || tipo === "RETIRO") {
    return MAPA_NATURALEZA_FINANCIERA.RETIRO_PERSONAL;
  }
  if (tipo === "INGRESO_OPERATIVO" || tipo === "INGRESO") {
    return MAPA_NATURALEZA_FINANCIERA.INGRESO_OPERATIVO;
  }
  if (tipo === "COSTO_VENTAS" || tipo === "COSTO VENTAS" || tipo === "COSTO") {
    return MAPA_NATURALEZA_FINANCIERA.COSTO_VENTAS;
  }
  if (tipo === "COSTO_OPERACION" || tipo === "COSTO OPERACION") {
    return MAPA_NATURALEZA_FINANCIERA.COSTO_OPERACION;
  }

  // 3. Evaluación Semántica por Descripción / Categoría
  if (desc.includes("congelador") || desc.includes("vitrina") || desc.includes("computador") || desc.includes("refrigerador")) {
    return MAPA_NATURALEZA_FINANCIERA.ACTIVO_FIJO;
  }
  if (desc.includes("prestamo") || desc.includes("cuota banco") || desc.includes("abono banco") || desc.includes("credito")) {
    return MAPA_NATURALEZA_FINANCIERA.PAGO_DEUDA;
  }
  if (desc.includes("almuerzo socio") || desc.includes("retiro personal") || desc.includes("retiro brian")) {
    return MAPA_NATURALEZA_FINANCIERA.RETIRO_PERSONAL;
  }
  if (desc.includes("mercancia") || cat.includes("mercancia") || cat.includes("inventario")) {
    return MAPA_NATURALEZA_FINANCIERA.COMPRA_INVENTARIO;
  }

  // Fallback por defecto a Gasto Operativo
  return MAPA_NATURALEZA_FINANCIERA.GASTO_OPERATIVO;
}

