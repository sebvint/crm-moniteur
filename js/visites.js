/* ============================================================
   ProxiPilot — visites.js
   Journal visites — filtres croisés, dépliable, export, nouvelle visite
   ============================================================ */

import { openSidePanel, showToast } from './app.js';
import { scoreClass, scoreValueClass, scoreLabel, shortDate, relativeDate, AUDIT_CRITERIA } from './config.js';

/* ══════════════════════════════════════════
   DONNÉES MOCK
   ══════════════════════════════════════════ */
const MOCK_VISITES = [
  {
    id: 'v1', magasin: 'Casino Sup. Palavas', magasin_id: '1', ville: 'Palavas', moniteur: 'Marie Dupont',
    date: '2026-05-03', type: 'Standard', score: 54, duree: 65,
    gerant_present: true, notes: 'Réserve en désordre, HACCP critique.',
    criteres: { haccp: 'ko', dlc: 'partiel', proprete: 'ok', ruptures: 'partiel', lineaire: 'ok', merch: 'ok', balisage: 'partiel', commandes: 'ok', stocks: 'ok', etat_general: 'partiel', reserve: 'ko', autonomie: 'partiel' },
    actions: ['Relancer gérant sur HACCP', 'Contrôle réserve sous 72h'],
  },
  {
    id: 'v2', magasin: 'Vival Les Arceaux', magasin_id: '2', ville: 'Montpellier', moniteur: 'Marie Dupont',
    date: '2026-05-10', type: 'Standard', score: 71, duree: 48,
    gerant_present: true, notes: '',
    criteres: { haccp: 'ok', dlc: 'ok', proprete: 'partiel', ruptures: 'ok', lineaire: 'partiel', merch: 'ok', balisage: 'ok', commandes: 'ok', stocks: 'partiel', etat_general: 'ok', reserve: 'ok', autonomie: 'ok' },
    actions: ['Réassortir linéaire froid'],
  },
  {
    id: 'v3', magasin: 'Spar Lattes', magasin_id: '3', ville: 'Lattes', moniteur: 'Marie Dupont',
    date: '2026-05-03', type: 'Standard', score: 68, duree: 52,
    gerant_present: false, notes: 'Gérant absent, adjoint présent.',
    criteres: { haccp: 'partiel', dlc: 'ok', proprete: 'ok', ruptures: 'partiel', lineaire: 'ok', merch: 'partiel', balisage: 'ok', commandes: 'partiel', stocks: 'ok', etat_general: 'ok', reserve: 'ok', autonomie: 'partiel' },
    actions: [],
  },
  {
    id: 'v4', magasin: 'Casino Shop Pérols', magasin_id: '4', ville: 'Pérols', moniteur: 'Marie Dupont',
    date: '2026-05-02', type: 'Standard', score: 74, duree: 44,
    gerant_present: true, notes: '',
    criteres: { haccp: 'ok', dlc: 'ok', proprete: 'ok', ruptures: 'partiel', lineaire: 'ok', merch: 'ok', balisage: 'ok', commandes: 'ok', stocks: 'ok', etat_general: 'ok', reserve: 'ok', autonomie: 'ok' },
    actions: [],
  },
  {
    id: 'v5', magasin: 'Casino Sup. Palavas', magasin_id: '1', ville: 'Palavas', moniteur: 'Marie Dupont',
    date: '2026-04-14', type: 'Standard', score: 71, duree: 60,
    gerant_present: true, notes: '',
    criteres: { haccp: 'ok', dlc: 'ok', proprete: 'partiel', ruptures: 'partiel', lineaire: 'ok', merch: 'ok', balisage: 'ok', commandes: 'ok', stocks: 'ok', etat_general: 'ok', reserve: 'ok', autonomie: 'ok' },
    actions: ['Réorganiser rayon frais'],
  },
  {
    id: 'v6', magasin: 'Vival Les Arceaux', magasin_id: '2', ville: 'Montpellier', moniteur: 'Marie Dupont',
    date: '2026-04-26', type: 'Standard', score: 78, duree: 50,
    gerant_present: true, notes: 'Bon point sur la propreté.',
    criteres: { haccp: 'ok', dlc: 'ok', proprete: 'ok', ruptures: 'partiel', lineaire: 'ok', merch: 'ok', balisage: 'ok', commandes: 'ok', stocks: 'ok', etat_general: 'ok', reserve: 'ok', autonomie: 'ok' },
    actions: [],
  },
  {
    id: 'v7', magasin: 'Casino Sup. Palavas', magasin_id: '1', ville: 'Palavas', moniteur: 'Marie Dupont',
    date: '2026-03-31', type: 'Contrôle', score: 68, duree: 75,
    gerant_present: true, notes: 'Contrôle suite alerte HACCP.',
    criteres: { haccp: 'ok', dlc: 'partiel', proprete: 'ok', ruptures: 'ko', lineaire: 'ok', merch: 'ok', balisage: 'ok', commandes: 'partiel', stocks: 'ok', etat_general: 'ok', reserve: 'partiel', autonomie: 'partiel' },
    actions: ['Revoir gestion commandes'],
  },
];

