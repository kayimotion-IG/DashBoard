
import { Customer, SalesOrder, Invoice, PaymentReceived, CreditNote, User, DeliveryChallan } from '../types';
import { itemService } from './item.service';
import { apiRequest } from './api';

class SalesService {
  private customers: Customer[] = [];
  private invoices: Invoice[] = [];
  private orders: SalesOrder[] = [];
  private receipts: PaymentReceived[] = [];
  private credits: CreditNote[] = [];
  private deliveries: DeliveryChallan[] = [];

  constructor() {
    this.refresh();
  }

  async refresh() {
    try {
      const [custs, invs, sos, pays, creds, dcs] = await Promise.all([
        apiRequest('GET', '/api/customers'),
        apiRequest('GET', '/api/invoices'),
        apiRequest('GET', '/api/sales_orders'),
        apiRequest('GET', '/api/payments_received'),
        apiRequest('GET', '/api/credit_notes'),
        apiRequest('GET', '/api/delivery_challans')
      ]);

      this.customers = custs || [];
      this.invoices = invs || [];
      this.orders = sos || [];
      this.receipts = pays || [];
      this.credits = creds || [];
      this.deliveries = dcs || [];
      
    } catch (e) { 
      console.error("Sales Service Sync Failure", e); 
    }
  }

  getCustomers() { return this.customers; }
  getCustomerById(id: string) { return this.customers.find(c => c.id === id); }
  getInvoices() { return this.invoices; }
  getInvoiceById(id: string) { return this.invoices.find(i => i.id === id); }
  getSalesOrders() { return this.orders; }
  getPaymentsReceived() { return this.receipts; }
  getCreditNotes() { return this.credits; }
  getSOById(id: string) { return this.orders.find(o => o.id === id); }

  async createCustomer(data: any, user: any) {
    const nc = { 
      ...data, 
      id: `CUST-${Date.now()}`, 
      status: data.status || 'Active', 
      createdAt: new Date().toISOString() 
    };
    const saved = await apiRequest('POST', '/api/customers', nc);
    await this.refresh();
    return saved;
  }

  async updateCustomer(id: string, data: any, user: User | null) {
    const updated = { ...data, id };
    const saved = await apiRequest('POST', '/api/customers', updated);
    await this.refresh();
    return saved;
  }

  async deleteCustomer(id: string, user: User) {
    await apiRequest('DELETE', `/api/customers/${id}`);
    await this.refresh();
  }

  getCustomerBalance(customerId: string) {
    return this.invoices
      .filter(i => i.customerId === customerId && i.status !== 'Voided')
      .reduce((s, i) => s + (Number(i.balanceDue) || 0), 0);
  }

  async createSO(data: any, user: any) {
    const nso = { ...data, id: `SO-${Date.now()}`, orderNumber: `SO-${Date.now().toString().slice(-5)}`, status: 'Draft' };
    await apiRequest('POST', '/api/sales_orders', nso);
    await this.refresh();
    return nso;
  }

  async updateSOStatus(id: string, status: string, user: any) {
    const so = this.orders.find(o => o.id === id);
    if (so) {
      so.status = status as any;
      await apiRequest('POST', '/api/sales_orders', so);
      await this.refresh();
    }
  }

  async createInvoice(data: any, user: any) {
    const inv = { 
      ...data, 
      id: `INV-${Date.now()}`, 
      invoiceNumber: data.invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
      balanceDue: Number(data.total),
      status: 'Sent' 
    };
    await apiRequest('POST', '/api/invoices', inv);
    if (data.lines) {
      for (const line of data.lines) {
        await itemService.addStockMove({
          itemId: line.itemId,
          refType: 'SALES',
          refNo: inv.invoiceNumber,
          outQty: Number(line.quantity),
          note: `Auto-deduct from Invoice ${inv.invoiceNumber}`
        });
      }
    }
    if (data.soId) await this.updateSOStatus(data.soId, 'Invoiced', user);
    await this.refresh();
    return inv;
  }

  async updateInvoice(id: string, data: Partial<Invoice>) {
    const res = await apiRequest('PUT', `/api/invoices/${id}`, data);
    await this.refresh();
    return res;
  }

  async sendInvoiceEmail(id: string, emailData: { to: string, subject: string, body: string }) {
    return await apiRequest('POST', `/api/invoices/${id}/email`, emailData);
  }

  async createDelivery(data: any, user: User | null) {
    let dc: any;
    if (typeof data === 'string') {
      const so = this.getSOById(data);
      if (!so) throw new Error("Sales Order not found.");
      dc = {
        id: `DC-${Date.now()}`,
        dcNumber: `DC-SO-${so.orderNumber}`,
        soId: so.id,
        customerId: so.customerId,
        date: new Date().toISOString(),
        status: 'Delivered',
        lines: so.lines.map(l => ({ itemId: l.itemId, quantity: l.quantity }))
      };
      await this.updateSOStatus(so.id, 'Shipped', user);
    } else {
      dc = { ...data, id: `DC-${Date.now()}`, status: 'Delivered' };
    }
    await apiRequest('POST', '/api/delivery_challans', dc);
    for (const line of dc.lines) {
      await itemService.addStockMove({
        itemId: line.itemId,
        warehouseId: 'WH01',
        refType: 'DELIVERY',
        refNo: dc.dcNumber,
        outQty: Number(line.quantity),
        note: `Stock departure via DC ${dc.dcNumber}`
      });
    }
    await this.refresh();
    return dc;
  }

  async recordPayment(data: any, user: any) {
    const pay = { ...data, id: `PAY-${Date.now()}`, amount: Number(data.amount) };
    await apiRequest('POST', '/api/payments_received', pay);
    if (data.invoiceId) {
      const inv = this.invoices.find(i => i.id === data.invoiceId);
      if (inv) {
        inv.balanceDue = Math.max(0, (Number(inv.balanceDue) || 0) - pay.amount);
        inv.status = inv.balanceDue <= 0 ? 'Paid' : 'Partially Paid';
        await apiRequest('POST', '/api/invoices', inv);
      }
    }
    await this.refresh();
    return pay;
  }

  async createCreditNote(data: any, user: any) {
    const cn = { ...data, id: `CN-${Date.now()}`, status: 'Open' };
    await apiRequest('POST', '/api/credit_notes', cn);
    await this.refresh();
    return cn;
  }

  getDeliveries() { return this.deliveries; }
}

export const salesService = new SalesService();
