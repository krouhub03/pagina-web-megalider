export function getOpenAPISpecification() {
  return {
    openapi: "3.0.3",
    info: {
      title: "Cigarrería Megalider API",
      version: "3.0.0",
      description:
        "Especificación oficial de la API estandarizada y segura de Cigarrería Megalider (BFF & Server Handlers).",
      contact: {
        name: "Soporte Técnico Megalider",
        email: "soporte@megalider.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Servidor de Desarrollo Local",
      },
      {
        url: "https://megalider.com/api",
        description: "Servidor de Producción",
      },
    ],
    paths: {
      "/analytics": {
        post: {
          summary: "Recepción de Telemetría Web Vitals",
          description:
            "Recibe métricas de rendimiento del cliente (TTFB, LCP, CLS, INP, FCP, FID) mediante navigator.sendBeacon o fetch no bloqueante.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/WebVitalsPayload",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Métrica registrada con éxito",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ApiSuccessResponse",
                  },
                },
              },
            },
            "400": {
              description: "Payload de analítica inválido o Content-Type incorrecto",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ApiErrorResponse",
                  },
                },
              },
            },
          },
        },
      },
      "/webhooks/revalidate": {
        post: {
          summary: "Revalidación Bajo Demanda de Caché ISR/SSG",
          description:
            "Revalida etiquetas de caché o rutas específicas utilizando token Bearer comparado con timing-safe equal.",
          security: [
            {
              BearerAuth: [],
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/RevalidatePayload",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Caché revalidada correctamente",
            },
            "401": {
              description: "No autorizado (Bearer Token inválido o ausente)",
            },
            "400": {
              description: "Payload de revalidación inválido",
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "SecretToken",
        },
      },
      schemas: {
        ApiSuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" },
            meta: { type: "object" },
          },
        },
        ApiErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                code: { type: "string", example: "VALIDATION_ERROR" },
                message: { type: "string", example: "Datos inválidos" },
                details: { type: "array", items: { type: "object" } },
              },
            },
          },
        },
        WebVitalsPayload: {
          type: "object",
          required: ["name", "value", "rating", "delta", "id"],
          properties: {
            name: { type: "string", enum: ["TTFB", "LCP", "CLS", "INP", "FID", "FCP"] },
            value: { type: "number", example: 2450.5 },
            rating: { type: "string", enum: ["good", "needs-improvement", "poor"] },
            delta: { type: "number", example: 120.0 },
            id: { type: "string", example: "v3-1693305600000-12345" },
            url: { type: "string", example: "https://megalider.com/catalogo" },
          },
        },
        RevalidatePayload: {
          type: "object",
          properties: {
            tag: { type: "string", example: "productos-catalogo" },
            path: { type: "string", example: "/catalogo" },
          },
        },
      },
    },
  };
}
