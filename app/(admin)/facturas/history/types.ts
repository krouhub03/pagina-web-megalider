export interface TipoOperacion {
  id: number;
  codigo: string;
  nombre: string;
  cuentaPucDebito: string;
}

export interface MedioPago {
  id: number;
  codigo: string;
  nombre: string;
}

export interface FacturaHistorial {
  id: number;
  numeroFactura: string;
  tipoDocumento: string | null;
  cufe: string | null;
  fechaEmision: string;
  proveedorId: number;
  proveedor?: {
    id: number;
    nit: string;
    razonSocial: string;
  } | null;
  tipoOperacionId: number | null;
  tipoOperacion?: TipoOperacion | null;
  medioPagoId: number | null;
  medioPagoRel?: MedioPago | null;
  cuentaTesoreriaId: number | null;
  cuentaTesoreria?: {
    id: number;
    nombreCuenta: string;
    codigoPuc: string;
  } | null;
  estadoContable: "PENDIENTE_CONCILIACION" | "CONCILIADA" | "PAGADA";
  subtotal: string;
  iva: string;
  impoconsumo: string;
  otrosImpuestosTotal: string;
  totalFactura: string;
  observaciones: string | null;
  items: any[];
}