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

// RELACIONES DRIZZLE
export const categoriasProductosRelations = relations(categoriasProductos, ({ many }) => ({
  productos: many(productos),
}));

export const productosRelations = relations(productos, ({ one }) => ({
  categoria: one(categoriasProductos, {
    fields: [productos.categoriaId],
    references: [categoriasProductos.id],
  }),
}));

// 5. Proveedores (Consolidado)
export const proveedores = mysqlTable("proveedores", {
  id: serial("id").primaryKey(),
  nit: varchar("nit", { length: 50 }).notNull().unique(),
  razonSocial: varchar("razon_social", { length: 255 }).notNull(),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
});

// 6. Facturas Consolidadas (Financieras)
export const facturas = mysqlTable("facturas", {
  id: serial("id").primaryKey(),
  numeroFactura: varchar("numero_factura", { length: 100 }).notNull(),
  proveedorId: int("proveedor_id").notNull(),
  fechaEmision: timestamp("fecha_emision").notNull(),
  totalFactura: decimal("total_factura", { precision: 12, scale: 2 }).default("0.00").notNull(),
  categoria: mysqlEnum("categoria", ["INVENTARIO", "OPEX", "ACTIVOS"]).default("INVENTARIO").notNull(),
  estadoPago: mysqlEnum("estado_pago", ["PAGADA", "PENDIENTE", "CREDITO_30_DIAS"]).default("PENDIENTE").notNull(),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
}, (table) => [
  index("idx_facturas_proveedor").on(table.proveedorId),
]);

export const facturaItems = mysqlTable("factura_items", {
  id: serial("id").primaryKey(),
  facturaId: int("factura_id").notNull(),
  descripcion: text("descripcion").notNull(),
  cantidad: decimal("cantidad", { precision: 12, scale: 2 }).notNull(),
  precioUnitario: decimal("precio_unitario", { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
}, (table) => [
  index("idx_factura_items_factura_id").on(table.facturaId),
]);

export const proveedoresRelations = relations(proveedores, ({ many }) => ({
  facturas: many(facturas),
}));

export const facturasRelations = relations(facturas, ({ one, many }) => ({
  proveedor: one(proveedores, {
    fields: [facturas.proveedorId],
    references: [proveedores.id],
  }),
  items: many(facturaItems),
}));

export const facturaItemsRelations = relations(facturaItems, ({ one }) => ({
  factura: one(facturas, {
    fields: [facturaItems.facturaId],
    references: [facturas.id],
  }),
}));
