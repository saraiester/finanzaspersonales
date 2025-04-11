class SummaryCharts extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.month = new Date().toISOString().substring(0, 7);
    this.transactions = [];
    this.budgetData = null;
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
          margin-top: 20px;
          background: var(--card-color);
          color: var(--dark-color);
          border-radius: 12px;
          padding: 20px;
        }
        
        .charts-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .chart {
          background: var(--light-color);
          padding: 15px;
          border-radius: 8px;
          box-shadow: var(--shadow);
          position: relative;
          min-height: 300px;
        }
        
        .chart h3 {
          margin-top: 0;
          text-align: center;
          color: var(--dark-color);
        }
        
        canvas {
          width: 100%;
          height: 300px;
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

        .no-data {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: var(--gray-color);
          font-style: italic;
          text-align: center;
          width: 100%;
        }
      </style>
      <div class="card">
        <h2>Resumen Gráfico</h2>
        
        <div class="month-selector">
          <label>Mes:</label>
          <input type="month" id="chartsMonth" value="${this.month}">
        </div>
        
        <div class="charts-container">
          <div class="chart">
            <h3>Ingresos vs. Gastos</h3>
            <canvas id="incomeExpenseChart"></canvas>
            <div id="incomeExpenseNoData" class="no-data" style="display: none;">Sin información</div>
          </div>
          
          <div class="chart">
            <h3>Distribución de Gastos</h3>
            <canvas id="expensesChart"></canvas>
            <div id="expensesNoData" class="no-data" style="display: none;">Sin información</div>
          </div>
          
          <div class="chart">
            <h3>Presupuesto vs. Gastos Reales</h3>
            <canvas id="budgetComparisonChart"></canvas>
            <div id="budgetNoData" class="no-data" style="display: none;">Sin información</div>
          </div>
        </div>
      </div>
    `;
    
    this.shadowRoot.getElementById('chartsMonth').addEventListener('change', (e) => {
      this.month = e.target.value;
      this.loadData();
    });
  }

  async loadData() {
    await Promise.all([this.loadBudget(), this.loadTransactions()]);
    this.renderCharts();
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

  async renderCharts() {
    await this.loadChartJS();
    
    Chart.defaults.color = '#edf2f4';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
    
    const incomes = this.transactions.filter(t => t.type === 'income');
    const expenses = this.transactions.filter(t => t.type === 'expense');
    
    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    this.toggleNoDataMessage('incomeExpenseNoData', incomes.length + expenses.length === 0);
    this.toggleNoDataMessage('expensesNoData', expenses.length === 0);
    this.toggleNoDataMessage('budgetNoData', !this.budgetData || expenses.length === 0);
    
    if (incomes.length > 0 || expenses.length > 0) {
      this.renderIncomeExpenseChart(totalIncome, totalExpenses);
    }
    
    if (expenses.length > 0) {
      this.renderExpensesChart(expenses);
    }
    
    if (this.budgetData && expenses.length > 0) {
      this.renderBudgetComparisonChart(expenses);
    }
  }

  toggleNoDataMessage(elementId, show) {
    const element = this.shadowRoot.getElementById(elementId);
    if (element) {
      element.style.display = show ? 'block' : 'none';
    }
  }

  async loadChartJS() {
    if (typeof Chart === 'undefined') {
      await import('https://cdn.jsdelivr.net/npm/chart.js');
    }
  }

  renderIncomeExpenseChart(income, expenses) {
    const ctx = this.shadowRoot.getElementById('incomeExpenseChart').getContext('2d');
    
    if (this.incomeExpenseChart) {
      this.incomeExpenseChart.destroy();
    }
    
    this.incomeExpenseChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Ingresos', 'Gastos'],
        datasets: [{
          label: 'Monto',
          data: [income, expenses],
          backgroundColor: [
            'rgba(76, 201, 240, 0.7)',
            'rgba(247, 37, 133, 0.7)'
          ],
          borderColor: [
            'rgba(76, 201, 240, 1)',
            'rgba(247, 37, 133, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
            labels: {
              color: '#edf2f4'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `$${context.raw.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return `$${value}`;
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    });
  }

  renderExpensesChart(expenses) {
    const ctx = this.shadowRoot.getElementById('expensesChart').getContext('2d');
    
    const expensesByCategory = {};
    expenses.forEach(expense => {
      if (!expensesByCategory[expense.category]) {
        expensesByCategory[expense.category] = 0;
      }
      expensesByCategory[expense.category] += expense.amount;
    });
    
    const categories = Object.keys(expensesByCategory);
    const amounts = Object.values(expensesByCategory);
    
    const backgroundColors = categories.map((_, i) => {
      const hue = (i * 137.508) % 360;
      return `hsla(${hue}, 70%, 60%, 0.7)`;
    });
    
    if (this.expensesChart) {
      this.expensesChart.destroy();
    }
    
    this.expensesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: amounts,
          backgroundColor: backgroundColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
              }
            }
          },
          legend: {
            labels: {
              color: '#edf2f4'
            }
          }
        }
      }
    });
  }

  renderBudgetComparisonChart(expenses) {
    const ctx = this.shadowRoot.getElementById('budgetComparisonChart').getContext('2d');
    
    const realExpensesByCategory = {};
    expenses.forEach(expense => {
      if (!realExpensesByCategory[expense.category]) {
        realExpensesByCategory[expense.category] = 0;
      }
      realExpensesByCategory[expense.category] += expense.amount;
    });
    
    const categories = Object.keys(this.budgetData.categories);
    const budgetData = categories.map(cat => this.budgetData.categories[cat]);
    const realData = categories.map(cat => realExpensesByCategory[cat] || 0);
    
    if (this.budgetComparisonChart) {
      this.budgetComparisonChart.destroy();
    }
    
    this.budgetComparisonChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [
          {
            label: 'Presupuestado',
            data: budgetData,
            backgroundColor: 'rgba(58, 134, 255, 0.7)',
            borderColor: 'rgba(58, 134, 255, 1)',
            borderWidth: 1
          },
          {
            label: 'Gastos Reales',
            data: realData,
            backgroundColor: 'rgba(247, 37, 133, 0.7)',
            borderColor: 'rgba(247, 37, 133, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return `$${value}`;
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: $${context.raw.toFixed(2)}`;
              }
            }
          },
          legend: {
            labels: {
              color: '#edf2f4'
            }
          }
        }
      }
    });
  }
}

customElements.define('summary-charts', SummaryCharts);