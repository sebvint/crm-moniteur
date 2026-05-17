/* ============================================================
   ProxiPilot — app.js
   État global, routing SPA, initialisation, auth PIN
   ============================================================ */

import { NAV_ITEMS, MOBILE_TABS } from './config.js';
import { renderSidebar, setActiveItem } from './sidebar.js';

/* ══════════════════════════════════════════
   ÉTAT GLOBAL
   ══════════════════════════════════════════ */
export const AppState = {
  user:        null,   // { id, name, role, color, secteur }
  currentPage: null,   // null au démarrage pour forcer le rendu initial
  alertCount:  0,
  scope:       'secteur', // 'secteur' | 'groupe' | moniteur_id
  sidePanel:   null,   // id du panneau ouvert
};

/* ══════════════════════════════════════════
   ROUTING SPA
   ══════════════════════════════════════════ */
const PAGE_MODULES = {
  dashboard:    () => import('./dashboard.js'),
  magasins:     () => import('./magasins.js'),
  visites:      () => import('./visites.js'),
  alertes:      () => import('./alertes.js'),
  planning:     () => import('./planning.js'),
  inventaires:  () => import('./inventaires.js'),
  performances: () => import('./performances.js'),
  rapports:     () => import('./rapports.js?v=5'),
  parametres:   () => import('./parametres.js'),
};

const PAGE_TITLES = {
  dashboard:    { title: 'Tableau de bord', sub: null },
  magasins:     { title: 'Magasins',        sub: 'Secteur Sud Est' },
  visites:      { title: 'Visites',         sub: 'Journal' },
  alertes:      { title: 'Alertes & Actions', sub: null },
  planning:     { title: 'Planning',        sub: 'Calendrier' },
  inventaires:  { title: 'Inventaires',     sub: null },
  performances: { title: 'Performances',    sub: null },
  rapports:     { title: 'Rapports',        sub: null },
  parametres:   { title: 'Paramètres',      sub: 'Administration' },
};

export async function navigate(pageId) {
  if (pageId === AppState.currentPage) return;

  // Auth guard : paramètres réservés admin
  const item = NAV_ITEMS.find(n => n.id === pageId);
  if (item?.adminOnly && AppState.user?.role !== 'admin') {
    showToast('Accès réservé aux administrateurs', 'error');
    return;
  }

  // Fermer panneau latéral si ouvert
  closeSidePanel();

  // Masquer page courante
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  AppState.currentPage = pageId;

  // Mettre à jour topbar
  updateTopbar(pageId);

  // Sidebar active item
  setActiveItem(pageId);

  // Tabbar mobile
  updateMobileTabbar(pageId);

  // Charger / afficher la page
  let pageEl = document.getElementById(`page-${pageId}`);

  if (!pageEl) {
    // Créer le conteneur
    pageEl = document.createElement('div');
    pageEl.id = `page-${pageId}`;
    pageEl.className = 'page';
    document.getElementById('content')?.appendChild(pageEl);

    // Charger le module
    try {
      const mod = await PAGE_MODULES[pageId]?.();
      if (mod?.render) {
        pageEl.innerHTML = mod.render();
        setTimeout(() => mod.init?.(pageEl), 50);
      } else {
        pageEl.innerHTML = renderPlaceholder(pageId);
      }
    } catch (err) {
      console.error(`Erreur chargement page ${pageId}:`, err);
      pageEl.innerHTML = renderErrorPage(pageId);
    }
  } else {
    // Page déjà créée — réinitialiser les events (module en cache)
    try {
      const mod = await PAGE_MODULES[pageId]?.();
      if (mod?.init) setTimeout(() => mod.init(pageEl), 50);
    } catch {}
  }

  pageEl.classList.add('active');

  // Re-init si nécessaire (données fraîches)
  if (pageEl._needsRefresh) {
    try {
      const mod = await PAGE_MODULES[pageId]?.();
      mod?.refresh?.(pageEl);
    } catch {}
    pageEl._needsRefresh = false;
  }
}

function updateTopbar(pageId) {
  const info = PAGE_TITLES[pageId] || { title: pageId, sub: null };
  const titleEl = document.getElementById('topbar-title');
  const subEl   = document.getElementById('topbar-subtitle');
  const sepEl   = document.getElementById('topbar-sep');

  if (titleEl) titleEl.textContent = info.title;
  if (subEl)   subEl.textContent   = info.sub || '';
  if (sepEl)   sepEl.style.display = info.sub ? '' : 'none';
}

function updateMobileTabbar(pageId) {
  document.querySelectorAll('.tab-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === pageId);
  });
}

/* ══════════════════════════════════════════
   PANNEAU LATÉRAL
   ══════════════════════════════════════════ */
export function openSidePanel({ title, content, id = 'default' }) {
  AppState.sidePanel = id;

  const panel = document.getElementById('side-panel');
  const overlay = document.getElementById('panel-overlay');
  const titleEl = document.getElementById('side-panel-title');
  const bodyEl  = document.getElementById('side-panel-body');

  if (titleEl) titleEl.textContent = title;
  if (bodyEl)  bodyEl.innerHTML = content;

  panel?.classList.add('open');
  overlay?.classList.add('open');
}

export function closeSidePanel() {
  AppState.sidePanel = null;
  document.getElementById('side-panel')?.classList.remove('open');
  document.getElementById('panel-overlay')?.classList.remove('open');
}

/* ══════════════════════════════════════════
   AUTH — PIN 4 chiffres
   ══════════════════════════════════════════ */
