import {
  mysqlTable,
  serial,
  varchar,
  text,
  decimal,
  int,
  boolean,
  timestamp,
  mysqlEnum,
  index,
  uniqueIndex,
  date,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// 1. Roles del Sistema
export const roleEnum = mysqlEnum("rol", ["SUPERADMIN", "ADMIN", "CLIENTE"]);

// 2. Tabla de Usuarios Administrativos y Operativos
export const usuarios = mysqlTable(
  "usuarios",
  {
    id: serial("id").primaryKey(),
    nombre: varchar("nombre", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }),
    googleId: varchar("google_id", { length: 255 }),
    avatarUrl: varchar("avatar_url", { length: 500 }),
    rol: roleEnum.default("CLIENTE").notNull(),
    activo: boolean("activo").default(true).notNull(),
    creadoEn: timestamp("creado_en").defaultNow().notNull(),
    actualizadoEn: timestamp("actualizado_en").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_usuarios_email").on(table.email),
    index("idx_usuarios_rol").on(table.rol),
  ]
);

// 3. Categorías de Productos Oficiales Megalider
export const categoriasProductos = mysqlTable("categorias_productos", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 150 }).notNull(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  descripcion: text("descripcion"),
  icono: varchar("icono", { length: 50 }),
  activo: boolean("activo").default(true).notNull(),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
});

// 4. Catálogo de Productos (Base para E-commerce e Inventario)
export const productos = mysqlTable(
  "productos",
  {
    id: serial("id").primaryKey(),
    categoriaId: int("categoria_id").notNull(),
    codigoBarras: varchar("codigo_barras", { length: 100 }).unique(),
    nombre: varchar("nombre", { length: 255 }).notNull(),
    descripcion: text("descripcion"),
    precioCompra: decimal("precio_compra", { precision: 12, scale: 2 }).default("0.00"),
    precioVenta: decimal("precio_venta", { precision: 12, scale: 2 }).notNull(),
    stockActual: int("stock_actual").default(0).notNull(),
    stockMinimo: int("stock_minimo").default(5).notNull(),
    imagenUrl: varchar("imagen_url", { length: 500 }),
    destacado: boolean("destacado").default(false),
    activo: boolean("activo").default(true).notNull(),
    creadoEn: timestamp("creado_en").defaultNow().notNull(),
    actualizadoEn: timestamp("actualizado_en").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_productos_categoria").on(table.categoriaId),
    index("idx_productos_codigo_barras").on(table.codigoBarras),
  ]
);

export const categoriasProductosRelations = relations(categoriasProductos, ({ many }) => ({
  productos: many(productos),
}));

export const productosRelations = relations(productos, ({ one }) => ({
  categoria: one(categoriasProductos, {
    fields: [productos.categoriaId],
    references: [categoriasProductos.id],
  }),
}));

// 5. Proveedores
export const proveedores = mysqlTable("proveedores", {
  id: serial("id").primaryKey(),
  nit: varchar("nit", { length: 50 }).notNull().unique(),
  razonSocial: varchar("razon_social", { length: 255 }).notNull(),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
});

// 6. PUC Cuentas (Plan Único de Cuentas)
export const pucCuentas = mysqlTable("puc_cuentas", {
  codigo: varchar("codigo", { length: 10 }).primaryKey(),
  nombre: varchar("nombre", { length: 255 }),
  nivel: int("nivel"),
  naturaleza: varchar("naturaleza", { length: 50 }),
  descripcion: text("descripcion"),
  creadoEn: timestamp("creado_en").defaultNow(),
});

// 7. Tipos de Operación Contable (Inventario, Activos, Mantenimiento, etc.)
export const tiposOperacion = mysqlTable("tipos_operacion", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(),
  nombre: varchar("nombre", { length: 150 }).notNull(),
  descripcion: text("descripcion"),
  cuentaPucDebito: varchar("cuenta_puc_debito", { length: 10 }).notNull().references(() => pucCuentas.codigo),
  cuentaPucCredito: varchar("cuenta_puc_credito", { length: 10 }).references(() => pucCuentas.codigo),
  afectaInventario: boolean("afecta_inventario").default(false).notNull(),
  esRemision: boolean("es_remision").default(false).notNull(),
  activo: boolean("activo").default(true).notNull(),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
});

