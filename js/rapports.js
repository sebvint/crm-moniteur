/* ============================================================
   ProxiPilot — rapports.js
   6 types de rapports : Hebdo · Mensuel · Planning · Export brut · IA · Alertes
   ============================================================ */

import { showToast } from './app.js';
import { shortDate } from './config.js';

/* ══════════════════════════════════════════
   TYPES DE RAPPORTS
   ══════════════════════════════════════════ */
const RAPPORT_TYPES = [
  {
    id: 'hebdo',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
    label: 'Rapport hebdomadaire',
    desc: 'Synthèse de la semaine — visites, alertes, actions',
    exports: ['PDF', 'Texte', 'IA'],
    color: 'var(--color-blue-text)',
    bg: 'var(--color-blue-bg)',
  },
  {
    id: 'mensuel',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-8"/></svg>`,
    label: 'Rapport mensuel',
    desc: 'Performances CA · Démarque · Score avec comparatif N-1',
    exports: ['PDF', 'CSV', 'IA'],
    color: 'var(--color-green-text)',
    bg: 'var(--color-green-bg)',
  },
  {
    id: 'planning',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>`,
    label: 'Planning inventaires',
    desc: 'Calendrier A4 + tableau détail + participants',
    exports: ['PDF'],
    color: 'var(--color-gold)',
    bg: 'var(--color-gold-light)',
  },
  {
    id: 'export',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    label: 'Export brut',
    desc: 'Tables sélectionnables, colonnes et filtres configurables',
    exports: ['CSV', 'Excel'],
    color: 'var(--color-purple-text)',
    bg: 'var(--color-purple-bg)',
  },
  {
    id: 'ia',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`,
    label: 'Rapport IA Claude',
    desc: 'Analyse intelligente — ton configurable, prompt personnalisable',
    exports: ['Copier', 'PDF'],
    color: 'var(--color-orange-text)',
    bg: 'var(--color-orange-bg)',
  },
  {
    id: 'alertes',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    label: 'Alertes & Actions',
    desc: 'Toutes les alertes ouvertes et actions non clôturées',
    exports: ['PDF', 'CSV'],
    color: 'var(--color-red-text)',
    bg: 'var(--color-red-bg)',
  },
];

/* ── State ── */
let state = {
  activeType: null,
  iaGenerating: false,
  iaHistorique: [
    { id: 'h1', date: '2026-05-10', ton: 'Synthétique', extrait: 'Semaine 19 — 4 visites réalisées. Score moyen 71/100 en amélioration...' },
    { id: 'h2', date: '2026-05-03', ton: 'Terrain',     extrait: 'Cette semaine on a fait le tour de Palavas, situation HACCP toujours...' },
  ],
};

/* ══════════════════════════════════════════
   RENDER PRINCIPAL
   ══════════════════════════════════════════ */
