import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Export a full analytics report as PDF
 */
export const exportAnalyticsPDF = ({
  title = 'DRIVE-X Analytics Report',
  subtitle = '',
  metrics = [],
  tables = [],
  sections = [],
}) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  let y = 50;

  // ============ HEADER ============
  doc.setFillColor(79, 70, 229); // Indigo
  doc.rect(0, 0, pageWidth, 90, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 40, 45);

  if (subtitle) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 40, 68);
  }

  // Timestamp
  doc.setFontSize(9);
  const timestamp = new Date().toLocaleString();
  doc.text(`Generated: ${timestamp}`, pageWidth - 40, 68, { align: 'right' });

  y = 120;

  // ============ METRICS ============
  if (metrics.length > 0) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Metrics', 40, y);
    y += 20;

    // Draw metric cards in a grid (3 per row)
    const cardWidth = (pageWidth - 80 - 20) / 3;
    const cardHeight = 55;
    let x = 40;
    let rowCount = 0;

    metrics.forEach((m, idx) => {
      if (rowCount === 3) {
        x = 40;
        y += cardHeight + 10;
        rowCount = 0;
      }

      // Card background
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, cardWidth, cardHeight, 6, 6, 'FD');

      // Title
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(String(m.title).toUpperCase(), x + 10, y + 15);

      // Value
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(String(m.value), x + 10, y + 40);

      x += cardWidth + 10;
      rowCount++;
    });

    y += cardHeight + 25;
  }

  // ============ TABLES ============
  tables.forEach((table) => {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }

    if (table.title) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(table.title, 40, y);
      y += 15;
    }

    if (table.data && table.data.length > 0) {
      doc.autoTable({
        startY: y,
        head: [table.headers],
        body: table.data,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 40, right: 40 },
      });
      y = doc.lastAutoTable.finalY + 25;
    }
  });

  // ============ SECTIONS ============
  sections.forEach((section) => {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(section.title, 40, y);
    y += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    const lines = doc.splitTextToSize(section.content, pageWidth - 80);
    lines.forEach((line) => {
      if (y > 780) {
        doc.addPage();
        y = 50;
      }
      doc.text(line, 40, y);
      y += 14;
    });

    y += 15;
  });

  // ============ FOOTER ============
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `DRIVE-X | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: 'center' }
    );
  }

  // Save
  const fileName = `DRIVE-X_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};