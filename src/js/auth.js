// Authentication Management
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.welcomeName = 'usuário';
    this.onAuthChangeCallbacks = [];
  }

  async init(auth, db) {
    this.auth = auth;
    this.db = db;
    
    if (this.auth) {
      this.auth.onAuthStateChanged(async (user) => {
        const main = document.getElementById('appMain');
        
        if (user) {
          this.currentUser = user;
          document.getElementById('userEmailLbl').textContent = user.email;
          await this.resolveWelcomeName(user);
          this.paintWelcome();
          
          if (main) main.hidden = false;
          
          // Hide login modal if visible
          const modal = document.getElementById('loginModal');
          if (modal) modal.style.display = 'none';
          
          // Notify all callbacks about auth change
          this.onAuthChangeCallbacks.forEach(callback => callback(user));
        } else {
          document.getElementById('userEmailLbl').textContent = 'Visitante';
          this.welcomeName = 'usuário';
          this.paintWelcome();
          
          if (main) main.hidden = true;
          
          // NÃO mostra login automaticamente - deixa o sistema original funcionar
          // Se quiser forçar o modal de login, descomente a linha abaixo:
          // this.showLogin();
          
          // Notify all callbacks about auth change
          this.onAuthChangeCallbacks.forEach(callback => callback(null));
        }
      });
    } else {
      // Local mode - no authentication required
      document.getElementById('userEmailLbl').textContent = 'Modo Local';
      this.welcomeName = 'Usuário Local';
      this.paintWelcome();
      const main = document.getElementById('appMain');
      if (main) main.hidden = false;
    }
  }

  async showLogin() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'flex';
  }

  async login(email, password) {
    try {
      if (!this.auth) {
        alert('Sistema rodando em modo local. Login não disponível.');
        return false;
      }
      
      const result = await this.auth.signInWithEmailAndPassword(email, password);
      const modal = document.getElementById('loginModal');
      if (modal) modal.style.display = 'none';
      return true;
    } catch (error) {
      console.error('Login error:', error);
      
      // Provide user-friendly error messages
      let message = 'Erro ao fazer login';
      if (error.code === 'auth/user-not-found') {
        message = 'Usuário não encontrado';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Senha incorreta';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Email inválido';
      }
      
      alert(message);
      return false;
    }
  }

  async createAccount(email, password, name) {
    try {
      if (!this.auth) {
        alert('Sistema rodando em modo local. Cadastro não disponível.');
        return false;
      }
      
      const result = await this.auth.createUserWithEmailAndPassword(email, password);
      
      // Save user name if provided
      if (name && this.db) {
        await this.db.collection('users').doc(email).set({
          name: name,
          email: email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Create account error:', error);
      
      let message = 'Erro ao criar conta';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este email já está cadastrado';
      } else if (error.code === 'auth/weak-password') {
        message = 'A senha deve ter pelo menos 6 caracteres';
      }
      
      alert(message);
      return false;
    }
  }

  async logout() {
    try {
      if (this.auth) {
        await this.auth.signOut();
      }
    } catch (error) {
      console.error('Logout error:', error);
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
      console.warn('Error resolving welcome name:', e);
    }

    const email = user?.email || '';
    this.welcomeName = email ? email.split('@')[0] : 'usuário';
  }

  paintWelcome() {
    const el = document.getElementById('welcomeName');
    if (el) el.textContent = this.welcomeName;
  }

  onAuthChange(callback) {
    this.onAuthChangeCallbacks.push(callback);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getWelcomeName() {
    return this.welcomeName;
  }
}

// Export to window
window.AuthManager = AuthManager;