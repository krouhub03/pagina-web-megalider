export interface FacturaItemEdit {
  id?: number;
  nombreProducto: string;
  codigoBarras?: string | null;
  codigoProveedor?: string | null;
  cantidadIngresada: number | string;
  unidadMedida?: string | null;
  costoUnitarioCompra: number | string;
  descuentoPorProducto?: number | string;
  ivaTotal?: number | string;
  porcentajeIva?: number | string;
  impuestoConsumo?: number | string;
  otrosImpuestos?: number | string;
  costoTotalLinea?: number | string;
}

export interface ModalEditarFacturaHistorialProps {
  facturaId: number;
  onClose: () => void;
  onSuccess: () => void;
}