
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, Customer, User, SalesOrder, Vendor, PurchaseOrder, CreditNote } from '../types';
import { salesService } from './sales.service';
import { itemService } from './item.service';

const KLENCARE_BLUE = '#0B4AA2';
const KLENCARE_GOLD = '#fbaf0f';

export class PDFService {
  private drawHeader(doc: jsPDF, title: string) {
    doc.setTextColor(KLENCARE_BLUE);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('KlenCare FZC', 15, 20);

    doc.setFontSize(9);
    doc.setTextColor('#334155');
    doc.setFont('helvetica', 'normal');
    doc.text(['Rolex Tower, Sheikh Zayed Road', 'Dubai, United Arab Emirates', '+971 50 315 7462', 'support@klencare.net'], 15, 28);

    doc.setFontSize(24);
    doc.setTextColor('#1e293b');
    doc.text(title.toUpperCase(), 195, 20, { align: 'right' });
    doc.setDrawColor(KLENCARE_GOLD);
    doc.setLineWidth(1);
    doc.line(140, 24, 195, 24);
  }

  async generateStatement(customer: Customer, user: User | null, isPreview = false, date?: Date) {
    const doc = new jsPDF();
    this.drawHeader(doc, 'Account Statement');

    const invoices = salesService.getInvoices().filter(i => i.customerId === customer.id && i.status !== 'Voided');
    const payments = salesService.getPaymentsReceived().filter(p => p.customerId === customer.id);
    const credits = salesService.getCreditNotes().filter(c => c.customerId === customer.id);

    const ledger = [
      ...invoices.map(i => ({ date: i.date, ref: i.invoiceNumber, type: 'Invoice', debit: i.total, credit: 0 })),
      ...payments.map(p => ({ date: p.date, ref: p.paymentNumber || 'PAY', type: 'Payment', debit: 0, credit: p.amount })),
      ...credits.map(c => ({ date: c.date, ref: c.creditNoteNumber, type: 'Credit Note', debit: 0, credit: c.amount }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Statement For:', 15, 60);
    doc.setFont('helvetica', 'normal');
    doc.text([customer.name, customer.companyName, customer.billingAddress].filter(Boolean), 15, 66);

    let balance = 0;
    const tableBody = ledger.map(entry => {
      balance += (entry.debit - entry.credit);
      return [
        new Date(entry.date).toLocaleDateString('en-GB'),
        entry.ref,
        entry.type,
        entry.debit > 0 ? entry.debit.toFixed(2) : '',
        entry.credit > 0 ? entry.credit.toFixed(2) : '',
        balance.toFixed(2)
      ];
    });

    autoTable(doc, {
      startY: 90,
      head: [['Date', 'Reference', 'Type', 'Debit', 'Credit', 'Balance']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: KLENCARE_BLUE },
      columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Total Outstanding: AED ${balance.toLocaleString()}`, 195, finalY, { align: 'right' });

    if (isPreview) return doc.output('bloburl');
    doc.save(`Statement_${customer.name.replace(/\s/g, '_')}.pdf`);
  }

  async generateInvoice(inv: Invoice, customer: Customer, user: User | null, isPreview = false) {
    const doc = new jsPDF();
    this.drawHeader(doc, 'Tax Invoice');
    
    doc.setFontSize(10);
    doc.text(`Invoice #: ${inv.invoiceNumber}`, 195, 40, { align: 'right' });
    doc.text(`Date: ${new Date(inv.date).toLocaleDateString()}`, 195, 46, { align: 'right' });
    doc.text(`TRN: 100234567800003`, 195, 52, { align: 'right' });

    autoTable(doc, {
      startY: 80,
      head: [['#', 'Description', 'Qty', 'Rate', 'Total']],
      body: inv.lines?.map((l, i) => [i + 1, l.itemName, l.quantity, l.rate.toFixed(2), l.total.toFixed(2)]) || [],
      theme: 'striped',
      headStyles: { fillColor: KLENCARE_BLUE }
    });

    if (isPreview) return doc.output('bloburl');
    doc.save(`${inv.invoiceNumber}.pdf`);
  }

  // ADDED: generateSalesOrder method
  async generateSalesOrder(so: SalesOrder, customer: Customer, user: User | null, isPreview = false) {
    const doc = new jsPDF();
    this.drawHeader(doc, 'Sales Order');
    
    doc.setFontSize(10);
    doc.text(`SO #: ${so.orderNumber}`, 195, 40, { align: 'right' });
    doc.text(`Date: ${new Date(so.date).toLocaleDateString()}`, 195, 46, { align: 'right' });
    if (so.lpoNumber) doc.text(`LPO #: ${so.lpoNumber}`, 195, 52, { align: 'right' });

    autoTable(doc, {
      startY: 80,
      head: [['#', 'Description', 'Qty', 'Rate', 'Total']],
      body: so.lines.map((l, i) => [i + 1, l.itemName, l.quantity, l.rate.toFixed(2), l.total.toFixed(2)]),
      theme: 'striped',
      headStyles: { fillColor: KLENCARE_BLUE }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.text(`Order Total: AED ${so.total.toLocaleString()}`, 195, finalY, { align: 'right' });

    if (isPreview) return doc.output('bloburl');
    doc.save(`${so.orderNumber}.pdf`);
  }

  // ADDED: generatePurchaseOrder method
  async generatePurchaseOrder(po: PurchaseOrder, vendor: Vendor, user: User | null, isPreview = false) {
    const doc = new jsPDF();
    this.drawHeader(doc, 'Purchase Order');
    
    doc.setFontSize(10);
    doc.text(`PO #: ${po.poNumber}`, 195, 40, { align: 'right' });
    doc.text(`Date: ${new Date(po.date).toLocaleDateString()}`, 195, 46, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text('Supplier:', 15, 60);
    doc.setFont('helvetica', 'normal');
    doc.text([vendor.name, vendor.companyName, vendor.address].filter(Boolean), 15, 66);

    autoTable(doc, {
      startY: 90,
      head: [['#', 'Description', 'Qty', 'Cost', 'Total']],
      body: po.lines.map((l, i) => [i + 1, l.itemName, l.quantity, l.rate.toFixed(2), l.total.toFixed(2)]),
      theme: 'striped',
      headStyles: { fillColor: '#e11d48' }
    });

    if (isPreview) return doc.output('bloburl');
    doc.save(`${po.poNumber}.pdf`);
  }

  // ADDED: generateCreditNote method
  async generateCreditNote(cn: CreditNote, customer: Customer, user: User | null, isPreview = false) {
    const doc = new jsPDF();
    this.drawHeader(doc, 'Credit Note');
    
    doc.setFontSize(10);
    doc.text(`CN #: ${cn.creditNoteNumber}`, 195, 40, { align: 'right' });
    doc.text(`Date: ${new Date(cn.date).toLocaleDateString()}`, 195, 46, { align: 'right' });

    autoTable(doc, {
      startY: 80,
      head: [['Reason', 'Credit Amount']],
      body: [[cn.reason || 'General Return', `AED ${cn.amount.toFixed(2)}`]],
      theme: 'grid',
      headStyles: { fillColor: KLENCARE_GOLD }
    });

    if (isPreview) return doc.output('bloburl');
    doc.save(`${cn.creditNoteNumber}.pdf`);
  }
}

export const pdfService = new PDFService();
