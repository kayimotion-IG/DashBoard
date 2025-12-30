
import { Vendor, PurchaseOrder, Bill, PaymentMade, GoodsReceive } from '../types';
import { itemService } from './item.service';
import { auditService } from './audit.service';

class PurchaseService {
  private vendors: Vendor[] = [];
  private purchaseOrders: PurchaseOrder[] = [];
  private bills: Bill[] = [];
  private paymentsMade: PaymentMade[] = [];
  private receives: GoodsReceive[] = [];

  constructor() {
    this.loadData();
  }

  private loadData() {
    const data = [
      { key: 'klencare_vendors', ref: 'vendors' },
      { key: 'klencare_pos', ref: 'purchaseOrders' },
      { key: 'klencare_bills', ref: 'bills' },
      { key: 'klencare_payments_made', ref: 'paymentsMade' },
      { key: 'klencare_receives', ref: 'receives' },
    ];

    data.forEach(d => {
      const stored = localStorage.getItem(d.key);
      if (stored) (this as any)[d.ref] = JSON.parse(stored);
    });

    if (this.vendors.length === 0) {
      this.seedData();
    }
  }

  private seedData() {
    this.vendors = [
      { id: 'VND-01', name: 'Primary Gulf Supplier', companyName: 'Middle East Logistics LLC', email: 'supply@me-logistics.ae', phone: '+971 6 555 1111', currency: 'AED', address: 'SAIF Zone, Sharjah, UAE', status: 'Active', createdAt: new Date().toISOString() }
    ];
    this.saveData();
  }

  private saveData() {
    localStorage.setItem('klencare_vendors', JSON.stringify(this.vendors));
    localStorage.setItem('klencare_pos', JSON.stringify(this.purchaseOrders));
    localStorage.setItem('klencare_bills', JSON.stringify(this.bills));
    localStorage.setItem('klencare_payments_made', JSON.stringify(this.paymentsMade));
    localStorage.setItem('klencare_receives', JSON.stringify(this.receives));
  }

