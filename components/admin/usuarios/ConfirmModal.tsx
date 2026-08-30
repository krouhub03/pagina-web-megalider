"use client";

import React from "react";
import { AlertTriangle, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "warning";
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div
              className={`p-3 rounded-2xl shrink-0 ${
                variant === "danger"
                  ? "bg-rose-50 text-rose-600 border border-rose-100"
                  : variant === "warning"
                  ? "bg-amber-50 text-amber-600 border border-amber-100"
                  : "bg-emerald-50 text-[#067335] border border-emerald-100"
              }`}
            >
              {variant === "danger" ? (
                <ShieldAlert className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4">
            <h3 className="text-base font-bold text-slate-900 font-serif">
              {title}
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {description}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              variant={variant === "danger" ? "danger" : "primary"}
              size="sm"
              isLoading={isLoading}
              onClick={onConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
