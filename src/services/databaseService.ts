import { ProductRecord } from '../types';
import { SAMPLE_PRODUCTS } from '../sampleData';

const MASTER_DB_STORAGE_KEY = 'estudio_master_product_database_v2';
const MASTER_DB_SYNC_EVENT = 'estudio_master_db_updated';

class DatabaseService {
  private products: ProductRecord[] = [];
  private listeners: Array<(products: ProductRecord[]) => void> = [];

  constructor() {
    this.products = this.loadFromStorage();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === MASTER_DB_STORAGE_KEY && e.newValue) {
          try {
            this.products = JSON.parse(e.newValue);
            this.notifyListeners();
          } catch {}
        }
      });
    }
  }

  private loadFromStorage(): ProductRecord[] {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(MASTER_DB_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load master database from storage', e);
    }
    return SAMPLE_PRODUCTS;
  }

  private persist() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(MASTER_DB_STORAGE_KEY, JSON.stringify(this.products));
        window.dispatchEvent(new CustomEvent(MASTER_DB_SYNC_EVENT, { detail: this.products }));

        // Sync with REST server if online
        fetch('/api/v2/catalog/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: this.products }),
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Failed to persist master database', e);
    }
    this.notifyListeners();
  }

  public getProducts(): ProductRecord[] {
    return [...this.products];
  }

  public setProducts(newProducts: ProductRecord[]) {
    this.products = newProducts;
    this.persist();
  }

  public subscribe(listener: (products: ProductRecord[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.getProducts());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    const current = this.getProducts();
    this.listeners.forEach((l) => {
      try {
        l(current);
      } catch (e) {
        console.error('Error notifying DB listener', e);
      }
    });
  }

  /**
   * Save or Update products in Master Database with chosen merge strategy
   */
  public saveToMasterDatabase(
    incomingProducts: ProductRecord[],
    mode: 'update_upsert' | 'overwrite' | 'append' = 'update_upsert'
  ): { totalCount: number; updatedCount: number; addedCount: number } {
    if (mode === 'overwrite') {
      this.products = incomingProducts;
      this.persist();
      return { totalCount: this.products.length, updatedCount: 0, addedCount: incomingProducts.length };
    }

    if (mode === 'append') {
      const existingIds = new Set(this.products.map((p) => p.id));
      const newItems = incomingProducts.map((p, idx) => ({
        ...p,
        id: p.id && !existingIds.has(p.id) ? p.id : `PROD_${Date.now()}_${idx}`,
      }));
      this.products = [...this.products, ...newItems];
      this.persist();
      return { totalCount: this.products.length, updatedCount: 0, addedCount: newItems.length };
    }

    // Default: Smart Upsert by PRODUCT_SCAN (EAN/Barcode) or PARTNO or ID
    let updatedCount = 0;
    let addedCount = 0;

    const dbMap = new Map<string, ProductRecord>();
    this.products.forEach((p) => {
      const key = (p.PRODUCT_SCAN || p.PARTNO || p.id || '').toString().trim().toLowerCase();
      if (key) dbMap.set(key, p);
    });

    const finalProducts: ProductRecord[] = [...this.products];

    incomingProducts.forEach((inc, idx) => {
      const key = (inc.PRODUCT_SCAN || inc.PARTNO || inc.id || '').toString().trim().toLowerCase();
      if (key && dbMap.has(key)) {
        // Merge existing record
        const existing = dbMap.get(key)!;
        const indexInFinal = finalProducts.findIndex((p) => p.id === existing.id);
        const merged: ProductRecord = {
          ...existing,
          ...inc,
          id: existing.id,
          // Preserve selling price if incoming is 0 or invalid
          SELLING_PRICE: inc.SELLING_PRICE > 0 ? inc.SELLING_PRICE : existing.SELLING_PRICE,
        };
        if (indexInFinal >= 0) {
          finalProducts[indexInFinal] = merged;
          updatedCount++;
        }
      } else {
        // New Record
        const newRecord: ProductRecord = {
          ...inc,
          id: inc.id || `PROD_${Date.now()}_${idx}`,
        };
        finalProducts.unshift(newRecord);
        addedCount++;
        if (key) dbMap.set(key, newRecord);
      }
    });

    this.products = finalProducts;
    this.persist();

    return { totalCount: this.products.length, updatedCount, addedCount };
  }

  public updateSingleProduct(updated: ProductRecord) {
    this.products = this.products.map((p) => (p.id === updated.id ? updated : p));
    this.persist();
  }

  public deleteSingleProduct(id: string) {
    this.products = this.products.filter((p) => p.id !== id);
    this.persist();
  }

  public resetToDefaultSample() {
    this.products = SAMPLE_PRODUCTS;
    this.persist();
  }

  public clearAll() {
    this.products = [];
    this.persist();
  }
}

export const databaseService = new DatabaseService();
