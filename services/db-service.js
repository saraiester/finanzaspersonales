const DB_NAME = 'FinanzasPersonalesDB';
const DB_VERSION = 1;

let db;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('Error al abrir la base de datos:', event.target.error);
      reject(event.target.error);
    };
    
    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Crear object store para transacciones
      if (!db.objectStoreNames.contains('transactions')) {
        const transactionsStore = db.createObjectStore('transactions', { 
          keyPath: 'id',
          autoIncrement: true 
        });
        
        transactionsStore.createIndex('type', 'type', { unique: false });
        transactionsStore.createIndex('category', 'category', { unique: false });
        transactionsStore.createIndex('date', 'date', { unique: false });
      }
      
      // Crear object store para presupuestos
      if (!db.objectStoreNames.contains('budgets')) {
        const budgetsStore = db.createObjectStore('budgets', { 
          keyPath: 'id',
          autoIncrement: true 
        });
        
        budgetsStore.createIndex('month', 'month', { unique: true });
      }
    };
  });
};

export const getDB = () => {
  if (!db) {
    throw new Error('La base de datos no ha sido inicializada');
  }
  return db;
};