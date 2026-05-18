/* ============================================================
   ProxiPilot — magasins.js
   Liste magasins + Fiche 5 onglets
   ============================================================ */

import { openSidePanel, showToast } from './app.js';
import { scoreClass, scoreValueClass, scoreLabel, relativeDate, shortDate, initials } from './config.js';
import { getMagasins, getVisites, getActions } from './supabase.js';

/* ══════════════════════════════════════════
   DONNÉES MOCK
   ══════════════════════════════════════════ */
const MOCK_MAGASINS = [
  {
    id: '1', nom: 'Casino Sup. Palavas', code_tf: 'TF-0421', ville: 'Palavas-les-Flots',
    score: 54, derniere_visite: '2026-04-28', statut: 'urgent', demarque: 5.2,
    moniteur: 'Marie Dupont', saisonnier: true,
    gerant: { nom: 'Jean-Pierre Blanc', tel: '06 12 34 56 78', email: 'jp.blanc@casino.fr', portail: 'https://portail.casino.fr' },
    equipe: [{ nom: 'Sophie Martin', poste: 'Adjointe' }, { nom: 'Lucas Roy', poste: 'Employé' }],
    horaires: {
      hors_saison: { lun: '8h-20h', mar: '8h-20h', mer: '8h-20h', jeu: '8h-20h', ven: '8h-21h', sam: '8h-21h', dim: '9h-13h' },
      saison:      { lun: '8h-21h', mar: '8h-21h', mer: '8h-21h', jeu: '8h-21h', ven: '8h-22h', sam: '8h-22h', dim: '9h-14h' },
    },
    livraisons: { sec: 'Mar/Jeu', frais: 'Lun/Mer/Ven', surgeles: 'Mer', fl: 'Lun/Jeu' },
    notes: 'Accès par porte arrière — code 1234. Réserve souvent encombrée.',
    adresse: '12 Av. de la Plage, 34250 Palavas-les-Flots',
    alertes: [
      { id: 'a1', type: 'HACCP', age: 8, relance: 2, statut: 'ouvert' },
      { id: 'a2', type: 'DLC dépassée', age: 5, relance: 1, statut: 'ouvert' },
    ],
    visites: [
      { id: 'v1', date: '2026-04-28', type: 'Standard', score: 54, moniteur: 'Marie Dupont', criteres: { haccp: 'ko', dlc: 'partiel', proprete: 'ok', ruptures: 'partiel' } },
      { id: 'v2', date: '2026-04-14', type: 'Standard', score: 71, moniteur: 'Marie Dupont', criteres: { haccp: 'ok', dlc: 'ok', proprete: 'partiel', ruptures: 'partiel' } },
      { id: 'v3', date: '2026-03-31', type: 'Standard', score: 68, moniteur: 'Marie Dupont', criteres: { haccp: 'ok', dlc: 'partiel', proprete: 'ok', ruptures: 'ko' } },
    ],
    performances: [
      { mois: 'Mai 2026', ca: 48200, freq: 1240, demarque: 5.2 },
      { mois: 'Avr 2026', ca: 45800, freq: 1180, demarque: 4.8 },
      { mois: 'Mar 2026', ca: 42100, freq: 1090, demarque: 3.9 },
    ],
    inventaires: [
      { date: '2025-11-15', type: 'Cession', ri: 142500, dmq: 2.1, gerant_present: true, statut: 'réalisé' },
      { date: '2026-05-24', type: 'Cession', ri: null, dmq: null, gerant_present: null, statut: 'planifié' },
    ],
  },
  {
    id: '2', nom: 'Vival Les Arceaux', code_tf: 'TF-0312', ville: 'Montpellier',
    score: 71, derniere_visite: '2026-05-10', statut: 'risque', demarque: 3.1,
    moniteur: 'Marie Dupont', saisonnier: false,
    gerant: { nom: 'Amandine Faure', tel: '06 98 76 54 32', email: 'a.faure@vival.fr', portail: '' },
    equipe: [{ nom: 'Pierre Leroy', poste: 'Adjoint' }],
    horaires: {
      hors_saison: { lun: '7h-21h', mar: '7h-21h', mer: '7h-21h', jeu: '7h-21h', ven: '7h-21h', sam: '8h-20h', dim: '9h-13h' },
      saison: null,
    },
    livraisons: { sec: 'Lun/Mer/Ven', frais: 'Mar/Jeu/Sam', surgeles: 'Lun', fl: 'Mar/Ven' },
    notes: '',
    adresse: '45 Rue des Arceaux, 34000 Montpellier',
    alertes: [{ id: 'a3', type: 'Démarque élevée', age: 3, relance: 0, statut: 'ouvert' }],
    visites: [
      { id: 'v4', date: '2026-05-10', type: 'Standard', score: 71, moniteur: 'Marie Dupont', criteres: { haccp: 'ok', dlc: 'ok', proprete: 'partiel', ruptures: 'ok' } },
      { id: 'v5', date: '2026-04-26', type: 'Standard', score: 78, moniteur: 'Marie Dupont', criteres: { haccp: 'ok', dlc: 'ok', proprete: 'ok', ruptures: 'partiel' } },
    ],
    performances: [
      { mois: 'Mai 2026', ca: 31400, freq: 820, demarque: 3.1 },
      { mois: 'Avr 2026', ca: 29800, freq: 790, demarque: 2.8 },
    ],
    inventaires: [
      { date: '2025-12-10', type: 'Contrôle', ri: 98000, dmq: 1.8, gerant_present: false, statut: 'réalisé' },
    ],
  },
  {
    id: '3', nom: 'Spar Lattes', code_tf: 'TF-0518', ville: 'Lattes',
    score: 68, derniere_visite: '2026-05-03', statut: 'risque', demarque: 2.4,
    moniteur: 'Marie Dupont', saisonnier: false,
    gerant: { nom: 'Karim Benali', tel: '06 55 44 33 22', email: 'k.benali@spar.fr', portail: '' },
    equipe: [],
    horaires: {
      hors_saison: { lun: '8h-20h', mar: '8h-20h', mer: '8h-20h', jeu: '8h-20h', ven: '8h-20h', sam: '8h-20h', dim: 'Fermé' },
      saison: null,
    },
    livraisons: { sec: 'Mar/Ven', frais: 'Lun/Mer/Ven', surgeles: 'Jeu', fl: 'Lun/Jeu' },
    notes: 'Gérant très autonome. Préférer visites matinales avant 10h.',
    adresse: '8 Rue du Commerce, 34970 Lattes',
    alertes: [{ id: 'a4', type: 'HACCP', age: 2, relance: 0, statut: 'ouvert' }],
    visites: [
      { id: 'v6', date: '2026-05-03', type: 'Standard', score: 68, moniteur: 'Marie Dupont', criteres: { haccp: 'partiel', dlc: 'ok', proprete: 'ok', ruptures: 'partiel' } },
    ],
    performances: [{ mois: 'Mai 2026', ca: 22100, freq: 610, demarque: 2.4 }],
    inventaires: [],
  },
  {
    id: '4', nom: 'Casino Shop Pérols', code_tf: 'TF-0290', ville: 'Pérols',
    score: 74, derniere_visite: '2026-05-02', statut: 'risque', demarque: 1.8,
    moniteur: 'Marie Dupont', saisonnier: false,
    gerant: { nom: 'Nathalie Girard', tel: '06 11 22 33 44', email: 'n.girard@casino.fr', portail: 'https://portail.casino.fr' },
    equipe: [{ nom: 'Tom Petit', poste: 'Adjoint' }],
    horaires: {
      hors_saison: { lun: '8h-20h', mar: '8h-20h', mer: '8h-20h', jeu: '8h-20h', ven: '8h-21h', sam: '8h-20h', dim: '9h-13h' },
      saison: null,
    },
    livraisons: { sec: 'Lun/Jeu', frais: 'Mar/Ven', surgeles: 'Mer', fl: 'Lun/Ven' },
    notes: '',
    adresse: '3 Place du Marché, 34470 Pérols',
    alertes: [],
    visites: [
      { id: 'v7', date: '2026-05-02', type: 'Standard', score: 74, moniteur: 'Marie Dupont', criteres: { haccp: 'ok', dlc: 'ok', proprete: 'ok', ruptures: 'partiel' } },
    ],
    performances: [{ mois: 'Mai 2026', ca: 18900, freq: 520, demarque: 1.8 }],
    inventaires: [],
  },
  {
    id: '5', nom: 'Carrefour Express Antigone', code_tf: 'TF-0105', ville: 'Montpellier',
    score: null, derniere_visite: null, statut: 'urgent', demarque: null,
    moniteur: 'Marie Dupont', saisonnier: false,
    gerant: { nom: 'Roberto Silva', tel: '06 77 88 99 00', email: 'r.silva@carrefour.fr', portail: '' },
    equipe: [],
    horaires: {
      hors_saison: { lun: '7h-22h', mar: '7h-22h', mer: '7h-22h', jeu: '7h-22h', ven: '7h-23h', sam: '7h-23h', dim: '9h-13h' },
      saison: null,
    },
    livraisons: { sec: 'Lun/Mer/Ven', frais: 'Mar/Jeu/Sam', surgeles: 'Mer', fl: 'Mar/Ven' },
    notes: 'Nouveau magasin — première visite à planifier.',
    adresse: "1 Place de l'Europe, 34000 Montpellier",
    alertes: [],
    visites: [],
    performances: [],
    inventaires: [],
  },
];

