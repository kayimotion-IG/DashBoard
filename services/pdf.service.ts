
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppSettings, SalesOrder, Invoice, Customer, PurchaseOrder, Vendor, User, CreditNote } from '../types';
import { itemService } from './item.service';
import { salesService } from './sales.service';

class PdfService {
  private settings: AppSettings;
  private primaryBrand: [number, number, number] = [251, 175, 15]; // #fbaf0f

  constructor() {
    this.settings = itemService.getSettings();
  }

  // Helper to convert URL to Image for jsPDF
  private async getLogoImage(url: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous'; 
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  private async addHeader(doc: jsPDF, title: string) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    this.settings = itemService.getSettings();
    
    // Top Brand Bar
    doc.setFillColor(this.primaryBrand[0], this.primaryBrand[1], this.primaryBrand[2]);
    doc.rect(0, 0, pageWidth, 6, 'F');

    // Enhanced Logo Handling (Optimized for user provided "best size" PNG)
    let logoBottomY = 30;
    if (this.settings.logoUrl) {
      try {
        const img = await this.getLogoImage(this.settings.logoUrl);
        if (img) {
          const ratio = img.width / img.height;
          const targetWidth = 60; // Increased width for better visibility
          const height = targetWidth / ratio;
          const finalHeight = Math.min(height, 28); // Increased height limit
          doc.addImage(img, 'PNG', margin, 10, targetWidth, finalHeight);
          logoBottomY = 10 + finalHeight;
        }
      } catch (e) {
        console.warn("PDF Logo Render Error:", e);
      }
    }

    // Header Title (e.g., TAX INVOICE)
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(this.primaryBrand[0], this.primaryBrand[1], this.primaryBrand[2]);
    doc.text(title.toUpperCase(), margin, logoBottomY + 12);

    // Company Info (Right Aligned)
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(this.settings.companyName || 'KlenCare CRM Enterprise', pageWidth - margin, 20, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const addr = doc.splitTextToSize(this.settings.companyAddress || 'Dubai, United Arab Emirates', 80);
    doc.text(addr, pageWidth - margin, 25, { align: 'right' });
    
    if (this.settings.vatNumber) {
      doc.text(`TRN: ${this.settings.vatNumber}`, pageWidth - margin, 35, { align: 'right' });
    }

    doc.setDrawColor(235, 235, 235);
    doc.line(margin, logoBottomY + 20, pageWidth - margin, logoBottomY + 20); 
  }

  private addBankDetails(doc: jsPDF, startY: number) {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(this.primaryBrand[0], this.primaryBrand[1], this.primaryBrand[2]);
    doc.text('PAYMENT TERMS & BANKING:', 15, startY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    const details = [
      `Beneficiary: ${this.settings.companyName}`,
      `Bank Name: Emirates NBD`,
      `Branch: Dubai Main`,
      `IBAN: AE03 0220 0000 101X XXXX 7890`
    ];
    doc.text(details, 15, startY + 5);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Authorized Signatory', pageWidth - 60, startY + 25);
    doc.setDrawColor(200);
    doc.line(pageWidth - 65, startY + 20, pageWidth - 15, startY + 20);
  }

  private addFooter(doc: jsPDF) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(this.settings.pdfFooter || 'This is a computer generated document and does not require a physical signature.', pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  private finalize(doc: jsPDF, filename: string, preview: boolean) {
    this.addFooter(doc);
    if (preview) return doc.output('bloburl');
    doc.save(filename);
    return '';
  }

  async generateSalesOrder(so: SalesOrder, customer: Customer, user: User | null, preview = false) {
    const doc = new jsPDF();
    await this.addHeader(doc, 'Sales Order');
    const startY = 75;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120);
    doc.text('BILL TO:', 15, startY); 
    doc.text('ORDER SUMMARY:', 130, startY); 
    doc.setTextColor(0);
    doc.text(customer.name, 15, startY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(customer.companyName || '', 15, startY + 10);
    doc.text(`Order #: ${so.orderNumber}`, 130, startY + 5);
    doc.text(`Order Date: ${new Date(so.date).toLocaleDateString()}`, 130, startY + 10);

    autoTable(doc, {
      startY: startY + 25,
      head: [['Product Description', 'Quantity', 'Rate (AED)', 'Total']],
      body: so.lines.map(l => [l.itemName, l.quantity, l.rate.toFixed(2), l.total.toFixed(2)]),
      foot: [['', '', 'Net Total', so.total.toFixed(2)]],
      theme: 'grid',
      headStyles: { fillColor: this.primaryBrand, textColor: 0 },
      footStyles: { fillColor: [250, 250, 250], textColor: [0, 0, 0], fontStyle: 'bold' }
    });
    return this.finalize(doc, `SO_${so.orderNumber}.pdf`, preview);
  }

  async generateInvoice(inv: Invoice, customer: Customer, user: User | null, preview = false) {
    const doc = new jsPDF();
    await this.addHeader(doc, 'Tax Invoice');
    const startY = 75;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120);
    doc.text('BILL TO:', 15, startY); 
    doc.text('INVOICE DETAILS:', 130, startY); 
    doc.setTextColor(0);
    doc.text(customer.name, 15, startY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${inv.invoiceNumber}`, 130, startY + 5);
    doc.text(`Date: ${new Date(inv.date).toLocaleDateString()}`, 130, startY + 10);
    doc.text(`Due Date: ${new Date(inv.dueDate).toLocaleDateString()}`, 130, startY + 15);

    autoTable(doc, {
      startY: startY + 30,
      head: [['Description', 'Qty', 'Rate', 'Amount']],
      body: (inv.lines || []).map(l => [l.itemName, l.quantity, l.rate.toFixed(2), l.total.toFixed(2)]),
      foot: [['', '', 'TOTAL AMOUNT DUE', `AED ${inv.total.toFixed(2)}`]],
      theme: 'grid',
      headStyles: { fillColor: this.primaryBrand, textColor: 0 },
      footStyles: { fillColor: [250, 250, 250], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 160;
    this.addBankDetails(doc, finalY + 15);
    return this.finalize(doc, `INV_${inv.invoiceNumber}.pdf`, preview);
  }

  async generatePurchaseOrder(po: PurchaseOrder, vendor: Vendor, user: User | null, preview = false) {
    const doc = new jsPDF();
    await this.addHeader(doc, 'Purchase Order');
    const startY = 75;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120);
    doc.text('VENDOR:', 15, startY);
    doc.text('PO DETAILS:', 130, startY);
    doc.setTextColor(0);
    doc.text(vendor.name, 15, startY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`PO Ref: ${po.poNumber}`, 130, startY + 5);
    doc.text(`Issue Date: ${new Date(po.date).toLocaleDateString()}`, 130, startY + 10);

    autoTable(doc, {
      startY: startY + 25,
      head: [['Item Name / SKU', 'Quantity', 'Unit Cost', 'Line Total']],
      body: po.lines.map(l => [l.itemName, l.quantity, l.rate.toFixed(2), l.total.toFixed(2)]),
      foot: [['', '', 'Total Commitment', `AED ${po.total.toFixed(2)}`]],
      theme: 'grid',
      headStyles: { fillColor: [30, 30, 30], textColor: 255 }
    });
    return this.finalize(doc, `PO_${po.poNumber}.pdf`, preview);
  }

  async generateCreditNote(cn: CreditNote, customer: Customer, user: User | null, preview = false) {
    const doc = new jsPDF();
    await this.addHeader(doc, 'Credit Note');
    const startY = 75;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(`Customer Name: ${customer.name}`, 15, startY);
    doc.text(`Credit Note #: ${cn.creditNoteNumber}`, 130, startY);
    doc.text(`Issue Date: ${new Date(cn.date).toLocaleDateString()}`, 130, startY + 5);

    autoTable(doc, {
      startY: startY + 20,
      head: [['Description of Return / Adjustment', 'Amount (AED)']],
      body: [[cn.reason || 'Inventory Return', cn.amount.toFixed(2)]],
      theme: 'grid',
      headStyles: { fillColor: this.primaryBrand, textColor: 0 }
    });
    return this.finalize(doc, `CN_${cn.creditNoteNumber}.pdf`, preview);
  }

  async generateStatement(customer: Customer, user: User | null, preview = false, monthDate?: Date) {
    const doc = new jsPDF();
    const title = monthDate ? `Monthly Statement - ${monthDate.toLocaleString('default', { month: 'long' })} ${monthDate.getFullYear()}` : 'Statement of Account';
    await this.addHeader(doc, title);
    const startY = 75;

    const balance = salesService.getCustomerBalance(customer.id);
    const invoices = salesService.getInvoices().filter(i => i.customerId === customer.id);
    
    const filteredInvoices = monthDate 
      ? invoices.filter(i => {
          const d = new Date(i.date);
          return d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear();
        })
      : invoices;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Customer Ledger: ${customer.name}`, 15, startY);
    doc.setTextColor(this.primaryBrand[0], this.primaryBrand[1], this.primaryBrand[2]);
    doc.text(`Net Outstanding Balance: AED ${balance.toLocaleString()}`, 15, startY + 7);

    autoTable(doc, {
      startY: startY + 20,
      head: [['Date', 'Document Ref', 'Status', 'Debit', 'Credit', 'Balance']],
      body: filteredInvoices.map(i => [
        new Date(i.date).toLocaleDateString(),
        i.invoiceNumber,
        i.status,
        i.total.toFixed(2),
        '0.00',
        i.balanceDue.toFixed(2)
      ]),
      theme: 'striped',
      headStyles: { fillColor: this.primaryBrand, textColor: 0 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 160;
    doc.setTextColor(150);
    doc.setFontSize(8);
    doc.text('This statement reflects the transactions recorded in our system as of ' + new Date().toLocaleDateString(), 15, finalY + 10);

    return this.finalize(doc, `Statement_${customer.name.replace(/\s+/g, '_')}.pdf`, preview);
  }
}

export const pdfService = new PdfService();
