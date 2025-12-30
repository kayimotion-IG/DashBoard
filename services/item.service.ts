
import { Item, StockMove, Warehouse, Assembly } from '../types';
import { auditService } from './audit.service';

// ItemService manages inventory data and business logic.
// In this scaffold, it uses localStorage for persistence to ensure a responsive, synchronous UI experience.
class ItemService {
  private items: Item[] = [];
  private stockMoves: StockMove[] = [];
  private warehouses: Warehouse[] = [];
  private assemblies: Assembly[] = [];

  constructor() {
    this.loadData();
  }

  // Load state from browser storage
  private loadData() {
    const storedItems = localStorage.getItem('klencare_items');
    if (storedItems) {
      this.items = JSON.parse(storedItems);
    } else {
      this.seedData();
    }

    const storedMoves = localStorage.getItem('klencare_stock_moves');
    if (storedMoves) {
      this.stockMoves = JSON.parse(storedMoves);
    }

    const storedWh = localStorage.getItem('klencare_warehouses');
    if (storedWh) {
      this.warehouses = JSON.parse(storedWh);
    } else {
      this.warehouses = [
        { id: 'WH01', name: 'Main Warehouse', location: 'Dubai' },
        { id: 'WH02', name: 'Secondary Hub', location: 'Abu Dhabi' }
      ];
      this.saveData();
    }

    const storedAssy = localStorage.getItem('klencare_assemblies');
    if (storedAssy) {
      this.assemblies = JSON.parse(storedAssy);
    }
  }

  // Initial seed data for empty installations
  private seedData() {
    this.items = [
      {
        id: 'ITM-001',
        name: 'Industrial Cleaner 5L',
        sku: 'IC-5L-001',
        itemType: 'Goods',
        unit: 'pcs',
        category: 'General',
        taxCode: 'VAT 5%',
        taxPreference: 'Taxable',
        sellingPrice: 120,
        salesDescription: 'Heavy duty cleaner',
        purchasePrice: 85,
        purchaseDescription: 'Standard purchase rate',
        trackInventory: true,
        openingStock: 100,
        openingStockRate: 85,
        reorderLevel: 20,
        reorderQty: 50,
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    this.saveData();
  }

  // Persist current state to storage
  private saveData() {
    localStorage.setItem('klencare_items', JSON.stringify(this.items));
    localStorage.setItem('klencare_stock_moves', JSON.stringify(this.stockMoves));
    localStorage.setItem('klencare_warehouses', JSON.stringify(this.warehouses));
    localStorage.setItem('klencare_assemblies', JSON.stringify(this.assemblies));
  }

  // Returns paginated and filtered items synchronously to prevent Promise-related UI errors.
  getItems(filters: any = {}, page: number = 1, pageSize: number = 10) {
    let filtered = [...this.items];
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(i => 
        i.name.toLowerCase().includes(s) || 
        i.sku.toLowerCase().includes(s)
      );
    }
    if (filters.category) filtered = filtered.filter(i => i.category === filters.category);
    if (filters.status) filtered = filtered.filter(i => i.status === filters.status);
    if (filters.type) filtered = filtered.filter(i => i.itemType === filters.type);

    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);
    return { data: paginated, total: filtered.length, page, pageSize };
  }

  // Finds a specific item by its unique ID.
  getItemById(id: string) {
    return this.items.find(i => i.id === id);
  }

  // Finds a specific item by its SKU code.
  getItemBySku(sku: string) {
    return this.items.find(i => i.sku === sku);
  }

