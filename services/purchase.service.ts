
import { Vendor, PurchaseOrder, Bill, PaymentMade, GoodsReceive, User } from '../types';
import { itemService } from './item.service';
import { apiRequest } from './api';

class PurchaseService {
  private vendors: Vendor[] = [];
  private bills: Bill[] = [];
  private purchaseOrders: PurchaseOrder[] = [];
  private paymentsMade: PaymentMade[] = [];
  private receives: GoodsReceive[] = [];

  constructor() {
    this.refresh();
  }

  async refresh() {
    try {
      const [vnds, bils, pos, pays, recs] = await Promise.all([
        apiRequest('GET', '/api/vendors'),
        apiRequest('GET', '/api/bills'),
        apiRequest('GET', '/api/purchase_orders'),
        apiRequest('GET', '/api/payments_made'),
        apiRequest('GET', '/api/receives')
      ]);

      this.vendors = vnds || [];
      this.bills = bils || [];
      this.purchaseOrders = pos || [];
      this.paymentsMade = pays || [];
      this.receives = recs || [];
    } catch (e) {
      console.error("Purchase Sync Failed", e);
    }
  }

  getVendors() { return this.vendors; }
  getVendorById(id: string) { return this.vendors.find(v => v.id === id); }
  getBills() { return this.bills; }
  getPurchaseOrders() { return this.purchaseOrders; }
  getPOById(id: string) { return this.purchaseOrders.find(po => po.id === id); }
  getPaymentsMade() { return this.paymentsMade; }
  getReceives() { return this.receives; }

  async createVendor(data: any, user: User | null) {
    const nv = { 
      ...data, 
      id: `VND-${Date.now()}`, 
      status: data.status || 'Active', 
      createdAt: new Date().toISOString() 
    };
    const saved = await apiRequest('POST', '/api/vendors', nv);
    await this.refresh();
    return saved;
  }

  async findOrCreateVendor(name: string, user: User | null) {
    let v = this.vendors.find(v => v.name.toLowerCase() === name.toLowerCase());
    if (!v) v = await this.createVendor({ name, companyName: name, currency: 'AED' }, user);
    return v;
  }

  async updateVendor(id: string, data: any, user: User | null) {
    const updated = { ...data, id };
    const saved = await apiRequest('POST', '/api/vendors', updated);
    await this.refresh();
    return saved;
  }

  async deleteVendor(id: string, user: User) {
    await apiRequest('DELETE', `/api/vendors/${id}`);
    await this.refresh();
  }

  getVendorBalance(vendorId: string) {
    return this.bills
      .filter(b => b.vendorId === vendorId && b.status !== 'Void')
      .reduce((sum, b) => sum + (Number(b.balanceDue) || 0), 0);
  }

  async createPO(data: any, user: User | null) {
    const npo = { ...data, id: `PO-${Date.now()}`, poNumber: data.poNumber || `PO-${Date.now().toString().slice(-4)}`, status: 'Issued' };
    await apiRequest('POST', '/api/purchase_orders', npo);
    await this.refresh();
    return npo;
  }

  async updatePOStatus(id: string, status: string, user: User | null) {
    const po = this.getPOById(id);
    if (po) {
      po.status = status as any;
      await apiRequest('POST', '/api/purchase_orders', po);
      await this.refresh();
    }
  }

  async createGRN(data: any, user: User | null) {
    const grn = { ...data, id: `GRN-${Date.now()}`, status: 'Received' };
    await apiRequest('POST', '/api/receives', grn);
    
    for (const line of grn.lines) {
      await itemService.addStockMove({
        itemId: line.itemId,
        warehouseId: grn.warehouseId || 'WH01',
        refType: 'GRN',
        refNo: grn.receiveNo,
        inQty: Number(line.quantity),
        note: `Manual Receipt via GRN`
      });
    }
    await this.refresh();
    return grn;
  }

  async receivePO(poId: string, warehouseId: string, user: User | null) {
    const po = this.getPOById(poId);
    if (!po) throw new Error("PO Missing");
    await this.createGRN({
      receiveNo: `REC-${po.poNumber}`,
      vendorId: po.vendorId,
      warehouseId,
      date: new Date().toISOString(),
      total: po.total,
      lines: po.lines.map(l => ({ ...l, quantity: l.quantity, unitCost: l.rate }))
    }, user);
    await this.updatePOStatus(poId, 'Received', user);
  }

  async createBill(data: any, user: User | null) {
    const nb = { ...data, id: `BIL-${Date.now()}`, balanceDue: Number(data.total), status: 'Open' };
    await apiRequest('POST', '/api/bills', nb);
    if (data.poId) await this.updatePOStatus(data.poId, 'Billed', user);
    if (data.lines) {
      for (const line of data.lines) {
        await itemService.addStockMove({
          itemId: line.itemId,
          refType: 'PURCHASE',
          refNo: nb.billNumber,
          inQty: Number(line.quantity),
          note: `Auto-Inbound via Bill`
        });
      }
    }
    await this.refresh();
    return nb;
  }

  async createBillFromPO(poId: string, user: User | null) {
    const po = this.getPOById(poId);
    if (!po) throw new Error("PO Missing");
    await this.createBill({
      billNumber: `BIL-${po.poNumber}`,
      poId: po.id,
      vendorId: po.vendorId,
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      total: po.total,
      lines: po.lines
    }, user);
  }

  async recordPayment(data: any, user: User | null) {
    const pay = { ...data, id: `VPAY-${Date.now()}`, amount: Number(data.amount) };
    await apiRequest('POST', '/api/payments_made', pay);
    if (data.billId) {
      const bill = this.bills.find(b => b.id === data.billId);
      if (bill) {
        bill.balanceDue = Math.max(0, Number(bill.balanceDue) - Number(data.amount));
        bill.status = bill.balanceDue <= 0 ? 'Paid' : 'Partially Paid';
        await apiRequest('POST', '/api/bills', bill);
      }
    }
    await this.refresh();
    return pay;
  }
}

export const purchaseService = new PurchaseService();
