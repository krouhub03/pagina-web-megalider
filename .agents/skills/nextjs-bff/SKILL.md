---
name: nextjs-bff
description: Guía experta y directivas para implementar el patrón Backend for Frontend (BFF), Route Handlers (route.ts), NextRequest/NextResponse, proxy/middleware, webhooks, negociación de contenido y seguridad en Next.js (App Router y Next 16+).
---

# Backend for Frontend (BFF) y Route Handlers en Next.js (App Router)

Directivas de arquitectura, seguridad y patrones de implementación para utilizar Next.js como una capa de Backend for Frontend (BFF). Next.js permite exponer endpoints HTTP públicos, transformar y agregar datos de servicios internos, procesar webhooks, gestionar callbacks de autenticación y servir múltiples tipos de contenido (JSON, XML, Markdown, binarios).

---

## 1. Arquitectura y Cuándo Usar Cada Mecanismo

| Mecanismo | Propósito Principal | Dónde Usar |
| :--- | :--- | :--- |
| **Server Components** | Fetching de datos directo (DB, ORM, APIs) para renderizar UI | Páginas y componentes del servidor (`app/page.tsx`, `layout.tsx`). **Nunca llamar a Route Handlers propios desde aquí**. |
| **Server Actions (`'use server'`)** | Mutaciones invocadas desde la UI del cliente (formularios, botones) | Acciones de usuario, validación de formularios, revalidación de caché (`revalidatePath`). |
| **Route Handlers (`route.ts`)** | Endpoints HTTP públicos (REST, Webhooks, Integraciones externas, descargas) | Webhooks de pasarelas de pago, endpoints de analítica, RSS/sitemaps dinámicos, exportación de archivos, APIs públicas. |
| **Proxy (`proxy.ts` / Middleware)** | Interceptación, redirección, reescritura y autenticación temprana | Comprobación de sesiones, ruteo multi-tenant, proxy inverso antes de llegar a la ruta. |

> ⚠️ **Regla de Oro (Anti-Patrón de Fetching Interno):**
> Nunca realices un `fetch()` a tus propios Route Handlers (`/api/...`) dentro de un **Server Component**.
> - En tiempo de compilación (*build time*), el servidor HTTP aún no está escuchando peticiones, lo que causará fallos en el build.
> - En tiempo de ejecución (*runtime*), añade un viaje de ida y vuelta (*HTTP round-trip*) innecesario y ralentiza el TTFB.
> - **Solución**: En Server Components, invoca directamente las funciones de consulta a base de datos o servicios (`lib/db`, `lib/services`).

---

## 2. Route Handlers (`app/**/route.ts`)