  // Adds a new item to the catalog.
  createItem(data: any, user: any) {
    const newItem: Item = {
      ...data,
      id: `ITM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: data.status || 'Active'
    };
    this.items.push(newItem);
    this.saveData();
    if (user) auditService.log(user, 'CREATE', 'ITEM', newItem.id, `Created item ${newItem.name}`);
    return newItem;
  }

  // Updates an existing item's properties.
  updateItem(id: string, data: any, user: any) {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.items[idx] = { ...this.items[idx], ...data, updatedAt: new Date().toISOString() };
      this.saveData();
      if (user) auditService.log(user, 'UPDATE', 'ITEM', id, `Updated item ${this.items[idx].name}`);
    }
  }

  // Removes an item from the system.
  deleteItem(id: string, user: any) {
    const item = this.getItemById(id);
    this.items = this.items.filter(i => i.id !== id);
    this.saveData();
    if (user && item) auditService.log(user, 'DELETE', 'ITEM', id, `Deleted item ${item.name}`);
  }

  // Returns list of items where stock level is below reorder threshold.
  getLowStockItems() {
    return this.items.filter(i => i.trackInventory && this.calculateStock(i.id) <= i.reorderLevel);
  }

  // Calculates the current stock on hand for an item globally or in a specific warehouse.
  calculateStock(itemId: string, warehouseId?: string) {
    return this.stockMoves
      .filter(m => m.itemId === itemId && (!warehouseId || m.warehouseId === warehouseId))
      .reduce((acc, m) => acc + (Number(m.inQty) || 0) - (Number(m.outQty) || 0), 0);
  }

  // Provides comprehensive stock breakdown and move history for an item.
  getStockByItem(itemId: string) {
    const moves = this.stockMoves.filter(m => m.itemId === itemId);
    const balance: Record<string, number> = {};
    this.warehouses.forEach(wh => {
      balance[wh.id] = moves
        .filter(m => m.warehouseId === wh.id)
        .reduce((acc, m) => acc + (Number(m.inQty) || 0) - (Number(m.outQty) || 0), 0);
    });
    return { moves, balance };
  }

  // Logs a new stock movement (In/Out/Transfer).
  addStockMove(move: any) {
    const newMove: StockMove = {
      id: `MOV-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...move
    };
    this.stockMoves.push(newMove);
    this.saveData();
    return newMove;
  }

  // Returns raw stock move history.
  getStockMoves() {
    return this.stockMoves;
  }

  // Returns stock adjustments only.
  getAdjustments() {
    return this.stockMoves.filter(m => m.refType === 'ADJUSTMENT');
  }

  // Returns all registered warehouses.
  getWarehouses() {
    return this.warehouses;
  }

  // Utility to resolve warehouse by name or create one if missing.
  findOrCreateWarehouse(name: string) {
    const found = this.warehouses.find(w => w.name.toLowerCase() === name.toLowerCase());
    if (found) return found;
    const newWh: Warehouse = {
      id: `WH-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      name,
      location: 'Unknown'
    };
    this.warehouses.push(newWh);
    this.saveData();
    return newWh;
  }

  // Calculates total valuation of inventory based on current stock and purchase rates.
  calculateInventoryValue() {
    return this.items.reduce((total, item) => {
      return total + (this.calculateStock(item.id) * (Number(item.purchasePrice) || 0));
    }, 0);
  }

  // Returns bill of materials (BOM) catalog.
  getAssemblies() {
    return this.assemblies;
  }

  // Defines a new assembly mapping.
  createAssembly(data: any, user: any) {
    const newAssy: Assembly = {
      id: `ASY-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      ...data
    };
    this.assemblies.push(newAssy);
    this.saveData();
    if (user) auditService.log(user, 'CREATE', 'ASSEMBLY', newAssy.id, `Created assembly BOM`);
    return newAssy;
  }

  // Executes a production build, consuming ingredients and producing finished goods.
  buildAssembly(assyId: string, whId: string, qty: number, user: any) {
    const assy = this.assemblies.find(a => a.id === assyId);
    if (!assy) throw new Error("Assembly not found");
    
    // Consume components
    assy.components.forEach(comp => {
      this.addStockMove({
        itemId: comp.itemId,
        warehouseId: whId,
        refType: 'ASSEMBLY_CONSUME',
        refNo: assy.id,
        inQty: 0,
        outQty: comp.quantity * qty,
        note: `Production build for ${assy.id}`
      });
    });

    // Produce finished good
    this.addStockMove({
      itemId: assy.finishedItemId,
      warehouseId: whId,
      refType: 'ASSEMBLY_PRODUCE',
      refNo: assy.id,
      inQty: qty,
      outQty: 0,
      note: `Production output from ${assy.id}`
    });

    if (user) auditService.log(user, 'BUILD', 'ASSEMBLY', assyId, `Built ${qty} units of assembly`);
  }

  // Returns application settings.
  getSettings() { 
    return JSON.parse(localStorage.getItem('klencare_settings') || JSON.stringify({
      allowNegativeStock: false,
      companyName: 'KlenCare UAE',
      companyAddress: 'Dubai Silicon Oasis, UAE',
      companyPhone: '+971 4 000 0000',
      companyEmail: 'info@klencare.ae',
      vatNumber: '100022233300003',
      currency: 'AED',
      pdfFooter: 'Thank you for your business with KlenCare UAE.'
    })); 
  }

  // Updates global system configuration.
  updateSettings(settings: any) {
    localStorage.setItem('klencare_settings', JSON.stringify(settings));
  }
}

export const itemService = new ItemService();
