
import { itemService } from './item.service';
import { salesService } from './sales.service';

class ReportService {
  getSalesByCustomer() {
    const customers = salesService.getCustomers();
    const invoices = (salesService as any).invoices || [];
    
    return customers.map(c => {
      const custInvoices = invoices.filter((i: any) => i.customerId === c.id);
      return {
        customer: c.name,
        company: c.companyName,
        invoiceCount: custInvoices.length,
        totalRevenue: custInvoices.reduce((sum: number, i: any) => sum + i.total, 0),
        balance: salesService.getCustomerBalance(c.id)
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  getSalesByItem() {
    const items = itemService.getItems({}, 1, 999).data;
    const sos = salesService.getSalesOrders();
    
    return items.map(item => {
      let qtySold = 0;
      let revenue = 0;
      
      sos.forEach(so => {
        so.lines.forEach(line => {
          if (line.itemId === item.id) {
            qtySold += line.quantity;
            revenue += line.total;
          }
        });
      });

      return {
        name: item.name,
        sku: item.sku,
        qtySold,
        revenue,
        avgPrice: qtySold > 0 ? revenue / qtySold : 0
      };
    }).filter(i => i.qtySold > 0).sort((a, b) => b.revenue - a.revenue);
  }

  getStockValuation() {
    const items = itemService.getItems({}, 1, 999).data;
    return items.map(item => {
      const stock = itemService.calculateStock(item.id);
      return {
        name: item.name,
        sku: item.sku,
        onHand: stock,
        /* Fix: use item.purchasePrice instead of item.costPrice */
        unitCost: item.purchasePrice,
        valuation: stock * item.purchasePrice
      };
    }).sort((a, b) => b.valuation - a.valuation);
  }

  getARAging() {
    const invoices = (salesService as any).invoices || [];
    const now = new Date();
    
    return invoices.filter((i: any) => i.balanceDue > 0).map((i: any) => {
      const dueDate = new Date(i.dueDate);
      const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
      const customer = salesService.getCustomerById(i.customerId);

      return {
        invoiceNumber: i.invoiceNumber,
        customer: customer?.name || 'Unknown',
        amount: i.balanceDue,
        daysOverdue: diffDays > 0 ? diffDays : 0,
        status: diffDays > 0 ? 'Overdue' : 'Due Soon'
      };
    }).sort((a, b) => b.daysOverdue - a.daysOverdue);
  }

  exportToCSV(data: any[], filename: string) {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => 
      Object.values(obj).map(val => `"${val}"`).join(',')
    ).join('\n');
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const reportService = new ReportService();