export function render() {
  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">Rapports</h1>
        <p class="page-subtitle">6 types de rapports configurables</p>
      </div>
    </div>

    <!-- Grille des types -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-4);margin-bottom:var(--space-6);" id="rapport-grid">
      ${RAPPORT_TYPES.map(t => renderTypeCard(t)).join('')}
    </div>

    <!-- Panneau de configuration actif -->
    <div id="rapport-config">
      ${state.activeType ? renderConfig(state.activeType) : renderEmpty()}
    </div>
  `;
}

function renderTypeCard(t) {
  const isActive = state.activeType === t.id;
  return `
    <div class="rapport-type-card" data-type="${t.id}" style="
      background:${isActive ? t.bg : 'var(--color-card-bg)'};
      border:${isActive ? `2px solid ${t.color}` : '1px solid var(--color-border)'};
      border-radius:var(--radius-lg);
      padding:var(--space-4);
      cursor:pointer;
      transition:all var(--transition-fast);
    ">
      <div style="
        width:36px;height:36px;
        background:${t.bg};
        border-radius:var(--radius-md);
        display:flex;align-items:center;justify-content:center;
        color:${t.color};margin-bottom:var(--space-3);
      ">${t.icon}</div>
      <div style="font-size:var(--text-sm);font-weight:var(--weight-semi);color:var(--color-text-dark);margin-bottom:4px;">${t.label}</div>
      <div style="font-size:var(--text-xs);color:var(--color-text-light);line-height:var(--leading-normal);">${t.desc}</div>
      <div style="display:flex;gap:var(--space-1);margin-top:var(--space-3);flex-wrap:wrap;">
        ${t.exports.map(e => `<span style="font-size:9px;font-weight:var(--weight-semi);background:var(--color-hover-bg);color:var(--color-text-mid);padding:2px 6px;border-radius:var(--radius-full);">${e}</span>`).join('')}
      </div>
    </div>
  `;
}

function renderEmpty() {
  return `
    <div class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" width="36" height="36"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/></svg>
      <div class="empty-state-title">Sélectionnez un type de rapport</div>
      <div class="empty-state-sub">Cliquez sur une carte ci-dessus pour configurer et générer votre rapport.</div>
    </div>
  `;
}

/* ══════════════════════════════════════════
   CONFIGS PAR TYPE
   ══════════════════════════════════════════ */
function renderConfig(typeId) {
  const t = RAPPORT_TYPES.find(x => x.id === typeId);
  if (!t) return '';

  const configs = {
    hebdo:   renderConfigHebdo,
    mensuel: renderConfigMensuel,
    planning:renderConfigPlanning,
    export:  renderConfigExport,
    ia:      renderConfigIA,
    alertes: renderConfigAlertes,
  };

  return `
    <div style="background:var(--color-card-bg);border:1px solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden;">
      <div style="padding:var(--space-4) var(--space-5);border-bottom:1px solid var(--color-border);display:flex;align-items:center;gap:var(--space-3);">
        <div style="width:28px;height:28px;background:${t.bg};border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;color:${t.color};">${t.icon}</div>
        <div style="flex:1;">
          <div style="font-size:var(--text-md);font-weight:var(--weight-semi);color:var(--color-text-dark);">${t.label}</div>
        </div>
        <button class="icon-btn" id="btn-close-config">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div style="padding:var(--space-5);">
        ${configs[typeId]?.() || ''}
      </div>
    </div>
  `;
}

/* ── Hebdomadaire ── */
function renderConfigHebdo() {
  const sections = [
    ['Visites de la semaine', true],
    ['Alertes ouvertes', true],
    ['Actions en cours', true],
    ['Performances CA', false],
    ['Inventaires planifiés', true],
    ['Score moyen secteur', true],
  ];
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-5);">
      <div>
        <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">Sections incluses</div>
        ${sections.map(([label, checked]) => `
          <label class="toggle-wrap" style="margin-bottom:var(--space-2);">
            <div class="toggle">
              <input type="checkbox" ${checked ? 'checked' : ''} class="hebdo-section">
              <div class="toggle-track"></div>
              <div class="toggle-thumb"></div>
            </div>
            <span style="font-size:var(--text-sm);">${label}</span>
          </label>
        `).join('')}
      </div>
      <div>
        <div class="form-group">
          <label class="form-label">Période</label>
          <select class="form-select" id="hebdo-periode">
            <option>Semaine en cours (S20)</option>
            <option>Semaine dernière (S19)</option>
            <option>Personnalisée</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Destinataires email</label>
          <input type="email" class="form-input" placeholder="email@exemple.com" id="hebdo-email">
          <div class="form-hint">Séparés par des virgules</div>
        </div>
        <label class="toggle-wrap" style="margin-bottom:var(--space-4);">
          <div class="toggle">
            <input type="checkbox" id="hebdo-save-model">
            <div class="toggle-track"></div>
            <div class="toggle-thumb"></div>
          </div>
          <span style="font-size:var(--text-sm);">Sauvegarder comme modèle</span>
        </label>
      </div>
    </div>
    ${renderExportButtons(['PDF', 'Texte', 'IA'], 'hebdo')}
  `;
}

