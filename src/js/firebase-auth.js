// Simple Firebase Auth Handler - Mantém o sistema original funcionando
class SimpleAuth {
  constructor() {
    this.currentUser = null;
    this.welcomeName = 'usuário';
  }

  async init(auth, db) {
    this.auth = auth;
    this.db = db;
    
    if (this.auth) {
      // Usa EXATAMENTE o mesmo padrão do HTML original
      this.auth.onAuthStateChanged(async (user) => {
        const main = document.getElementById('appMain');
        
        if (user) {
          // Usuário logado - mostra o app
          this.currentUser = user;
          document.getElementById('userEmailLbl').textContent = user.email;
          
          // Resolve o nome de boas-vindas
          await this.resolveWelcomeName(user);
          this.paintWelcome();
          
          // MOSTRA O APP
          if (main) main.hidden = false;
          
          // Carrega dados do Firebase
          if (window.clientesManager) {
            await window.clientesManager.loadFromFirebase();
            window.clientesManager.setupRealtime();
          }
          
          if (window.procedimentosManager) {
            window.procedimentosManager.setupRealtime();
          }
          
        } else {
          // Sem usuário - mantém oculto
          document.getElementById('userEmailLbl').textContent = 'Visitante';
          this.welcomeName = 'usuário';
          this.paintWelcome();
          
          // OCULTA O APP
          if (main) main.hidden = true;
        }
      });
    } else {
      // Modo local sem Firebase
      document.getElementById('userEmailLbl').textContent = 'Local';
      this.welcomeName = 'Usuário Local';
      this.paintWelcome();
      const main = document.getElementById('appMain');
      if (main) main.hidden = false;
    }
  }

  async resolveWelcomeName(user) {
    const displayName = (user && user.displayName) ? user.displayName.trim() : '';
    if (displayName) {
      this.welcomeName = displayName;
      return;
    }

    try {
      if (this.db && user && user.email) {
        const doc = await this.db.collection('users').doc(user.email).get();
        if (doc.exists) {
          const data = doc.data();
          const nameField = (data.name || data.nome || '').toString().trim();
          if (nameField) {
            this.welcomeName = nameField;
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Error resolving name:', e);
    }

    const email = user?.email || '';
    this.welcomeName = email ? email.split('@')[0] : 'usuário';
  }

  paintWelcome() {
    const el = document.getElementById('welcomeName');
    if (el) el.textContent = this.welcomeName;
  }
}

// Export to window
window.SimpleAuth = SimpleAuth;