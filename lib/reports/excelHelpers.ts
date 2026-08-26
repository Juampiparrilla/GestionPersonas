import ExcelJS from "exceljs";

const GROUP_HEADER_FILL = "FF27272A"; // zinc-800
const SUBGROUP_HEADER_FILL = "FF52525B"; // zinc-600
const TABLE_HEADER_FILL = "FFF4F4F5"; // zinc-100

export function newWorkbook(): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Gestión de Personas";
  workbook.created = new Date();
  return workbook;
}

// Fila combinada resaltada para el encabezado de un grupo (ej. un dirigente),
// con toda la fila fusionada en una sola celda con el nombre y el total.
export function addGroupHeaderRow(
  sheet: ExcelJS.Worksheet,
  label: string,
  columnCount: number,
  variant: "group" | "subgroup" = "group"
): void {
  const row = sheet.addRow([label]);
  sheet.mergeCells(row.number, 1, row.number, columnCount);
  const cell = row.getCell(1);
  cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: variant === "group" ? GROUP_HEADER_FILL : SUBGROUP_HEADER_FILL },
  };
  cell.alignment = { vertical: "middle", indent: variant === "subgroup" ? 1 : 0 };
  row.height = 20;
}

export function styleHeaderRow(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TABLE_HEADER_FILL } };
    cell.border = { bottom: { style: "thin", color: { argb: "FFD4D4D8" } } };
  });
}

// Inserta una fila de titulo con el nombre de la organizacion arriba del
// encabezado ya escrito por `sheet.columns` -- se llama DESPUES de fijar
// `sheet.columns` (que ya ocupo la fila 1 con los encabezados) y de
// `styleHeaderRow`, para que `spliceRows` empuje ese encabezado a la fila 2
// sin tener que reescribirlo.
export function addOrganizationTitleRow(sheet: ExcelJS.Worksheet, organizationName: string, columnCount: number): void {
  sheet.spliceRows(1, 0, [`Organización: ${organizationName}`]);
  sheet.mergeCells(1, 1, 1, columnCount);
  const cell = sheet.getRow(1).getCell(1);
  cell.font = { bold: true };
  sheet.getRow(1).height = 20;
}

export function addEmptyRow(sheet: ExcelJS.Worksheet, label: string, columnCount: number): void {
  const row = sheet.addRow([label]);
  sheet.mergeCells(row.number, 1, row.number, columnCount);
  row.getCell(1).font = { italic: true, color: { argb: "FF71717A" } };
}

export async function workbookToBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
  const raw = await workbook.xlsx.writeBuffer();
  return Buffer.from(raw);
}
