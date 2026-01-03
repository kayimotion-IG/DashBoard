
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
      const results = await Promise.allSettled([
        apiRequest('GET', '/api/customers'),
        apiRequest('GET', '/api/invoices'),
        apiRequest('GET', '/api/sales_orders'),
        apiRequest('GET', '/api/payments_received'),
        apiRequest('GET', '/api/credit_notes'),
        apiRequest('GET', '/api/delivery_challans')
      ]);

      if (results[0].status === 'fulfilled') this.customers = results[0].value;
      if (results[1].status === 'fulfilled') this.invoices = results[1].value;
      if (results[2].status === 'fulfilled') this.orders = results[2].value;
      if (results[3].status === 'fulfilled') this.receipts = results[3].value;
      if (results[4].status === 'fulfilled') this.credits = results[4].value;
      if (results[5].status === 'fulfilled') this.deliveries = results[5].value;
      
    } catch (e) { 
      console.error("Sales Service Sync Failure", e); 
    }
  }

  getCustomers() { return this.customers; }
  getCustomerById(id: string) { return this.customers.find(c => c.id === id); }
  getInvoices() { return this.invoices; }
  getSalesOrders() { return this.orders; }
  getPaymentsReceived() { return this.receipts; }
  getCreditNotes() { return this.credits; }
  getSOById(id: string) { return this.orders.find(o => o.id === id); }

  async createCustomer(data: any, user: any) {
    const nc = { ...data, id: `CUST-${Date.now()}`, status: 'Active', createdAt: new Date().toISOString() };
    await apiRequest('POST', '/api/customers', nc);
    this.refresh(); 
    return nc;
  }

  async updateCustomer(id: string, data: any, user: User | null) {
    const updated = { ...data, id };
    await apiRequest('POST', '/api/customers', updated);
    this.refresh();
    return updated;
  }

  async deleteCustomer(id: string, user: User) {
    await apiRequest('DELETE', `/api/customers/${id}`);
    this.refresh();
  }

  getCustomerBalance(customerId: string) {
    return this.invoices
      .filter(i => i.customerId === customerId && i.status !== 'Voided')
      .reduce((s, i) => s + (Number(i.balanceDue) || 0), 0);
  }

  async createSO(data: any, user: any) {
    const nso = { ...data, id: `SO-${Date.now()}`, orderNumber: `SO-${Date.now().toString().slice(-5)}`, status: 'Draft' };
    await apiRequest('POST', '/api/sales_orders', nso);
    this.refresh();
    return nso;
  }

  async updateSOStatus(id: string, status: string, user: any) {
    const so = this.orders.find(o => o.id === id);
    if (so) {
      so.status = status as any;
      await apiRequest('POST', '/api/sales_orders', so);
      this.refresh();
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
    
    this.refresh();
    return inv;
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

    this.refresh();
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
    this.refresh();
    return pay;
  }

  async createCreditNote(data: any, user: any) {
    const cn = { ...data, id: `CN-${Date.now()}`, status: 'Open' };
    await apiRequest('POST', '/api/credit_notes', cn);
    this.refresh();
    return cn;
  }

  getDeliveries() { return this.deliveries; }
}

export const salesService = new SalesService();
