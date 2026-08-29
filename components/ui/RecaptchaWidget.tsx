"use client";

import React, { useEffect, useRef, useState } from "react";
import { ShieldCheck, Info } from "lucide-react";

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement | string,
        parameters: {
          sitekey: string;
          callback: (response: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark";
          size?: "normal" | "compact";
        }
      ) => number;
      reset: (opt_widget_id?: number) => void;
      getResponse: (opt_widget_id?: number) => string;
    };
    onRecaptchaLoadCallback?: () => void;
  }
}

interface RecaptchaWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

export function RecaptchaWidget({ onVerify, onExpire }: RecaptchaWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Si no hay clave pública de reCAPTCHA en local/desarrollo
    if (!siteKey) {
      onVerify("dev_mock_captcha_token");
      return;
    }

    const scriptId = "google-recaptcha-script";

    const renderWidget = () => {
      if (window.grecaptcha && containerRef.current && widgetIdRef.current === null) {
        try {
          const id = window.grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              onVerify(token);
            },
            "expired-callback": () => {
              if (onExpire) onExpire();
            },
            theme: "light",
          });
          widgetIdRef.current = id;
          setIsLoaded(true);
        } catch (e) {
          console.error("Error renderizando widget de reCAPTCHA:", e);
        }
      }
    };

    if (typeof window !== "undefined" && window.grecaptcha && typeof window.grecaptcha.render === "function") {
      renderWidget();
    } else {
      window.onRecaptchaLoadCallback = renderWidget;

      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoadCallback&render=explicit";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
    }

    return () => {
      // Limpiar al desmontar
      widgetIdRef.current = null;
    };
  }, [siteKey, onVerify, onExpire]);

  // Modo de desarrollo sin site key
  if (!siteKey) {
    return (
      <div className="p-3 rounded-2xl bg-[#A7D9BD]/20 border border-[#53A677]/30 flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#067335]" />
          <span className="font-medium">Protección anti-bot activa (Modo Desarrollo)</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500" title="Configura NEXT_PUBLIC_RECAPTCHA_SITE_KEY en .env.local para producción">
          <Info className="w-3.5 h-3.5" />
          <span>Local</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center my-2">
      <div ref={containerRef} className="min-h-[78px] flex items-center justify-center" />
      {!isLoaded && (
        <div className="text-[11px] text-slate-400 animate-pulse">
          Cargando verificación de seguridad...
        </div>
      )}
    </div>
  );
}
