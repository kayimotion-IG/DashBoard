
import { AuditLogEntry, User } from '../types';

class AuditService {
  private logs: AuditLogEntry[] = [];

  constructor() {
    const saved = localStorage.getItem('klencare_audit_logs');
    if (saved) this.logs = JSON.parse(saved);
  }

  log(user: User, action: AuditLogEntry['action'], entityType: string, entityId: string, details: string) {
    const newEntry: AuditLogEntry = {
      id: `LOG-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      userName: user.name,
      entityType,
      entityId,
      action,
      timestamp: new Date().toISOString(),
      details
    };

    this.logs.unshift(newEntry);
    localStorage.setItem('klencare_audit_logs', JSON.stringify(this.logs.slice(0, 1000)));
    console.debug(`[Audit] ${user.name} performed ${action} on ${entityType}:${entityId}`);
  }

  getLogs() {
    return this.logs;
  }
}

export const auditService = new AuditService();
