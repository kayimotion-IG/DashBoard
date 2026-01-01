import { 
  Customer, SalesOrder, DeliveryChallan, 
  Invoice, PaymentReceived, CreditNote, SalesReturn 
} from '../types';
import { itemService } from './item.service';
import { auditService } from './audit.service';

class SalesService {
  private customers: Customer[] = [];
  private salesOrders: SalesOrder[] = [];
  private deliveryChallans: DeliveryChallan[] = [];
  private invoices: Invoice[] = [];
  private payments: PaymentReceived[] = [];
  private creditNotes: CreditNote[] = [];
  private returns: SalesReturn[] = [];

  constructor() {
    this.loadData();
  }

  private loadData() {
    const data = [
      { key: 'klencare_customers', ref: 'customers' },
      { key: 'klencare_sos', ref: 'salesOrders' },
      { key: 'klencare_dcs', ref: 'deliveryChallans' },
      { key: 'klencare_invoices', ref: 'invoices' },
      { key: 'klencare_payments', ref: 'payments' },
      { key: 'klencare_credit_notes', ref: 'creditNotes' },
      { key: 'klencare_returns', ref: 'returns' },
    ];

    data.forEach(d => {
      const stored = localStorage.getItem(d.key);
      if (stored) (this as any)[d.ref] = JSON.parse(stored);
    });

    if (this.customers.length === 0) {
      this.seedData();
    }
  }

  private seedData() {
    this.customers = [
      { id: 'CUST-01', name: 'Standard UAE Customer', companyName: 'General Trading LLC', email: 'sales@general-trading.ae', phone: '+971 4 999 8888', currency: 'AED', billingAddress: 'Deira, Dubai, UAE', shippingAddress: 'Deira, Dubai, UAE', status: 'Active', createdAt: new Date().toISOString() }
    ];
    this.saveData();
  }

  private saveData() {
    localStorage.setItem('klencare_customers', JSON.stringify(this.customers));
    localStorage.setItem('klencare_sos', JSON.stringify(this.salesOrders));
    localStorage.setItem('klencare_dcs', JSON.stringify(this.deliveryChallans));
    localStorage.setItem('klencare_invoices', JSON.stringify(this.invoices));
    localStorage.setItem('klencare_payments', JSON.stringify(this.payments));
    localStorage.setItem('klencare_credit_notes', JSON.stringify(this.creditNotes));
    localStorage.setItem('klencare_returns', JSON.stringify(this.returns));
  }

  getCustomers() { return this.customers; }
  getCustomerById(id: string) { return this.customers.find(c => c.id === id); }

  createCustomer(data: any, user: any) {
    const newCust: Customer = {
      id: `CUST-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      name: data.name.trim(),
      companyName: data.companyName || '',
      email: data.email || '',
      phone: data.phone || '',
      currency: data.currency || 'AED',
      billingAddress: data.billingAddress || '',
      shippingAddress: data.shippingAddress || '',
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    this.customers.push(newCust);
    this.saveData();
    if (user) auditService.log(user, 'CREATE', 'CUSTOMER', newCust.id, `Created ${newCust.name}`);
    return newCust;
  }

  updateCustomer(id: string, data: any, user: any) {
    const idx = this.customers.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.customers[idx] = { ...this.customers[idx], ...data };
      this.saveData();
      if (user) auditService.log(user, 'UPDATE', 'CUSTOMER', id, `Updated ${this.customers[idx].name}`);
    }
  }

  deleteCustomer(id: string, user: any) {
    this.customers = this.customers.filter(c => c.id !== id);
    this.saveData();
  }

  getCustomerBalance(customerId: string) {
    const invoiceDue = this.invoices
      .filter(i => i.customerId === customerId && i.status !== 'Voided')
      .reduce((s, i) => s + (Number(i.balanceDue) || 0), 0);
    
    const creditAvailable = this.creditNotes
      .filter(cn => cn.customerId === customerId && cn.status === 'Open')
      .reduce((s, cn) => s + (Number(cn.amount) || 0), 0);
      
    return Math.max(0, invoiceDue - creditAvailable);
  }

  getSalesOrders() { return this.salesOrders; }
  getSOById(id: string) { return this.salesOrders.find(so => so.id === id); }
  getInvoices() { return this.invoices; }
  getInvoiceById(id: string) { return this.invoices.find(i => i.id === id); }
  getDeliveries() { return this.deliveryChallans; }
  getPaymentsReceived() { return this.payments; }
  getCreditNotes() { return this.creditNotes; }
  
  createDelivery(dataOrSoId: any, userOrWarehouseId: any, maybeUser?: any) {
    let dc: DeliveryChallan;
    let user: any;

    if (typeof dataOrSoId === 'string') {
      const soId = dataOrSoId;
      const warehouseId = userOrWarehouseId;
      user = maybeUser;
      const so = this.getSOById(soId);
      if (!so) throw new Error("Sales Order not found");

      dc = {
        id: `DC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        dcNumber: `DC-${Date.now().toString().slice(-5)}`,
        soId: so.id,
        customerId: so.customerId,
        date: new Date().toISOString(),
        status: 'Delivered',
        lines: so.lines.map(l => ({ itemId: l.itemId, quantity: l.quantity }))
      };

      this.updateSOStatus(so.id, 'Shipped', user);
    } else {
      const data = dataOrSoId;
      user = userOrWarehouseId;
      dc = {
        ...data,
        id: `DC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        dcNumber: data.dcNumber || `DC-${Date.now().toString().slice(-5)}`,
        status: 'Delivered',
        date: data.date || new Date().toISOString(),
        soId: data.soId || ''
      };
    }

    dc.lines.forEach(line => {
      itemService.addStockMove({
        itemId: line.itemId,
        warehouseId: (dc as any).warehouseId || 'WH01',
        refType: 'DELIVERY',
        refNo: dc.dcNumber,
        inQty: 0,
        outQty: line.quantity,
        note: `Fulfillment via ${dc.dcNumber}`
      });
    });

    this.deliveryChallans.push(dc);
    this.saveData();
    if (user) auditService.log(user, 'SHIP', 'DELIVERY_CHALLAN', dc.id, `Created DC ${dc.dcNumber}`);
    return dc;
  }

  createCreditNote(data: any, user: any) {
    const cn: CreditNote = {
      id: `CN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      creditNoteNumber: data.creditNoteNumber || `CN-${Date.now().toString().slice(-5)}`,
      customerId: data.customerId,
      date: data.date || new Date().toISOString(),
      amount: Number(data.amount),
      status: 'Open',
      reason: data.reason || 'General Return'
    };
    this.creditNotes.push(cn);
    this.saveData();
    if (user) auditService.log(user, 'CREATE', 'CREDIT_NOTE', cn.id, `Issued Credit Note ${cn.creditNoteNumber}`);
    return cn;
  }

