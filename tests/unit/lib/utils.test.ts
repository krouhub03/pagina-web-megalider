import { describe, it, expect } from "vitest";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

describe("lib/utils", () => {
  describe("cn", () => {
    it("debe combinar clases de Tailwind y resolver conflictos", () => {
      const result = cn("p-4", "p-2", "text-white");
      expect(result).toBe("p-2 text-white");
    });

    it("debe ignorar valores condicionales falsos", () => {
      const result = cn("base-class", false && "ignored", null, undefined);
      expect(result).toBe("base-class");
    });
  });

  describe("formatCurrency", () => {
    it("debe formatear a formato moneda COP", () => {
      const formatted = formatCurrency(50000);
      expect(formatted).toContain("50.000");
    });

    it("debe retornar $ 0 si la entrada es inválida o nula", () => {
      expect(formatCurrency(null)).toContain("0");
      expect(formatCurrency("abc")).toContain("0");
    });
  });

  describe("formatDate", () => {
    it("debe retornar raya ante valores vacíos o nulos", () => {
      expect(formatDate(null)).toBe("—");
      expect(formatDate("")).toBe("—");
    });

    it("debe formatear fechas válidas", () => {
      const result = formatDate("2026-05-10T10:00:00Z");
      expect(result).toBeDefined();
      expect(result).not.toBe("—");
    });
  });
});