/* ── Mensuel ── */
function renderConfigMensuel() {
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-5);">
      <div>
        <div class="form-group">
          <label class="form-label">Mois</label>
          <select class="form-select" id="mensuel-mois">
            <option>Mai 2026</option>
            <option>Avril 2026</option>
            <option>Mars 2026</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Magasins</label>
          <select class="form-select" id="mensuel-magasins">
            <option>Tous les magasins</option>
            <option>Casino Sup. Palavas</option>
            <option>Vival Les Arceaux</option>
            <option>Spar Lattes</option>
          </select>
        </div>
      </div>
      <div>
        <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">Contenu</div>
        ${[['CA & Fréquentation',true],['Démarque & DMQ',true],['Score audit',true],['Comparatif N-1',true],['Graphe tendance 6 mois',false]].map(([l,c])=>`
          <label class="toggle-wrap" style="margin-bottom:var(--space-2);">
            <div class="toggle"><input type="checkbox" ${c?'checked':''}><div class="toggle-track"></div><div class="toggle-thumb"></div></div>
            <span style="font-size:var(--text-sm);">${l}</span>
          </label>
        `).join('')}
      </div>
    </div>
    ${renderExportButtons(['PDF', 'CSV', 'IA'], 'mensuel')}
  `;
}

/* ── Planning inventaires ── */
function renderConfigPlanning() {
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-5);">
      <div>
        <div class="form-group">
          <label class="form-label">Période</label>
          <div class="form-row">
            <div><label class="form-label" style="font-size:var(--text-xs);">Du</label><input type="date" class="form-input" value="2026-05-01"></div>
            <div><label class="form-label" style="font-size:var(--text-xs);">Au</label><input type="date" class="form-input" value="2026-07-31"></div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Format</label>
          <select class="form-select">
            <option>A4 Portrait</option>
            <option>A4 Paysage</option>
          </select>
        </div>
      </div>
      <div>
        <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">Pages incluses</div>
        ${[['Calendrier visuel',true],['Tableau détail',true],['Liste participants',true],['Notes de préparation',false]].map(([l,c])=>`
          <label class="toggle-wrap" style="margin-bottom:var(--space-2);">
            <div class="toggle"><input type="checkbox" ${c?'checked':''}><div class="toggle-track"></div><div class="toggle-thumb"></div></div>
            <span style="font-size:var(--text-sm);">${l}</span>
          </label>
        `).join('')}
      </div>
    </div>
    ${renderExportButtons(['PDF'], 'planning')}
  `;
}

/* ── Export brut ── */
function renderConfigExport() {
  const tables = ['Visites', 'Alertes', 'Actions', 'Performances', 'Inventaires', 'Magasins'];
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-5);">
      <div>
        <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">Tables à exporter</div>
        ${tables.map((t,i) => `
          <label class="toggle-wrap" style="margin-bottom:var(--space-2);">
            <div class="toggle"><input type="checkbox" ${i<3?'checked':''}><div class="toggle-track"></div><div class="toggle-thumb"></div></div>
            <span style="font-size:var(--text-sm);">${t}</span>
          </label>
        `).join('')}
      </div>
      <div>
        <div class="form-group">
          <label class="form-label">Période</label>
          <select class="form-select">
            <option>30 derniers jours</option>
            <option>3 derniers mois</option>
            <option>6 derniers mois</option>
            <option>Personnalisée</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Magasin</label>
          <select class="form-select">
            <option>Tous</option>
            <option>Casino Sup. Palavas</option>
            <option>Vival Les Arceaux</option>
            <option>Spar Lattes</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Moniteur</label>
          <select class="form-select">
            <option>Tous</option>
            <option>Marie Dupont</option>
          </select>
        </div>
      </div>
    </div>
    ${renderExportButtons(['CSV', 'Excel'], 'export')}
  `;
}

/* ── Rapport IA ── */
function renderConfigIA() {
  return `
    <div style="display:flex;flex-direction:column;gap:var(--space-4);">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">
        <div class="form-group">
          <label class="form-label">Ton du rapport</label>
          <select class="form-select" id="ia-ton">
            <option value="synthetique">Synthétique</option>
            <option value="formel">Formel</option>
            <option value="terrain">Terrain</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Période analysée</label>
          <select class="form-select" id="ia-periode">
            <option>Cette semaine</option>
            <option>Ce mois</option>
            <option>Les 30 derniers jours</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Instructions personnalisées</label>
        <textarea class="form-textarea" id="ia-prompt" placeholder="Ex: Insister sur les magasins en retard, comparer avec le mois dernier, donner des recommandations concrètes…" style="min-height:80px;"></textarea>
      </div>

      <!-- Bouton générer -->
      <button class="btn btn-primary" id="btn-generer-ia" style="width:100%;justify-content:center;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2"/></svg>
        Générer avec Claude
      </button>

      <!-- Zone résultat -->
      <div id="ia-result" style="display:none;">
        <div style="background:var(--color-hover-bg);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:var(--space-4);font-size:var(--text-sm);color:var(--color-text-dark);line-height:var(--leading-loose);white-space:pre-wrap;" id="ia-result-text"></div>
        <div style="display:flex;gap:var(--space-2);margin-top:var(--space-3);">
          <button class="btn btn-secondary btn-sm" id="btn-copier-ia">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copier
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-pdf-ia">PDF</button>
        </div>
      </div>

      <!-- Historique -->
      ${state.iaHistorique.length > 0 ? `
        <div>
          <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">Historique récent</div>
          ${state.iaHistorique.map(h => `
            <div style="background:var(--color-app-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:var(--space-3);margin-bottom:var(--space-2);cursor:pointer;" class="ia-history-item" data-id="${h.id}">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                <span style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-mid);">${shortDate(h.date)}</span>
                <span style="font-size:var(--text-xs);background:var(--color-hover-bg);padding:1px 6px;border-radius:var(--radius-full);color:var(--color-text-light);">${h.ton}</span>
              </div>
              <div style="font-size:var(--text-xs);color:var(--color-text-light);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${h.extrait}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

