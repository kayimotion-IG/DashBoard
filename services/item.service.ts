import { Item, StockMove, AppSettings, Assembly, Warehouse, User } from '../types';
import { auditService } from './audit.service';

class ItemService {
  private items: Item[] = [];
  private stockMoves: StockMove[] = [];
  private assemblies: Assembly[] = [];
  private warehouses: Warehouse[] = [{ id: 'WH01', name: 'Main Warehouse', location: 'Dubai' }];

  constructor() {
    this.loadData();
  }

  private loadData() {
    const itemsData = localStorage.getItem('klencare_items');
    if (itemsData) this.items = JSON.parse(itemsData);
    
    const movesData = localStorage.getItem('klencare_stock_moves');
    if (movesData) this.stockMoves = JSON.parse(movesData);

    const assyData = localStorage.getItem('klencare_assemblies');
    if (assyData) this.assemblies = JSON.parse(assyData);
    
    const whData = localStorage.getItem('klencare_warehouses');
    if (whData) this.warehouses = JSON.parse(whData);

    if (this.items.length === 0) {
      this.seedData();
    }
  }

  private seedData() {
    this.items = [
      { 
        id: 'ITM-001', 
        name: 'Sample Industrial Cleaner', 
        sku: 'SIC-001', 
        itemType: 'Goods', 
        unit: 'pcs', 
        category: 'Chemicals', 
        taxCode: 'VAT 5%', 
        taxPreference: 'Taxable', 
        sellingPrice: 150, 
        salesDescription: 'Premium industrial grade cleaner', 
        purchasePrice: 80, 
        purchaseDescription: 'Bulk cleaner supply', 
        trackInventory: true, 
        openingStock: 100, 
        openingStockRate: 80, 
        reorderLevel: 20, 
        reorderQty: 50, 
        status: 'Active', 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      }
    ];
    this.saveData();
  }

  private saveData() {
    localStorage.setItem('klencare_items', JSON.stringify(this.items));
    localStorage.setItem('klencare_stock_moves', JSON.stringify(this.stockMoves));
    localStorage.setItem('klencare_assemblies', JSON.stringify(this.assemblies));
    localStorage.setItem('klencare_warehouses', JSON.stringify(this.warehouses));
  }