const AUTH_KEY = 'proxipilot_user';

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function storeUser(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  AppState.user = null;
  showAuthScreen();
}

function showAuthScreen() {
  const shell = document.getElementById('app-shell');
  const auth  = document.getElementById('auth-screen');
  if (shell) shell.style.display = 'none';
  if (auth)  auth.style.display  = 'flex';

  const pinInput = document.getElementById('pin-input');
  if (pinInput) pinInput.value = '';
  pinInput?.focus();
}

function hideAuthScreen() {
  const shell = document.getElementById('app-shell');
  const auth  = document.getElementById('auth-screen');
  if (shell) shell.style.display = '';
  if (auth)  auth.style.display  = 'none';
}

async function verifyPin(pin) {
  // En dev : PIN 0000 = admin demo
  if (pin === '0000') {
    return { id: 'demo', name: 'Admin Demo', role: 'admin', color: '#C9921A', secteur: 'Sud Est' };
  }
  if (pin === '1111') {
    return { id: 'mon1', name: 'Marie Dupont', role: 'moniteur', color: '#2A5A30', secteur: 'Sud Est' };
  }
  // TODO : requête Supabase users table
  return null;
}

function setupAuth() {
  const pinInput  = document.getElementById('pin-input');
  const pinSubmit = document.getElementById('pin-submit');
  const pinError  = document.getElementById('pin-error');

  async function tryLogin() {
    const pin = pinInput?.value?.trim();
    if (!pin || pin.length !== 4) {
      if (pinError) pinError.textContent = 'Entrez un PIN à 4 chiffres';
      return;
    }

    if (pinSubmit) pinSubmit.disabled = true;

    const user = await verifyPin(pin);
    if (user) {
      AppState.user = user;
      storeUser(user);
      hideAuthScreen();
      await bootApp();
    } else {
      if (pinError) pinError.textContent = 'PIN incorrect';
      if (pinInput) { pinInput.value = ''; pinInput.focus(); }
    }

    if (pinSubmit) pinSubmit.disabled = false;
  }

  pinSubmit?.addEventListener('click', tryLogin);
  pinInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') tryLogin();
    if (pinError) pinError.textContent = '';
  });
  // Numérique uniquement
  pinInput?.addEventListener('input', () => {
    pinInput.value = pinInput.value.replace(/\D/g, '').slice(0, 4);
  });
}

/* ══════════════════════════════════════════
   BOOT
   ══════════════════════════════════════════ */
async function bootApp() {
  // Render sidebar
  renderSidebar();

  // Render mobile tabbar
  renderMobileTabbar();

  // Naviguer vers la page par défaut
  await navigate('dashboard');
}

function renderMobileTabbar() {
  const tabbar = document.getElementById('mobile-tabbar');
  if (!tabbar) return;

  const MOBILE_ICONS = {
    'layout-dashboard': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>`,
    'building-store':   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 21l18 0"/><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2 -4h14l2 4"/><path d="M5 21l0-10.15M19 21l0-10.15"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/></svg>`,
    'bell':             `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3H4a4 4 0 0 0 2-3V11a7 7 0 0 1 4-6"/><path d="M9 17v1a3 3 0 0 0 6 0v-1"/></svg>`,
    'calendar':         `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 11h16"/></svg>`,
  };

  const items = MOBILE_TABS;
  let html = '';

  for (let i = 0; i < items.length; i++) {
    if (i === 2) {
      // Slot central FAB
      html += `<div class="tabbar-fab-slot"></div>`;
    }
    const t = items[i];
    html += `
      <div class="tab-item" data-page="${t.id}">
        ${MOBILE_ICONS[t.icon] || ''}
        <span class="tab-item-label">${t.label}</span>
        ${t.badge ? `<span class="tab-badge" style="display:none">0</span>` : ''}
      </div>
    `;
  }

  tabbar.innerHTML = html;
  tabbar.addEventListener('click', e => {
    const item = e.target.closest('.tab-item[data-page]');
    if (item) navigate(item.dataset.page);
  });
}

/* ══════════════════════════════════════════
   TOAST
   ══════════════════════════════════════════ */
export function showToast(message, type = 'default', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 200ms ease';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

/* ══════════════════════════════════════════
   PLACEHOLDERS (avant implémentation modules)
   ══════════════════════════════════════════ */
function renderPlaceholder(pageId) {
  const titles = PAGE_TITLES[pageId];
  return `
    <div class="empty-state" style="margin-top: 60px;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/>
      </svg>
      <div class="empty-state-title">${titles?.title || pageId}</div>
      <div class="empty-state-sub">Ce module sera disponible prochainement.</div>
    </div>
  `;
}

function renderErrorPage(pageId) {
  return `
    <div class="empty-state" style="margin-top: 60px;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><dot cx="12" cy="16" r="1"/>
      </svg>
      <div class="empty-state-title">Erreur de chargement</div>
      <div class="empty-state-sub">Impossible de charger le module "${pageId}".</div>
    </div>
  `;
}

/* ══════════════════════════════════════════
   INIT
   ══════════════════════════════════════════ */
export function initApp() {
  // Panel overlay click → fermer
  document.getElementById('panel-overlay')?.addEventListener('click', closeSidePanel);
  document.getElementById('side-panel-close')?.addEventListener('click', closeSidePanel);

  // Setup auth
  setupAuth();

  // Check session
  const stored = loadStoredUser();
  if (stored) {
    AppState.user = stored;
    hideAuthScreen();
    bootApp();
  } else {
    showAuthScreen();
  }
}
