import PDFDocument from "pdfkit";
import { Response } from "express";
import path from "path";
import fs from "fs";

const COLORS = {
  navy: "#18365C",
  navyLight: "#254B73",
  teal: "#269DA3",
  orange: "#F39A36",
  dark: "#303B49",
  gray: "#718096",
  lightGray: "#E2E8F0",
  background: "#F4F7FA",
  white: "#FFFFFF",
  paleTeal: "#EAF7F7",
};

const PAGE_MARGIN = 48;
const FOOTER_HEIGHT = 42;

const LOGO_PATH = path.join(
  process.cwd(),
  "src",
  "assets",
  "pawpath-logo.jpg"
);

const drawHeader = (doc: PDFKit.PDFDocument): void => {
  const pageWidth = doc.page.width;

  doc.save();
  doc.rect(0, 0, pageWidth, 112).fill(COLORS.white);

  doc.rect(0, 0, 7, 112).fill(COLORS.teal);

  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, PAGE_MARGIN, 19, {
      fit: [105, 65],
      align: "center",
      valign: "center",
    });
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(17)
    .fillColor(COLORS.navy)
    .text("PAWPATH", 175, 28, {
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(COLORS.teal)
    .text("PET SALES & TRAINING MANAGEMENT SYSTEM", 175, 51, {
      width: 340,
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.gray)
    .text("MANAGEMENT REPORTS", 175, 69, {
      lineBreak: false,
    });

  doc
    .moveTo(PAGE_MARGIN, 103)
    .lineTo(pageWidth - PAGE_MARGIN, 103)
    .lineWidth(1.3)
    .strokeColor(COLORS.teal)
    .stroke();

  doc.restore();

  doc.y = 128;
};

const drawFooter = (
  doc: PDFKit.PDFDocument,
  pageNumber: number,
  totalPages: number
): void => {
  const pageWidth = doc.page.width;
  const footerY = doc.page.height - FOOTER_HEIGHT;

  doc.save();

  doc
    .moveTo(PAGE_MARGIN, footerY)
    .lineTo(pageWidth - PAGE_MARGIN, footerY)
    .lineWidth(0.7)
    .strokeColor(COLORS.lightGray)
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(COLORS.gray)
    .text(
      "PAWPATH  |  Pet Sales & Training Management System",
      PAGE_MARGIN,
      footerY + 12,
      {
        width: 330,
        lineBreak: false,
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(COLORS.navy)
    .text(
      `${pageNumber} / ${totalPages}`,
      pageWidth - PAGE_MARGIN - 55,
      footerY + 12,
      {
        width: 55,
        align: "right",
        lineBreak: false,
      }
    );

  doc.restore();
};

const drawReportTitle = (
  doc: PDFKit.PDFDocument,
  title: string
): void => {
  doc
    .font("Helvetica-Bold")
    .fontSize(21)
    .fillColor(COLORS.navy)
    .text(title, PAGE_MARGIN, doc.y, {
      width: doc.page.width - PAGE_MARGIN * 2,
      align: "left",
    });

  doc.moveDown(0.4);

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(COLORS.gray)
    .text(
      `Generated on ${new Date().toLocaleString()}`,
      PAGE_MARGIN,
      doc.y
    );

  doc.moveDown(0.8);

  const lineY = doc.y;

  doc
    .moveTo(PAGE_MARGIN, lineY)
    .lineTo(doc.page.width - PAGE_MARGIN, lineY)
    .lineWidth(2)
    .strokeColor(COLORS.orange)
    .stroke();

  doc.y = lineY + 17;
};

const drawSectionHeading = (
  doc: PDFKit.PDFDocument,
  heading: string
): void => {
  const x = PAGE_MARGIN;
  const width = doc.page.width - PAGE_MARGIN * 2;
  const height = 27;

  if (doc.y + height + 30 > doc.page.height - FOOTER_HEIGHT) {
    doc.addPage();
  }

  const y = doc.y;

  doc.save();

  doc
    .roundedRect(x, y, width, height, 5)
    .fill(COLORS.paleTeal);

  doc
    .rect(x, y, 4, height)
    .fill(COLORS.teal);

  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .fillColor(COLORS.navy)
    .text(heading, x + 12, y + 8, {
      width: width - 24,
      lineBreak: false,
    });

  doc.restore();

  doc.y = y + height + 10;
};

const drawDataRow = (
  doc: PDFKit.PDFDocument,
  label: string,
  value: string
): void => {
  const x = PAGE_MARGIN;
  const width = doc.page.width - PAGE_MARGIN * 2;
  const labelWidth = width * 0.57;
  const valueWidth = width - labelWidth;
  const bottomLimit = doc.page.height - FOOTER_HEIGHT - 15;

  if (doc.y + 25 > bottomLimit) {
    doc.addPage();
  }

  const rowY = doc.y;
  const rowHeight = 24;

  doc.save();

  if (Math.floor(rowY / rowHeight) % 2 === 0) {
    doc
      .rect(x, rowY - 3, width, rowHeight)
      .fill(COLORS.background);
  }

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.dark)
    .text(label, x + 9, rowY + 4, {
      width: labelWidth - 14,
      lineBreak: false,
      ellipsis: true,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.navy)
    .text(value, x + labelWidth, rowY + 4, {
      width: valueWidth - 10,
      align: "right",
      lineBreak: false,
      ellipsis: true,
    });

  doc.restore();

  doc.y = rowY + rowHeight;
};

const drawSummaryCard = (
  doc: PDFKit.PDFDocument,
  label: string,
  value: string
): void => {
  const x = PAGE_MARGIN;
  const width = doc.page.width - PAGE_MARGIN * 2;
  const height = 56;

  if (doc.y + height > doc.page.height - FOOTER_HEIGHT - 12) {
    doc.addPage();
  }

  const y = doc.y;

  doc.save();

  doc
    .roundedRect(x, y, width, height, 6)
    .fill(COLORS.navy);

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#D8E7F4")
    .text(label, x + 12, y + 9, {
      width: width - 24,
      lineBreak: false,
      ellipsis: true,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor(COLORS.white)
    .text(value, x + 12, y + 25, {
      width: width - 24,
      lineBreak: false,
      ellipsis: true,
    });

  doc.restore();

  doc.y = y + height + 10;
};

export const generatePDF = (
  res: Response,
  fileName: string,
  title: string,
  content: string[]
): void => {
  const doc = new PDFDocument({
    size: "A4",
    margins: {
      top: 128,
      bottom: 58,
      left: PAGE_MARGIN,
      right: PAGE_MARGIN,
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

  drawReportTitle(doc, title);

  content.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      doc.moveDown(0.4);
      return;
    }

    if (line.startsWith("## ")) {
      doc.moveDown(0.6);
      drawSectionHeading(doc, line.substring(3).trim());
      return;
    }

    if (line.startsWith("CARD: ")) {
      const cardText = line.substring(6);
      const separatorIndex = cardText.indexOf("|");

      if (separatorIndex >= 0) {
        const label = cardText.substring(0, separatorIndex).trim();
        const value = cardText.substring(separatorIndex + 1).trim();

        drawSummaryCard(doc, label, value);
      } else {
        drawDataRow(doc, "Summary", cardText);
      }

      return;
    }

    const separatorIndex = line.indexOf(":");

    if (separatorIndex > 0) {
      const label = line.substring(0, separatorIndex).trim();
      const value = line.substring(separatorIndex + 1).trim();

      drawDataRow(doc, label, value);
      return;
    }

    if (doc.y + 25 > doc.page.height - FOOTER_HEIGHT) {
      doc.addPage();
    }

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(COLORS.dark)
      .text(line, PAGE_MARGIN, doc.y, {
        width: doc.page.width - PAGE_MARGIN * 2,
        lineGap: 3,
      });

    doc.moveDown(0.25);
  });

  const pageRange = doc.bufferedPageRange();
  const totalPages = pageRange.count;

  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(pageRange.start + i);
    drawFooter(doc, i + 1, totalPages);
  }

  doc.end();
};


