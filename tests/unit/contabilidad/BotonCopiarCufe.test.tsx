// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BotonCopiarCufe } from "@/app/(admin)/contabilidad/facturas/BotonCopiarCufe";

describe("<BotonCopiarCufe />", () => {
  const sampleCufe = "8a2f019d45e69123847a98b76c543210abcdef1234567890abcdef1234567890";
  const writeTextSpy = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.restoreAllMocks();
    writeTextSpy.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: writeTextSpy,
      },
      configurable: true,
      writable: true,
    });
  });

  it("debe renderizarse inicialmente con el título 'Copiar CUFE' y texto CUFE", () => {
    render(<BotonCopiarCufe cufe={sampleCufe} />);

    const button = screen.getByTitle("Copiar CUFE");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("CUFE");
  });

  it("debe copiar el CUFE al portapapeles y cambiar el estado a '¡Copiado!'", async () => {
    render(<BotonCopiarCufe cufe={sampleCufe} />);

    const button = screen.getByTitle("Copiar CUFE");
    fireEvent.click(button);

    expect(writeTextSpy).toHaveBeenCalledWith(sampleCufe);
    await waitFor(() => {
      expect(button).toHaveTextContent("¡Copiado!");
    });
  });
});
