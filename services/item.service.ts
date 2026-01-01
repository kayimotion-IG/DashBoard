import { Item, StockMove, Warehouse, Assembly } from '../types';
import { auditService } from './audit.service';

class ItemService {
  private items: Item[] = [];
  private stockMoves: StockMove[] = [];
  private assemblies: Assembly[] = [];

  constructor() {
    this.loadData();
  }

  private loadData() {
    const items = localStorage.getItem('klencare_items');
    if (items) this.items = JSON.parse(items);

    const moves = localStorage.getItem('klencare_stock_moves');
    if (moves) this.stockMoves = JSON.parse(moves);

    const assemblies = localStorage.getItem('klencare_assemblies');
    if (assemblies) this.assemblies = JSON.parse(assemblies);

    if (this.items.length === 0) {
      this.seedData();
    }
  }

  private seedData() {
    this.items = [
      {
        id: 'ITM-001',
        name: 'Industrial Cleaner X1',
        sku: 'IC-X1-001',
        itemType: 'Goods',
        unit: 'pcs',
        category: 'Chemicals',
        taxCode: 'VAT 5%',
        taxPreference: 'Taxable',
        sellingPrice: 150,
        salesDescription: 'Heavy duty industrial cleaner',
        purchasePrice: 90,
        purchaseDescription: 'Raw industrial cleaner base',
        trackInventory: true,
        openingStock: 100,
        openingStockRate: 90,
        reorderLevel: 20,
        reorderQty: 50,
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ITM-002',
        name: 'Safety Gloves Pro',
        sku: 'SG-PRO-002',
        itemType: 'Goods',
        unit: 'box',
        category: 'Safety',
        taxCode: 'VAT 5%',
        taxPreference: 'Taxable',
        sellingPrice: 45,
        salesDescription: 'Nitrile safety gloves 100pk',
        purchasePrice: 25,
        purchaseDescription: 'Safety gloves wholesale',
        trackInventory: true,
        openingStock: 500,
        openingStockRate: 25,
        reorderLevel: 100,
        reorderQty: 200,
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    this.items.forEach(item => {
      if (item.trackInventory && item.openingStock > 0) {
        this.stockMoves.push({
          id: `MOVE-${Math.random().toString(36).substr(2, 9)}`,
          itemId: item.id,
          warehouseId: 'WH01',
          refType: 'OPENING',
          refNo: 'OPEN-STOCK',
          inQty: item.openingStock,
          outQty: 0,
          timestamp: new Date().toISOString()
        });
      }
    });

    this.saveData();
  }

  private saveData() {
    localStorage.setItem('klencare_items', JSON.stringify(this.items));
    localStorage.setItem('klencare_stock_moves', JSON.stringify(this.stockMoves));
    localStorage.setItem('klencare_assemblies', JSON.stringify(this.assemblies));
  }

  getItems(filters: any = {}, page: number = 1, pageSize: number = 10) {
    let filtered = [...this.items];
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter((i: any) => i.name.toLowerCase().includes(s) || i.sku.toLowerCase().includes(s));
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
    return this.items.find(i => i.id === id);
  }

  getItemBySku(sku: string) {
    return this.items.find(i => i.sku === sku);
  }

  createItem(data: any, user: any) {
    const newItem: Item = {
      ...data,
      id: `ITM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: data.status || 'Active'
    };
    this.items.push(newItem);
    
    if (newItem.trackInventory && newItem.openingStock > 0) {
      this.addStockMove({
        itemId: newItem.id,
        warehouseId: 'WH01',
        refType: 'OPENING',
        refNo: 'INITIAL',
        inQty: newItem.openingStock,
        outQty: 0,
        note: 'Initial opening stock'
      });
    }

    this.saveData();
    if (user) auditService.log(user, 'CREATE', 'ITEM', newItem.id, `Created item ${newItem.name}`);
    return newItem;
  }

  updateItem(id: string, data: any, user: any) {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.items[idx] = { ...this.items[idx], ...data, updatedAt: new Date().toISOString() };
      this.saveData();
      if (user) auditService.log(user, 'UPDATE', 'ITEM', id, `Updated item ${this.items[idx].name}`);
      return this.items[idx];
    }
    return null;
  }

  deleteItem(id: string, user: any) {
    const item = this.getItemById(id);
    this.items = this.items.filter(i => i.id !== id);
    this.saveData();
    if (item && user) auditService.log(user, 'DELETE', 'ITEM', id, `Deleted item ${item.name}`);
  }

  calculateStock(itemOrId: any, warehouseId?: string) {
    const itemId = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
    let moves = this.stockMoves.filter(m => m.itemId === itemId);
    if (warehouseId) {
      moves = moves.filter(m => m.warehouseId === warehouseId);
    }
    return moves.reduce((total: number, m: any) => total + (Number(m.inQty) - Number(m.outQty)), 0);
  }

  getStockByItem(itemId: string) {
    const moves = this.stockMoves.filter(m => m.itemId === itemId);
    const balance: Record<string, number> = {};
    this.getWarehouses().forEach(wh => {
      balance[wh.id] = this.calculateStock(itemId, wh.id);
    });
    return { moves, balance };
  }

  getAdjustments() {
    return this.stockMoves.filter(m => m.refType === 'ADJUSTMENT');
  }

  calculateInventoryValue() {
    return this.items.reduce((sum, item) => {
      const stock = this.calculateStock(item.id);
      return sum + (stock * (Number(item.purchasePrice) || 0));
    }, 0);
  }

  getStockMoves() {
    return this.stockMoves;
  }

  addStockMove(move: Partial<StockMove>) {
    const newMove: StockMove = {
      id: `MOVE-${Math.random().toString(36).substr(2, 9)}`,
      itemId: move.itemId!,
      warehouseId: move.warehouseId || 'WH01',
      refType: move.refType!,
      refNo: move.refNo!,
      inQty: Number(move.inQty) || 0,
      outQty: Number(move.outQty) || 0,
      timestamp: new Date().toISOString(),
      note: move.note
    };
    this.stockMoves.push(newMove);
    this.saveData();
    return newMove;
  }

  getAssemblies() {
    return this.assemblies;
  }

  createAssembly(data: any, user: any) {
    const newAssy: Assembly = {
      id: `ASSY-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      finishedItemId: data.finishedItemId,
      components: data.components,
      createdAt: new Date().toISOString()
    };
    this.assemblies.push(newAssy);
    this.saveData();
    if (user) auditService.log(user, 'CREATE', 'ASSEMBLY', newAssy.id, `Created assembly BOM for ${this.getItemById(data.finishedItemId)?.name}`);
    return newAssy;
  }

  buildAssembly(assyId: string, warehouseId: string, quantity: number, user: any) {
    const assy = this.assemblies.find(a => a.id === assyId);
    if (!assy) throw new Error("Assembly not found");

    const finishedItem = this.getItemById(assy.finishedItemId);
    if (!finishedItem) throw new Error("Finished item not found");

    if (!this.getSettings().allowNegativeStock) {
      assy.components.forEach(comp => {
        const available = this.calculateStock(comp.itemId, warehouseId);
        if (available < comp.quantity * quantity) {
          throw new Error(`Insufficient stock for component ${this.getItemById(comp.itemId)?.name}`);
        }
      });
    }

    const refNo = `BUILD-${Date.now().toString().slice(-6)}`;

    assy.components.forEach(comp => {
      this.addStockMove({
        itemId: comp.itemId,
        warehouseId,
        refType: 'ASSEMBLY_CONSUME',
        refNo,
        inQty: 0,
        outQty: comp.quantity * quantity,
        note: `Consumed for building ${finishedItem.name}`
      });
    });

    this.addStockMove({
      itemId: finishedItem.id,
      warehouseId,
      refType: 'ASSEMBLY_PRODUCE',
      refNo,
      inQty: quantity,
      outQty: 0,
      note: `Produced via assembly ${assy.id}`
    });

    if (user) auditService.log(user, 'BUILD', 'ASSEMBLY', assy.id, `Built ${quantity} units of ${finishedItem.name}`);
  }

  getSettings() { 
    const defaults = {
      companyName: "KLENCARE FZC",
      companyAddress: "9, Rolex Tower, Dubai, UAE",
      companyPhone: "050-315-7462",
      companyEmail: "support@klencare.net",
      currency: "AED",
      vatNumber: "",
      allowNegativeStock: false,
      pdfFooter: "Thank you for your business. KLENCARE FZC",
      logoUrl: "https://res.cloudinary.com/dkro3vzx5/image/upload/Gemini_Generated_Image_o6s2wbo6s2wbo6s2.png"
    };
    return JSON.parse(localStorage.getItem('klencare_settings') || JSON.stringify(defaults)); 
  }

  updateSettings(settings: any) {
    localStorage.setItem('klencare_settings', JSON.stringify(settings));
  }

  getLowStockItems(items?: Item[]) {
    const list = items || this.items;
    return list.filter(i => {
      if (!i.trackInventory) return false;
      const stock = this.calculateStock(i.id);
      return stock <= (Number(i.reorderLevel) || 0);
    });
  }

  getWarehouses(): Warehouse[] {
    return [{ id: 'WH01', name: 'Main Warehouse', location: 'Dubai' }];
  }

  findOrCreateWarehouse(name: string) {
    return this.getWarehouses()[0];
  }
}

export const itemService = new ItemService();