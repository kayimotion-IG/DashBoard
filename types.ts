
export enum Role {
  Admin = 'Admin',
  SalesManager = 'SalesManager',
  PurchaseManager = 'PurchaseManager',
  InventoryManager = 'InventoryManager',
  Finance = 'Finance',
  Staff = 'Staff'
}

export type Permission = 
  | 'items.view' | 'items.create' | 'items.edit' | 'items.delete' | 'items.import' | 'items.export'
  | 'inventory.view' | 'inventory.manage'
  | 'sales.view' | 'sales.create' | 'sales.edit' | 'sales.delete' | 'sales.approve'
  | 'purchases.view' | 'purchases.create' | 'purchases.edit' | 'purchases.approve'
  | 'crm.view' | 'crm.manage'
  | 'reports.view'
  | 'documents.view' | 'documents.manage'
  | 'admin.access';

export type ItemType = 'Goods' | 'Service';
export type UOM = 'pcs' | 'kg' | 'm' | 'box' | 'set' | 'dz' | 'ft' | 'in' | 'lb';
export type TaxCode = 'VAT 5%' | 'Zero-rated' | 'Exempt' | 'Taxable' | 'Non-Taxable';

export interface Item {
  id: string;
  name: string;
  sku: string;
  itemType: ItemType;
  unit: UOM | string;
  brand?: string;
  category: string;
  taxCode: TaxCode | string;
  taxPreference: 'Taxable' | 'Non-Taxable';
  
  // Sales
  sellingPrice: number;
  salesDescription: string;
  salesAccount?: string;
  
  // Purchase
  purchasePrice: number;
  purchaseDescription: string;
  purchaseAccount?: string;
  preferredVendorId?: string;
  
  // Inventory
  trackInventory: boolean;
  inventoryAccount?: string;
  openingStock: number;
  openingStockRate: number;
  reorderLevel: number;
  reorderQty: number;
  
  // Physical
  hsnSac?: string;
  barcode?: string;
  weight?: number;
  weightUnit?: 'kg' | 'lb' | 'g' | 'oz';
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: 'cm' | 'in' | 'm' | 'mm';
  manufacturer?: string;
  
  status: 'Active' | 'Inactive';
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMove {
  id: string;
  itemId: string;
  warehouseId: string;
  refType: 'OPENING' | 'SALES' | 'PURCHASE' | 'ADJUSTMENT' | 'TRANSFER' | 'ASSEMBLY_CONSUME' | 'ASSEMBLY_PRODUCE' | 'DELIVERY' | 'SALES_RETURN' | 'GRN' | 'PURCHASE_RETURN';
  refNo: string;
  inQty: number;
  outQty: number;
  timestamp: string;
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  currency: string;
  trn?: string; 
  billingAddress: string;
  shippingAddress: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  mobile?: string;
  website?: string;
  currency: string;
  trn?: string;
  address: string; 
  billingAddress?: string;
  shippingAddress?: string;
  status: 'Active' | 'Inactive';
  notes?: string;
  createdAt: string;
}

export type SOStatus = 'Draft' | 'Confirmed' | 'Packed' | 'Shipped' | 'Invoiced' | 'Closed';
export type POStatus = 'Draft' | 'Issued' | 'Received' | 'Billed' | 'Cancelled';

export interface SalesOrderLine {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  rate: number;
  taxAmount: number;
  total: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  lpoNumber?: string;
  customerId: string;
  date: string;
  shipmentDate?: string;
  status: SOStatus;
  subTotal: number;
  taxTotal: number;
  total: number;
  lines: SalesOrderLine[];
  notes?: string;
}

export interface DeliveryChallanLine {
  itemId: string;
  quantity: number;
}

export interface DeliveryChallan {
  id: string;
  dcNumber: string;
  soId: string;
  customerId: string;
  date: string;
  status: 'Draft' | 'Delivered' | 'Returned';
  lines: DeliveryChallanLine[];
}

export interface PurchaseOrderLine {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  date: string;
  expectedDate?: string;
  status: POStatus;
  total: number;
  lines: PurchaseOrderLine[];
  notes?: string;
}

export interface GoodsReceiveLine {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface GoodsReceive {
  id: string;
  receiveNo: string;
  vendorId: string;
  warehouseId: string;
  date: string;
  total: number;
  status: 'Draft' | 'Received' | 'Cancelled';
  lines: GoodsReceiveLine[];
  notes?: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  poId?: string;
  vendorId: string;
  date: string;
  dueDate: string;
  total: number;
  balanceDue: number;
  status: 'Draft' | 'Open' | 'Partially Paid' | 'Paid' | 'Void';
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
}

export interface AssemblyComponent {
  itemId: string;
  quantity: number;
}

export interface Assembly {
  id: string;
  finishedItemId: string;
  components: AssemblyComponent[];
  createdAt: string;
}

export interface PaymentReceived {
  id: string;
  paymentNumber: string;
  customerId: string;
  invoiceId?: string;
  date: string;
  amount: number;
  paymentMode: string;
  reference?: string;
}

export interface PaymentMade {
  id: string;
  paymentNumber: string;
  vendorId: string;
  billId?: string;
  date: string;
  amount: number;
  paymentMode: string;
  reference?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  lpoNumber?: string;
  soId?: string;
  customerId: string;
  date: string;
  dueDate: string;
  total: number;
  balanceDue: number;
  status: 'Sent' | 'Partially Paid' | 'Paid' | 'Voided';
  lines?: SalesOrderLine[];
  includeStamp?: boolean; 
  notes?: string;
  isPinned?: boolean;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  customerId: string;
  date: string;
  amount: number;
  status: 'Open' | 'Closed' | 'Void';
  reason?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  vendorId?: string;
  reference: string;
  description: string;
  status: 'Paid' | 'Pending';
  taxAmount?: number;
}

export interface AppSettings {
  allowNegativeStock: boolean;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  vatNumber: string;
  currency: string;
  pdfFooter: string;
  logoUrl?: string;
  // NEW: Email Provider Settings
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  emailApiKey: string;
  senderEmail: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
}

/* Added missing AuditLogEntry interface to resolve errors in audit service */
export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PRINT' | 'EMAIL' | 'OTHER';
  timestamp: string;
  details: string;
}

/* Added missing DocumentLink interface to resolve errors in document service */
export interface DocumentLink {
  entityType: string;
  entityId: string;
}

/* Added missing AppDocument interface to resolve errors in document service and views */
export interface AppDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  tags: string[];
  url: string;
  createdAt: string;
  links: DocumentLink[];
}
