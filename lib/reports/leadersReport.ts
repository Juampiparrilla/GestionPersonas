import type { Content } from "pdfmake/interfaces";

import type { LeaderListItem } from "@/features/leaders/queries";

import { addEmptyRow, newWorkbook, styleHeaderRow, workbookToBuffer } from "./excelHelpers";
import { groupHeaderRow, renderPdfBuffer, tableCell, tableHeaderCell, type PdfReportMode } from "./pdfHelpers";

const COLUMN_HEADERS = ["DNI", "Teléfono", "Dirección", "Punteros", "Personas", "Vehículos"];

export async function buildLeadersReportPdf(
  leaders: LeaderListItem[],
  mode: PdfReportMode = "combined"
): Promise<Buffer> {
  const content: Content[] = [];

  if (leaders.length === 0) {
    content.push({
      text: "Todavía no hay dirigentes cargados.",
      italics: true,
      fontSize: 9,
      color: "#71717a",
      margin: [4, 2, 0, 6],
    });
  }

  leaders.forEach((leader, index) => {
    content.push(
      groupHeaderRow(`${index + 1}. ${leader.fullName}`, "group", mode === "separated" && index > 0 ? "before" : undefined)
    );

    content.push({
      table: {
        widths: ["auto", "auto", "*", "auto", "auto", "auto"],
        body: [
          COLUMN_HEADERS.map((label) => tableHeaderCell(label)),
          [
            tableCell(leader.dni),
            tableCell(leader.phone ?? "-"),
            tableCell(leader.address ?? "-"),
            tableCell(String(leader.pointerCount)),
            tableCell(String(leader.personCount)),
            tableCell(String(leader.vehicleCount)),
          ],
        ],
      },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 6],
    });
  });

  return renderPdfBuffer(content, "Reporte de Dirigentes");
}

export async function buildLeadersReportExcel(leaders: LeaderListItem[]): Promise<Buffer> {
  const workbook = newWorkbook();
  const sheet = workbook.addWorksheet("Dirigentes");
  sheet.columns = [
    { header: "Nombre", key: "name", width: 28 },
    { header: "DNI", key: "dni", width: 14 },
    { header: "Teléfono", key: "phone", width: 16 },
    { header: "Dirección", key: "address", width: 28 },
    { header: "Punteros", key: "pointers", width: 12 },
    { header: "Personas", key: "people", width: 12 },
    { header: "Vehículos", key: "vehicles", width: 12 },
  ];
  styleHeaderRow(sheet.getRow(1));
  const columnCount = sheet.columns.length;

  if (leaders.length === 0) {
    addEmptyRow(sheet, "Todavía no hay dirigentes cargados.", columnCount);
  }

  leaders.forEach((leader, index) => {
    sheet.addRow({
      name: `${index + 1}. ${leader.fullName}`,
      dni: leader.dni,
      phone: leader.phone ?? "",
      address: leader.address ?? "",
      pointers: leader.pointerCount,
      people: leader.personCount,
      vehicles: leader.vehicleCount,
    });
  });

  return workbookToBuffer(workbook);
}
