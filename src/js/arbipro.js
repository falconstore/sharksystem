// Calculadora ArbiPro - Sistema de Arbitragem
class ArbiPro {
  constructor() {
    this.MAX_HOUSES = 6;
    this.numHouses = 2;
    this.roundingValue = 1.00;
    this.displayRounding = "1.00";
    this.manualOverrides = {};
    this.pending = false;
    
    this.houses = Array.from({ length: this.MAX_HOUSES }).map((_, index) => ({
      odd: "",
      increase: null,
      finalOdd: 0,
      stake: "0",
      commission: null,
      freebet: false,
      fixedStake: index === 0,
      lay: false,
      responsibility: ""
    }));

    this.results = { profits: [], totalStake: 0, roi: 0 };
  }

  init() {
    const appContainer = document.querySelector('#panel-1 #app');
    if (!appContainer) return;
    
    this.render();
    this.bindEvents();
    this.scheduleUpdate();
  }

  activeHouses() {
    return this.houses.slice(0, this.numHouses);
  }

  scheduleUpdate() {
    if (this.pending) return;
    this.pending = true;
    requestAnimationFrame(() => {
      this.pending = false;
      this.recalcStakeDistribution();
      this.calculateResults();
      this.updateAllHouseUIs();
      this.updateResultsUI();
    });
  }

