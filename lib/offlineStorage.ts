
import { openDB, IDBPDatabase } from 'https://esm.sh/idb@8.0.2';

const DB_NAME = 'aurilog_offline_db';
const DB_VERSION = 1;

export interface SyncItem {
  id: string;
  table: string;
  data: any;
  status: 'pending' | 'synced';
  action: 'insert' | 'update' | 'delete';
  timestamp: number;
}

export const initDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('trips')) db.createObjectStore('trips', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('expenses')) db.createObjectStore('expenses', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('vehicles')) db.createObjectStore('vehicles', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('maintenance')) db.createObjectStore('maintenance', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('jornada_logs')) db.createObjectStore('jornada_logs', { keyPath: 'id' });
      
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id' });
      }
    },
  });
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const offlineStorage = {
  async save(table: string, data: any, action: 'insert' | 'update' | 'delete' = 'insert') {
    const db = await initDB();
    const id = data.id || generateId();
    const finalData = { 
      ...data, 
      id, 
      sync_status: 'pending',
      created_at: data.created_at || new Date().toISOString()
    };

    if (action === 'delete') {
      await db.delete(table as any, id);
    } else {
      await db.put(table as any, finalData);
    }

    await db.put('sync_queue', {
      id,
      table,
      data: action === 'delete' ? { id } : finalData,
      status: 'pending',
      action,
      timestamp: Date.now()
    });

    return finalData;
  },

  async getAll(table: string) {
    const db = await initDB();
    return db.getAll(table as any);
  },

  async getPendingSync() {
    const db = await initDB();
    return db.getAll('sync_queue');
  },

  async markAsSynced(syncId: string) {
    const db = await initDB();
    await db.delete('sync_queue', syncId);
  },

  async clearTable(table: string) {
    const db = await initDB();
    await db.clear(table as any);
  },

  async bulkSave(table: string, items: any[]) {
    const db = await initDB();
    const tx = db.transaction(table as any, 'readwrite');
    for (const item of items) {
      await tx.store.put({ ...item, sync_status: 'synced' });
    }
    await tx.done;
  }
};
