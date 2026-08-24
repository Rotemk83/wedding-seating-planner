import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { EventState } from '../types';

/**
 * Exports the hall canvas DOM element to a high-res PNG image
 */
export async function exportHallToPng(elementId = 'hall-canvas-export-target'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Hall canvas element not found for export');
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  link.download = `wedding-seating-plan-${dateStr}.png`;
  link.href = imgData;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports the seating chart and table rosters to a multi-page PDF document
 */
export async function exportHallToPdf(
  state: EventState,
  elementId = 'hall-canvas-export-target'
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Hall canvas element not found for PDF export');
  }

  const canvas = await html2canvas(element, {
    scale: 1.5,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const pdf = new jsPDF('landscape', 'pt', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Page 1: Floor Plan Overview
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text(state.eventName || 'Wedding Seating Plan', 40, 40);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Generated on ${new Date().toLocaleDateString()} | Total Attending: ${state.guests.reduce((sum, g) => sum + g.approved, 0)}`, 40, 58);

  const imgData = canvas.toDataURL('image/jpeg', 0.9);
  const imgWidth = pdfWidth - 80;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, 'JPEG', 40, 70, imgWidth, Math.min(imgHeight, pdfHeight - 90));

  const dateStr = new Date().toISOString().split('T')[0];
  pdf.save(`wedding-seating-plan-${dateStr}.pdf`);
}
