/* ============================================================
   ProxiPilot — dashboard.js
   Tableau de bord : 4 KPIs + grille 2 colonnes + bottom row
   ============================================================ */

import { AppState, openSidePanel, showToast, navigate } from './app.js';
import { scoreClass, scoreValueClass, scoreLabel, relativeDate, shortDate } from './config.js';
import { getDashboardData } from './supabase.js';

/* ══════════════════════════════════════════
   DONNÉES MOCK (remplacées par Supabase Phase 2)
   ══════════════════════════════════════════ */
const MOCK = {
  kpis: {
    alertes:    { value: 7,    delta: +2,    deltaLabel: '+2 hier' },
    couverture: { value: 78,   delta: -3,    deltaLabel: '-3% sem.' },
    score:      { value: 82,   delta: +1.5,  deltaLabel: '+1.5 pts' },
    ca:         { value: 142,  delta: +4.2,  deltaLabel: '+4.2% N-1', unit: 'k€' },
  },

  priorites: [
    { id: '1', nom: 'Carrefour Express Antigone', ville: 'Montpellier', jours: null,  score: null,  alerte: 'Jamais visité', neverVisited: true },
    { id: '2', nom: 'Casino Sup. Palavas',         ville: 'Palavas',     jours: 19,    score: 54,    alerte: 'En retard — score urgent' },
    { id: '3', nom: 'Vival Les Arceaux',           ville: 'Montpellier', jours: 17,    score: 71,    alerte: 'Démarque 5.2%' },
    { id: '4', nom: 'Spar Lattes',                 ville: 'Lattes',      jours: 16,    score: 68,    alerte: 'Alerte HACCP ouverte' },
    { id: '5', nom: 'Casino Shop Pérols',          ville: 'Pérols',      jours: 15,    score: 74,    alerte: 'DLC non conforme' },
  ],

  aujourdhui: [
    { type: 'visite',    heure: '09:00', label: 'Visite — Casino Sup. Palavas', sub: 'Planifiée' },
    { type: 'inventaire',heure: '14:00', label: 'Cession — Spar Lattes',        sub: 'Avec M. Dupont' },
    { type: 'rappel',    heure: 'J-3',   label: 'Inventaire prévu sam. 24/05',  sub: 'Vival Pézenas' },
  ],

  alertes: [
    { id: 'a1', magasin: 'Casino Sup. Palavas', type: 'HACCP',      age: 8,  relance: 2, statut: 'pill-red' },
    { id: 'a2', magasin: 'Carrefour Antigone',  type: 'DLC',         age: 5,  relance: 1, statut: 'pill-orange' },
    { id: 'a3', magasin: 'Vival Les Arceaux',   type: 'Démarque',    age: 3,  relance: 0, statut: 'pill-orange' },
  ],

  performances: [
    { label: 'CA secteur',    value: '142 k€', delta: '+4.2%', up: true },
    { label: 'Fréquentation', value: '3 820',  delta: '+1.8%', up: true },
    { label: 'Démarque moy.', value: '3.1%',   delta: '+0.4%', up: false },
  ],

  inventaires: [
    { magasin: 'Spar Lattes',    date: '2026-05-24', type: 'Cession' },
    { magasin: 'Vival Pézenas',  date: '2026-05-28', type: 'Contrôle' },
    { magasin: 'Casino Antigone',date: '2026-05-10', type: 'Cession',  enRetard: true },
  ],

  actions: {
    alertes: 7,
    actionsOuvertes: 12,
    plusVieilles: [
      { id: 'a1', magasin: 'Casino Sup. Palavas', label: 'HACCP non conforme', age: 8 },
      { id: 'a2', magasin: 'Carrefour Antigone',  label: 'DLC dépassée',       age: 5 },
    ],
  },
};

/* ══════════════════════════════════════════
   RENDER
   ══════════════════════════════════════════ */
export function render() {
  const isAdmin = AppState.user?.role === 'admin';

  return `
    <!-- Sélecteur scope admin -->
    ${isAdmin ? renderScopeSelector() : ''}

    <!-- KPIs -->
    ${renderKPIs()}

    <!-- Grille principale 2 colonnes -->
    <div class="grid-2 section-gap" style="align-items: start;">
      ${renderPriorites()}
      <div style="display:flex; flex-direction:column; gap: var(--space-5);">
        ${renderAujourdhui()}
        ${renderAlertesWidget()}
      </div>
    </div>

    <!-- Bottom row 3 widgets -->
    <div class="grid-3" style="margin-top: var(--space-5);">
      ${renderPerformances()}
      ${renderInventairesWidget()}
      ${renderActionsWidget()}
    </div>
  `;
}

