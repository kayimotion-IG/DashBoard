
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { AppSettings, SalesOrder, Invoice, Customer } from '../types';
import { itemService } from './item.service';
import { salesService } from './sales.service';
import { auditService } from './audit.service';

class PDFService {
  private getSettings(): AppSettings {
    return itemService.getSettings();
  }

  generateSalesOrder(so: SalesOrder, customer: Customer, user: any) {
    const doc = new jsPDF();
    const settings = this.getSettings();
    const primaryColor = [37, 99, 235]; // blue-600

    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(settings.companyName, 20, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(settings.companyAddress, 20, 38);
    doc.text(`Phone: ${settings.companyPhone} | Email: ${settings.companyEmail}`, 20, 43);
    doc.text(`VAT ID: ${settings.vatNumber}`, 20, 48);

    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.text('SALES ORDER', 140, 30);
    
    doc.setFontSize(9);
    doc.text(`Order #: ${so.orderNumber}`, 140, 38);
    doc.text(`Date: ${new Date(so.date).toLocaleDateString()}`, 140, 43);
    doc.text(`Status: ${so.status.toUpperCase()}`, 140, 48);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 20, 65);
    doc.setFont('helvetica', 'normal');
    doc.text(customer.name, 20, 72);
    doc.text(customer.companyName, 20, 77);
    doc.text(customer.billingAddress, 20, 82, { maxWidth: 60 });

    const tableData = so.lines.map(line => [
      line.itemName,
      line.quantity,
      `AED ${line.rate.toFixed(2)}`,
      `AED ${line.total.toLocaleString()}`
    ]);

    (doc as any).autoTable({
      startY: 100,
      head: [['Product / Service', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor },
      styles: { fontSize: 9 },
      columnStyles: {
        3: { halign: 'right' },
        1: { halign: 'center' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.text('Sub Total:', 140, finalY);
    doc.text(`AED ${so.subTotal.toLocaleString()}`, 190, finalY, { align: 'right' });
    
    doc.text('Tax (VAT 5%):', 140, finalY + 7);
    doc.text(`AED ${so.taxTotal.toLocaleString()}`, 190, finalY + 7, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total Amount:', 140, finalY + 16);
    doc.text(`AED ${so.total.toLocaleString()}`, 190, finalY + 16, { align: 'right' });

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'italic');
    doc.text(settings.pdfFooter, 105, pageHeight - 15, { align: 'center' });

    doc.save(`${so.orderNumber}.pdf`);
    auditService.log(user, 'PDF_EXPORT', 'SALES_ORDER', so.id, `Generated PDF for ${so.orderNumber}`);
  }

  generateInvoice(invoice: Invoice, customer: Customer, user: any) {
    const doc = new jsPDF();
    const settings = this.getSettings();
    const primaryColor = [79, 70, 229]; // Indigo-600

    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(settings.companyName, 20, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(settings.companyAddress, 20, 38);
    doc.text(`VAT ID: ${settings.vatNumber}`, 20, 48);

    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.text('TAX INVOICE', 140, 30);
    doc.setFontSize(9);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 140, 38);
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 140, 43);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 140, 48);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER:', 20, 65);
    doc.setFont('helvetica', 'normal');
    doc.text(customer.name, 20, 72);
    doc.text(customer.companyName, 20, 77);
    doc.text(customer.billingAddress, 20, 82, { maxWidth: 60 });

    const originalSO = salesService.getSOById(invoice.soId || '');
    const lines = originalSO?.lines || [];

    const tableData = lines.map(line => [
      line.itemName,
      line.quantity,
      `AED ${line.rate.toFixed(2)}`,
      `AED ${line.total.toLocaleString()}`
    ]);

    (doc as any).autoTable({
      startY: 100,
      head: [['Description', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor },
      styles: { fontSize: 9 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text('Total Invoice Amount:', 140, finalY);
    doc.text(`AED ${invoice.total.toLocaleString()}`, 190, finalY, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text('BALANCE DUE:', 140, finalY + 10);
    doc.text(`AED ${invoice.balanceDue.toLocaleString()}`, 190, finalY + 10, { align: 'right' });

    doc.save(`${invoice.invoiceNumber}.pdf`);
    auditService.log(user, 'PDF_EXPORT', 'INVOICE', invoice.id, `Generated PDF for ${invoice.invoiceNumber}`);
  }
}

export const pdfService = new PDFService();