/* ── Alertes & Actions ── */
function renderConfigAlertes() {
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-5);">
      <div>
        <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">Contenu</div>
        ${[['Alertes ouvertes',true],['Actions non clôturées',true],['Alertes clôturées (30j)',false],['Actions clôturées (30j)',false]].map(([l,c])=>`
          <label class="toggle-wrap" style="margin-bottom:var(--space-2);">
            <div class="toggle"><input type="checkbox" ${c?'checked':''}><div class="toggle-track"></div><div class="toggle-thumb"></div></div>
            <span style="font-size:var(--text-sm);">${l}</span>
          </label>
        `).join('')}
      </div>
      <div>
        <div class="form-group">
          <label class="form-label">Trier par</label>
          <select class="form-select">
            <option>Ancienneté (plus vieille en premier)</option>
            <option>Magasin</option>
            <option>Type d'alerte</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Filtrer par magasin</label>
          <select class="form-select">
            <option>Tous</option>
            <option>Casino Sup. Palavas</option>
            <option>Vival Les Arceaux</option>
          </select>
        </div>
      </div>
    </div>
    ${renderExportButtons(['PDF', 'CSV'], 'alertes')}
  `;
}

/* ── Boutons export ── */
function renderExportButtons(formats, typeId) {
  const styleMap = {
    PDF:    'background:var(--color-red-bg);color:var(--color-red-text);border:1px solid var(--color-red-border);',
    CSV:    'background:var(--color-green-bg);color:var(--color-green-text);border:1px solid var(--color-green-border);',
    Excel:  'background:var(--color-green-bg);color:var(--color-green-text);border:1px solid var(--color-green-border);',
    Texte:  'background:var(--color-hover-bg);color:var(--color-text-mid);border:1px solid var(--color-border);',
    IA:     'background:var(--color-orange-bg);color:var(--color-orange-text);border:1px solid var(--color-orange-border);',
    Copier: 'background:var(--color-hover-bg);color:var(--color-text-mid);border:1px solid var(--color-border);',
  };

  return `
    <div style="border-top:1px solid var(--color-border);padding-top:var(--space-4);margin-top:var(--space-2);display:flex;gap:var(--space-2);flex-wrap:wrap;align-items:center;">
      <span style="font-size:var(--text-xs);color:var(--color-text-light);margin-right:var(--space-1);">Aperçu & génération :</span>
      ${formats.map(f => `
        <button class="btn btn-sm export-btn" data-format="${f}" data-type="${typeId}" style="${styleMap[f] || ''}">
          ${f === 'PDF' ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/></svg>` : ''}
          ${f}
        </button>
      `).join('')}
      ${typeId === 'hebdo' ? `
        <button class="btn btn-sm" data-action="mailto" data-type="${typeId}"
          style="background:var(--color-blue-bg);color:var(--color-blue-text);border:1px solid var(--color-blue-border);">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          Envoyer par mail
        </button>
      ` : ''}
    </div>
  `;
}

/* ══════════════════════════════════════════
   GÉNÉRATION IA (via Anthropic API)
   ══════════════════════════════════════════ */
