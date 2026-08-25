import type { Content } from "pdfmake/interfaces";

import type { PersonLeaderGroup } from "@/features/people/queries";

import { addEmptyRow, addGroupHeaderRow, newWorkbook, styleHeaderRow, workbookToBuffer } from "./excelHelpers";
import { groupHeaderRow, renderPdfBuffer, tableCell, tableHeaderCell } from "./pdfHelpers";

const COLUMN_HEADERS = ["Nombre", "DNI", "Teléfono", "Dirección"];

export async function buildPeopleReportPdf(groups: PersonLeaderGroup[]): Promise<Buffer> {
  const content: Content[] = [];

  for (const leaderGroup of groups) {
    const totalPeople = leaderGroup.pointerGroups.reduce((sum, pg) => sum + pg.people.length, 0);
    content.push(
      groupHeaderRow(
        `${leaderGroup.leaderName} · ${leaderGroup.pointerGroups.length} punteros · ${totalPeople} personas`
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
      continue;
    }

    for (const pointerGroup of leaderGroup.pointerGroups) {
      content.push(groupHeaderRow(`Puntero: ${pointerGroup.pointerName} · ${pointerGroup.people.length} personas`, "subgroup"));

      if (pointerGroup.people.length === 0) {
        content.push({
          text: "Este puntero todavía no tiene personas registradas.",
          italics: true,
          fontSize: 9,
          color: "#71717a",
          margin: [18, 2, 0, 6],
        });
        continue;
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
    }
  }

  return renderPdfBuffer(content, "Reporte de Personas Registradas");
}

export async function buildPeopleReportExcel(groups: PersonLeaderGroup[]): Promise<Buffer> {
  const workbook = newWorkbook();
  const sheet = workbook.addWorksheet("Personas");
  sheet.columns = [
    { header: "Nombre", key: "name", width: 28 },
    { header: "DNI", key: "dni", width: 14 },
    { header: "Teléfono", key: "phone", width: 16 },
    { header: "Dirección", key: "address", width: 28 },
  ];
  styleHeaderRow(sheet.getRow(1));
  const columnCount = sheet.columns.length;

  for (const leaderGroup of groups) {
    const totalPeople = leaderGroup.pointerGroups.reduce((sum, pg) => sum + pg.people.length, 0);
    addGroupHeaderRow(
      sheet,
      `${leaderGroup.leaderName} (${leaderGroup.pointerGroups.length} punteros · ${totalPeople} personas)`,
      columnCount
    );

    if (leaderGroup.pointerGroups.length === 0) {
      addEmptyRow(sheet, "Este dirigente todavía no tiene punteros.", columnCount);
      continue;
    }

    for (const pointerGroup of leaderGroup.pointerGroups) {
      addGroupHeaderRow(
        sheet,
        `Puntero: ${pointerGroup.pointerName} (${pointerGroup.people.length} personas)`,
        columnCount,
        "subgroup"
      );

      if (pointerGroup.people.length === 0) {
        addEmptyRow(sheet, "Este puntero todavía no tiene personas registradas.", columnCount);
        continue;
      }

      for (const person of pointerGroup.people) {
        sheet.addRow({
          name: person.fullName,
          dni: person.dni,
          phone: person.phone ?? "",
          address: person.address ?? "",
        });
      }
    }
  }

  return workbookToBuffer(workbook);
}
