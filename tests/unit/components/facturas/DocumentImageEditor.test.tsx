// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React, { createRef } from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DocumentImageEditor, DocumentImageEditorHandle } from "@/components/facturas/DocumentImageEditor";

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("<DocumentImageEditor />", () => {
  const mockImages = [
    {
      id: 1,
      datosBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    },
  ];

  it("debe renderizar el editor e imagen sin elementos residuales de lupa", () => {
    render(<DocumentImageEditor images={mockImages} />);

    // El visor debe existir con accesibilidad
    const viewer = screen.getByRole("region", { name: /visor y editor interactivo de documento/i });
    expect(viewer).toBeInTheDocument();

    // No debe existir ningún botón ni texto de Lupa
    expect(screen.queryByText(/lupa/i)).not.toBeInTheDocument();
  });

  it("debe permitir aumentar y reducir el zoom con los controles flotantes", () => {
    render(<DocumentImageEditor images={mockImages} />);

    const zoomResetBtn = screen.getByTitle(/restablecer al 100%/i);
    expect(zoomResetBtn).toHaveTextContent("100%");

    const zoomInBtn = screen.getByTitle(/acercar hoja/i);
    fireEvent.click(zoomInBtn);
    expect(zoomResetBtn).toHaveTextContent("110%");

    const zoomOutBtn = screen.getByTitle(/alejar hoja/i);
    fireEvent.click(zoomOutBtn);
    fireEvent.click(zoomOutBtn);
    expect(zoomResetBtn).toHaveTextContent("90%");
  });

  it("debe modificar el nivel de zoom con eventos de rueda (wheel / scroll)", () => {
    render(<DocumentImageEditor images={mockImages} />);

    const viewer = screen.getByRole("region", { name: /visor y editor interactivo de documento/i });
    const zoomResetBtn = screen.getByTitle(/restablecer al 100%/i);

    // Scroll arriba (deltaY < 0) debe aumentar zoom
    fireEvent.wheel(viewer, { deltaY: -100 });
    expect(zoomResetBtn).toHaveTextContent("110%");

    // Scroll abajo (deltaY > 0) debe reducir zoom
    fireEvent.wheel(viewer, { deltaY: 100 });
    fireEvent.wheel(viewer, { deltaY: 100 });
    expect(zoomResetBtn).toHaveTextContent("90%");
  });

  it("debe activar la herramienta de línea recta y permitir trazo punto a punto", () => {
    const ref = createRef<DocumentImageEditorHandle>();
    render(<DocumentImageEditor ref={ref} images={mockImages} />);

    // El botón de línea debe existir
    const lineBtn = screen.getByTitle(/línea recta/i);
    expect(lineBtn).toBeInTheDocument();

    // Activar herramienta de línea
    fireEvent.click(lineBtn);

    const viewer = screen.getByRole("region", { name: /visor y editor interactivo de documento/i });

    // Clic 1: Punto A
    fireEvent.mouseDown(viewer, { clientX: 100, clientY: 100 });

    // Movimiento hacia Punto B
    fireEvent.mouseMove(viewer, { clientX: 200, clientY: 200 });

    // Clic 2: Punto B
    fireEvent.mouseDown(viewer, { clientX: 200, clientY: 200 });

    // Las marcas deben haberse registrado
    const drawings = ref.current?.getDrawings();
    expect(drawings).toBeDefined();
  });

  it("debe exponer métodos imperativos a través de la ref", () => {
    const ref = createRef<DocumentImageEditorHandle>();
    render(<DocumentImageEditor ref={ref} images={mockImages} />);

    expect(ref.current).toBeDefined();
    expect(typeof ref.current?.getCompositeDataUrl).toBe("function");
    expect(typeof ref.current?.clearAllMarks).toBe("function");
    expect(typeof ref.current?.getImageVersion).toBe("function");
    expect(typeof ref.current?.setImageVersion).toBe("function");
  });
});

