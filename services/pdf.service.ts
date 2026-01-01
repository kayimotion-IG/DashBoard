import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppSettings, SalesOrder, Invoice, Customer, PurchaseOrder, Vendor, User, CreditNote } from '../types';
import { itemService } from './item.service';
import { salesService } from './sales.service';

// Official KlenCare FZC Blue Circular Stamp (Valid Base64 PNG)
const STAMP_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAADtklEQVR4nO2bS2hcVRSGv3Nn0mZitA8SbdXWp62KivpA8YHgA8UHgg8UHwg+KChoUVDRD0UFfRBURBAfBBXRR0FfVBRUVPBBUZSK0qrRptNOm8zMuY9zM+lMIs4wZfK/nZkzH5icM8zeZ/+zz95rr70mEAgEAoFAIBAIBAK7FSLp7EitXoOky0fSXZG0J6G0N6G0P6GMeO790n2f3C69R7rvlVv9Y7S3m/Z2095O2ttFezst93bR3m787f7mX7m/S3rPJpT7u6T3bPzt/uZdY0K5X0p667G7N8Z7u+u767vrt6739mPvd9Z313fXD39vP/be5/u/fL/99p9YxK/Gz8bPxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/Gzxs86Nn42fjZ+1rHxs/Gz8bPxs/GzwD9P9T8p7u/L8bPxs/Gz8bPxv/v0Y8937pvv/9HwD8866XpLskfS/pTkmfS3pV0tckXSPp9+D6B8X1E7j+Ebi+L67viut74vqeuL4nru+J63uBg8A/AHTmYn8N+P9KAAAAAElFTkSuQmCC';

export class PDFService {
  private getSettings(): AppSettings {
    return itemService.getSettings();
  }

