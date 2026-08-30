# 🧪 05 - Centro de Pruebas y Aseguramiento de Calidad

Este directorio constituye el centro de documentación de pruebas de **Cigarrería Megalider**, estructurado en subcarpetas dedicadas que reflejan la jerarquía física de `/tests` y las matrices de validación del sistema.

---

## 📁 Estructura del Módulo de Pruebas

```text
docs/05-Pruebas/
├── 01-Sistema/                 # Matriz de casos de prueba del sistema completo (CP-01 a CP-22)
│   ├── README.md               # Resumen del enfoque de sistema
│   └── 01-Matriz-Casos-de-Prueba.md # Matriz general de casos de prueba
│
├── 02-Unitarias/               # Pruebas unitarias automatizadas (Vitest + Testing Library)
│   ├── README.md               # Arquitectura y resumen de pruebas unitarias
│   ├── 01-Componentes-UI.md    # Pruebas de componentes React (LoginPage, RegisterPage)
│   ├── 02-Servicios-y-Negocio.md # Pruebas de lógica de negocio (auth.service)
│   ├── 03-Librerias-y-Utilidades.md # Pruebas de utilidades (jwt, recaptcha, utils)
│   └── 04-Stores-Zustand.md    # Pruebas de gestión de estado cliente (6 stores)
│
├── 03-Integracion/             # Pruebas de integración de APIs, Route Handlers y BD
│   └── README.md               # Guía y especificación de pruebas de integración
│
├── 04-E2E/                     # Pruebas End-to-End de flujos completos de usuario
│   └── README.md               # Configuración y escenarios Playwright
│
├── 05-Setup-y-Mocks/           # Infraestructura de pruebas, utilidades y datos estáticos
│   └── README.md               # Configuración de Vitest setup, wrappers y mock data
│
└── 06-Ejecucion-y-Resultados/  # Comandos de ejecución, cobertura y evidencias reales
    └── README.md               # Scripts de npm, reporte de cobertura y log Vitest
```

---

## 📌 Guía Rápida por Carpetas

| Carpeta | Descripción | Enlace |
| :--- | :--- | :--- |
| **`01-Sistema`** | Matriz general de validación de sistema, base de datos, seguridad y UI. | [Ver Pruebas de Sistema](./01-Sistema/README.md) |
| **`02-Unitarias`** | Suite de 64 pruebas unitarias divididas por componentes, servicios, libs y stores. | [Ver Pruebas Unitarias](./02-Unitarias/README.md) |
| **`03-Integracion`** | Validación de Route Handlers BFF, respuestas HTTP y conexión Multi-BD. | [Ver Pruebas de Integración](./03-Integracion/README.md) |
| **`04-E2E`** | Pruebas de extremo a extremo con Playwright simulando flujos reales. | [Ver Pruebas E2E](./04-E2E/README.md) |
| **`05-Setup-y-Mocks`** | Configuración de entorno Vitest, custom renderers y stubs JSON. | [Ver Setup & Mocks](./05-Setup-y-Mocks/README.md) |
| **`06-Ejecucion-y-Resultados`** | Comandos `npm test`, reportes de cobertura y evidencia de 64/64 pasados. | [Ver Ejecución & Resultados](./06-Ejecucion-y-Resultados/README.md) |
