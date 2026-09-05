export interface FacturaAsientoInput {
  id: number;
  numeroFactura: string;
  subtotal: number | string;
  iva: number | string;
  impoconsumo?: number | string;
  otrosImpuestosTotal?: number | string;
  totalFactura: number | string;
  proveedorNombre?: string;
}

export interface TipoOperacionInput {
  codigo: string;
  nombre: string;
  cuentaPucDebito: string;
  cuentaPucCredito?: string | null;
  afectaInventario: boolean;
  esRemision?: boolean;
}

export interface CuentaTesoreriaInput {
  codigoPuc: string;
  nombreCuenta: string;
}

export interface RetencionAplicadaInput {
  cuentaPuc: string;
  nombreRetencion: string;
  valorRetenido: number | string;
}

export interface LineaAsientoGenerada {
  cuentaPuc: string;
  concepto: string;
  debito: string;
  credito: string;
}

export interface ResultadoAsientoContable {
  asientos: LineaAsientoGenerada[];
  totalDebitos: number;
  totalCreditos: number;
  diferencia: number;
  estaBalanceado: boolean;
}

/**
 * Genera las líneas de asiento contable bajo principio de Partida Doble (NIIF Colombia).
 * Garantiza que SUM(Débitos) === SUM(Créditos).
 */
export function generarAsientoContable(params: {
  factura: FacturaAsientoInput;
  tipoOperacion: TipoOperacionInput;
  cuentaTesoreria?: CuentaTesoreriaInput | null;
  retenciones?: RetencionAplicadaInput[];
}): ResultadoAsientoContable {
  const { factura, tipoOperacion, cuentaTesoreria, retenciones = [] } = params;
  
  const subtotalRaw = Number(factura.subtotal) || 0;
  const iva = Number(factura.iva) || 0;
  const impoconsumo = Number(factura.impoconsumo) || 0;
  const otrosImp = Number(factura.otrosImpuestosTotal) || 0;
  const totalFacturaRaw = Number(factura.totalFactura) || 0;

  // Garantizar coherencia contable entre base y total
  const sumaImpuestos = iva + impoconsumo + otrosImp;
  let subtotalBase = subtotalRaw;

  if (totalFacturaRaw > 0 && Math.abs((subtotalRaw + sumaImpuestos) - totalFacturaRaw) > 0.05) {
    // Si el total almacenado difiere de subtotal + impuestos, ajustar base para cuadre exacto
    subtotalBase = Math.max(0, totalFacturaRaw - sumaImpuestos);
  } else if (subtotalRaw <= 0 && totalFacturaRaw > 0) {
    subtotalBase = Math.max(0, totalFacturaRaw - sumaImpuestos);
  }

  const totalCalculado = subtotalBase + sumaImpuestos;
  const totalFactura = totalFacturaRaw > 0 ? totalFacturaRaw : totalCalculado;

  const lineas: LineaAsientoGenerada[] = [];

  // 1. DÉBITO PRINCIPAL: Base de la Operación (Inventario, Gasto, Activo, etc.)
  lineas.push({
    cuentaPuc: tipoOperacion.cuentaPucDebito,
    concepto: `${tipoOperacion.nombre} - Factura ${factura.numeroFactura}`,
    debito: subtotalBase.toFixed(2),
    credito: "0.00",
  });

  // 2. DÉBITO IMPUESTOS: IVA Descontable
  if (iva > 0) {
    lineas.push({
      cuentaPuc: "240802", // IVA Descontable
      concepto: `IVA Descontable - Factura ${factura.numeroFactura}`,
      debito: iva.toFixed(2),
      credito: "0.00",
    });
  }

  // 3. DÉBITO IMPUESTOS: Impoconsumo Compras
  if (impoconsumo > 0) {
    lineas.push({
      cuentaPuc: "240810", // Impoconsumo
      concepto: `Impoconsumo Compras - Factura ${factura.numeroFactura}`,
      debito: impoconsumo.toFixed(2),
      credito: "0.00",
    });
  }

  // 4. DÉBITO IMPUESTOS: Otros Impuestos (IBUA / IPCU)
  if (otrosImp > 0) {
    lineas.push({
      cuentaPuc: "511570", // Otros Impuestos
      concepto: `Otros Impuestos (IBUA) - Factura ${factura.numeroFactura}`,
      debito: otrosImp.toFixed(2),
      credito: "0.00",
    });
  }

  // 5. CRÉDITO RETENCIONES EN LA FUENTE (Pasivo fiscal retenido)
  let totalRetenido = 0;
  for (const ret of retenciones) {
    const vRet = Number(ret.valorRetenido) || 0;
    if (vRet > 0) {
      totalRetenido += vRet;
      lineas.push({
        cuentaPuc: ret.cuentaPuc,
        concepto: `${ret.nombreRetencion} - Factura ${factura.numeroFactura}`,
        debito: "0.00",
        credito: vRet.toFixed(2),
      });
    }
  }

  // 6. CRÉDITO DE CONTRAPARTIDA O PAGO
  // Neto a pagar o causar = Total Débitos - Total Retenido
  const netoPasivo = Math.max(0, (subtotalBase + sumaImpuestos) - totalRetenido);

  if (cuentaTesoreria && cuentaTesoreria.codigoPuc) {
    // Si ya se especificó la cuenta de tesorería (pago inmediato de contado)
    lineas.push({
      cuentaPuc: cuentaTesoreria.codigoPuc,
      concepto: `Pago desde ${cuentaTesoreria.nombreCuenta} - Factura ${factura.numeroFactura}`,
      debito: "0.00",
      credito: netoPasivo.toFixed(2),
    });
  } else {
    // Si no se ha cancelado o es provisión, va a Proveedores o Pasivo Transitorio
    const cuentaCredito = tipoOperacion.cuentaPucCredito || (tipoOperacion.esRemision ? "220595" : "220505");
    const conceptoCredito = tipoOperacion.esRemision 
      ? `Provisión Mercancía por Facturar - Remisión ${factura.numeroFactura}`
      : `Obligación Proveedor ${factura.proveedorNombre || ''} - Factura ${factura.numeroFactura}`.trim();

    lineas.push({
      cuentaPuc: cuentaCredito,
      concepto: conceptoCredito,
      debito: "0.00",
      credito: netoPasivo.toFixed(2),
    });
  }

  // 7. Verificación de Balance
  const totalDebitos = lineas.reduce((acc, l) => acc + Number(l.debito), 0);
  const totalCreditos = lineas.reduce((acc, l) => acc + Number(l.credito), 0);
  const diferencia = Math.abs(totalDebitos - totalCreditos);
  const estaBalanceado = diferencia < 0.05; // Margen de centavos por redondeo

  return {
    asientos: lineas,
    totalDebitos,
    totalCreditos,
    diferencia,
    estaBalanceado,
  };
}
