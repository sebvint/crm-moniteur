/* ============================================================
   ProxiPilot — planning.js
   Calendrier 3 vues (Mois/Semaine/Liste) + Création inventaire 4 étapes
   ============================================================ */

import { openSidePanel, closeSidePanel, showToast } from './app.js';
import { shortDate } from './config.js';

/* ══════════════════════════════════════════
   CONSTANTES TYPES
   ══════════════════════════════════════════ */
const EVENT_TYPES = {
  cession:      { label: 'Cession',          color: '#C9921A', bg: '#F5EFE3', text: '#7A4800' },
  controle:     { label: 'Contrôle',         color: '#2A5A30', bg: '#EBF2E8', text: '#2A5A30' },
  conges:       { label: 'Congés',           color: '#1D4ED8', bg: '#EBF0F8', text: '#1D3F7A' },
  intervention: { label: 'Intervention',     color: '#534AB7', bg: '#F0EDFB', text: '#3D2A7A' },
  visite:       { label: 'Visite planif.',   color: '#9C9080', bg: '#F4F1EC', text: '#6B6050' },
};

/* ══════════════════════════════════════════
   DONNÉES MOCK
   ══════════════════════════════════════════ */
const MOCK_EVENTS = [
  { id: 'e1',  date: '2026-05-09', type: 'cession',      magasin: 'Casino Sup. Palavas', participants: ['Marie Dupont', 'J.-P. Blanc'], duree: 8,  heure: '08:00', notes: 'Inventaire semestriel.' },
  { id: 'e2',  date: '2026-05-14', type: 'controle',     magasin: 'Vival Les Arceaux',   participants: ['Marie Dupont'],                duree: 5,  heure: '09:00', notes: '' },
  { id: 'e3',  date: '2026-05-17', type: 'visite',       magasin: 'Spar Lattes',         participants: ['Marie Dupont'],                duree: 1,  heure: '10:00', notes: '' },
  { id: 'e4',  date: '2026-05-19', type: 'conges',       magasin: null,                  participants: ['Marie Dupont'],                duree: 5,  heure: null,    notes: 'Congés annuels.' },
  { id: 'e5',  date: '2026-05-24', type: 'cession',      magasin: 'Spar Lattes',         participants: ['Marie Dupont', 'K. Benali'],   duree: 8,  heure: '08:00', notes: '' },
  { id: 'e6',  date: '2026-05-28', type: 'controle',     magasin: 'Vival Pézenas',       participants: ['Marie Dupont'],                duree: 5,  heure: '09:00', notes: 'Contrôle suite alerte.' },
  { id: 'e7',  date: '2026-05-20', type: 'intervention', magasin: 'Casino Shop Pérols',  participants: ['Marie Dupont', 'Tech.'],       duree: 4,  heure: '14:00', notes: 'Révision frigos.' },
  { id: 'e8',  date: '2026-06-04', type: 'cession',      magasin: 'Casino Sup. Palavas', participants: ['Marie Dupont'],                duree: 8,  heure: '08:00', notes: '' },
  { id: 'e9',  date: '2026-06-10', type: 'visite',       magasin: 'Carrefour Antigone',  participants: ['Marie Dupont'],                duree: 1,  heure: '11:00', notes: '' },
  { id: 'e10', date: '2026-05-12', type: 'visite',       magasin: 'Casino Shop Pérols',  participants: ['Marie Dupont'],                duree: 1,  heure: '09:30', notes: '' },
];

/* ── State local ── */
let state = {
  vue: 'mois',           // 'mois' | 'semaine' | 'liste'
  dateRef: new Date(2026, 4, 1),  // Mai 2026
  filtres: new Set(),    // types désactivés
  creation: null,        // état du wizard création
};

/* ══════════════════════════════════════════
   RENDER PRINCIPAL
   ══════════════════════════════════════════ */
