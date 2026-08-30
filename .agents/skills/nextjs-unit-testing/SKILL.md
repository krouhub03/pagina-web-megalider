---
name: nextjs-unit-testing
description: Guía experta y directivas para diseño, implementación y ejecución de pruebas unitarias en Next.js 16+ (App Router), React 19, Vitest, React Testing Library, Drizzle ORM, autenticación (JWT/jose) y Route Handlers para el proyecto Cigarrería Megalider.
---

# Guía de Pruebas Unitarias para Next.js 16+ y Cigarrería Megalider

Directivas de ingeniería y patrones canónicos para escribir y ejecutar pruebas unitarias rápidas, confiables y aisladas en el proyecto **Cigarrería Megalider** (Next.js 16+, React 19, TypeScript, Vitest, React Testing Library, Drizzle ORM y Tailwind CSS v4).

---

## 1. Pirámide y Filosofía de Pruebas en el Proyecto

```
             / \
            / E2E \          -> Playwright (Flujos completos, async RSC)
           /-------\
          / Integr. \        -> Route Handlers con DB de pruebas, Server Actions
         /-----------\
        /  Unitarias  \      -> Vitest + Testing Library (Utils, UI, Auth, Hooks, Mocks)
       /---------------\
```

### ¿Qué se prueba con Pruebas Unitarias?
1. **Funciones de Utilidad y Formateadores (`lib/utils.ts`)**: Formato de moneda colombiana (`COP`), fechas locales (`es-CO`), composición de clases Tailwind (`cn`).
2. **Componentes de UI y Client Components (`components/ui/*`, `components/auth/*`)**: Renderizado correcto, variantes de color/marca Megalider, interacción (`onClick`, `onChange`), estados `disabled` y `isLoading`, accesibilidad (roles ARIA).
3. **Lógica de Seguridad y Autenticación (`lib/auth/*`)**: Firma y verificación de tokens JWT (`jose`), verificación de tokens Google reCAPTCHA, hashing de contraseñas (`bcryptjs`).
4. **Route Handlers (`app/api/**/route.ts`)**: Validación de métodos HTTP, códigos de estado (200, 400, 401, 404, 500), resolución asíncrona de `params` y parsing de payloads.
5. **Server Actions y Lógica de Negocio (`'use server'`)**: Validación de inputs, manejo de errores y retorno estructurado `{ success, data, error }`.

> ⚠️ **Limitación de Server Components Asíncronos (`async RSC`):**
> Según la documentación oficial de Next.js, los Server Components asíncronos (`async function Page()`) no son soportados de forma nativa por entornos de pruebas unitarias como jsdom/Vitest. Para estos componentes, aislar la lógica en funciones puras o probar la página mediante pruebas E2E.

---

## 2. Configuración Estándar del Entorno de Pruebas (Vitest)

El proyecto utiliza **Vitest** por su compatibilidad nativa con ESM, velocidad con Vite y soporte de TypeScript sin transpilación lenta.

### A. Dependencias de Desarrollo
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event vite-tsconfig-paths
```

### B. Configuración de Vitest (`vitest.config.mts`)
```ts
// vitest.config.mts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', '.next/', 'tests/setup.ts'],
    },
  },
});
```

### C. Archivo de Setup Global (`tests/setup.ts`)
```ts
// tests/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Limpieza automática del DOM después de cada prueba
afterEach(() => {
  cleanup();
});

// Mock de variables de entorno comunes
process.env.JWT_SECRET = 'test-secret-key-for-megalider-tests-12345';
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
```

### D. Scripts en `package.json`
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 3. Patrones de Pruebas por Capa

### A. Pruebas de Utilidades y Helpers Puros (`lib/utils.ts`)

Las funciones puras deben probar casos válidos, valores límite (`0`, cadenas vacías), `null`, `undefined` y entradas malformadas:

```ts
// tests/unit/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

