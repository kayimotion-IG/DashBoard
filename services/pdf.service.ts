import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppSettings, SalesOrder, Invoice, Customer, PurchaseOrder, Vendor, User, CreditNote } from '../types';
import { itemService } from './item.service';

const KLENCARE_BLUE = '#0B4AA2';
const KLENCARE_GOLD = '#fbaf0f';
const TEXT_DARK = '#1e293b';
const TEXT_GRAY = '#64748b';
const BORDER_LIGHT = '#e2e8f0';

export class PDFService {
  private getSettings(): AppSettings {
    return itemService.getSettings();
  }

  private drawHeader(doc: jsPDF, title: string) {
    // 1. Company Identity (Left) - ONLY NAME IN BLUE
    doc.setTextColor(KLENCARE_BLUE);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('KlenCare FZC', 15, 25);

    // 2. Uniform Address & Contact Block
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(TEXT_DARK);
    doc.text('9 Rolex Tower', 15, 32);
    doc.text('Shk Zayed Road', 15, 37);
    doc.text('Dubai- U.A.E', 15, 42);
    doc.text('+97150 315 7462', 15, 47);
    doc.text('support@klencare.net', 15, 52);

    // 3. Document Title (Right) - Using Gold Bar Accent
    doc.setTextColor(TEXT_DARK);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), 195, 25, { align: 'right' });

    doc.setDrawColor(KLENCARE_GOLD);
    doc.setLineWidth(1.5);
    doc.line(130, 28, 195, 28);
  }

  private addBankDetails(doc: jsPDF, yPos: number) {
    doc.setDrawColor(BORDER_LIGHT);
    doc.setLineWidth(0.1);
    doc.roundedRect(15, yPos, 100, 32, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setTextColor(KLENCARE_GOLD); 
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT METHOD', 20, yPos + 7);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_DARK);
    doc.text('Bank : RAKBANK', 20, yPos + 14);
    doc.text('Account Name : KlenCare FZC', 20, yPos + 19);
    doc.text('Account No. : 0323438159001', 20, yPos + 24);
  }

  async generateInvoice(inv: Invoice, customer: Customer, user: User | null, isPreview = false) {
    const doc = new jsPDF();
    this.drawHeader(doc, 'Tax Invoice');

    // Metadata Info Box (Right Side) - STRICT ORDER
    doc.setFontSize(9);
    doc.setTextColor(KLENCARE_GOLD);
    doc.setFont('helvetica', 'bold');
    
    // Labels
    doc.text('Invoice #:', 130, 40);
    doc.text('Date:', 130, 46);
    doc.text('Due Date:', 130, 52);
    doc.text('TRN:', 130, 58);
    doc.text('LPO No:', 130, 64);

    // Values
    doc.setTextColor(TEXT_DARK);
    doc.setFont('helvetica', 'normal');
    doc.text(inv.invoiceNumber, 195, 40, { align: 'right' });
    doc.text(new Date(inv.date).toLocaleDateString('en-GB'), 195, 46, { align: 'right' });
    doc.text(new Date(inv.dueDate).toLocaleDateString('en-GB'), 195, 52, { align: 'right' });
    doc.text('100234567800003', 195, 58, { align: 'right' });
    doc.text(inv.lpoNumber || '—', 195, 64, { align: 'right' });

    // Customer Box
    doc.setDrawColor(BORDER_LIGHT);
    doc.roundedRect(15, 75, 90, 35, 2, 2, 'S');
    doc.setFontSize(8);
    doc.setTextColor(KLENCARE_GOLD);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', 20, 82);
    
    doc.setTextColor(TEXT_DARK);
    doc.setFontSize(10);
    doc.text(customer.name, 20, 89);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const addr = doc.splitTextToSize(customer.billingAddress, 80);
    doc.text(addr, 20, 95);

    // Items Table - Gold Header
    autoTable(doc, {
      startY: 120,
      head: [['#', 'Item Description', 'Qty', 'Rate (AED)', 'Total (AED)']],
      body: inv.lines?.map((l, i) => [i + 1, l.itemName, l.quantity, l.rate.toFixed(2), l.total.toFixed(2)]) || [],
      theme: 'grid',
      headStyles: { fillColor: KLENCARE_GOLD, textColor: '#FFFFFF', fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 4, lineColor: BORDER_LIGHT },
      columnStyles: { 0: { cellWidth: 10 }, 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' } }
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    // Totals Box
    const subTotal = inv.total / 1.05;
    const vat = inv.total - subTotal;

    doc.setFontSize(9);
    doc.setTextColor(TEXT_GRAY);
    doc.text('Sub Total:', 140, finalY + 15);
    doc.text('VAT (5%):', 140, finalY + 22);
    
    doc.setFillColor(KLENCARE_GOLD);
    doc.rect(130, finalY + 28, 65, 12, 'F');
    doc.setTextColor('#FFFFFF');
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL AED:', 135, finalY + 36);
    
    doc.setTextColor(TEXT_DARK);
    doc.setFont('helvetica', 'normal');
    doc.text(subTotal.toFixed(2), 195, finalY + 15, { align: 'right' });
    doc.text(vat.toFixed(2), 195, finalY + 22, { align: 'right' });
    
    doc.setTextColor('#FFFFFF');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(inv.total.toFixed(2), 190, finalY + 36, { align: 'right' });

    this.addBankDetails(doc, finalY + 50);

    doc.setFontSize(8);
    doc.setTextColor(TEXT_GRAY);
    doc.text('Thank you for choosing KlenCare FZC.', 15, 280);
    doc.text(`Page 1 of 1`, 195, 280, { align: 'right' });

    if (isPreview) return doc.output('bloburl');
    doc.save(`${inv.invoiceNumber}.pdf`);
  }

  async generateSalesOrder(so: SalesOrder, customer: Customer, user: User | null, isPreview = false) {
    const doc = new jsPDF();
    this.drawHeader(doc, 'Sales Order');

    doc.setFontSize(9);
    doc.setTextColor(KLENCARE_GOLD);
    doc.setFont('helvetica', 'bold');
    doc.text('Order #:', 130, 40);
    doc.text('Date:', 130, 46);
    doc.text('Delivery Date:', 130, 52);
    doc.text('TRN:', 130, 58);
    doc.text('LPO No:', 130, 64);

    doc.setTextColor(TEXT_DARK);
    doc.setFont('helvetica', 'normal');
    doc.text(so.orderNumber, 195, 40, { align: 'right' });
    doc.text(new Date(so.date).toLocaleDateString('en-GB'), 195, 46, { align: 'right' });
    doc.text(so.shipmentDate ? new Date(so.shipmentDate).toLocaleDateString('en-GB') : '—', 195, 52, { align: 'right' });
    doc.text('100234567800003', 195, 58, { align: 'right' });
    doc.text(so.lpoNumber || '—', 195, 64, { align: 'right' });

    autoTable(doc, {
      startY: 120,
      head: [['#', 'Item Description', 'Qty', 'Rate', 'Total']],
      body: so.lines.map((l, i) => [i + 1, l.itemName, l.quantity, l.rate.toFixed(2), l.total.toFixed(2)]),
      theme: 'grid',
      headStyles: { fillColor: KLENCARE_GOLD },
      columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } }
    });

    if (isPreview) return doc.output('bloburl');
    doc.save(`${so.orderNumber}.pdf`);
  }

  async generatePurchaseOrder(po: PurchaseOrder, vendor: Vendor, user: User | null, isPreview = false) {
    const doc = new jsPDF();
    this.drawHeader(doc, 'Purchase Order');
    if (isPreview) return doc.output('bloburl');
    doc.save(`${po.poNumber}.pdf`);
  }

  async generateStatement(customer: Customer, user: User | null, isPreview = false, date?: Date) {
    const doc = new jsPDF();
    this.drawHeader(doc, 'Statement of Account');
    if (isPreview) return doc.output('bloburl');
    doc.save(`SOA_${customer.name.replace(/\s+/g, '_')}.pdf`);
  }

  async generateCreditNote(cn: CreditNote, customer: Customer, user: User | null, isPreview = false) {
    const doc = new jsPDF();
    this.drawHeader(doc, 'Credit Note');
    if (isPreview) return doc.output('bloburl');
    doc.save(`${cn.creditNoteNumber}.pdf`);
  }
}

export const pdfService = new PDFService();
