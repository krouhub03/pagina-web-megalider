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

// 6. Facturas
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
]);

// 7. Factura Items
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

// 8. Factura Archivos
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

// 9. PUC Cuentas
export const pucCuentas = mysqlTable("puc_cuentas", {
  codigo: varchar("codigo", { length: 10 }).primaryKey(),
  nombre: varchar("nombre", { length: 255 }),
  nivel: int("nivel"),
  naturaleza: varchar("naturaleza", { length: 50 }),
  descripcion: text("descripcion"),
  creadoEn: timestamp("creado_en").defaultNow(),
});

// 10. Medios de Pago
export const mediosPago = mysqlTable("medios_pago", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 100 }).notNull().unique(),
  activo: boolean("activo").default(true).notNull(),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
});

// RELACIONES FACTURAS
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

export const facturaArchivosRelations = relations(facturaArchivos, ({ one }) => ({
  factura: one(facturas, {
    fields: [facturaArchivos.facturaId],
    references: [facturas.id],
  }),
}));