  getVendors(filters: any = {}) {
    let filtered = [...this.vendors];
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(v => 
        v.name.toLowerCase().includes(s) || 
        v.companyName.toLowerCase().includes(s)
      );
    }
    return filtered;
  }
  
  getVendorById(id: string) { return this.vendors.find(v => v.id === id); }

  createVendor(data: any, user: any) {
    const newVnd: Vendor = {
      id: `VND-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      name: data.name.trim(),
      companyName: data.companyName || '',
      email: data.email || '',
      phone: data.phone || '',
      currency: data.currency || 'AED',
      address: data.address || '',
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    this.vendors.push(newVnd);
    this.saveData();
    if (user) auditService.log(user, 'CREATE', 'VENDOR', newVnd.id, `Created Vendor ${newVnd.name}`);
    return newVnd;
  }

  updateVendor(id: string, data: any, user: any) {
    const idx = this.vendors.findIndex(v => v.id === id);
    if (idx !== -1) {
      this.vendors[idx] = { ...this.vendors[idx], ...data };
      this.saveData();
    }
  }

  deleteVendor(id: string, user: any) {
    this.vendors = this.vendors.filter(v => v.id !== id);
    this.saveData();
  }

  getVendorBalance(vendorId: string) {
    return this.bills
      .filter(b => b.vendorId === vendorId && b.status !== 'Void')
      .reduce((s, b) => s + (Number(b.balanceDue) || 0), 0);
  }

  getPurchaseOrders() { return this.purchaseOrders; }
  getPOById(id: string) { return this.purchaseOrders.find(po => po.id === id); }
  
  updatePOStatus(id: string, status: string, user: any) {
    const idx = this.purchaseOrders.findIndex(po => po.id === id);
    if (idx !== -1) {
      this.purchaseOrders[idx].status = status as any;
      this.saveData();
      auditService.log(user, 'UPDATE', 'PURCHASE_ORDER', id, `Updated PO Status to ${status}`);
    }
  }

  receivePO(poId: string, warehouseId: string, user: any) {
    const po = this.getPOById(poId);
    if (!po) throw new Error("PO not found");
    return this.createGRN({
      vendorId: po.vendorId,
      warehouseId,
      total: po.total,
      lines: po.lines.map(l => ({
        itemId: l.itemId,
        quantity: l.quantity,
        unitCost: l.rate,
        total: l.total
      }))
    }, user);
  }

  createBillFromPO(poId: string, user: any) {
    const po = this.getPOById(poId);
    if (!po) throw new Error("PO not found");
    return this.createBill({
      poId: po.id,
      vendorId: po.vendorId,
      total: po.total,
      date: new Date().toISOString()
    }, user);
  }

  findOrCreateVendor(name: string, user: any): Vendor {
    const found = this.vendors.find(v => v.name.toLowerCase() === name.toLowerCase().trim());
    if (found) return found;
    return this.createVendor({ name: name.trim() }, user);
  }

  getBills() { return this.bills; }
  getBillById(id: string) { return this.bills.find(b => b.id === id); }
  getReceives() { return this.receives; }
  getPaymentsMade() { return this.paymentsMade; }

  createPO(data: any, user: any) {
    const newPO: PurchaseOrder = {
      ...data,
      id: `PO-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      poNumber: data.poNumber || `PO-${Date.now().toString().slice(-5)}`,
      status: 'Draft',
      date: data.date || new Date().toISOString()
    };
    this.purchaseOrders.push(newPO);
    this.saveData();
    return newPO;
  }

  createGRN(data: any, user: any) {
    const grn: GoodsReceive = {
      id: `GRN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      receiveNo: data.receiveNo || `GRN-${Date.now().toString().slice(-5)}`,
      vendorId: data.vendorId,
      warehouseId: data.warehouseId || 'WH01',
      date: data.date || new Date().toISOString(),
      total: data.total,
      status: 'Received',
      lines: data.lines
    };

    grn.lines.forEach((line: any) => {
      itemService.addStockMove({
        itemId: line.itemId,
        warehouseId: grn.warehouseId,
        refType: 'GRN',
        refNo: grn.receiveNo,
        inQty: line.quantity,
        outQty: 0,
        note: `Manual Receipt ${grn.receiveNo}`
      });
    });

    this.receives.push(grn);
    this.saveData();
    if (user) auditService.log(user, 'CREATE', 'GRN', grn.id, `Created GRN ${grn.receiveNo}`);
    return grn;
  }

  createBill(data: any, user: any) {
    const bill: Bill = {
      id: `BIL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      billNumber: data.billNumber || `BIL-${Date.now().toString().slice(-5)}`,
      poId: data.poId || '',
      vendorId: data.vendorId,
      date: data.date || new Date().toISOString(),
      dueDate: data.dueDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      total: Number(data.total),
      balanceDue: Number(data.total),
      status: 'Open'
    };
    this.bills.push(bill);
    this.saveData();
    if (user) auditService.log(user, 'CREATE', 'VENDOR_BILL', bill.id, `Recorded Bill ${bill.billNumber}`);
    return bill;
  }

  recordPayment(data: any, user: any) {
    const payment: PaymentMade = {
      id: `PAY-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      paymentNumber: data.paymentNumber || `PAY-${Date.now().toString().slice(-5)}`,
      vendorId: data.vendorId,
      billId: data.billId || '',
      date: data.date || new Date().toISOString(),
      amount: Number(data.amount),
      paymentMode: data.paymentMode || 'Bank',
      reference: data.reference || ''
    };

    // Allocate to bill if provided
    if (payment.billId) {
      const billIdx = this.bills.findIndex(b => b.id === payment.billId);
      if (billIdx !== -1) {
        const bill = this.bills[billIdx];
        bill.balanceDue = Math.max(0, bill.balanceDue - payment.amount);
        if (bill.balanceDue <= 0) bill.status = 'Paid';
        else bill.status = 'Partially Paid';
      }
    }

    this.paymentsMade.push(payment);
    this.saveData();
    if (user) auditService.log(user, 'CREATE', 'PAYMENT_MADE', payment.id, `Paid AED ${payment.amount} to vendor`);
    return payment;
  }
}

export const purchaseService = new PurchaseService();
