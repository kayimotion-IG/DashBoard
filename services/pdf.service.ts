
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, Customer, User, SalesOrder, Vendor, PurchaseOrder, CreditNote } from '../types';
import { salesService } from './sales.service';
import { itemService } from './item.service';

const KLENCARE_BLUE = '#0B4AA2';
const KLENCARE_GOLD = '#fbaf0f';
const TEXT_DARK = '#1e293b';
const TEXT_MUTED = '#64748b';

export class PDFService {
  private async getLogoData(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return null;
    }
  }

  private async drawHeader(doc: jsPDF, title: string) {
    const settings = itemService.getSettings();
    
    if (settings.logoUrl) {
      const logo = await this.getLogoData(settings.logoUrl);
      if (logo) {
        doc.addImage(logo, 'PNG', 15, 12, 35, 0);
      }
    }

    const infoX = settings.logoUrl ? 55 : 15;
    doc.setTextColor(KLENCARE_BLUE);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('KlenCare FZC', infoX, 20);

    doc.setFontSize(8.5);
    doc.setTextColor(TEXT_DARK);
    doc.setFont('helvetica', 'normal');
    
    doc.text([
      settings.companyAddress || '9 Rolex Tower, Sheikh Zayed Road',
      'Dubai, United Arab Emirates',
      `${settings.companyPhone || '+971 50 315 7462'} | ${settings.companyEmail || 'support@klencare.net'}`
    ], infoX, 26);

    doc.setFontSize(26);
    doc.setTextColor(TEXT_DARK);
    doc.text(title.toUpperCase(), 195, 20, { align: 'right' });
    
    doc.setDrawColor(KLENCARE_GOLD);
    doc.setLineWidth(1.2);
    doc.line(145, 24, 195, 24);
  }

  private drawFooter(doc: jsPDF) {
    const settings = itemService.getSettings();
    const pageCount = (doc as any).internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor('#94a3b8');
      doc.setDrawColor('#f1f5f9');
      doc.line(15, 280, 195, 280);
      doc.text(settings.pdfFooter || 'Thank you for your Purchase - KlenCare FZC', 105, 286, { align: 'center' });
      doc.text(`Page ${i} of ${pageCount}`, 195, 286, { align: 'right' });
    }
  }

  async generateInvoice(inv: Invoice, customer: Customer, user: User | null, isPreview = false) {
    const doc = new jsPDF();
    await this.drawHeader(doc, 'Tax Invoice');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(KLENCARE_GOLD);
    doc.text('BILL TO:', 15, 55);
    doc.setTextColor(TEXT_DARK);
    doc.text(customer.name, 15, 61);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    const billToLines = [customer.companyName, customer.billingAddress];
    if (customer.trn) billToLines.push(`TRN: ${customer.trn}`);
    doc.text(billToLines.filter(Boolean), 15, 66);

    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice #:`, 140, 50);
    doc.text(inv.invoiceNumber, 195, 50, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Date:`, 140, 56);
    doc.text(new Date(inv.date).toLocaleDateString('en-GB'), 195, 56, { align: 'right' });
    doc.text(`Due Date:`, 140, 62);
    doc.text(new Date(inv.dueDate).toLocaleDateString('en-GB'), 195, 62, { align: 'right' });
    
    // Add LPO Number if present
    if (inv.lpoNumber) {
      doc.text(`LPO / Ref:`, 140, 68);
      doc.text(inv.lpoNumber, 195, 68, { align: 'right' });
    }

    autoTable(doc, {
      startY: 85,
      head: [['#', 'Item Description', 'Qty', 'Rate (AED)', 'Total (AED)']],
      body: inv.lines?.map((l, i) => [i + 1, l.itemName, l.quantity, l.rate.toFixed(2), l.total.toFixed(2)]) || [],
      theme: 'striped',
      headStyles: { fillColor: KLENCARE_GOLD, textColor: '#FFFFFF', fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    
    doc.setFontSize(10);
    doc.setTextColor(TEXT_MUTED);
    doc.text(`Sub Total:`, 140, finalY + 12);
    doc.text(`AED ${(inv.total / 1.05).toFixed(2)}`, 195, finalY + 12, { align: 'right' });
    doc.text(`VAT (5%):`, 140, finalY + 18);
    doc.text(`AED ${(inv.total - (inv.total / 1.05)).toFixed(2)}`, 195, finalY + 18, { align: 'right' });
    
    doc.setFillColor(KLENCARE_GOLD);
    doc.rect(135, finalY + 25, 60, 12, 'F');
    doc.setTextColor('#ffffff');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`TOTAL AED: ${inv.total.toFixed(2)}`, 190, finalY + 33, { align: 'right' });

    const bankY = Math.max(finalY + 55, 215);
    doc.setDrawColor(KLENCARE_GOLD);
    doc.setLineWidth(0.5);
    doc.rect(15, bankY, 95, 38);
    doc.setTextColor(KLENCARE_GOLD);
    doc.setFontSize(9);
    doc.text('PAYMENT METHOD', 20, bankY + 8);
    doc.setTextColor(TEXT_DARK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text([
      'Bank : RAKBANK',
      'Account Name : KlenCare FZC',
      'Account No. : 0323438159001',
      'Currency : AED'
    ], 20, bankY + 16);

    this.drawFooter(doc);

    if (isPreview) return doc.output('bloburl');
    doc.save(`${inv.invoiceNumber}.pdf`);
  }

  async generateSalesOrder(so: SalesOrder, customer: Customer, user: User | null, isPreview = false) {
    const doc = new jsPDF();
    await this.drawHeader(doc, 'Sales Order');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(KLENCARE_GOLD);
    doc.text('ORDER FOR:', 15, 55);
    doc.setTextColor(TEXT_DARK);
    doc.text(customer.name, 15, 61);
    doc.setFont('helvetica', 'normal');
    
    const customerLines = [customer.companyName, customer.billingAddress];
    if (customer.trn) customerLines.push(`TRN: ${customer.trn}`);
    doc.text(customerLines.filter(Boolean), 15, 66);

    doc.text(`SO #: ${so.orderNumber}`, 195, 50, { align: 'right' });
    doc.text(`Date: ${new Date(so.date).toLocaleDateString('en-GB')}`, 195, 56, { align: 'right' });

    autoTable(doc, {
      startY: 85,
      head: [['#', 'Description', 'Qty', 'Rate (AED)', 'Total (AED)']],
      body: so.lines.map((l, i) => [i + 1, l.itemName, l.quantity, l.rate.toFixed(2), l.total.toFixed(2)]),
      theme: 'striped',
      headStyles: { fillColor: KLENCARE_GOLD }
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFont('helvetica', 'bold');
    doc.text(`Order Total: AED ${so.total.toLocaleString()}`, 195, finalY + 15, { align: 'right' });

    this.drawFooter(doc);
    if (isPreview) return doc.output('bloburl');
    doc.save(`${so.orderNumber}.pdf`);
  }

  async generatePurchaseOrder(po: PurchaseOrder, vendor: Vendor, user: User | null, isPreview = false) {
    const doc = new jsPDF();
    await this.drawHeader(doc, 'Purchase Order');
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#e11d48'); 
    doc.text('SUPPLIER:', 15, 55);
    doc.setTextColor(TEXT_DARK);
    doc.text(vendor.name, 15, 61);
    doc.setFont('helvetica', 'normal');
    
    const vendorLines = [vendor.companyName, vendor.address];
    if (vendor.trn) vendorLines.push(`TRN: ${vendor.trn}`);
    doc.text(vendorLines.filter(Boolean), 15, 66);

    doc.text(`PO #: ${po.poNumber}`, 195, 50, { align: 'right' });
    doc.text(`Date: ${new Date(po.date).toLocaleDateString('en-GB')}`, 195, 56, { align: 'right' });

    autoTable(doc, {
      startY: 90,
      head: [['#', 'Item Description', 'Qty', 'Cost (AED)', 'Total (AED)']],
      body: po.lines.map((l, i) => [i + 1, l.itemName, l.quantity, l.rate.toFixed(2), l.total.toFixed(2)]),
      theme: 'grid',
      headStyles: { fillColor: '#e11d48' }
    });

    this.drawFooter(doc);
    if (isPreview) return doc.output('bloburl');
    doc.save(`${po.poNumber}.pdf`);
  }

  async generateStatement(customer: Customer, user: User | null, isPreview = false, date?: Date) {
    const doc = new jsPDF();
    await this.drawHeader(doc, 'Statement of Account');
    
    const invoices = salesService.getInvoices().filter(i => i.customerId === customer.id && i.status !== 'Voided');
    const payments = salesService.getPaymentsReceived().filter(p => p.customerId === customer.id);
    
    const ledger = [
      ...invoices.map(i => ({ date: i.date, ref: i.invoiceNumber, type: 'Invoice', debit: i.total, credit: 0 })),
      ...payments.map(p => ({ date: p.date, ref: p.paymentNumber, type: 'Receipt', debit: 0, credit: p.amount }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Layout Styling: Statement Summary
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(KLENCARE_GOLD);
    doc.text('STATEMENT FOR:', 15, 55);
    
    doc.setTextColor(TEXT_DARK);
    doc.setFontSize(11);
    doc.text(customer.name, 15, 62);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const clientLines = [customer.companyName];
    if (customer.trn) clientLines.push(`TRN: ${customer.trn}`);
    doc.text(clientLines.filter(Boolean), 15, 68);

    // Summary Box on Right
    doc.setDrawColor('#e2e8f0');
    doc.setFillColor('#f8fafc');
    doc.rect(130, 48, 65, 25, 'FD');
    
    doc.setTextColor(TEXT_MUTED);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('STATEMENT PERIOD', 135, 54);
    doc.text('DATE GENERATED', 135, 60);
    
    doc.setTextColor(TEXT_DARK);
    doc.setFont('helvetica', 'normal');
    doc.text(date ? date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'All Time', 190, 54, { align: 'right' });
    doc.text(new Date().toLocaleDateString('en-GB'), 190, 60, { align: 'right' });
    
    let runningBalance = 0;
    const rows = ledger.map(entry => {
      runningBalance += (entry.debit - entry.credit);
      return [
        new Date(entry.date).toLocaleDateString('en-GB'),
        entry.ref,
        entry.type,
        entry.debit > 0 ? entry.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '',
        entry.credit > 0 ? entry.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '',
        runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })
      ];
    });

    autoTable(doc, {
      startY: 85,
      head: [['Date', 'Reference', 'Type', 'Debit', 'Credit', 'Balance (AED)']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: KLENCARE_GOLD, textColor: '#FFFFFF', fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, cellPadding: 5 },
      columnStyles: { 
        3: { halign: 'right' }, 
        4: { halign: 'right' }, 
        5: { halign: 'right', fontStyle: 'bold' } 
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    // Proper Alignment for Current Balance as per professional templates
    doc.setDrawColor(KLENCARE_GOLD);
    doc.setLineWidth(0.5);
    doc.line(130, finalY - 5, 195, finalY - 5);
    
    doc.setFontSize(10);
    doc.setTextColor(TEXT_MUTED);
    doc.setFont('helvetica', 'bold');
    doc.text('ACCOUNT SUMMARY:', 15, finalY);
    
    doc.setFontSize(14);
    doc.setTextColor(TEXT_DARK);
    doc.text(`Current Balance:`, 130, finalY);
    doc.setTextColor(KLENCARE_GOLD);
    doc.text(`AED ${runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 195, finalY, { align: 'right' });

    this.drawFooter(doc);
    if (isPreview) return doc.output('bloburl');
    doc.save(`Statement_${customer.name.replace(/\s/g, '_')}.pdf`);
  }

  async generateCreditNote(cn: CreditNote, customer: Customer, user: User | null, isPreview = false) {
    const doc = new jsPDF();
    await this.drawHeader(doc, 'Credit Note');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(KLENCARE_GOLD);
    doc.text('CREDIT TO:', 15, 55);
    doc.setTextColor(TEXT_DARK);
    doc.text(customer.name, 15, 61);
    
    if (customer.trn) {
       doc.setFont('helvetica', 'normal');
       doc.setFontSize(9);
       doc.text(`TRN: ${customer.trn}`, 15, 66);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`CN #:`, 140, 50);
    doc.text(cn.creditNoteNumber, 195, 50, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Date:`, 140, 56);
    doc.text(new Date(cn.date).toLocaleDateString('en-GB'), 195, 56, { align: 'right' });

    autoTable(doc, {
      startY: 85,
      head: [['Description / Reason', 'Credit Amount (AED)']],
      body: [[cn.reason || 'General Return / Credit', cn.amount.toFixed(2)]],
      theme: 'striped',
      headStyles: { fillColor: KLENCARE_GOLD, textColor: '#FFFFFF', fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    
    doc.setFillColor(KLENCARE_GOLD);
    doc.rect(135, finalY + 15, 60, 12, 'F');
    doc.setTextColor('#ffffff');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`TOTAL CREDIT: ${cn.amount.toFixed(2)}`, 190, finalY + 23, { align: 'right' });

    this.drawFooter(doc);
    if (isPreview) return doc.output('bloburl');
    doc.save(`${cn.creditNoteNumber}.pdf`);
  }
}

export const pdfService = new PDFService();
