"use client";

import React, { useState, useTransition } from "react";
import { X, UserPlus, ShieldCheck, Mail, Lock, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createStaffUserAction } from "@/services/usuarios.service";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: string;
  onSuccess: (message: string) => void;
}

export default function CreateUserModal({
  isOpen,
  onClose,
  currentUserRole,
  onSuccess,
}: CreateUserModalProps) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"ADMIN" | "SUPERADMIN">("ADMIN");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("rol", rol);

    startTransition(async () => {
      const res = await createStaffUserAction(formData);
      if (res.success) {
        setNombre("");
        setEmail("");
        setPassword("");
        setRol("ADMIN");
        onSuccess(res.message);
        onClose();
      } else {
        setError(res.message || "Error al crear el usuario.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#067335]/10 text-[#067335] border border-[#067335]/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-slate-900">
                Registrar Usuario Administrativo
              </h2>
              <p className="text-xs text-slate-500">
                Crea una cuenta para el personal interno de Cigarrería Megalider.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nombre Completo
            </label>
            <Input
              type="text"
              required
              placeholder="Ej: Carlos Mendoza"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              leftIcon={<User className="w-4 h-4 text-slate-400" />}
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <Input
              type="email"
              required
              placeholder="admin@megalider.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Contraseña Inicial (mínimo 8 caracteres)
            </label>
            <Input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Rol de Personal Interno
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRol("ADMIN")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  rol === "ADMIN"
                    ? "border-[#067335] bg-[#067335]/5 shadow-2xs text-[#067335]"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="font-bold text-xs">ADMIN</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Operativo, contabilidad y catálogo.
                </div>
              </button>

              <button
                type="button"
                disabled={currentUserRole !== "SUPERADMIN"}
                onClick={() => setRol("SUPERADMIN")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  currentUserRole !== "SUPERADMIN"
                    ? "opacity-50 cursor-not-allowed border-slate-200"
                    : rol === "SUPERADMIN"
                    ? "border-[#067335] bg-[#067335]/5 shadow-2xs text-[#067335]"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1">
                  SUPERADMIN
                  <ShieldCheck className="w-3.5 h-3.5 text-[#038C3E]" />
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Control total y gestión de roles.
                </div>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isPending}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Registrar Administrador
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
