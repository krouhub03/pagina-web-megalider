import {
  pgTable,
  serial,
  varchar,
  text,
  numeric,
  boolean,
  date,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Proveedores
export const proveedores = pgTable(
  "proveedores",
  {
    id: serial("id").primaryKey(),
    nit: varchar("nit", { length: 50 }).notNull().unique(),
    razonSocial: varchar("razon_social", { length: 255 }).notNull(),
    creadoEn: timestamp("creado_en", { mode: "string" }).defaultNow(),
  }
);

// 2. Facturas de Compra de Mercancía
export const facturas = pgTable(
  "facturas",
  {
    id: serial("id").primaryKey(),
    numeroFactura: varchar("numero_factura", { length: 100 }).notNull().unique(),
    cufe: varchar("cufe", { length: 255 }),
    documentoReferencia: varchar("documento_referencia", { length: 100 }),
    fechaEmision: date("fecha_emision", { mode: "string" }).notNull(),
    fechaVencimiento: date("fecha_vencimiento", { mode: "string" }),
    proveedorId: integer("proveedor_id").references(() => proveedores.id, {
      onDelete: "restrict",
    }),
    clienteDocumento: varchar("cliente_documento", { length: 50 }),
    clienteNombre: varchar("cliente_nombre", { length: 255 }),
    condicionPago: varchar("condicion_pago", { length: 100 }),
    medioPago: varchar("medio_pago", { length: 100 }),
    subtotal: numeric("subtotal").default("0"),
    descuentoTotalFactura: numeric("descuento_total_factura").default("0"),
    iva: numeric("iva").default("0"),
    impoconsumo: numeric("impoconsumo").default("0"),
    ibuaIpcu: numeric("ibua_ipcu").default("0"),
    otrosImpuestosTotal: numeric("otros_impuestos_total").default("0"),
    totalFactura: numeric("total_factura").default("0"),
    observaciones: text("observaciones"),
    creadoEn: timestamp("creado_en", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("idx_facturas_proveedor").on(table.proveedorId),
    index("idx_facturas_fecha").on(table.fechaEmision),
  ]
);

// 3. Items / Líneas de Factura
export const facturaItems = pgTable(
  "factura_items",
  {
    id: serial("id").primaryKey(),
    facturaId: integer("factura_id").references(() => facturas.id, {
      onDelete: "cascade",
    }),
    codigoBarras: varchar("codigo_barras", { length: 100 }),
    codigoProveedor: varchar("codigo_proveedor", { length: 100 }),
    descripcion: text("descripcion").notNull(),
    cantidadIngresada: numeric("cantidad_ingresada").notNull(),
    unidadMedida: varchar("unidad_medida", { length: 50 }),
    costoUnitarioCompra: numeric("costo_unitario_compra").notNull(),
    descuentoPorProducto: numeric("descuento_por_producto").default("0"),
    ivaTotal: numeric("iva_total").default("0"),
    porcentajeIva: numeric("porcentaje_iva").default("0"),
    impuestoConsumo: numeric("impuesto_consumo").default("0"),
    otrosImpuestos: numeric("otros_impuestos").default("0"),
    costoTotalLinea: numeric("costo_total_linea").notNull(),
    creadoEn: timestamp("creado_en", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("idx_factura_items_factura_id").on(table.facturaId),
  ]
);

// 4. Categorías de Gastos y Cuentas PUC (Exacto con la BD de Hermes)
export const categoriasGastos = pgTable("categorias_gastos", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 100 }).notNull().unique(),
  comportamiento: varchar("comportamiento", { length: 20 }).notNull(),
  descripcion: text("descripcion"),
  pucSugerido: varchar("puc_sugerido", { length: 10 }),
});

export const pucCuentas = pgTable("puc_cuentas", {
  codigo: varchar("codigo", { length: 10 }).primaryKey(),
  nombre: varchar("nombre", { length: 255 }),
  nivel: integer("nivel"),
  naturaleza: varchar("naturaleza", { length: 50 }),
  descripcion: text("descripcion"),
  creadoEn: timestamp("creado_en", { mode: "string" }).defaultNow(),
});

