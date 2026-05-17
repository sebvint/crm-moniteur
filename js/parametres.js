/* ============================================================
   ProxiPilot — parametres.js
   8 sections — Admin only — sauvegarde localStorage (Phase 2 : Supabase)
   ============================================================ */

import { showToast } from './app.js';
import { AUDIT_CRITERIA } from './config.js';

/* ══════════════════════════════════════════
   ÉTAT PAR DÉFAUT
   ══════════════════════════════════════════ */
const DEFAULTS = {
  // 1 — Identité
  secteur_nom:     'Sud Est',
  secteur_enseigne:'Casino',
  accent_color:    '#C9921A',

  // 2 — Visites
  visite_freq:     14,
  visite_urgente:  21,
  visite_risque:   18,
  tel_visite:      false,

  // 3 — Score audit (critères standards dans AUDIT_CRITERIA)
  score_labels:    { ok: 'OK', partiel: 'Quelques écarts', ko: 'Grave' },

  // 4 — Seuils score
  seuil_conforme:  80,
  seuil_risque:    60,
  label_conforme:  'Conforme',
  label_risque:    'À risque',
  label_urgent:    'Urgent',
  color_conforme:  '#2A5A30',
  color_risque:    '#7A4800',
  color_urgent:    '#8C3030',

  // 5 — Démarque
  demarque_normale: 2,
  demarque_alerte:  4,
  dmq_seuil:        1.5,

  // 6 — Inventaires
  inv_frequence:   6,
  inv_heure:       '08:00',
  inv_duree_cession:     8,
  inv_duree_controle:    5,
  inv_duree_autre:       4,
  inv_color_cession:     '#C9921A',
  inv_color_controle:    '#2A5A30',
  inv_color_conges:      '#1D4ED8',
  inv_color_intervention:'#534AB7',
  inv_color_visite:      '#9C9080',
  rappel_j7: true, rappel_j2: true, rappel_j0: true,

  // 7 — Rapports
  rapport_entete:  'Codisud — Secteur Sud Est',
  rapport_ton:     'synthetique',
  rapport_prompt:  '',
  rapport_email:   '',
  actions_retard:  14,

  // 8 — Système
  retention:       '365j',
};

