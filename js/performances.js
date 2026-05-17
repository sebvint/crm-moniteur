/* ============================================================
   ProxiPilot — performances.js
   CA · Fréquentation · Démarque · Score — nav mois, comparatif N/N-1, saisie inline
   ============================================================ */

import { showToast } from './app.js';
import { scoreValueClass, shortDate } from './config.js';

/* ══════════════════════════════════════════
   DONNÉES MOCK
   ══════════════════════════════════════════ */
const MOCK_PERF = {
  '2026-05': [
    { id: '1', magasin: 'Casino Sup. Palavas',       ca: 48200, ca_n1: 45100, freq: 1240, freq_n1: 1190, demarque: 5.2, demarque_n1: 3.8, score: 54 },
    { id: '2', magasin: 'Vival Les Arceaux',         ca: 31400, ca_n1: 30200, freq: 820,  freq_n1: 810,  demarque: 3.1, demarque_n1: 2.9, score: 71 },
    { id: '3', magasin: 'Spar Lattes',               ca: 22100, ca_n1: 21800, freq: 610,  freq_n1: 598,  demarque: 2.4, demarque_n1: 2.1, score: 68 },
    { id: '4', magasin: 'Casino Shop Pérols',        ca: 18900, ca_n1: 18400, freq: 520,  freq_n1: 515,  demarque: 1.8, demarque_n1: 1.9, score: 74 },
    { id: '5', magasin: 'Carrefour Express Antigone',ca: null,  ca_n1: 19200, freq: null, freq_n1: 540,  demarque: null,demarque_n1: 2.0, score: null },
  ],
  '2026-04': [
    { id: '1', magasin: 'Casino Sup. Palavas',       ca: 45800, ca_n1: 44200, freq: 1180, freq_n1: 1150, demarque: 4.8, demarque_n1: 3.5, score: 71 },
    { id: '2', magasin: 'Vival Les Arceaux',         ca: 29800, ca_n1: 29100, freq: 790,  freq_n1: 785,  demarque: 2.8, demarque_n1: 2.6, score: 78 },
    { id: '3', magasin: 'Spar Lattes',               ca: 21400, ca_n1: 21000, freq: 590,  freq_n1: 582,  demarque: 2.1, demarque_n1: 2.0, score: 72 },
    { id: '4', magasin: 'Casino Shop Pérols',        ca: 18200, ca_n1: 17900, freq: 505,  freq_n1: 500,  demarque: 2.0, demarque_n1: 1.8, score: 76 },
    { id: '5', magasin: 'Carrefour Express Antigone',ca: 19800, ca_n1: 18900, freq: 545,  freq_n1: 530,  demarque: 1.9, demarque_n1: 1.7, score: null },
  ],
  '2026-03': [
    { id: '1', magasin: 'Casino Sup. Palavas',       ca: 42100, ca_n1: 41800, freq: 1090, freq_n1: 1080, demarque: 3.9, demarque_n1: 3.2, score: 68 },
    { id: '2', magasin: 'Vival Les Arceaux',         ca: 28400, ca_n1: 27900, freq: 760,  freq_n1: 755,  demarque: 2.6, demarque_n1: 2.4, score: 75 },
    { id: '3', magasin: 'Spar Lattes',               ca: 20800, ca_n1: 20500, freq: 572,  freq_n1: 568,  demarque: 2.0, demarque_n1: 1.9, score: 70 },
    { id: '4', magasin: 'Casino Shop Pérols',        ca: 17600, ca_n1: 17200, freq: 492,  freq_n1: 488,  demarque: 1.9, demarque_n1: 1.7, score: 79 },
    { id: '5', magasin: 'Carrefour Express Antigone',ca: 18900, ca_n1: 18200, freq: 528,  freq_n1: 515,  demarque: 1.8, demarque_n1: 1.6, score: null },
  ],
};

/* ── State local ── */
let state = {
  moisRef: '2026-05',
  saisie: null,   // { id, field } ligne en cours d'édition
};

