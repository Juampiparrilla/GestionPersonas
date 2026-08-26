import type { Content } from "pdfmake/interfaces";

import type { PointerLeaderGroup } from "@/features/pointers/queries";

import { addEmptyRow, addOrganizationTitleRow, newWorkbook, styleHeaderRow, workbookToBuffer } from "./excelHelpers";
import { groupHeaderRow, renderPdfBuffer, tableCell, tableHeaderCell, type PdfReportMode } from "./pdfHelpers";

const COLUMN_HEADERS = ["Nombre", "DNI", "Teléfono", "Dirección", "Personas"];

export async function buildPointersReportPdf(
  groups: PointerLeaderGroup[],
  mode: PdfReportMode = "combined",
  organizationName?: string | null
): Promise<Buffer> {
  const content: Content[] = [];

  groups.forEach((group, index) => {
    content.push(
      groupHeaderRow(
        `${index + 1}. ${group.leaderName} · ${group.pointers.length} punteros`,
        "group",
        mode === "separated" && index > 0 ? "before" : undefined
      )
    );

    if (group.pointers.length === 0) {
      content.push({
        text: "Sin punteros cargados.",
        italics: true,
        fontSize: 9,
        color: "#71717a",
        margin: [4, 2, 0, 6],
      });
      return;
    }

    content.push({
      table: {
        headerRows: 1,
        widths: ["*", "auto", "auto", "*", "auto"],
        body: [
          COLUMN_HEADERS.map((label) => tableHeaderCell(label)),
          ...group.pointers.map((pointer) => [
            tableCell(pointer.fullName),
            tableCell(pointer.dni),
            tableCell(pointer.phone ?? "-"),
            tableCell(pointer.address ?? "-"),
            tableCell(String(pointer.peopleCount)),
          ]),
        ],
      },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 6],
    });
  });

  return renderPdfBuffer(content, "Reporte de Punteros", organizationName);
}

// Formato PLANO (una fila por puntero, sin encabezados de grupo fusionados):
// a diferencia del PDF, el Excel se usa para filtrar/ordenar en una
// planilla, asi que la columna DIRIGENTE va al final de cada fila en vez de
// una fila de grupo aparte.
export async function buildPointersReportExcel(
  groups: PointerLeaderGroup[],
  organizationName?: string | null
): Promise<Buffer> {
  const workbook = newWorkbook();
  const sheet = workbook.addWorksheet("Punteros");
  sheet.columns = [
    { header: "Nombre", key: "name", width: 28 },
    { header: "DNI", key: "dni", width: 14 },
    { header: "Teléfono", key: "phone", width: 16 },
    { header: "Dirección", key: "address", width: 28 },
    { header: "Personas", key: "people", width: 12 },
    { header: "DIRIGENTE", key: "leader", width: 24 },
  ];
  styleHeaderRow(sheet.getRow(1));
  const columnCount = sheet.columns.length;

  let hasAnyRow = false;
  for (const group of groups) {
    for (const pointer of group.pointers) {
      hasAnyRow = true;
      sheet.addRow({
        name: pointer.fullName,
        dni: pointer.dni,
        phone: pointer.phone ?? "",
        address: pointer.address ?? "",
        people: pointer.peopleCount,
        leader: group.leaderName,
      });
    }
  }
  if (!hasAnyRow) {
    addEmptyRow(sheet, "Todavía no hay punteros cargados.", columnCount);
  }

  if (organizationName) {
    addOrganizationTitleRow(sheet, organizationName, columnCount);
  }

  return workbookToBuffer(workbook);
}