// 5. Egresos y Gastos de la Tienda
export const egresosTienda = pgTable(
  "egresos_tienda",
  {
    id: serial("id").primaryKey(),
    fechaEgreso: date("fecha_egreso", { mode: "string" }).notNull(),
    tipoEgreso: varchar("tipo_egreso", { length: 50 }).notNull(),
    categoriaId: integer("categoria_id").notNull(),
    codigoPuc: varchar("codigo_puc", { length: 10 }),
    descripcion: text("descripcion").notNull(),
    proveedor: varchar("proveedor", { length: 255 }),
    nitEmisor: varchar("nit_emisor", { length: 50 }),
    codigoCiiu: varchar("codigo_ciiu", { length: 20 }),
    subtotal: numeric("subtotal").default("0"),
    iva: numeric("iva").default("0"),
    otrosImpuestos: numeric("otros_impuestos").default("0"),
    totalEgreso: numeric("total_egreso").notNull(),
    tieneFactura: boolean("tiene_factura").default(false),
    numeroComprobante: varchar("numero_comprobante", { length: 100 }),
    origen: varchar("origen", { length: 20 }),
    registradoPor: varchar("registrado_por", { length: 100 }).default("Hermes Bot"),
    creadoEn: timestamp("creado_en", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("idx_egresos_fecha").on(table.fechaEgreso),
    index("idx_egresos_tipo").on(table.tipoEgreso),
    index("idx_egresos_categoria_id").on(table.categoriaId),
    index("idx_egresos_puc").on(table.codigoPuc),
  ]
);

// 6. Historial de Correcciones / Auditoría
export const historialCorrecciones = pgTable(
  "historial_correcciones",
  {
    id: serial("id").primaryKey(),
    egresoId: integer("egreso_id")
      .notNull()
      .references(() => egresosTienda.id, { onDelete: "no action" }),
    campoModificado: varchar("campo_modificado", { length: 50 }).notNull(),
    valorAnterior: text("valor_anterior"),
    valorNuevo: text("valor_nuevo"),
    motivo: text("motivo"),
    corregidoPor: varchar("corregido_por", { length: 100 }).default("Hermes Bot"),
    corregidoEn: timestamp("corregido_en", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("idx_historial_egreso_id").on(table.egresoId),
  ]
);

// RELACIONES DRIZZLE
export const proveedoresRelations = relations(proveedores, ({ many }) => ({
  facturas: many(facturas),
}));

export const facturasRelations = relations(facturas, ({ one, many }) => ({
  proveedor: one(proveedores, {
    fields: [facturas.proveedorId],
    references: [proveedores.id],
  }),
  items: many(facturaItems),
  archivos: many(facturaArchivos),
}));

export const facturaItemsRelations = relations(facturaItems, ({ one }) => ({
  factura: one(facturas, {
    fields: [facturaItems.facturaId],
    references: [facturas.id],
  }),
}));

export const facturaArchivos = pgTable(
  "factura_archivos",
  {
    id: serial("id").primaryKey(),
    facturaId: integer("factura_id").references(() => facturas.id, {
      onDelete: "cascade",
    }),
    nombreArchivo: varchar("nombre_archivo", { length: 255 }).notNull(),
    tipoMime: varchar("tipo_mime", { length: 100 }).notNull(),
    datosBase64: text("datos_base64").notNull(),
    creadoEn: timestamp("creado_en", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("idx_factura_archivos_factura_id").on(table.facturaId),
  ]
);

export const facturaArchivosRelations = relations(facturaArchivos, ({ one }) => ({
  factura: one(facturas, {
    fields: [facturaArchivos.facturaId],
    references: [facturas.id],
  }),
}));

export const egresosTiendaRelations = relations(egresosTienda, ({ one, many }) => ({
  categoria: one(categoriasGastos, {
    fields: [egresosTienda.categoriaId],
    references: [categoriasGastos.id],
  }),
  puc: one(pucCuentas, {
    fields: [egresosTienda.codigoPuc],
    references: [pucCuentas.codigo],
  }),
  correcciones: many(historialCorrecciones),
}));

export const historialCorreccionesRelations = relations(historialCorrecciones, ({ one }) => ({
  egreso: one(egresosTienda, {
    fields: [historialCorrecciones.egresoId],
    references: [egresosTienda.id],
  }),
}));

// 7. Facturas en Auditoría (Escaneadas por IA, pendientes de revisión)
export const facturasAuditoria = pgTable("facturas_auditoria", {
  id: serial("id").primaryKey(),
  datosExtraidos: text("datos_extraidos"), // JSON crudo de la IA
  estado: varchar("estado", { length: 50 }).default("PENDIENTE"), // PENDIENTE, REVISADO, ERROR
  creadoEn: timestamp("creado_en", { mode: "string" }).defaultNow(),
});

export const facturasAuditoriaArchivos = pgTable("facturas_auditoria_archivos", {
  id: serial("id").primaryKey(),
  facturaAuditoriaId: integer("factura_auditoria_id").references(() => facturasAuditoria.id, {
    onDelete: "cascade",
  }),
  datosBase64: text("datos_base64").notNull(),
  datosBase64Censurada: text("datos_base64_censurada"), // Versión censurada físicamente si el usuario aplicó censura
  orden: integer("orden").default(0), // Para mantener el orden de las páginas
  creadoEn: timestamp("creado_en", { mode: "string" }).defaultNow(),
});

export const facturasAuditoriaRelations = relations(facturasAuditoria, ({ many }) => ({
  archivos: many(facturasAuditoriaArchivos),
}));

export const facturasAuditoriaArchivosRelations = relations(facturasAuditoriaArchivos, ({ one }) => ({
  factura: one(facturasAuditoria, {
    fields: [facturasAuditoriaArchivos.facturaAuditoriaId],
    references: [facturasAuditoria.id],
  }),
}));
