const CATEGORIES = {
    expense: ['Alimentación', 'Transporte', 'Vivienda', 'Salud', 'Educación', 'Ropa', 'Otros gastos'] // Sin 'Ocio'
  };
  
  class BudgetForm extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.budget = {
        month: new Date().toISOString().substring(0, 7),
        categories: {}
      };
      this.categories = [...CATEGORIES.expense];
    }
  
    connectedCallback() {
      this.render();
      this.setupEventListeners();
      
      document.addEventListener('db-ready', () => {
        this.loadBudgetData();
      });
    }
  
    render() {
      this.shadowRoot.innerHTML = `
        <style>
          form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          
          .form-row {
            display: flex;
            gap: 15px;
            align-items: center;
          }
          
          .month-selector {
            margin-bottom: 20px;
          }
          
          .category-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }
          
          .category-item {
            display: grid;
            grid-template-columns: 1fr 1fr auto;
            gap: 10px;
            align-items: center;
            padding: 10px;
            background: #34384b;;
            border-radius: 5px;
          }
          
          @media (max-width: 768px) {
            .category-item {
              grid-template-columns: 1fr;
            }
          }
          
          .form-group {
            margin-bottom: 0;
          }
          
          input, button {
            padding: 8px 12px;
          }
        </style>
        <div class="card">
          <h2>Presupuesto Mensual</h2>
          <form id="budgetForm">
            <div class="form-row month-selector">
              <div class="form-group">
                <label for="month">Mes y Año</label>
                <input type="month" id="month" name="month" required>
              </div>
            </div>
            
            <div class="category-list" id="categoryList">
              <!-- Las categorías se agregarán dinámicamente aquí -->
            </div>
            
            <div class="form-row">
              <button type="submit">Guardar Presupuesto</button>
            </div>
          </form>
        </div>
      `;
      
      this.shadowRoot.getElementById('month').value = this.budget.month;
      this.renderCategories();
    }
  
    setupEventListeners() {
      const form = this.shadowRoot.getElementById('budgetForm');
      const monthInput = this.shadowRoot.getElementById('month');
      
      monthInput.addEventListener('change', (e) => {
        this.budget.month = e.target.value;
        this.loadBudgetData();
      });
      
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleSubmit();
      });
    }
  
    renderCategories() {
      const categoryList = this.shadowRoot.getElementById('categoryList');
      categoryList.innerHTML = '';
      
      this.categories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        
        categoryItem.innerHTML = `
          <div class="form-group">
            <label>Categoría</label>
            <input type="text" value="${category}" readonly>
          </div>
          
          <div class="form-group">
            <label>Monto Presupuestado</label>
            <input type="number" 
                   class="budget-amount" 
                   data-category="${category}" 
                   step="0.01" 
                   min="0" 
                   value="${this.budget.categories[category] || ''}"
                   placeholder="0.00">
          </div>
        `;
        
        categoryList.appendChild(categoryItem);
      });
      
      this.shadowRoot.querySelectorAll('.budget-amount').forEach(input => {
        input.addEventListener('change', (e) => {
          const category = e.target.getAttribute('data-category');
          const value = parseFloat(e.target.value) || 0;
          this.budget.categories[category] = value;
        });
      });
    }
  
    async loadBudgetData() {
      try {
        const { getBudgetByMonth } = await import('../services/budget-service.js');
        const budgetData = await getBudgetByMonth(this.budget.month);
        
        if (budgetData) {
          this.budget = budgetData;
        } else {
          this.budget = {
            month: this.budget.month,
            categories: Object.fromEntries(this.categories.map(cat => [cat, 0]))
          };
        }
        
        this.renderCategories();
      } catch (error) {
        console.error('Error al cargar el presupuesto:', error);
        alert('Error al cargar el presupuesto');
      }
    }
  
    async handleSubmit() {
      try {
        this.categories.forEach(category => {
          if (typeof this.budget.categories[category] === 'undefined') {
            this.budget.categories[category] = 0;
          }
        });
        
        const { saveBudget } = await import('../services/budget-service.js');
        await saveBudget(this.budget);
        
        document.dispatchEvent(new CustomEvent('budget-updated'));
        alert('Presupuesto guardado exitosamente!');
      } catch (error) {
        console.error('Error al guardar el presupuesto:', error);
        alert('Error al guardar el presupuesto');
      }
    }
  }
  
  customElements.define('budget-form', BudgetForm);