  // Funções auxiliares
  parseFlex(value) {
    if (!value) return 0;
    const str = String(value).replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  formatDecimal(value) {
    return value.toFixed(2).replace('.', ',');
  }

  formatBRL(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  keepNumeric(value) {
    return value.replace(/[^0-9,.-]/g, '');
  }

  // Cálculos principais
  calculateResults() {
    const active = this.activeHouses();
    let totalStake = 0;
    const profits = new Array(active.length).fill(0);

    active.forEach(h => {
      const stake = this.parseFlex(h.stake) || 0;
      const resp = this.parseFlex(h.responsibility) || 0;
      if (!h.freebet) totalStake += h.lay ? resp : stake;
    });

    active.forEach((h, idx) => {
      const stake = this.parseFlex(h.stake) || 0;
      const odd = h.finalOdd || 0;
      const commission = h.commission || 0;
      
      if (h.lay) {
        const resp = this.parseFlex(h.responsibility) || 0;
        profits[idx] = stake * (1 - commission / 100) - (totalStake - resp);
      } else if (h.freebet) {
        const gross = stake * odd - totalStake;
        const comm = gross > 0 ? (commission / 100) * gross : 0;
        profits[idx] = gross - comm;
      } else {
        const effOdd = odd * (1 - commission / 100);
        profits[idx] = stake * effOdd - totalStake;
      }
    });

    const minProfit = profits.length ? Math.min(...profits) : 0;
    const denom = active.some(h => h.freebet)
      ? active.reduce((s, h) => s + (h.freebet ? (this.parseFlex(h.stake) || 0) : 0), 0) || 1
      : (active.reduce((s, h) => s + (h.freebet ? 0 : (h.lay ? (this.parseFlex(h.responsibility) || 0) : (this.parseFlex(h.stake) || 0))), 0) || 1);
    
    const roi = (minProfit / denom) * 100;
    
    this.results = { profits, totalStake, roi };
  }

  recalcStakeDistribution() {
    const active = this.activeHouses();
    const fixedIndex = active.findIndex(h => h.fixedStake);
    if (fixedIndex === -1) return;

    const fixed = active[fixedIndex];
    const fixedStake = this.parseFlex(fixed.stake) || 0;
    const fixedOdd = fixed.finalOdd;
    if (!(fixedStake > 0 && fixedOdd > 0)) return;

    let changed = false;
    const newHouses = [...this.houses];

    active.forEach((h, idx) => {
      const overrides = this.manualOverrides[idx] || {};
      const oddVal = this.parseFlex(h.odd) || 0;
      const stakeVal = this.parseFlex(h.stake) || 0;

      if (h.lay && !overrides.responsibility && oddVal > 1 && stakeVal > 0) {
        const responsibility = stakeVal * (oddVal - 1);
        const current = this.parseFlex(h.responsibility) || 0;
        if (Math.abs(current - responsibility) > 1e-6) {
          changed = true;
          newHouses[idx] = { ...newHouses[idx], responsibility: this.formatDecimal(responsibility) };
        }
      }

      if (idx !== fixedIndex && h.finalOdd > 0 && !overrides.stake) {
        const fixedCommission = fixed.commission || 0;
        const houseCommission = h.commission || 0;
        const fixedProfit = fixedStake * fixedOdd * (1 - fixedCommission / 100);
        
        let calcStake;
        if (h.lay) {
          calcStake = fixedProfit / (h.finalOdd - houseCommission / 100);
        } else {
          const eff = h.finalOdd * (1 - houseCommission / 100);
          calcStake = fixedProfit / eff;
        }
        
        let finalStakeStr = this.smartRoundStake(calcStake, fixedProfit, h.finalOdd, houseCommission);
        
        const finalStakeNum = this.parseFlex(finalStakeStr) || 0;
        const cur = this.parseFlex(h.stake) || 0;
        if (Math.abs(cur - finalStakeNum) > 1e-6) {
          changed = true;
          if (h.lay) {
            const resp = finalStakeNum * Math.max(oddVal - 1, 0);
            newHouses[idx] = { 
              ...newHouses[idx], 
              stake: finalStakeStr, 
              responsibility: this.formatDecimal(resp), 
              fixedStake: false 
            };
          } else {
            newHouses[idx] = { 
              ...newHouses[idx], 
              stake: finalStakeStr, 
              fixedStake: false 
            };
          }
        }
      }
    });

    if (changed) {
      this.houses = newHouses;
      this.updateAllHouseUIs();
    }
  }

  smartRoundStake(value, targetProfit, odd, commission = 0) {
    const num = this.parseFlex(value);
    if (!Number.isFinite(num)) return this.formatDecimal(num);
    
    const step = this.roundingValue;
    const baseRounded = Math.round(num / step) * step;
    
    const options = [
      Math.max(0, baseRounded - step),
      baseRounded,
      baseRounded + step
    ];
    
    let bestOption = baseRounded;
    let bestScore = -Infinity;
    
    options.forEach(option => {
      if (option <= 0) return;
      
      const effOdd = odd * (1 - commission / 100);
      const profit = option * effOdd - targetProfit;
      
      let score = profit;
      if (profit > 0) score += 100;
      score -= Math.abs(option - num) * 10;
      
      if (score > bestScore) {
        bestScore = score;
        bestOption = option;
      }
    });
    
    return this.formatDecimal(bestOption);
  }

  // Interface
  render() {
    const app = document.querySelector('#panel-1 #app');
    if (!app) return;

    app.innerHTML = `
      <div class="calc-header">
        <h1 style="font-size: 1.75rem; font-weight: 800; background: linear-gradient(135deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 0.5rem; text-align: center;">Calculadora ArbiPro</h1>
        <p style="color: var(--text-secondary); font-size: 0.875rem; text-align: center;">Calcule stakes otimizados para garantir lucro em qualquer resultado</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Configurações</div>
          <div class="form-group" style="margin: 0.75rem 0 0 0;">
            <select id="numHouses" class="form-select" style="font-size: 0.75rem; padding: 0.5rem;">
              <option value="2" ${this.numHouses===2?'selected':''}>2 Casas</option>
              <option value="3" ${this.numHouses===3?'selected':''}>3 Casas</option>
              <option value="4" ${this.numHouses===4?'selected':''}>4 Casas</option>
              <option value="5" ${this.numHouses===5?'selected':''}>5 Casas</option>
              <option value="6" ${this.numHouses===6?'selected':''}>6 Casas</option>
            </select>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Arredondamento</div>
          <div class="form-group" style="margin: 0.75rem 0 0 0;">
            <select id="rounding" class="form-select" style="font-size: 0.75rem; padding: 0.5rem;">
              <option value="0.01">R$ 0,01</option>
              <option value="0.10">R$ 0,10</option>
              <option value="0.50">R$ 0,50</option>
              <option value="1.00" selected>R$ 1,00</option>
            </select>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-value" id="totalStake">R$ 0,00</div>
          <div class="stat-label">Total Investido</div>
        </div>

        <div class="stat-card">
          <div class="stat-value profit-highlight" id="roi">0,00%</div>
          <div class="stat-label">ROI Médio</div>
        </div>
      </div>

      <div class="card">
        <div class="section-title">Casas de Apostas</div>
        <div id="houses" class="house-grid"></div>
      </div>

      <div class="card" style="margin-top: 1.5rem;">
        <div class="section-title">Resultados ArbiPro</div>
        <div style="overflow-x: auto;">
          <table class="results-table">
            <thead>
              <tr>
                <th>Casa</th>
                <th>Odd Final</th>
                <th>Comissão</th>
                <th>Stake</th>
                <th>Lucro</th>
              </tr>
            </thead>
            <tbody id="resultsRows"></tbody>
          </table>
        </div>
      </div>
    `;

    this.renderHouses();
  }

  renderHouses() {
    const housesContainer = document.getElementById("houses");
    if (!housesContainer) return;
    
    housesContainer.innerHTML = this.activeHouses()
      .map((h, idx) => this.cardHTML(idx, h))
      .join("");
  }

  cardHTML(idx, h) {
    const oddDisplay = (h.finalOdd || 0).toFixed(2).replace('.', ',');
    return `
      <div id="card-${idx}" class="house-card">
        <h3 class="house-title">Casa ${idx + 1}</h3>
        <div class="grid-2" style="margin-bottom: 0.75rem;">
          <div class="form-group">
            <label class="form-label" for="odd-${idx}">Odd</label>
            <input id="odd-${idx}" data-action="odd" data-idx="${idx}" type="text" inputmode="decimal" value="${h.odd}"
              class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Odd Final</label>
            <div id="finalOdd-${idx}" class="form-input" style="display: flex; align-items: center; background: rgba(17, 24, 39, 0.4); font-family: ui-monospace, monospace;">${oddDisplay}</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="stake-${idx}">Stake</label>
          <div style="display: flex; gap: 0.5rem;">
            <div style="position: relative; flex: 1;">
              <span style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-weight: 600; font-size: 0.75rem;">R$</span>
              <input id="stake-${idx}" data-action="stake" data-idx="${idx}" type="text" inputmode="decimal" value="${h.stake || ''}"
                class="form-input" style="padding-left: 2.25rem; font-family: ui-monospace, monospace;" />
            </div>
            <button data-action="toggleLay" data-idx="${idx}" class="btn-toggle ${h.lay ? 'active' : ''}">${h.lay ? 'LAY' : 'BACK'}</button>
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem; margin: 0.75rem 0; flex-wrap: wrap;">
          <label class="checkbox-group">
            <input type="checkbox" ${h.commission !== null ? 'checked' : ''} data-action="toggleCommission" data-idx="${idx}" />
            <span>Comissão</span>
          </label>
          <label class="checkbox-group">
            <input type="checkbox" ${h.freebet ? 'checked' : ''} data-action="toggleFreebet" data-idx="${idx}" />
            <span>Freebet</span>
          </label>
          <label class="checkbox-group">
            <input type="checkbox" ${h.increase !== null ? 'checked' : ''} data-action="toggleIncrease" data-idx="${idx}" />
            <span>Aumento de Odd</span>
          </label>
        </div>

        ${this.renderConditionalFields(idx, h)}

        <button data-action="fixStake" data-idx="${idx}" class="${h.fixedStake ? 'btn btn-primary' : 'btn btn-secondary'}" style="width: 100%;">
          ${h.fixedStake ? 'Stake Fixada' : 'Fixar Stake'}
        </button>
      </div>
    `;
  }

  renderConditionalFields(idx, h) {
    let html = '';
    
    if (h.commission !== null) {
      html += `
        <div class="form-group commission-field">
          <label class="form-label" for="commission-${idx}">Comissão (%)</label>
          <input id="commission-${idx}" data-action="commissionValue" data-idx="${idx}" type="text" inputmode="decimal" 
            value="${h.commission || ''}" class="form-input" />
        </div>`;
    }
    
    if (h.increase !== null) {
      html += `
        <div class="form-group increase-field">
          <label class="form-label" for="increase-${idx}">Aumento de Odd (%)</label>
          <input id="increase-${idx}" data-action="increaseValue" data-idx="${idx}" type="text" inputmode="decimal" 
            value="${h.increase || ''}" class="form-input" />
        </div>`;
    }
    
    if (h.lay) {
      html += `
        <div class="form-group responsibility-field">
          <label class="form-label" for="responsibility-${idx}">Responsabilidade</label>
          <input id="responsibility-${idx}" data-action="responsibility" data-idx="${idx}" type="text" inputmode="decimal" 
            value="${h.responsibility || ''}" class="form-input" />
        </div>`;
    }
    
    return html;
  }

  bindEvents() {
    // Configurações principais
    const numHousesSelect = document.getElementById("numHouses");
    if (numHousesSelect) {
      numHousesSelect.addEventListener("change", (e) => {
        this.numHouses = parseInt(e.target.value, 10);
        this.renderHouses();
        this.scheduleUpdate();
      });
    }

    const roundingSelect = document.getElementById("rounding");
    if (roundingSelect) {
      roundingSelect.addEventListener("change", (e) => {
        this.displayRounding = e.target.value;
        this.roundingValue = parseFloat(this.displayRounding.replace(',', '.'));
        this.scheduleUpdate();
      });
    }

    // Events das casas
    this.bindHouseEvents();
  }

  bindHouseEvents() {
    const container = document.getElementById("houses");
    if (!container) return;

    container.addEventListener("input", (e) => this.handleInput(e));
    container.addEventListener("change", (e) => this.handleChange(e));
    container.addEventListener("click", (e) => this.handleClick(e));
  }

  handleInput(e) {
    const t = e.target;
    
    if (t.getAttribute && t.getAttribute("inputmode") === "decimal") {
      t.value = this.keepNumeric(t.value);
    }

    const action = t.getAttribute("data-action");
    const idx = parseInt(t.getAttribute("data-idx") || "-1", 10);
    if (!action || idx < 0) return;

    switch (action) {
      case "odd":
        this.setHouse(idx, { odd: t.value });
        break;
      case "stake":
        this.setHouse(idx, { stake: t.value }, ["stake"]);
        break;
      case "responsibility":
        this.setHouse(idx, { responsibility: t.value }, ["responsibility"]);
        break;
      case "commissionValue":
        const commVal = this.parseFlex(t.value);
        this.setHouse(idx, { commission: Number.isFinite(commVal) ? commVal : 0 });
        break;
      case "increaseValue":
        const incVal = this.parseFlex(t.value);
        this.setHouse(idx, { increase: Number.isFinite(incVal) ? incVal : 0 });
        break;
    }
    
    this.scheduleUpdate();
  }

  handleChange(e) {
    const el = e.target;
    if (el.type !== 'checkbox') return;
    
    const action = el.getAttribute("data-action");
    const idx = parseInt(el.getAttribute("data-idx") || "-1", 10);
    if (!action || idx < 0) return;

    switch (action) {
      case "toggleCommission":
        this.setHouse(idx, { commission: el.checked ? 0 : null });
        this.renderHouses();
        this.scheduleUpdate();
        break;
      case "toggleFreebet":
        this.setHouse(idx, { freebet: el.checked });
        this.scheduleUpdate();
        break;
      case "toggleIncrease":
        this.setHouse(idx, { increase: el.checked ? 0 : null });
        this.renderHouses();
        this.scheduleUpdate();
        break;
    }
  }

  handleClick(e) {
    if (e.target.type === 'checkbox') return;

    let el = e.target.closest("[data-action]");
    if (!el) return;
    
    const action = el.getAttribute("data-action");
    const idx = parseInt(el.getAttribute("data-idx") || "-1", 10);
    if (idx < 0) return;

    if (action === "toggleLay" || action === "fixStake") {
      e.preventDefault();
    }

    switch (action) {
      case "toggleLay":
        this.setHouse(idx, { lay: !this.houses[idx].lay });
        this.renderHouses();
        this.scheduleUpdate();
        break;
      case "fixStake":
        this.houses = this.houses.map((h, i) => ({ 
          ...h, 
          fixedStake: i === idx ? !h.fixedStake : false 
        }));
        this.renderHouses();
        this.scheduleUpdate();
        break;
    }
  }

  setHouse(idx, patch, setOverrideKeys = []) {
    const prev = this.houses[idx];
    const h = { ...prev, ...patch };

    const oddVal = this.parseFlex(h.odd) || 0;
    const incVal = this.parseFlex(h.increase) || 0;
    
    let calculatedOdd = oddVal;
    if (h.increase !== null && incVal > 0 && oddVal > 1) {
      calculatedOdd = oddVal + (oddVal - 1) * (incVal / 100);
    }
    
    h.finalOdd = h.freebet ? Math.max(calculatedOdd - 1, 0) : calculatedOdd;

    if (h.lay && !(this.manualOverrides[idx] && this.manualOverrides[idx].responsibility)) {
      const stakeVal = this.parseFlex(h.stake) || 0;
      if (stakeVal > 0 && oddVal > 1) h.responsibility = this.formatDecimal(stakeVal * (oddVal - 1));
      else h.responsibility = "";
    }

    this.houses[idx] = h;

    if (setOverrideKeys.length) {
      this.manualOverrides[idx] = this.manualOverrides[idx] || {};
      setOverrideKeys.forEach(k => this.manualOverrides[idx][k] = true);
    }
  }

  updateAllHouseUIs() {
    this.activeHouses().forEach((_, i) => this.updateCardComputed(i));
  }

  updateCardComputed(idx) {
    const h = this.houses[idx];
    const oddEl = document.getElementById(`finalOdd-${idx}`);
    if (oddEl) oddEl.textContent = (h.finalOdd || 0).toFixed(2).replace('.', ',');
    
    if (!(this.manualOverrides[idx] && this.manualOverrides[idx].stake)) {
      const sEl = document.getElementById(`stake-${idx}`);
      if (sEl) sEl.value = h.stake || "";
    }
  }

  updateResultsUI() {
    const totalStakeEl = document.getElementById("totalStake");
    if (totalStakeEl) {
      totalStakeEl.textContent = this.formatBRL(this.results.totalStake);
    }

    const roiEl = document.getElementById("roi");
    if (roiEl) {
      roiEl.textContent = (this.results.roi >= 0 ? "+" : "") + this.results.roi.toFixed(2) + "%";
      roiEl.className = "stat-value " + (this.results.roi >= 0 ? "profit-highlight" : "profit-negative");
    }

    this.updateResultsTable();
  }

  updateResultsTable() {
    const active = this.activeHouses();
    const hasLayBets = active.some(h => h.lay);
    const hasOddIncrease = active.some(h => h.increase !== null);
    
    const headerHTML = `
      <tr>
        <th>Casa</th>
        <th>Odd</th>
        ${hasOddIncrease ? '<th>Odd Final</th>' : ''}
        <th>Comissão</th>
        <th>Stake</th>
        ${hasLayBets ? '<th>Responsabilidade</th>' : ''}
        <th>Lucro</th>
      </tr>
    `;
    
    const rowsHTML = active.map((h, idx) => {
      const oddOriginal = this.parseFlex(h.odd) || 0;
      const oddText = oddOriginal.toFixed(2).replace('.', ',');
      const oddFinalText = hasOddIncrease ? 
        `<td>${h.finalOdd ? h.finalOdd.toFixed(2).replace('.', ',') : oddText}</td>` : '';
      const commissionText = (h.commission === null) ? '—' : (h.commission || 0).toFixed(2) + '%';
      const stakeText = h.stake ? h.stake : "0,00";
      const profit = this.results.profits[idx] || 0;
      const profitClass = profit >= 0 ? 'profit-positive' : 'profit-negative';
      const profitValue = this.formatBRL(profit);
      const responsibilityCell = hasLayBets ? 
        `<td>${h.lay ? '<strong>R$ ' + (h.responsibility || '0,00') + '</strong>' : '—'}</td>` : '';
      
      return `
        <tr>
          <td><strong>Casa ${idx + 1}</strong></td>
          <td>${oddText}</td>
          ${oddFinalText}
          <td>${commissionText}</td>
          <td><strong>R$ ${stakeText}</strong>${h.freebet ? '<br><span class="text-small">(Freebet)</span>' : ''}${h.lay ? '<br><span class="text-small">(LAY)</span>' : ''}</td>
          ${responsibilityCell}
          <td class="${profitClass}"><strong>${profitValue}</strong></td>
        </tr>
      `;
    }).join("");

    const thead = document.querySelector('#panel-1 .results-table thead');
    const tbody = document.getElementById("resultsRows");
    
    if (thead) thead.innerHTML = headerHTML;
    if (tbody) tbody.innerHTML = rowsHTML;
  }
}

// Export to window
window.ArbiPro = ArbiPro;