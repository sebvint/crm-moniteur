/* ============================================================
   ProxiPilot — config.js
   Configuration Supabase, constantes métier
   ============================================================ */

export const SUPABASE_URL = 'https://btzwrdjgngfpsutegmci.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_0vlIW4o7tI847aAQ_8UYsg_FrC3w-Z4';

/* ── Rôles ── */
export const ROLES = {
  ADMIN:    'admin',
  MONITEUR: 'moniteur',
  LECTEUR:  'lecteur',
};

/* ── Statuts score ── */
export const SCORE_THRESHOLDS = {
  CONFORME: 80,
  RISQUE:   60,
};

export const SCORE_LABELS = {
  conforme: 'Conforme',
  risque:   'À risque',
  urgent:   'Urgent',
};

/* ── Types événements planning ── */
export const EVENT_TYPES = {
  cession:      { label: 'Cession',           color: '#C9921A' },
  controle:     { label: 'Contrôle',          color: '#2A5A30' },
  conges:       { label: 'Congés',            color: '#1D4ED8' },
  intervention: { label: 'Intervention',      color: '#534AB7' },
  visite:       { label: 'Visite planifiée',  color: '#9C9080' },
};

/* ── Critères audit par défaut ── */
export const AUDIT_CRITERIA = [
  { id: 'haccp',        label: 'HACCP / Hygiène',       partiel: -18, ko: -35 },
  { id: 'dlc',          label: 'DLC / Chaîne du froid', partiel:  -8, ko: -16 },
  { id: 'proprete',     label: 'Propreté générale',      partiel:  -3, ko:  -6 },
  { id: 'ruptures',     label: 'Ruptures rayon',         partiel:  -8, ko: -15 },
  { id: 'lineaire',     label: 'Linéaire / Facing',      partiel:  -5, ko: -10 },
  { id: 'merch',        label: 'Merchandising / Promo',  partiel:  -2, ko:  -5 },
  { id: 'balisage',     label: 'Balisage prix',          partiel:  -2, ko:  -4 },
  { id: 'commandes',    label: 'Commandes',              partiel:  -5, ko: -10 },
  { id: 'stocks',       label: 'Stocks / Casse',         partiel:  -3, ko:  -7 },
  { id: 'etat_general', label: 'État général',           partiel:  -5, ko: -10 },
  { id: 'reserve',      label: 'Réserve',                partiel:  -2, ko:  -5 },
  { id: 'autonomie',    label: 'Autonomie gérant',       partiel:  -3, ko:  -5, ok: 3 },
];

/* ── Seuils visites ── */
export const VISIT_THRESHOLDS = {
  DEFAULT_DAYS:  14,
  URGENT_DAYS:   21,
  RISK_DAYS:     18,
};

/* ── Seuils démarque ── */
export const DEMARQUE_THRESHOLDS = {
  NORMAL: 2,
  ALERT:  4,
  DMQ_UNKNOWN: 1.5,
};

/* ── Navigation tabs ── */
export const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Tableau de bord', icon: 'layout-dashboard', section: null },
  { id: 'magasins',     label: 'Magasins',        icon: 'building-store',   section: 'Activité' },
  { id: 'visites',      label: 'Visites',         icon: 'clipboard-check',  section: 'Activité' },
  { id: 'alertes',      label: 'Alertes',         icon: 'bell',             section: 'Activité', badge: true },
  { id: 'planning',     label: 'Planning',        icon: 'calendar',         section: 'Pilotage' },
  { id: 'inventaires',  label: 'Inventaires',     icon: 'package',          section: 'Pilotage' },
  { id: 'performances', label: 'Performances',    icon: 'chart-bar',        section: 'Pilotage' },
  { id: 'rapports',     label: 'Rapports',        icon: 'file-text',        section: 'Pilotage' },
  { id: 'parametres',   label: 'Paramètres',      icon: 'settings',         section: 'Système', adminOnly: true },
];

/* ── Mobile tabbar (5 items + FAB central) ── */
export const MOBILE_TABS = [
  { id: 'dashboard',   label: 'Accueil',  icon: 'layout-dashboard' },
  { id: 'magasins',    label: 'Magasins', icon: 'building-store' },
  // slot central = FAB visite
  { id: 'alertes',     label: 'Alertes',  icon: 'bell', badge: true },
  { id: 'planning',    label: 'Planning', icon: 'calendar' },
];

/* ── Helpers ── */

/**
 * Retourne la classe pill selon le score
 */
export function scoreClass(score) {
  if (score >= SCORE_THRESHOLDS.CONFORME) return 'pill-green';
  if (score >= SCORE_THRESHOLDS.RISQUE)   return 'pill-orange';
  return 'pill-red';
}

/**
 * Retourne la classe score-value selon le score
 */
export function scoreValueClass(score) {
  if (score >= SCORE_THRESHOLDS.CONFORME) return 'score-green';
  if (score >= SCORE_THRESHOLDS.RISQUE)   return 'score-orange';
  return 'score-red';
}

/**
 * Retourne le label statut score
 */
export function scoreLabel(score) {
  if (score >= SCORE_THRESHOLDS.CONFORME) return SCORE_LABELS.conforme;
  if (score >= SCORE_THRESHOLDS.RISQUE)   return SCORE_LABELS.risque;
  return SCORE_LABELS.urgent;
}

/**
 * Formate une date relative (il y a X jours)
 */
export function relativeDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7)  return `Il y a ${diffDays}j`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)}sem`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/**
 * Formate une date courte FR
 */
export function shortDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

/**
 * Initiales depuis un nom
 */
export function initials(name = '') {
  return name.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

/**
 * Calcule le score audit depuis les réponses
 */
export function calcScore(answers, criteria = AUDIT_CRITERIA) {
  let score = 100;
  for (const c of criteria) {
    const ans = answers[c.id];
    if (ans === 'partiel') score += c.partiel;
    else if (ans === 'ko') score += c.ko;
    else if (ans === 'ok' && c.ok) score += c.ok;
  }
  return Math.max(0, Math.min(100, score));
}