export function render() {
  return `
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:var(--space-3);">
        <button class="icon-btn" id="btn-prev">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h1 class="page-title" id="planning-titre" style="min-width:160px;text-align:center;">${getTitre()}</h1>
        <button class="icon-btn" id="btn-next">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <button class="btn btn-ghost btn-sm" id="btn-today">Aujourd'hui</button>
      </div>


    </div>

    <!-- Sélecteur vue + chips filtres + bouton -->
    <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);margin-bottom:var(--space-4);flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap;flex:1;">
        <div class="scope-selector">
          <div class="scope-btn ${state.vue==='mois'?'active':''}"    data-vue="mois">Mois</div>
          <div class="scope-btn ${state.vue==='semaine'?'active':''}" data-vue="semaine">Semaine</div>
          <div class="scope-btn ${state.vue==='liste'?'active':''}"   data-vue="liste">Liste</div>
        </div>
        <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;" id="type-chips">
        ${Object.entries(EVENT_TYPES).map(([k, t]) => `
          <div class="chip chip-event ${!state.filtres.has(k) ? 'active-'+k : ''}" data-type="${k}"
            style="border-color:${t.color};${!state.filtres.has(k) ? `background:${t.color};color:white;` : ''}">
            ${t.label}
          </div>
        `).join('')}
        </div>
      </div>
      <button class="btn btn-primary btn-sm" id="btn-new-event" style="flex-shrink:0;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Planifier
      </button>
    </div>

    <!-- Calendrier -->
    <div id="planning-view">
      ${renderVue()}
    </div>
  `;
}

/* ══════════════════════════════════════════
   VUE MOIS
   ══════════════════════════════════════════ */
