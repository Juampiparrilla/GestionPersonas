import type { Content } from "pdfmake/interfaces";

import type { PersonLeaderGroup } from "@/features/people/queries";

import { addEmptyRow, newWorkbook, styleHeaderRow, workbookToBuffer } from "./excelHelpers";
import { groupHeaderRow, renderPdfBuffer, tableCell, tableHeaderCell, type PdfReportMode } from "./pdfHelpers";

const COLUMN_HEADERS = ["Nombre", "DNI", "Teléfono", "Dirección"];

export async function buildPeopleReportPdf(
  groups: PersonLeaderGroup[],
  mode: PdfReportMode = "combined"
): Promise<Buffer> {
  const content: Content[] = [];

  groups.forEach((leaderGroup, leaderIndex) => {
    const totalPeople = leaderGroup.pointerGroups.reduce((sum, pg) => sum + pg.people.length, 0);
    content.push(
      groupHeaderRow(
        `${leaderIndex + 1}. ${leaderGroup.leaderName} · ${leaderGroup.pointerGroups.length} punteros · ${totalPeople} personas`,
        "group",
        mode === "separated" && leaderIndex > 0 ? "before" : undefined
      )
    );

    if (leaderGroup.pointerGroups.length === 0) {
      content.push({
        text: "Este dirigente todavía no tiene punteros.",
        italics: true,
        fontSize: 9,
        color: "#71717a",
        margin: [4, 2, 0, 6],
      });
      return;
    }

    leaderGroup.pointerGroups.forEach((pointerGroup, pointerIndex) => {
      content.push(
        groupHeaderRow(
          `${pointerIndex + 1}. Puntero: ${pointerGroup.pointerName} · ${pointerGroup.people.length} personas`,
          "subgroup"
        )
      );

      if (pointerGroup.people.length === 0) {
        content.push({
          text: "Este puntero todavía no tiene personas registradas.",
          italics: true,
          fontSize: 9,
          color: "#71717a",
          margin: [18, 2, 0, 6],
        });
        return;
      }

      content.push({
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "*"],
          body: [
            COLUMN_HEADERS.map((label) => tableHeaderCell(label)),
            ...pointerGroup.people.map((person) => [
              tableCell(person.fullName),
              tableCell(person.dni),
              tableCell(person.phone ?? "-"),
              tableCell(person.address ?? "-"),
            ]),
          ],
        },
        layout: "lightHorizontalLines",
        margin: [14, 0, 0, 6],
      });
    });
  });

  return renderPdfBuffer(content, "Reporte de Personas Registradas");
}

// Formato PLANO (una fila por persona, sin encabezados de grupo fusionados):
// PUNTERO y DIRIGENTE van como columnas al final de cada fila para poder
// filtrar/ordenar por cualquiera de los dos en la planilla.
export async function buildPeopleReportExcel(groups: PersonLeaderGroup[]): Promise<Buffer> {
  const workbook = newWorkbook();
  const sheet = workbook.addWorksheet("Personas");
  sheet.columns = [
    { header: "Nombre", key: "name", width: 28 },
    { header: "DNI", key: "dni", width: 14 },
    { header: "Teléfono", key: "phone", width: 16 },
    { header: "Dirección", key: "address", width: 28 },
    { header: "PUNTERO", key: "pointer", width: 24 },
    { header: "DIRIGENTE", key: "leader", width: 24 },
  ];
  styleHeaderRow(sheet.getRow(1));
  const columnCount = sheet.columns.length;

  let hasAnyRow = false;
  for (const leaderGroup of groups) {
    for (const pointerGroup of leaderGroup.pointerGroups) {
      for (const person of pointerGroup.people) {
        hasAnyRow = true;
        sheet.addRow({
          name: person.fullName,
          dni: person.dni,
          phone: person.phone ?? "",
          address: person.address ?? "",
          pointer: pointerGroup.pointerName,
          leader: leaderGroup.leaderName,
        });
      }
    }
  }
  if (!hasAnyRow) {
    addEmptyRow(sheet, "Todavía no hay personas registradas.", columnCount);
  }

  return workbookToBuffer(workbook);
}
