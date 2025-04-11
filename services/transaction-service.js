import { getDB } from './db-service.js';

export const saveTransaction = async (transaction) => {
  const db = getDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    
    const request = store.add(transaction);
    
    request.onsuccess = () => {
      resolve(request.result); // Retorna el ID de la transacción
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

export const getTransactionById = async (id) => {
  const db = getDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readonly');
    const store = tx.objectStore('transactions');
    
    const request = store.get(id);
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

export const getAllTransactions = async () => {
  const db = getDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readonly');
    const store = tx.objectStore('transactions');
    
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

export const getTransactionsByMonth = async (month) => {
  const db = getDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readonly');
    const store = tx.objectStore('transactions');
    
    const request = store.getAll();
    
    request.onsuccess = () => {
      const transactions = request.result;
      const filtered = transactions.filter(t => t.date.startsWith(month));
      resolve(filtered);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

export const updateTransaction = async (transaction) => {
  const db = getDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    
    const request = store.put(transaction);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

export const deleteTransaction = async (id) => {
  const db = getDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};