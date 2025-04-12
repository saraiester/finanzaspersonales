class TransactionList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.transactions = [];
    this.filters = {
      type: 'all',
      category: 'all',
      month: new Date().toISOString().substring(0, 7)
    };
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    
    document.addEventListener('db-ready', () => {
      this.loadTransactions();
    });
    
    document.addEventListener('transaction-added', () => {
      this.loadTransactions();
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .filters {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 20px;
          align-items: center;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .summary {
          margin-bottom: 20px;
          padding: 15px;
          background-color: var(--light-color);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .summary-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          white-space: nowrap;
        }
        
        .summary-total {
          font-weight: bold;
          border-top: 1px solid var(--gray-color);
          padding-top: 5px;
        }
        
        .no-transactions {
          text-align: center;
          padding: 20px;
          color: var(--gray-color);
        }

        .table-container {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        th, td {
          padding: 12px 8px;
          text-align: left;
          border-bottom: 1px solid var(--gray-color);
          word-wrap: break-word;
          max-width: 150px;
        }

        th {
          background-color: var(--light-color);
          font-weight: 600;
          position: sticky;
          top: 0;
        }

        tr:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }

        .income {
          color: var(--income-color);
          font-weight: 600;
        }

        .expense {
          color: var(--expense-color);
          font-weight: 600;
        }

        .actions {
          display: flex;
          gap: 5px;
        }

        .action-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 5px;
          font-size: 16px;
          min-width: 30px;
        }

        .edit-btn {
          color: var(--income-color);
        }

        .delete-btn {
          color: var(--expense-color);
        }

        @media (max-width: 768px) {
          .filters {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .filter-group {
            width: 100%;
          }
          
          select, input {
            width: 100%;
          }
          
          table {
            font-size: 14px;
          }
          
          th, td {
            padding: 8px 4px;
            max-width: 100px;
          }
        }
      </style>
      <div class="card">
        <h2>Transacciones</h2>
        
        <div class="filters">
          <div class="filter-group">
            <label>Filtrar por:</label>
            <select id="filterType">
              <option value="all">Todos</option>
              <option value="income">Ingresos</option>
              <option value="expense">Gastos</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>Categoría:</label>
            <select id="filterCategory">
              <option value="all">Todas</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>Mes:</label>
            <input type="month" id="filterMonth" value="${this.filters.month}">
          </div>
          
          <button id="resetFilters">Resetear</button>
        </div>
        
        <div class="summary" id="summary">
          <!-- Resumen se actualizará dinámicamente -->
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width: 15%">Fecha</th>
                <th style="width: 10%">Tipo</th>
                <th style="width: 20%">Categoría</th>
                <th style="width: 30%">Descripción</th>
                <th style="width: 15%">Monto</th>
                <th style="width: 10%">Acciones</th>
              </tr>
            </thead>
            <tbody id="transactionsBody">
              <!-- Las transacciones se agregarán dinámicamente aquí -->
            </tbody>
          </table>
          
          <div id="noTransactions" class="no-transactions" style="display: none;">
            No hay transacciones para mostrar con los filtros actuales.
          </div>
        </div>
      </div>
    `;
  }

  // ... (resto de los métodos permanecen igual) ...
}

customElements.define('transaction-list', TransactionList);