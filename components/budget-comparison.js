class BudgetComparison extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.month = new Date().toISOString().substring(0, 7);
    this.budgetData = null;
    this.transactions = [];
  }

  connectedCallback() {
    this.render();
    
    document.addEventListener('db-ready', () => {
      this.loadData();
    });
    
    document.addEventListener('transaction-updated', () => {
      this.loadTransactions();
    });
    
    document.addEventListener('budget-updated', () => {
      this.loadBudget();
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .card {
          margin-bottom: 20px;
          background: var(--card-color);
          color: var(--dark-color);
          border-radius: 12px;
          padding: 20px;
        }
        
        .month-selector {
          margin-bottom: 15px;
        }
        
        .month-selector label {
          color: var(--dark-color);
        }
        
        .month-selector input {
          background: var(--light-color);
          color: var(--dark-color);
          border: 1px solid var(--gray-color);
          border-radius: 6px;
        }
        
        .summary-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .summary-card {
          background: var(--light-color);
          padding: 15px;
          border-radius: 8px;
          box-shadow: var(--shadow);
        }
        
        .summary-card h3 {
          margin-top: 0;
          text-align: center;
          color: var(--dark-color);
        }
        
        .summary-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          color: var(--dark-color);
        }
        
        .total {
          font-weight: bold;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid var(--gray-color);
        }
        
        .positive {
          color: var(--income-color);
        }
        
        .negative {
          color: var(--expense-color);
        }
      </style>
      <div class="card">
        <h2>Resumen Presupuestario</h2>
        
        <div class="month-selector">
          <label>Mes:</label>
          <input type="month" id="comparisonMonth" value="${this.month}">
        </div>
        
        <div class="summary-container">
          <div class="summary-card">
            <h3>Totales</h3>
            <div id="totalsSummary">
              <p>No hay datos de presupuesto para el mes seleccionado.</p>
              <p>Por favor, ingrese un presupuesto primero.</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.shadowRoot.getElementById('comparisonMonth').addEventListener('change', (e) => {
      this.month = e.target.value;
      this.loadData();
    });
  }

  async loadData() {
    await Promise.all([this.loadBudget(), this.loadTransactions()]);
    this.renderSummary();
  }

  async loadBudget() {
    try {
      const { getBudgetByMonth } = await import('../services/budget-service.js');
      this.budgetData = await getBudgetByMonth(this.month);
    } catch (error) {
      console.error('Error al cargar el presupuesto:', error);
      this.budgetData = null;
    }
  }

  async loadTransactions() {
    try {
      const { getTransactionsByMonth } = await import('../services/transaction-service.js');
      this.transactions = await getTransactionsByMonth(this.month);
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
      this.transactions = [];
    }
  }

  renderSummary() {
    const totalsEl = this.shadowRoot.getElementById('totalsSummary');
    
    if (!this.budgetData || !this.budgetData.categories || Object.keys(this.budgetData.categories).length === 0) {
      totalsEl.innerHTML = `
        <p>No hay datos de presupuesto para el mes seleccionado.</p>
        <p>Por favor, ingrese un presupuesto primero.</p>
      `;
      return;
    }
    
    const realExpenses = {};
    this.transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        if (!realExpenses[t.category]) {
          realExpenses[t.category] = 0;
        }
        realExpenses[t.category] += t.amount;
      });
    
    const totalBudget = Object.values(this.budgetData.categories).reduce((sum, amount) => sum + amount, 0);
    const totalReal = Object.values(realExpenses).reduce((sum, amount) => sum + amount, 0);
    const totalDifference = totalBudget - totalReal;
    
    totalsEl.innerHTML = `
      <div class="summary-item">
        <span>Presupuesto Total:</span>
        <span>$${totalBudget.toFixed(2)}</span>
      </div>
      <div class="summary-item">
        <span>Gastos Totales:</span>
        <span>$${totalReal.toFixed(2)}</span>
      </div>
      <div class="summary-item ${totalDifference >= 0 ? 'positive' : 'negative'}">
        <span>Diferencia Total:</span>
        <span>${totalDifference >= 0 ? '+' : '-'}$${Math.abs(totalDifference).toFixed(2)}</span>
      </div>
    `;
  }
}

customElements.define('budget-comparison', BudgetComparison);