  // To maintain compatibility with components that await the result
  getItems(filters: any = {}, page: number = 1, pageSize: number = 10) {
    let filtered = [...this.items];
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(i => i.name.toLowerCase().includes(s) || i.sku.toLowerCase().includes(s));
    }
    if (filters.status) {
      filtered = filtered.filter(i => i.status === filters.status);
    }
    const start = (page - 1) * pageSize;
    return { 
      data: filtered.slice(start, start + pageSize), 
      total: filtered.length, 
      page, 
      pageSize 
    };
  }

  getItemById(id: string) {
    return this.items.find(i => i.id.toString() === id.toString());
  }

  getItemBySku(sku: string) {
    return this.items.find(i => i.sku === sku);
  }

  createItem(data: any, user?: User | null) {
    const newItem: Item = {
      ...data,
      id: data.id || `ITM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: data.status || 'Active'
    };
    this.items.push(newItem);
    this.saveData();
    if (user) auditService.log(user, 'CREATE', 'ITEM', newItem.id, `Created item ${newItem.name}`);
    return newItem;
  }

  updateItem(id: string, data: any, user?: User | null) {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.items[idx] = { ...this.items[idx], ...data, updatedAt: new Date().toISOString() };
      this.saveData();
      if (user) auditService.log(user, 'UPDATE', 'ITEM', id, `Updated item ${this.items[idx].name}`);
      return this.items[idx];
    }
    return null;
  }

  deleteItem(id: string, user?: User | null) {
    const item = this.getItemById(id);
    this.items = this.items.filter(i => i.id !== id);
    this.saveData();
    if (item && user) auditService.log(user, 'DELETE', 'ITEM', id, `Deleted item ${item.name}`);
  }

  // Support both item object and ID, plus optional warehouse filter
  calculateStock(itemIdOrItem: any, warehouseId?: string) {
    const id = typeof itemIdOrItem === 'string' ? itemIdOrItem : itemIdOrItem.id;
    const item = typeof itemIdOrItem === 'string' ? this.getItemById(id) : itemIdOrItem;
    
    if (!item) return 0;
    
    let stock = Number(item.openingStock) || 0;
    
    const moves = this.stockMoves.filter(m => m.itemId === id && (!warehouseId || m.warehouseId === warehouseId));
    moves.forEach(m => {
      stock += (Number(m.inQty) || 0);
      stock -= (Number(m.outQty) || 0);
    });
    
    return stock;
  }

  getSettings(): AppSettings { 
    const defaults = {
      companyName: "KLENCARE FZC",
      companyAddress: "9, Rolex Tower, Dubai, UAE",
      companyPhone: "050-315-7462",
      companyEmail: "support@klencare.net",
      currency: "AED",
      vatNumber: "",
      allowNegativeStock: false,
      pdfFooter: "Thank you for your business.",
      logoUrl: "https://res.cloudinary.com/dkro3vzx5/image/upload/Gemini_Generated_Image_o6s2wbo6s2wbo6s2.png"
    };
    const stored = localStorage.getItem('klencare_settings');
    return stored ? JSON.parse(stored) : defaults;
  }

  updateSettings(settings: any) {
    localStorage.setItem('klencare_settings', JSON.stringify(settings));
  }

  getLowStockItems() {
    return this.items.filter(i => i.trackInventory && this.calculateStock(i.id) <= (i.reorderLevel || 0));
  }

  calculateInventoryValue() {
    return this.items.reduce((sum, i) => sum + (this.calculateStock(i.id) * (i.purchasePrice || 0)), 0);
  }

  getStockMoves() {
    return this.stockMoves;
  }

  // Added getAdjustments method for Adjustments view
  getAdjustments() {
    return this.stockMoves.filter(m => m.refType === 'ADJUSTMENT');
  }

  // Added addStockMove method for inventory tracking across services
  addStockMove(move: Partial<StockMove>) {
    const newMove: StockMove = {
      id: `MOVE-${Math.random().toString(36).substr(2, 9)}`,
      itemId: move.itemId!,
      warehouseId: move.warehouseId || 'WH01',
      refType: move.refType!,
      refNo: move.refNo!,
      inQty: move.inQty || 0,
      outQty: move.outQty || 0,
      timestamp: new Date().toISOString(),
      note: move.note
    };
    this.stockMoves.push(newMove);
    this.saveData();
    return newMove;
  }

  getWarehouses() {
    return this.warehouses;
  }

  // Added findOrCreateWarehouse method for GRN imports
  findOrCreateWarehouse(name: string) {
    let wh = this.warehouses.find(w => w.name === name);
    if (!wh) {
      wh = { id: `WH-${Math.random().toString(36).substr(2, 4).toUpperCase()}`, name, location: 'Unknown' };
      this.warehouses.push(wh);
      this.saveData();
    }
    return wh;
  }

  // Added getStockByItem method for ItemDetail view
  getStockByItem(id: string) {
    const moves = this.stockMoves.filter(m => m.itemId === id);
    const balance: Record<string, number> = {};
    
    const item = this.getItemById(id);
    if (item) {
      // Default initial balance to WH01 for scaffold
      balance['WH01'] = Number(item.openingStock) || 0;
    }

    moves.forEach(m => {
      if (!balance[m.warehouseId]) balance[m.warehouseId] = 0;
      balance[m.warehouseId] += (Number(m.inQty) || 0);
      balance[m.warehouseId] -= (Number(m.outQty) || 0);
    });

    return { moves, balance };
  }

  // Added assembly management methods for Assemblies view
  getAssemblies() {
    return this.assemblies;
  }

  createAssembly(data: any, user?: User | null) {
    const newAssy: Assembly = {
      id: `ASSY-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      ...data,
      createdAt: new Date().toISOString()
    };
    this.assemblies.push(newAssy);
    this.saveData();
    if (user) auditService.log(user, 'CREATE', 'ASSEMBLY', newAssy.id, `Defined BOM for ${data.finishedItemId}`);
    return newAssy;
  }

  buildAssembly(assyId: string, warehouseId: string, qty: number, user?: User | null) {
    const assy = this.assemblies.find(a => a.id === assyId);
    if (!assy) throw new Error("Assembly BOM not found");

    // 1. Consume components
    assy.components.forEach(comp => {
      this.addStockMove({
        itemId: comp.itemId,
        warehouseId,
        refType: 'ASSEMBLY_CONSUME',
        refNo: `BUILD-${assyId.slice(-4)}`,
        inQty: 0,
        outQty: comp.quantity * qty,
        note: `Consumed for building ${qty} units of assembly`
      });
    });

    // 2. Produce finished item
    this.addStockMove({
      itemId: assy.finishedItemId,
      warehouseId,
      refType: 'ASSEMBLY_PRODUCE',
      refNo: `BUILD-${assyId.slice(-4)}`,
      inQty: qty,
      outQty: 0,
      note: `Produced via assembly build`
    });

    if (user) auditService.log(user, 'BUILD', 'ASSEMBLY', assyId, `Built ${qty} units of assembly`);
  }
}

export const itemService = new ItemService();