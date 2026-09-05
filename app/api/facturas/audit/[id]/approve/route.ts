import { NextRequest, NextResponse } from "next/server";
import { dbPostgres, schema as pgSchema } from "@/lib/db/postgres";
import { dbMysql, schema as mysqlSchema } from "@/lib/db/mysql";
import { eq, and, sql } from "drizzle-orm";
import { generarAsientoContable } from "@/lib/contabilidad/motor-asientos";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // 1. Obtener la factura de PostgreSQL
    const auditInvoice = await dbPostgres.query.facturasAuditoria.findFirst({
      where: eq(pgSchema.facturasAuditoria.id, parseInt(id)),
    });

    if (!auditInvoice || !auditInvoice.datosExtraidos) {
      return NextResponse.json({ error: "Factura no encontrada o sin datos" }, { status: 404 });
    }

    // Obtener archivos digitalizados de la factura desde PostgreSQL
    const archivosPostgres = await dbPostgres
      .select()
      .from(pgSchema.facturasAuditoriaArchivos)
      .where(eq(pgSchema.facturasAuditoriaArchivos.facturaAuditoriaId, parseInt(id)))
      .orderBy(pgSchema.facturasAuditoriaArchivos.orden);

    const firstImage = archivosPostgres[0]?.datosBase64Censurada || archivosPostgres[0]?.datosBase64 || null;

    const data = JSON.parse(auditInvoice.datosExtraidos);
    const invoiceData = data.factura_compra || data;
    
    if (!invoiceData || !invoiceData.proveedor) {
      return NextResponse.json({ error: "Estructura JSON inválida" }, { status: 400 });
    }

    // Parámetros de auditoría
    const body = await req.json().catch(() => ({}));
    const observaciones = body.observaciones || invoiceData.observaciones || null;
    const tipoOperacionId = body.tipoOperacionId ? Number(body.tipoOperacionId) : null;
    const medioPagoId = body.medioPagoId ? Number(body.medioPagoId) : null;

    // Obtener Tipo de Operación
    let tipoOp = null;
    if (tipoOperacionId) {
      tipoOp = await dbMysql.query.tiposOperacion.findFirst({
        where: eq(mysqlSchema.tiposOperacion.id, tipoOperacionId),
      });
    }

    if (!tipoOp) {
      // Fallback a COMPRA_INVENTARIO si no se especificó
      tipoOp = await dbMysql.query.tiposOperacion.findFirst({
        where: eq(mysqlSchema.tiposOperacion.codigo, "COMPRA_INVENTARIO"),
      });
    }

    // 2. Transacción en MySQL
    
    // a. Asegurar que el proveedor exista, si no crearlo
    let proveedorId;
    const existingProveedor = await dbMysql.query.proveedores.findFirst({
      where: eq(mysqlSchema.proveedores.nit, invoiceData.proveedor.nit),
    });

    if (existingProveedor) {
      proveedorId = existingProveedor.id;
    } else {
      const insertProvResult = await dbMysql.insert(mysqlSchema.proveedores).values({
        nit: invoiceData.proveedor.nit,
        razonSocial: invoiceData.proveedor.razon_social,
      });
      proveedorId = insertProvResult[0].insertId;
    }

    const existingFactura = await dbMysql.query.facturas.findFirst({
      where: and(
        eq(mysqlSchema.facturas.proveedorId, proveedorId),
        eq(mysqlSchema.facturas.numeroFactura, invoiceData.numero_factura)
      )
    });

    if (existingFactura) {
      return NextResponse.json({
        success: false,
        error: `La factura N° ${invoiceData.numero_factura} ya existe para este proveedor en el Historial.`
      }, { status: 400 });
    }

    // b. Formatear Fechas
    const parseDate = (dString: string) => {
      if (!dString) return null;
      if (dString.includes('-')) return new Date(dString);
      const parts = dString.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) return new Date(dString.replace(/\//g, '-'));
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
      return new Date(dString);
    };
    
    const parseDateToString = (dateStr: any) => {
      const d = parseDate(dateStr);
      if (!d) return null;
      return d.toISOString().split('T')[0];
    };

    const fechaEmision = parseDateToString(invoiceData.fecha_emision) || new Date().toISOString().split('T')[0];
    const fechaVencimiento = parseDateToString(invoiceData.fecha_vencimiento);

    const subtotal = invoiceData.totales?.subtotal || "0.00";
    const iva = String((Number(invoiceData.totales?.iva_19 || 0) + Number(invoiceData.totales?.iva_5 || 0)));
    const impoconsumo = invoiceData.totales?.impoconsumo_total || "0.00";
    const otrosImpuestosTotal = invoiceData.totales?.otros_impuestos_total || "0.00";
    const totalFactura = invoiceData.totales?.total_factura || "0.00";

    const insertInvoiceResult = await dbMysql.insert(mysqlSchema.facturas).values({
      numeroFactura: invoiceData.numero_factura,
      tipoDocumento: invoiceData.tipo_documento || null,
      cufe: invoiceData.cufe || null,
      proveedorId: proveedorId,
      tipoOperacionId: tipoOp?.id || null,
      medioPagoId: medioPagoId || null,
      estadoRemision: tipoOp?.esRemision ? "PENDIENTE_FACTURAR" : "NO_APLICA",
      estadoContable: "PENDIENTE_CONCILIACION",
      fechaEmision: fechaEmision,
      fechaVencimiento: fechaVencimiento,
      clienteDocumento: invoiceData.cliente_receptor?.documento || null,
      clienteNombre: invoiceData.cliente_receptor?.nombre || null,
      medioPago: invoiceData.condiciones_comerciales?.medio_pago || null,
      condicionPago: (invoiceData.condiciones_comerciales?.plazo_dias || invoiceData.condiciones_comerciales?.forma_pago || null)?.toString(),
      subtotal: subtotal,
      descuentoTotalFactura: invoiceData.totales?.descuento_total_factura || "0.00",
      iva: iva,
      impoconsumo: impoconsumo,
      ibuaIpcu: invoiceData.totales?.ibua_ipcu || "0.00",
      otrosImpuestosTotal: otrosImpuestosTotal,
      totalFactura: totalFactura,
      archivoUrl: firstImage,
      observaciones: observaciones,
    });
    const newInvoiceId = insertInvoiceResult[0].insertId;

    // Guardar archivos en MySQL factura_archivos
    if (archivosPostgres && archivosPostgres.length > 0) {
      for (let i = 0; i < archivosPostgres.length; i++) {
        const arch = archivosPostgres[i];
        const dataB64 = arch.datosBase64Censurada || arch.datosBase64;
        if (dataB64) {
          await dbMysql.insert(mysqlSchema.facturaArchivos).values({
            facturaId: newInvoiceId,
            nombreArchivo: `factura_${invoiceData.numero_factura || newInvoiceId}_p${i + 1}.jpg`,
            tipoMime: dataB64.startsWith("data:image/png") ? "image/png" : "image/jpeg",
            datosBase64: dataB64,
          });
        }
      }
    }

    // c. Insertar items
    if (invoiceData.items && invoiceData.items.length > 0) {
      const itemsToInsert = invoiceData.items.map((item: any) => ({
        facturaId: newInvoiceId,
        codigoBarras: item.codigo_barras || null,
        codigoProveedor: item.codigo_proveedor || null,
        nombreProducto: item.nombre_producto || item.nombre || item.descripcion || "",
        cantidadIngresada: item.cantidad_ingresada,
        unidadMedida: item.unidad_medida || 'UND',
        costoUnitarioCompra: item.costo_unitario_compra,
        descuentoPorProducto: item.descuento_por_producto || "0.00",
        ivaTotal: item.iva_total || "0.00",
        porcentajeIva: item.porcentaje_iva || "0.00",
        impuestoConsumo: item.impoconsumo || "0.00",
        otrosImpuestos: item.otros_impuestos || "0.00",
        costoTotalLinea: item.costo_total_linea,
      }));
      await dbMysql.insert(mysqlSchema.facturaItems).values(itemsToInsert);

      // d. Si afecta inventario, sincronizar stock de productos
      if (tipoOp?.afectaInventario) {
        for (const it of itemsToInsert) {
          if (it.codigoBarras) {
            await dbMysql.update(mysqlSchema.productos)
              .set({
                stockActual: sql`${mysqlSchema.productos.stockActual} + ${Math.round(Number(it.cantidadIngresada))}`,
                precioCompra: String(it.costoUnitarioCompra),
              })
              .where(eq(mysqlSchema.productos.codigoBarras, it.codigoBarras));
          }
        }
      }
    }

    // e. Generar Asiento Contable Inicial en el Libro Diario
    if (tipoOp) {
      const resultadoAsiento = generarAsientoContable({
        factura: {
          id: newInvoiceId,
          numeroFactura: invoiceData.numero_factura,
          subtotal,
          iva,
          impoconsumo,
          otrosImpuestosTotal,
          totalFactura,
          proveedorNombre: invoiceData.proveedor.razon_social,
        },
        tipoOperacion: {
          codigo: tipoOp.codigo,
          nombre: tipoOp.nombre,
          cuentaPucDebito: tipoOp.cuentaPucDebito,
          cuentaPucCredito: tipoOp.cuentaPucCredito,
          afectaInventario: tipoOp.afectaInventario,
          esRemision: tipoOp.esRemision,
        },
      });

      if (resultadoAsiento.estaBalanceado) {
        for (const linea of resultadoAsiento.asientos) {
          await dbMysql.insert(mysqlSchema.facturaAsientos).values({
            facturaId: newInvoiceId,
            cuentaPuc: linea.cuentaPuc,
            concepto: linea.concepto,
            debito: linea.debito,
            credito: linea.credito,
          });
        }
      }
    }

    // 3. Purga en PostgreSQL
    await dbPostgres.delete(pgSchema.facturasAuditoria).where(eq(pgSchema.facturasAuditoria.id, parseInt(id)));

    return NextResponse.json({
      success: true,
      message: "Factura aprobada y consolidada en el historial con asiento contable",
      facturaId: newInvoiceId,
    });
  } catch (error) {
    console.error("Error en aprobación de factura:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
