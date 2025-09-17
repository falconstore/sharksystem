// Main Application Controller
class FreePro {
  constructor() {
    this.theme = new Theme();
    this.tabs = new Tabs();
    this.authManager = new AuthManager();
    this.clientesManager = new ClientesManager();
    this.procedimentosManager = new ProcedimentosManager();
    
    this.db = null;
    this.auth = null;
    this.isConnected = false;
  }

  async init() {
    console.log('FreePro System - Initializing...');
    
    // Initialize theme
    this.theme.init();
    
    // Initialize Firebase
    const firebaseResult = FirebaseService.initializeFirebase();
    this.db = firebaseResult.db;
    this.auth = firebaseResult.auth;
    this.isConnected = firebaseResult.isConnected;
    
    // Initialize auth manager
    await this.authManager.init(this.auth, this.db);
    
    // Initialize managers with Firebase connection
    this.clientesManager.init(this.db, this.isConnected);
    this.procedimentosManager.init(this.db, this.isConnected);
    
    // Initialize tabs
    this.tabs.init();
    
    // Setup auth change listener
    this.authManager.onAuthChange(async (user) => {
      if (user && this.isConnected) {
        console.log('User authenticated:', user.email);
        
        // Load data for authenticated user
        await this.clientesManager.loadFromFirebase();
        this.clientesManager.setupRealtime();
        
        // Setup procedimentos realtime
        this.procedimentosManager.setupRealtime();
      } else if (!this.isConnected) {
        console.log('Running in local mode');
        // Initialize with local data if needed
      }
    });
    
    // Bind global events
    this.bindGlobalEvents();
    
    // Bind login form
    this.bindLoginForm();
    
    // Add logout button functionality
    this.bindLogoutButton();
    
    console.log('FreePro System - Ready!');
  }

  bindLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Entrando...';
        submitBtn.disabled = true;
        
        const success = await this.authManager.login(email, password);
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        if (success) {
          loginForm.reset();
        }
      });
    }

    // Bind create account form
    const createAccountForm = document.getElementById('createAccountForm');
    if (createAccountForm) {
      createAccountForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('createEmail').value;
        const password = document.getElementById('createPassword').value;
        const name = document.getElementById('createName').value;
        
        const submitBtn = createAccountForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Criando...';
        submitBtn.disabled = true;
        
        const success = await this.authManager.createAccount(email, password, name);
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        if (success) {
          createAccountForm.reset();
          // Switch to login tab
          document.getElementById('loginTab').click();
        }
      });
    }

    // Handle tab switching in login modal
    const loginTab = document.getElementById('loginTab');
    const createTab = document.getElementById('createTab');
    const loginFormDiv = document.getElementById('loginFormDiv');
    const createFormDiv = document.getElementById('createFormDiv');
    
    if (loginTab && createTab) {
      loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        createTab.classList.remove('active');
        if (loginFormDiv) loginFormDiv.style.display = 'block';
        if (createFormDiv) createFormDiv.style.display = 'none';
      });
      
      createTab.addEventListener('click', () => {
        createTab.classList.add('active');
        loginTab.classList.remove('active');
        if (createFormDiv) createFormDiv.style.display = 'block';
        if (loginFormDiv) loginFormDiv.style.display = 'none';
      });
    }

    // Local mode button
    const localModeBtn = document.getElementById('localModeBtn');
    if (localModeBtn) {
      localModeBtn.addEventListener('click', () => {
        const modal = document.getElementById('loginModal');
        if (modal) modal.style.display = 'none';
        
        const main = document.getElementById('appMain');
        if (main) main.hidden = false;
        
        document.getElementById('userEmailLbl').textContent = 'Modo Local';
        document.getElementById('welcomeName').textContent = 'Usuário Local';
        
        console.log('Running in local mode without authentication');
      });
    }
  }

  bindLogoutButton() {
    // Add logout functionality to theme toggle or create logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Deseja realmente sair?')) {
          this.authManager.logout();
        }
      });
    }
  }

  bindGlobalEvents() {
    // Listen for tab switches
    window.addEventListener('tabSwitched', (e) => {
      console.log('Tab switched to:', e.detail.tab);
    });
    
    // Make instances available globally for debugging
    window.freepro = this;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new FreePro();
  app.init().catch(console.error);
});