async function genererRapportIA() {
  const ton     = document.getElementById('ia-ton')?.value || 'synthetique';
  const prompt  = document.getElementById('ia-prompt')?.value || '';
  const btn     = document.getElementById('btn-generer-ia');
  const result  = document.getElementById('ia-result');
  const textEl  = document.getElementById('ia-result-text');

  if (!btn || !result || !textEl) return;

  // UI loading
  btn.disabled = true;
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Génération en cours…`;
  result.style.display = 'none';

  const tonLabel = { synthetique: 'synthétique et concis', formel: 'formel et professionnel', terrain: 'direct et opérationnel, comme un message terrain' }[ton];

  const systemPrompt = `Tu es un assistant pour ProxiPilot, CRM de moniteurs des ventes Codisud (réseau Casino). Tu analyses les données du secteur Sud Est et génères des rapports ${tonLabel}.`;

  const dataContext = `
Données secteur Sud Est — Mai 2026 :
- 5 magasins suivis
- Alertes actives : 5 (dont 2 HACCP, 1 DLC, 1 démarque, 1 HACCP Spar)
- Score moyen secteur : 69/100
- CA secteur : 121 k€ (↓10.5% vs N-1)
- Fréquentation : 3190 (↓12.7% vs N-1)
- Inventaires : 2 planifiés, 1 en retard (Carrefour Antigone)
- Visites semaine : 3 visites réalisées
${prompt ? `\nInstructions spéciales : ${prompt}` : ''}
  `.trim();

  const userMessage = `Génère un rapport de suivi secteur ${tonLabel} basé sur ces données :\n${dataContext}`;

  try {
    // Phase 1 : simulation — Phase 2 passera par /api/rapport.js (proxy Vercel)
    await new Promise(r => setTimeout(r, 1800)); // simulation latence

    const tonTextes = {
      synthetique: `📊 Rapport secteur Sud Est — ${new Date().toLocaleDateString('fr-FR')}\n\n**SYNTHÈSE SEMAINE**\n\n• 3 visites réalisées cette semaine — score moyen 69/100\n• 5 alertes actives dont 2 HACCP critiques (Casino Sup. Palavas)\n• CA secteur : 121 k€ — en baisse de 10,5% vs N-1 à surveiller\n• 1 inventaire en retard : Carrefour Express Antigone à planifier d'urgence\n\n**PRIORITÉS**\n1. Relancer Casino Sup. Palavas sur HACCP (8j sans résolution)\n2. Planifier inventaire Carrefour Antigone\n3. Investiguer baisse CA — fréquentation -12,7%\n\n**PROCHAINE SEMAINE**\n→ Spar Lattes : cession planifiée le 24/05\n→ Vival Pézenas : contrôle le 28/05`,
      formel: `RAPPORT DE SUIVI SECTORIEL\nSecteur : Sud Est | Période : semaine 20 | Date : ${new Date().toLocaleDateString('fr-FR')}\n\n1. INDICATEURS DE PERFORMANCE\nChiffre d'affaires secteur : 121 000 € (-10,5 % N-1)\nScore audit moyen : 69/100\nTaux de couverture : 78 %\n\n2. ALERTES ET NON-CONFORMITÉS\nNombre d'alertes actives : 5\n— 2 alertes HACCP niveau critique (Casino Sup. Palavas, Spar Lattes)\n— 1 alerte DLC (Casino Sup. Palavas)\n— 1 alerte démarque (Carrefour Antigone)\n\n3. ACTIONS RECOMMANDÉES\nPrioritaire : traitement alerte HACCP Casino Sup. Palavas (ancienneté 8 jours)\nUrgent : planification inventaire Carrefour Express Antigone (retard constaté)`,
      terrain: `Bonjour,\n\nSemaine chargée sur le secteur. Voilà l'essentiel :\n\n🔴 URGENT — Casino Sup. Palavas : l'alerte HACCP traîne depuis 8 jours, 2 relances sans réponse. Il faut y aller cette semaine.\n\n📉 Le CA est en recul partout (-10% en moyenne). La fréquentation chute aussi. Ça mérite qu'on creuse — promo concurrente ? Travaux ?\n\n📦 Carrefour Antigone : toujours pas d'inventaire planifié. Plus de 6 mois de retard. À caler cette semaine.\n\n✅ Points positifs : Spar Lattes et Casino Pérols tiennent bien leurs scores.\n\nBonne semaine terrain 💪`,
    };

    const text = tonTextes[ton] || tonTextes.synthetique;

    textEl.textContent = text;
    result.style.display = 'block';

    // Ajouter à l'historique
    state.iaHistorique.unshift({
      id: 'h' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      ton: { synthetique: 'Synthétique', formel: 'Formel', terrain: 'Terrain' }[ton],
      extrait: text.substring(0, 100) + '…',
    });
    if (state.iaHistorique.length > 10) state.iaHistorique.pop();

    showToast('Rapport généré ✓', 'success');

    // Bind boutons résultat
    document.getElementById('btn-copier-ia')?.addEventListener('click', () => {
      navigator.clipboard.writeText(text).then(() => showToast('Copié ✓', 'success'));
    });
    document.getElementById('btn-pdf-ia')?.addEventListener('click', () => {
      showToast('Export PDF — Phase 2');
    });

  } catch (err) {
    showToast('Erreur de génération — vérifiez la connexion', 'error');
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2"/></svg> Générer avec Claude`;
  }
}

/* ══════════════════════════════════════════
   INIT & EVENTS
   ══════════════════════════════════════════ */