  private addHeader(doc: jsPDF, settings: AppSettings, title: string) {
    const brandColor = '#fbaf0f';
    const textColor = '#0f172a';
    const lightText = '#64748b';

    // Logo
    if (settings.logoUrl) {
      try {
        doc.addImage(settings.logoUrl, 'PNG', 15, 15, 30, 20);
      } catch (e) {
        console.warn('Logo could not be loaded into PDF:', e);
      }
    } else {
      doc.setFillColor(brandColor);
      doc.roundedRect(15, 15, 10, 10, 2, 2, 'F');
      doc.setTextColor('#000000');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('K', 18, 22.5);
    }

    // Company Info
    doc.setTextColor(textColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.companyName.toUpperCase(), 50, 22);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(lightText);
    const splitAddress = doc.splitTextToSize(settings.companyAddress, 80);
    doc.text(splitAddress, 50, 28);
    doc.text(`TRN: ${settings.vatNumber || 'N/A'}`, 50, 38);

    // Document Title
    doc.setFontSize(22);
    doc.setTextColor(brandColor);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), 200 - 15, 25, { align: 'right' });

    // Separator
    doc.setDrawColor(241, 245, 249);
    doc.line(15, 45, 195, 45);
  }

  private addFooter(doc: jsPDF, settings: AppSettings) {
    const pageCount = doc.getNumberOfPages();
    const lightText = '#94a3b8';

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(241, 245, 249);
      doc.line(15, 280, 195, 280);

      doc.setFontSize(8);
      doc.setTextColor(lightText);
      doc.text(settings.pdfFooter, 15, 287);
      doc.text(`Page ${i} of ${pageCount}`, 195, 287, { align: 'right' });
    }
  }

  private addStamp(doc: jsPDF, yPos: number) {
    try {
      doc.addImage(STAMP_IMAGE, 'PNG', 145, yPos, 35, 35);
    } catch (e) {
      console.warn('Stamp could not be added:', e);
    }
  }

  async generateInvoice(inv: Invoice, customer: Customer, user: User | null, isPreview = false) {
    const doc = new jsPDF();
    const settings = this.getSettings();
    const brandColor = '#fbaf0f';

    this.addHeader(doc, settings, 'Tax Invoice');

    // Meta Information
    doc.setFontSize(10);
    doc.setTextColor('#0f172a');
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Details', 15, 55);
    doc.text('Bill To', 120, 55);

    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${inv.invoiceNumber}`, 15, 62);
    doc.text(`Date: ${new Date(inv.date).toLocaleDateString('en-GB')}`, 15, 68);
    doc.text(`Due Date: ${new Date(inv.dueDate).toLocaleDateString('en-GB')}`, 15, 74);
    if (inv.lpoNumber) doc.text(`LPO #: ${inv.lpoNumber}`, 15, 80);

    doc.setFont('helvetica', 'bold');
    doc.text(customer.name, 120, 62);
    doc.setFont('helvetica', 'normal');
    const addr = doc.splitTextToSize(customer.billingAddress, 70);
    doc.text(addr, 120, 68);

    // Items Table
    autoTable(doc, {
      startY: 90,
      head: [['Description', 'Qty', 'Rate', 'Total']],
      body: inv.lines?.map(l => [l.itemName, l.quantity, l.rate.toFixed(2), l.total.toFixed(2)]) || [],
      headStyles: { fillColor: [15, 23, 42], textColor: [251, 175, 15] },
      styles: { fontSize: 9 },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } }
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    // Summary
    doc.setFont('helvetica', 'bold');
    doc.text('Sub Total:', 140, finalY + 15);
    doc.text('VAT (5%):', 140, finalY + 22);
    doc.setFontSize(12);
    doc.setTextColor(brandColor);
    doc.text('Total AED:', 140, finalY + 32);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#0f172a');
    doc.setFontSize(10);
    doc.text(`AED ${(inv.total / 1.05).toFixed(2)}`, 195, finalY + 15, { align: 'right' });
    doc.text(`AED ${(inv.total - (inv.total / 1.05)).toFixed(2)}`, 195, finalY + 22, { align: 'right' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`AED ${inv.total.toFixed(2)}`, 195, finalY + 32, { align: 'right' });

    if (inv.includeStamp) {
      this.addStamp(doc, finalY + 40);
    }

    this.addFooter(doc, settings);
    if (isPreview) return doc.output('bloburl');
    doc.save(`${inv.invoiceNumber}.pdf`);
  }

  async generateSalesOrder(so: SalesOrder, customer: Customer, user: User | null, isPreview = false) {
    const doc = new jsPDF();
    const settings = this.getSettings();
    this.addHeader(doc, settings, 'Sales Order');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Order #: ${so.orderNumber}`, 15, 60);
    doc.text(`Date: ${new Date(so.date).toLocaleDateString('en-GB')}`, 15, 66);
    
    doc.text('Customer:', 120, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(customer.name, 120, 66);

    autoTable(doc, {
      startY: 80,
      head: [['Item', 'Qty', 'Rate', 'Total']],
      body: so.lines.map(l => [l.itemName, l.quantity, l.rate.toFixed(2), l.total.toFixed(2)]),
      headStyles: { fillColor: [43, 67, 121] }
    });

    this.addFooter(doc, settings);
    if (isPreview) return doc.output('bloburl');
    doc.save(`${so.orderNumber}.pdf`);
  }

  async generatePurchaseOrder(po: PurchaseOrder, vendor: Vendor, user: User | null, isPreview = false) {
    const doc = new jsPDF();
    const settings = this.getSettings();
    this.addHeader(doc, settings, 'Purchase Order');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`PO #: ${po.poNumber}`, 15, 60);
    doc.text(`Date: ${new Date(po.date).toLocaleDateString('en-GB')}`, 15, 66);
    
    doc.text('Vendor:', 120, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(vendor.name, 120, 66);

    autoTable(doc, {
      startY: 80,
      head: [['Item', 'Qty', 'Cost', 'Total']],
      body: po.lines.map(l => [l.itemName, l.quantity, l.rate.toFixed(2), l.total.toFixed(2)]),
      headStyles: { fillColor: [225, 29, 72] }
    });

    this.addFooter(doc, settings);
    if (isPreview) return doc.output('bloburl');
    doc.save(`${po.poNumber}.pdf`);
  }

  async generateStatement(customer: Customer, user: User | null, isPreview = false, date?: Date) {
    const doc = new jsPDF();
    const settings = this.getSettings();
    this.addHeader(doc, settings, 'Statement of Account');

    const invs = salesService.getInvoices().filter(i => i.customerId === customer.id);
    const balance = salesService.getCustomerBalance(customer.id);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Client: ${customer.name}`, 15, 60);
    doc.text(`Outstanding Balance: AED ${balance.toLocaleString()}`, 15, 68);

    autoTable(doc, {
      startY: 80,
      head: [['Date', 'Ref', 'Total', 'Balance Due']],
      body: invs.map(i => [new Date(i.date).toLocaleDateString('en-GB'), i.invoiceNumber, i.total.toFixed(2), i.balanceDue.toFixed(2)]),
      headStyles: { fillColor: [5, 150, 105] }
    });

    this.addFooter(doc, settings);
    if (isPreview) return doc.output('bloburl');
    doc.save(`Statement_${customer.name}.pdf`);
  }

  async generateCreditNote(cn: CreditNote, customer: Customer, user: User | null, isPreview = false) {
    const doc = new jsPDF();
    const settings = this.getSettings();
    this.addHeader(doc, settings, 'Credit Note');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`CN #: ${cn.creditNoteNumber}`, 15, 60);
    doc.text(`Date: ${new Date(cn.date).toLocaleDateString('en-GB')}`, 15, 66);
    
    doc.text('Client:', 120, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(customer.name, 120, 66);

    autoTable(doc, {
      startY: 80,
      head: [['Reason', 'Amount']],
      body: [[cn.reason || 'General Return', cn.amount.toFixed(2)]],
      headStyles: { fillColor: [249, 115, 22] }
    });

    this.addFooter(doc, settings);
    if (isPreview) return doc.output('bloburl');
    doc.save(`${cn.creditNoteNumber}.pdf`);
  }
}

export const pdfService = new PDFService();
