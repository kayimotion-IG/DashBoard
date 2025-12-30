
import { AppDocument, DocumentLink, User } from '../types';
import { auditService } from './audit.service';

class DocumentService {
  private docs: AppDocument[] = [];

  constructor() {
    this.loadData();
  }

  private loadData() {
    const stored = localStorage.getItem('klencare_documents');
    if (stored) {
      this.docs = JSON.parse(stored);
    } else {
      // Seed initial dummy data
      this.docs = [
        {
          id: 'DOC-001',
          name: 'Zylker Master Contract.pdf',
          type: 'application/pdf',
          size: 1024500,
          tags: ['Legal', 'Contract'],
          url: '#',
          createdAt: new Date().toISOString(),
          links: [{ entityType: 'CUSTOMER', entityId: 'CUST-001' }]
        }
      ];
      this.saveData();
    }
  }

  private saveData() {
    localStorage.setItem('klencare_documents', JSON.stringify(this.docs));
  }

  getDocuments() {
    return this.docs;
  }

  getDocumentsForEntity(type: string, id: string) {
    return this.docs.filter(d => d.links.some(l => l.entityType === type && l.entityId === id));
  }

  async uploadDocument(file: File, links: DocumentLink[], user: User) {
    // In a real app, this would be a FormData upload. Here we simulate.
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = (e) => {
        const newDoc: AppDocument = {
          id: `DOC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          name: file.name,
          type: file.type,
          size: file.size,
          tags: [],
          url: e.target?.result as string,
          createdAt: new Date().toISOString(),
          links: links
        };
        this.docs.unshift(newDoc);
        this.saveData();
        auditService.log(user, 'CREATE', 'DOCUMENT', newDoc.id, `Uploaded document: ${newDoc.name}`);
        resolve(newDoc);
      };
      reader.readAsDataURL(file);
    });
  }

  deleteDocument(id: string, user: User) {
    const doc = this.docs.find(d => d.id === id);
    this.docs = this.docs.filter(d => d.id !== id);
    this.saveData();
    if (doc) auditService.log(user, 'DELETE', 'DOCUMENT', id, `Deleted document: ${doc.name}`);
  }
}

export const documentService = new DocumentService();
