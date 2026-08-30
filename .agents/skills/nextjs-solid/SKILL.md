---
name: nextjs-solid
description: Directivas y patrones obligatorios para aplicar los principios SOLID (SRP, OCP, LSP, ISP, DIP) en componentes, hooks, Server/Client components y servicios de Next.js (App Router y Next 16+).
---

# Principios SOLID en Next.js (App Router y Next 16+)

Guía experta y estándares de codificación para asegurar que el proyecto cumpla rigurosamente con los principios de diseño de software SOLID en Next.js.

---

## 1. Single Responsibility Principle (SRP) - Principio de Responsabilidad Única

> **Regla:** Cada componente, hook o función debe tener un solo propósito o razón de cambio.

### Aplicación en Next.js
- **Separación Data Fetching vs UI:** Los Server Components deben encargarse exclusivamente de la obtención y preparación de datos desde la base de datos o APIs externas.
- **Client Components de UI Pura:** Los Client Components reciben los datos listos mediante `props` y su única responsabilidad es el renderizado y la interactividad.
- **Custom Hooks para Lógica Compleja:** Si un Client Component gestiona múltiples estados, efectos o validaciones, esta lógica debe extraerse a un Custom Hook (ej. `useUser.ts`, `useCart.ts`).

### Ejemplo: Separación de Data Fetching y UI

❌ **Mala Práctica (Client Component saturado de responsabilidades):**
```tsx
'use client';
import { useState, useEffect } from 'react';

export default function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div>Cargando...</div>;

  return <div>{user.name} - {user.email}</div>;
}
```

✅ **Buena Práctica (Server Component + Custom Hook + Client Component):**

```tsx
// app/users/[id]/page.tsx (Server Component - Data Fetching)
import { db } from '@/lib/db';
import { UserProfileView } from './user-profile-view';

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await db.users.findUnique({ where: { id } });

  if (!user) return <div>Usuario no encontrado</div>;

  return <UserProfileView name={user.name} email={user.email} avatarUrl={user.avatarUrl} />;
}
```

```tsx
// app/users/[id]/use-user-profile.ts (Custom Hook - Lógica Interactiva)
'use client';
import { useState } from 'react';

export function useUserProfile(initialEmail: string) {
  const [email, setEmail] = useState(initialEmail);
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing((prev) => !prev);

  return { email, setEmail, isEditing, toggleEdit };
}
```

---

## 2. Open/Closed Principle (OCP) - Principio de Abierto/Cerrado

> **Regla:** Los componentes deben estar abiertos a la extensión, pero cerrados a la modificación.

### Aplicación en Next.js
- **Patrón de Composición de Componentes:** En lugar de crear componentes gigantescos con múltiples condicionales (`if/else` o `switch`), crea componentes base flexibilizados con `children` o slots.
- **Evitar Props Flags Excesivas:** Evita props como `isHeaderModal`, `isConfirmationModal`, `isCheckoutModal` en un mismo archivo. Utiliza una abstracción base (ej. `<ModalBase>`) que acepte la estructura deseada.

### Ejemplo: Composición de Componentes (Modal)

❌ **Mala Práctica (Modificación constante por cada nuevo caso de uso):**
```tsx
interface ModalProps {
  isOpen: boolean;
  type: 'confirm' | 'alert' | 'form';
  title: string;
  onConfirm?: () => void;
}

export function Modal({ isOpen, type, title, onConfirm }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal">
      <h2>{title}</h2>
      {type === 'confirm' && <button onClick={onConfirm}>Confirmar</button>}
      {type === 'alert' && <p>Advertencia importante</p>}
      {type === 'form' && <input type="text" placeholder="Escribe aquí" />}
    </div>
  );
}
```

✅ **Buena Práctica (Componente Base Extensible por Composición):**
```tsx
import { ReactNode } from 'react';

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function ModalBase({ isOpen, onClose, title, children }: ModalBaseProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg">
        <header className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose}>✕</button>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

// Extensión mediante Composición sin modificar ModalBase
export function ConfirmationModal({ isOpen, onClose, onConfirm, message }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}) {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Confirmación">
      <p>{message}</p>
      <div className="mt-4 flex gap-2">
        <button onClick={onConfirm} className="bg-red-600 text-white px-4 py-2 rounded">Aceptar</button>
        <button onClick={onClose} className="bg-gray-200 px-4 py-2 rounded">Cancelar</button>
      </div>
    </ModalBase>
  );
}
```

---

## 3. Liskov Substitution Principle (LSP) - Principio de Sustitución de Liskov

> **Regla:** Las variantes o subtipos de un componente deben poder sustituir al componente base sin alterar el comportamiento esperado ni romper la aplicación.

### Aplicación en Next.js
- **Heredar Interfaces Estándar:** Las variantes de componentes UI (como `<ButtonPrimary>`, `<ButtonSecondary>`, `<CustomInput>`) deben extender las interfaces HTML nativas de React (`ComponentPropsWithoutRef<'button'>`, etc.).
- **Propagación Correcta de Props (`...props`):** Asegura que atributos nativos como `onClick`, `disabled`, `type="button" | "submit"`, `aria-*`, `className` sean aceptados y delegados correctamente.

### Ejemplo: Variantes de Botones Intercambiables

❌ **Mala Práctica (Interfaces personalizadas que rompen atributos nativos):**
```tsx
interface CustomButtonProps {
  label: string;
  onPress: () => void; // Nombre inventado que sustituye onClick nativo
  isDisabled?: boolean;
}

export function ButtonPrimary({ label, onPress, isDisabled }: CustomButtonProps) {
  return <button onClick={onPress} disabled={isDisabled}>{label}</button>;
}
```

