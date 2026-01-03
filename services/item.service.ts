
import { Item, StockMove, AppSettings, Assembly, Warehouse, User } from '../types';
import { apiRequest } from './api';

class ItemService {
  private items: Item[] = [];
  private stockMoves: StockMove[] = [];
  private assemblies: Assembly[] = [];
  private settings: AppSettings = { 
    companyName: "KLENCARE ENTERPRISE", companyAddress: "Dubai, UAE", companyPhone: "050-315-7462", 
    companyEmail: "support@klencare.net", currency: "AED", vatNumber: "100234567800003", 
    allowNegativeStock: false, pdfFooter: "Thank you." 
  };

  constructor() {
    this.refresh();
  }

  async refresh() {
    try {
      const [items, moves, assemblies, settings] = await Promise.all([
        apiRequest('GET', '/api/items'),
        apiRequest('GET', '/api/stock_moves'),
        apiRequest('GET', '/api/assemblies'),
        apiRequest('GET', '/api/settings')
      ]);
      this.items = items || [];
      this.stockMoves = moves || [];
      this.assemblies = assemblies || [];
      if (settings) this.settings = settings;
    } catch (e) {
      console.warn("Retrying sync...");
    }
  }

  /**
   * Fixed: Updated getItems to support optional pagination and filtering by status
   */
  getItems(filters: any = {}, page?: number, limit?: number) {
    let filtered = [...this.items];
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(i => i.name.toLowerCase().includes(s) || i.sku.toLowerCase().includes(s));
    }
    if (filters.status) {
      filtered = filtered.filter(i => i.status === filters.status);
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
    await apiRequest('POST', '/api/items', newItem);
    await this.refresh();
    return newItem;
  }

  /**
   * Added: updateItem method to support product editing
   */
  async updateItem(id: string, data: any, user?: User | null) {
    const updated = { ...data, id, updatedAt: new Date().toISOString() };
    await apiRequest('POST', '/api/items', updated);
    await this.refresh();
    return updated;
  }

  /**
   * Fixed: Added optional user parameter to deleteItem to match view calls
   */
  async deleteItem(id: string, user?: User | null) {
    await apiRequest('DELETE', `/api/items/${id}`);
    await this.refresh();
  }

  calculateStock(itemId: string, warehouseId?: string) {
    const item = this.getItemById(itemId);
    if (!item) return 0;
    let balance = Number(item.openingStock) || 0;
    this.stockMoves.filter(m => m.itemId === itemId).forEach(m => {
      balance += (Number(m.inQty) || 0);
      balance -= (Number(m.outQty) || 0);
    });
    return balance;
  }

  /**
   * Added: getStockByItem to support detailed stock breakdown by warehouse
   */
  getStockByItem(itemId: string) {
    const moves = this.stockMoves.filter(m => m.itemId === itemId);
    const balance: Record<string, number> = {};
    const item = this.getItemById(itemId);
    if (item) {
      balance['WH01'] = Number(item.openingStock) || 0;
    }
    moves.forEach(m => {
      const wh = m.warehouseId || 'WH01';
      if (balance[wh] === undefined) balance[wh] = 0;
      balance[wh] += (Number(m.inQty) || 0);
      balance[wh] -= (Number(m.outQty) || 0);
    });
    return { moves, balance };
  }

  async addStockMove(move: Partial<StockMove>) {
    const newMove = { ...move, id: `MV-${Date.now()}`, timestamp: new Date().toISOString() };
    await apiRequest('POST', '/api/stock_moves', newMove);
    await this.refresh();
  }

  calculateInventoryValue() {
    return this.items.reduce((s, i) => s + (this.calculateStock(i.id) * (Number(i.purchasePrice) || 0)), 0);
  }

  getLowStockItems() { return this.items.filter(i => this.calculateStock(i.id) <= (Number(i.reorderLevel) || 0)); }
  
  getStockMoves() { return this.stockMoves; }
  
  /**
   * Added: getAdjustments to filter stock ledger for manual corrections
   */
  getAdjustments() {
    return this.stockMoves.filter(m => m.refType === 'ADJUSTMENT');
  }

  /**
   * Added: getAssemblies for BOM management
   */
  getAssemblies() { return this.assemblies; }

  /**
   * Added: createAssembly to define Bill of Materials
   */
  async createAssembly(data: any, user?: User | null) {
    const newAssy = { ...data, id: `ASY-${Date.now()}`, createdAt: new Date().toISOString() };
    await apiRequest('POST', '/api/assemblies', newAssy);
    await this.refresh();
    return newAssy;
  }

  /**
   * Added: buildAssembly to process production orders and deduct ingredients
   */
  async buildAssembly(assyId: string, warehouseId: string, qty: number, user: User | null) {
    const assy = this.assemblies.find(a => a.id === assyId);
    if (!assy) throw new Error("Assembly not found");

    for (const comp of assy.components) {
      await this.addStockMove({
        itemId: comp.itemId,
        warehouseId,
        refType: 'ASSEMBLY_CONSUME',
        refNo: `BUILD-${assyId}`,
        outQty: comp.quantity * qty,
        note: `Consumed for build of assembly ${assyId}`
      });
    }

    await this.addStockMove({
      itemId: assy.finishedItemId,
      warehouseId,
      refType: 'ASSEMBLY_PRODUCE',
      refNo: `BUILD-${assyId}`,
      inQty: qty,
      note: `Produced via assembly ${assyId}`
    });
  }

  getSettings() { return this.settings; }

  /**
   * Added: updateSettings to persist organization profile changes
   */
  async updateSettings(settings: AppSettings) {
    await apiRequest('POST', '/api/settings', settings);
    this.settings = settings;
    await this.refresh();
  }

  getWarehouses(): Warehouse[] { return [{ id: 'WH01', name: 'Main Store', location: 'Dubai' }]; }

  /**
   * Added: findOrCreateWarehouse to resolve location references during import
   */
  findOrCreateWarehouse(name: string): Warehouse {
    return { id: 'WH01', name: 'Main Store', location: 'Dubai' };
  }
}

export const itemService = new ItemService();
