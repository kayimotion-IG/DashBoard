
import { Role, Permission } from '../types';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.Admin]: [
    'items.view', 'items.create', 'items.edit', 'items.delete', 'items.import', 'items.export',
    'inventory.view', 'inventory.manage',
    'sales.view', 'sales.create', 'sales.edit', 'sales.delete',
    'purchases.view', 'purchases.create',
    'crm.view', 'crm.manage',
    'reports.view',
    'documents.view', 'documents.manage',
    'admin.access'
  ],
  [Role.SalesManager]: [
    'items.view', 'items.export',
    'sales.view', 'sales.create', 'sales.edit',
    'crm.view', 'crm.manage',
    'reports.view'
  ],
  [Role.PurchaseManager]: [
    'items.view',
    'purchases.view', 'purchases.create',
    'reports.view'
  ],
  [Role.InventoryManager]: [
    'items.view', 'items.create', 'items.edit', 'items.import',
    'inventory.view', 'inventory.manage'
  ],
  [Role.Finance]: [
    'sales.view', 'purchases.view',
    'reports.view'
  ],
  [Role.Staff]: [
    'items.view',
    'inventory.view',
    'sales.view',
    'purchases.view',
    'crm.view',
    'reports.view',
    'documents.view'
  ]
};

export const hasPermission = (userRole: Role, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};