const MAGASINS_LIST  = [...new Set(MOCK_VISITES.map(v => v.magasin))].sort();
const MONITEURS_LIST = [...new Set(MOCK_VISITES.map(v => v.moniteur))].sort();
const TYPES_LIST     = [...new Set(MOCK_VISITES.map(v => v.type))].sort();

/* ── State local ── */
let state = {
  filters: { magasin: '', moniteur: '', type: '', periode: '', score: '' },
  expanded: new Set(),
  showNouvelle: false,
};

/* Labels critères */
const CRIT_LABELS = {
  haccp: 'HACCP/Hygiène', dlc: 'DLC/Froid', proprete: 'Propreté',
  ruptures: 'Ruptures', lineaire: 'Linéaire', merch: 'Merch/Promo',
  balisage: 'Balisage', commandes: 'Commandes', stocks: 'Stocks/Casse',
  etat_general: 'État général', reserve: 'Réserve', autonomie: 'Autonomie gérant',
};
const CRIT_CLASS = { ok: 'pill-green', partiel: 'pill-orange', ko: 'pill-red' };
const CRIT_LABEL = { ok: 'OK', partiel: 'Partiel', ko: 'KO' };

/* ══════════════════════════════════════════
   RENDER PRINCIPAL
   ══════════════════════════════════════════ */