export function init(container) {
  function onGridClick(e) {
    const card = e.target.closest('.rapport-type-card[data-type]');
    if (!card) return;
    state.activeType = card.dataset.type;

    container.querySelector('#rapport-grid').innerHTML = RAPPORT_TYPES.map(t => renderTypeCard(t)).join('');
    container.querySelector('#rapport-config').innerHTML = renderConfig(state.activeType);

    // setTimeout garantit que le DOM est rendu avant le bind
    setTimeout(() => {
      container.querySelector('#rapport-grid')?.addEventListener('click', onGridClick);
      bindConfigEvents(container);
    }, 0);
  }

  container.querySelector('#rapport-grid')?.addEventListener('click', onGridClick);
  // bindConfigEvents au premier chargement (pas de config encore affichée)
}

function bindConfigEvents(container) {
  // Fermer config
  container.querySelector('#btn-close-config')?.addEventListener('click', () => {
    state.activeType = null;
    container.querySelector('#rapport-grid').innerHTML = RAPPORT_TYPES.map(t => renderTypeCard(t)).join('');
    container.querySelector('#rapport-config').innerHTML = renderEmpty();
  });

  // Boutons export → aperçu
  container.querySelectorAll('.export-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fmt  = btn.dataset.format;
      const type = btn.dataset.type;
      ouvrirApercu(fmt, type);
    });
  });

  // Bouton mailto
  container.querySelectorAll('[data-action="mailto"]').forEach(btn => {
    btn.addEventListener('click', () => ouvrirApercuMail(btn.dataset.type));
  });

  // Générer rapport IA
  container.querySelector('#btn-generer-ia')?.addEventListener('click', genererRapportIA);

  // Historique IA
  container.querySelectorAll('.ia-history-item').forEach(item => {
    item.addEventListener('click', () => {
      const h = state.iaHistorique.find(x => x.id === item.dataset.id);
      if (!h) return;
      const result = document.getElementById('ia-result');
      const textEl = document.getElementById('ia-result-text');
      if (result && textEl) { textEl.textContent = h.extrait; result.style.display = 'block'; }
    });
  });
}

/* ══════════════════════════════════════════
   APERÇU PDF (modale inline)
   ══════════════════════════════════════════ */