// 8. Medios de Pago (Macro: Efectivo, Transferencia, Tarjeta, Crédito)
export const mediosPago = mysqlTable("medios_pago", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 50 }).unique(),
  nombre: varchar("nombre", { length: 100 }).notNull().unique(),
  activo: boolean("activo").default(true).notNull(),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
});

// 9. Cuentas de Tesorería (Cajas y Bancos Específicos: Caja 1, Caja Menor, Bancolombia, Nequi)
export const cuentasTesoreria = mysqlTable("cuentas_tesoreria", {
  id: serial("id").primaryKey(),
  medioPagoId: int("medio_pago_id").notNull().references(() => mediosPago.id),
  codigoPuc: varchar("codigo_puc", { length: 10 }).notNull().references(() => pucCuentas.codigo),
  nombreCuenta: varchar("nombre_cuenta", { length: 150 }).notNull(),
  numeroReferencia: varchar("numero_referencia", { length: 100 }),
  activo: boolean("activo").default(true).notNull(),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
}, (table) => [
  index("idx_cuentas_tesoreria_medio_pago").on(table.medioPagoId),
  index("idx_cuentas_tesoreria_codigo_puc").on(table.codigoPuc),
]);

// 10. Tipos de Retención en la Fuente (RteFte Compras, Servicios, ReteIVA, ReteICA)
export const tiposRetencion = mysqlTable("tipos_retencion", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(),
  nombre: varchar("nombre", { length: 150 }).notNull(),
  porcentaje: decimal("porcentaje", { precision: 5, scale: 2 }).notNull(),
  baseMinima: decimal("base_minima", { precision: 12, scale: 2 }).default("0.00"),
  cuentaPuc: varchar("cuenta_puc", { length: 10 }).notNull().references(() => pucCuentas.codigo),
  activo: boolean("activo").default(true).notNull(),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
});

// 11. Facturas
export const facturas = mysqlTable("facturas", {
  id: serial("id").primaryKey(),
  numeroFactura: varchar("numero_factura", { length: 100 }).notNull(),
  tipoDocumento: varchar("tipo_documento", { length: 100 }),
  cufe: varchar("cufe", { length: 255 }),
  documentoReferencia: varchar("documento_referencia", { length: 100 }),
  fechaEmision: date("fecha_emision", { mode: "string" }).notNull(),
  fechaVencimiento: date("fecha_vencimiento", { mode: "string" }),
  proveedorId: int("proveedor_id").notNull(),
  clienteDocumento: varchar("cliente_documento", { length: 50 }),
  clienteNombre: varchar("cliente_nombre", { length: 255 }),
  condicionPago: varchar("condicion_pago", { length: 100 }),
  medioPago: varchar("medio_pago", { length: 100 }),
  
  // Enlaces Contables y de Tesorería Progresiva
  tipoOperacionId: int("tipo_operacion_id"),
  medioPagoId: int("medio_pago_id"),
  cuentaTesoreriaId: int("cuenta_tesoreria_id"),
  remisionOrigenId: int("remision_origen_id"),
  estadoRemision: mysqlEnum("estado_remision", ["PENDIENTE_FACTURAR", "FACTURADA", "NO_APLICA"]).default("NO_APLICA").notNull(),
  estadoContable: mysqlEnum("estado_contable", ["PENDIENTE_CONCILIACION", "CONCILIADA", "PAGADA"]).default("PENDIENTE_CONCILIACION").notNull(),

  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0"),
  descuentoTotalFactura: decimal("descuento_total_factura", { precision: 12, scale: 2 }).default("0"),
  iva: decimal("iva", { precision: 12, scale: 2 }).default("0"),
  impoconsumo: decimal("impoconsumo", { precision: 12, scale: 2 }).default("0"),
  ibuaIpcu: decimal("ibua_ipcu", { precision: 12, scale: 2 }).default("0"),
  otrosImpuestosTotal: decimal("otros_impuestos_total", { precision: 12, scale: 2 }).default("0"),
  totalFactura: decimal("total_factura", { precision: 12, scale: 2 }).default("0").notNull(),
  categoria: mysqlEnum("categoria", ["INVENTARIO", "OPEX", "ACTIVOS"]).default("INVENTARIO").notNull(),
  estadoPago: mysqlEnum("estado_pago", ["PAGADA", "PENDIENTE", "CREDITO_30_DIAS"]).default("PENDIENTE").notNull(),
  archivoUrl: text("archivo_url"),
  observaciones: text("observaciones"),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
}, (table) => [
  index("idx_facturas_proveedor").on(table.proveedorId),
  index("idx_facturas_fecha").on(table.fechaEmision),
  index("idx_facturas_tipo_operacion").on(table.tipoOperacionId),
  index("idx_facturas_medio_pago").on(table.medioPagoId),
  index("idx_facturas_cuenta_tesoreria").on(table.cuentaTesoreriaId),
]);

