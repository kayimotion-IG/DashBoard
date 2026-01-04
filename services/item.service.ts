
import { Item, StockMove, AppSettings, Assembly, Warehouse, User } from '../types';
import { apiRequest } from './api';
import { auditService } from './audit.service';

class ItemService {
  private items: Item[] = [];
  private stockMoves: StockMove[] = [];
  private assemblies: Assembly[] = [];
  private settings: AppSettings = { 
    companyName: "KlenCare FZC", 
    companyAddress: "9 Rolex Tower, Sheikh Zayed Road, Dubai, UAE", 
    companyPhone: "+971 50 315 7462", 
    companyEmail: "support@klencare.net", 
    currency: "AED", 
    vatNumber: "", 
    allowNegativeStock: false, 
    pdfFooter: "Thank you for your Purchase - KlenCare FZC",
    smtpHost: "smtp.resend.com",
    smtpPort: "465",
    smtpUser: "resend",
    emailApiKey: "",
    senderEmail: "billing@yourdomain.com"
  };

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.hydrate();
    this.refresh();
  }

  private hydrate() {
    try {
      const vItems = localStorage.getItem('klencare_db_items');
      const vMoves = localStorage.getItem('klencare_db_stock_moves');
      const vSets = localStorage.getItem('klencare_db_settings');
      
      if (vItems) this.items = JSON.parse(vItems);
      if (vMoves) this.stockMoves = JSON.parse(vMoves);
      if (vSets) this.settings = { ...this.settings, ...JSON.parse(vSets) };
    } catch (e) {
      console.warn("Vault hydration failed, starting fresh.");
    }
  }

  onChange(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  async refresh() {
    try {
      const [items, moves, assemblies, settings] = await Promise.all([
        apiRequest('GET', '/api/items'),
        apiRequest('GET', '/api/stock_moves'),
        apiRequest('GET', '/api/assemblies'),
        apiRequest('GET', '/api/settings')
      ]);
      
      if (items) {
        const itemMap = new Map(this.items.map(i => [i.id, i]));
        items.forEach((remoteItem: Item) => {
          itemMap.set(remoteItem.id, { ...itemMap.get(remoteItem.id), ...remoteItem });
        });
        this.items = Array.from(itemMap.values());
      }

      if (moves) this.stockMoves = moves;
      this.assemblies = assemblies || [];
      if (settings && settings.companyName) {
        this.settings = { ...this.settings, ...settings };
      }
      this.notify();
    } catch (e) {}
  }

  getItems(filters: any = {}, page?: number, limit?: number) {
    let filtered = [...this.items];
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(i => i.name.toLowerCase().includes(s) || i.sku.toLowerCase().includes(s));
    }
    const total = filtered.length;
    if (page && limit) {
      const start = (page - 1) * limit;
      filtered = filtered.slice(start, start + limit);
    }
    return { data: filtered, total };
  }

  getItemById(id: string) { return this.items.find(i => i.id === id); }
  getItemBySku(sku: string) { return this.items.find(i => i.sku.toLowerCase() === sku.toLowerCase()); }

  async createItem(data: any, user?: User | null) {
    const newItem = { ...data, id: `ITM-${Date.now()}`, createdAt: new Date().toISOString() };
    this.items.unshift(newItem); 
    await apiRequest('POST', '/api/items', newItem);
    this.notify();
    return newItem;
  }

  async updateItem(id: string, data: any, user?: User | null) {
    const updated = { ...data, id, updatedAt: new Date().toISOString() };
    const idx = this.items.findIndex(i => i.id === id);
    if (idx !== -1) this.items[idx] = updated;
    await apiRequest('POST', '/api/items', updated);
    this.notify();
    return updated;
  }

  async deleteItem(id: string, user?: User | null) {
    this.items = this.items.filter(i => i.id !== id);
    await apiRequest('DELETE', `/api/items/${id}`);
    this.notify();
  }

  calculateStock(itemId: string, warehouseId?: string) {
    const item = this.getItemById(itemId);
    if (!item) return 0;
    let balance = Number(item.openingStock) || 0;
    this.stockMoves.filter(m => m.itemId === itemId).forEach(m => {
      if (warehouseId && m.warehouseId && m.warehouseId !== warehouseId) return;
      balance += (Number(m.inQty) || 0);
      balance -= (Number(m.outQty) || 0);
    });
    return balance;
  }

  getStockByItem(itemId: string) {
    const moves = this.stockMoves.filter(m => m.itemId === itemId);
    const balance: Record<string, number> = {};
    const item = this.getItemById(itemId);
    const openingStock = Number(item?.openingStock) || 0;
    this.getWarehouses().forEach(wh => {
      balance[wh.id] = (wh.id === 'WH01') ? openingStock : 0;
    });
    moves.forEach(m => {
      const whId = m.warehouseId || 'WH01';
      balance[whId] = (balance[whId] || 0) + (Number(m.inQty) || 0) - (Number(m.outQty) || 0);
    });
    return { moves, balance };
  }

  calculateInventoryValue() {
    return this.items.reduce((s, i) => s + (this.calculateStock(i.id) * (Number(i.purchasePrice) || 0)), 0);
  }

  getLowStockItems() { return this.items.filter(i => this.calculateStock(i.id) <= (Number(i.reorderLevel) || 0)); }
  getStockMoves() { return this.stockMoves; }
  getAdjustments() { return this.stockMoves.filter(m => m.refType === 'ADJUSTMENT'); }
  getAssemblies() { return this.assemblies; }

  async createAssembly(data: any, user?: User | null) {
    const newAssembly = { ...data, id: `ASSY-${Date.now()}`, createdAt: new Date().toISOString() };
    this.assemblies.unshift(newAssembly);
    await apiRequest('POST', '/api/assemblies', newAssembly);
    this.notify();
    return newAssembly;
  }

  async buildAssembly(assyId: string, warehouseId: string, qty: number, user?: User | null) {
    const assy = this.assemblies.find(a => a.id === assyId);
    if (!assy) throw new Error("Assembly definition not found.");
    for (const comp of assy.components) {
      await this.addStockMove({
        itemId: comp.itemId, warehouseId, refType: 'ASSEMBLY_CONSUME', refNo: `BUILD-${assyId}`,
        outQty: comp.quantity * qty, inQty: 0, note: `Consumed for build of ${assy.finishedItemId}`
      });
    }
    await this.addStockMove({
      itemId: assy.finishedItemId, warehouseId, refType: 'ASSEMBLY_PRODUCE', refNo: `BUILD-${assyId}`,
      inQty: qty, outQty: 0, note: `Produced via assembly ${assyId}`
    });
    this.notify();
  }

  async addStockMove(move: Partial<StockMove>) {
    const newMove = { ...move, id: `MV-${Date.now()}`, timestamp: new Date().toISOString() };
    this.stockMoves.push(newMove as StockMove);
    await apiRequest('POST', '/api/stock_moves', newMove);
    this.notify();
  }

  getSettings() { return this.settings; }
  async updateSettings(settings: AppSettings) {
    this.settings = settings;
    await apiRequest('POST', '/api/settings', settings);
    this.notify();
  }

  getWarehouses(): Warehouse[] { return [{ id: 'WH01', name: 'Main Store', location: 'Dubai' }]; }
  findOrCreateWarehouse(name: string): Warehouse { return { id: 'WH01', name: 'Main Store', location: 'Dubai' }; }
}

export const itemService = new ItemService();
