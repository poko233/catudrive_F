import * as Print from "expo-print";
import { Platform } from "react-native";
import type { Chofer } from "../types/chofer.types";
import type { Empresa } from "@/screens/admin/empresa/types/empresa.types";
import { CARNET_FONDO_URI } from "./carnetAssets";

// Carnet vertical ID-1: 54 mm de ancho y 85,6 mm de alto.
export const CARNET_ANCHO_MM = 54;
export const CARNET_ALTO_MM = 85.6;

export type LadoCarnet = "anverso" | "reverso";

/** Marca obtenida de GET /api/empresa/mi-empresa (igual que el store global). */
export type IdentidadCarnet = {
  nombre: string;
  logo: string | null;
};

export function identidadCarnetEmpresa(
  empresa: Empresa | null,
  logoUrl?: string | null,
  iconoUrl?: string | null,
): IdentidadCarnet {
  const nombre = empresa?.empresa?.trim() || "EMPRESA SIN CONFIGURAR";
  // El backend EmpresaResource ya entrega URL publica en logos.*.
  // Se prioriza el logo cuadrado, igual que el logoUrl del empresaStore.
  const logo =
    empresa?.logos?.cuadrado?.trim() ||
    empresa?.logos?.icono?.trim() ||
    logoUrl?.trim() ||
    iconoUrl?.trim() ||
    null;
  return { nombre, logo };
}

// Estos campos NO estan actualmente en el recurso Chofer del backend.
// Se admiten opcionalmente para futuras ampliaciones sin inventar datos.
type ChoferConDatosSindicales = Chofer & {
  categoria_sindical?: string | null;
  vigencia?: string | null;
  fecha_vencimiento?: string | null;
};

export function datosCarnetChofer(chofer: Chofer) {
  const registro = chofer as ChoferConDatosSindicales;
  const vigencia = registro.vigencia || registro.fecha_vencimiento || "";
  const fecha = /^\d{4}-\d{2}-\d{2}/.test(vigencia)
    ? vigencia.slice(0, 10).split("-").reverse().join("-")
    : vigencia;

  return {
    nombre: chofer.nombre_completo || "—",
    ci: chofer.carnet_identidad || "—",
    sindical: chofer.carnet_sindical || "—",
    categoria: registro.categoria_sindical?.trim() || "NO REGISTRADA",
    licencia: chofer.categoria_licencia
      ? `CATEGORÍA ${String(chofer.categoria_licencia).replace(/^CATEGOR[IÍ]A\s+/i, "")}`
      : "NO REGISTRADA",
    vigencia: fecha || "NO REGISTRADA",
  };
}

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function imagen(uri: string | null | undefined, clase: string, texto: string): string {
  return uri
    ? `<img class="${clase}" src="${escapeHtml(uri)}" alt="${escapeHtml(texto)}" />`
    : `<div class="${clase} sin-imagen">${escapeHtml(texto)}</div>`;
}

function lineas(chofer: Chofer): string {
  const d = datosCarnetChofer(chofer);
  return `
    <div class="campo"><span>Número de Cédula:</span><b>${escapeHtml(d.ci)}</b></div>
    <div class="campo"><span>ID Sindical:</span><b>${escapeHtml(d.sindical)}</b></div>
    <div class="campo"><span>Categoría:</span><b>${escapeHtml(d.categoria)}</b></div>
    <div class="campo"><span>Licencia:</span><b>${escapeHtml(d.licencia)}</b></div>
    <div class="campo"><span>Vigencia:</span><b>${escapeHtml(d.vigencia)}</b></div>
  `;
}

function encabezado(identidad: IdentidadCarnet): string {
  return `<header>
    ${imagen(identidad.logo, "logo", "SIN LOGO")}
    <div class="organizacion">${escapeHtml(identidad.nombre)}</div>
  </header>`;
}

function cara(chofer: Chofer, lado: LadoCarnet, identidad: IdentidadCarnet): string {
  const d = datosCarnetChofer(chofer);
  const contenido = lado === "anverso"
    ? `<div class="foto-wrap">${imagen(chofer.fotoUrl, "foto", "SIN FOTO")}</div>`
    : `<div class="qr-titulo">ESCANEE PARA<br/>VERIFICAR VALIDEZ</div>
       <div class="qr-wrap">${imagen(chofer.qrUrl, "qr", "SIN QR")}</div>`;

  return `<section class="carnet ${lado}">
    <img class="fondo" src="${CARNET_FONDO_URI}" alt="" />
    <div class="contenido">
      ${encabezado(identidad)}
      ${contenido}
      <div class="datos">
        <div class="nombre-etiqueta">NOMBRE COMPLETO:</div>
        <div class="nombre">${escapeHtml(d.nombre)}</div>
        ${lineas(chofer)}
      </div>
    </div>
  </section>`;
}

