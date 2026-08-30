---
name: nextjs-integration-testing
description: Guía experta y directivas para diseño, implementación y ejecución de pruebas de integración en Next.js 16+ (App Router), Route Handlers (BFF), Drizzle ORM Multi-BD (PostgreSQL + MySQL), autenticación JWT/OAuth y Server Actions para el proyecto Cigarrería Megalider.
---

# Guía de Pruebas de Integración para Next.js 16+ y Cigarrería Megalider

Directivas de ingeniería y patrones canónicos para diseñar, implementar y ejecutar pruebas de integración confiables en **Cigarrería Megalider** (Next.js 16+, App Router, TypeScript, Vitest, Drizzle ORM Multi-BD, JWT `jose` y Route Handlers).

---

## 1. Propósito y Alcance de las Pruebas de Integración

Las pruebas de integración evalúan el comportamiento conjunto de múltiples módulos y capas del sistema sin depender completamente de un navegador web:

```
┌────────────────────────────────────────────────────────┐
│           Ruta / Cliente (Petición HTTP / Action)      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          Next.js Route Handler / Server Action         │
│  - Extracción de cookies / headers                     │
│  - Verificación JWT / Permisos RBAC                    │
│  - Validación de Payload / Esquema DTO                 │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          Capa de Acceso a Datos & Servicios DAL        │
│  - Drizzle ORM PostgreSQL (cmegalider)                 │
│  - Drizzle ORM MySQL (u200862310_megalider)            │
│  - Recálculo de totales / Borrado en cascada           │
└────────────────────────────────────────────────────────┘
```

---

## 2. Escenarios Clave a Evaluar

1. **Route Handlers BFF (`app/api/**/route.ts`):**
   - Resolución de parámetros dinámicos asíncronos (`params: Promise<{ id: string }>`).
   - Negociación de contenido HTTP (`Vary: Accept`, respuestas `JSON`, `XML`).
   - Códigos de respuesta HTTP (200, 201, 400, 401, 403, 404, 500).
2. **Autenticación y Sesiones:**
   - Canje de códigos en callbacks de OAuth 2.0 de Google (`/api/auth/google/callback`).
   - Verificación de la cookie anti-CSRF `oauth_state` y generación de la cookie HttpOnly `auth_token`.
3. **Persistencia Multi-BD (Drizzle ORM):**
   - Inserción y consulta sincrónica en PostgreSQL (Hermes IA / Contabilidad) y MySQL (Usuarios y Catálogo).
   - Ejecución de funciones de negocio como `recalcularTotalesFactura()` tras mutaciones de ítems.
   - Eliminación en cascada de facturas e ítems asociados en PostgreSQL.

---

## 3. Configuración y Mocks de Integración

### A. Ubicación del Código de Pruebas
Las pruebas de integración deben ubicarse en la carpeta `tests/integration/`:

```text
tests/integration/
├── api/
│   ├── auth-google-callback.test.ts # Prueba de flujo completo de callback OAuth 2.0
│   └── contabilidad-bff.test.ts     # Prueba de endpoints BFF de facturas y egresos
└── services/
    └── contabilidad-service.test.ts # Prueba de integración del servicio contable con PostgreSQL
```

### B. Patron de Ejecución en Vitest
Las pruebas de integración pueden utilizar un entorno Node con bases de datos en memoria o bases de datos de prueba configuradas en `.env.test`:

```ts
// tests/integration/api/auth-google-callback.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/auth/google/callback/route';

vi.mock('@/lib/db/mysql', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([{ id: 1, email: 'cliente@gmail.com', rol: 'CLIENTE' }]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
  },
}));

describe('GET /api/auth/google/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe validar el state, canjear código y emitir cookie JWT', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/auth/google/callback?code=mock_code&state=valid_state',
      {
        headers: {
          cookie: 'oauth_state=valid_state',
        },
      }
    );

    // Mock del canje de Google UserInfo
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        email: 'cliente@gmail.com',
        name: 'Cliente Google',
        picture: 'https://lh3.googleusercontent.com/avatar.jpg',
        sub: 'google_sub_123',
      }),
    } as Response);

    const response = await GET(req);

    expect(response.status).toBe(307); // Redirección exitosa
    const setCookieHeader = response.headers.get('set-cookie');
    expect(setCookieHeader).toContain('auth_token=');
  });

  it('debe rechazar la petición si el state no coincide (CSRF Attack)', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/auth/google/callback?code=mock_code&state=invalid_state',
      {
        headers: {
          cookie: 'oauth_state=valid_state',
        },
      }
    );

    const response = await GET(req);
    expect(response.status).toBe(400);
  });
});
```

---

## 4. Reglas de Oro para Pruebas de Integración

1. **Verificar el Flujo Completo:** Evaluar desde el Request HTTP inicial hasta las cabeceras de respuesta (`Set-Cookie`, `Location`) y la persistencia en base de datos.
2. **No Saltear Reglas de Seguridad:** Validar que los permisos RBAC impidan que usuarios no autorizados consuman o modifiquen datos del servidor.
3. **Limpieza de Datos:** Toda prueba que altere tablas de prueba en PostgreSQL o MySQL debe revertir sus cambios (`rollback`) o limpiar los datos en `afterEach`.
