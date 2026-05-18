/* ============================================================
   ProxiPilot — alertes.js
   Alertes & Actions — 2 onglets, triées par âge, inline actions
   ============================================================ */

import { openSidePanel, showToast } from './app.js';
import { shortDate, relativeDate } from './config.js';
import { getAlertes, getActions, updateAction, relancerAlerte, cloturerAlerte, logActivity } from './supabase.js';

/* ══════════════════════════════════════════
   DONNÉES MOCK
   ══════════════════════════════════════════ */
const MOCK_ALERTES = [
  { id: 'a1', magasin: 'Casino Sup. Palavas', ville: 'Palavas', type: 'HACCP / Hygiène',     age: 8,  relance: 2, date_creation: '2026-05-09', derniere_relance: '2026-05-14', statut: 'ouvert',  moniteur: 'Marie Dupont',  priorite: 'haute' },
  { id: 'a2', magasin: 'Casino Sup. Palavas', ville: 'Palavas', type: 'DLC dépassée',         age: 5,  relance: 1, date_creation: '2026-05-12', derniere_relance: '2026-05-15', statut: 'ouvert',  moniteur: 'Marie Dupont',  priorite: 'haute' },
  { id: 'a3', magasin: 'Carrefour Antigone',  ville: 'Montpellier', type: 'Démarque élevée',  age: 3,  relance: 0, date_creation: '2026-05-14', derniere_relance: null,         statut: 'ouvert',  moniteur: 'Marie Dupont',  priorite: 'moyenne' },
  { id: 'a4', magasin: 'Spar Lattes',         ville: 'Lattes',  type: 'HACCP / Hygiène',     age: 2,  relance: 0, date_creation: '2026-05-15', derniere_relance: null,         statut: 'ouvert',  moniteur: 'Marie Dupont',  priorite: 'haute' },
  { id: 'a5', magasin: 'Vival Les Arceaux',   ville: 'Montpellier', type: 'Ruptures rayon',   age: 1,  relance: 0, date_creation: '2026-05-16', derniere_relance: null,         statut: 'ouvert',  moniteur: 'Marie Dupont',  priorite: 'basse' },
  { id: 'a6', magasin: 'Casino Shop Pérols',  ville: 'Pérols',  type: 'Balisage prix',       age: 12, relance: 3, date_creation: '2026-05-05', derniere_relance: '2026-05-16', statut: 'cloture', moniteur: 'Marie Dupont',  priorite: 'basse' },
  { id: 'a7', magasin: 'Vival Les Arceaux',   ville: 'Montpellier', type: 'Propreté générale',age: 9,  relance: 2, date_creation: '2026-05-08', derniere_relance: '2026-05-13', statut: 'cloture', moniteur: 'Marie Dupont',  priorite: 'moyenne' },
];

const MOCK_ACTIONS = [
  { id: 'ac1', magasin: 'Casino Sup. Palavas', ville: 'Palavas',     label: 'Réorganiser réserve',        age: 15, echeance: '2026-05-20', statut: 'ouvert',  priorite: 'haute',   alerte_id: 'a1' },
  { id: 'ac2', magasin: 'Carrefour Antigone',  ville: 'Montpellier', label: 'Audit démarque complet',     age: 10, echeance: '2026-05-25', statut: 'ouvert',  priorite: 'moyenne', alerte_id: 'a3' },
  { id: 'ac3', magasin: 'Spar Lattes',         ville: 'Lattes',      label: 'Formation HACCP gérant',     age: 8,  echeance: '2026-05-28', statut: 'ouvert',  priorite: 'haute',   alerte_id: 'a4' },
  { id: 'ac4', magasin: 'Vival Les Arceaux',   ville: 'Montpellier', label: 'Réassort linéaires',         age: 3,  echeance: '2026-05-22', statut: 'ouvert',  priorite: 'basse',   alerte_id: 'a5' },
  { id: 'ac5', magasin: 'Casino Sup. Palavas', ville: 'Palavas',     label: 'Contrôle chaîne du froid',   age: 5,  echeance: '2026-05-21', statut: 'ouvert',  priorite: 'haute',   alerte_id: 'a2' },
  { id: 'ac6', magasin: 'Casino Shop Pérols',  ville: 'Pérols',      label: 'Mise à jour étiquettes prix',age: 14, echeance: '2026-05-10', statut: 'cloture', priorite: 'basse',   alerte_id: 'ac6' },
  { id: 'ac7', magasin: 'Vival Les Arceaux',   ville: 'Montpellier', label: 'Nettoyage sols réserve',     age: 11, echeance: '2026-05-12', statut: 'cloture', priorite: 'moyenne', alerte_id: null },
];

