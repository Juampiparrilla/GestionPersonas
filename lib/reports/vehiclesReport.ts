import type { Content } from "pdfmake/interfaces";

import { VEHICLE_TYPE_LABEL } from "@/features/vehicles/VehicleCard";
import type { VehicleLeaderGroup } from "@/features/vehicles/queries";

import { addEmptyRow, addGroupHeaderRow, newWorkbook, styleHeaderRow, workbookToBuffer } from "./excelHelpers";
import { groupHeaderRow, renderPdfBuffer, tableCell, tableHeaderCell, type PdfReportMode } from "./pdfHelpers";

// Los vehiculos no tienen Direccion (es del conductor, no se carga ese dato).
const COLUMN_HEADERS = ["Patente", "Tipo", "Conductor", "DNI conductor", "Teléfono conductor"];

export async function buildVehiclesReportPdf(
  groups: VehicleLeaderGroup[],
  mode: PdfReportMode = "combined"
): Promise<Buffer> {
  const content: Content[] = [];

  groups.forEach((group, index) => {
    content.push(
      groupHeaderRow(
        `${index + 1}. ${group.leaderName} · ${group.vehicles.length} vehículos`,
        "group",
        mode === "separated" && index > 0 ? "before" : undefined
      )
    );

    if (group.vehicles.length === 0) {
      content.push({
        text: "Sin vehículos cargados.",
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
        widths: ["auto", "auto", "*", "auto", "auto"],
        body: [
          COLUMN_HEADERS.map((label) => tableHeaderCell(label)),
          ...group.vehicles.map((vehicle) => [
            tableCell(vehicle.plate),
            tableCell(VEHICLE_TYPE_LABEL[vehicle.type]),
            tableCell(vehicle.driverFullName),
            tableCell(vehicle.driverDni),
            tableCell(vehicle.driverPhone ?? "-"),
          ]),
        ],
      },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 6],
    });
  });

  return renderPdfBuffer(content, "Reporte de Vehículos");
}

export async function buildVehiclesReportExcel(groups: VehicleLeaderGroup[]): Promise<Buffer> {
  const workbook = newWorkbook();
  const sheet = workbook.addWorksheet("Vehículos");
  sheet.columns = [
    { header: "Patente", key: "plate", width: 14 },
    { header: "Tipo", key: "type", width: 14 },
    { header: "Conductor", key: "driver", width: 28 },
    { header: "DNI conductor", key: "driverDni", width: 16 },
    { header: "Teléfono conductor", key: "driverPhone", width: 18 },
  ];
  styleHeaderRow(sheet.getRow(1));
  const columnCount = sheet.columns.length;

  groups.forEach((group, index) => {
    addGroupHeaderRow(sheet, `${index + 1}. ${group.leaderName} (${group.vehicles.length} vehículos)`, columnCount);

    if (group.vehicles.length === 0) {
      addEmptyRow(sheet, "Sin vehículos cargados.", columnCount);
      return;
    }

    for (const vehicle of group.vehicles) {
      sheet.addRow({
        plate: vehicle.plate,
        type: VEHICLE_TYPE_LABEL[vehicle.type],
        driver: vehicle.driverFullName,
        driverDni: vehicle.driverDni,
        driverPhone: vehicle.driverPhone ?? "",
      });
    }
  });

  return workbookToBuffer(workbook);
}