export function render() {
  const visites = filteredVisites();
  const scoresMoy = visites.length ? Math.round(visites.reduce((s, v) => s + v.score, 0) / visites.length) : 0;

  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">Visites</h1>
        <p class="page-subtitle">Journal — ${MOCK_VISITES.length} visites enregistrées</p>
      </div>
      <div class="page-actions desktop-only">
        <button class="btn btn-secondary btn-sm" id="btn-export-csv">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </button>
        <button class="btn btn-primary btn-sm" id="btn-nouvelle-visite">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouvelle visite
        </button>
      </div>
    </div>

    <!-- Filtres croisés -->
    <div class="card card-sm" style="margin-bottom:var(--space-4);">
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--space-3);" id="visites-filters">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Magasin</label>
          <select class="form-select" id="f-magasin">
            <option value="">Tous</option>
            ${MAGASINS_LIST.map(m => `<option value="${m}" ${state.filters.magasin === m ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Moniteur</label>
          <select class="form-select" id="f-moniteur">
            <option value="">Tous</option>
            ${MONITEURS_LIST.map(m => `<option value="${m}" ${state.filters.moniteur === m ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Type</label>
          <select class="form-select" id="f-type">
            <option value="">Tous</option>
            ${TYPES_LIST.map(t => `<option value="${t}" ${state.filters.type === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Score</label>
          <select class="form-select" id="f-score">
            <option value="">Tous</option>
            <option value="conforme" ${state.filters.score === 'conforme' ? 'selected' : ''}>Conforme (≥80)</option>
            <option value="risque"   ${state.filters.score === 'risque'   ? 'selected' : ''}>À risque (60-79)</option>
            <option value="urgent"   ${state.filters.score === 'urgent'   ? 'selected' : ''}>Urgent (&lt;60)</option>
          </select>
        </div>
      </div>
      ${hasActiveFilters() ? `
        <div style="margin-top:var(--space-3);padding-top:var(--space-3);border-top:1px solid var(--color-border);display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:var(--text-sm);color:var(--color-text-mid);">${visites.length} résultat${visites.length > 1 ? 's' : ''}</span>
          <button class="btn btn-ghost btn-sm" id="btn-clear-filters">Effacer les filtres</button>
        </div>
      ` : ''}
    </div>

    <!-- Statistiques rapides -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-3);margin-bottom:var(--space-5);">
      <div style="background:var(--color-card-bg);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:var(--space-3) var(--space-4);text-align:center;">
        <div style="font-size:var(--text-2xl);font-weight:var(--weight-bold);color:var(--color-text-dark);line-height:1;">${visites.length}</div>
        <div style="font-size:var(--text-xs);color:var(--color-text-light);margin-top:4px;">Visites</div>
      </div>
      <div style="background:var(--color-card-bg);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:var(--space-3) var(--space-4);text-align:center;">
        <div style="font-size:var(--text-2xl);font-weight:var(--weight-bold);color:${scoreValueClass(scoresMoy) === 'score-green' ? 'var(--color-green-text)' : scoreValueClass(scoresMoy) === 'score-orange' ? 'var(--color-orange-text)' : 'var(--color-red-text)'};line-height:1;">${scoresMoy}</div>
        <div style="font-size:var(--text-xs);color:var(--color-text-light);margin-top:4px;">Score moyen</div>
      </div>
      <div style="background:var(--color-card-bg);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:var(--space-3) var(--space-4);text-align:center;">
        <div style="font-size:var(--text-2xl);font-weight:var(--weight-bold);color:var(--color-text-dark);line-height:1;">${Math.round(visites.reduce((s,v) => s + v.duree, 0) / (visites.length || 1))}m</div>
        <div style="font-size:var(--text-xs);color:var(--color-text-light);margin-top:4px;">Durée moy.</div>
      </div>
    </div>

    <!-- Journal -->
    <div id="visites-journal">
      ${renderJournal(visites)}
    </div>
  `;
}

/* ── Journal (liste dépliable) ── */
function renderJournal(visites) {
  if (visites.length === 0) {
    return `<div class="empty-state"><div class="empty-state-title">Aucune visite trouvée</div><div class="empty-state-sub">Modifiez vos filtres.</div></div>`;
  }

  // Grouper par mois
  const grouped = {};
  for (const v of visites) {
    const key = v.date.substring(0, 7); // YYYY-MM
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(v);
  }

  return Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([moisKey, list]) => {
      const [year, month] = moisKey.split('-');
      const moisLabel = new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      return `
        <div style="margin-bottom:var(--space-5);">
          <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);display:flex;align-items:center;gap:var(--space-2);">
            ${moisLabel}
            <span style="background:var(--color-hover-bg);padding:1px 7px;border-radius:var(--radius-full);font-size:10px;">${list.length}</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Magasin</th>
                  <th>Type</th>
                  <th>Score</th>
                  <th>Moniteur</th>
                  <th>Durée</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${list.map(v => renderVisteRow(v)).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');
}

function renderVisteRow(v) {
  const isExpanded = state.expanded.has(v.id);
  const koCount = Object.values(v.criteres).filter(c => c === 'ko').length;
  const partielCount = Object.values(v.criteres).filter(c => c === 'partiel').length;

  return `
    <tr class="visite-toggle ${isExpanded ? 'expanded' : ''}" data-visite-id="${v.id}" style="cursor:pointer;">
      <td>
        <div style="font-size:var(--text-sm);font-weight:var(--weight-medium);">${shortDate(v.date)}</div>
      </td>
      <td>
        <div style="font-size:var(--text-sm);font-weight:var(--weight-medium);">${v.magasin}</div>
        <div style="font-size:var(--text-xs);color:var(--color-text-light);">${v.ville}</div>
      </td>
      <td><span style="font-size:var(--text-xs);color:var(--color-text-mid);">${v.type}</span></td>
      <td>
        <span class="score-value ${scoreValueClass(v.score)}" style="font-size:var(--text-md);font-weight:var(--weight-bold);">${v.score}</span>
        <span style="font-size:var(--text-xs);color:var(--color-text-light);">/100</span>
      </td>
      <td style="font-size:var(--text-sm);color:var(--color-text-mid);">${v.moniteur.split(' ')[0]} ${v.moniteur.split(' ')[1]?.[0]||''}.</td>
      <td style="font-size:var(--text-sm);color:var(--color-text-light);">${v.duree}m</td>
      <td>
        <div style="display:flex;align-items:center;gap:4px;">
          ${koCount > 0 ? `<span class="pill pill-red pill-nodot" style="font-size:9px;">${koCount} KO</span>` : ''}
          ${partielCount > 0 ? `<span class="pill pill-orange pill-nodot" style="font-size:9px;">${partielCount} partiel</span>` : ''}
          <svg class="expand-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="color:var(--color-text-light);flex-shrink:0;transition:transform 200ms;${isExpanded ? 'transform:rotate(180deg);' : ''}"><path d="M6 9l6 6 6-6"/></svg>
        </div>
      </td>
    </tr>
    ${isExpanded ? renderVisiteDetail(v) : ''}
  `;
}

function renderVisiteDetail(v) {
  return `
    <tr class="expand-row" data-detail-id="${v.id}">
      <td colspan="7" style="padding:var(--space-4) var(--space-3);background:var(--color-app-bg);max-width:0;width:100%;">
        <div style="display:flex;flex-wrap:wrap;gap:var(--space-4);width:100%;min-width:0;">

          <!-- Critères audit -->
          <div style="flex:1;min-width:200px;">
            <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">Critères audit</div>
            <div style="display:flex;flex-direction:column;gap:var(--space-1);">
              ${Object.entries(v.criteres).map(([k, val]) => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--color-border);">
                  <span style="font-size:var(--text-xs);color:var(--color-text-mid);">${CRIT_LABELS[k] || k}</span>
                  <span class="pill ${CRIT_CLASS[val]} pill-nodot" style="font-size:9px;">${CRIT_LABEL[val]}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Infos + Actions -->
          <div style="flex:1;min-width:200px;display:flex;flex-direction:column;gap:var(--space-4);">
            <div>
              <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-2);">Informations</div>
              <div style="display:flex;flex-direction:column;gap:var(--space-1);">
                <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);padding:3px 0;border-bottom:1px solid var(--color-border);">
                  <span style="color:var(--color-text-light);">Gérant présent</span>
                  <span style="color:${v.gerant_present ? 'var(--color-green-text)' : 'var(--color-red-text)'};">${v.gerant_present ? 'Oui' : 'Non'}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);padding:3px 0;border-bottom:1px solid var(--color-border);">
                  <span style="color:var(--color-text-light);">Durée</span>
                  <span>${v.duree} minutes</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);padding:3px 0;">
                  <span style="color:var(--color-text-light);">Moniteur</span>
                  <span>${v.moniteur}</span>
                </div>
              </div>
            </div>

            ${v.notes ? `
              <div>
                <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-2);">Notes</div>
                <div style="font-size:var(--text-xs);color:var(--color-text-mid);line-height:var(--leading-normal);background:var(--color-card-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:var(--space-2) var(--space-3);">${v.notes}</div>
              </div>
            ` : ''}

            ${v.actions.length > 0 ? `
              <div>
                <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-2);">Actions créées</div>
                ${v.actions.map(a => `
                  <div style="display:flex;align-items:flex-start;gap:var(--space-2);padding:4px 0;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" style="color:var(--color-orange-text);flex-shrink:0;margin-top:2px;"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    <span style="font-size:var(--text-xs);color:var(--color-text-mid);">${a}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <div style="display:flex;gap:var(--space-2);margin-top:auto;">
              <button class="btn btn-secondary btn-sm" data-action="voir-magasin" data-id="${v.magasin_id}">Voir magasin</button>
              <button class="btn btn-ghost btn-sm" data-action="export-pdf" data-visite="${v.id}">PDF</button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  `;
}

/* ══════════════════════════════════════════
   FORMULAIRE NOUVELLE VISITE (desktop)
   ══════════════════════════════════════════ */
function renderNouvelleVisite() {
  return `
    <div style="display:flex;flex-direction:column;gap:var(--space-4);">
      <div class="form-group">
        <label class="form-label required">Magasin</label>
        <select class="form-select" id="nv-magasin">
          <option value="">Sélectionner…</option>
          ${MAGASINS_LIST.map(m => `<option value="${m}">${m}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">Date</label>
          <input type="date" class="form-input" id="nv-date" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label class="form-label">Type</label>
          <select class="form-select" id="nv-type">
            <option>Standard</option>
            <option>Contrôle</option>
            <option>Flash</option>
          </select>
        </div>
      </div>

      <hr class="divider">
      <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;">Audit — 12 critères</div>

      ${AUDIT_CRITERIA.map(c => `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);padding:var(--space-2) 0;border-bottom:1px solid var(--color-border);">
          <span style="font-size:var(--text-sm);color:var(--color-text-dark);flex:1;">${c.label}</span>
          <div style="display:flex;gap:var(--space-1);">
            <button class="audit-btn-nv" data-crit="${c.id}" data-val="ok" style="padding:4px 8px;font-size:var(--text-xs);border:1.5px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-app-bg);color:var(--color-text-mid);cursor:pointer;transition:all var(--transition-fast);">OK</button>
            <button class="audit-btn-nv" data-crit="${c.id}" data-val="partiel" style="padding:4px 8px;font-size:var(--text-xs);border:1.5px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-app-bg);color:var(--color-text-mid);cursor:pointer;transition:all var(--transition-fast);">Partiel</button>
            <button class="audit-btn-nv" data-crit="${c.id}" data-val="ko" style="padding:4px 8px;font-size:var(--text-xs);border:1.5px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-app-bg);color:var(--color-text-mid);cursor:pointer;transition:all var(--transition-fast);">KO</button>
          </div>
        </div>
      `).join('')}

      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" id="nv-notes" placeholder="Observations, points de vigilance…"></textarea>
      </div>

      <div style="display:flex;gap:var(--space-2);padding-top:var(--space-2);">
        <button class="btn btn-ghost" id="btn-annuler-visite" style="flex:1;justify-content:center;">Annuler</button>
        <button class="btn btn-primary" id="btn-sauver-visite" style="flex:2;justify-content:center;">Enregistrer la visite</button>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════
   FILTRES
   ══════════════════════════════════════════ */
function filteredVisites() {
  let list = [...MOCK_VISITES].sort((a, b) => b.date.localeCompare(a.date));
  if (state.filters.magasin)  list = list.filter(v => v.magasin === state.filters.magasin);
  if (state.filters.moniteur) list = list.filter(v => v.moniteur === state.filters.moniteur);
  if (state.filters.type)     list = list.filter(v => v.type === state.filters.type);
  if (state.filters.score === 'conforme') list = list.filter(v => v.score >= 80);
  if (state.filters.score === 'risque')   list = list.filter(v => v.score >= 60 && v.score < 80);
  if (state.filters.score === 'urgent')   list = list.filter(v => v.score < 60);
  return list;
}

function hasActiveFilters() {
  return Object.values(state.filters).some(v => v !== '');
}

function refreshJournal() {
  const visites = filteredVisites();
  const journal = document.getElementById('visites-journal');
  if (journal) journal.innerHTML = renderJournal(visites);
  bindJournalEvents();
}

/* ══════════════════════════════════════════
   INIT & EVENTS
   ══════════════════════════════════════════ */
export function init(container) {
  // Filtres
  ['magasin', 'moniteur', 'type', 'score'].forEach(key => {
    container.querySelector(`#f-${key}`)?.addEventListener('change', e => {
      state.filters[key] = e.target.value;
      refreshJournal();
    });
  });

  container.querySelector('#btn-clear-filters')?.addEventListener('click', () => {
    state.filters = { magasin: '', moniteur: '', type: '', periode: '', score: '' };
    container.querySelectorAll('#visites-filters select').forEach(s => s.value = '');
    refreshJournal();
  });

  // Nouvelle visite desktop
  container.querySelector('#btn-nouvelle-visite')?.addEventListener('click', () => {
    openSidePanel({ id: 'nouvelle-visite', title: 'Nouvelle visite', content: renderNouvelleVisite() });
    setTimeout(() => bindNouvelleVisiteEvents(), 0);
  });

  // Export CSV
  container.querySelector('#btn-export-csv')?.addEventListener('click', () => {
    exportCSV();
  });

  bindJournalEvents();
}

