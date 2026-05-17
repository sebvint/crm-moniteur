/* ============================================================
   ProxiPilot — sidebar.js
   Sidebar rétractable, navigation, localStorage
   ============================================================ */

import { NAV_ITEMS } from './config.js';
import { AppState, navigate } from './app.js';

const STORAGE_KEY = 'proxipilot_sidebar_collapsed';

/* ── Icônes Tabler en inline SVG ── */
const ICONS = {
  'layout-dashboard': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>`,
  'building-store':   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 21l18 0"/><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2 -4h14l2 4"/><path d="M5 21l0 -10.15"/><path d="M19 21l0 -10.15"/><path d="M9 21v-4a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v4"/></svg>`,
  'clipboard-check':  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 12 2 2 4-4"/></svg>`,
  'bell':             `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3H4a4 4 0 0 0 2-3V11a7 7 0 0 1 4-6"/><path d="M9 17v1a3 3 0 0 0 6 0v-1"/></svg>`,
  'calendar':         `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 11h16"/></svg>`,
  'package':          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="16.5 9.4 7.5 4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  'chart-bar':        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="6" width="4" height="15" rx="1"/><rect x="17" y="9" width="4" height="12" rx="1"/></svg>`,
  'file-text':        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><line x1="9" y1="9" x2="10" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>`,
  'settings':         `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>`,
  'chevrons-left':    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>`,
  'log-out':          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
};

function icon(name, cls = '') {
  const svg = ICONS[name] || `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="4"/></svg>`;
  return svg.replace('<svg ', `<svg class="${cls}" `);
}

/* ══════════════════════════════════════════
   RENDER SIDEBAR
   ══════════════════════════════════════════ */
export function renderSidebar() {
  const user = AppState.user;
  const isCollapsed = localStorage.getItem(STORAGE_KEY) === 'true';

  // Grouper items par section
  const sections = {};
  for (const item of NAV_ITEMS) {
    // Masquer Paramètres aux non-admins
    if (item.adminOnly && user?.role !== 'admin') continue;

    const sec = item.section || '__top__';
    if (!sections[sec]) sections[sec] = [];
    sections[sec].push(item);
  }

  let navHTML = '';

  // Top (dashboard seul, sans label de section)
  if (sections['__top__']) {
    navHTML += `<div class="sidebar-section">`;
    for (const item of sections['__top__']) {
      navHTML += renderNavItem(item);
    }
    navHTML += `</div>`;
  }

  // Sections avec label
  for (const [sec, items] of Object.entries(sections)) {
    if (sec === '__top__') continue;
    navHTML += `
      <div class="sidebar-section">
        <div class="sidebar-section-label">${sec}</div>
        ${items.map(renderNavItem).join('')}
      </div>
    `;
  }

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-logo">P</div>
      <div class="sidebar-brand">
        <div class="sidebar-brand-name">ProxiPilot</div>
        <div class="sidebar-brand-sub">Codisud</div>
      </div>
    </div>

    <nav class="sidebar-nav" id="sidebar-nav">
      ${navHTML}
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-user" id="sidebar-user">
        <div class="user-avatar">${user ? initials(user.name) : '?'}</div>
        <div class="user-info">
          <div class="user-name">${user?.name || 'Utilisateur'}</div>
          <div class="user-role">${formatRole(user?.role)}</div>
        </div>
      </div>
      <div class="sidebar-toggle" id="sidebar-toggle">
        ${icon('chevrons-left')}
        <span class="sidebar-toggle-label">Réduire</span>
      </div>
    </div>
  `;

  if (isCollapsed) sidebar.classList.add('collapsed');

  // Events
  document.getElementById('sidebar-toggle')?.addEventListener('click', toggleSidebar);
  document.getElementById('sidebar-nav')?.addEventListener('click', onNavClick);

  setActiveItem(AppState.currentPage);
}

function renderNavItem(item) {
  const badgeCount = item.badge ? (AppState.alertCount || 0) : 0;
  const badgeHTML = badgeCount > 0
    ? `<span class="nav-badge">${badgeCount > 99 ? '99+' : badgeCount}</span>`
    : '';

  return `
    <div class="nav-item" data-page="${item.id}" data-tooltip="${item.label}">
      <div class="nav-item-icon">${icon(item.icon)}</div>
      <span class="nav-item-label">${item.label}</span>
      ${badgeHTML}
    </div>
  `;
}

/* ══════════════════════════════════════════
   TOGGLE
   ══════════════════════════════════════════ */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  const isNowCollapsed = sidebar.classList.toggle('collapsed');
  localStorage.setItem(STORAGE_KEY, isNowCollapsed);
}

/* ══════════════════════════════════════════
   NAVIGATION
   ══════════════════════════════════════════ */
function onNavClick(e) {
  const item = e.target.closest('.nav-item[data-page]');
  if (!item) return;
  navigate(item.dataset.page);
}

export function setActiveItem(pageId) {
  document.querySelectorAll('#sidebar-nav .nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === pageId);
  });
}

/* ══════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════ */
function formatRole(role) {
  const map = { admin: 'Administrateur', moniteur: 'Moniteur', lecteur: 'Lecteur' };
  return map[role] || role || '—';
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

/* ── Mise à jour badge alertes ── */
export function updateAlertBadge(count) {
  AppState.alertCount = count;
  document.querySelectorAll('.nav-item[data-page="alertes"] .nav-badge').forEach(el => {
    el.textContent = count > 99 ? '99+' : count;
    el.style.display = count > 0 ? '' : 'none';
  });
}