/* ── State local ── */
let state = {
  onglet: 'alertes',  // 'alertes' | 'actions'
  alertes: [...MOCK_ALERTES],
  actions: [...MOCK_ACTIONS],
};

/* ══════════════════════════════════════════
   RENDER PRINCIPAL
   ══════════════════════════════════════════ */
export function render() {
  const alertesOuvertes = state.alertes.filter(a => a.statut === 'ouvert').length;
  const actionsOuvertes = state.actions.filter(a => a.statut === 'ouvert').length;

  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">Alertes & Actions</h1>
        <p class="page-subtitle">${alertesOuvertes} alerte${alertesOuvertes > 1 ? 's' : ''} · ${actionsOuvertes} action${actionsOuvertes > 1 ? 's' : ''} ouvertes</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" id="btn-new-action">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouvelle action
        </button>
        <button class="btn btn-primary btn-sm" id="btn-new-alerte">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouvelle alerte
        </button>
      </div>
    </div>

    <!-- Onglets principaux -->
    <div style="display:flex;gap:2px;border-bottom:1px solid var(--color-border);margin-bottom:var(--space-5);">
      <div class="tab ${state.onglet === 'alertes' ? 'active' : ''}" id="tab-alertes" style="font-size:var(--text-md);">
        Alertes
        <span style="font-size:10px;background:var(--color-red-bg);color:var(--color-red-text);padding:1px 6px;border-radius:var(--radius-full);margin-left:var(--space-1);font-weight:var(--weight-semi);">${alertesOuvertes}</span>
      </div>
      <div class="tab ${state.onglet === 'actions' ? 'active' : ''}" id="tab-actions" style="font-size:var(--text-md);">
        Actions
        <span style="font-size:10px;background:var(--color-orange-bg);color:var(--color-orange-text);padding:1px 6px;border-radius:var(--radius-full);margin-left:var(--space-1);font-weight:var(--weight-semi);">${actionsOuvertes}</span>
      </div>
    </div>

    <!-- Contenu onglet actif -->
    <div id="alertes-content">
      ${state.onglet === 'alertes' ? renderAlertesTab() : renderActionsTab()}
    </div>
  `;
}

/* ══════════════════════════════════════════
   ONGLET ALERTES
   ══════════════════════════════════════════ */
function renderAlertesTab() {
  const ouvertes  = state.alertes.filter(a => a.statut === 'ouvert').sort((a, b) => b.age - a.age);
  const cloturesL = state.alertes.filter(a => a.statut === 'cloture').sort((a, b) => b.age - a.age);

  return `
    <!-- KPIs alertes -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-3);margin-bottom:var(--space-5);">
      ${kpiMini('Ouvertes', ouvertes.length, 'var(--color-red-text)', 'var(--color-red-bg)')}
      ${kpiMini('Sans relance', ouvertes.filter(a => a.relance === 0).length, 'var(--color-orange-text)', 'var(--color-orange-bg)')}
      ${kpiMini('> 7 jours', ouvertes.filter(a => a.age > 7).length, 'var(--color-red-text)', 'var(--color-red-bg)')}
    </div>

    <!-- Alertes ouvertes -->
    <div style="margin-bottom:var(--space-6);">
      <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">
        Ouvertes — triées par ancienneté
      </div>
      ${ouvertes.length === 0
        ? `<div class="empty-state"><div class="empty-state-title">Aucune alerte ouverte</div></div>`
        : ouvertes.map(a => renderAlerteCard(a)).join('')
      }
    </div>

    <!-- Historique clôturées -->
    ${cloturesL.length > 0 ? `
      <div>
        <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">
          Clôturées récemment
        </div>
        ${cloturesL.map(a => renderAlerteCardClose(a)).join('')}
      </div>
    ` : ''}
  `;
}

function renderAlerteCard(a) {
  const ageCouleur = a.age >= 7
    ? 'var(--color-red-text)'
    : a.age >= 4
    ? 'var(--color-orange-text)'
    : 'var(--color-text-mid)';

  const prioriteBadge = {
    haute:   `<span class="pill pill-red pill-nodot" style="font-size:9px;">Haute</span>`,
    moyenne: `<span class="pill pill-orange pill-nodot" style="font-size:9px;">Moyenne</span>`,
    basse:   `<span class="pill pill-gray pill-nodot" style="font-size:9px;">Basse</span>`,
  }[a.priorite] || '';

  return `
    <div class="alerte-card" data-id="${a.id}" style="
      background:var(--color-card-bg);
      border:1px solid var(--color-border);
      border-left:3px solid ${a.age >= 7 ? 'var(--color-red-text)' : a.age >= 4 ? 'var(--color-orange-text)' : 'var(--color-border)'};
      border-radius:var(--radius-lg);
      padding:var(--space-4);
      margin-bottom:var(--space-3);
      cursor:pointer;
      transition:background var(--transition-fast);
    ">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-3);margin-bottom:var(--space-2);">
        <div style="flex:1;min-width:0;">
          <div style="font-size:var(--text-sm);font-weight:var(--weight-semi);color:var(--color-text-dark);margin-bottom:2px;">${a.magasin}</div>
          <div style="font-size:var(--text-xs);color:var(--color-text-light);">${a.ville} · ${a.moniteur}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:var(--text-xl);font-weight:var(--weight-bold);color:${ageCouleur};line-height:1;">${a.age}j</div>
          <div style="font-size:var(--text-xs);color:var(--color-text-light);">ancienneté</div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3);flex-wrap:wrap;">
        <span style="
          background:var(--color-hover-bg);
          color:var(--color-text-mid);
          font-size:var(--text-xs);
          font-weight:var(--weight-medium);
          padding:3px var(--space-2);
          border-radius:var(--radius-full);
        ">${a.type}</span>
        ${prioriteBadge}
        <span style="font-size:var(--text-xs);color:var(--color-text-light);">
          ${a.relance === 0
            ? `<span style="color:var(--color-orange-text);">Aucune relance</span>`
            : `${a.relance} relance${a.relance > 1 ? 's' : ''} · ${relativeDate(a.derniere_relance)}`
          }
        </span>
      </div>

      <!-- Actions inline -->
      <div style="display:flex;gap:var(--space-2);">
        <button class="btn btn-secondary btn-sm" data-action="relancer" data-id="${a.id}" style="flex:1;justify-content:center;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
          Relancer
        </button>
        <button class="btn btn-sm" data-action="cloturer" data-id="${a.id}" style="flex:1;justify-content:center;background:var(--color-green-bg);color:var(--color-green-text);border:1px solid var(--color-green-border);">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
          Clôturer
        </button>
        <button class="btn btn-ghost btn-sm" data-action="detail" data-id="${a.id}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </button>
      </div>
    </div>
  `;
}

function renderAlerteCardClose(a) {
  return `
    <div style="
      background:var(--color-app-bg);
      border:1px solid var(--color-border);
      border-radius:var(--radius-lg);
      padding:var(--space-3) var(--space-4);
      margin-bottom:var(--space-2);
      display:flex;align-items:center;gap:var(--space-3);
      opacity:.6;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="color:var(--color-green-text);flex-shrink:0;"><polyline points="20 6 9 17 4 12"/></svg>
      <div style="flex:1;min-width:0;">
        <div style="font-size:var(--text-sm);font-weight:var(--weight-medium);color:var(--color-text-mid);">${a.magasin} · ${a.type}</div>
        <div style="font-size:var(--text-xs);color:var(--color-text-light);">Clôturée · ${a.relance} relance${a.relance > 1 ? 's' : ''}</div>
      </div>
      <span style="font-size:var(--text-xs);color:var(--color-text-light);flex-shrink:0;">${a.age}j</span>
    </div>
  `;
}

/* ══════════════════════════════════════════
   ONGLET ACTIONS
   ══════════════════════════════════════════ */
function renderActionsTab() {
  const ouvertes  = state.actions.filter(a => a.statut === 'ouvert').sort((a, b) => b.age - a.age);
  const cloturesL = state.actions.filter(a => a.statut === 'cloture').sort((a, b) => b.age - a.age);

  return `
    <!-- KPIs actions -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-3);margin-bottom:var(--space-5);">
      ${kpiMini('Ouvertes', ouvertes.length, 'var(--color-orange-text)', 'var(--color-orange-bg)')}
      ${kpiMini('En retard', ouvertes.filter(a => new Date(a.echeance) < new Date()).length, 'var(--color-red-text)', 'var(--color-red-bg)')}
      ${kpiMini('Priorité haute', ouvertes.filter(a => a.priorite === 'haute').length, 'var(--color-orange-text)', 'var(--color-orange-bg)')}
    </div>

    <!-- Actions ouvertes -->
    <div style="margin-bottom:var(--space-6);">
      <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">
        Ouvertes — triées par ancienneté
      </div>
      ${ouvertes.length === 0
        ? `<div class="empty-state"><div class="empty-state-title">Aucune action ouverte</div></div>`
        : ouvertes.map(a => renderActionCard(a)).join('')
      }
    </div>

    <!-- Historique clôturées -->
    ${cloturesL.length > 0 ? `
      <div>
        <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">
          Clôturées récemment
        </div>
        ${cloturesL.map(a => renderActionCardClose(a)).join('')}
      </div>
    ` : ''}
  `;
}

function renderActionCard(a) {
  const enRetard = new Date(a.echeance) < new Date();
  const prioriteCouleur = { haute: 'var(--color-red-text)', moyenne: 'var(--color-orange-text)', basse: 'var(--color-text-mid)' }[a.priorite];
  const prioriteBorder  = { haute: 'var(--color-red-text)', moyenne: 'var(--color-orange-text)', basse: 'var(--color-border)' }[a.priorite];

  return `
    <div class="action-card" data-id="${a.id}" style="
      background:var(--color-card-bg);
      border:1px solid var(--color-border);
      border-left:3px solid ${prioriteBorder};
      border-radius:var(--radius-lg);
      padding:var(--space-4);
      margin-bottom:var(--space-3);
      cursor:pointer;
      transition:background var(--transition-fast);
    ">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-3);margin-bottom:var(--space-2);">
        <div style="flex:1;min-width:0;">
          <div style="font-size:var(--text-sm);font-weight:var(--weight-semi);color:var(--color-text-dark);margin-bottom:2px;">${a.label}</div>
          <div style="font-size:var(--text-xs);color:var(--color-text-light);">${a.magasin} · ${a.ville}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:var(--text-lg);font-weight:var(--weight-bold);color:${a.age >= 14 ? 'var(--color-red-text)' : 'var(--color-text-mid)'};line-height:1;">${a.age}j</div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3);flex-wrap:wrap;">
        <span style="font-size:var(--text-xs);color:${enRetard ? 'var(--color-red-text)' : 'var(--color-text-light)'};">
          ${enRetard
            ? `<span style="font-weight:var(--weight-semi);">⚠ En retard</span> · Échéance ${shortDate(a.echeance)}`
            : `Échéance ${shortDate(a.echeance)}`
          }
        </span>
        <span style="font-size:var(--text-xs);font-weight:var(--weight-medium);color:${prioriteCouleur};">${a.priorite.charAt(0).toUpperCase() + a.priorite.slice(1)}</span>
      </div>

      <div style="display:flex;gap:var(--space-2);">
        <button class="btn btn-sm" data-action="cloturer-action" data-id="${a.id}" style="flex:1;justify-content:center;background:var(--color-green-bg);color:var(--color-green-text);border:1px solid var(--color-green-border);">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
          Clôturer
        </button>
        <button class="btn btn-ghost btn-sm" data-action="detail-action" data-id="${a.id}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </button>
      </div>
    </div>
  `;
}

function renderActionCardClose(a) {
  return `
    <div style="
      background:var(--color-app-bg);border:1px solid var(--color-border);
      border-radius:var(--radius-lg);padding:var(--space-3) var(--space-4);
      margin-bottom:var(--space-2);display:flex;align-items:center;gap:var(--space-3);opacity:.6;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="color:var(--color-green-text);flex-shrink:0;"><polyline points="20 6 9 17 4 12"/></svg>
      <div style="flex:1;min-width:0;">
        <div style="font-size:var(--text-sm);font-weight:var(--weight-medium);color:var(--color-text-mid);">${a.label}</div>
        <div style="font-size:var(--text-xs);color:var(--color-text-light);">${a.magasin} · Clôturée</div>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════ */