function bindJournalEvents() {
  document.querySelectorAll('.visite-toggle').forEach(tr => {
    tr.addEventListener('click', () => {
      const id = tr.dataset.visiteId;
      const wasExpanded = state.expanded.has(id);
      if (wasExpanded) {
        state.expanded.delete(id);
      } else {
        state.expanded.add(id);
      }
      refreshJournal();
    });
  });

  document.querySelectorAll('[data-action="voir-magasin"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      import('./app.js').then(m => m.navigate('magasins'));
    });
  });

  document.querySelectorAll('[data-action="export-pdf"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      showToast('Export PDF — Phase 2');
    });
  });
}

function bindNouvelleVisiteEvents() {
  const panel = document.getElementById('side-panel-body');
  if (!panel) return;

  const answers = {};

  // Boutons audit
  panel.querySelectorAll('.audit-btn-nv').forEach(btn => {
    btn.addEventListener('click', () => {
      const crit = btn.dataset.crit;
      const val  = btn.dataset.val;
      answers[crit] = val;

      // Mettre à jour style des 3 boutons du critère
      panel.querySelectorAll(`.audit-btn-nv[data-crit="${crit}"]`).forEach(b => {
        const bval = b.dataset.val;
        const isSelected = bval === val;
        b.style.background = isSelected
          ? bval === 'ok' ? 'var(--color-green-bg)' : bval === 'partiel' ? 'var(--color-orange-bg)' : 'var(--color-red-bg)'
          : 'var(--color-app-bg)';
        b.style.color = isSelected
          ? bval === 'ok' ? 'var(--color-green-text)' : bval === 'partiel' ? 'var(--color-orange-text)' : 'var(--color-red-text)'
          : 'var(--color-text-mid)';
        b.style.borderColor = isSelected
          ? bval === 'ok' ? 'var(--color-green-border)' : bval === 'partiel' ? 'var(--color-orange-border)' : 'var(--color-red-border)'
          : 'var(--color-border)';
      });
    });
  });

  // Annuler
  panel.querySelector('#btn-annuler-visite')?.addEventListener('click', () => {
    document.getElementById('side-panel')?.classList.remove('open');
    document.getElementById('panel-overlay')?.classList.remove('open');
  });

  // Sauver
  panel.querySelector('#btn-sauver-visite')?.addEventListener('click', () => {
    const magasin = panel.querySelector('#nv-magasin')?.value;
    if (!magasin) { showToast('Sélectionnez un magasin', 'error'); return; }
    showToast('Visite enregistrée ✓ — Connexion Supabase Phase 2', 'success');
    document.getElementById('side-panel')?.classList.remove('open');
    document.getElementById('panel-overlay')?.classList.remove('open');
  });
}

/* ══════════════════════════════════════════
   EXPORT CSV
   ══════════════════════════════════════════ */
function exportCSV() {
  const visites = filteredVisites();
  const headers = ['Date', 'Magasin', 'Ville', 'Type', 'Score', 'Moniteur', 'Durée (min)', 'Gérant présent', 'Notes'];
  const rows = visites.map(v => [
    v.date, v.magasin, v.ville, v.type, v.score, v.moniteur, v.duree,
    v.gerant_present ? 'Oui' : 'Non',
    v.notes.replace(/,/g, ';'),
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `visites_proxipilot_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Export CSV téléchargé ✓', 'success');
}

/* Export pour mobile FAB */
export function openNewVisiteMobile() {
  openSidePanel({ id: 'nouvelle-visite', title: 'Nouvelle visite', content: renderNouvelleVisite() });
  setTimeout(() => bindNouvelleVisiteEvents(), 0);
}
