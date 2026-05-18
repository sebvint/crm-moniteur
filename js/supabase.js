/* ============================================================
   ProxiPilot — supabase.js
   Couche d'accès données Supabase — toutes les requêtes DB
   Phase 2 : connexion réelle (remplace les MOCK_* de Phase 1)
   ============================================================ */

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

/* ══════════════════════════════════════════
   CLIENT HTTP
   ══════════════════════════════════════════ */
const HEADERS = {
  'apikey':        SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type':  'application/json',
  'Prefer':        'return=representation',
};

async function sb(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, { headers: HEADERS, ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Supabase ${res.status}: ${path}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/* ── helpers URL ── */
const q  = (params) => new URLSearchParams(params).toString();
const eq = (col, val) => `${col}=eq.${encodeURIComponent(val)}`;
const order = (col, asc = false) => `order=${col}.${asc ? 'asc' : 'desc'}`;

/* ══════════════════════════════════════════
   AUTH — PIN 4 chiffres
   Tables : users (à créer si absente)
   En attendant : users hardcodés en localStorage
   ══════════════════════════════════════════ */

// Utilisateurs hardcodés Phase 2 (Supabase users à créer)
const USERS_MOCK = [
  { id: 1, pin: '0000', nom: 'Admin Demo',   prenom: '', role: 'admin',    initiales: 'AD', color: '#C9921A' },
  { id: 2, pin: '1111', nom: 'Marie Dupont', prenom: '', role: 'moniteur', initiales: 'MD', color: '#534AB7' },
  { id: 3, pin: '2222', nom: 'Pierre Martin',prenom: '', role: 'lecteur',  initiales: 'PM', color: '#2A5A30' },
];

export function authByPin(pin) {
  const user = USERS_MOCK.find(u => u.pin === pin);
  if (user) {
    localStorage.setItem('proxipilot_user', JSON.stringify(user));
    return user;
  }
  return null;
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem('proxipilot_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function logout() {
  localStorage.removeItem('proxipilot_user');
}

/* ══════════════════════════════════════════
   MAGASINS
   ══════════════════════════════════════════ */

export async function getMagasins({ statut, moniteur } = {}) {
  let path = 'magasins?select=*';
  if (statut)   path += `&${eq('statut', statut)}`;
  if (moniteur) path += `&${eq('moniteur_ref', moniteur)}`;
  path += `&${order('nom', true)}`;
  return sb(path);
}

export async function getMagasin(code) {
  const rows = await sb(`magasins?${eq('code', code)}&select=*`);
  return rows?.[0] ?? null;
}

export async function updateMagasin(code, data) {
  return sb(`magasins?${eq('code', code)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/* ══════════════════════════════════════════
   VISITES
   ══════════════════════════════════════════ */

export async function getVisites({ code, moniteur, type_visite, limit = 100 } = {}) {
  let path = `visites?select=*&limit=${limit}`;
  if (code)        path += `&${eq('code', code)}`;
  if (moniteur)    path += `&${eq('moniteur', moniteur)}`;
  if (type_visite) path += `&${eq('type_visite', type_visite)}`;
  path += `&${order('date')}`;
  return sb(path);
}

export async function getDerniereVisite(code) {
  const rows = await sb(`visites?${eq('code', code)}&select=*&${order('date')}&limit=1`);
  return rows?.[0] ?? null;
}

export async function createVisite(data) {
  return sb('visites', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/* ══════════════════════════════════════════
   ALERTES & ACTIONS
   Tables : actions (contient les deux)
   ══════════════════════════════════════════ */

export async function getActions({ code, statut, type_action } = {}) {
  let path = 'actions?select=*';
  if (code)        path += `&${eq('code', code)}`;
  if (statut)      path += `&${eq('statut', statut)}`;
  if (type_action) path += `&${eq('type_action', type_action)}`;
  path += `&${order('date')}`;
  return sb(path);
}

export async function getAlertes({ code } = {}) {
  // Les alertes sont les actions avec alerte=true
  let path = `actions?select=*&alerte=eq.true`;
  if (code) path += `&${eq('code', code)}`;
  path += `&statut=neq.cloture`;
  path += `&${order('date')}`;
  return sb(path);
}

export async function updateAction(id, data) {
  return sb(`actions?${eq('id', id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function createAction(data) {
  return sb('actions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/* ══════════════════════════════════════════
   PERFORMANCES
   ══════════════════════════════════════════ */

export async function getPerformances(mois) {
  // mois format : "05/2026"
  let path = 'performances?select=*';
  if (mois) path += `&${eq('mois', mois)}`;
  path += `&${order('code', true)}`;
  return sb(path);
}

export async function getPerformancesMagasin(code) {
  return sb(`performances?${eq('code', code)}&select=*&${order('mois', false)}&limit=12`);
}

export async function upsertPerformance(data) {
  // Upsert sur (code, mois)
  return sb('performances?on_conflict=code,mois', {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(data),
  });
}

/* ══════════════════════════════════════════
   INVENTAIRES
   ══════════════════════════════════════════ */

export async function getInventaires({ code, statut } = {}) {
  let path = 'inventaires?select=*';
  if (code)   path += `&${eq('code', code)}`;
  if (statut) path += `&${eq('statut', statut)}`;
  path += `&${order('date_plan', false)}`;
  return sb(path);
}

export async function createInventaire(data) {
  return sb('inventaires', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateInventaire(id, data) {
  return sb(`inventaires?${eq('id', id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/* ══════════════════════════════════════════
   PLANNING EVENTS
   Table : planning_events (à créer — 404 actuellement)
   Fallback localStorage en attendant
   ══════════════════════════════════════════ */

const PLANNING_STORAGE_KEY = 'proxipilot_planning_events';

export async function getPlanningEvents({ debut, fin } = {}) {
  try {
    let path = 'planning_events?select=*';
    if (debut) path += `&date=gte.${debut}`;
    if (fin)   path += `&date=lte.${fin}`;
    path += `&${order('date', true)}`;
    return await sb(path);
  } catch {
    // Fallback localStorage si table absente
    const raw = localStorage.getItem(PLANNING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}

export async function createPlanningEvent(data) {
  try {
    return await sb('planning_events', { method: 'POST', body: JSON.stringify(data) });
  } catch {
    const events = JSON.parse(localStorage.getItem(PLANNING_STORAGE_KEY) || '[]');
    const newEvent = { ...data, id: 'local_' + Date.now() };
    events.push(newEvent);
    localStorage.setItem(PLANNING_STORAGE_KEY, JSON.stringify(events));
    return [newEvent];
  }
}

/* ══════════════════════════════════════════
   DASHBOARD — AGRÉGATS
   ══════════════════════════════════════════ */

export async function getDashboardData() {
  const [magasins, visites, actions, performances] = await Promise.all([
    getMagasins(),
    getVisites({ limit: 50 }),
    getActions({ statut: 'ouvert' }),
    getPerformances(getCurrentMois()),
  ]);

  // Alertes actives
  const alertes = actions.filter(a => a.alerte);

  // Score moyen
  const visitesAvecScore = visites.filter(v => v.score_audit);
  const scoreMoy = visitesAvecScore.length
    ? Math.round(visitesAvecScore.reduce((s, v) => s + v.score_audit, 0) / visitesAvecScore.length)
    : 0;

  // CA secteur
  const caSecteur  = performances.reduce((s, p) => s + (p.ca_2026 || 0), 0);
  const caSecteurN1 = performances.reduce((s, p) => s + (p.ca_2025 || 0), 0);

  // Couverture (magasins visités dans les 14 derniers jours)
  const il14j = new Date(); il14j.setDate(il14j.getDate() - 14);
  const visitesRecentes = new Set(visites.filter(v => new Date(v.date) > il14j).map(v => v.code));
  const couverture = magasins.length ? Math.round(visitesRecentes.size / magasins.length * 100) : 0;

  // Priorités tournée (magasins par ancienneté dernière visite)
  const dernieresVisites = {};
  for (const v of [...visites].sort((a, b) => new Date(b.date) - new Date(a.date))) {
    if (!dernieresVisites[v.code]) dernieresVisites[v.code] = v;
  }

  const priorites = magasins
    .map(m => ({
      ...m,
      derniereVisite: dernieresVisites[m.code] || null,
      joursDepuis: dernieresVisites[m.code]
        ? Math.floor((Date.now() - new Date(dernieresVisites[m.code].date)) / 86400000)
        : 999,
    }))
    .sort((a, b) => b.joursDepuis - a.joursDepuis)
    .slice(0, 8);

  return { magasins, visites, alertes, actions, performances, scoreMoy, caSecteur, caSecteurN1, couverture, priorites };
}

/* ══════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════ */

function getCurrentMois() {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function formatMois(moisStr) {
  // "05/2026" → "Mai 2026"
  if (!moisStr) return '—';
  const [m, y] = moisStr.split('/');
  return new Date(y, m - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export function moisToKey(moisStr) {
  // "05/2026" → "2026-05"
  if (!moisStr) return null;
  const [m, y] = moisStr.split('/');
  return `${y}-${m}`;
}

export function keyToMois(key) {
  // "2026-05" → "05/2026"
  if (!key) return null;
  const [y, m] = key.split('-');
  return `${m}/${y}`;
}

/* ══════════════════════════════════════════
   REALTIME (Phase 3)
   ══════════════════════════════════════════ */
// À implémenter en Phase 3 avec Supabase Realtime
export function subscribeToAlertes(callback) {
  console.log('Realtime — Phase 3');
}