describe('lib/utils', () => {
  describe('cn (Tailwind class merger)', () => {
    it('debe combinar clases simples y resolver conflictos de Tailwind', () => {
      const result = cn('px-2 py-1', 'px-4', { 'bg-red-500': true, 'text-white': false });
      expect(result).toBe('py-1 px-4 bg-red-500');
    });
  });

  describe('formatCurrency (COP)', () => {
    it('debe formatear números a pesos colombianos sin decimales', () => {
      const formatted = formatCurrency(25000);
      expect(formatted).toContain('25.000');
      expect(formatted).toContain('$');
    });

    it('debe manejar cadenas numéricas correctamente', () => {
      const formatted = formatCurrency('150000');
      expect(formatted).toContain('150.000');
    });

    it('debe retornar $ 0 ante valores nulos, indefinidos o NaN', () => {
      expect(formatCurrency(null)).toContain('0');
      expect(formatCurrency(undefined)).toContain('0');
      expect(formatCurrency('invalido')).toContain('0');
    });
  });

  describe('formatDate (es-CO)', () => {
    it('debe formatear una fecha ISO válida', () => {
      const formatted = formatDate('2026-08-15T12:00:00Z');
      expect(formatted).toBeDefined();
      expect(formatted).not.toBe('—');
    });

    it('debe retornar raya "—" ante entradas nulas o vacías', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate(undefined)).toBe('—');
      expect(formatDate('')).toBe('—');
    });
  });
});
```

---

### B. Pruebas de Componentes UI (`components/ui/*`)

Probar interacción, accesibilidad y renderizado condicional con `@testing-library/react` y `@testing-library/user-event`:

```tsx
// tests/unit/components/ui/Button.test.tsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';

describe('<Button />', () => {
  it('debe renderizar el contenido correctamente con variante primaria', () => {
    render(<Button variant="primary">Guardar Producto</Button>);
    
    const btn = screen.getByRole('button', { name: /guardar producto/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('bg-[#038C3E]');
  });

  it('debe ejecutar el callback onClick al hacer clic', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Acción</Button>);
    const btn = screen.getByRole('button', { name: /acción/i });

    await user.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('debe deshabilitarse y mostrar el spinner cuando isLoading es true', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button isLoading onClick={handleClick}>
        Cargando
      </Button>
    );

    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();

    await user.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

---

### C. Pruebas de Autenticación y Criptografía (`lib/auth/*`)

Mocking de llamadas externas (Google reCAPTCHA) y pruebas de ciclo de vida de tokens JWT (`jose`):

```ts
// tests/unit/lib/auth/jwt.test.ts
import { describe, it, expect } from 'vitest';
import { signJwt, verifyJwt } from '@/lib/auth/jwt';

describe('lib/auth/jwt', () => {
  const mockPayload = { userId: 101, email: 'admin@megalider.com', role: 'admin' };

  it('debe firmar y verificar un token JWT válido', async () => {
    const token = await signJwt(mockPayload, '1h');
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = await verifyJwt(token);
    expect(decoded).toMatchObject(mockPayload);
  });

  it('debe retornar null o rechazar ante un token alterado o inválido', async () => {
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalido.invalido';
    const decoded = await verifyJwt(invalidToken);
    expect(decoded).toBeNull();
  });
});
```

```ts
// tests/unit/lib/auth/recaptcha.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyRecaptcha } from '@/lib/auth/recaptcha';

describe('lib/auth/recaptcha', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('debe retornar true cuando Google confirma el token', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, score: 0.9 }),
    } as Response);

    const isValid = await verifyRecaptcha('valid-token');
    expect(isValid).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('debe retornar false cuando la validación falla o el score es bajo', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
    } as Response);

    const isValid = await verifyRecaptcha('bad-token');
    expect(isValid).toBe(false);
  });
});
```

---

### D. Pruebas de Route Handlers (`app/api/**/route.ts`)

Simular `NextRequest` y probar la resolución asíncrona de `params` (estándar Next 16+):

```ts
// tests/unit/app/api/auth/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/login/route';

// Mock de servicios o base de datos
vi.mock('@/lib/db/mysql', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe retornar 400 si faltan credenciales', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: '' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBeDefined();
  });
});
```

---

## 4. Mocks Canónicos para APIs de Next.js (App Router)

### A. Mock de `next/navigation`
```ts
// En tests/setup.ts o al inicio del archivo de prueba
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/admin/dashboard',
  useSearchParams: () => new URLSearchParams({ page: '1' }),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
```

### B. Mock de `next/headers` (Promesas Asíncronas)
```ts
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn((name: string) => ({ name, value: 'mocked-token-value' })),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(async () => new Headers({
    'user-agent': 'Vitest-Test-Runner',
  })),
}));
```

### C. Mock de `next/cache`
```ts
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
```

---

## 5. Convenciones de Nomenclatura y Ubicación de Pruebas

Se soporta la siguiente estructura de carpetas:

```
├── tests/
│   ├── setup.ts                    # Setup global de Vitest y Testing Library
│   ├── unit/
│   │   ├── lib/
│   │   │   ├── utils.test.ts       # Pruebas de formateo, cn, helpers
│   │   │   └── auth.test.ts        # Pruebas de JWT, reCAPTCHA
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.test.tsx # Pruebas de botones y variantes
│   │   │   │   └── Input.test.tsx
│   │   │   └── auth/
│   │   │       └── PoliciesModal.test.tsx
│   │   └── api/
│   │       └── login.test.ts       # Pruebas de Route Handlers
```

---

## 6. Reglas de Oro y Buenas Prácticas

1. **Aislamiento Total**: Cada prueba unitaria debe ser determinista e independiente. Nunca compartir estado mutable entre pruebas sin reiniciarlo en `beforeEach` / `afterEach`.
2. **Probar Comportamiento, no Implementación**:
   - Usar `screen.getByRole()`, `screen.getByLabelText()` y `screen.getByText()` sobre selectores CSS frágiles (`querySelector('.btn')`).
3. **Asincronía Realista**:
   - Usar `await userEvent.click()` en lugar de `fireEvent.click()` para simular eventos de usuario completos del navegador.
   - Envolver actualizaciones asíncronas con `waitFor(() => expect(...))` cuando sea necesario.
4. **Mocking Selectivo**:
   - Mockear llamadas externas (Google reCAPTCHA, pasarelas de pago, envíos de correo, base de datos).
   - **No mockear** la lógica interna que se está evaluando.
5. **No Comprobar Clases Estáticas Irrelevantes**:
   - Validar roles, textos, estados accesibles (`aria-disabled`, `aria-expanded`) y clases críticas de comportamiento de marca (`megalider-brand`).

---

## 7. Checklist de Calidad para Pruebas Unitarias

- [ ] ¿La prueba se ejecuta con `npm run test` sin advertencias de fugas de memoria o promesas no resueltas?
- [ ] ¿Se limpian los mocks y temporizadores con `vi.clearAllMocks()` / `vi.restoreAllMocks()`?
- [ ] ¿Los componentes interactivos usan `userEvent` con `await`?
- [ ] ¿Las pruebas de Route Handlers manejan parámetros asíncronos (`params: Promise<{...}>`)?
- [ ] ¿Se cubrieron casos borde (valores vacíos, nulos, errores de red y tokens expirados)?
- [ ] ¿Los Server Actions retornan estructuras consistentes `{ success, data, error }` probadas en casos de éxito y falla?
