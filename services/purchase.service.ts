
import { Vendor, PurchaseOrder, Bill, PaymentMade, GoodsReceive } from '../types';
import { auditService } from './audit.service';
import { itemService } from './item.service';

class PurchaseService {
  private vendors: Vendor[] = [];
  private pos: PurchaseOrder[] = [];
  private bills: Bill[] = [];
  private payments: PaymentMade[] = [];
  private receives: GoodsReceive[] = [];

  constructor() {
    this.loadData();
  }

  private loadData() {
    const vendors = localStorage.getItem('klencare_vendors');
    if (vendors) this.vendors = JSON.parse(vendors);

    const pos = localStorage.getItem('klencare_pos');
    if (pos) this.pos = JSON.parse(pos);

    const bills = localStorage.getItem('klencare_bills');
    if (bills) this.bills = JSON.parse(bills);

    const payments = localStorage.getItem('klencare_payments_made');
    if (payments) this.payments = JSON.parse(payments);

    const receives = localStorage.getItem('klencare_receives');
    if (receives) this.receives = JSON.parse(receives);

    if (this.vendors.length === 0) {
      this.seedData();
    }
  }

  private seedData() {
    this.vendors = [
      { 
        id: 'VND-01', 
        name: 'Elite Supplies', 
        companyName: 'Elite General Trading LLC', 
        email: 'orders@elite.ae', 
        phone: '+971 4 111 2222', 
        mobile: '+971 50 999 8888',
        website: 'https://elite-supplies.ae',
        currency: 'AED', 
        trn: '100012345600003',
        address: 'Warehouse 12, Jebel Ali Freezone, Dubai', 
        billingAddress: 'Warehouse 12, Jebel Ali Freezone, Dubai',
        shippingAddress: 'Warehouse 12, Jebel Ali Freezone, Dubai',
        status: 'Active', 
        createdAt: new Date().toISOString() 
      }
    ];

    // Seed a sample bill
    this.bills = [
      {
        id: 'BIL-SEED-01',
        billNumber: 'BIL-2024-001',
        vendorId: 'VND-01',
        date: new Date().toISOString(),
        dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
        total: 1250.00,
        balanceDue: 1250.00,
        status: 'Open'
      }
    ];

    this.saveData();
  }

  private saveData() {
    localStorage.setItem('klencare_vendors', JSON.stringify(this.vendors));
    localStorage.setItem('klencare_pos', JSON.stringify(this.pos));
    localStorage.setItem('klencare_bills', JSON.stringify(this.bills));
    localStorage.setItem('klencare_payments_made', JSON.stringify(this.payments));
    localStorage.setItem('klencare_receives', JSON.stringify(this.receives));
  }

