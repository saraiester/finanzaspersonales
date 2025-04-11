const CATEGORIES = {
  income: ['Salario', 'Inversiones', 'Regalos', 'Otros ingresos'],
  expense: ['Alimentación', 'Transporte', 'Vivienda', 'Salud', 'Educación', 'Ropa', 'Otros gastos']
};

class TransactionForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.transaction = {
      type: 'income',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: ''
    };
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    
    document.addEventListener('db-ready', () => {
      this.loadCategories();
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .form-header {
          color: var(--dark-color);
          font-size: 1.5rem;
          margin-bottom: 20px;
          font-weight: 600;
        }
        
        form {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }
        
        .form-group {
          margin-bottom: 10px;
        }
        
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
        }
        
        input, select {
          width: 90%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
        
        button {
          align-self: flex-end;
        }
        
        .radio-group {
          display: flex;
          gap: 15px;
          align-items: center;
        }
        
        .radio-option {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .radio-option input {
          width: auto;
        }
      </style>
      
      <h3 class="form-header">Datos de Transacción</h3>
      <form id="transactionForm">
        <div class="form-group">
          <label>Tipo de transacción</label>
          <div class="radio-group">
            <label class="radio-option">
              <input type="radio" name="type" value="income" checked> Ingreso
            </label>
            <label class="radio-option">
              <input type="radio" name="type" value="expense"> Egreso
            </label>
          </div>
        </div>
        
        <div class="form-group">
          <label for="amount">Monto</label>
          <input type="number" id="amount" name="amount" step="0.01" min="0" required>
        </div>
        
        <div class="form-group">
          <label for="date">Fecha</label>
          <input type="date" id="date" name="date" required>
        </div>
        
        <div class="form-group">
          <label for="category">Categoría</label>
          <select id="category" name="category" required>
            <option value="">Seleccione una categoría</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="description">Descripción (opcional)</label>
          <input type="text" id="description" name="description">
        </div>
        
        <div class="form-group">
          <button type="submit">Guardar</button>
        </div>
      </form>
    `;
  }

  setupEventListeners() {
    const form = this.shadowRoot.getElementById('transactionForm');
    const typeRadios = this.shadowRoot.querySelectorAll('input[name="type"]');
    
    typeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.transaction.type = e.target.value;
        this.updateCategories();
      });
    });
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
    
    form.querySelectorAll('input, select').forEach(element => {
      element.addEventListener('change', (e) => {
        this.transaction[e.target.name] = e.target.value;
      });
    });
  }

  async loadCategories() {
    this.updateCategories();
  }

  updateCategories() {
    const categorySelect = this.shadowRoot.getElementById('category');
    const categories = this.transaction.type === 'income' ? CATEGORIES.income : CATEGORIES.expense;
    
    const currentValue = categorySelect.value;
    categorySelect.innerHTML = '<option value="">Seleccione una categoría</option>';
    
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });
    
    if (categories.includes(currentValue)) {
      categorySelect.value = currentValue;
    }
    
    this.transaction.category = categorySelect.value;
  }

  async handleSubmit() {
    const form = this.shadowRoot.getElementById('transactionForm');
    const formData = new FormData(form);
    
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    const transaction = {
      type: formData.get('type'),
      amount: parseFloat(formData.get('amount')),
      date: formData.get('date'),
      category: formData.get('category'),
      description: formData.get('description') || '',
      createdAt: new Date().toISOString()
    };
    
    try {
      const { saveTransaction } = await import('../services/transaction-service.js');
      await saveTransaction(transaction);
      
      form.reset();
      this.transaction = {
        type: 'income',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: '',
        description: ''
      };
      
      this.shadowRoot.getElementById('date').value = this.transaction.date;
      this.updateCategories();
      
      document.dispatchEvent(new CustomEvent('transaction-added'));
      alert('Transacción guardada exitosamente!');
    } catch (error) {
      console.error('Error al guardar la transacción:', error);
      alert('Ocurrió un error al guardar la transacción');
    }
  }
}

customElements.define('transaction-form', TransactionForm);