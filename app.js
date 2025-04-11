// Importar componentes
import './components/app-header.js';
import './components/transaction-form.js';
import './components/budget-form.js';
import './components/transaction-list.js';
import './components/budget-comparison.js';
import './components/summary-charts.js';

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
  // Manejar el cambio de pestañas
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remover clase active de todos los botones y contenidos
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Agregar clase active al botón clickeado y su contenido correspondiente
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Inicializar la base de datos
  import('./services/db-service.js').then(({ initDB }) => {
    initDB().then(() => {
      console.log('Database initialized');
      // Disparar evento personalizado para notificar a los componentes que la DB está lista
      document.dispatchEvent(new CustomEvent('db-ready'));
    });
  });
});