/** Genera dos caras en dos paginas separadas; no usa datos de ejemplo. */
export function construirCarnetChoferHtml(chofer: Chofer, identidad: IdentidadCarnet): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Carnet sindical - ${escapeHtml(identidad.nombre)} - ${escapeHtml(chofer.nombre_completo)}</title>
<style>
  @page { size: ${CARNET_ANCHO_MM}mm ${CARNET_ALTO_MM}mm; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body { padding: 0; margin: 0; width: ${CARNET_ANCHO_MM}mm; background: white; color: #101828; font-family: Arial, Helvetica, sans-serif; }
  .carnet { width: ${CARNET_ANCHO_MM}mm; height: ${CARNET_ALTO_MM}mm; position: relative; overflow: hidden; background: #fff; break-inside: avoid; page-break-inside: avoid; }
  .carnet.anverso { break-after: page; page-break-after: always; }
  .fondo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; }
  .contenido { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; align-items: center; padding: 2.3mm 2.6mm 3mm; }
  header { width: 100%; text-align: center; flex-shrink: 0; }
  .logo { width: 13mm; height: 12mm; object-fit: contain; display: block; margin: 0 auto .6mm; }
  .organizacion { font-size: 2.4mm; font-weight: 900; line-height: 1.2; color: #101a31; overflow-wrap: anywhere; max-height: 9mm; overflow: hidden; }
  .logo.sin-imagen { width: 13mm; height: 12mm; border: .2mm solid #d5dde5; border-radius: 2mm; }
  .foto-wrap { width: 20mm; height: 25mm; flex-shrink: 0; margin: 1.8mm auto 1.5mm; border: .35mm solid #436b60; border-radius: 10mm 10mm 8mm 8mm; padding: .55mm; overflow: hidden; background: #fff; }
  .foto { width: 100%; height: 100%; object-fit: cover; border-radius: 9mm 9mm 7mm 7mm; }
  .qr-titulo { text-align: center; font-size: 3mm; font-weight: 900; line-height: 1.12; margin-top: 2.4mm; }
  .qr-wrap { width: 20.5mm; height: 20.5mm; margin: 1.1mm auto 2.6mm; flex-shrink: 0; background: #fff; padding: .6mm; }
  .qr { display: block; width: 100%; height: 100%; object-fit: contain; image-rendering: auto; }
  .sin-imagen { display: flex; align-items: center; justify-content: center; font-size: 2.2mm; color: #536271; font-weight: bold; text-align: center; }
  .datos { width: 100%; text-align: center; min-width: 0; }
  .nombre-etiqueta { font-size: 2.8mm; line-height: 1.15; font-weight: 400; color: #000; }
  .nombre { font-size: 3.55mm; line-height: 1.06; font-weight: 900; text-transform: uppercase; color: #0c1b39; margin: .55mm 0 1.5mm; overflow-wrap: anywhere; }
  .campo { display: flex; justify-content: center; align-items: baseline; flex-wrap: wrap; column-gap: 1mm; margin: 0 0 1.65mm; font-size: 2.65mm; line-height: 1.12; color: #080808; }
  .campo b { font-weight: 900; overflow-wrap: anywhere; }
  .reverso .datos { margin-top: .1mm; }
  .reverso .nombre { margin-bottom: 1.7mm; }
  @media screen { body { background: #eee; } }
  @media print { html, body { width: ${CARNET_ANCHO_MM}mm; background: #fff; } .carnet { margin: 0; box-shadow: none; } }
</style></head><body>
${cara(chofer, "anverso", identidad)}
${cara(chofer, "reverso", identidad)}
</body></html>`;
}

function esperarImagenes(ventana: Window): Promise<void> {
  const imagenes = Array.from(ventana.document.images);
  return Promise.all(imagenes.map((img) => new Promise<void>((resolve) => {
    if (img.complete) { resolve(); return; }
    let terminado = false;
    const done = () => { if (!terminado) { terminado = true; resolve(); } };
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
    setTimeout(done, 3500);
  }))).then(() => undefined);
}

async function imprimirCarnetWeb(html: string): Promise<void> {
  // Abrir en el mismo evento del boton evita el bloqueo de popups.
  const ventana = window.open("", "_blank", "popup=yes,width=840,height=760");
  if (!ventana) throw new Error("El navegador bloqueó la ventana de impresión. Habilita las ventanas emergentes.");
  ventana.document.open();
  ventana.document.write(html);
  ventana.document.close();
  await esperarImagenes(ventana);
  await new Promise<void>((resolve) => setTimeout(resolve, 150));
  ventana.focus();
  ventana.addEventListener("afterprint", () => { try { ventana.close(); } catch { /* sin accion */ } }, { once: true });
  ventana.print();
}

export async function imprimirCarnetChofer(chofer: Chofer, identidad: IdentidadCarnet): Promise<void> {
  const html = construirCarnetChoferHtml(chofer, identidad);
  if (Platform.OS === "web") {
    await imprimirCarnetWeb(html);
    return;
  }
  await Print.printAsync({ html, orientation: Print.Orientation.portrait });
}
