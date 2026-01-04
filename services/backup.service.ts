
import { itemService } from './item.service';
import { salesService } from './sales.service';
import { purchaseService } from './purchase.service';

class BackupService {
  // 1. Physical DB Download (Backend required)
  downloadDbFile() {
    window.location.href = '/admin/backup/db';
  }

  // 2. Full Project Snapshot
  downloadFullBackup() {
    window.location.href = '/admin/backup/full';
  }

  // 3. Client-side JSON State (CRITICAL FOR DATA PRESERVATION)
  exportClientState() {
    const state: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('klencare_')) {
        try {
          state[key] = JSON.parse(localStorage.getItem(key) || 'null');
        } catch {
          state[key] = localStorage.getItem(key);
        }
      }
    }
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `klencare_DATA_SNAPSHOT_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link); // Ensure browser detection
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // 4. Module CSV Exports
  exportItems() { this.exportToCSV(itemService.getItems({}, 1, 9999).data, 'Items_Catalog'); }
  exportVendors() { this.exportToCSV(purchaseService.getVendors(), 'Vendors_Master'); }
  exportCustomers() { this.exportToCSV(salesService.getCustomers(), 'Customers_Master'); }
  exportStockMoves() { this.exportToCSV(itemService.getStockMoves(), 'Inventory_Ledger'); }
  exportInvoices() { this.exportToCSV(salesService.getInvoices(), 'Sales_Invoices_AR'); }
  exportBills() { this.exportToCSV(purchaseService.getBills(), 'Purchase_Bills_AP'); }

  private exportToCSV(data: any[], filename: string) {
    if (!data || data.length === 0) {
      alert("No data available to export in this module.");
      return;
    }
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(fieldName => {
          const val = row[fieldName];
          const escaped = ('' + (val ?? '')).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ];
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); // CRITICAL: Fix for Safari/Firefox
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const backupService = new BackupService();
