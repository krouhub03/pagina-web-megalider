export interface MedioPago {
  id: number;
  codigo: string;
  nombre: string;
}

export interface CuentaTesoreria {
  id: number;
  nombreCuenta: string;
  codigoPuc: string;
  medioPagoId?: number;
  medioPago?: {
    id: number;
    nombre: string;
  } | null;
}

export interface TipoRetencion {
  id: number;
  codigo: string;
  nombre: string;
  porcentaje: string | number;
  cuentaPuc: string;
}

export interface AsientoItem {
  id?: number;
  cuentaPuc: string;
  concepto: string;
  debito: string | number;
  credito: string | number;
}

export interface ModalConciliacionFacturaProps {
  factura: {
    id: number;
    numeroFactura: string;
    totalFactura: string | number;
    subtotal?: string | number;
    iva?: string | number;
    estadoContable?: string;
    medioPagoId?: number | null;
    medioPagoRel?: {
      id: number;
      nombre: string;
    } | null;
    cuentaTesoreriaId?: number | null;
    cuentaTesoreria?: {
      id: number;
      nombreCuenta: string;
      codigoPuc: string;
    } | null;
    proveedor?: {
      razonSocial?: string;
      nit?: string;
    } | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}