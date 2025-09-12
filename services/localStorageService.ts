// Local Storage Service for Investigation Persistence
// Maneja el almacenamiento local de investigaciones médicas

export interface PatientInfo {
  age: string;
  sex: string;
  symptoms: string;
}

export interface StoredInvestigation {
  id: string;
  investigation: any; // InvestigationState
  patientInfo: PatientInfo;
  createdAt: string;
  updatedAt: string;
}

export interface InvestigationHistory {
  investigations: StoredInvestigation[];
  lastUpdated: string;
}

export class LocalStorageService {
  private static readonly STORAGE_KEY = 'ophthalmology_investigations';
  private static readonly ACTIVE_INVESTIGATION_KEY = 'active_investigation';

  // Save investigation to localStorage
  static saveInvestigation(investigation: any, patientInfo: PatientInfo): string {
    const investigationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const storedInvestigation: StoredInvestigation = {
      id: investigationId,
      investigation,
      patientInfo,
      createdAt: now,
      updatedAt: now
    };

    // Get existing history
    const history = this.getInvestigationHistory();
    
    // Add new investigation
    history.investigations.push(storedInvestigation);
    history.lastUpdated = now;
    
    // Save to localStorage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    
    // Set as active investigation
    this.setActiveInvestigation(investigationId);
    
    return investigationId;
  }

  // Update existing investigation
  static updateInvestigation(investigationId: string, investigation: any): boolean {
    const history = this.getInvestigationHistory();
    const index = history.investigations.findIndex(inv => inv.id === investigationId);
    
    if (index === -1) return false;
    
    history.investigations[index].investigation = investigation;
    history.investigations[index].updatedAt = new Date().toISOString();
    history.lastUpdated = new Date().toISOString();
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    return true;
  }

  // Get investigation by ID
  static getInvestigation(investigationId: string): StoredInvestigation | null {
    const history = this.getInvestigationHistory();
    return history.investigations.find(inv => inv.id === investigationId) || null;
  }

  // Get all investigations
  static getInvestigationHistory(): InvestigationHistory {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return {
          investigations: [],
          lastUpdated: new Date().toISOString()
        };
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading investigation history:', error);
      return {
        investigations: [],
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // Delete investigation
  static deleteInvestigation(investigationId: string): boolean {
    const history = this.getInvestigationHistory();
    const index = history.investigations.findIndex(inv => inv.id === investigationId);
    
    if (index === -1) return false;
    
    history.investigations.splice(index, 1);
    history.lastUpdated = new Date().toISOString();
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    
    // If this was the active investigation, clear it
    const activeId = this.getActiveInvestigationId();
    if (activeId === investigationId) {
      this.clearActiveInvestigation();
    }
    
    return true;
  }

  // Set active investigation
  static setActiveInvestigation(investigationId: string): void {
    localStorage.setItem(this.ACTIVE_INVESTIGATION_KEY, investigationId);
  }

  // Get active investigation ID
  static getActiveInvestigationId(): string | null {
    return localStorage.getItem(this.ACTIVE_INVESTIGATION_KEY);
  }

  // Clear active investigation
  static clearActiveInvestigation(): void {
    localStorage.removeItem(this.ACTIVE_INVESTIGATION_KEY);
  }

  // Get active investigation
  static getActiveInvestigation(): StoredInvestigation | null {
    const activeId = this.getActiveInvestigationId();
    if (!activeId) return null;
    
    return this.getInvestigation(activeId);
  }

  // Export investigation as JSON
  static exportInvestigation(investigationId: string): string | null {
    const investigation = this.getInvestigation(investigationId);
    if (!investigation) return null;
    
    return JSON.stringify(investigation, null, 2);
  }

  // Clear all data
  static clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.ACTIVE_INVESTIGATION_KEY);
  }

  // Get storage usage info
  static getStorageInfo(): { used: number; available: number; investigations: number } {
    const history = this.getInvestigationHistory();
    const used = JSON.stringify(history).length;
    const available = 5 * 1024 * 1024; // 5MB typical localStorage limit
    const investigations = history.investigations.length;
    
    return { used, available, investigations };
  }
}
