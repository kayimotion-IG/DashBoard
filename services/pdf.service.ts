
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppSettings, SalesOrder, Invoice, Customer, PurchaseOrder, Vendor, User, CreditNote } from '../types';
import { itemService } from './item.service';
import { salesService } from './sales.service';

/**
 * PdfService handles the generation of professional business documents.
 * Theme: Orange (#f97316) and Blue (#2563eb).
 */
class PdfService {
  private settings: AppSettings;
  private primaryBlue: [number, number, number] = [37, 99, 235]; // #2563eb
  private brandOrange: [number, number, number] = [249, 115, 22]; // #f97316

  constructor() {
    this.settings = itemService.getSettings();
  }

  private addHeader(doc: jsPDF, title: string) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    
    // Brand Accent Bar (Orange)
    doc.setFillColor(this.brandOrange[0], this.brandOrange[1], this.brandOrange[2]);
    doc.rect(0, 0, pageWidth, 5, 'F');

    // Document Title (Blue)
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(this.primaryBlue[0], this.primaryBlue[1], this.primaryBlue[2]);
    doc.text(title.toUpperCase(), margin, 20);

    // Company Information (Top Right)
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(this.settings.companyName || 'KlenCare Enterprise', pageWidth - margin, 20, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const addr = doc.splitTextToSize(this.settings.companyAddress || 'Dubai, UAE', 80);
    doc.text(addr, pageWidth - margin, 25, { align: 'right' });
    doc.text(`TRN: ${this.settings.vatNumber || '100XXXXXXXXX003'}`, pageWidth - margin, 35, { align: 'right' });

    // Separator
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, 40, pageWidth - margin, 40);
  }

  private addBankDetails(doc: jsPDF, startY: number) {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(this.primaryBlue[0], this.primaryBlue[1], this.primaryBlue[2]);
    doc.text('PAYMENT INSTRUCTIONS (BANK DETAILS):', 15, startY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    const details = [
      `Beneficiary: ${this.settings.companyName}`,
      `Bank Name: Emirates NBD`,
      `Account Number: 101XXXXX7890`,
      `IBAN: AE03 0220 0000 101X XXXX 7890`,
      `Swift Code: ENBD AEAA`
    ];
    doc.text(details, 15, startY + 5);

    // Authorized Signatory
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
    doc.text(this.settings.pdfFooter || 'KlenCare Enterprise ERP Solution | Powered by UAE Tech Stack', pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  private finalize(doc: jsPDF, filename: string, preview: boolean) {
    this.addFooter(doc);
    if (preview) {
      return doc.output('bloburl');
    }
    doc.save(filename);
    return '';
  }

  generateSalesOrder(so: SalesOrder, customer: Customer, user: User | null, preview = false) {
    const doc = new jsPDF();
    this.addHeader(doc, 'Sales Order');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120);
    doc.text('BILL TO:', 15, 50);
    doc.text('ORDER SUMMARY:', 130, 50);

    doc.setTextColor(0);
    doc.text(customer.name, 15, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(customer.companyName || '', 15, 60);
    doc.text(doc.splitTextToSize(customer.billingAddress || '', 80), 15, 65);

    doc.text(`Order #: ${so.orderNumber}`, 130, 55);
    doc.text(`Date: ${new Date(so.date).toLocaleDateString()}`, 130, 60);
    doc.text(`LPO Ref: ${so.lpoNumber || 'N/A'}`, 130, 65);

    autoTable(doc, {
      startY: 85,
      head: [['Product / Service Description', 'Qty', 'Rate (AED)', 'Total (AED)']],
      body: so.lines.map(l => [l.itemName, l.quantity, l.rate.toFixed(2), l.total.toFixed(2)]),
      foot: [
        ['', '', 'Sub Total', so.subTotal.toFixed(2)],
        ['', '', 'VAT (5%)', so.taxTotal.toFixed(2)],
        ['', '', 'Grand Total', so.total.toFixed(2)]
      ],
      theme: 'grid',
      headStyles: { fillColor: this.primaryBlue, textColor: 255 },
      footStyles: { fillColor: [245, 245, 245], textColor: this.brandOrange, fontStyle: 'bold' }
    });

    return this.finalize(doc, `SO_${so.orderNumber}.pdf`, preview);
  }

  generateInvoice(inv: Invoice, customer: Customer, user: User | null, preview = false) {
    const doc = new jsPDF();
    this.addHeader(doc, 'Tax Invoice');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120);
    doc.text('BILL TO:', 15, 50);
    doc.text('INVOICE INFO:', 130, 50);

    doc.setTextColor(0);
    doc.text(customer.name, 15, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(customer.billingAddress || '', 80), 15, 60);

    doc.text(`Invoice #: ${inv.invoiceNumber}`, 130, 55);
    doc.text(`Date: ${new Date(inv.date).toLocaleDateString()}`, 130, 60);
    doc.text(`Due Date: ${new Date(inv.dueDate).toLocaleDateString()}`, 130, 65);

    autoTable(doc, {
      startY: 85,
      head: [['Product Description', 'Qty', 'Unit Price', 'Amount']],
      body: (inv.lines || []).map(l => [l.itemName, l.quantity, l.rate.toFixed(2), l.total.toFixed(2)]),
      foot: [
        ['', '', 'Total Amount', inv.total.toFixed(2)],
        ['', '', 'Balance Due', inv.balanceDue.toFixed(2)]
      ],
      theme: 'grid',
      headStyles: { fillColor: this.primaryBlue, textColor: 255 },
      footStyles: { fillColor: [245, 245, 245], textColor: this.brandOrange, fontStyle: 'bold' }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;
    this.addBankDetails(doc, finalY + 15);
    return this.finalize(doc, `INV_${inv.invoiceNumber}.pdf`, preview);
  }

  generatePurchaseOrder(po: PurchaseOrder, vendor: Vendor, user: User | null, preview = false) {
    const doc = new jsPDF();
    this.addHeader(doc, 'Purchase Order');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120);
    doc.text('VENDOR:', 15, 50);
    doc.text('PO DETAILS:', 130, 50);

    doc.setTextColor(0);
    doc.text(vendor.name, 15, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(vendor.address || '', 80), 15, 60);

    doc.text(`PO Number: ${po.poNumber}`, 130, 55);
    doc.text(`Date: ${new Date(po.date).toLocaleDateString()}`, 130, 60);

    autoTable(doc, {
      startY: 85,
      head: [['Item Name', 'Quantity', 'Rate', 'Total']],
      body: po.lines.map(l => [l.itemName, l.quantity, l.rate.toFixed(2), l.total.toFixed(2)]),
      foot: [['', '', 'Total Cost', po.total.toFixed(2)]],
      theme: 'grid',
      headStyles: { fillColor: [50, 50, 50], textColor: 255 }
    });

    return this.finalize(doc, `PO_${po.poNumber}.pdf`, preview);
  }

  generateCreditNote(cn: CreditNote, customer: Customer, user: User | null, preview = false) {
    const doc = new jsPDF();
    this.addHeader(doc, 'Credit Note');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120);
    doc.text('CUSTOMER:', 15, 50);
    doc.text('CN DETAILS:', 130, 50);

    doc.setTextColor(0);
    doc.text(customer.name, 15, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Reason: ${cn.reason || 'Returns'}`, 15, 65);

    doc.text(`Credit Note #: ${cn.creditNoteNumber}`, 130, 55);
    doc.text(`Date: ${new Date(cn.date).toLocaleDateString()}`, 130, 60);
    doc.text(`Status: ${cn.status}`, 130, 65);

    autoTable(doc, {
      startY: 85,
      head: [['Description', 'Amount (AED)']],
      body: [['Credit adjustment for services/returns', cn.amount.toFixed(2)]],
      foot: [['Total Credit', cn.amount.toFixed(2)]],
      theme: 'grid',
      headStyles: { fillColor: this.brandOrange, textColor: 255 },
      footStyles: { fillColor: [245, 245, 245], fontStyle: 'bold' }
    });

    return this.finalize(doc, `CN_${cn.creditNoteNumber}.pdf`, preview);
  }

  generateStatement(customer: Customer, user: User | null, preview = false) {
    const doc = new jsPDF();
    this.addHeader(doc, 'Customer Statement');

    const balance = salesService.getCustomerBalance(customer.id);
    const invoices = salesService.getInvoices().filter(i => i.customerId === customer.id);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Statement for: ${customer.name}`, 15, 50);
    doc.setTextColor(this.brandOrange[0], this.brandOrange[1], this.brandOrange[2]);
    doc.text(`Total Outstanding: AED ${balance.toLocaleString()}`, 15, 57);

    autoTable(doc, {
      startY: 70,
      head: [['Date', 'Invoice #', 'Status', 'Amount', 'Balance']],
      body: invoices.map(i => [
        new Date(i.date).toLocaleDateString(),
        i.invoiceNumber,
        i.status,
        i.total.toFixed(2),
        i.balanceDue.toFixed(2)
      ]),
      theme: 'striped',
      headStyles: { fillColor: this.primaryBlue, textColor: 255 }
    });

    return this.finalize(doc, `Statement_${customer.name}.pdf`, preview);
  }
}

export const pdfService = new PdfService();