// 12. Factura Items
export const facturaItems = mysqlTable("factura_items", {
  id: serial("id").primaryKey(),
  facturaId: int("factura_id").notNull(),
  codigoBarras: varchar("codigo_barras", { length: 100 }),
  codigoProveedor: varchar("codigo_proveedor", { length: 100 }),
  nombreProducto: text("nombre_producto").notNull(),
  cantidadIngresada: decimal("cantidad_ingresada", { precision: 12, scale: 2 }).notNull(),
  unidadMedida: varchar("unidad_medida", { length: 50 }),
  costoUnitarioCompra: decimal("costo_unitario_compra", { precision: 12, scale: 2 }).notNull(),
  descuentoPorProducto: decimal("descuento_por_producto", { precision: 12, scale: 2 }).default("0"),
  ivaTotal: decimal("iva_total", { precision: 12, scale: 2 }).default("0"),
  porcentajeIva: decimal("porcentaje_iva", { precision: 12, scale: 2 }).default("0"),
  impuestoConsumo: decimal("impuesto_consumo", { precision: 12, scale: 2 }).default("0"),
  otrosImpuestos: decimal("otros_impuestos", { precision: 12, scale: 2 }).default("0"),
  costoTotalLinea: decimal("costo_total_linea", { precision: 12, scale: 2 }).notNull(),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
}, (table) => [
  index("idx_factura_items_factura_id").on(table.facturaId),
]);

// 13. Factura Retenciones Aplicadas
export const facturaRetenciones = mysqlTable("factura_retenciones", {
  id: serial("id").primaryKey(),
  facturaId: int("factura_id").notNull().references(() => facturas.id, { onDelete: "cascade" }),
  tipoRetencionId: int("tipo_retencion_id").notNull().references(() => tiposRetencion.id),
  baseGravable: decimal("base_gravable", { precision: 12, scale: 2 }).notNull(),
  porcentajeAplicado: decimal("porcentaje_aplicado", { precision: 5, scale: 2 }).notNull(),
  valorRetenido: decimal("valor_retenido", { precision: 12, scale: 2 }).notNull(),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
}, (table) => [
  index("idx_factura_retenciones_factura_id").on(table.facturaId),
]);

// 14. Factura Asientos Contables (Libro Diario Oficial con Partida Doble)
export const facturaAsientos = mysqlTable("factura_asientos", {
  id: serial("id").primaryKey(),
  facturaId: int("factura_id").notNull().references(() => facturas.id, { onDelete: "cascade" }),
  cuentaPuc: varchar("cuenta_puc", { length: 10 }).notNull().references(() => pucCuentas.codigo),
  concepto: varchar("concepto", { length: 255 }).notNull(),
  debito: decimal("debito", { precision: 14, scale: 2 }).default("0.00").notNull(),
  credito: decimal("credito", { precision: 14, scale: 2 }).default("0.00").notNull(),
  estado: varchar("estado", { length: 20 }).default("ACTIVO").notNull(),
  anuladoEn: timestamp("anulado_en"),
  motivoAnulacion: varchar("motivo_anulacion", { length: 255 }),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
}, (table) => [
  index("idx_factura_asientos_factura_id").on(table.facturaId),
  index("idx_factura_asientos_cuenta_puc").on(table.cuentaPuc),
  index("idx_factura_asientos_estado").on(table.estado),
]);