/* ── State local ── */
let state = {
  search: '',
  filtre: 'tous',
  tri: { col: 'nom', dir: 'asc' },
};

/* ══════════════════════════════════════════
   RENDER PRINCIPAL
   ══════════════════════════════════════════ */
export function render() {
  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">Magasins</h1>
        <p class="page-subtitle">${MOCK_MAGASINS.length} magasins — Secteur Sud Est</p>
      </div>
    </div>

    <div class="filter-bar" id="mag-filter-bar">
      <div class="search-bar">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="mag-search" placeholder="Rechercher un magasin…">
      </div>
      <div class="chip active" data-filtre="tous">Tous</div>
      <div class="chip" data-filtre="urgent">Urgent</div>
      <div class="chip" data-filtre="risque">À risque</div>
      <div class="chip" data-filtre="conforme">Conforme</div>
      <div class="chip" data-filtre="retard">En retard</div>
    </div>

    <div class="table-wrap" id="mag-table-wrap">
      ${renderTable()}
    </div>
  `;
}

/* ── Tableau ── */
function renderTable() {
  const magasins = filteredMagasins();
  if (magasins.length === 0) {
    return `<div class="empty-state"><div class="empty-state-title">Aucun magasin trouvé</div><div class="empty-state-sub">Modifiez vos filtres.</div></div>`;
  }

  const { col, dir } = state.tri;
  const sortIcon = (c) => col !== c ? '' : dir === 'asc'
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M18 15l-6-6-6 6"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M6 9l6 6 6-6"/></svg>`;

  return `
    <table id="mag-table">
      <thead>
        <tr>
          <th data-col="nom" class="${col==='nom'?'sorted':''}">Magasin ${sortIcon('nom')}</th>
          <th data-col="code_tf" class="${col==='code_tf'?'sorted':''}">Code TF ${sortIcon('code_tf')}</th>
          <th data-col="ville" class="${col==='ville'?'sorted':''}">Ville ${sortIcon('ville')}</th>
          <th data-col="score" class="${col==='score'?'sorted':''}">Score ${sortIcon('score')}</th>
          <th data-col="derniere_visite" class="${col==='derniere_visite'?'sorted':''}">Dernière visite ${sortIcon('derniere_visite')}</th>
          <th data-col="statut" class="${col==='statut'?'sorted':''}">Statut ${sortIcon('statut')}</th>
          <th data-col="demarque" class="${col==='demarque'?'sorted':''}">Démarque ${sortIcon('demarque')}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${magasins.map(renderRow).join('')}</tbody>
    </table>
  `;
}

