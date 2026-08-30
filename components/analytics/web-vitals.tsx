"use client";

import { useReportWebVitals } from "next/web-vitals";

function sendAnalytics(metric: Parameters<Parameters<typeof useReportWebVitals>[0]>[0]) {
  const body = JSON.stringify({
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    navigationType: metric.navigationType,
    page: typeof window !== "undefined" ? window.location.pathname : "",
  });

  const url = "/api/analytics";

  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else if (typeof fetch !== "undefined") {
    fetch(url, {
      body,
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    }).catch(() => {
      // Ignorar errores de red silenciosamente
    });
  }
}

export function WebVitals() {
  useReportWebVitals(sendAnalytics);
  return null;
}
