class AppHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        header {
          background-color: var(--card-color);
          color: var(--dark-color);
          padding: 20px 0;
          margin-bottom: 30px;
          border-radius: 8px;
          box-shadow: var(--shadow);
          text-align: center;
          border-left: 5px solid var(--primary-color);
        }
        
        h1 {
          margin: 0;
          font-size: 2.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
        }
        
        .logo {
          width: 40px;
          height: 40px;
          background-color: var(--primary-color);
          mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'/%3E%3C/svg%3E") no-repeat center;
          -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'/%3E%3C/svg%3E") no-repeat center;
        }
        
        p {
          margin: 10px 0 0;
          opacity: 0.8;
        }
      </style>
      <header>
        <h1>
           <!-- <span class="logo"></span>  -->
          Finanzas Personales
        </h1>
        <p>Seguimiento de ingresos y gastos mensuales</p>
      </header>
    `;
  }
}

customElements.define('app-header', AppHeader);