function renderRow(m) {
  const neverVisited = !m.derniere_visite;
  const joursDepuis = m.derniere_visite ? Math.floor((new Date() - new Date(m.derniere_visite)) / 86400000) : null;
  const enRetard = joursDepuis > 16;

  const scoreHTML = m.score === null
    ? `<span style="color:var(--color-text-light);">—</span>`
    : `<span class="score-value ${scoreValueClass(m.score)}">${m.score}</span><span style="color:var(--color-text-light);font-size:var(--text-xs);margin-left:2px;">/100</span>`;

  const visiteHTML = neverVisited
    ? `<span style="color:var(--color-red-text);font-size:var(--text-sm);">Jamais</span>`
    : `<div style="font-size:var(--text-sm);">${relativeDate(m.derniere_visite)}</div>${enRetard ? `<div style="font-size:var(--text-xs);color:var(--color-red-text);">${joursDepuis}j</div>` : ''}`;

  const demarqueHTML = m.demarque === null
    ? `<span style="color:var(--color-text-light);">—</span>`
    : `<span style="color:${m.demarque >= 4 ? 'var(--color-red-text)' : m.demarque >= 2 ? 'var(--color-orange-text)' : 'var(--color-green-text)'};font-weight:var(--weight-semi);">${m.demarque}%</span>`;

  const statutPill = m.score === null
    ? `<span class="pill pill-gray pill-nodot">Nouveau</span>`
    : m.statut === 'conforme'
    ? `<span class="pill pill-green">${scoreLabel(m.score)}</span>`
    : m.statut === 'risque'
    ? `<span class="pill pill-orange">À risque</span>`
    : `<span class="pill pill-red">Urgent</span>`;

  return `
    <tr data-id="${m.id}" class="${neverVisited ? 'never-visited' : ''}">
      <td>
        <div style="font-weight:var(--weight-medium);">${m.nom}</div>
        ${m.saisonnier ? `<div style="font-size:var(--text-xs);color:var(--color-text-light);">Saisonnier</div>` : ''}
      </td>
      <td class="text-light">${m.code_tf}</td>
      <td class="text-mid">${m.ville}</td>
      <td>${scoreHTML}</td>
      <td>${visiteHTML}</td>
      <td>${statutPill}</td>
      <td>${demarqueHTML}</td>
      <td>
        <div class="hover-actions">
          <button class="btn btn-secondary btn-sm" data-action="visite" data-id="${m.id}">Visiter</button>
          <button class="btn btn-ghost btn-sm" data-action="fiche" data-id="${m.id}">Fiche →</button>
        </div>
      </td>
    </tr>
  `;
}