/* ══════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════ */
function getMoisLabel(key) {
  const [y, m] = key.split('-');
  return new Date(y, m - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function getMoisPrev(key) {
  const [y, m] = key.split('-');
  const d = new Date(y, m - 2);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMoisNext(key) {
  const [y, m] = key.split('-');
  const d = new Date(y, m);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function delta(val, val_n1) {
  if (!val || !val_n1) return null;
  return ((val - val_n1) / val_n1 * 100).toFixed(1);
}

function deltaHTML(pct, inverseGood = false) {
  if (pct === null) return '<span style="color:var(--color-text-light);">—</span>';
  const num = parseFloat(pct);
  const up = num >= 0;
  const good = inverseGood ? !up : up;
  const color = good ? 'var(--color-green-text)' : 'var(--color-red-text)';
  return `<span style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:${color};">${up ? '↑' : '↓'} ${Math.abs(num)}%</span>`;
}

function totaux(data) {
  const t = { ca: 0, ca_n1: 0, freq: 0, freq_n1: 0 };
  for (const r of data) {
    if (r.ca)      t.ca    += r.ca;
    if (r.ca_n1)   t.ca_n1 += r.ca_n1;
    if (r.freq)    t.freq    += r.freq;
    if (r.freq_n1) t.freq_n1 += r.freq_n1;
  }
  return t;
}

/* ══════════════════════════════════════════
   RENDER PRINCIPAL
   ══════════════════════════════════════════ */
export function render() {
  const data = MOCK_PERF[state.moisRef] || [];
  const tot  = totaux(data);
  const scoreMoy = Math.round(data.filter(r => r.score).reduce((s, r) => s + r.score, 0) / (data.filter(r => r.score).length || 1));

  return `
    <!-- Header avec navigation mois -->
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:var(--space-3);">
        <button class="icon-btn" id="btn-mois-prev">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h1 class="page-title" id="perf-titre">${getMoisLabel(state.moisRef)}</h1>
        <button class="icon-btn" id="btn-mois-next">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" id="btn-export-perf">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </button>
      </div>
    </div>

    <!-- KPIs secteur -->
    <div class="kpi-grid" style="margin-bottom:var(--space-5);">
      ${kpiBlock('CA secteur', `${(tot.ca/1000).toFixed(0)} k€`, delta(tot.ca, tot.ca_n1), false)}
      ${kpiBlock('Fréquentation', tot.freq.toLocaleString('fr-FR'), delta(tot.freq, tot.freq_n1), false)}
      ${kpiBlock('Score moyen', `${scoreMoy}/100`, null, false, scoreValueClass(scoreMoy))}
      ${kpiBlock('Magasins saisis', `${data.filter(r=>r.ca!==null).length}/${data.length}`, null, false)}
    </div>

    <!-- Tableau performances -->
    <div id="perf-table-wrap">
      ${renderTable(data)}
    </div>
    <div style="font-size:var(--text-xs);color:var(--color-text-light);text-align:center;margin-top:var(--space-2);" class="mobile-only">← Faire défiler →</div>
  `;
}

function kpiBlock(label, value, deltaPct, inverseGood, scoreClass = '') {
  return `
    <div class="kpi-block" style="cursor:default;">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value" style="font-size:var(--text-2xl);letter-spacing:-.5px;${scoreClass==='score-red'?'color:var(--color-red-text)':scoreClass==='score-orange'?'color:var(--color-orange-text)':scoreClass==='score-green'?'color:var(--color-green-text)':''}">${value}</div>
      ${deltaPct !== null ? `<div class="kpi-delta" style="margin-top:4px;">${deltaHTML(deltaPct, inverseGood)} vs N-1</div>` : '<div style="height:18px;"></div>'}
    </div>
  `;
}

/* ── Tableau ── */
function renderTable(data) {
  if (!data.length) return `<div class="empty-state"><div class="empty-state-title">Aucune donnée ce mois</div></div>`;

  return `
    <div class="table-wrap" style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
      <table id="perf-table" style="min-width:580px;">
        <thead>
          <tr>
            <th style="min-width:120px;">Magasin</th>
            <th>CA</th>
            <th>vs N-1</th>
            <th>Fréquent.</th>
            <th>vs N-1</th>
            <th>Démarque</th>
            <th>vs N-1</th>
            <th>Score</th>
            <th style="width:36px;"></th>
          </tr>
        </thead>
        <tbody>
          ${data.map(r => renderRow(r)).join('')}
        </tbody>
        <tfoot>
          ${renderTotaux(data)}
        </tfoot>
      </table>
    </div>
  `;
}

function renderRow(r) {
  const isEditing = state.saisie?.id === r.id;
  const missing = r.ca === null;

  if (isEditing) return renderRowEdit(r);

  return `
    <tr data-id="${r.id}" class="${missing ? 'never-visited' : ''}">
      <td>
        <div style="font-size:var(--text-sm);font-weight:var(--weight-medium);">${r.magasin}</div>
        ${missing ? `<div style="font-size:var(--text-xs);color:var(--color-orange-text);">Non saisi</div>` : ''}
      </td>
      <td style="font-size:var(--text-sm);font-weight:var(--weight-semi);">
        ${r.ca !== null ? `${(r.ca/1000).toFixed(1)} k€` : '<span style="color:var(--color-text-light);">—</span>'}
      </td>
      <td>${deltaHTML(delta(r.ca, r.ca_n1), false)}</td>
      <td style="font-size:var(--text-sm);">
        ${r.freq !== null ? r.freq.toLocaleString('fr-FR') : '<span style="color:var(--color-text-light);">—</span>'}
      </td>
      <td>${deltaHTML(delta(r.freq, r.freq_n1), false)}</td>
      <td>
        ${r.demarque !== null
          ? `<span style="font-weight:var(--weight-semi);color:${r.demarque>=4?'var(--color-red-text)':r.demarque>=2?'var(--color-orange-text)':'var(--color-green-text)'};">${r.demarque}%</span>`
          : '<span style="color:var(--color-text-light);">—</span>'
        }
      </td>
      <td>${deltaHTML(delta(r.demarque, r.demarque_n1), true)}</td>
      <td>
        ${r.score !== null
          ? `<span class="score-value ${scoreValueClass(r.score)}" style="font-size:var(--text-md);font-weight:var(--weight-bold);">${r.score}</span>`
          : '<span style="color:var(--color-text-light);">—</span>'
        }
      </td>
      <td>
        <div class="hover-actions">
          <button class="icon-btn icon-btn-sm" data-action="edit" data-id="${r.id}" title="Saisir données">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function renderRowEdit(r) {
  return `
    <tr data-id="${r.id}" style="background:var(--color-gold-light);">
      <td style="font-size:var(--text-sm);font-weight:var(--weight-semi);">${r.magasin}</td>
      <td>
        <input type="number" class="form-input" id="edit-ca" value="${r.ca || ''}" placeholder="CA (€)"
          style="width:90px;padding:4px 8px;font-size:var(--text-sm);">
      </td>
      <td style="color:var(--color-text-light);font-size:var(--text-xs);">N-1: ${(r.ca_n1/1000).toFixed(1)}k</td>
      <td>
        <input type="number" class="form-input" id="edit-freq" value="${r.freq || ''}" placeholder="Fréq."
          style="width:80px;padding:4px 8px;font-size:var(--text-sm);">
      </td>
      <td style="color:var(--color-text-light);font-size:var(--text-xs);">N-1: ${r.freq_n1}</td>
      <td>
        <input type="number" step="0.1" class="form-input" id="edit-demarque" value="${r.demarque || ''}" placeholder="%"
          style="width:60px;padding:4px 8px;font-size:var(--text-sm);">
      </td>
      <td style="color:var(--color-text-light);font-size:var(--text-xs);">N-1: ${r.demarque_n1}%</td>
      <td style="color:var(--color-text-light);font-size:var(--text-xs);">${r.score ?? '—'}</td>
      <td>
        <div style="display:flex;gap:4px;">
          <button class="btn btn-primary btn-sm" data-action="save" data-id="${r.id}">✓</button>
          <button class="btn btn-ghost btn-sm" data-action="cancel">✕</button>
        </div>
      </td>
    </tr>
  `;
}

function renderTotaux(data) {
  const tot = totaux(data);
  const scoreMoy = Math.round(data.filter(r => r.score).reduce((s, r) => s + r.score, 0) / (data.filter(r => r.score).length || 1));
  const demarqueMoy = (data.filter(r => r.demarque).reduce((s, r) => s + r.demarque, 0) / (data.filter(r => r.demarque).length || 1)).toFixed(1);

  return `
    <tr style="background:var(--color-hover-bg);font-weight:var(--weight-semi);border-top:2px solid var(--color-border);">
      <td style="font-size:var(--text-sm);color:var(--color-text-mid);">Total / Moyenne</td>
      <td style="font-size:var(--text-sm);">${(tot.ca/1000).toFixed(0)} k€</td>
      <td>${deltaHTML(delta(tot.ca, tot.ca_n1), false)}</td>
      <td style="font-size:var(--text-sm);">${tot.freq.toLocaleString('fr-FR')}</td>
      <td>${deltaHTML(delta(tot.freq, tot.freq_n1), false)}</td>
      <td><span style="font-weight:var(--weight-semi);color:${parseFloat(demarqueMoy)>=4?'var(--color-red-text)':parseFloat(demarqueMoy)>=2?'var(--color-orange-text)':'var(--color-green-text)'};">${demarqueMoy}%</span></td>
      <td></td>
      <td><span class="score-value ${scoreValueClass(scoreMoy)}" style="font-size:var(--text-md);font-weight:var(--weight-bold);">${scoreMoy}</span></td>
      <td></td>
    </tr>
  `;
}

/* ══════════════════════════════════════════
   REFRESH
   ══════════════════════════════════════════ */
function refreshTable() {
  const data = MOCK_PERF[state.moisRef] || [];
  const wrap = document.getElementById('perf-table-wrap');
  if (wrap) { wrap.innerHTML = renderTable(data); bindTableEvents(); }
}

function refreshAll(container) {
  const data = MOCK_PERF[state.moisRef] || [];
  const tot  = totaux(data);
  const scoreMoy = Math.round(data.filter(r => r.score).reduce((s, r) => s + r.score, 0) / (data.filter(r => r.score).length || 1));

  // Titre
  const titre = document.getElementById('perf-titre');
  if (titre) titre.textContent = getMoisLabel(state.moisRef);

  // KPIs
  const kpis = document.querySelectorAll('.kpi-block');
  if (kpis[0]) kpis[0].querySelector('.kpi-value').textContent = `${(tot.ca/1000).toFixed(0)} k€`;
  if (kpis[1]) kpis[1].querySelector('.kpi-value').textContent = tot.freq.toLocaleString('fr-FR');

  refreshTable();
}

/* ══════════════════════════════════════════
   EXPORT CSV
   ══════════════════════════════════════════ */
function exportCSV() {
  const data = MOCK_PERF[state.moisRef] || [];
  const mois = getMoisLabel(state.moisRef);
  const headers = ['Magasin', 'CA (€)', 'CA N-1 (€)', 'Δ CA %', 'Fréquentation', 'Fréq. N-1', 'Δ Fréq %', 'Démarque %', 'Démarque N-1 %', 'Score audit'];
  const rows = data.map(r => [
    r.magasin,
    r.ca ?? '', r.ca_n1,
    r.ca ? delta(r.ca, r.ca_n1) : '',
    r.freq ?? '', r.freq_n1,
    r.freq ? delta(r.freq, r.freq_n1) : '',
    r.demarque ?? '', r.demarque_n1,
    r.score ?? '',
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `performances_${state.moisRef}.csv`; a.click();
  URL.revokeObjectURL(url);
  showToast('Export CSV téléchargé ✓', 'success');
}

/* ══════════════════════════════════════════
   INIT & EVENTS
   ══════════════════════════════════════════ */
export function init(container) {
  // Navigation mois
  container.querySelector('#btn-mois-prev')?.addEventListener('click', () => {
    state.moisRef = getMoisPrev(state.moisRef);
    state.saisie = null;
    refreshAll(container);
  });
  container.querySelector('#btn-mois-next')?.addEventListener('click', () => {
    state.moisRef = getMoisNext(state.moisRef);
    state.saisie = null;
    refreshAll(container);
  });

  // Export
  container.querySelector('#btn-export-perf')?.addEventListener('click', exportCSV);

  bindTableEvents();
}

function bindTableEvents() {
  const table = document.getElementById('perf-table');
  if (!table) return;

  // Bouton crayon → mode saisie
  table.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      state.saisie = { id: btn.dataset.id };
      refreshTable();
    });
  });

  // Sauver
  table.querySelectorAll('[data-action="save"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id   = btn.dataset.id;
      const data = MOCK_PERF[state.moisRef];
      const row  = data?.find(r => r.id === id);
      if (!row) return;

      const ca       = parseFloat(document.getElementById('edit-ca')?.value);
      const freq     = parseInt(document.getElementById('edit-freq')?.value);
      const demarque = parseFloat(document.getElementById('edit-demarque')?.value);

      if (!isNaN(ca))       row.ca       = ca;
      if (!isNaN(freq))     row.freq     = freq;
      if (!isNaN(demarque)) row.demarque = demarque;

      state.saisie = null;
      showToast('Données enregistrées ✓', 'success');
      refreshTable();
    });
  });

  // Annuler
  table.querySelectorAll('[data-action="cancel"]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.saisie = null;
      refreshTable();
    });
  });
}