/* ── Scope selector ── */
function renderScopeSelector() {
  return `
    <div style="display:flex; justify-content:flex-end; margin-bottom: var(--space-4);">
      <div class="scope-selector" id="scope-selector">
        <div class="scope-btn active" data-scope="secteur">Mon secteur</div>
        <div class="scope-btn" data-scope="groupe">Groupe</div>
        <div class="scope-btn" data-scope="moniteur">Par moniteur</div>
      </div>
    </div>
  `;
}

/* ── KPIs ── */
function renderKPIs() {
  const { alertes, couverture, score, ca } = MOCK.kpis;

  return `
    <div class="kpi-grid section-gap-lg">
      ${kpiBlock({
        label: 'Alertes actives',
        value: alertes.value,
        delta: alertes.delta,
        deltaLabel: alertes.deltaLabel,
        page: 'alertes',
        icon: 'bell',
        forceRed: alertes.value > 0,
      })}
      ${kpiBlock({
        label: 'Couverture secteur',
        value: couverture.value + '%',
        delta: couverture.delta,
        deltaLabel: couverture.deltaLabel,
        page: 'magasins',
        bar: couverture.value,
      })}
      ${kpiBlock({
        label: 'Score moyen audit',
        value: score.value,
        delta: score.delta,
        deltaLabel: score.deltaLabel,
        page: 'visites',
        suffix: '/100',
      })}
      ${kpiBlock({
        label: 'CA secteur',
        value: ca.value + ' ' + ca.unit,
        delta: ca.delta,
        deltaLabel: ca.deltaLabel,
        page: 'performances',
      })}
    </div>
  `;
}

function kpiBlock({ label, value, delta, deltaLabel, page, bar, suffix, icon, forceRed }) {
  const isUp = delta > 0;
  const isDown = delta < 0;
  const deltaClass = forceRed ? 'down' : (isUp ? 'up' : isDown ? 'down' : 'flat');
  const arrow = isUp ? '↑' : isDown ? '↓' : '→';

  return `
    <div class="kpi-block" data-nav="${page}" title="Voir ${page}">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value">${value}${suffix ? `<span style="font-size:var(--text-lg);font-weight:var(--weight-medium);color:var(--color-text-light);margin-left:2px;">${suffix}</span>` : ''}</div>
      <div class="kpi-delta ${deltaClass}">${arrow} ${deltaLabel}</div>
      ${bar !== undefined ? `<div class="kpi-bar"><div class="kpi-bar-fill" style="width:${bar}%"></div></div>` : ''}
    </div>
  `;
}

/* ── Priorités tournée ── */
function renderPriorites() {
  return `
    <div class="card">
      <div class="widget-header">
        <span class="widget-title" data-nav="magasins">Priorités tournée</span>
        <span class="widget-meta">${MOCK.priorites.length} magasins</span>
      </div>

      <div style="display:flex; flex-direction:column;">
        ${MOCK.priorites.map((m, i) => renderPrioriteRow(m, i)).join('')}
      </div>
    </div>
  `;
}