/* ══════════════════════════════════════════
   FICHE — PANNEAU LATÉRAL
   ══════════════════════════════════════════ */
function renderFiche(m) {
  return `
    <div>
      <div style="margin-bottom:var(--space-4);">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-3);margin-bottom:var(--space-3);">
          <div>
            <div style="font-size:var(--text-md);font-weight:var(--weight-bold);color:var(--color-text-dark);">${m.nom}</div>
            <div style="font-size:var(--text-sm);color:var(--color-text-light);">${m.code_tf} · ${m.adresse}</div>
          </div>
          ${m.score !== null ? `<span class="pill ${scoreClass(m.score)}">${scoreLabel(m.score)}</span>` : `<span class="pill pill-gray pill-nodot">Nouveau</span>`}
        </div>
        <!-- Actions rapides mobile -->
        <div style="display:flex;gap:var(--space-2);margin-bottom:var(--space-2);">
          <a href="tel:${m.gerant.tel}" class="btn btn-secondary btn-sm" style="text-decoration:none;flex:1;justify-content:center;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="13" height="13"><path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5-2.5l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>
            Gérant
          </a>
          <a href="https://waze.com/ul?q=${encodeURIComponent(m.adresse)}" target="_blank" class="btn btn-secondary btn-sm" style="text-decoration:none;flex:1;justify-content:center;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="13" height="13"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 1 8 8c0 5.4-7.2 12-8 12S4 15.4 4 10a8 8 0 0 1 8-8z"/></svg>
            Waze
          </a>
          <a href="mailto:${m.gerant.email}" class="btn btn-secondary btn-sm" style="text-decoration:none;flex:1;justify-content:center;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="13" height="13"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            Mail
          </a>
        </div>
      </div>

      <div class="tabs" id="fiche-tabs">
        <div class="tab active" data-tab="infos">Infos</div>
        <div class="tab" data-tab="visites">Visites${m.visites.length > 0 ? ` (${m.visites.length})` : ''}</div>
        <div class="tab" data-tab="actions">Actions${m.alertes.length > 0 ? ` (${m.alertes.length})` : ''}</div>
        <div class="tab" data-tab="performances">Perfs</div>
        <div class="tab" data-tab="inventaires">Invt.</div>
      </div>

      <div id="fiche-tab-content">${renderTabInfos(m)}</div>
    </div>
  `;
}