  createSO(data: any, user: any) {
    const newSO: SalesOrder = {
      ...data,
      id: `SO-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      orderNumber: data.orderNumber || `SO-${Date.now().toString().slice(-5)}`,
      status: 'Draft',
      date: data.date || new Date().toISOString()
    };
    this.salesOrders.push(newSO);
    this.saveData();
    if (user) auditService.log(user, 'CREATE', 'SALES_ORDER', newSO.id, `Created SO ${newSO.orderNumber}`);
    return newSO;
  }

  updateSOStatus(id: string, status: string, user: any) {
    const idx = this.salesOrders.findIndex(so => so.id === id);
    if (idx !== -1) {
      this.salesOrders[idx].status = status as any;
      this.saveData();
      if (user) auditService.log(user, 'UPDATE', 'SALES_ORDER', id, `Status updated to ${status}`);
    }
  }

  createInvoice(data: any, user: any) {
    const inv: Invoice = {
      id: `INV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      invoiceNumber: data.invoiceNumber || `INV-${Date.now().toString().slice(-5)}`,
      lpoNumber: data.lpoNumber || '', // FIXED: Explicitly map the LPO number from input data
      soId: data.soId || '',
      customerId: data.customerId,
      date: data.date || new Date().toISOString(),
      dueDate: data.dueDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      total: Number(data.total),
      balanceDue: Number(data.total),
      status: 'Sent',
      lines: data.lines?.length > 0 ? data.lines : [{
        id: 'L1',
        itemId: 'MANUAL',
        itemName: 'General Sales / Professional Services',
        quantity: 1,
        rate: Number(data.total),
        taxAmount: Number(data.total) * 0.05,
        total: Number(data.total)
      }]
    };

    if (inv.lines.length > 0 && inv.lines[0].itemId !== 'MANUAL') {
      inv.lines.forEach(line => {
        itemService.addStockMove({
          itemId: line.itemId,
          warehouseId: 'WH01',
          refType: 'SALES',
          refNo: inv.invoiceNumber,
          inQty: 0,
          outQty: line.quantity,
          note: `Inventory deduction via ${inv.invoiceNumber}`
        });
      });
    }

    this.invoices.push(inv);
    this.saveData();
    if (user) auditService.log(user, 'CREATE', 'INVOICE', inv.id, `Invoiced ${inv.invoiceNumber}`);
    return inv;
  }

  recordPayment(data: any, user: any) {
    const payment: PaymentReceived = {
      id: `PAY-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      paymentNumber: data.paymentNumber || `PAY-${Date.now().toString().slice(-5)}`,
      customerId: data.customerId,
      invoiceId: data.invoiceId || '',
      date: data.date || new Date().toISOString(),
      amount: Number(data.amount),
      paymentMode: data.paymentMode || 'Bank',
      reference: data.reference || ''
    };

    if (payment.invoiceId) {
      const invIdx = this.invoices.findIndex(i => i.id === payment.invoiceId);
      if (invIdx !== -1) {
        this.invoices[invIdx].balanceDue = Math.max(0, this.invoices[invIdx].balanceDue - payment.amount);
        if (this.invoices[invIdx].balanceDue <= 0) this.invoices[invIdx].status = 'Paid';
        else this.invoices[invIdx].status = 'Partially Paid';
      }
    }

    this.payments.push(payment);
    this.saveData();
    if (user) auditService.log(user, 'CREATE', 'PAYMENT_RECEIVED', payment.id, `Received AED ${payment.amount}`);
    return payment;
  }
}

export const salesService = new SalesService();