// 15. Factura Archivos
export const facturaArchivos = mysqlTable("factura_archivos", {
  id: serial("id").primaryKey(),
  facturaId: int("factura_id").notNull(),
  nombreArchivo: varchar("nombre_archivo", { length: 255 }).notNull(),
  tipoMime: varchar("tipo_mime", { length: 100 }).notNull(),
  datosBase64: text("datos_base64").notNull(),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
}, (table) => [
  index("idx_factura_archivos_factura_id").on(table.facturaId),
]);

// RELACIONES RELACIONALES DRIZZLE
export const proveedoresRelations = relations(proveedores, ({ many }) => ({
  facturas: many(facturas),
}));

export const tiposOperacionRelations = relations(tiposOperacion, ({ one, many }) => ({
  cuentaDebito: one(pucCuentas, {
    fields: [tiposOperacion.cuentaPucDebito],
    references: [pucCuentas.codigo],
  }),
  cuentaCredito: one(pucCuentas, {
    fields: [tiposOperacion.cuentaPucCredito],
    references: [pucCuentas.codigo],
  }),
  facturas: many(facturas),
}));

export const mediosPagoRelations = relations(mediosPago, ({ many }) => ({
  cuentasTesoreria: many(cuentasTesoreria),
  facturas: many(facturas),
}));

export const cuentasTesoreriaRelations = relations(cuentasTesoreria, ({ one, many }) => ({
  medioPago: one(mediosPago, {
    fields: [cuentasTesoreria.medioPagoId],
    references: [mediosPago.id],
  }),
  cuentaPuc: one(pucCuentas, {
    fields: [cuentasTesoreria.codigoPuc],
    references: [pucCuentas.codigo],
  }),
  facturas: many(facturas),
}));

export const facturasRelations = relations(facturas, ({ one, many }) => ({
  proveedor: one(proveedores, {
    fields: [facturas.proveedorId],
    references: [proveedores.id],
  }),
  tipoOperacion: one(tiposOperacion, {
    fields: [facturas.tipoOperacionId],
    references: [tiposOperacion.id],
  }),
  medioPagoRel: one(mediosPago, {
    fields: [facturas.medioPagoId],
    references: [mediosPago.id],
  }),
  cuentaTesoreria: one(cuentasTesoreria, {
    fields: [facturas.cuentaTesoreriaId],
    references: [cuentasTesoreria.id],
  }),
  remisionOrigen: one(facturas, {
    fields: [facturas.remisionOrigenId],
    references: [facturas.id],
  }),
  items: many(facturaItems),
  retenciones: many(facturaRetenciones),
  asientos: many(facturaAsientos),
  archivos: many(facturaArchivos),
}));

export const facturaItemsRelations = relations(facturaItems, ({ one }) => ({
  factura: one(facturas, {
    fields: [facturaItems.facturaId],
    references: [facturas.id],
  }),
}));

export const facturaRetencionesRelations = relations(facturaRetenciones, ({ one }) => ({
  factura: one(facturas, {
    fields: [facturaRetenciones.facturaId],
    references: [facturas.id],
  }),
  tipoRetencion: one(tiposRetencion, {
    fields: [facturaRetenciones.tipoRetencionId],
    references: [tiposRetencion.id],
  }),
}));

export const facturaAsientosRelations = relations(facturaAsientos, ({ one }) => ({
  factura: one(facturas, {
    fields: [facturaAsientos.facturaId],
    references: [facturas.id],
  }),
  cuenta: one(pucCuentas, {
    fields: [facturaAsientos.cuentaPuc],
    references: [pucCuentas.codigo],
  }),
}));

export const facturaArchivosRelations = relations(facturaArchivos, ({ one }) => ({
  factura: one(facturas, {
    fields: [facturaArchivos.facturaId],
    references: [facturas.id],
  }),
}));