/* ── Tab Infos ── */
function renderTabInfos(m) {
  const jours = ['lun','mar','mer','jeu','ven','sam','dim'];
  const joursL = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  return `
    <div>
      <div style="margin-bottom:var(--space-4);">
        <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">Contact gérant</div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid var(--color-border);">
          <div>
            <div style="font-weight:var(--weight-semi);font-size:var(--text-sm);">${m.gerant.nom}</div>
            <div style="font-size:var(--text-xs);color:var(--color-text-light);">${m.gerant.tel} · ${m.gerant.email}</div>
          </div>
          <div style="display:flex;gap:4px;">
            <a href="tel:${m.gerant.tel}" class="icon-btn icon-btn-sm"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5-2.5l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg></a>
            <a href="mailto:${m.gerant.email}" class="icon-btn icon-btn-sm"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></a>
            ${m.gerant.portail ? `<a href="${m.gerant.portail}" target="_blank" class="icon-btn icon-btn-sm"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></a>` : ''}
          </div>
        </div>
        ${m.equipe.map(e => `
          <div style="display:flex;align-items:center;gap:var(--space-2);padding:var(--space-2) 0;border-bottom:1px solid var(--color-border);">
            <div style="width:24px;height:24px;min-width:24px;border-radius:50%;background:var(--color-hover-bg);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:var(--weight-bold);color:var(--color-text-mid);">${initials(e.nom)}</div>
            <div style="font-size:var(--text-sm);">${e.nom} <span style="color:var(--color-text-light);">· ${e.poste}</span></div>
          </div>
        `).join('')}
      </div>

      <hr class="divider">

      <div style="margin-bottom:var(--space-4);">
        <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">Horaires hors saison</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;text-align:center;">
          ${joursL.map((l,i) => `<div><div style="font-size:9px;font-weight:var(--weight-semi);color:var(--color-text-light);margin-bottom:2px;">${l}</div><div style="font-size:9px;color:var(--color-text-mid);background:var(--color-hover-bg);border-radius:4px;padding:3px 1px;line-height:1.4;">${m.horaires.hors_saison[jours[i]]}</div></div>`).join('')}
        </div>
        ${m.horaires.saison ? `
          <div style="margin-top:var(--space-3);">
            <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-2);">Saison</div>
            <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;text-align:center;">
              ${joursL.map((l,i) => `<div><div style="font-size:9px;font-weight:var(--weight-semi);color:var(--color-text-light);margin-bottom:2px;">${l}</div><div style="font-size:9px;color:var(--color-text-mid);background:var(--color-gold-light);border-radius:4px;padding:3px 1px;line-height:1.4;">${m.horaires.saison[jours[i]]}</div></div>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <hr class="divider">

      <div style="margin-bottom:var(--space-4);">
        <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">Livraisons</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-2);">
          ${[['Sec',m.livraisons.sec],['Frais',m.livraisons.frais],['Surgelés',m.livraisons.surgeles],['F&L',m.livraisons.fl]].map(([cat,val]) => `
            <div style="background:var(--color-hover-bg);border-radius:var(--radius-md);padding:var(--space-2) var(--space-3);">
              <div style="font-size:var(--text-xs);color:var(--color-text-light);">${cat}</div>
              <div style="font-size:var(--text-sm);font-weight:var(--weight-medium);">${val}</div>
            </div>
          `).join('')}
        </div>
      </div>

      ${m.notes ? `<hr class="divider"><div><div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-2);">Notes & accès</div><div style="font-size:var(--text-sm);color:var(--color-text-mid);line-height:var(--leading-normal);">${m.notes}</div></div>` : ''}
    </div>
  `;
}

/* ── Tab Visites ── */
function renderTabVisites(m) {
  if (m.visites.length === 0) return `<div class="empty-state"><div class="empty-state-title">Aucune visite</div></div>`;
  const critLabels = { haccp:'HACCP', dlc:'DLC', proprete:'Propreté', ruptures:'Ruptures' };
  const critClass = { ok:'pill-green', partiel:'pill-orange', ko:'pill-red' };
  const critLabel = { ok:'OK', partiel:'Partiel', ko:'KO' };
  return `
    <div>
      ${m.visites.map(v => `
        <div style="border:1px solid var(--color-border);border-radius:var(--radius-lg);margin-bottom:var(--space-3);overflow:hidden;">
          <div class="visite-row" style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--space-4);cursor:pointer;">
            <div style="flex:1;">
              <div style="font-size:var(--text-sm);font-weight:var(--weight-semi);">${shortDate(v.date)}</div>
              <div style="font-size:var(--text-xs);color:var(--color-text-light);">${v.type} · ${v.moniteur}</div>
            </div>
            <span class="score-value ${scoreValueClass(v.score)}" style="font-size:var(--text-lg);font-weight:var(--weight-bold);">${v.score}</span>
            <svg class="expand-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="color:var(--color-text-light);transition:transform 200ms;flex-shrink:0;"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="visite-detail" style="display:none;padding:var(--space-3) var(--space-4);border-top:1px solid var(--color-border);background:var(--color-app-bg);">
            <div style="display:flex;flex-wrap:wrap;gap:var(--space-2);">
              ${Object.entries(v.criteres).map(([k,val]) => `
                <div style="display:flex;align-items:center;gap:4px;">
                  <span style="font-size:var(--text-xs);color:var(--color-text-light);">${critLabels[k]||k}</span>
                  <span class="pill ${critClass[val]} pill-nodot" style="font-size:9px;">${critLabel[val]}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/* ── Tab Actions ── */
function renderTabActions(m) {
  if (m.alertes.length === 0) return `<div class="empty-state"><div class="empty-state-title">Aucune alerte active</div></div>`;
  return `
    <div>
      ${m.alertes.map(a => `
        <div style="background:var(--color-red-bg);border:1px solid var(--color-red-border);border-radius:var(--radius-lg);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-2);">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-2);flex-wrap:wrap;">
            <div>
              <div style="font-size:var(--text-sm);font-weight:var(--weight-semi);color:var(--color-red-text);">${a.type}</div>
              <div style="font-size:var(--text-xs);color:var(--color-red-text);opacity:.7;">${a.age}j · ${a.relance} relance${a.relance > 1?'s':''}</div>
            </div>
            <div style="display:flex;gap:var(--space-1);">
              <button class="btn btn-secondary btn-sm" data-action="relancer" data-alert="${a.id}">Relancer</button>
              <button class="btn btn-sm" style="background:var(--color-green-bg);color:var(--color-green-text);border:1px solid var(--color-green-border);" data-action="cloturer" data-alert="${a.id}">Clôturer</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/* ── Tab Performances ── */
function renderTabPerformances(m) {
  if (m.performances.length === 0) return `<div class="empty-state"><div class="empty-state-title">Aucune donnée</div></div>`;
  return `
    <div>
      <div class="table-wrap" style="margin-bottom:var(--space-3);">
        <table>
          <thead><tr><th>Mois</th><th>CA</th><th>Fréq.</th><th>Démarque</th></tr></thead>
          <tbody>
            ${m.performances.map(p => `
              <tr style="cursor:default;">
                <td style="font-weight:var(--weight-medium);font-size:var(--text-sm);">${p.mois}</td>
                <td style="font-size:var(--text-sm);">${(p.ca/1000).toFixed(1)} k€</td>
                <td style="font-size:var(--text-sm);">${p.freq.toLocaleString('fr-FR')}</td>
                <td><span style="color:${p.demarque>=4?'var(--color-red-text)':p.demarque>=2?'var(--color-orange-text)':'var(--color-green-text)'};font-weight:var(--weight-semi);font-size:var(--text-sm);">${p.demarque}%</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <button class="btn btn-secondary btn-sm" data-action="add-perf">+ Saisir un mois</button>
    </div>
  `;
}

/* ── Tab Inventaires ── */
function renderTabInventaires(m) {
  return `
    <div>
      ${m.inventaires.length > 0 ? `
        <div class="table-wrap" style="margin-bottom:var(--space-3);">
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>RI</th><th>DMQ</th><th>Statut</th></tr></thead>
            <tbody>
              ${m.inventaires.map(inv => `
                <tr style="cursor:default;">
                  <td style="font-size:var(--text-sm);">${shortDate(inv.date)}</td>
                  <td style="font-size:var(--text-sm);color:var(--color-text-mid);">${inv.type}</td>
                  <td style="font-size:var(--text-sm);">${inv.ri!==null?(inv.ri/1000).toFixed(0)+' k€':'—'}</td>
                  <td style="font-size:var(--text-sm);">${inv.dmq!==null?inv.dmq+'%':'—'}</td>
                  <td><span class="pill pill-nodot ${inv.statut==='réalisé'?'pill-green':'pill-blue'}" style="font-size:10px;">${inv.statut}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : `<div class="empty-state" style="padding:var(--space-6) 0;"><div class="empty-state-title">Aucun inventaire</div></div>`}
      <button class="btn btn-primary btn-sm" data-action="planifier-inv">+ Planifier un inventaire</button>
    </div>
  `;
}

/* ══════════════════════════════════════════
   FILTRES & TRI
   ══════════════════════════════════════════ */
function filteredMagasins() {
  let list = [...MOCK_MAGASINS];
  if (state.search) {
    const q = state.search.toLowerCase();
    list = list.filter(m => m.nom.toLowerCase().includes(q) || m.ville.toLowerCase().includes(q) || m.code_tf.toLowerCase().includes(q));
  }
  if (state.filtre === 'urgent')   list = list.filter(m => m.statut === 'urgent');
  if (state.filtre === 'risque')   list = list.filter(m => m.statut === 'risque');
  if (state.filtre === 'conforme') list = list.filter(m => m.statut === 'conforme');
  if (state.filtre === 'retard')   list = list.filter(m => !m.derniere_visite || Math.floor((new Date()-new Date(m.derniere_visite))/86400000) > 16);
  const { col, dir } = state.tri;
  list.sort((a, b) => {
    let va = a[col], vb = b[col];
    if (va === null) return 1; if (vb === null) return -1;
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    return dir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });
  return list;
}

function refreshTable() {
  const wrap = document.getElementById('mag-table-wrap');
  if (wrap) { wrap.innerHTML = renderTable(); bindTableEvents(); }
}

/* ══════════════════════════════════════════
   INIT & EVENTS
   ══════════════════════════════════════════ */
export function init(container) {
  bindFilterBar(container);
  bindTableEvents();
  // Chargement données réelles Supabase
  loadMagasinsSupabase();
}

async function loadMagasinsSupabase() {
  try {
    const [sbMag, sbVisites] = await Promise.all([
      getMagasins(),
      getVisites({ limit: 200 }),
    ]);

    if (!sbMag?.length) return;

    // Calculer dernière visite et score par magasin
    const dernieresVisites = {};
    for (const v of sbVisites) {
      if (!dernieresVisites[v.code] || new Date(v.date) > new Date(dernieresVisites[v.code].date)) {
        dernieresVisites[v.code] = v;
      }
    }

    // Mapper vers MOCK_MAGASINS format interne
    MOCK_MAGASINS.length = 0;
    for (const m of sbMag) {
      const dv = dernieresVisites[m.code];
      MOCK_MAGASINS.push({
        id:           m.code,
        nom:          m.nom,
        code:         m.code,
        ville:        m.ville || '—',
        score:        dv?.score_audit ?? null,
        derniereVisite: dv ? dv.date.split('T')[0] : null,
        statut:       m.statut || 'actif',
        demarque:     null, // vient des performances
        moniteur:     m.moniteur_ref || '—',
        tel:          m.tel,
        email:        m.email_mag,
        resp_nom:     m.resp_nom,
        resp_prenom:  m.resp_prenom,
        adresse:      m.adresse,
        cp:           m.cp,
        enseigne:     m.enseigne,
      });
    }

    refreshTable();
  } catch (err) {
    console.warn('Magasins Supabase error — MOCK conservé:', err.message);
  }
}

function bindFilterBar(container) {
  container.querySelector('#mag-search')?.addEventListener('input', e => { state.search = e.target.value; refreshTable(); });
  container.querySelector('#mag-filter-bar')?.addEventListener('click', e => {
    const chip = e.target.closest('.chip[data-filtre]');
    if (!chip) return;
    state.filtre = chip.dataset.filtre;
    container.querySelectorAll('#mag-filter-bar .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    refreshTable();
  });
}

function bindTableEvents() {
  const table = document.getElementById('mag-table');
  if (!table) return;
  table.querySelectorAll('thead th[data-col]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      state.tri = { col, dir: state.tri.col === col && state.tri.dir === 'asc' ? 'desc' : 'asc' };
      refreshTable();
    });
  });
  table.querySelectorAll('tbody tr[data-id]').forEach(tr => {
    tr.addEventListener('click', e => { if (e.target.closest('[data-action]')) return; ouvrirFiche(tr.dataset.id); });
  });
  table.querySelectorAll('[data-action="fiche"]').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); ouvrirFiche(btn.dataset.id); });
  });
  table.querySelectorAll('[data-action="visite"]').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); showToast('Création de visite — Phase 2'); });
  });
}

function ouvrirFiche(id) {
  const m = MOCK_MAGASINS.find(x => x.id === id);
  if (!m) return;
  openSidePanel({ id: `fiche-${id}`, title: m.nom, content: renderFiche(m) });
  // Bind events après injection dans le DOM
  setTimeout(() => bindFicheEvents(m), 0);
}

function bindFicheEvents(m) {
  const panel = document.getElementById('side-panel-body');
  if (!panel) return;
  panel.querySelectorAll('#fiche-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      panel.querySelectorAll('#fiche-tabs .tab').forEach(x => x.classList.remove('active'));
      tab.classList.add('active');
      const content = document.getElementById('fiche-tab-content');
      if (!content) return;
      switch (tab.dataset.tab) {
        case 'infos':        content.innerHTML = renderTabInfos(m); break;
        case 'visites':      content.innerHTML = renderTabVisites(m); bindVisiteEvents(content); break;
        case 'actions':      content.innerHTML = renderTabActions(m); bindActionEvents(content); break;
        case 'performances': content.innerHTML = renderTabPerformances(m); break;
        case 'inventaires':  content.innerHTML = renderTabInventaires(m); bindActionEvents(content); break;
      }
    });
  });
  bindVisiteEvents(panel);
  bindActionEvents(panel);
}

function bindVisiteEvents(container) {
  container.querySelectorAll('.visite-row').forEach(row => {
    row.addEventListener('click', () => {
      const detail = row.nextElementSibling;
      const icon = row.querySelector('.expand-icon');
      const open = detail.style.display !== 'none';
      detail.style.display = open ? 'none' : 'block';
      if (icon) icon.style.transform = open ? '' : 'rotate(180deg)';
    });
  });
}

function bindActionEvents(container) {
  container.querySelectorAll('[data-action="relancer"]').forEach(b => b.addEventListener('click', () => showToast('Relance enregistrée ✓', 'success')));
  container.querySelectorAll('[data-action="cloturer"]').forEach(b => b.addEventListener('click', () => showToast('Alerte clôturée ✓', 'success')));
  container.querySelectorAll('[data-action="planifier-inv"]').forEach(b => b.addEventListener('click', () => showToast('Planification — Phase 2')));
  container.querySelectorAll('[data-action="add-perf"]').forEach(b => b.addEventListener('click', () => showToast('Saisie performance — Phase 2')));
}
