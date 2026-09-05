import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Facturas en Auditoría (Escaneadas por IA, pendientes de revisión)
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
