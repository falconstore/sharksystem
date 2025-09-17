// Tab Navigation System
class Tabs {
  constructor() {
    this.map = {
      'dashboard': {
        section: '#tab-dashboard',
        title: '📊 Dashboard',
        subtitle: 'Resumo geral e atalhos'
      },
      'controle-semanal': {
        section: '#tab-controle-semanal',
        title: '📆 Controle Semanal',
        subtitle: 'Gerencie assinaturas e clientes'
      },
      'controle-procedimentos': {
        section: '#tab-controle-procedimentos',
        title: '🧩 Controle Procedimentos',
        subtitle: 'Organize seus procedimentos'
      },
      'construcao-1': {
        section: '#tab-construcao-1',
        title: '🚧 Em Construção 1',
        subtitle: 'Conteúdo futuro'
      },
      'construcao-2': {
        section: '#tab-construcao-2',
        title: '🚧 Em Construção 2',
        subtitle: 'Conteúdo futuro'
      },
      'construcao-3': {
        section: '#tab-construcao-3',
        title: '🚧 Em Construção 3',
        subtitle: 'Conteúdo futuro'
      },
      'construcao-4': {
        section: '#tab-construcao-4',
        title: '🚧 Em Construção 4',
        subtitle: 'Conteúdo futuro'
      }
    };
    this.current = 'dashboard';
  }

  init() {
    const nav = document.getElementById('tabNav');
    if (!nav) {
      console.warn('tabNav não encontrado');
      return;
    }
    
    nav.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-tab]');
      if (!btn) return;
      this.switch(btn.dataset.tab);
    });
    
    this.switch(this.current);
  }

  switch(tab) {
    if (!this.map[tab]) return;
    
    // Update active button
    document.querySelectorAll('#tabNav button').forEach(b => b.classList.remove('active'));
    document.querySelector(`#tabNav button[data-tab="${tab}"]`)?.classList.add('active');
    
    // Hide all sections
    Object.values(this.map).forEach(cfg => {
      const el = document.querySelector(cfg.section);
      if (el) el.style.display = 'none';
    });
    
    // Show current section
    const cfg = this.map[tab];
    document.querySelector(cfg.section).style.display = '';
    
    // Update header
    document.getElementById('pageTitle').textContent = cfg.title;
    document.getElementById('pageSubtitle').textContent = cfg.subtitle;
    
    this.current = tab;
    
    // Special handling for procedimentos tab
    if (tab === 'controle-procedimentos') {
      const dateInput = document.getElementById('procData');
      if (dateInput && !dateInput.value) {
        dateInput.valueAsDate = new Date();
      }
    }
    
    // Emit custom event for tab switch
    window.dispatchEvent(new CustomEvent('tabSwitched', { detail: { tab } }));
  }

  getCurrentTab() {
    return this.current;
  }
}

// Export to window
window.Tabs = Tabs;