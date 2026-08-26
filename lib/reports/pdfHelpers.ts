import pdfMake from "pdfmake";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";

import { REPORT_TIME_ZONE } from "./filename";
import { PDF_FONTS } from "./pdfFonts";

const GROUP_HEADER_FILL = "#27272a"; // zinc-800
const SUBGROUP_HEADER_FILL = "#52525b"; // zinc-600
const TABLE_HEADER_FILL = "#f4f4f5"; // zinc-100

// "combined" = todas las hojas en un flujo continuo (como imprimir para uso
// interno). "separated" fuerza que cada dirigente arranque en una hoja
// nueva (para entregarle a cada uno la suya sin cortar papel a mano).
export type PdfReportMode = "combined" | "separated";

export function parsePdfReportMode(value: string | null): PdfReportMode {
  return value === "separated" ? "separated" : "combined";
}

export function formatGeneratedAt(): string {
  return new Date().toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: REPORT_TIME_ZONE,
  });
}

// Barra resaltada de encabezado de grupo (ej. un dirigente). `variant`
// "subgroup" se usa para un nivel anidado (ej. un puntero dentro de un
// dirigente): mismo estilo pero mas angosto/indentado y un gris mas claro,
// para que la jerarquia se note de un vistazo. `pageBreak: "before"` se usa
// en el modo "separado" para que cada dirigente arranque en una hoja nueva
// (para poder entregarle a cada uno solo la suya, sin tener que cortar).
export function groupHeaderRow(
  label: string,
  variant: "group" | "subgroup" = "group",
  pageBreak?: "before"
): Content {
  return {
    table: {
      widths: ["*"],
      body: [
        [
          {
            text: label,
            bold: true,
            fontSize: variant === "group" ? 11 : 10,
            color: "#ffffff",
            fillColor: variant === "group" ? GROUP_HEADER_FILL : SUBGROUP_HEADER_FILL,
            margin: [6, 4, 6, 4],
          },
        ],
      ],
    },
    layout: "noBorders",
    margin: variant === "group" ? [0, 10, 0, 2] : [14, 4, 0, 2],
    ...(pageBreak ? { pageBreak } : {}),
  };
}

export function tableHeaderCell(text: string): Content {
  return { text, bold: true, fontSize: 9, fillColor: TABLE_HEADER_FILL, margin: [4, 3, 4, 3] };
}

export function tableCell(text: string): Content {
  return { text, fontSize: 9, margin: [4, 3, 4, 3] };
}

export async function renderPdfBuffer(
  content: Content[],
  title: string,
  organizationName?: string | null
): Promise<Buffer> {
  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [30, 40, 30, 30],
    defaultStyle: { font: "Helvetica", fontSize: 9 },
    content: [
      { text: title, fontSize: 16, bold: true, margin: [0, 0, 0, 2] },
      ...(organizationName
        ? ([{ text: `Organización: ${organizationName}`, fontSize: 9, color: "#3f3f46", margin: [0, 0, 0, 2] }] as Content[])
        : []),
      { text: `Generado el ${formatGeneratedAt()}`, fontSize: 8, color: "#71717a", margin: [0, 0, 0, 10] },
      ...content,
    ],
  };

  pdfMake.setFonts(PDF_FONTS);
  const pdf = pdfMake.createPdf(docDefinition);
  return pdf.getBuffer();
}