function renderVueMois() {
  const year  = state.dateRef.getFullYear();
  const month = state.dateRef.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);

  // Lundi de la semaine du 1er
  const startDate = new Date(firstDay);
  const dow = (firstDay.getDay() + 6) % 7; // 0=lundi
  startDate.setDate(startDate.getDate() - dow);

  const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
  const today  = new Date();
  today.setHours(0,0,0,0);

  let html = `
    <div style="background:var(--color-card-bg);border:1px solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden;">
      <!-- En-têtes jours -->
      <div style="display:grid;grid-template-columns:32px repeat(5,1fr);border-bottom:1px solid var(--color-border);">
        <div style="padding:2px;background:var(--color-hover-bg);border-right:1px solid var(--color-border);"></div>
        ${jours.map(j => `<div style="padding:4px 2px;text-align:center;font-size:9px;font-weight:var(--weight-semi);color:var(--color-text-light);background:var(--color-hover-bg);border-right:1px solid var(--color-border);">${j}</div>`).join('')}
      </div>
  `;

  let cur = new Date(startDate);
  let semaine = getWeekNumber(cur);

  while (cur <= lastDay || cur.getMonth() === month) {
    if (cur > lastDay && cur.getDay() === 1) break;

    // Début de ligne (lundi)
    if ((cur.getDay() + 6) % 7 === 0) {
      semaine = getWeekNumber(cur);
      html += `<div style="display:grid;grid-template-columns:32px repeat(5,1fr);border-bottom:1px solid var(--color-border);">`;
      html += `<div style="padding:2px;text-align:center;font-size:8px;font-weight:var(--weight-semi);color:var(--color-text-light);border-right:1px solid var(--color-border);display:flex;align-items:flex-start;justify-content:center;padding-top:4px;">S${semaine}</div>`;
    }

    // Skip samedi (6) et dimanche (0)
    if (cur.getDay() === 6 || cur.getDay() === 0) {
      cur.setDate(cur.getDate() + 1);
      continue;
    }
    const isToday   = cur.getTime() === today.getTime();
    const isOtherM  = cur.getMonth() !== month;
    const dateStr   = formatDate(cur);
    const dayEvents = getEventsForDate(dateStr);

    html += `
      <div style="
        min-height:80px;padding:var(--space-1);
        border-right:1px solid var(--color-border);
        background:${isToday ? 'rgba(201,146,26,0.05)' : 'transparent'};
        vertical-align:top;
      ">
        <div style="
          font-size:var(--text-xs);font-weight:${isToday?'var(--weight-bold)':'var(--weight-medium)'};
          color:${isToday?'var(--color-gold)':isOtherM?'var(--color-text-light)':'var(--color-text-mid)'};
          margin-bottom:2px;
          ${isToday?`background:var(--color-gold);color:white;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;`:''}
        ">${cur.getDate()}</div>
        ${dayEvents.slice(0, 3).map(e => renderEventPill(e)).join('')}
        ${dayEvents.length > 3 ? `<div style="font-size:9px;color:var(--color-text-light);margin-top:1px;">+${dayEvents.length-3}</div>` : ''}
      </div>
    `;

    cur.setDate(cur.getDate() + 1);

    // Fin de ligne (samedi = on passe au lundi)
    if (cur.getDay() === 6) { cur.setDate(cur.getDate() + 2); }
    if ((cur.getDay() + 6) % 7 === 0) {
      html += `</div>`;
    }
  }

  // Fermer dernière ligne si nécessaire
  if ((cur.getDay() + 6) % 7 !== 0) {
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

function renderEventPill(e) {
  if (state.filtres.has(e.type)) return '';
  const t = EVENT_TYPES[e.type];
  const label = e.magasin ? `${t.label} · ${e.magasin.split(' ').slice(-1)[0]}` : t.label;
  return `
    <div class="planning-event" data-event-id="${e.id}" style="
      background:${t.color};color:white;
      font-size:8px;font-weight:var(--weight-semi);
      padding:1px 3px;border-radius:2px;
      margin-bottom:1px;cursor:pointer;
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
      line-height:1.3;
    " title="${t.label} — ${e.magasin || ''}">
      ${label}
    </div>
  `;
}

/* ══════════════════════════════════════════
   VUE SEMAINE
   ══════════════════════════════════════════ */
function renderVueSemaine() {
  // Trouver le lundi de la semaine courante
  const ref = new Date(state.dateRef);
  const dow = (ref.getDay() + 6) % 7;
  ref.setDate(ref.getDate() - dow);

  const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
  const today = new Date(); today.setHours(0,0,0,0);
  const semaine = getWeekNumber(ref);

  let html = `
    <div style="background:var(--color-card-bg);border:1px solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden;">
      <div style="display:grid;grid-template-columns:32px repeat(5,1fr);border-bottom:1px solid var(--color-border);">
        <div style="padding:var(--space-2);background:var(--color-hover-bg);border-right:1px solid var(--color-border);font-size:var(--text-xs);color:var(--color-text-light);font-weight:var(--weight-semi);display:flex;align-items:center;justify-content:center;">S${semaine}</div>
        ${jours.map((j, i) => {
          const d = new Date(ref); d.setDate(d.getDate() + i);
          const isToday = d.getTime() === today.getTime();
          return `
            <div style="padding:var(--space-2);text-align:center;background:var(--color-hover-bg);border-right:1px solid var(--color-border);">
              <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);">${j}</div>
              <div style="font-size:var(--text-lg);font-weight:${isToday?'var(--weight-bold)':'var(--weight-medium)'};color:${isToday?'var(--color-gold)':'var(--color-text-dark)'};">${d.getDate()}</div>
            </div>
          `;
        }).join('')}
      </div>
      <div style="display:grid;grid-template-columns:32px repeat(5,1fr);">
        <div style="border-right:1px solid var(--color-border);"></div>
        ${jours.map((j, i) => {
          const d = new Date(ref); d.setDate(d.getDate() + i);
          const dateStr = formatDate(d);
          const evs = getEventsForDate(dateStr).filter(e => !state.filtres.has(e.type));
          return `
            <div style="min-height:160px;padding:var(--space-2);border-right:1px solid var(--color-border);display:flex;flex-direction:column;gap:var(--space-1);">
              ${evs.map(e => {
                const t = EVENT_TYPES[e.type];
                return `
                  <div class="planning-event" data-event-id="${e.id}" style="
                    background:${t.bg};border-left:3px solid ${t.color};
                    padding:var(--space-1) var(--space-2);border-radius:var(--radius-sm);
                    cursor:pointer;transition:opacity var(--transition-fast);
                  ">
                    <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:${t.text};">${t.label}${e.magasin?` — ${e.magasin}`:''}</div>
                    <div style="font-size:9px;color:${t.text};opacity:.7;font-style:italic;">${e.participants.join(', ')}</div>
                    ${e.heure ? `<div style="font-size:9px;color:${t.text};opacity:.7;">${e.heure} · ${e.duree}h</div>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
  return html;
}

/* ══════════════════════════════════════════
   VUE LISTE
   ══════════════════════════════════════════ */
function renderVueListe() {
  const year  = state.dateRef.getFullYear();
  const month = state.dateRef.getMonth();

  const evs = MOCK_EVENTS
    .filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month && !state.filtres.has(e.type);
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  if (evs.length === 0) {
    return `<div class="empty-state"><div class="empty-state-title">Aucun événement ce mois</div></div>`;
  }

  // Grouper par semaine
  const grouped = {};
  for (const e of evs) {
    const d = new Date(e.date);
    const sem = getWeekNumber(d);
    if (!grouped[sem]) grouped[sem] = [];
    grouped[sem].push(e);
  }

  return `
    <div style="display:flex;flex-direction:column;gap:var(--space-4);">
      ${Object.entries(grouped).map(([sem, list]) => `
        <div>
          <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-2);">Semaine ${sem}</div>
          <div style="background:var(--color-card-bg);border:1px solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden;">
            ${list.map((e, i) => {
              const t = EVENT_TYPES[e.type];
              const d = new Date(e.date);
              const isLast = i === list.length - 1;
              return `
                <div class="planning-event" data-event-id="${e.id}" style="
                  display:flex;align-items:center;gap:var(--space-3);
                  padding:var(--space-3) var(--space-4);
                  border-bottom:${isLast?'none':'1px solid var(--color-border)'};
                  cursor:pointer;transition:background var(--transition-fast);
                ">
                  <div style="width:3px;min-width:3px;height:36px;background:${t.color};border-radius:2px;flex-shrink:0;"></div>
                  <div style="width:40px;min-width:40px;text-align:center;flex-shrink:0;">
                    <div style="font-size:var(--text-xl);font-weight:var(--weight-bold);color:var(--color-text-dark);line-height:1;">${d.getDate()}</div>
                    <div style="font-size:9px;color:var(--color-text-light);">${d.toLocaleDateString('fr-FR',{weekday:'short'})}</div>
                  </div>
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:var(--text-sm);font-weight:var(--weight-semi);color:var(--color-text-dark);">
                      ${t.label}${e.magasin ? ` — ${e.magasin}` : ''}
                    </div>
                    <div style="font-size:var(--text-xs);color:var(--color-text-light);font-style:italic;">${e.participants.join(', ')}</div>
                  </div>
                  <div style="flex-shrink:0;text-align:right;">
                    ${e.heure ? `<div style="font-size:var(--text-xs);color:var(--color-text-mid);">${e.heure}</div>` : ''}
                    <div style="font-size:var(--text-xs);color:var(--color-text-light);">${e.duree}h</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderVue() {
  switch (state.vue) {
    case 'mois':    return renderVueMois();
    case 'semaine': return renderVueSemaine();
    case 'liste':   return renderVueListe();
  }
}

/* ══════════════════════════════════════════
   PANNEAU DÉTAIL ÉVÉNEMENT
   ══════════════════════════════════════════ */
function renderDetailEvent(e) {
  const t = EVENT_TYPES[e.type];
  const d = new Date(e.date);
  return `
    <div style="display:flex;flex-direction:column;gap:var(--space-4);">
      <div style="display:flex;align-items:center;gap:var(--space-3);">
        <div style="width:12px;height:12px;border-radius:50%;background:${t.color};flex-shrink:0;"></div>
        <span class="pill pill-nodot" style="background:${t.bg};color:${t.text};">${t.label}</span>
      </div>

      ${e.magasin ? `
        <div>
          <div style="font-size:var(--text-xs);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Magasin</div>
          <div style="font-weight:var(--weight-semi);">${e.magasin}</div>
        </div>
      ` : ''}

      <div>
        <div style="font-size:var(--text-xs);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Date</div>
        <div style="font-weight:var(--weight-medium);">${d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
      </div>

      ${e.heure ? `
        <div style="display:flex;gap:var(--space-5);">
          <div>
            <div style="font-size:var(--text-xs);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Heure</div>
            <div style="font-weight:var(--weight-medium);">${e.heure}</div>
          </div>
          <div>
            <div style="font-size:var(--text-xs);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Durée</div>
            <div style="font-weight:var(--weight-medium);">${e.duree}h</div>
          </div>
        </div>
      ` : ''}

      <div>
        <div style="font-size:var(--text-xs);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-2);">Participants</div>
        <div style="display:flex;flex-direction:column;gap:var(--space-1);">
          ${e.participants.map(p => `
            <div style="display:flex;align-items:center;gap:var(--space-2);padding:4px 0;border-bottom:1px solid var(--color-border);">
              <div style="width:24px;height:24px;border-radius:50%;background:var(--color-hover-bg);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:var(--weight-bold);color:var(--color-text-mid);flex-shrink:0;">${p.split(' ').map(w=>w[0]||'').join('').toUpperCase().slice(0,2)}</div>
              <span style="font-size:var(--text-sm);">${p}</span>
            </div>
          `).join('')}
        </div>
      </div>

      ${e.notes ? `
        <div>
          <div style="font-size:var(--text-xs);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Notes</div>
          <div style="font-size:var(--text-sm);color:var(--color-text-mid);background:var(--color-hover-bg);border-radius:var(--radius-md);padding:var(--space-3);">${e.notes}</div>
        </div>
      ` : ''}

      <hr class="divider">
      <div style="display:flex;gap:var(--space-2);">
        <button class="btn btn-secondary btn-sm" style="flex:1;justify-content:center;" data-action="modifier-event" data-id="${e.id}">Modifier</button>
        <button class="btn btn-danger btn-sm" data-action="supprimer-event" data-id="${e.id}">Supprimer</button>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════
   WIZARD CRÉATION 4 ÉTAPES
   ══════════════════════════════════════════ */
const MAGASINS = ['Casino Sup. Palavas', 'Vival Les Arceaux', 'Spar Lattes', 'Casino Shop Pérols', 'Carrefour Express Antigone'];
const MONITEURS = ['Marie Dupont'];

function initCreation() {
  state.creation = {
    etape: 1,
    magasin: '', type: 'cession', notes_prep: '',
    pilote: 'Marie Dupont', internes: [], externes: '', gerant_present: false,
    date: '', heure: '08:00', duree: 8, rappels: { j7: true, j2: true, j0: true },
  };
}

function renderWizard() {
  const c = state.creation;
  const etapes = ['Général', 'Participants', 'Planification', 'Validation'];

  return `
    <div style="display:flex;flex-direction:column;gap:var(--space-4);">
      <!-- Stepper -->
      <div style="display:flex;align-items:center;gap:0;margin-bottom:var(--space-2);">
        ${etapes.map((label, i) => {
          const num = i + 1;
          const isDone   = num < c.etape;
          const isActive = num === c.etape;
          return `
            <div style="display:flex;align-items:center;flex:1;">
              <div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1;">
                <div style="
                  width:26px;height:26px;border-radius:50%;
                  display:flex;align-items:center;justify-content:center;
                  font-size:var(--text-xs);font-weight:var(--weight-bold);
                  background:${isDone?'var(--color-green-bg)':isActive?'var(--color-gold)':'var(--color-hover-bg)'};
                  color:${isDone?'var(--color-green-text)':isActive?'white':'var(--color-text-light)'};
                  border:1.5px solid ${isDone?'var(--color-green-border)':isActive?'var(--color-gold)':'var(--color-border)'};
                ">
                  ${isDone ? '✓' : num}
                </div>
                <div style="font-size:9px;color:${isActive?'var(--color-text-dark)':'var(--color-text-light)'};font-weight:${isActive?'var(--weight-semi)':'var(--weight-regular)'};">${label}</div>
              </div>
              ${i < etapes.length - 1 ? `<div style="height:1px;background:var(--color-border);flex:1;margin-bottom:16px;"></div>` : ''}
            </div>
          `;
        }).join('')}
      </div>

      <hr class="divider">

      <!-- Contenu étape -->
      <div id="wizard-content">
        ${renderWizardEtape(c.etape)}
      </div>

      <!-- Navigation -->
      <div style="display:flex;gap:var(--space-2);margin-top:var(--space-2);">
        ${c.etape > 1 ? `<button class="btn btn-ghost" id="btn-wizard-prev" style="flex:1;justify-content:center;">← Retour</button>` : `<button class="btn btn-ghost" id="btn-wizard-annuler" style="flex:1;justify-content:center;">Annuler</button>`}
        <button class="btn btn-primary" id="btn-wizard-next" style="flex:2;justify-content:center;">
          ${c.etape < 4 ? 'Suivant →' : '✓ Enregistrer'}
        </button>
      </div>
    </div>
  `;
}

function renderWizardEtape(etape) {
  const c = state.creation;
  switch (etape) {
    case 1: return `
      <div style="display:flex;flex-direction:column;gap:var(--space-3);">
        <div class="form-group">
          <label class="form-label required">Magasin</label>
          <select class="form-select" id="wiz-magasin">
            <option value="">Sélectionner…</option>
            ${MAGASINS.map(m => `<option value="${m}" ${c.magasin===m?'selected':''}>${m}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Type</label>
          <select class="form-select" id="wiz-type">
            ${Object.entries(EVENT_TYPES).map(([k,t]) => `<option value="${k}" ${c.type===k?'selected':''}>${t.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Notes de préparation</label>
          <textarea class="form-textarea" id="wiz-notes" placeholder="Matériel nécessaire, points de vigilance…">${c.notes_prep}</textarea>
        </div>
      </div>
    `;
    case 2: return `
      <div style="display:flex;flex-direction:column;gap:var(--space-3);">
        <div class="form-group">
          <label class="form-label required">Pilote</label>
          <select class="form-select" id="wiz-pilote">
            ${MONITEURS.map(m => `<option value="${m}" ${c.pilote===m?'selected':''}>${m}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Participants internes</label>
          <div style="display:flex;flex-direction:column;gap:var(--space-1);">
            ${MONITEURS.filter(m => m !== c.pilote).map(m => `
              <label class="toggle-wrap">
                <div class="toggle">
                  <input type="checkbox" id="int-${m.replace(' ','_')}" ${c.internes.includes(m)?'checked':''}>
                  <div class="toggle-track"></div>
                  <div class="toggle-thumb"></div>
                </div>
                <span style="font-size:var(--text-sm);">${m}</span>
              </label>
            `).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Participants externes (saisie libre)</label>
          <input type="text" class="form-input" id="wiz-externes" placeholder="Ex: Expert frigo, Responsable région…" value="${c.externes}">
        </div>
        <label class="toggle-wrap">
          <div class="toggle">
            <input type="checkbox" id="wiz-gerant" ${c.gerant_present?'checked':''}>
            <div class="toggle-track"></div>
            <div class="toggle-thumb"></div>
          </div>
          <span style="font-size:var(--text-sm);">Gérant présent</span>
        </label>
      </div>
    `;
    case 3: return `
      <div style="display:flex;flex-direction:column;gap:var(--space-3);">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">Date</label>
            <input type="date" class="form-input" id="wiz-date" value="${c.date}">
          </div>
          <div class="form-group">
            <label class="form-label">Heure début</label>
            <input type="time" class="form-input" id="wiz-heure" value="${c.heure}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Durée estimée (heures)</label>
          <input type="number" class="form-input" id="wiz-duree" min="1" max="12" value="${c.duree}">
        </div>
        <div class="form-group">
          <label class="form-label">Rappels automatiques</label>
          <div style="display:flex;flex-direction:column;gap:var(--space-2);">
            ${[['j7','J-7 (7 jours avant)'],['j2','J-2 (2 jours avant)'],['j0','J-0 (jour J)']].map(([k,label]) => `
              <label class="toggle-wrap">
                <div class="toggle">
                  <input type="checkbox" id="wiz-${k}" ${c.rappels[k]?'checked':''}>
                  <div class="toggle-track"></div>
                  <div class="toggle-thumb"></div>
                </div>
                <span style="font-size:var(--text-sm);">${label}</span>
              </label>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    case 4: return `
      <div style="display:flex;flex-direction:column;gap:var(--space-3);">
        <div style="background:var(--color-hover-bg);border-radius:var(--radius-lg);padding:var(--space-4);">
          <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">Récapitulatif</div>
          ${[
            ['Magasin', c.magasin || '—'],
            ['Type', EVENT_TYPES[c.type]?.label || c.type],
            ['Pilote', c.pilote],
            ['Date', c.date ? shortDate(c.date) : '—'],
            ['Heure', c.heure],
            ['Durée', c.duree + 'h'],
            ['Gérant présent', c.gerant_present ? 'Oui' : 'Non'],
            ['Rappels', Object.entries(c.rappels).filter(([,v])=>v).map(([k])=>k.toUpperCase()).join(', ') || 'Aucun'],
          ].map(([label, val]) => `
            <div style="display:flex;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid var(--color-border);font-size:var(--text-sm);">
              <span style="color:var(--color-text-light);">${label}</span>
              <span style="font-weight:var(--weight-medium);">${val}</span>
            </div>
          `).join('')}
          ${c.notes_prep ? `<div style="margin-top:var(--space-2);font-size:var(--text-xs);color:var(--color-text-mid);">${c.notes_prep}</div>` : ''}
        </div>
      </div>
    `;
  }
}

/* ══════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════ */
function getEventsForDate(dateStr) {
  return MOCK_EVENTS.filter(e => e.date === dateStr);
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

function getTitre() {
  const d = state.dateRef;
  if (state.vue === 'semaine') {
    const dow = (d.getDay() + 6) % 7;
    const lundi = new Date(d); lundi.setDate(d.getDate() - dow);
    const dim   = new Date(lundi); dim.setDate(lundi.getDate() + 6);
    return `${lundi.getDate()} — ${dim.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}`;
  }
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function naviguerPrev() {
  if (state.vue === 'semaine') {
    state.dateRef.setDate(state.dateRef.getDate() - 7);
  } else {
    state.dateRef.setMonth(state.dateRef.getMonth() - 1);
  }
}

function naviguerNext() {
  if (state.vue === 'semaine') {
    state.dateRef.setDate(state.dateRef.getDate() + 7);
  } else {
    state.dateRef.setMonth(state.dateRef.getMonth() + 1);
  }
}

function refreshView() {
  document.getElementById('planning-titre').textContent = getTitre();
  document.getElementById('planning-view').innerHTML = renderVue();
  bindViewEvents();
}

/* ══════════════════════════════════════════
   INIT & EVENTS
   ══════════════════════════════════════════ */
export function init(container) {
  // Navigation prev/next
  container.querySelector('#btn-prev')?.addEventListener('click', () => { naviguerPrev(); refreshView(); });
  container.querySelector('#btn-next')?.addEventListener('click', () => { naviguerNext(); refreshView(); });
  container.querySelector('#btn-today')?.addEventListener('click', () => { state.dateRef = new Date(); refreshView(); });

  // Switch vue
  container.querySelector('.scope-selector')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-vue]');
    if (!btn) return;
    state.vue = btn.dataset.vue;
    container.querySelectorAll('.scope-btn').forEach(b => b.classList.toggle('active', b.dataset.vue === state.vue));
    refreshView();
  });

  // Chips filtres
  container.querySelector('#type-chips')?.addEventListener('click', e => {
    const chip = e.target.closest('[data-type]');
    if (!chip) return;
    const type = chip.dataset.type;
    const t = EVENT_TYPES[type];
    if (state.filtres.has(type)) {
      state.filtres.delete(type);
      chip.style.background = t.color;
      chip.style.color = 'white';
      chip.style.borderColor = t.color;
    } else {
      state.filtres.add(type);
      chip.style.background = '';
      chip.style.color = '';
      chip.style.borderColor = t.color;
    }
    refreshView();
  });

  // Bouton Planifier (desktop + mobile)
  const openWizard = () => {
    initCreation();
    openSidePanel({ id: 'new-event', title: 'Planifier un événement', content: renderWizard() });
    setTimeout(() => bindWizardEvents(), 0);
  };
  container.querySelector('#btn-new-event')?.addEventListener('click', openWizard);

  bindViewEvents();
}

function bindViewEvents() {
  document.querySelectorAll('.planning-event[data-event-id]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const ev = MOCK_EVENTS.find(x => x.id === el.dataset.eventId);
      if (!ev) return;
      const t = EVENT_TYPES[ev.type];
      openSidePanel({ id: `event-${ev.id}`, title: `${t.label}${ev.magasin?' — '+ev.magasin:''}`, content: renderDetailEvent(ev) });
      setTimeout(() => bindDetailEvents(), 0);
    });
  });
}

function bindDetailEvents() {
  const panel = document.getElementById('side-panel-body');
  if (!panel) return;
  panel.querySelector('[data-action="modifier-event"]')?.addEventListener('click', () => showToast('Modification — Phase 2'));
  panel.querySelector('[data-action="supprimer-event"]')?.addEventListener('click', () => showToast('Suppression — Phase 2', 'error'));
}

function bindWizardEvents() {
  const panel = document.getElementById('side-panel-body');
  if (!panel) return;

  panel.querySelector('#btn-wizard-annuler')?.addEventListener('click', () => {
    document.getElementById('side-panel')?.classList.remove('open');
    document.getElementById('panel-overlay')?.classList.remove('open');
  });

  panel.querySelector('#btn-wizard-prev')?.addEventListener('click', () => {
    collectEtape(state.creation.etape);
    state.creation.etape--;
    document.getElementById('side-panel-body').innerHTML = renderWizard();
    bindWizardEvents();
  });

  panel.querySelector('#btn-wizard-next')?.addEventListener('click', () => {
    const c = state.creation;
    if (c.etape === 1 && !panel.querySelector('#wiz-magasin')?.value) {
      showToast('Sélectionnez un magasin', 'error'); return;
    }
    if (c.etape === 3 && !panel.querySelector('#wiz-date')?.value) {
      showToast('Sélectionnez une date', 'error'); return;
    }
    collectEtape(c.etape);
    if (c.etape < 4) {
      c.etape++;
      document.getElementById('side-panel-body').innerHTML = renderWizard();
      bindWizardEvents();
    } else {
      // Enregistrer
      showToast('Événement planifié ✓ — Connexion Supabase Phase 2', 'success');
      document.getElementById('side-panel')?.classList.remove('open');
      document.getElementById('panel-overlay')?.classList.remove('open');
    }
  });
}

function collectEtape(etape) {
  const c = state.creation;
  const panel = document.getElementById('side-panel-body');
  if (!panel) return;
  switch (etape) {
    case 1:
      c.magasin    = panel.querySelector('#wiz-magasin')?.value || c.magasin;
      c.type       = panel.querySelector('#wiz-type')?.value || c.type;
      c.notes_prep = panel.querySelector('#wiz-notes')?.value || c.notes_prep;
      break;
    case 2:
      c.pilote          = panel.querySelector('#wiz-pilote')?.value || c.pilote;
      c.externes        = panel.querySelector('#wiz-externes')?.value || '';
      c.gerant_present  = panel.querySelector('#wiz-gerant')?.checked || false;
      break;
    case 3:
      c.date  = panel.querySelector('#wiz-date')?.value || c.date;
      c.heure = panel.querySelector('#wiz-heure')?.value || c.heure;
      c.duree = parseInt(panel.querySelector('#wiz-duree')?.value) || c.duree;
      c.rappels.j7 = panel.querySelector('#wiz-j7')?.checked ?? c.rappels.j7;
      c.rappels.j2 = panel.querySelector('#wiz-j2')?.checked ?? c.rappels.j2;
      c.rappels.j0 = panel.querySelector('#wiz-j0')?.checked ?? c.rappels.j0;
      break;
  }
}