function ouvrirApercu(format, typeId) {
  const type   = RAPPORT_TYPES.find(t => t.id === typeId);
  const date   = new Date().toLocaleDateString('fr-FR');
  const semaine = 'S20';

  // Données mock pour l'aperçu
  const alertes = [
    { magasin: 'Casino Sup. Palavas', label: 'HACCP', age: 8, pill: 'red' },
    { magasin: 'Casino Sup. Palavas', label: 'DLC', age: 5, pill: 'red' },
    { magasin: 'Carrefour Antigone',  label: 'Démarque', age: 3, pill: 'orange' },
  ];
  const visites = [
    { magasin: 'Vival Les Arceaux',   date: '10/05', score: 71, couleur: 'orange' },
    { magasin: 'Casino Sup. Palavas', date: '03/05', score: 54, couleur: 'red' },
    { magasin: 'Spar Lattes',         date: '03/05', score: 68, couleur: 'orange' },
  ];

  const contenu = document.getElementById('rapport-config');
  if (!contenu) return;

  // Injection modale au-dessus
  const modal = document.createElement('div');
  modal.id = 'apercu-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(44,36,22,.45);z-index:500;
    display:flex;align-items:center;justify-content:center;padding:var(--space-5);
  `;

  modal.innerHTML = `
    <div style="
      background:var(--color-card-bg);border-radius:var(--radius-xl);
      box-shadow:var(--shadow-lg);width:100%;max-width:680px;max-height:90vh;
      display:flex;flex-direction:column;overflow:hidden;
    ">
      <!-- Toolbar -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-3) var(--space-5);border-bottom:1px solid var(--color-border);background:var(--color-hover-bg);">
        <div style="font-size:var(--text-sm);font-weight:var(--weight-semi);color:var(--color-text-dark);">
          Aperçu — Rapport_Hebdo_${semaine}_2026.pdf
        </div>
        <div style="display:flex;gap:var(--space-2);">
          <button class="btn btn-secondary btn-sm" id="apercu-modifier">Modifier</button>
          <button class="btn btn-primary btn-sm" id="apercu-telecharger">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Télécharger PDF
          </button>
          <button class="icon-btn" id="apercu-fermer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <!-- Page A4 simulée -->
      <div style="overflow-y:auto;padding:var(--space-5);background:var(--color-app-bg);">
        <div style="background:white;border:1px solid var(--color-border);border-radius:var(--radius-md);padding:32px;max-width:560px;margin:0 auto;font-family:var(--font-sans);">

          <!-- En-tête -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid var(--color-gold);">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:32px;height:32px;background:var(--color-gold);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:15px;">P</div>
              <div>
                <div style="font-size:13px;font-weight:600;color:#2C2416;">ProxiPilot</div>
                <div style="font-size:10px;color:#9C9080;">Codisud — Secteur Sud Est</div>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:13px;font-weight:600;color:#2C2416;">Rapport hebdomadaire ${semaine}</div>
              <div style="font-size:10px;color:#9C9080;">${date} · Marie Dupont</div>
            </div>
          </div>

          <!-- KPIs -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:20px;">
            ${[['3','Visites','#2C2416'],['5','Alertes','#8C3030'],['69','Score moy.','#7A4800']].map(([v,l,c])=>`
              <div style="background:#F4F1EC;border-radius:6px;padding:10px;text-align:center;">
                <div style="font-size:22px;font-weight:700;color:${c};line-height:1;">${v}</div>
                <div style="font-size:9px;color:#9C9080;margin-top:3px;">${l}</div>
              </div>
            `).join('')}
          </div>

          <!-- Alertes -->
          <div style="margin-bottom:18px;">
            <div style="font-size:9px;font-weight:600;color:#9C9080;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Alertes actives</div>
            ${alertes.map(a=>`
              <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #E8E4DC;font-size:11px;">
                <span style="color:#6B6050;">${a.magasin}</span>
                <span style="background:${a.pill==='red'?'#F5EAEA':'#F5EFE3'};color:${a.pill==='red'?'#8C3030':'#7A4800'};padding:2px 7px;border-radius:10px;font-size:9px;font-weight:600;">${a.label} · ${a.age}j</span>
              </div>
            `).join('')}
          </div>

          <!-- Visites -->
          <div style="margin-bottom:18px;">
            <div style="font-size:9px;font-weight:600;color:#9C9080;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Visites réalisées</div>
            ${visites.map(v=>`
              <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #E8E4DC;font-size:11px;">
                <span style="color:#6B6050;">${v.magasin} · ${v.date}</span>
                <span style="background:${v.couleur==='red'?'#F5EAEA':v.couleur==='green'?'#EBF2E8':'#F5EFE3'};color:${v.couleur==='red'?'#8C3030':v.couleur==='green'?'#2A5A30':'#7A4800'};padding:2px 7px;border-radius:10px;font-size:9px;font-weight:600;">${v.score}/100</span>
              </div>
            `).join('')}
          </div>

          <!-- Pied de page -->
          <div style="margin-top:20px;padding-top:10px;border-top:1px solid #E8E4DC;font-size:9px;color:#9C9080;text-align:center;">
            Généré par ProxiPilot — Codisud Secteur Sud Est · ${date}
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Events
  modal.querySelector('#apercu-fermer')?.addEventListener('click', () => modal.remove());
  modal.querySelector('#apercu-modifier')?.addEventListener('click', () => {
    modal.remove();
    showToast('Modification — Phase 2 (connexion Supabase)');
  });
  modal.querySelector('#apercu-telecharger')?.addEventListener('click', () => {
    modal.remove();
    showToast('Téléchargement PDF — Phase 2 (html2pdf)');
  });
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

/* ══════════════════════════════════════════
   APERÇU EMAIL + MAILTO
   ══════════════════════════════════════════ */
