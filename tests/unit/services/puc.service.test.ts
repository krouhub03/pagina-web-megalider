import { describe, it, expect } from "vitest";
import { calcularNivelPuc } from "@/services/puc.service";

describe("PUC Service - calcularNivelPuc", () => {
  it("debe calcular Nivel 1 (Clase) para códigos de 1 dígito", () => {
    expect(calcularNivelPuc("1")).toBe(1);
    expect(calcularNivelPuc("5")).toBe(1);
  });

  it("debe calcular Nivel 2 (Grupo) para códigos de 2 dígitos", () => {
    expect(calcularNivelPuc("11")).toBe(2);
    expect(calcularNivelPuc("51")).toBe(2);
  });

  it("debe calcular Nivel 3 (Cuenta) para códigos de 3 o 4 dígitos", () => {
    expect(calcularNivelPuc("1105")).toBe(3);
    expect(calcularNivelPuc("5135")).toBe(3);
  });

  it("debe calcular Nivel 4 (Subcuenta) para códigos de 5 o 6 dígitos", () => {
    expect(calcularNivelPuc("110505")).toBe(4);
    expect(calcularNivelPuc("513525")).toBe(4);
  });

  it("debe calcular Nivel 5 (Auxiliar) para códigos de más de 6 dígitos", () => {
    expect(calcularNivelPuc("11050501")).toBe(5);
    expect(calcularNivelPuc("513525001")).toBe(5);
  });
});