✅ **Buena Práctica (Extensión e intercambiabilidad completa con atributos HTML estándar):**
```tsx
import { ComponentPropsWithoutRef } from 'react';

export interface BaseButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({ variant = 'primary', className = '', children, ...props }: BaseButtonProps) {
  const baseStyles = 'px-4 py-2 rounded font-medium transition-colors';
  const variantStyles = {
    primary: 'bg-red-700 text-white hover:bg-red-800',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// ButtonPrimary y ButtonSecondary son 100% sustituibles e intercambiables en cualquier formulario
export function ButtonPrimary(props: ComponentPropsWithoutRef<'button'>) {
  return <Button variant="primary" {...props} />;
}

export function ButtonSecondary(props: ComponentPropsWithoutRef<'button'>) {
  return <Button variant="secondary" {...props} />;
}
```

---

## 4. Interface Segregation Principle (ISP) - Principio de Segregación de Interfaces

> **Regla:** Ningún componente debe depender de propiedades o estructuras de datos que no utiliza.

### Aplicación en Next.js
- **Evitar Prop Drilling de Objetos Dominio Masivos:** No pases el objeto completo `User`, `Order` o `Product` a un componente hijo si este solo requiere 1 o 2 campos específicos.
- **Interfaces Específicas y Desacopladas:** Define props granulares estrictamente alineadas con las necesidades visuales del componente.

### Ejemplo: Componente Avatar

❌ **Mala Práctica (Pasar el objeto completo del Dominio/DB):**
```tsx
interface UserDomainModel {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl: string;
  billingHistory: any[];
  roles: string[];
}

// Avatar depende de todo el objeto UserDomainModel innecesariamente
export function UserAvatar({ user }: { user: UserDomainModel }) {
  return <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full" />;
}
```

✅ **Buena Práctica (Interfaces segregadas con las props mínimas necesarias):**
```tsx
interface UserAvatarProps {
  avatarUrl: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function UserAvatar({ avatarUrl, name, size = 'md' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <img
      src={avatarUrl}
      alt={name}
      className={`${sizeClasses[size]} rounded-full object-cover`}
    />
  );
}
```

---

## 5. Dependency Inversion Principle (DIP) - Principio de Inversión de Dependencias

> **Regla:** Los componentes o módulos de alto nivel no deben depender de módulos de bajo nivel o proveedores concretos, sino de abstracciones (interfaces, adaptadores o funciones inyectadas).

### Aplicación en Next.js
- **Desacoplamiento de SDKs y Servicios Externos:** No invoques SDKs externos (ej. MercadoPago, Stripe, Firebase, Resend) directamente dentro de componentes de UI.
- **Inyección por Props, Context o Server Action Adapters:** Pasa las funciones de acción como props o define interfaces de servicio (Service Adapters) que puedan ser reemplazadas fácilmente o simuladas mediante mocks en pruebas unitarias.

### Ejemplo: Integración de Pasarela de Pagos / Servicios

❌ **Mala Práctica (Dependencia directa y acoplada a un SDK específico en la UI):**
```tsx
'use client';
import { paymentStripeSdk } from '@/lib/stripe'; // Acoplamiento directo

export function CheckoutButton({ amount }: { amount: number }) {
  const handlePay = async () => {
    await paymentStripeSdk.processPayment({ amount });
  };

  return <button onClick={handlePay}>Pagar ${amount}</button>;
}
```

✅ **Buena Práctica (Abstracción mediante Inyección de Handler / Adaptador):**
```tsx
// Abstracción o contrato de pago
export type PaymentHandler = (amount: number) => Promise<{ success: boolean; transactionId?: string }>;

interface CheckoutButtonProps {
  amount: number;
  onProcessPayment: PaymentHandler; // Inyección de la dependencia
}

export function CheckoutButton({ amount, onProcessPayment }: CheckoutButtonProps) {
  const handlePay = async () => {
    const res = await onProcessPayment(amount);
    if (res.success) {
      alert(`Pago exitoso: ${res.transactionId}`);
    }
  };

  return (
    <button onClick={handlePay} className="bg-green-600 text-white px-4 py-2 rounded">
      Pagar ${amount}
    </button>
  );
}
```

```tsx
// app/checkout/page.tsx (Server/Client Container que inyecta la implementación concreta)
import { processStripePaymentAction } from '@/actions/payments'; // Server Action o Adaptador
import { CheckoutButton } from './checkout-button';

export default function CheckoutPage() {
  return (
    <div>
      <h1>Finalizar Compra</h1>
      <CheckoutButton amount={50000} onProcessPayment={processStripePaymentAction} />
    </div>
  );
}
```

---

## Resumen del Checklist de Verificación SOLID

Al crear o modificar cualquier componente o módulo en este proyecto, verifica:

1. **SRP:** ¿El componente solo realiza una tarea? (Data fetching en Server Component, UI en Client Component, lógica compleja en Custom Hook).
2. **OCP:** ¿Puedo extender la funcionalidad de este componente usando `children` o composición sin modificar su código fuente interno?
3. **LSP:** ¿Las variantes de mi componente heredan e imponen correctamente la interfaz HTML/React nativa para ser completamente intercambiables?
4. **ISP:** ¿El componente solo recibe la información mínima necesaria en sus props sin prop drilling de objetos enteros del dominio?
5. **DIP:** ¿Está el componente libre de acoplamiento directo a SDKs/APIs externas mediante inyección de dependencias o Server Actions?
