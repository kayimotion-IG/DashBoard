
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
    auditService.log(user, 'CREATE', 'CUSTOMER', newCust.id, `Created ${newCust.name}`);
    return newCust;
  }

  updateCustomer(id: string, data: any, user: any) {
    const idx = this.customers.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.customers[idx] = { ...this.customers[idx], ...data };
      this.saveData();
      auditService.log(user, 'UPDATE', 'CUSTOMER', id, `Updated ${this.customers[idx].name}`);
    }
  }

  deleteCustomer(id: string, user: any) {
    this.customers = this.customers.filter(c => c.id !== id);
    this.saveData();
  }

  getCustomerBalance(customerId: string) {
    return this.invoices
      .filter(i => i.customerId === customerId && i.status !== 'Voided')
      .reduce((s, i) => s + (Number(i.balanceDue) || 0), 0);
  }

  getSalesOrders() { return this.salesOrders; }
  getSOById(id: string) { return this.salesOrders.find(so => so.id === id); }

  getInvoices() { return this.invoices; }
  getInvoiceById(id: string) { return this.invoices.find(i => i.id === id); }
  getDeliveries() { return this.deliveryChallans; }
  getPaymentsReceived() { return this.payments; }

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
    return newSO;
  }

  updateSOStatus(id: string, status: string, user: any) {
    const idx = this.salesOrders.findIndex(so => so.id === id);
    if (idx !== -1) {
      this.salesOrders[idx].status = status as any;
      this.saveData();
      auditService.log(user, 'UPDATE', 'SALES_ORDER', id, `Updated SO Status to ${status}`);
    }
  }

  createInvoiceFromSO(soId: string, user: any) {
    const so = this.getSOById(soId);
    if (!so) throw new Error("SO not found");
    return this.createInvoice({
      soId: so.id,
      customerId: so.customerId,
      total: so.total,
      date: new Date().toISOString()
    }, user);
  }

  createDelivery(soIdOrData: any, warehouseIdOrUser: any, userArg?: any) {
    let dc: DeliveryChallan;
    let activeUser = userArg;
    let targetWarehouseId = 'WH01';

    if (typeof soIdOrData === 'string') {
      const so = this.getSOById(soIdOrData);
      if (!so) throw new Error("SO not found");
      dc = {
        id: `DC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        dcNumber: `DC-${Date.now().toString().slice(-5)}`,
        soId: so.id,
        customerId: so.customerId,
        date: new Date().toISOString(),
        status: 'Delivered',
        lines: so.lines.map(l => ({ itemId: l.itemId, quantity: l.quantity }))
      };
      targetWarehouseId = warehouseIdOrUser;
      activeUser = userArg;
    } else {
      const data = soIdOrData;
      activeUser = warehouseIdOrUser;
      dc = {
        id: `DC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        dcNumber: data.dcNumber || `DC-${Date.now().toString().slice(-5)}`,
        soId: data.soId || '',
        customerId: data.customerId,
        date: data.date || new Date().toISOString(),
        status: 'Delivered',
        lines: data.lines
      };
    }

    dc.lines.forEach((line: any) => {
      itemService.addStockMove({
        itemId: line.itemId,
        warehouseId: targetWarehouseId,
        refType: 'DELIVERY',
        refNo: dc.dcNumber,
        inQty: 0,
        outQty: line.quantity,
        note: `Manual Delivery ${dc.dcNumber}`
      });
    });

    this.deliveryChallans.push(dc);
    this.saveData();
    if (activeUser) auditService.log(activeUser, 'CREATE', 'DELIVERY_CHALLAN', dc.id, `Created Delivery ${dc.dcNumber}`);
    return dc;
  }

  createInvoice(data: any, user: any) {
    const inv: Invoice = {
      id: `INV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      invoiceNumber: data.invoiceNumber || `INV-${Date.now().toString().slice(-5)}`,
      soId: data.soId || '',
      customerId: data.customerId,
      date: data.date || new Date().toISOString(),
      dueDate: data.dueDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      total: Number(data.total),
      balanceDue: Number(data.total),
      status: 'Sent'
    };
    this.invoices.push(inv);
    this.saveData();
    if (user) auditService.log(user, 'CREATE', 'INVOICE', inv.id, `Created Invoice ${inv.invoiceNumber}`);
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

    // Allocate to invoice if provided
    if (payment.invoiceId) {
      const invIdx = this.invoices.findIndex(i => i.id === payment.invoiceId);
      if (invIdx !== -1) {
        const invoice = this.invoices[invIdx];
        invoice.balanceDue = Math.max(0, invoice.balanceDue - payment.amount);
        if (invoice.balanceDue <= 0) invoice.status = 'Paid';
        else invoice.status = 'Partially Paid';
      }
    }

    this.payments.push(payment);
    this.saveData();
    if (user) auditService.log(user, 'CREATE', 'PAYMENT_RECEIVED', payment.id, `Recorded Payment ${payment.paymentNumber} of AED ${payment.amount}`);
    return payment;
  }
}

export const salesService = new SalesService();
