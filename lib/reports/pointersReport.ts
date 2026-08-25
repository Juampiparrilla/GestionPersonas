import type { Content } from "pdfmake/interfaces";

import type { PointerLeaderGroup } from "@/features/pointers/queries";

import { addEmptyRow, addGroupHeaderRow, newWorkbook, styleHeaderRow, workbookToBuffer } from "./excelHelpers";
import { groupHeaderRow, renderPdfBuffer, tableCell, tableHeaderCell } from "./pdfHelpers";

const COLUMN_HEADERS = ["Nombre", "DNI", "Teléfono", "Dirección", "Personas"];

export async function buildPointersReportPdf(groups: PointerLeaderGroup[]): Promise<Buffer> {
  const content: Content[] = [];

  for (const group of groups) {
    content.push(groupHeaderRow(`${group.leaderName} · ${group.pointers.length} punteros`));

    if (group.pointers.length === 0) {
      content.push({
        text: "Sin punteros cargados.",
        italics: true,
        fontSize: 9,
        color: "#71717a",
        margin: [4, 2, 0, 6],
      });
      continue;
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
  }

  return renderPdfBuffer(content, "Reporte de Punteros");
}

export async function buildPointersReportExcel(groups: PointerLeaderGroup[]): Promise<Buffer> {
  const workbook = newWorkbook();
  const sheet = workbook.addWorksheet("Punteros");
  sheet.columns = [
    { header: "Nombre", key: "name", width: 28 },
    { header: "DNI", key: "dni", width: 14 },
    { header: "Teléfono", key: "phone", width: 16 },
    { header: "Dirección", key: "address", width: 28 },
    { header: "Personas", key: "people", width: 12 },
  ];
  styleHeaderRow(sheet.getRow(1));
  const columnCount = sheet.columns.length;

  for (const group of groups) {
    addGroupHeaderRow(sheet, `${group.leaderName} (${group.pointers.length} punteros)`, columnCount);

    if (group.pointers.length === 0) {
      addEmptyRow(sheet, "Sin punteros cargados.", columnCount);
      continue;
    }

    for (const pointer of group.pointers) {
      sheet.addRow({
        name: pointer.fullName,
        dni: pointer.dni,
        phone: pointer.phone ?? "",
        address: pointer.address ?? "",
        people: pointer.peopleCount,
      });
    }
  }

  return workbookToBuffer(workbook);
}