function ouvrirApercuMail(typeId) {
  const semaine = 'S20';
  const date    = new Date().toLocaleDateString('fr-FR');

  // Destinataires depuis le champ config
  const destinataires = document.getElementById('hebdo-email')?.value || 'direction@codisud.fr';

  const sujet = encodeURIComponent(`Rapport hebdomadaire ${semaine} — Secteur Sud Est`);
  const corps = encodeURIComponent(
`Bonjour,

Veuillez trouver ci-joint le rapport hebdomadaire du secteur Sud Est pour la semaine ${semaine} (13–17 mai 2026).

Synthèse :
• 3 visites réalisées · Score moyen 69/100
• 5 alertes actives dont 2 HACCP critiques (Casino Sup. Palavas)
• CA secteur : 121 k€ · ↓10,5% vs N-1 — à surveiller
• 1 inventaire en retard : Carrefour Express Antigone à planifier

Cordialement,
Marie Dupont · Moniteur secteur Sud Est
ProxiPilot — Codisud`
  );

  const modal = document.createElement('div');
  modal.id = 'mail-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(44,36,22,.45);z-index:500;
    display:flex;align-items:center;justify-content:center;padding:var(--space-5);
  `;

  modal.innerHTML = `
    <div style="
      background:var(--color-card-bg);border-radius:var(--radius-xl);
      box-shadow:var(--shadow-lg);width:100%;max-width:600px;
      display:flex;flex-direction:column;overflow:hidden;
    ">
      <!-- Toolbar -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-3) var(--space-5);border-bottom:1px solid var(--color-border);background:var(--color-hover-bg);">
        <div style="font-size:var(--text-sm);font-weight:var(--weight-semi);color:var(--color-text-dark);">Aperçu email</div>
        <button class="icon-btn" id="mail-fermer">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Champs -->
      <div style="border-bottom:1px solid var(--color-border);">
        <div style="display:flex;gap:var(--space-3);padding:var(--space-2) var(--space-5);border-bottom:1px solid var(--color-border);">
          <span style="font-size:var(--text-xs);color:var(--color-text-light);min-width:36px;line-height:24px;">De</span>
          <span style="font-size:var(--text-sm);color:var(--color-text-mid);">marie.dupont@codisud.fr</span>
        </div>
        <div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-2) var(--space-5);border-bottom:1px solid var(--color-border);">
          <span style="font-size:var(--text-xs);color:var(--color-text-light);min-width:36px;">À</span>
          <input type="text" id="mail-destinataires" value="${destinataires}"
            class="form-input" style="flex:1;padding:4px 8px;font-size:var(--text-sm);">
        </div>
        <div style="display:flex;gap:var(--space-3);padding:var(--space-2) var(--space-5);">
          <span style="font-size:var(--text-xs);color:var(--color-text-light);min-width:36px;line-height:24px;">Objet</span>
          <span style="font-size:var(--text-sm);color:var(--color-text-dark);">Rapport hebdomadaire ${semaine} — Secteur Sud Est</span>
        </div>
      </div>

      <!-- Corps -->
      <div style="padding:var(--space-5);">
        <textarea id="mail-corps" style="
          width:100%;min-height:180px;font-size:var(--text-sm);
          background:var(--color-app-bg);border:1px solid var(--color-border);
          border-radius:var(--radius-md);padding:var(--space-3);
          color:var(--color-text-dark);line-height:var(--leading-loose);
          resize:vertical;outline:none;font-family:var(--font-sans);
        ">Bonjour,

Veuillez trouver ci-joint le rapport hebdomadaire du secteur Sud Est pour la semaine ${semaine} (13–17 mai 2026).

Synthèse :
• 3 visites réalisées · Score moyen 69/100
• 5 alertes actives dont 2 HACCP critiques (Casino Sup. Palavas)
• CA secteur : 121 k€ · ↓10,5% vs N-1 — à surveiller
• 1 inventaire en retard : Carrefour Express Antigone à planifier

Cordialement,
Marie Dupont · Moniteur secteur Sud Est</textarea>

        <!-- Pièce jointe simulée -->
        <div style="display:flex;align-items:center;gap:var(--space-3);background:var(--color-hover-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:var(--space-2) var(--space-3);margin-top:var(--space-3);">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18" style="color:var(--color-red-text);flex-shrink:0;"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/></svg>
          <div>
            <div style="font-size:var(--text-sm);font-weight:var(--weight-medium);color:var(--color-text-dark);">Rapport_Hebdo_${semaine}_2026.pdf</div>
            <div style="font-size:var(--text-xs);color:var(--color-text-light);">124 Ko · PDF — Phase 2</div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div style="display:flex;justify-content:flex-end;gap:var(--space-2);padding:var(--space-3) var(--space-5);border-top:1px solid var(--color-border);">
        <button class="btn btn-ghost" id="mail-annuler">Annuler</button>
        <button class="btn btn-primary" id="mail-envoyer">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          Ouvrir dans mon client mail
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#mail-fermer')?.addEventListener('click', () => modal.remove());
  modal.querySelector('#mail-annuler')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  modal.querySelector('#mail-envoyer')?.addEventListener('click', () => {
    const dest  = modal.querySelector('#mail-destinataires')?.value || destinataires;
    const corps = modal.querySelector('#mail-corps')?.value || '';
    const mailtoUrl = `mailto:${dest}?subject=${sujet}&body=${encodeURIComponent(corps)}`;
    window.location.href = mailtoUrl;
    modal.remove();
    showToast('Client mail ouvert ✓', 'success');
  });
}
