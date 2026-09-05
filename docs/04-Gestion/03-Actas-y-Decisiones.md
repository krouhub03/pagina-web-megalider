# 📝 03 - Resumen de Actas y Decisiones Clave (ADRs)

Este documento registra los acuerdos arquitectónicos y las decisiones estratégicas tomadas durante el desarrollo del proyecto.

---

## 📝 Decisiones Arquitectónicas Registradas

1. **Portal Unificado con Redirección Inteligente RBAC:**
   Se unificó el inicio de sesión para todo tipo de usuarios en `/login`, garantizando que cualquier usuario externo que se registre mediante Google reciba el rol de menor privilegio (`CLIENTE`) y sea enviado a la tienda pública (`/`), protegiendo de forma transparente el acceso al panel administrativo.

2. **Separación de Login y Registro:**
   Se creó la ruta `/register` para una experiencia de onboarding clara con verificación humana de reCAPTCHA y aceptación explícita de la política de tratamiento de datos personales conforme a la legislación colombiana (Ley 1581 de 2012).

3. **Decisión Multi-BD con Drizzle ORM:**
   Se optó por **Drizzle ORM** para permitir consultas simultáneas a PostgreSQL (Hermes) y MySQL (tienda y usuarios) sin generar sobrecarga ni múltiples binarios pesados.

4. **Estrategia de Auditoría de Correcciones:**
   Se vinculó el flujo de edición a la tabla `historial_correcciones` para garantizar que nunca se sobreescriba un dato de Hermes IA sin dejar registro del valor anterior, el nuevo valor y el usuario responsable.

5. **Adopción de AI Coding Standards:**
   Se formalizaron las skills de agentes de codificación en `.agents/skills/` para garantizar que cualquier desarrollo futuro respete los contratos de marca, patrones BFF, lazy loading y optimización de contexto.

6. **Estandarización de Naturaleza y Niveles Jerárquicos en Catálogo PUC (NIIF):**
   Se definió el uso explícito de `"Débito"` y `"Crédito"` como valores canónicos en la base de datos MySQL (`puc_cuentas.naturaleza`), migrando y eliminando abreviaciones ambiguas (`"D"` / `"C"`). Asimismo, se formalizó el cálculo algorítmico determinístico del nivel jerárquico según la longitud del código (Clase: 1, Grupo: 2, Cuenta: 4, Subcuenta: 6, Auxiliar: >6 dígitos) tanto en base de datos como en los formularios interactivos.