function renderPrioriteRow(m, i) {
  const bg = m.neverVisited ? 'background:#FDF5F5;' : '';
  const joursLabel = m.jours === null ? '—' : `${m.jours}j`;
  const scoreHTML = m.score === null
    ? `<span style="color:var(--color-text-light);font-size:var(--text-xs);">—</span>`
    : `<span class="score-value ${scoreValueClass(m.score)}" style="font-size:var(--text-base); font-weight:var(--weight-semi);">${m.score}</span>`;

  return `
    <div class="widget-row" style="${bg}" data-store="${m.id}">
      <div style="
        width: 22px; min-width:22px; height:22px;
        background: var(--color-hover-bg);
        border-radius: 50%;
        display:flex; align-items:center; justify-content:center;
        font-size:var(--text-xs); font-weight:var(--weight-semi);
        color:var(--color-text-light);
      ">${i + 1}</div>

      <div style="flex:1; min-width:0;">
        <div style="font-size:var(--text-base); font-weight:var(--weight-medium); color:var(--color-text-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          ${m.nom}
          ${m.neverVisited ? `<span style="
            display:inline-block;
            background:var(--color-red-bg);
            color:var(--color-red-text);
            font-size:9px;
            font-weight:var(--weight-semi);
            padding:1px 5px;
            border-radius:var(--radius-full);
            margin-left:var(--space-1);
            vertical-align:middle;
          ">JAMAIS VISITÉ</span>` : ''}
        </div>
        <div style="font-size:var(--text-xs); color:var(--color-text-light);">
          ${m.ville} ${m.alerte ? `· <span style="color:var(--color-orange-text);">${m.alerte}</span>` : ''}
        </div>
      </div>

      <div style="text-align:right; flex-shrink:0;">
        <div>${scoreHTML}</div>
        <div style="font-size:var(--text-xs); color:${m.jours > 16 ? 'var(--color-red-text)' : 'var(--color-text-light)'};">${joursLabel}</div>
      </div>

      <div class="hover-actions">
        <button class="btn btn-secondary btn-sm" data-action="visite" data-store="${m.id}">Visiter</button>
      </div>
    </div>
  `;
}

/* ── Aujourd'hui ── */
function renderAujourdhui() {
  const typeColors = {
    visite:     'var(--color-gold)',
    inventaire: 'var(--event-cession)',
    rappel:     'var(--color-blue-text)',
  };

  return `
    <div class="card card-sm">
      <div class="widget-header">
        <span class="widget-title" data-nav="planning">Aujourd'hui</span>
        <span class="widget-meta">Dim. 17 mai</span>
      </div>
      ${MOCK.aujourdhui.length === 0
        ? `<div style="color:var(--color-text-light); font-size:var(--text-sm); padding: var(--space-2) 0;">Rien de planifié.</div>`
        : MOCK.aujourdhui.map(ev => `
          <div class="widget-row" style="align-items:flex-start;">
            <div style="
              width: 3px; min-width:3px; height:32px; border-radius:2px;
              background:${typeColors[ev.type] || 'var(--color-border)'};
              margin-top:2px;
            "></div>
            <div style="flex:1;">
              <div style="font-size:var(--text-base); font-weight:var(--weight-medium); color:var(--color-text-dark);">
                ${ev.label}
              </div>
              <div style="font-size:var(--text-xs); color:var(--color-text-light);">
                ${ev.heure} · ${ev.sub}
              </div>
            </div>
          </div>
        `).join('')
      }
    </div>
  `;
}

/* ── Alertes widget ── */
function renderAlertesWidget() {
  return `
    <div class="card card-sm">
      <div class="widget-header">
        <span class="widget-title" data-nav="alertes">Alertes récentes</span>
        <span class="widget-meta">${MOCK.alertes.length} actives</span>
      </div>
      ${MOCK.alertes.map(a => `
        <div class="widget-row" data-alert="${a.id}">
          <div style="flex:1; min-width:0;">
            <div style="font-size:var(--text-sm); font-weight:var(--weight-medium); color:var(--color-text-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${a.magasin}
            </div>
            <div style="font-size:var(--text-xs); color:var(--color-text-light);">${a.type}</div>
          </div>
          <div style="text-align:right; flex-shrink:0;">
            <div style="font-size:var(--text-xs); color:${a.age >= 7 ? 'var(--color-red-text)' : a.age >= 4 ? 'var(--color-orange-text)' : 'var(--color-text-light)'}; font-weight:var(--weight-medium);">
              ${a.age}j
            </div>
            <div style="font-size:var(--text-xs); color:var(--color-text-light);">${a.relance} relance${a.relance > 1 ? 's' : ''}</div>
          </div>
          <div class="hover-actions">
            <button class="btn btn-secondary btn-sm" data-action="relancer" data-alert="${a.id}">Relancer</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/* ── Performances ── */
function renderPerformances() {
  return `
    <div class="card card-sm">
      <div class="widget-header">
        <span class="widget-title" data-nav="performances">Performances</span>
        <span class="widget-meta">Mai 2026</span>
      </div>
      ${MOCK.performances.map(p => `
        <div class="widget-row" style="cursor:default;">
          <div style="flex:1; font-size:var(--text-sm); color:var(--color-text-mid);">${p.label}</div>
          <div style="text-align:right; flex-shrink:0;">
            <span style="font-size:var(--text-md); font-weight:var(--weight-semi); color:var(--color-text-dark);">${p.value}</span>
            <span style="
              font-size:var(--text-xs);
              font-weight:var(--weight-medium);
              color:${p.up ? 'var(--color-green-text)' : 'var(--color-red-text)'};
              margin-left:var(--space-2);
            ">${p.up ? '↑' : '↓'} ${p.delta}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/* ── Inventaires ── */
function renderInventairesWidget() {
  const prochains = MOCK.inventaires.filter(i => !i.enRetard);
  const enRetard  = MOCK.inventaires.filter(i => i.enRetard);

  return `
    <div class="card card-sm">
      <div class="widget-header">
        <span class="widget-title" data-nav="inventaires">Inventaires</span>
        <span class="widget-meta">${prochains.length} à venir</span>
      </div>
      ${prochains.map(inv => `
        <div class="widget-row" data-inv="${inv.magasin}">
          <div style="flex:1; min-width:0;">
            <div style="font-size:var(--text-sm); font-weight:var(--weight-medium); color:var(--color-text-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${inv.magasin}
            </div>
            <div style="font-size:var(--text-xs); color:var(--color-text-light);">${inv.type}</div>
          </div>
          <div style="font-size:var(--text-xs); color:var(--color-text-mid); flex-shrink:0;">
            ${shortDate(inv.date)}
          </div>
        </div>
      `).join('')}
      ${enRetard.map(inv => `
        <div class="widget-row" data-inv="${inv.magasin}" style="background:var(--color-red-bg);">
          <div style="flex:1; min-width:0;">
            <div style="font-size:var(--text-sm); font-weight:var(--weight-medium); color:var(--color-red-text);">
              ${inv.magasin}
            </div>
            <div style="font-size:var(--text-xs); color:var(--color-red-text);">En retard — ${inv.type}</div>
          </div>
          <span class="pill pill-red pill-nodot" style="font-size:9px;">RETARD</span>
        </div>
      `).join('')}
    </div>
  `;
}

/* ── Actions ouvertes ── */
function renderActionsWidget() {
  const { alertes, actionsOuvertes, plusVieilles } = MOCK.actions;

  return `
    <div class="card card-sm">
      <div class="widget-header">
        <span class="widget-title" data-nav="alertes">Actions ouvertes</span>
      </div>

      <div style="display:flex; gap:var(--space-4); margin-bottom:var(--space-4);">
        <div style="flex:1; background:var(--color-red-bg); border-radius:var(--radius-md); padding:var(--space-3); text-align:center;">
          <div style="font-size:var(--text-2xl); font-weight:var(--weight-bold); color:var(--color-red-text);">${alertes}</div>
          <div style="font-size:var(--text-xs); color:var(--color-red-text);">Alertes</div>
        </div>
        <div style="flex:1; background:var(--color-orange-bg); border-radius:var(--radius-md); padding:var(--space-3); text-align:center;">
          <div style="font-size:var(--text-2xl); font-weight:var(--weight-bold); color:var(--color-orange-text);">${actionsOuvertes}</div>
          <div style="font-size:var(--text-xs); color:var(--color-orange-text);">Actions</div>
        </div>
      </div>

      <div style="font-size:var(--text-xs); font-weight:var(--weight-semi); color:var(--color-text-light); text-transform:uppercase; letter-spacing:.05em; margin-bottom:var(--space-2);">
        Les plus anciennes
      </div>

      ${plusVieilles.map(a => `
        <div class="widget-row" data-alert="${a.id}">
          <div style="flex:1; min-width:0;">
            <div style="font-size:var(--text-sm); font-weight:var(--weight-medium); color:var(--color-text-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${a.magasin}
            </div>
            <div style="font-size:var(--text-xs); color:var(--color-text-light);">${a.label}</div>
          </div>
          <div style="font-size:var(--text-xs); font-weight:var(--weight-semi); color:var(--color-red-text); flex-shrink:0;">
            ${a.age}j
          </div>
          <div class="hover-actions">
            <button class="btn btn-secondary btn-sm">Voir</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/* ══════════════════════════════════════════
   INIT — events
   ══════════════════════════════════════════ */
export function init(container) {
  // Inject scope selector dans topbar si admin
  if (AppState.user?.role === 'admin') {
    const slot = document.getElementById('scope-selector-slot');
    if (slot) {
      slot.innerHTML = `
        <div class="scope-selector" id="topbar-scope">
          <div class="scope-btn active" data-scope="secteur">Mon secteur</div>
          <div class="scope-btn" data-scope="groupe">Groupe</div>
          <div class="scope-btn" data-scope="moniteur">Par moniteur</div>
        </div>
      `;
      document.getElementById('topbar-scope')?.addEventListener('click', e => {
        const btn = e.target.closest('.scope-btn');
        if (!btn) return;
        document.querySelectorAll('#topbar-scope .scope-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        AppState.scope = btn.dataset.scope;
        showToast(`Vue : ${btn.textContent}`, 'default', 2000);
      });
    }
    // Masquer scope inline dans la page (doublon)
    container.querySelector('#scope-selector')?.remove();
  }

  // KPI nav
  container.querySelectorAll('.kpi-block[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      import('./app.js').then(m => m.navigate(el.dataset.nav));
    });
  });

  // Widget titles nav
  container.querySelectorAll('.widget-title[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      import('./app.js').then(m => m.navigate(el.dataset.nav));
    });
  });

  // Ligne store → panneau
  container.querySelectorAll('[data-store]').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('[data-action]')) return; // bouton hover
      const storeId = el.dataset.store;
      openStorePanelMock(storeId);
    });
  });

  // Ligne alerte → panneau
  container.querySelectorAll('[data-alert]').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('[data-action]')) return;
      openSidePanel({
        id: el.dataset.alert,
        title: 'Détail alerte',
        content: `<p style="color:var(--color-text-mid);font-size:var(--text-sm);">
          Détails de l'alerte — sera connecté à Supabase en Phase 2.
        </p>`,
      });
    });
  });

  // Bouton Visiter
  container.querySelectorAll('[data-action="visite"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      showToast('Création de visite — Phase 2', 'default');
    });
  });

  // Bouton Relancer
  container.querySelectorAll('[data-action="relancer"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      showToast('Relance enregistrée ✓', 'success');
    });
  });

  // ── Chargement données réelles Supabase ──
  loadSupabaseData(container);
}

async function loadSupabaseData(container) {
  try {
    const data = await getDashboardData();

    // ── KPIs ──
    // Alertes
    const kpiAlertes = container.querySelector('[data-nav="alertes"] .kpi-value');
    if (kpiAlertes) kpiAlertes.textContent = data.alertes.length;

    // Couverture
    const kpiCouv = container.querySelector('[data-nav="magasins"] .kpi-value');
    if (kpiCouv) kpiCouv.textContent = data.couverture + '%';

    // Score moyen
    const kpiScore = container.querySelector('[data-nav="visites"] .kpi-value');
    if (kpiScore) kpiScore.textContent = data.scoreMoy + '/100';

    // CA
    const kpiCA = container.querySelector('[data-nav="performances"] .kpi-value');
    if (kpiCA) kpiCA.textContent = (data.caSecteur / 1000).toFixed(0) + ' k€';

    // ── Priorités tournée ──
    const prioritesList = container.querySelector('.priorites-list');
    if (prioritesList && data.priorites.length) {
      prioritesList.innerHTML = data.priorites.map((m, i) => {
        const jours = m.joursDepuis === 999 ? null : m.joursDepuis;
        const derniereVisite = m.derniereVisite;
        const score = derniereVisite?.score_audit ?? null;
        const alerte = m.joursDepuis === 999 ? 'Jamais visité'
          : m.joursDepuis > 21 ? 'En retard'
          : null;

        return `
          <div class="priority-row ${m.joursDepuis === 999 ? 'never-visited' : ''}"
               data-store-id="${m.code}"
               style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--space-4);border-bottom:1px solid var(--color-border);cursor:pointer;transition:background var(--transition-fast);">
            <span style="width:20px;height:20px;border-radius:50%;background:var(--color-hover-bg);display:flex;align-items:center;justify-content:center;font-size:var(--text-xs);color:var(--color-text-light);flex-shrink:0;">${i + 1}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-size:var(--text-sm);font-weight:var(--weight-medium);color:var(--color-text-dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.nom}</div>
              <div style="font-size:var(--text-xs);color:${alerte ? 'var(--color-orange-text)' : 'var(--color-text-light)'};">${m.ville}${alerte ? ' · ' + alerte : ''}</div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              ${score !== null ? `<div style="font-size:var(--text-md);font-weight:var(--weight-bold);" class="${scoreValueClass(score)}">${score}</div>` : '<div style="color:var(--color-text-light);">—</div>'}
              ${jours !== null ? `<div style="font-size:var(--text-xs);color:var(--color-text-light);">${jours}j</div>` : '<div style="font-size:var(--text-xs);color:var(--color-text-light);">—</div>'}
            </div>
          </div>
        `;
      }).join('');

      // Re-bind events sur les nouvelles lignes
      container.querySelectorAll('.priority-row[data-store-id]').forEach(row => {
        row.addEventListener('click', () => openStorePanel(data.magasins.find(m => m.code === row.dataset.storeId), data));
        row.addEventListener('mouseenter', () => row.style.background = 'var(--color-hover-bg)');
        row.addEventListener('mouseleave', () => row.style.background = '');
      });
    }

    // ── Alertes widget ──
    const alertesWidget = container.querySelector('.alertes-widget-list');
    if (alertesWidget && data.alertes.length) {
      alertesWidget.innerHTML = data.alertes.slice(0, 3).map(a => {
        const age = a.date ? Math.floor((Date.now() - new Date(a.date)) / 86400000) : 0;
        return `
          <div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-2) 0;border-bottom:1px solid var(--color-border);">
            <div style="flex:1;min-width:0;">
              <div style="font-size:var(--text-sm);font-weight:var(--weight-medium);">${a.mag || a.code}</div>
              <div style="font-size:var(--text-xs);color:var(--color-text-light);">${a.type_action || a.description?.substring(0, 40)}</div>
            </div>
            <span style="font-size:var(--text-xs);color:${age > 7 ? 'var(--color-red-text)' : age > 3 ? 'var(--color-orange-text)' : 'var(--color-text-light)'};">${age}j</span>
          </div>
        `;
      }).join('');
    }

    // ── Performances widget ──
    const perfWidget = container.querySelector('.perf-widget-list');
    if (perfWidget && data.performances.length) {
      const perf = data.performances;
      const ca   = perf.reduce((s, p) => s + (p.ca_2026 || 0), 0);
      const caN1 = perf.reduce((s, p) => s + (p.ca_2025 || 0), 0);
      const freq  = perf.reduce((s, p) => s + (p.nb_cli_2026 || 0), 0);
      const freqN1= perf.reduce((s, p) => s + (p.nb_cli_2025 || 0), 0);
      const dmq   = perf.filter(p => p.dmq_pct).reduce((s, p) => s + p.dmq_pct, 0) / (perf.filter(p => p.dmq_pct).length || 1);

      const deltaCA  = caN1 ? ((ca - caN1) / caN1 * 100).toFixed(1) : 0;
      const deltaFreq = freqN1 ? ((freq - freqN1) / freqN1 * 100).toFixed(1) : 0;

      perfWidget.innerHTML = [
        { label: 'CA secteur',    value: (ca / 1000).toFixed(0) + ' k€',  delta: deltaCA + '%',  up: deltaCA >= 0 },
        { label: 'Fréquentation', value: freq.toLocaleString('fr-FR'),     delta: deltaFreq + '%', up: deltaFreq >= 0 },
        { label: 'Démarque moy.', value: dmq.toFixed(1) + '%',            delta: '', up: false },
      ].map(p => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-2) 0;border-bottom:1px solid var(--color-border);">
          <span style="font-size:var(--text-sm);color:var(--color-text-mid);">${p.label}</span>
          <div style="text-align:right;">
            <span style="font-size:var(--text-sm);font-weight:var(--weight-semi);">${p.value}</span>
            ${p.delta ? `<span style="font-size:var(--text-xs);color:${p.up ? 'var(--color-green-text)' : 'var(--color-red-text)'};margin-left:var(--space-1);">${p.up ? '↑' : '↓'} ${p.delta}</span>` : ''}
          </div>
        </div>
      `).join('');
    }

  } catch (err) {
    console.warn('Dashboard Supabase error — données MOCK conservées:', err.message);
    // Les données MOCK restent affichées silencieusement
  }
}

function openStorePanel(magasin, data) {
  if (!magasin) return;
  const visitesMag = data.visites.filter(v => v.code === magasin.code);
  const derniereVisite = visitesMag.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const score = derniereVisite?.score_audit ?? null;
  const jours = derniereVisite
    ? Math.floor((Date.now() - new Date(derniereVisite.date)) / 86400000)
    : null;

  const scoreHTML = score === null
    ? `<span style="color:var(--color-text-light);">Aucun audit</span>`
    : `<span class="score-value ${scoreValueClass(score)}">${score}/100</span>
       <span class="pill ${scoreClass(score)} pill-nodot" style="margin-left:var(--space-2);">${scoreLabel(score)}</span>`;

  openSidePanel({
    id: magasin.code,
    title: magasin.nom,
    content: `
      <div style="display:flex;flex-direction:column;gap:var(--space-4);">
        <div>
          <div style="font-size:var(--text-xs);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:var(--space-1);">Localisation</div>
          <div style="font-size:var(--text-md);color:var(--color-text-dark);">${magasin.ville || '—'}</div>
        </div>
        <div>
          <div style="font-size:var(--text-xs);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:var(--space-1);">Dernière visite</div>
          <div style="font-size:var(--text-md);color:var(--color-text-dark);">${jours === null ? 'Jamais' : `Il y a ${jours} jours`}</div>
        </div>
        <div>
          <div style="font-size:var(--text-xs);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.05em;margin-bottom:var(--space-1);">Score dernier audit</div>
          <div style="display:flex;align-items:center;">${scoreHTML}</div>
        </div>
        <hr class="divider">
        <div style="display:flex;flex-direction:column;gap:var(--space-2);">
          <button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="import('./app.js').then(m=>m.navigate('visites'))">Démarrer une visite</button>
          <button class="btn btn-secondary" style="width:100%;justify-content:center;" onclick="import('./app.js').then(m=>m.navigate('magasins'))">Voir la fiche magasin</button>
        </div>
      </div>
    `,
  });
}
  const store = MOCK.priorites.find(p => p.id === storeId);
  if (!store) return;

  const scoreHTML = store.score === null
    ? `<span style="color:var(--color-text-light);">Aucun audit</span>`
    : `<span class="score-value ${scoreValueClass(store.score)}">${store.score}/100</span>
       <span class="pill ${scoreClass(store.score)} pill-nodot" style="margin-left:var(--space-2);">${scoreLabel(store.score)}</span>`;

  openSidePanel({
    id: storeId,
    title: store.nom,
    content: `
      <div style="display:flex; flex-direction:column; gap:var(--space-4);">
        <div>
          <div style="font-size:var(--text-xs); color:var(--color-text-light); text-transform:uppercase; letter-spacing:.05em; margin-bottom:var(--space-1);">Localisation</div>
          <div style="font-size:var(--text-md); color:var(--color-text-dark);">${store.ville}</div>
        </div>
        <div>
          <div style="font-size:var(--text-xs); color:var(--color-text-light); text-transform:uppercase; letter-spacing:.05em; margin-bottom:var(--space-1);">Dernière visite</div>
          <div style="font-size:var(--text-md); color:var(--color-text-dark);">
            ${store.jours === null ? 'Jamais' : `Il y a ${store.jours} jours`}
          </div>
        </div>
        <div>
          <div style="font-size:var(--text-xs); color:var(--color-text-light); text-transform:uppercase; letter-spacing:.05em; margin-bottom:var(--space-1);">Score dernier audit</div>
          <div style="display:flex; align-items:center;">${scoreHTML}</div>
        </div>
        ${store.alerte ? `
        <div style="background:var(--color-orange-bg); border:1px solid var(--color-orange-border); border-radius:var(--radius-md); padding:var(--space-3);">
          <div style="font-size:var(--text-xs); font-weight:var(--weight-semi); color:var(--color-orange-text); margin-bottom:4px;">ALERTE</div>
          <div style="font-size:var(--text-sm); color:var(--color-orange-text);">${store.alerte}</div>
        </div>` : ''}
        <hr class="divider">
        <div style="display:flex; flex-direction:column; gap:var(--space-2);">
          <button class="btn btn-primary" style="width:100%;justify-content:center;">
            Démarrer une visite
          </button>
          <button class="btn btn-secondary" style="width:100%;justify-content:center;">
            Voir la fiche magasin
          </button>
        </div>
      </div>
    `,
  });
}
