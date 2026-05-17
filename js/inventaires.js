/* ============================================================
   ProxiPilot — inventaires.js
   Vue globale secteur · KPIs · Table magasins · Saisie résultats
   ============================================================ */

import { openSidePanel, showToast } from './app.js';
import { shortDate } from './config.js';

/* ══════════════════════════════════════════
   DONNÉES MOCK
   ══════════════════════════════════════════ */
const MOCK_INVENTAIRES = [
  {
    id: 'i1', magasin: 'Casino Sup. Palavas', magasin_id: '1',
    type: 'Cession', statut: 'réalisé',
    date_plan: '2025-11-15', date_reel: '2025-11-15',
    ri: 142500, dmq: 2.1, dmq_connue: true,
    gerant_present: true, pilote: 'Marie Dupont',
    participants: ['Marie Dupont', 'J.-P. Blanc'],
    notes: 'RAS.',
  },
  {
    id: 'i2', magasin: 'Vival Les Arceaux', magasin_id: '2',
    type: 'Contrôle', statut: 'réalisé',
    date_plan: '2025-12-10', date_reel: '2025-12-10',
    ri: 98000, dmq: 1.8, dmq_connue: true,
    gerant_present: false, pilote: 'Marie Dupont',
    participants: ['Marie Dupont'],
    notes: 'Gérant absent.',
  },
  {
    id: 'i3', magasin: 'Spar Lattes', magasin_id: '3',
    type: 'Cession', statut: 'planifié',
    date_plan: '2026-05-24', date_reel: null,
    ri: null, dmq: null, dmq_connue: null,
    gerant_present: null, pilote: 'Marie Dupont',
    participants: ['Marie Dupont', 'K. Benali'],
    notes: '',
  },
  {
    id: 'i4', magasin: 'Vival Les Arceaux', magasin_id: '2',
    type: 'Cession', statut: 'planifié',
    date_plan: '2026-05-28', date_reel: null,
    ri: null, dmq: null, dmq_connue: null,
    gerant_present: null, pilote: 'Marie Dupont',
    participants: ['Marie Dupont'],
    notes: 'Contrôle suite alerte.',
  },
  {
    id: 'i5', magasin: 'Casino Shop Pérols', magasin_id: '4',
    type: 'Contrôle', statut: 'annulé',
    date_plan: '2026-04-15', date_reel: null,
    ri: null, dmq: null, dmq_connue: null,
    gerant_present: null, pilote: 'Marie Dupont',
    participants: ['Marie Dupont'],
    notes: 'Annulé — gérant indisponible.',
  },
  {
    id: 'i6', magasin: 'Carrefour Express Antigone', magasin_id: '5',
    type: 'Cession', statut: 'en_retard',
    date_plan: null, date_reel: null,
    ri: null, dmq: null, dmq_connue: null,
    gerant_present: null, pilote: null,
    participants: [],
    notes: 'Dernier inventaire > 6 mois. À planifier.',
  },
];

/* État saisie résultats */
let formState = {};

/* ══════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════ */
const STATUT_CONFIG = {
  réalisé:   { label: 'Réalisé',    pill: 'pill-green',  dot: 'var(--color-green-text)' },
  planifié:  { label: 'Planifié',   pill: 'pill-blue',   dot: 'var(--color-blue-text)' },
  annulé:    { label: 'Annulé',     pill: 'pill-gray',   dot: 'var(--color-text-light)' },
  en_retard: { label: 'En retard',  pill: 'pill-red',    dot: 'var(--color-red-text)' },
};

function statutPill(statut) {
  const c = STATUT_CONFIG[statut] || { label: statut, pill: 'pill-gray' };
  return `<span class="pill ${c.pill} pill-nodot">${c.label}</span>`;
}

/* ══════════════════════════════════════════
   RENDER PRINCIPAL
   ══════════════════════════════════════════ */
