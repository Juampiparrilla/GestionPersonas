import type { TFontDictionary } from "pdfmake/interfaces";

// Se usa la fuente estandar Helvetica (una de las 14 fuentes base de PDF,
// incluida en pdfkit) en vez de embeber un archivo .ttf propio -- evita
// bundlear fuentes binarias en el build serverless y ya soporta tildes/ñ
// (WinAnsiEncoding cubre el español).
export const PDF_FONTS: TFontDictionary = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};