  getVendors(filters: any = {}) {
    let filtered = [...this.vendors];
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(v => v.name.toLowerCase().includes(s) || v.companyName.toLowerCase().includes(s) || (v.trn && v.trn.includes(s)));
    }
    return filtered;
  }

  getVendorById(id: string) {
    return this.vendors.find(v => v.id === id);
  }

  findOrCreateVendor(name: string, user: any) {
    let vendor = this.vendors.find(v => v.name === name);
    if (!vendor) {
      vendor = this.createVendor({ name, companyName: name, email: '', phone: '', currency: 'AED', address: '', status: 'Active' }, user);
    }
    return vendor;
  }

  createVendor(data: any, user: any) {
    const newV: Vendor = {
      ...data,
      id: `VND-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      createdAt: new Date().toISOString()
    };
    this.vendors.push(newV);
    this.saveData();
    if (user) auditService.log(user, 'CREATE', 'VENDOR', newV.id, `Created vendor ${newV.name}`);
    return newV;
  }

  updateVendor(id: string, data: any, user: any) {
    const idx = this.vendors.findIndex(v => v.id === id);
    if (idx !== -1) {
      this.vendors[idx] = { ...this.vendors[idx], ...data };
      this.saveData();
      if (user) auditService.log(user, 'UPDATE', 'VENDOR', id, `Updated vendor ${this.vendors[idx].name}`);
      return this.vendors[idx];
    }
    return null;
  }

  deleteVendor(id: string, user: any) {
    const v = this.getVendorById(id);
    this.vendors = this.vendors.filter(v => v.id !== id);
    this.saveData();
    if (v && user) auditService.log(user, 'DELETE', 'VENDOR', id, `Deleted vendor ${v.name}`);
  }

  getVendorBalance(vendorId: string) {
    return this.bills
      .filter(b => b.vendorId === vendorId && b.status !== 'Void')
      .reduce((sum, b) => sum + (Number(b.balanceDue) || 0), 0);
  }

  getPurchaseOrders() { return this.pos; }
  getPOById(id: string) { return this.pos.find(po => po.id === id); }

  createPO(data: any, user: any) {
    const newPO: PurchaseOrder = {
      ...data,
      id: `PO-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      poNumber: data.poNumber || `PO-${Date.now().toString().slice(-5)}`,
      status: 'Draft',
      date: data.date || new Date().toISOString()
    };
    this.pos.push(newPO);
    this.saveData();
    return newPO;
  }

  updatePOStatus(id: string, status: string, user: any) {
    const idx = this.pos.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.pos[idx].status = status as any;
      this.saveData();
      if (user) auditService.log(user, 'UPDATE', 'PURCHASE_ORDER', id, `Updated PO status to ${status}`);
    }
  }

  getReceives() { return this.receives; }

  createGRN(data: any, user: any) {
    const grn: GoodsReceive = {
      ...data,
      id: `GRN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      receiveNo: data.receiveNo || `GRN-${Date.now().toString().slice(-5)}`,
      status: 'Received',
      date: data.date || new Date().toISOString()
    };

    grn.lines.forEach((line: any) => {
      itemService.addStockMove({
        itemId: line.itemId,
        warehouseId: data.warehouseId || 'WH01',
        refType: 'GRN',
        refNo: grn.receiveNo,
        inQty: Number(line.quantity),
        outQty: 0,
        note: `Goods Receipt: ${grn.receiveNo}`
      });
    });

    this.receives.push(grn);
    this.saveData();
    if (user) auditService.log(user, 'RECEIVE', 'GOODS_RECEIVE', grn.id, `Posted GRN ${grn.receiveNo}`);
    return grn;
  }

  receivePO(poId: string, warehouseId: string, user: any) {
    const po = this.getPOById(poId);
    if (!po) throw new Error("PO not found");
    
    const grn = this.createGRN({
      vendorId: po.vendorId,
      warehouseId,
      total: po.total,
      lines: po.lines.map(l => ({ ...l, unitCost: l.rate })),
      notes: `Received from ${po.poNumber}`
    }, user);
    
    this.updatePOStatus(poId, 'Received', user);
    return grn;
  }

  getBills() { return this.bills; }

  createBill(data: any, user: any) {
    const bill: Bill = {
      ...data,
      id: `BIL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      billNumber: data.billNumber || `BIL-${Date.now().toString().slice(-5)}`,
      status: 'Open',
      balanceDue: Number(data.total)
    };
    this.bills.push(bill);
    this.saveData();
    if (user) auditService.log(user, 'CREATE', 'BILL', bill.id, `Created Bill ${bill.billNumber}`);
    return bill;
  }

  createBillFromPO(poId: string, user: any) {
    const po = this.getPOById(poId);
    if (!po) throw new Error("PO not found");
    return this.createBill({
      poId: po.id,
      vendorId: po.vendorId,
      total: po.total,
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString()
    }, user);
  }

  getPaymentsMade() { return this.payments; }

  recordPayment(data: any, user: any) {
    const payment: PaymentMade = {
      ...data,
      id: `PMT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      paymentNumber: data.paymentNumber || `PMT-${Date.now().toString().slice(-5)}`,
      date: data.date || new Date().toISOString()
    };

    if (payment.billId) {
      const idx = this.bills.findIndex(b => b.id === payment.billId);
      if (idx !== -1) {
        this.bills[idx].balanceDue = Math.max(0, this.bills[idx].balanceDue - Number(payment.amount));
        if (this.bills[idx].balanceDue <= 0) this.bills[idx].status = 'Paid';
        else this.bills[idx].status = 'Partially Paid';
      }
    }

    this.payments.push(payment);
    this.saveData();
    if (user) auditService.log(user, 'CREATE', 'PAYMENT_MADE', payment.id, `Recorded payment ${payment.paymentNumber} of AED ${payment.amount}`);
    return payment;
  }
}

export const purchaseService = new PurchaseService();