export function render() {
  const planifies  = MOCK_INVENTAIRES.filter(i => i.statut === 'planifié').length;
  const realises   = MOCK_INVENTAIRES.filter(i => i.statut === 'réalisé').length;
  const annules    = MOCK_INVENTAIRES.filter(i => i.statut === 'annulé').length;
  const enRetard   = MOCK_INVENTAIRES.filter(i => i.statut === 'en_retard').length;
  const total      = realises + annules;
  const taux       = total > 0 ? Math.round(realises / total * 100) : 0;

  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">Inventaires</h1>
        <p class="page-subtitle">Secteur Sud Est — ${MOCK_INVENTAIRES.length} inventaires</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" id="btn-export-inv">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export planning
        </button>
        <button class="btn btn-primary btn-sm" id="btn-new-inv">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Planifier
        </button>
      </div>
    </div>

    <!-- KPIs -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-3);margin-bottom:var(--space-6);">
      ${kpiInv('Planifiés',  planifies, 'var(--color-blue-text)',   'var(--color-blue-bg)')}
      ${kpiInv('Réalisés',   realises,  'var(--color-green-text)',  'var(--color-green-bg)')}
      ${kpiInv('Annulés',    annules,   'var(--color-text-light)',  'var(--color-hover-bg)')}
      ${kpiInv('En retard',  enRetard,  'var(--color-red-text)',    'var(--color-red-bg)')}
    </div>

    <!-- Alerte retards -->
    ${enRetard > 0 ? `
      <div style="background:var(--color-red-bg);border:1px solid var(--color-red-border);border-radius:var(--radius-lg);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-5);display:flex;align-items:center;gap:var(--space-3);">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="color:var(--color-red-text);flex-shrink:0;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <div>
          <div style="font-size:var(--text-sm);font-weight:var(--weight-semi);color:var(--color-red-text);">${enRetard} magasin${enRetard>1?'s':''} en retard d'inventaire</div>
          <div style="font-size:var(--text-xs);color:var(--color-red-text);opacity:.8;">Seuil dépassé (> 6 mois sans inventaire réalisé)</div>
        </div>
        <button class="btn btn-sm" style="margin-left:auto;flex-shrink:0;background:var(--color-red-bg);color:var(--color-red-text);border:1px solid var(--color-red-border);" id="btn-filter-retard">
          Voir
        </button>
      </div>
    ` : ''}

    <!-- Filtres rapides -->
    <div class="filter-bar" style="margin-bottom:var(--space-4);" id="inv-filters">
      <div class="chip active" data-filter="tous">Tous</div>
      <div class="chip" data-filter="planifié">Planifiés</div>
      <div class="chip" data-filter="réalisé">Réalisés</div>
      <div class="chip" data-filter="en_retard">En retard</div>
      <div class="chip" data-filter="annulé">Annulés</div>
    </div>

    <!-- Tableau -->
    <div id="inv-table-wrap">
      ${renderTable(MOCK_INVENTAIRES)}
    </div>
  `;
}

function kpiInv(label, value, color, bg) {
  return `
    <div style="background:${bg};border-radius:var(--radius-lg);padding:var(--space-4);text-align:center;">
      <div style="font-size:var(--text-2xl);font-weight:var(--weight-bold);color:${color};line-height:1;">${value}</div>
      <div style="font-size:var(--text-xs);color:${color};margin-top:4px;opacity:.8;">${label}</div>
    </div>
  `;
}

/* ── Tableau ── */
function renderTable(data) {
  if (!data.length) return `<div class="empty-state"><div class="empty-state-title">Aucun inventaire trouvé</div></div>`;

  return `
    <div class="table-wrap">
      <table id="inv-table">
        <thead>
          <tr>
            <th>Magasin</th>
            <th>Type</th>
            <th>Date planifiée</th>
            <th>Date réelle</th>
            <th>RI</th>
            <th>DMQ</th>
            <th>Gérant</th>
            <th>Statut</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${data.map(i => renderRow(i)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderRow(i) {
  const isRetard = i.statut === 'en_retard';
  return `
    <tr data-id="${i.id}" class="${isRetard ? 'never-visited' : ''}" style="cursor:pointer;">
      <td>
        <div style="font-size:var(--text-sm);font-weight:var(--weight-medium);">${i.magasin}</div>
        ${i.pilote ? `<div style="font-size:var(--text-xs);color:var(--color-text-light);">${i.pilote}</div>` : ''}
      </td>
      <td style="font-size:var(--text-sm);color:var(--color-text-mid);">${i.type}</td>
      <td style="font-size:var(--text-sm);">${i.date_plan ? shortDate(i.date_plan) : '<span style="color:var(--color-red-text);">Non planifié</span>'}</td>
      <td style="font-size:var(--text-sm);color:var(--color-text-mid);">${i.date_reel ? shortDate(i.date_reel) : '—'}</td>
      <td style="font-size:var(--text-sm);">
        ${i.ri !== null ? `<span style="font-weight:var(--weight-semi);">${(i.ri/1000).toFixed(0)} k€</span>` : '<span style="color:var(--color-text-light);">—</span>'}
      </td>
      <td>
        ${i.dmq !== null
          ? `<span style="font-weight:var(--weight-semi);color:${i.dmq>=4?'var(--color-red-text)':i.dmq>=2?'var(--color-orange-text)':'var(--color-green-text)'};">${i.dmq}%</span>
             <span style="font-size:var(--text-xs);color:var(--color-text-light);margin-left:3px;">${i.dmq_connue?'connue':'inconnue'}</span>`
          : '<span style="color:var(--color-text-light);">—</span>'
        }
      </td>
      <td style="font-size:var(--text-sm);">
        ${i.gerant_present !== null
          ? `<span style="color:${i.gerant_present?'var(--color-green-text)':'var(--color-red-text)'};">${i.gerant_present?'Présent':'Absent'}</span>`
          : '<span style="color:var(--color-text-light);">—</span>'
        }
      </td>
      <td>${statutPill(i.statut)}</td>
      <td>
        <div class="hover-actions">
          ${i.statut === 'planifié'
            ? `<button class="btn btn-primary btn-sm" data-action="saisir" data-id="${i.id}">Saisir résultats</button>`
            : i.statut === 'en_retard'
            ? `<button class="btn btn-secondary btn-sm" data-action="planifier" data-id="${i.id}">Planifier →</button>`
            : `<button class="btn btn-ghost btn-sm" data-action="detail" data-id="${i.id}">Voir</button>`
          }
        </div>
      </td>
    </tr>
  `;
}

/* ══════════════════════════════════════════
   PANNEAU SAISIE RÉSULTATS
   ══════════════════════════════════════════ */
function renderSaisieResultats(inv) {
  return `
    <div style="display:flex;flex-direction:column;gap:var(--space-4);">

      <!-- Rappel inventaire -->
      <div style="background:var(--color-hover-bg);border-radius:var(--radius-lg);padding:var(--space-3) var(--space-4);">
        <div style="font-size:var(--text-sm);font-weight:var(--weight-semi);color:var(--color-text-dark);">${inv.magasin}</div>
        <div style="font-size:var(--text-xs);color:var(--color-text-light);">${inv.type} · ${shortDate(inv.date_plan)} · ${inv.pilote}</div>
        ${inv.participants.length > 1 ? `<div style="font-size:var(--text-xs);color:var(--color-text-light);">${inv.participants.join(', ')}</div>` : ''}
      </div>

      <!-- Date réelle -->
      <div class="form-group">
        <label class="form-label required">Date de réalisation</label>
        <input type="date" class="form-input" id="sr-date" value="${inv.date_plan || ''}">
      </div>

      <!-- RI -->
      <div class="form-group">
        <label class="form-label required">Résultat d'inventaire (RI) en €</label>
        <input type="number" class="form-input" id="sr-ri" placeholder="Ex: 142500" min="0">
        <div class="form-hint">Valeur totale du stock compté</div>
      </div>

      <!-- DMQ -->
      <div style="display:flex;flex-direction:column;gap:var(--space-3);">
        <label class="form-label">Démarque inconnue (DMQ)</label>
        <div style="display:flex;gap:var(--space-2);">
          <label style="flex:1;display:flex;align-items:center;gap:var(--space-2);background:var(--color-hover-bg);border-radius:var(--radius-md);padding:var(--space-2) var(--space-3);cursor:pointer;">
            <input type="radio" name="dmq-type" id="dmq-connue" value="connue" checked>
            <span style="font-size:var(--text-sm);">DMQ connue</span>
          </label>
          <label style="flex:1;display:flex;align-items:center;gap:var(--space-2);background:var(--color-hover-bg);border-radius:var(--radius-md);padding:var(--space-2) var(--space-3);cursor:pointer;">
            <input type="radio" name="dmq-type" id="dmq-inconnue" value="inconnue">
            <span style="font-size:var(--text-sm);">DMQ inconnue</span>
          </label>
        </div>
        <div id="dmq-connue-wrap">
          <input type="number" step="0.1" class="form-input" id="sr-dmq" placeholder="Ex: 2.1" min="0" max="100">
          <div class="form-hint">Pourcentage de démarque calculé</div>
        </div>
        <div id="dmq-inconnue-wrap" style="display:none;">
          <div style="background:var(--color-orange-bg);border:1px solid var(--color-orange-border);border-radius:var(--radius-md);padding:var(--space-3);font-size:var(--text-xs);color:var(--color-orange-text);">
            La DMQ sera marquée comme inconnue. Une alerte sera créée si le seuil est atteint.
          </div>
        </div>
      </div>

      <!-- Gérant présent -->
      <label class="toggle-wrap">
        <div class="toggle">
          <input type="checkbox" id="sr-gerant" checked>
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </div>
        <span style="font-size:var(--text-sm);">Gérant présent lors de l'inventaire</span>
      </label>

      <!-- Notes -->
      <div class="form-group">
        <label class="form-label">Observations</label>
        <textarea class="form-textarea" id="sr-notes" placeholder="Anomalies, commentaires…"></textarea>
      </div>

      <hr class="divider">

      <div style="display:flex;gap:var(--space-2);">
        <button class="btn btn-ghost" id="btn-annuler-sr" style="flex:1;justify-content:center;">Annuler</button>
        <button class="btn btn-primary" id="btn-sauver-sr" data-id="${inv.id}" style="flex:2;justify-content:center;">
          Enregistrer les résultats
        </button>
      </div>
    </div>
  `;
}

/* ── Panneau détail inventaire ── */
function renderDetail(inv) {
  const rows = [
    ['Magasin',      inv.magasin],
    ['Type',         inv.type],
    ['Date planif.', inv.date_plan ? shortDate(inv.date_plan) : '—'],
    ['Date réelle',  inv.date_reel ? shortDate(inv.date_reel) : '—'],
    ['Pilote',       inv.pilote || '—'],
    ['Participants', inv.participants.join(', ') || '—'],
    ['RI',           inv.ri !== null ? (inv.ri/1000).toFixed(0)+' k€' : '—'],
    ['DMQ',          inv.dmq !== null ? inv.dmq+'% ('+(inv.dmq_connue?'connue':'inconnue')+')' : '—'],
    ['Gérant',       inv.gerant_present !== null ? (inv.gerant_present?'Présent':'Absent') : '—'],
  ];

  return `
    <div style="display:flex;flex-direction:column;gap:var(--space-3);">
      <div>${statutPill(inv.statut)}</div>
      ${rows.map(([label, val]) => `
        <div style="display:flex;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid var(--color-border);font-size:var(--text-sm);">
          <span style="color:var(--color-text-light);">${label}</span>
          <span style="font-weight:var(--weight-medium);text-align:right;max-width:200px;">${val}</span>
        </div>
      `).join('')}
      ${inv.notes ? `<div style="font-size:var(--text-sm);color:var(--color-text-mid);margin-top:var(--space-2);">${inv.notes}</div>` : ''}
    </div>
  `;
}

/* ══════════════════════════════════════════
   FILTRES
   ══════════════════════════════════════════ */
function filteredData(filter) {
  if (filter === 'tous') return MOCK_INVENTAIRES;
  return MOCK_INVENTAIRES.filter(i => i.statut === filter);
}

function refreshTable(filter = 'tous') {
  const wrap = document.getElementById('inv-table-wrap');
  if (wrap) { wrap.innerHTML = renderTable(filteredData(filter)); bindTableEvents(); }
}

/* ══════════════════════════════════════════
   INIT & EVENTS
   ══════════════════════════════════════════ */
export function init(container) {
  // Filtres chips
  container.querySelector('#inv-filters')?.addEventListener('click', e => {
    const chip = e.target.closest('[data-filter]');
    if (!chip) return;
    container.querySelectorAll('#inv-filters .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    refreshTable(chip.dataset.filter);
  });

  // Bouton filtre retard (depuis alerte)
  container.querySelector('#btn-filter-retard')?.addEventListener('click', () => {
    container.querySelectorAll('#inv-filters .chip').forEach(c => c.classList.remove('active'));
    container.querySelector('[data-filter="en_retard"]')?.classList.add('active');
    refreshTable('en_retard');
  });

  // Planifier → Planning
  container.querySelector('#btn-new-inv')?.addEventListener('click', () => {
    import('./app.js').then(m => m.navigate('planning'));
  });

  // Export planning
  container.querySelector('#btn-export-inv')?.addEventListener('click', () => {
    exportPlanning();
  });

  bindTableEvents();
}

function bindTableEvents() {
  const table = document.getElementById('inv-table');
  if (!table) return;

  // Clic ligne → détail
  table.querySelectorAll('tbody tr[data-id]').forEach(tr => {
    tr.addEventListener('click', e => {
      if (e.target.closest('[data-action]')) return;
      const inv = MOCK_INVENTAIRES.find(i => i.id === tr.dataset.id);
      if (!inv) return;
      openSidePanel({
        id: `inv-${inv.id}`,
        title: `${inv.magasin} — ${inv.type}`,
        content: renderDetail(inv),
      });
    });
  });

  // Bouton Saisir résultats
  table.querySelectorAll('[data-action="saisir"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const inv = MOCK_INVENTAIRES.find(i => i.id === btn.dataset.id);
      if (!inv) return;
      openSidePanel({
        id: `saisir-${inv.id}`,
        title: `Saisir résultats — ${inv.magasin}`,
        content: renderSaisieResultats(inv),
      });
      setTimeout(() => bindSaisieEvents(inv), 0);
    });
  });

  // Bouton Planifier (retard)
  table.querySelectorAll('[data-action="planifier"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      import('./app.js').then(m => m.navigate('planning'));
    });
  });

  // Bouton Voir
  table.querySelectorAll('[data-action="detail"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const inv = MOCK_INVENTAIRES.find(i => i.id === btn.dataset.id);
      if (!inv) return;
      openSidePanel({
        id: `inv-${inv.id}`,
        title: `${inv.magasin} — ${inv.type}`,
        content: renderDetail(inv),
      });
    });
  });
}