function kpiMini(label, value, color, bg) {
  return `
    <div style="background:${bg};border-radius:var(--radius-lg);padding:var(--space-3) var(--space-4);text-align:center;">
      <div style="font-size:var(--text-2xl);font-weight:var(--weight-bold);color:${color};line-height:1;">${value}</div>
      <div style="font-size:var(--text-xs);color:${color};margin-top:4px;opacity:.8;">${label}</div>
    </div>
  `;
}

function refreshContent() {
  const el = document.getElementById('alertes-content');
  if (el) el.innerHTML = state.onglet === 'alertes' ? renderAlertesTab() : renderActionsTab();
  bindContentEvents();
}

/* ══════════════════════════════════════════
   PANNEAU DÉTAIL ALERTE
   ══════════════════════════════════════════ */
function renderDetailAlerte(a) {
  return `
    <div style="display:flex;flex-direction:column;gap:var(--space-4);">
      <div>
        <div style="font-size:var(--text-xs);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Magasin</div>
        <div style="font-weight:var(--weight-semi);">${a.magasin}</div>
        <div style="font-size:var(--text-sm);color:var(--color-text-light);">${a.ville}</div>
      </div>
      <div>
        <div style="font-size:var(--text-xs);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Type</div>
        <div style="font-weight:var(--weight-medium);">${a.type}</div>
      </div>
      <div>
        <div style="font-size:var(--text-xs);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Créée le</div>
        <div>${shortDate(a.date_creation)}</div>
      </div>
      <div>
        <div style="font-size:var(--text-xs);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Ancienneté</div>
        <div style="font-size:var(--text-2xl);font-weight:var(--weight-bold);color:${a.age >= 7 ? 'var(--color-red-text)' : 'var(--color-orange-text)'};">${a.age} jours</div>
      </div>
      <div>
        <div style="font-size:var(--text-xs);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Relances</div>
        <div>${a.relance === 0 ? '<span style="color:var(--color-orange-text);">Aucune relance effectuée</span>' : `${a.relance} relance${a.relance > 1 ? 's' : ''} · Dernière ${relativeDate(a.derniere_relance)}`}</div>
      </div>
      <hr class="divider">
      <div style="display:flex;flex-direction:column;gap:var(--space-2);">
        <button class="btn btn-secondary" style="justify-content:center;" data-action="relancer" data-id="${a.id}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
          Envoyer une relance
        </button>
        <button class="btn" style="justify-content:center;background:var(--color-green-bg);color:var(--color-green-text);border:1px solid var(--color-green-border);" data-action="cloturer" data-id="${a.id}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
          Clôturer l'alerte
        </button>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════
   INIT & EVENTS
   ══════════════════════════════════════════ */
export function init(container) {
  // Switch onglets
  container.querySelector('#tab-alertes')?.addEventListener('click', () => {
    state.onglet = 'alertes';
    container.querySelector('#tab-alertes')?.classList.add('active');
    container.querySelector('#tab-actions')?.classList.remove('active');
    refreshContent();
  });
  container.querySelector('#tab-actions')?.addEventListener('click', () => {
    state.onglet = 'actions';
    container.querySelector('#tab-actions')?.classList.add('active');
    container.querySelector('#tab-alertes')?.classList.remove('active');
    refreshContent();
  });

  // Boutons création
  container.querySelector('#btn-new-alerte')?.addEventListener('click', () => {
    openSidePanel({ id: 'new-alerte', title: 'Nouvelle alerte', content: renderFormulaireAlerte() });
    setTimeout(() => bindFormulaireAlerteEvents(), 0);
  });
  container.querySelector('#btn-new-action')?.addEventListener('click', () => {
    openSidePanel({ id: 'new-action', title: 'Nouvelle action', content: renderFormulaireAction() });
    setTimeout(() => bindFormulaireActionEvents(), 0);
  });

  // Chargement Supabase
  loadActionsSupabase();
  bindContentEvents();
}

/* ── Formulaire nouvelle alerte ── */
function renderFormulaireAlerte(prefill = {}) {
  const MAGASINS = ['Casino Sup. Palavas', 'Vival Les Arceaux', 'Spar Lattes', 'Casino Shop Pérols', 'Carrefour Express Antigone'];
  const TYPES    = ['HACCP / Hygiène', 'DLC / Chaîne du froid', 'Démarque élevée', 'Ruptures rayon', 'Propreté', 'Commandes', 'Autre'];

  return `
    <div style="display:flex;flex-direction:column;gap:var(--space-4);">
      <div class="form-group">
        <label class="form-label required">Magasin</label>
        <select class="form-select" id="na-magasin">
          <option value="">Sélectionner…</option>
          ${MAGASINS.map(m => `<option value="${m}" ${prefill.magasin===m?'selected':''}>${m}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label required">Type d'alerte</label>
        <select class="form-select" id="na-type">
          ${TYPES.map(t => `<option value="${t}" ${prefill.type===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label required">Description</label>
        <textarea class="form-textarea" id="na-description" placeholder="Décrivez la non-conformité constatée…">${prefill.description||''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Priorité</label>
        <div style="display:flex;gap:var(--space-2);">
          ${['haute','normale','basse'].map(p => `
            <label style="flex:1;display:flex;align-items:center;gap:var(--space-2);background:var(--color-hover-bg);border-radius:var(--radius-md);padding:var(--space-2) var(--space-3);cursor:pointer;">
              <input type="radio" name="na-priorite" value="${p}" ${(prefill.priorite||'haute')===p?'checked':''}>
              <span style="font-size:var(--text-sm);text-transform:capitalize;">${p}</span>
            </label>
          `).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Responsable</label>
        <input type="text" class="form-input" id="na-responsable" value="${prefill.responsable||'Marie Dupont'}">
      </div>
      <hr class="divider">
      <div style="display:flex;gap:var(--space-2);">
        <button class="btn btn-ghost" id="na-annuler" style="flex:1;justify-content:center;">Annuler</button>
        <button class="btn btn-primary" id="na-sauver" style="flex:2;justify-content:center;">Créer l'alerte</button>
      </div>
    </div>
  `;
}

/* ── Formulaire nouvelle action ── */
function renderFormulaireAction(prefill = {}) {
  const MAGASINS = ['Casino Sup. Palavas', 'Vival Les Arceaux', 'Spar Lattes', 'Casino Shop Pérols', 'Carrefour Express Antigone'];
  const TYPES    = ['Mise en conformité', 'Réapprovisionnement', 'Formation gérant', 'Vérification frigos', 'Correction balisage', 'Autre'];

  return `
    <div style="display:flex;flex-direction:column;gap:var(--space-4);">
      <div class="form-group">
        <label class="form-label required">Magasin</label>
        <select class="form-select" id="nac-magasin">
          <option value="">Sélectionner…</option>
          ${MAGASINS.map(m => `<option value="${m}" ${prefill.magasin===m?'selected':''}>${m}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label required">Type d'action</label>
        <select class="form-select" id="nac-type">
          ${TYPES.map(t => `<option value="${t}" ${prefill.type===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label required">Description</label>
        <textarea class="form-textarea" id="nac-description" placeholder="Décrivez l'action à réaliser…">${prefill.description||''}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Échéance</label>
          <input type="date" class="form-input" id="nac-echeance" value="${prefill.echeance||''}">
        </div>
        <div class="form-group">
          <label class="form-label">Responsable</label>
          <input type="text" class="form-input" id="nac-responsable" value="${prefill.responsable||'Marie Dupont'}">
        </div>
      </div>
      <hr class="divider">
      <div style="display:flex;gap:var(--space-2);">
        <button class="btn btn-ghost" id="nac-annuler" style="flex:1;justify-content:center;">Annuler</button>
        <button class="btn btn-primary" id="nac-sauver" style="flex:2;justify-content:center;">Créer l'action</button>
      </div>
    </div>
  `;
}

function bindFormulaireAlerteEvents() {
  const panel = document.getElementById('side-panel-body');
  if (!panel) return;

  panel.querySelector('#na-annuler')?.addEventListener('click', () => {
    document.getElementById('side-panel')?.classList.remove('open');
    document.getElementById('panel-overlay')?.classList.remove('open');
  });

  panel.querySelector('#na-sauver')?.addEventListener('click', async () => {
    const magasin     = panel.querySelector('#na-magasin')?.value;
    const type        = panel.querySelector('#na-type')?.value;
    const description = panel.querySelector('#na-description')?.value;
    const priorite    = panel.querySelector('input[name="na-priorite"]:checked')?.value || 'haute';
    const responsable = panel.querySelector('#na-responsable')?.value;

    if (!magasin) { showToast('Sélectionnez un magasin', 'error'); return; }
    if (!description.trim()) { showToast('Ajoutez une description', 'error'); return; }

    const btn = panel.querySelector('#na-sauver');
    btn.disabled = true; btn.textContent = 'Création…';

    try {
      const { createAction } = await import('./supabase.js');
      await createAction({
        mag: magasin, type_action: type, description,
        priorite, responsable, statut: 'ouvert',
        alerte: true, nb_relances: 0,
      });

      // Ajouter localement pour affichage immédiat
      state.alertes.unshift({
        id: 'new_' + Date.now(),
        magasin, type, description,
        statut: 'ouvert', priorite, responsable,
        relance: 0, age: 0,
        date_creation: new Date().toISOString().split('T')[0],
        derniere_relance: null,
      });

      showToast('Alerte créée ✓', 'success');
      document.getElementById('side-panel')?.classList.remove('open');
      document.getElementById('panel-overlay')?.classList.remove('open');
      refreshContent();
    } catch (err) {
      showToast('Erreur : ' + err.message, 'error');
      btn.disabled = false; btn.textContent = 'Créer l\'alerte';
    }
  });
}

function bindFormulaireActionEvents() {
  const panel = document.getElementById('side-panel-body');
  if (!panel) return;

  panel.querySelector('#nac-annuler')?.addEventListener('click', () => {
    document.getElementById('side-panel')?.classList.remove('open');
    document.getElementById('panel-overlay')?.classList.remove('open');
  });

  panel.querySelector('#nac-sauver')?.addEventListener('click', async () => {
    const magasin     = panel.querySelector('#nac-magasin')?.value;
    const type        = panel.querySelector('#nac-type')?.value;
    const description = panel.querySelector('#nac-description')?.value;
    const echeance    = panel.querySelector('#nac-echeance')?.value || null;
    const responsable = panel.querySelector('#nac-responsable')?.value;

    if (!magasin) { showToast('Sélectionnez un magasin', 'error'); return; }
    if (!description.trim()) { showToast('Ajoutez une description', 'error'); return; }

    const btn = panel.querySelector('#nac-sauver');
    btn.disabled = true; btn.textContent = 'Création…';

    try {
      const { createAction } = await import('./supabase.js');
      await createAction({
        mag: magasin, type_action: type, description,
        echeance, responsable, statut: 'ouvert',
        alerte: false, nb_relances: 0,
      });

      // Ajouter localement
      state.actions.unshift({
        id: 'new_' + Date.now(),
        magasin, type, description,
        statut: 'ouvert', echeance, responsable,
        relance: 0, age: 0,
        date_creation: new Date().toISOString().split('T')[0],
        derniere_relance: null, priorite: 'normale',
      });

      showToast('Action créée ✓', 'success');
      document.getElementById('side-panel')?.classList.remove('open');
      document.getElementById('panel-overlay')?.classList.remove('open');
      refreshContent();
    } catch (err) {
      showToast('Erreur : ' + err.message, 'error');
      btn.disabled = false; btn.textContent = 'Créer l\'action';
    }
  });
}

/* ── Export pour utilisation depuis d'autres modules (ex: visites) ── */
export function ouvrirFormulaireAlerte(prefill = {}) {
  openSidePanel({ id: 'new-alerte', title: 'Nouvelle alerte', content: renderFormulaireAlerte(prefill) });
  setTimeout(() => bindFormulaireAlerteEvents(), 0);
}

export function ouvrirFormulaireAction(prefill = {}) {
  openSidePanel({ id: 'new-action', title: 'Nouvelle action', content: renderFormulaireAction(prefill) });
  setTimeout(() => bindFormulaireActionEvents(), 0);
}

async function loadActionsSupabase() {
  try {
    // Charger alertes depuis la vraie table + actions depuis la table actions
    const [sbAlertes, sbActions] = await Promise.all([
      getAlertes(),
      getActions(),
    ]);

    const mapperAlerte = (a) => ({
      id:              String(a.id),
      magasin:         a.mag || a.code || '—',
      magasin_id:      a.code,
      type:            a.type_alerte || 'Alerte',
      description:     a.description || '',
      statut:          a.statut === 'cloturée' ? 'cloture' : 'ouvert',
      date_creation:   a.date_creation ? a.date_creation.split('T')[0] : '',
      derniere_relance:a.date_relance ? a.date_relance.split('T')[0] : null,
      echeance:        null,
      responsable:     a.responsable || 'Marie Dupont',
      relance:         a.nb_relances || 0,
      priorite:        a.priorite === 'haute' ? 'haute' : 'normale',
      age:             a.date_creation ? Math.floor((Date.now() - new Date(a.date_creation)) / 86400000) : 0,
      _source:         'alertes',
    });

    if (sbAlertes?.length) {
      MOCK_ALERTES.length = 0;
      MOCK_ALERTES.push(...sbAlertes.map(mapperAlerte));
    }
    if (!sbActions?.length) return;

    const mapperAction = (a) => ({
      id:              String(a.id),
      magasin:         a.mag || a.code,
      magasin_id:      a.code,
      type:            a.type_action || 'Action',
      description:     a.description || '',
      statut:          a.statut === 'cloture' ? 'cloture' : 'ouvert',
      date_creation:   a.date ? a.date.split('T')[0] : '',
      derniere_relance:null,
      echeance:        a.echeance,
      responsable:     a.responsable || 'Marie Dupont',
      relance:         a.nb_relances || 0,
      priorite:        a.alerte ? 'haute' : 'normale',
      age:             a.date ? Math.floor((Date.now() - new Date(a.date)) / 86400000) : 0,
    });

    const sbActionsFiltered = sbActions || [];

    if (alertes.length) {
      MOCK_ALERTES.length = 0;
      MOCK_ALERTES.push(...alertes);
    }
    const actions  = (sbActions || []).filter(a => !a.alerte).map(mapperAction);
    if (actions.length) {
      MOCK_ACTIONS.length = 0;
      MOCK_ACTIONS.push(...actions);
    }

    state.alertes = [...MOCK_ALERTES];
    state.actions = [...MOCK_ACTIONS];
    refreshContent();
  } catch (err) {
    console.warn('Alertes Supabase error — MOCK conservé:', err.message);
  }
}

function bindContentEvents() {
  const content = document.getElementById('alertes-content');
  if (!content) return;

  // Relancer alerte
  content.querySelectorAll('[data-action="relancer"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const a = state.alertes.find(x => x.id === id);
      if (a) { a.relance++; a.derniere_relance = new Date().toISOString().split('T')[0]; }
      showToast('Relance enregistrée ✓', 'success');
      refreshContent();
    });
  });

  // Clôturer alerte
  content.querySelectorAll('[data-action="cloturer"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const a = state.alertes.find(x => x.id === id);
      if (a) a.statut = 'cloture';
      showToast('Alerte clôturée ✓', 'success');
      refreshContent();
    });
  });

  // Clôturer action
  content.querySelectorAll('[data-action="cloturer-action"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const a = state.actions.find(x => x.id === id);
      if (a) a.statut = 'cloture';
      showToast('Action clôturée ✓', 'success');
      refreshContent();
    });
  });

  // Détail alerte → panneau
  content.querySelectorAll('[data-action="detail"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const a = state.alertes.find(x => x.id === btn.dataset.id);
      if (!a) return;
      openSidePanel({ id: `alerte-${a.id}`, title: `Alerte — ${a.type}`, content: renderDetailAlerte(a) });
      setTimeout(() => bindPanelEvents(), 0);
    });
  });

  // Clic carte → panneau
  content.querySelectorAll('.alerte-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('button')) return;
      const a = state.alertes.find(x => x.id === card.dataset.id);
      if (!a) return;
      openSidePanel({ id: `alerte-${a.id}`, title: `Alerte — ${a.type}`, content: renderDetailAlerte(a) });
      setTimeout(() => bindPanelEvents(), 0);
    });
  });
}

function bindPanelEvents() {
  const panel = document.getElementById('side-panel-body');
  if (!panel) return;
  panel.querySelectorAll('[data-action="relancer"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = state.alertes.find(x => x.id === btn.dataset.id);
      if (a) { a.relance++; a.derniere_relance = new Date().toISOString().split('T')[0]; }
      showToast('Relance enregistrée ✓', 'success');
      refreshContent();
    });
  });
  panel.querySelectorAll('[data-action="cloturer"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = state.alertes.find(x => x.id === btn.dataset.id);
      if (a) a.statut = 'cloture';
      showToast('Alerte clôturée ✓', 'success');
      refreshContent();
      document.getElementById('side-panel')?.classList.remove('open');
      document.getElementById('panel-overlay')?.classList.remove('open');
    });
  });
}