Los Route Handlers gestionan cualquier método HTTP (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`, `HEAD`).

### A. Estructura Estándar y Parámetros Asíncronos (Next 16+)

En Next.js 15 y 16+, `context.params` es una **Promesa asíncrona** que debe resolverse con `await`:

```tsx
// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getProductById, updateProduct } from '@/lib/services/products';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ data: product }, { status: 200 });
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validación básica de entrada
    if (!body.price || body.price <= 0) {
      return NextResponse.json({ error: 'Precio inválido' }, { status: 400 });
    }

    const updated = await updateProduct(id, body);
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

### B. Lectura del Cuerpo de la Petición (`Payloads`)

- Métodos disponibles: `request.json()`, `request.formData()`, `request.text()`.
- **Restricción**: El stream del body solo puede leerse una única vez. Si se requiere leer múltiples veces (ej. para logging o validación de firma), se debe clonar primero:
  ```ts
  const clonedRequest = request.clone();
  const rawText = await clonedRequest.text();
  const jsonData = await request.json();
  ```

---

## 3. Tipos de Contenido No-UI y Negociación de Contenido

Los Route Handlers permiten servir cualquier formato (XML, Markdown, RSS, Binarios/PDF, CSV):

### A. Endpoint RSS o XML Personalizado

```tsx
// app/feed.xml/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const xmlContent = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0">
    <channel>
      <title>Cigarrería Megalider - Novedades</title>
      <link>https://megalider.com</link>
      <description>Catálogo de licores y promociones</description>
    </channel>
  </rss>`;

  return new Response(xmlContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
```

### B. Negociación de Contenido (`Accept` Header) con `Vary`

Permite servir HTML a navegadores y Markdown o JSON estructurado a agentes de IA o clientes API desde la misma URL:

```js
// next.config.mjs / next.config.ts
export default {
  async rewrites() {
    return [
      {
        source: '/catalogo/:slug*',
        destination: '/api/catalogo-md/:slug*',
        has: [
          {
            type: 'header',
            key: 'accept',
            value: '(.*)text/markdown(.*)',
          },
        ],
      },
    ];
  },
};
```

```tsx
// app/api/catalogo-md/[...slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const mdData = '# Catálogo Megalider en Formato Markdown\n- Licores Nacionales e Importados';

  return new Response(mdData, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Vary': 'Accept', // Crítico para evitar que CDN sirva markdown al navegador
    },
  });
}
```

---

## 4. Webhooks y Callbacks de Autenticación

### A. Webhook con Validación de Secreto y Revalidación de Caché

```tsx
// app/api/webhooks/revalidate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedSecret = `Bearer ${process.env.REVALIDATE_SECRET_TOKEN}`;

  if (!authHeader || authHeader !== expectedSecret) {
    return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
  }

  const { tag } = await request.json();
  if (!tag) {
    return NextResponse.json({ success: false, message: 'Tag faltante' }, { status: 400 });
  }

  revalidateTag(tag);
  return NextResponse.json({ revalidated: true, tag, timestamp: Date.now() });
}
```

### B. Callback de Autenticación (Prevención de Open Redirects)

```tsx
// app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('session_token');
  const redirectUrl = request.nextUrl.searchParams.get('redirect_url');

  const destination = new URL(redirectUrl ?? '/', request.url);

  // 🛡️ Seguridad: Prevenir ataques de redirección abierta (Open Redirect)
  if (destination.origin !== request.nextUrl.origin) {
    return new Response('Redirección no autorizada hacia dominio externo', { status: 400 });
  }

  const response = NextResponse.redirect(destination);

  if (token) {
    response.cookies.set({
      name: 'session_token',
      value: token,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  return response;
}
```

---

## 5. Proxying y Forwarding hacia Microservicios

Permite proteger credenciales backend, consolidar headers y evitar exponer directamente microservicios o proveedores terceros al cliente:

```tsx
// app/api/external-proxy/[...slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const targetPath = slug.join('/');
  const targetUrl = new URL(targetPath, process.env.BACKEND_MICROSERVICE_URL);

  // Construir petición con API Key interna inyectada en el servidor
  const backendRequest = new Request(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-API-Key': process.env.INTERNAL_API_KEY ?? '',
    },
    body: await request.text(),
  });

  try {
    const upstreamResponse = await fetch(backendRequest);
    const data = await upstreamResponse.text();

    return new Response(data, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': upstreamResponse.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Fallo al comunicar con microservicio' }, { status: 502 });
  }
}
```

---

## 6. Seguridad y Buenas Prácticas en BFF

1. **Separación de Headers**:
   - **Cabeceras salientes del servidor al cliente**: Nunca reenviar headers crudos recibidos de un backend que contengan tokens, firmas internas o IPs privadas.
2. **Rate Limiting**:
   - Implementar control de peticiones en endpoints sensibles (autenticación, envío de SMS/emails, pagos) y retornar `429 Too Many Requests`.
3. **Manejo de Errores Sin Fugas de Información**:
   - Ocultar trazas de pila (*stack traces*) o detalles de conexión a bases de datos en respuestas enviadas al navegador.
4. **Validación Estricta de Esquema**:
   - Validar siempre los tipos de datos y longitud de los payloads (ej. con Zod) antes de procesar o enviar a servicios upstream.
5. **Entornos Serverless / Lambda**:
   - Los Route Handlers se ejecutan de forma sin estado (*stateless*). No confiar en memoria en proceso compartida entre peticiones ni conexiones abiertas permanentes (WebSockets).

---

## 7. Checklist de Calidad para BFF y Route Handlers

- [ ] ¿Los `params` en `{ params }` se resuelven con `await params`?
- [ ] ¿Se evitó el anti-patrón de hacer `fetch()` a Route Handlers propios desde Server Components?
- [ ] ¿Los callbacks con redirecciones validan que `destination.origin === request.nextUrl.origin` para evitar Open Redirects?
- [ ] ¿Las cookies de sesión se establecen con `httpOnly: true`, `secure: true` y `sameSite` adecuado?
- [ ] ¿Los endpoints con negociación de contenido incluyen el header `Vary: Accept`?
- [ ] ¿Los webhooks verifican la firma criptográfica o token secreto antes de procesar payloads?
- [ ] ¿Se manejan errores con `try/catch` retornando códigos de estado HTTP semánticos (200, 201, 400, 401, 403, 404, 429, 500)?