function bindSaisieEvents(inv) {
  const panel = document.getElementById('side-panel-body');
  if (!panel) return;

  // Toggle DMQ connue/inconnue
  panel.querySelectorAll('input[name="dmq-type"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const isConnue = panel.querySelector('#dmq-connue')?.checked;
      panel.querySelector('#dmq-connue-wrap').style.display  = isConnue ? '' : 'none';
      panel.querySelector('#dmq-inconnue-wrap').style.display = isConnue ? 'none' : '';
    });
  });

  // Annuler
  panel.querySelector('#btn-annuler-sr')?.addEventListener('click', () => {
    document.getElementById('side-panel')?.classList.remove('open');
    document.getElementById('panel-overlay')?.classList.remove('open');
  });

  // Sauver
  panel.querySelector('#btn-sauver-sr')?.addEventListener('click', () => {
    const ri    = parseFloat(panel.querySelector('#sr-ri')?.value);
    const date  = panel.querySelector('#sr-date')?.value;

    if (!date) { showToast('Sélectionnez une date', 'error'); return; }
    if (isNaN(ri) || ri <= 0) { showToast('Saisissez un RI valide', 'error'); return; }

    const dmqConnue = panel.querySelector('#dmq-connue')?.checked;
    const dmq       = dmqConnue ? parseFloat(panel.querySelector('#sr-dmq')?.value) : null;
    const gerant    = panel.querySelector('#sr-gerant')?.checked;
    const notes     = panel.querySelector('#sr-notes')?.value || '';

    // Mise à jour mock
    const idx = MOCK_INVENTAIRES.findIndex(i => i.id === inv.id);
    if (idx !== -1) {
      MOCK_INVENTAIRES[idx] = {
        ...MOCK_INVENTAIRES[idx],
        statut: 'réalisé',
        date_reel: date,
        ri, dmq: dmqConnue ? (isNaN(dmq) ? null : dmq) : null,
        dmq_connue: dmqConnue,
        gerant_present: gerant,
        notes,
      };
    }

    showToast('Résultats enregistrés ✓', 'success');
    document.getElementById('side-panel')?.classList.remove('open');
    document.getElementById('panel-overlay')?.classList.remove('open');

    // Refresh table
    const activeChip = document.querySelector('#inv-filters .chip.active');
    refreshTable(activeChip?.dataset.filter || 'tous');
  });
}

/* ══════════════════════════════════════════
   EXPORT PLANNING CSV
   ══════════════════════════════════════════ */
function exportPlanning() {
  const headers = ['Magasin', 'Type', 'Date planifiée', 'Pilote', 'Participants', 'Statut'];
  const rows = MOCK_INVENTAIRES.map(i => [
    i.magasin, i.type,
    i.date_plan ? shortDate(i.date_plan) : '—',
    i.pilote || '—',
    i.participants.join(' / '),
    STATUT_CONFIG[i.statut]?.label || i.statut,
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `planning_inventaires_proxipilot.csv`; a.click();
  URL.revokeObjectURL(url);
  showToast('Export téléchargé ✓', 'success');
}
