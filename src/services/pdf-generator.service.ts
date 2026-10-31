import PDFDocument from "pdfkit";
import { Response } from "express";
import path from "path";
import fs from "fs";

const COLORS = {
  navy: "#18365C",
  teal: "#269DA3",
  orange: "#F39A36",
  dark: "#333333",
  gray: "#777777",
  lightGray: "#DDE5EA",
};

const LOGO_PATH = path.join(
  process.cwd(),
  "src",
  "assets",
  "pawpath-logo.jpg"
);

const drawHeader = (doc: PDFKit.PDFDocument): void => {
  const pageWidth = doc.page.width;

  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, 50, 25, {
      fit: [125, 68],
      valign: "center",
    });
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.navy)
    .text("PAWPATH", 195, 38);

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.teal)
    .text("Pet Sales & Training Management System", 195, 55);

  doc
    .moveTo(50, 105)
    .lineTo(pageWidth - 50, 105)
    .lineWidth(1.5)
    .strokeColor(COLORS.teal)
    .stroke();

  doc.y = 125;
};

const drawFooter = (
  doc: PDFKit.PDFDocument,
  pageNumber: number,
  totalPages: number
): void => {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const footerY = pageHeight - 48;

  doc
    .moveTo(50, footerY)
    .lineTo(pageWidth - 50, footerY)
    .lineWidth(0.8)
    .strokeColor(COLORS.lightGray)
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.gray)
    .text(
      "PawPath | Pet Sales & Training Management System",
      50,
      footerY + 10,
      { width: 330, lineBreak: false }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(COLORS.navy)
    .text(
      `Page ${pageNumber} of ${totalPages}`,
      pageWidth - 120,
      footerY + 10,
      {
        width: 70,
        align: "right",
        lineBreak: false,
      }
    );
};

export const generatePDF = (
  res: Response,
  fileName: string,
  title: string,
  content: string[]
): void => {
  
  if (!fs.existsSync(LOGO_PATH)) {
    throw new Error("PawPath logo image was not found.");
  }

  const doc = new PDFDocument({
    size: "A4",
    margins: {
      top: 125,
      bottom: 70,
      left: 50,
      right: 50,
    },
    bufferPages: true,
    autoFirstPage: true,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileName}"`
  );

  doc.pipe(res);
  drawHeader(doc);

  doc.on("pageAdded", () => {
    drawHeader(doc);
  });

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(COLORS.navy)
    .text(title, {
      align: "center",
    });

  doc.moveDown(0.6);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.gray)
    .text(`Generated Date: ${new Date().toLocaleString()}`, {
      align: "center",
    });

  doc.moveDown(1);

  doc
    .moveTo(50, doc.y)
    .lineTo(doc.page.width - 50, doc.y)
    .lineWidth(1)
    .strokeColor(COLORS.orange)
    .stroke();

  doc.moveDown(1.5);

  content.forEach((line) => {
    if (line.trim() === "") {
      doc.moveDown(0.7);
      return;
    }

    if (line.startsWith("## ")) {
      doc.moveDown(0.8);

      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor(COLORS.teal)
        .text(line.replace("## ", ""), {
          paragraphGap: 5,
        });

      doc.moveDown(0.3);
      return;
    }

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(COLORS.dark)
      .text(line, {
        width: doc.page.width - 100,
        lineGap: 3,
        paragraphGap: 6,
      });
  });

  const pageRange = doc.bufferedPageRange();
  const totalPages = pageRange.count;

  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);

    drawFooter(doc, i + 1, totalPages);
  }

  doc.end();
};

