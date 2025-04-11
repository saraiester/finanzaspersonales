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
        }
        
        .summary-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        
        .summary-total {
          font-weight: bold;
          border-top: 1px solid #ddd;
          padding-top: 5px;
        }
        
        .no-transactions {
          text-align: center;
          padding: 20px;
          color: var(--gray-color);
        }

        .action-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 5px;
          font-size: 16px;
        }

        .edit-btn {
          color: #28a745;
        }

        .delete-btn {
          color: #dc3545;
        }

        .edit-form {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--card-color);
          padding: 20px;
          border-radius: 8px;
          box-shadow: var(--shadow);
          z-index: 1000;
          width: 300px;
        }

        .edit-form h3 {
          margin-top: 0;
          color: var(--dark-color);
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          color: var(--dark-color);
        }

        .form-group input, .form-group select {
          width: 100%;
          padding: 8px;
          border: 1px solid var(--gray-color);
          border-radius: 4px;
          background: var(--light-color);
          color: var(--dark-color);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
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
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Acciones</th>
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

  setupEventListeners() {
    const filterType = this.shadowRoot.getElementById('filterType');
    const filterCategory = this.shadowRoot.getElementById('filterCategory');
    const filterMonth = this.shadowRoot.getElementById('filterMonth');
    const resetFilters = this.shadowRoot.getElementById('resetFilters');
    
    filterType.addEventListener('change', (e) => {
      this.filters.type = e.target.value;
      this.applyFilters();
    });
    
    filterCategory.addEventListener('change', (e) => {
      this.filters.category = e.target.value;
      this.applyFilters();
    });
    
    filterMonth.addEventListener('change', (e) => {
      this.filters.month = e.target.value;
      this.applyFilters();
    });
    
    resetFilters.addEventListener('click', () => {
      this.filters = {
        type: 'all',
        category: 'all',
        month: new Date().toISOString().substring(0, 7)
      };
      
      filterType.value = 'all';
      filterCategory.value = 'all';
      filterMonth.value = this.filters.month;
      
      this.applyFilters();
    });
  }

  async loadTransactions() {
    try {
      const { getAllTransactions } = await import('../services/transaction-service.js');
      this.transactions = await getAllTransactions();
      this.updateCategoryFilter();
      this.applyFilters();
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
    }
  }

  updateCategoryFilter() {
    const filterCategory = this.shadowRoot.getElementById('filterCategory');
    
    const categories = [...new Set(this.transactions.map(t => t.category))].sort();
    
    filterCategory.innerHTML = '<option value="all">Todas</option>';
    
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      filterCategory.appendChild(option);
    });
  }

  applyFilters() {
    let filtered = this.transactions.filter(transaction => {
      const transactionMonth = transaction.date.substring(0, 7);
      
      if (transactionMonth !== this.filters.month) return false;
      
      if (this.filters.type !== 'all' && transaction.type !== this.filters.type) return false;
      
      if (this.filters.category !== 'all' && transaction.category !== this.filters.category) return false;
      
      return true;
    });
    
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    this.renderTransactions(filtered);
    this.renderSummary(filtered);
  }

  renderTransactions(transactions) {
    const tbody = this.shadowRoot.getElementById('transactionsBody');
    const noTransactions = this.shadowRoot.getElementById('noTransactions');
    
    tbody.innerHTML = '';
    
    if (transactions.length === 0) {
      noTransactions.style.display = 'block';
      return;
    }
    
    noTransactions.style.display = 'none';
    
    transactions.forEach(transaction => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${new Date(transaction.date).toLocaleDateString()}</td>
        <td>${transaction.type === 'income' ? 'Ingreso' : 'Gasto'}</td>
        <td>${transaction.category}</td>
        <td>${transaction.description || '-'}</td>
        <td class="${transaction.type}">${transaction.type === 'income' ? '+' : '-'} $${transaction.amount.toFixed(2)}</td>
        <td class="actions">
          <button class="action-btn edit-btn" data-id="${transaction.id}" data-action="edit" title="Editar">✏️</button>
          <button class="action-btn delete-btn" data-id="${transaction.id}" data-action="delete" title="Eliminar">🗑️</button>
        </td>
      `;
      
      tbody.appendChild(row);
    });
    
    tbody.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        const id = parseInt(e.target.getAttribute('data-id'));
        
        if (action === 'edit') {
          this.showEditForm(id);
        } else if (action === 'delete') {
          this.deleteTransaction(id);
        }
      });
    });
  }

  renderSummary(transactions) {
    const summaryEl = this.shadowRoot.getElementById('summary');
    
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expenses;
    
    summaryEl.innerHTML = `
      <div class="summary-item">
        <span>Total Ingresos:</span>
        <span class="income">+ $${income.toFixed(2)}</span>
      </div>
      <div class="summary-item">
        <span>Total Gastos:</span>
        <span class="expense">- $${expenses.toFixed(2)}</span>
      </div>
      <div class="summary-item summary-total">
        <span>Balance:</span>
        <span class="${balance >= 0 ? 'income' : 'expense'}">${balance >= 0 ? '+' : '-'} $${Math.abs(balance).toFixed(2)}</span>
      </div>
    `;
  }

  async showEditForm(id) {
    try {
      const { getTransactionById } = await import('../services/transaction-service.js');
      const transaction = await getTransactionById(id);
      
      if (!transaction) {
        alert('No se encontró la transacción');
        return;
      }
      
      // Crear overlay
      const overlay = document.createElement('div');
      overlay.className = 'overlay';
      
      // Crear formulario de edición
      const form = document.createElement('div');
      form.className = 'edit-form';
      form.innerHTML = `
        <h3>Editar Transacción</h3>
        <div class="form-group">
          <label for="edit-amount">Monto</label>
          <input type="number" id="edit-amount" step="0.01" min="0" value="${transaction.amount}" required>
        </div>
        <div class="form-group">
          <label for="edit-description">Descripción</label>
          <input type="text" id="edit-description" value="${transaction.description || ''}">
        </div>
        <div class="form-actions">
          <button id="cancel-edit" class="secondary">Cancelar</button>
          <button id="save-edit">Guardar</button>
        </div>
      `;
      
      // Agregar al shadow DOM
      this.shadowRoot.appendChild(overlay);
      this.shadowRoot.appendChild(form);
      
      // Event listeners para los botones del formulario
      form.querySelector('#cancel-edit').addEventListener('click', () => {
        this.shadowRoot.removeChild(overlay);
        this.shadowRoot.removeChild(form);
      });
      
      form.querySelector('#save-edit').addEventListener('click', async () => {
        const amountInput = form.querySelector('#edit-amount');
        const descriptionInput = form.querySelector('#edit-description');
        
        if (!amountInput.value) {
          alert('El monto es requerido');
          return;
        }
        
        transaction.amount = parseFloat(amountInput.value);
        transaction.description = descriptionInput.value;
        
        try {
          const { updateTransaction } = await import('../services/transaction-service.js');
          await updateTransaction(transaction);
          
          this.shadowRoot.removeChild(overlay);
          this.shadowRoot.removeChild(form);
          
          this.loadTransactions();
          document.dispatchEvent(new CustomEvent('transaction-updated'));
        } catch (error) {
          console.error('Error al actualizar transacción:', error);
          alert('Ocurrió un error al actualizar la transacción');
        }
      });
    } catch (error) {
      console.error('Error al cargar transacción para editar:', error);
      alert('Ocurrió un error al cargar la transacción');
    }
  }

  async deleteTransaction(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta transacción?')) return;
    
    try {
      const { deleteTransaction } = await import('../services/transaction-service.js');
      await deleteTransaction(id);
      
      this.loadTransactions();
      document.dispatchEvent(new CustomEvent('transaction-updated'));
    } catch (error) {
      console.error('Error al eliminar transacción:', error);
      alert('Ocurrió un error al eliminar la transacción');
    }
  }
}

customElements.define('transaction-list', TransactionList);