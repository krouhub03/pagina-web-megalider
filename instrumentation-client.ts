/**
 * Instrumentación Temprana del Cliente para Cigarrería Megalider.
 * Se ejecuta en el navegador antes de que el código de la UI comience a hidratarse.
 */
export function register() {
  if (typeof window !== "undefined") {
    // Captura global de errores no manejados en tiempo de ejecución
    window.addEventListener("error", (event) => {
      const errorPayload = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
      };

      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics", JSON.stringify({
          id: `err-${Date.now()}`,
          name: "CLIENT_ERROR",
          value: 1,
          rating: "poor",
          details: errorPayload,
        }));
      }
    });

    // Captura de promesas rechazadas no manejadas (unhandledrejection)
    window.addEventListener("unhandledrejection", (event) => {
      console.warn("[Instrumentation Client] Unhandled promise rejection:", event.reason);
    });
  }
}
