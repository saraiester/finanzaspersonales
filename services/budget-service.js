import { getDB } from './db-service.js';

export const saveBudget = async (budgetData) => {
  const db = getDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction('budgets', 'readwrite');
    const store = tx.objectStore('budgets');
    const index = store.index('month');
    
    // Verificar si ya existe un presupuesto para este mes
    const request = index.get(budgetData.month);
    
    request.onsuccess = () => {
      const existingBudget = request.result;
      
      if (existingBudget) {
        // Actualizar el presupuesto existente
        existingBudget.categories = budgetData.categories;
        const updateRequest = store.put(existingBudget);
        
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = (event) => reject(event.target.error);
      } else {
        // Crear un nuevo presupuesto
        const newBudget = {
          month: budgetData.month,
          categories: budgetData.categories,
          createdAt: new Date().toISOString()
        };
        
        const addRequest = store.add(newBudget);
        
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = (event) => reject(event.target.error);
      }
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

export const getBudgetByMonth = async (month) => {
  const db = getDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction('budgets', 'readonly');
    const store = tx.objectStore('budgets');
    const index = store.index('month');
    
    const request = index.get(month);
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

export const getAllBudgets = async () => {
  const db = getDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction('budgets', 'readonly');
    const store = tx.objectStore('budgets');
    
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};