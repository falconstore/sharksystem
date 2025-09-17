// Theme Management
class Theme {
  constructor() {
    const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    this.current = localStorage.getItem('freepro-theme') || systemTheme;
  }

  init() {
    this.apply(this.current);
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', () => this.toggle());
      this.refreshLabel(btn);
    }
  }

  refreshLabel(btn) {
    if (!btn) return;
    // Mostra o ícone do PRÓXIMO tema
    btn.textContent = this.current === 'light' ? '🌙 Escuro' : '☀️ Claro';
  }

  apply(theme) {
    this.current = theme;
    if (theme === 'light') {
      document.body.setAttribute('data-theme', 'light');
    } else {
      document.body.removeAttribute('data-theme');
    }
    localStorage.setItem('freepro-theme', theme);
    this.refreshLabel(document.getElementById('themeToggle'));
  }

  toggle() {
    this.apply(this.current === 'light' ? 'dark' : 'light');
  }
}

// Export to window
window.Theme = Theme;