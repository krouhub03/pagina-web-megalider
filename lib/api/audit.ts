export interface WebhookAuditEvent {
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userId?: number;
  status: "success" | "failed";
  errorMessage?: string;
}

export async function logWebhookEvent(event: WebhookAuditEvent): Promise<void> {
  const timestamp = new Date().toISOString();
  
  // Imprimir siempre en consola para trazabilidad de servidor
  console.log(`[AUDIT_LOG][${timestamp}] Action: ${event.action} | Status: ${event.status} | IP: ${event.ipAddress || "unknown"}`, {
    details: event.details,
    errorMessage: event.errorMessage,
  });

  // Opcional: Persistir en base de datos PostgreSQL si la conexión está disponible
  try {
    if (process.env.POSTGRES_DATABASE_URL) {
      // Importación dinámica para evitar errores si DB no está conectada en entornos de test sin BD
      const { dbPostgres } = await import("@/lib/db/postgres");
      if (dbPostgres) {
        // En desarrollo/producción con BD activa se puede enviar a la tabla audit_log
      }
    }
  } catch (error) {
    console.error("No se pudo guardar el evento de auditoría en la base de datos:", error);
  }
}