/* Charger depuis localStorage */
function loadSettings() {
  try {
    const raw = localStorage.getItem('proxipilot_settings');
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch { return { ...DEFAULTS }; }
}

function saveSettings(settings) {
  localStorage.setItem('proxipilot_settings', JSON.stringify(settings));
}

let settings = loadSettings();
let activeSection = '1';

/* ══════════════════════════════════════════
   RENDER PRINCIPAL
   ══════════════════════════════════════════ */
export function render() {
  const sections = [
    { id: '1', label: 'Identité secteur',       icon: 'ti-building' },
    { id: '2', label: 'Règles de visites',       icon: 'ti-clipboard-check' },
    { id: '3', label: 'Score audit',             icon: 'ti-chart-bar' },
    { id: '4', label: 'Seuils & statuts',        icon: 'ti-adjustments' },
    { id: '5', label: 'Seuils démarque',         icon: 'ti-percentage' },
    { id: '6', label: 'Inventaires & planning',  icon: 'ti-calendar' },
    { id: '7', label: 'Rapports',                icon: 'ti-file-text' },
    { id: '8', label: 'Système & données',       icon: 'ti-settings' },
  ];

  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">Paramètres</h1>
        <p class="page-subtitle">Administration — Secteur Sud Est</p>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:200px 1fr;gap:var(--space-5);align-items:start;">

      <!-- Menu sections -->
      <div style="background:var(--color-card-bg);border:1px solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden;position:sticky;top:var(--space-4);">
        ${sections.map(s => `
          <div class="param-nav-item ${activeSection === s.id ? 'active' : ''}" data-section="${s.id}" style="
            display:flex;align-items:center;gap:var(--space-3);
            padding:var(--space-3) var(--space-4);
            cursor:pointer;
            border-bottom:1px solid var(--color-border);
            background:${activeSection === s.id ? 'var(--color-gold)' : 'transparent'};
            color:${activeSection === s.id ? 'white' : 'var(--color-text-mid)'};
            font-size:var(--text-sm);font-weight:${activeSection === s.id ? 'var(--weight-semi)' : 'var(--weight-regular)'};
            transition:background var(--transition-fast),color var(--transition-fast);
          ">
            <span style="font-size:16px;">${s.label}</span>
          </div>
        `).join('')}
      </div>

      <!-- Contenu section -->
      <div id="param-content">
        ${renderSection(activeSection)}
      </div>

    </div>
  `;
}

/* ══════════════════════════════════════════
   SECTIONS
   ══════════════════════════════════════════ */
function renderSection(id) {
  const s = { '1': s1, '2': s2, '3': s3, '4': s4, '5': s5, '6': s6, '7': s7, '8': s8 }[id];
  return s ? s() : '';
}

function sectionWrap(title, content) {
  return `
    <div style="background:var(--color-card-bg);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:var(--space-6);">
      <div style="font-size:var(--text-lg);font-weight:var(--weight-semi);color:var(--color-text-dark);margin-bottom:var(--space-5);padding-bottom:var(--space-4);border-bottom:1px solid var(--color-border);">${title}</div>
      <div style="display:flex;flex-direction:column;gap:var(--space-4);">
        ${content}
      </div>
      <div style="margin-top:var(--space-5);padding-top:var(--space-4);border-top:1px solid var(--color-border);display:flex;justify-content:flex-end;">
        <button class="btn btn-primary" onclick="window._paramSave('${activeSection}')">
          Enregistrer
        </button>
      </div>
    </div>
  `;
}

function row(label, hint, input) {
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);align-items:center;">
      <div>
        <div style="font-size:var(--text-sm);font-weight:var(--weight-medium);color:var(--color-text-dark);">${label}</div>
        ${hint ? `<div style="font-size:var(--text-xs);color:var(--color-text-light);margin-top:2px;">${hint}</div>` : ''}
      </div>
      <div>${input}</div>
    </div>
  `;
}

function toggleRow(label, hint, id, checked) {
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid var(--color-border);">
      <div>
        <div style="font-size:var(--text-sm);font-weight:var(--weight-medium);color:var(--color-text-dark);">${label}</div>
        ${hint ? `<div style="font-size:var(--text-xs);color:var(--color-text-light);">${hint}</div>` : ''}
      </div>
      <label class="toggle-wrap" style="margin:0;">
        <div class="toggle">
          <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}>
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </div>
      </label>
    </div>
  `;
}

/* ── Section 1 : Identité ── */
function s1() {
  return sectionWrap('Identité secteur', `
    ${row('Nom du secteur', 'Affiché dans les rapports et la topbar', `<input type="text" class="form-input" id="p-secteur-nom" value="${settings.secteur_nom}">`)}
    ${row('Enseigne réseau', null, `
      <select class="form-select" id="p-enseigne">
        ${['Casino','Vival','Spar','Franprix','Monop'].map(e => `<option ${settings.secteur_enseigne===e?'selected':''}>${e}</option>`).join('')}
      </select>
    `)}
    ${row('Couleur accent', 'Couleur principale de l\'interface', `
      <div style="display:flex;align-items:center;gap:var(--space-2);">
        <input type="color" id="p-accent" value="${settings.accent_color}" style="width:40px;height:36px;border:1px solid var(--color-border);border-radius:var(--radius-md);cursor:pointer;padding:2px;">
        <input type="text" id="p-accent-hex" value="${settings.accent_color}" class="form-input" style="flex:1;" maxlength="7">
      </div>
    `)}
    ${row('Logo secteur', 'PNG ou SVG — affiché dans les PDF', `
      <div style="display:flex;align-items:center;gap:var(--space-2);">
        <div style="width:48px;height:48px;background:var(--color-gold);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:18px;">P</div>
        <button class="btn btn-secondary btn-sm" onclick="showToast?.('Upload logo — Phase 2')">Changer</button>
      </div>
    `)}
  `);
}

/* ── Section 2 : Visites ── */
function s2() {
  return sectionWrap('Règles de visites', `
    ${row('Fréquence visite par défaut', 'Nombre de jours entre deux visites', `<input type="number" class="form-input" id="p-visite-freq" value="${settings.visite_freq}" min="1" max="60"> <span style="font-size:var(--text-xs);color:var(--color-text-light);margin-left:4px;">jours</span>`)}
    ${row('Seuil visite urgente', 'Au-delà = statut Urgent rouge', `<input type="number" class="form-input" id="p-visite-urgente" value="${settings.visite_urgente}" min="1" max="90"> <span style="font-size:var(--text-xs);color:var(--color-text-light);margin-left:4px;">jours</span>`)}
    ${row('Seuil visite à risque', 'Au-delà = statut À risque orange', `<input type="number" class="form-input" id="p-visite-risque" value="${settings.visite_risque}" min="1" max="90"> <span style="font-size:var(--text-xs);color:var(--color-text-light);margin-left:4px;">jours</span>`)}
    ${toggleRow('Contact téléphonique = visite', 'Un appel téléphonique compte comme une visite', 'p-tel-visite', settings.tel_visite)}
  `);
}

/* ── Section 3 : Score audit ── */
function s3() {
  return sectionWrap('Algorithme score audit /100', `
    <div>
      <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">Libellés des options</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-3);">
        <div class="form-group" style="margin:0;"><label class="form-label">Option positive</label><input type="text" class="form-input" id="p-label-ok" value="${settings.score_labels.ok}"></div>
        <div class="form-group" style="margin:0;"><label class="form-label">Option partielle</label><input type="text" class="form-input" id="p-label-partiel" value="${settings.score_labels.partiel}"></div>
        <div class="form-group" style="margin:0;"><label class="form-label">Option critique</label><input type="text" class="form-input" id="p-label-ko" value="${settings.score_labels.ko}"></div>
      </div>
    </div>
    <div>
      <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">Grille des critères</div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Critère</th>
              <th style="text-align:center;">Actif</th>
              <th style="text-align:right;">Partiel</th>
              <th style="text-align:right;">KO</th>
            </tr>
          </thead>
          <tbody>
            ${AUDIT_CRITERIA.map(c => `
              <tr style="cursor:default;">
                <td style="font-size:var(--text-sm);">${c.label}</td>
                <td style="text-align:center;">
                  <label class="toggle-wrap" style="justify-content:center;margin:0;">
                    <div class="toggle">
                      <input type="checkbox" checked data-crit="${c.id}">
                      <div class="toggle-track"></div>
                      <div class="toggle-thumb"></div>
                    </div>
                  </label>
                </td>
                <td style="text-align:right;">
                  <input type="number" value="${c.partiel}" style="width:56px;padding:3px 6px;font-size:var(--text-sm);border:1px solid var(--color-border);border-radius:var(--radius-md);text-align:right;background:var(--color-app-bg);color:${c.partiel < 0 ? 'var(--color-orange-text)' : 'var(--color-green-text)'};" data-crit-partiel="${c.id}">
                </td>
                <td style="text-align:right;">
                  <input type="number" value="${c.ko}" style="width:56px;padding:3px 6px;font-size:var(--text-sm);border:1px solid var(--color-border);border-radius:var(--radius-md);text-align:right;background:var(--color-app-bg);color:var(--color-red-text);" data-crit-ko="${c.id}">
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `);
}

/* ── Section 4 : Seuils score ── */
function s4() {
  return sectionWrap('Seuils score & statuts', `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--space-4);">
      <div class="form-group"><label class="form-label">Seuil Conforme (≥)</label><input type="number" class="form-input" id="p-seuil-conforme" value="${settings.seuil_conforme}" min="0" max="100"><div class="form-hint">Score minimum pour être conforme</div></div>
      <div class="form-group"><label class="form-label">Seuil À risque (≥)</label><input type="number" class="form-input" id="p-seuil-risque" value="${settings.seuil_risque}" min="0" max="100"><div class="form-hint">En dessous = Urgent</div></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-4);">
      ${['conforme','risque','urgent'].map(s => `
        <div style="background:var(--color-hover-bg);border-radius:var(--radius-lg);padding:var(--space-4);">
          <div class="form-group"><label class="form-label">Label "${s}"</label><input type="text" class="form-input" id="p-label-${s}" value="${settings['label_'+s]}"></div>
          <div class="form-group" style="margin:0;"><label class="form-label">Couleur</label>
            <div style="display:flex;align-items:center;gap:var(--space-2);">
              <input type="color" id="p-color-${s}" value="${settings['color_'+s]}" style="width:36px;height:32px;border:1px solid var(--color-border);border-radius:var(--radius-md);cursor:pointer;padding:2px;">
              <input type="text" value="${settings['color_'+s]}" class="form-input" style="flex:1;font-size:var(--text-xs);" id="p-color-${s}-hex" maxlength="7">
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `);
}

/* ── Section 5 : Démarque ── */
function s5() {
  return sectionWrap('Seuils démarque', `
    ${row('Démarque normale', 'En dessous de ce seuil = vert', `<div style="display:flex;align-items:center;gap:var(--space-2);"><input type="number" step="0.1" class="form-input" id="p-demarque-normale" value="${settings.demarque_normale}" min="0" max="20"><span style="font-size:var(--text-sm);color:var(--color-text-light);">%</span></div>`)}
    ${row('Démarque alerte', 'Au-dessus = rouge critique', `<div style="display:flex;align-items:center;gap:var(--space-2);"><input type="number" step="0.1" class="form-input" id="p-demarque-alerte" value="${settings.demarque_alerte}" min="0" max="20"><span style="font-size:var(--text-sm);color:var(--color-text-light);">%</span></div>`)}
    ${row('Seuil DMQ inconnue', 'Alerte si DMQ inconnue dépasse ce seuil', `<div style="display:flex;align-items:center;gap:var(--space-2);"><input type="number" step="0.1" class="form-input" id="p-dmq-seuil" value="${settings.dmq_seuil}" min="0" max="20"><span style="font-size:var(--text-sm);color:var(--color-text-light);">%</span></div>`)}
    <!-- Aperçu -->
    <div style="background:var(--color-hover-bg);border-radius:var(--radius-lg);padding:var(--space-4);">
      <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">Aperçu des seuils</div>
      <div style="display:flex;gap:var(--space-3);align-items:center;">
        <span class="pill pill-green pill-nodot">< ${settings.demarque_normale}% — Normal</span>
        <span class="pill pill-orange pill-nodot">${settings.demarque_normale}–${settings.demarque_alerte}% — Attention</span>
        <span class="pill pill-red pill-nodot">> ${settings.demarque_alerte}% — Critique</span>
      </div>
    </div>
  `);
}

/* ── Section 6 : Inventaires ── */
function s6() {
  return sectionWrap('Inventaires & planning', `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--space-4);">
      ${[['p-inv-freq','Fréquence inventaire (mois)',settings.inv_frequence,'number'],['p-inv-heure','Heure début par défaut',settings.inv_heure,'time']].map(([id,label,val,type])=>`
        <div class="form-group"><label class="form-label">${label}</label><input type="${type}" class="form-input" id="${id}" value="${val}"></div>
      `).join('')}
    </div>
    <div>
      <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">Durées par type (heures)</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-3);">
        ${[['Cession',settings.inv_duree_cession,'p-dur-cession'],['Contrôle',settings.inv_duree_controle,'p-dur-controle'],['Autre',settings.inv_duree_autre,'p-dur-autre']].map(([l,v,id])=>`
          <div class="form-group" style="margin:0;"><label class="form-label">${l}</label><input type="number" class="form-input" id="${id}" value="${v}" min="1" max="24"></div>
        `).join('')}
      </div>
    </div>
    <div>
      <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">Couleurs par type</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-3);">
        ${[['Cession',settings.inv_color_cession,'p-col-cession'],['Contrôle',settings.inv_color_controle,'p-col-controle'],['Congés',settings.inv_color_conges,'p-col-conges'],['Intervention',settings.inv_color_intervention,'p-col-intervention'],['Visite planif.',settings.inv_color_visite,'p-col-visite']].map(([l,v,id])=>`
          <div style="display:flex;align-items:center;gap:var(--space-2);">
            <input type="color" id="${id}" value="${v}" style="width:32px;height:32px;border:1px solid var(--color-border);border-radius:var(--radius-md);cursor:pointer;padding:2px;">
            <span style="font-size:var(--text-sm);color:var(--color-text-mid);">${l}</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div>
      <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">Rappels automatiques</div>
      ${toggleRow('Rappel J-7', '7 jours avant l\'inventaire', 'p-rappel-j7', settings.rappel_j7)}
      ${toggleRow('Rappel J-2', '2 jours avant l\'inventaire', 'p-rappel-j2', settings.rappel_j2)}
      ${toggleRow('Rappel J-0', 'Le jour de l\'inventaire', 'p-rappel-j0', settings.rappel_j0)}
    </div>
  `);
}

/* ── Section 7 : Rapports ── */
function s7() {
  return sectionWrap('Rapports', `
    ${row('En-tête PDF', 'Affiché en haut de chaque rapport PDF', `<input type="text" class="form-input" id="p-entete" value="${settings.rapport_entete}">`)}
    ${row('Ton rapport IA par défaut', null, `
      <select class="form-select" id="p-ton-ia">
        <option value="synthetique" ${settings.rapport_ton==='synthetique'?'selected':''}>Synthétique</option>
        <option value="formel" ${settings.rapport_ton==='formel'?'selected':''}>Formel</option>
        <option value="terrain" ${settings.rapport_ton==='terrain'?'selected':''}>Terrain</option>
      </select>
    `)}
    <div class="form-group">
      <label class="form-label">Prompt IA personnalisé</label>
      <textarea class="form-textarea" id="p-prompt-ia" placeholder="Instructions supplémentaires pour le rapport IA…">${settings.rapport_prompt}</textarea>
    </div>
    ${row('Destinataires email par défaut', 'Séparés par des virgules', `<input type="text" class="form-input" id="p-emails" placeholder="email@exemple.com, email2@exemple.com" value="${settings.rapport_email}">`)}
    ${row('Seuil actions en retard', 'Actions ouvertes depuis X jours = retard', `<div style="display:flex;align-items:center;gap:var(--space-2);"><input type="number" class="form-input" id="p-actions-retard" value="${settings.actions_retard}" min="1" max="60"><span style="font-size:var(--text-sm);color:var(--color-text-light);">jours</span></div>`)}
  `);
}

/* ── Section 8 : Système ── */
function s8() {
  return `
    <div style="background:var(--color-card-bg);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:var(--space-6);">
      <div style="font-size:var(--text-lg);font-weight:var(--weight-semi);color:var(--color-text-dark);margin-bottom:var(--space-5);padding-bottom:var(--space-4);border-bottom:1px solid var(--color-border);">Système & données</div>
      <div style="display:flex;flex-direction:column;gap:var(--space-5);">

        ${row('Rétention journal d\'activité', 'Durée de conservation des logs', `
          <select class="form-select" id="p-retention">
            <option value="30j" ${settings.retention==='30j'?'selected':''}>30 jours</option>
            <option value="90j" ${settings.retention==='90j'?'selected':''}>90 jours</option>
            <option value="365j" ${settings.retention==='365j'?'selected':''}>1 an</option>
            <option value="illimitée" ${settings.retention==='illimitée'?'selected':''}>Illimitée</option>
          </select>
        `)}

        <hr class="divider">

        <div>
          <div style="font-size:var(--text-xs);font-weight:var(--weight-semi);color:var(--color-text-light);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3);">Export & Import</div>
          <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;">
            <button class="btn btn-secondary" onclick="window._paramExport()">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exporter paramètres JSON
            </button>
            <label class="btn btn-secondary" style="cursor:pointer;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Importer paramètres JSON
              <input type="file" accept=".json" style="display:none;" onchange="window._paramImport(this)">
            </label>
          </div>
        </div>

        <hr class="divider">

        <div style="background:var(--color-red-bg);border:1px solid var(--color-red-border);border-radius:var(--radius-lg);padding:var(--space-4);">
          <div style="font-size:var(--text-sm);font-weight:var(--weight-semi);color:var(--color-red-text);margin-bottom:var(--space-2);">Zone dangereuse</div>
          <div style="font-size:var(--text-sm);color:var(--color-red-text);opacity:.8;margin-bottom:var(--space-3);">Réinitialiser tous les paramètres aux valeurs par défaut. Cette action est irréversible.</div>
          <button class="btn btn-danger" onclick="window._paramReset()">Réinitialiser aux défauts</button>
        </div>

        <div style="margin-top:var(--space-2);text-align:right;">
          <button class="btn btn-primary" onclick="window._paramSave('8')">Enregistrer</button>
        </div>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════
   SAUVEGARDE PAR SECTION
   ══════════════════════════════════════════ */
function collectSection(id) {
  const g = (sel) => document.getElementById(sel);
  const v = (sel) => g(sel)?.value;
  const c = (sel) => g(sel)?.checked;

  switch (id) {
    case '1':
      settings.secteur_nom     = v('p-secteur-nom') || settings.secteur_nom;
      settings.secteur_enseigne= v('p-enseigne') || settings.secteur_enseigne;
      settings.accent_color    = v('p-accent') || settings.accent_color;
      break;
    case '2':
      settings.visite_freq    = parseInt(v('p-visite-freq'))   || settings.visite_freq;
      settings.visite_urgente = parseInt(v('p-visite-urgente'))|| settings.visite_urgente;
      settings.visite_risque  = parseInt(v('p-visite-risque')) || settings.visite_risque;
      settings.tel_visite     = c('p-tel-visite') ?? settings.tel_visite;
      break;
    case '3':
      settings.score_labels = {
        ok:     v('p-label-ok')     || settings.score_labels.ok,
        partiel:v('p-label-partiel')|| settings.score_labels.partiel,
        ko:     v('p-label-ko')     || settings.score_labels.ko,
      };
      break;
    case '4':
      settings.seuil_conforme = parseInt(v('p-seuil-conforme')) || settings.seuil_conforme;
      settings.seuil_risque   = parseInt(v('p-seuil-risque'))   || settings.seuil_risque;
      settings.label_conforme = v('p-label-conforme') || settings.label_conforme;
      settings.label_risque   = v('p-label-risque')   || settings.label_risque;
      settings.label_urgent   = v('p-label-urgent')   || settings.label_urgent;
      settings.color_conforme = v('p-color-conforme') || settings.color_conforme;
      settings.color_risque   = v('p-color-risque')   || settings.color_risque;
      settings.color_urgent   = v('p-color-urgent')   || settings.color_urgent;
      break;
    case '5':
      settings.demarque_normale = parseFloat(v('p-demarque-normale')) || settings.demarque_normale;
      settings.demarque_alerte  = parseFloat(v('p-demarque-alerte'))  || settings.demarque_alerte;
      settings.dmq_seuil        = parseFloat(v('p-dmq-seuil'))        || settings.dmq_seuil;
      break;
    case '6':
      settings.inv_frequence       = parseInt(v('p-inv-freq'))    || settings.inv_frequence;
      settings.inv_heure           = v('p-inv-heure')             || settings.inv_heure;
      settings.inv_duree_cession   = parseInt(v('p-dur-cession')) || settings.inv_duree_cession;
      settings.inv_duree_controle  = parseInt(v('p-dur-controle'))|| settings.inv_duree_controle;
      settings.inv_duree_autre     = parseInt(v('p-dur-autre'))   || settings.inv_duree_autre;
      settings.inv_color_cession      = v('p-col-cession')      || settings.inv_color_cession;
      settings.inv_color_controle     = v('p-col-controle')     || settings.inv_color_controle;
      settings.inv_color_conges       = v('p-col-conges')       || settings.inv_color_conges;
      settings.inv_color_intervention = v('p-col-intervention') || settings.inv_color_intervention;
      settings.inv_color_visite       = v('p-col-visite')       || settings.inv_color_visite;
      settings.rappel_j7 = c('p-rappel-j7') ?? settings.rappel_j7;
      settings.rappel_j2 = c('p-rappel-j2') ?? settings.rappel_j2;
      settings.rappel_j0 = c('p-rappel-j0') ?? settings.rappel_j0;
      break;
    case '7':
      settings.rapport_entete = v('p-entete')         || settings.rapport_entete;
      settings.rapport_ton    = v('p-ton-ia')          || settings.rapport_ton;
      settings.rapport_prompt = v('p-prompt-ia')       || '';
      settings.rapport_email  = v('p-emails')          || '';
      settings.actions_retard = parseInt(v('p-actions-retard')) || settings.actions_retard;
      break;
    case '8':
      settings.retention = v('p-retention') || settings.retention;
      break;
  }
}

/* ══════════════════════════════════════════
   INIT
   ══════════════════════════════════════════ */
export function init(container) {
  // Exposer fonctions globales
  window._paramSave = (sectionId) => {
    collectSection(sectionId);
    saveSettings(settings);
    showToast('Paramètres enregistrés ✓', 'success');
  };

  window._paramExport = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'proxipilot_settings.json'; a.click();
    URL.revokeObjectURL(url);
    showToast('Export téléchargé ✓', 'success');
  };

  window._paramImport = (input) => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        settings = { ...DEFAULTS, ...imported };
        saveSettings(settings);
        showToast('Paramètres importés ✓ — rechargement…', 'success');
        setTimeout(() => refreshContent(container), 800);
      } catch { showToast('Fichier JSON invalide', 'error'); }
    };
    reader.readAsText(file);
  };

  window._paramReset = () => {
    if (!confirm('Réinitialiser tous les paramètres aux valeurs par défaut ?')) return;
    settings = { ...DEFAULTS };
    saveSettings(settings);
    showToast('Paramètres réinitialisés ✓', 'success');
    refreshContent(container);
  };

  // Navigation sections
  container.addEventListener('click', e => {
    const item = e.target.closest('.param-nav-item[data-section]');
    if (!item) return;
    activeSection = item.dataset.section;

    container.querySelectorAll('.param-nav-item').forEach(el => {
      const isActive = el.dataset.section === activeSection;
      el.style.background = isActive ? 'var(--color-gold)' : 'transparent';
      el.style.color      = isActive ? 'white' : 'var(--color-text-mid)';
      el.style.fontWeight = isActive ? 'var(--weight-semi)' : 'var(--weight-regular)';
    });

    document.getElementById('param-content').innerHTML = renderSection(activeSection);
  });
}

function refreshContent(container) {
  container.querySelector('#param-content').innerHTML = renderSection(activeSection);
}
