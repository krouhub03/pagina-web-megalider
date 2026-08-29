"use client";

import React, { useState, useTransition, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginWithCredentials } from "@/services/auth.service";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await loginWithCredentials(formData);
      if (res.success) {
        router.push(from);
        router.refresh();
      } else {
        setErrorMsg(res.message || "Error al iniciar sesión.");
      }
    });
  };

  return (
    <div className="w-full max-w-md" suppressHydrationWarning>
      <Card className="rounded-3xl shadow-xl shadow-slate-200/60 p-8 sm:p-10 space-y-6">
        {/* Logo & Encabezado */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#067335]/10 p-2.5 mx-auto flex items-center justify-center border border-[#067335]/20 shadow-2xs">
            <Image
              src="/logo_megalider.webp"
              alt="Cigarrería Megalider"
              width={52}
              height={52}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#067335] tracking-tight pt-1">
            Cigarrería Megalider
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Panel Administrativo Interno
          </p>
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
          <Input
            id="email"
            name="email"
            type="email"
            label="Correo Electrónico"
            required
            placeholder="ejemplo@gmail.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            label="Contraseña"
            required
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isPending}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full"
          >
            {isPending ? "Validando credenciales..." : "Ingresar al Dashboard"}
          </Button>
        </form>

        {/* Separador */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-white px-2 text-slate-400 font-bold">
              O acceso con
            </span>
          </div>
        </div>

        {/* Botón Google OAuth */}
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => {
            alert("Inicio con Google OAuth: Se vinculará con tu Client ID configurado en .env.local.");
          }}
          className="w-full"
          leftIcon={
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          }
        >
          Continuar con Google
        </Button>

        {/* Footer de Seguridad */}
        <div className="pt-2 text-center">
          <Badge variant="mint" dot>
            <ShieldCheck className="w-3.5 h-3.5" />
            Acceso Seguro con Encriptación JWT & RBAC
          </Badge>
          <div className="mt-3">
            <Link
              href="/"
              className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              ← Volver a la página principal
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center p-4 sm:p-6 font-sans" suppressHydrationWarning>
      <Suspense fallback={<div className="text-xs text-slate-500 font-bold">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
