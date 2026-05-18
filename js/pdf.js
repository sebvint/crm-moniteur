/* ============================================================
   ProxiPilot — pdf.js
   Utilitaire de génération PDF avec html2pdf.js
   Usage : import { generatePDF, pdfFromHTML } from './pdf.js';
   ============================================================ */

/* ══════════════════════════════════════════
   OPTIONS PAR DÉFAUT
   ══════════════════════════════════════════ */
const DEFAULT_OPTIONS = {
  margin:       [10, 10, 10, 10],   // top, right, bottom, left (mm)
  filename:     'rapport_proxipilot.pdf',
  image:        { type: 'jpeg', quality: 0.95 },
  html2canvas:  {
    scale:       2,                  // 2x pour qualité retina
    useCORS:     true,
    logging:     false,
    backgroundColor: '#FFFFFF',
  },
  jsPDF: {
    unit:        'mm',
    format:      'a4',
    orientation: 'portrait',
  },
  pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
};

/* ══════════════════════════════════════════
   FONCTION PRINCIPALE
   Génère un PDF depuis un élément DOM
   ══════════════════════════════════════════ */
export async function generatePDF(element, options = {}) {
  if (!window.html2pdf) {
    throw new Error('html2pdf.js non chargé — vérifier index.html');
  }

  const opts = {
    ...DEFAULT_OPTIONS,
    ...options,
    html2canvas: { ...DEFAULT_OPTIONS.html2canvas, ...(options.html2canvas || {}) },
    jsPDF:       { ...DEFAULT_OPTIONS.jsPDF,       ...(options.jsPDF       || {}) },
  };

  const filename = opts.filename || 'rapport.pdf';
  const blob = await html2pdf().set(opts).from(element).outputPdf('blob');
  downloadBlob(blob, filename);
}

/* ══════════════════════════════════════════
   GÉNÉRATION DEPUIS HTML STRING
   ══════════════════════════════════════════ */
export async function pdfFromHTML(htmlContent, filename = 'rapport.pdf', opts = {}) {
  if (!window.html2pdf) {
    throw new Error('html2pdf.js non chargé');
  }

  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 210mm;
    background: white;
    font-family: 'DM Sans', sans-serif;
    color: #2C2416;
    font-size: 12px;
    line-height: 1.5;
    padding: 0;
  `;
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    const options = {
      ...DEFAULT_OPTIONS,
      filename,
      ...opts,
      html2canvas: { ...DEFAULT_OPTIONS.html2canvas, ...(opts.html2canvas || {}) },
      jsPDF:       { ...DEFAULT_OPTIONS.jsPDF,       ...(opts.jsPDF       || {}) },
    };

    const blob = await html2pdf().set(options).from(container).outputPdf('blob');
    downloadBlob(blob, filename);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Télécharge un Blob PDF via un lien temporaire
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/* ══════════════════════════════════════════
   TEMPLATES HTML RÉUTILISABLES
   ══════════════════════════════════════════ */

/**
 * En-tête standard pour tous les rapports PDF
 */
export function pdfHeader(titre, sousTitre = '', date = null) {
  const d = date || new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  return `
    <div style="
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 14px;
      border-bottom: 3px solid #C9921A;
    ">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="
          width: 36px; height: 36px;
          background: #C9921A;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 700; font-size: 16px;
        ">P</div>
        <div>
          <div style="font-size:14px;font-weight:600;color:#2C2416;">ProxiPilot</div>
          <div style="font-size:10px;color:#9C9080;">Codisud — Secteur Sud Est</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:14px;font-weight:600;color:#2C2416;">${titre}</div>
        ${sousTitre ? `<div style="font-size:10px;color:#9C9080;">${sousTitre}</div>` : ''}
        <div style="font-size:10px;color:#9C9080;margin-top:2px;">${d}</div>
      </div>
    </div>
  `;
}

/**
 * Pied de page standard
 */
export function pdfFooter(moniteur = 'Marie Dupont') {
  return `
    <div style="
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #E8E4DC;
      font-size: 9px;
      color: #9C9080;
      text-align: center;
    ">
      Généré par ProxiPilot — ${moniteur} · ${new Date().toLocaleDateString('fr-FR')}
    </div>
  `;
}

/**
 * Section KPIs pour les rapports
 */
export function pdfKPIs(kpis) {
  // kpis = [{label, value, delta, color}]
  return `
    <div style="
      display: grid;
      grid-template-columns: repeat(${Math.min(kpis.length, 4)}, 1fr);
      gap: 8px;
      margin-bottom: 20px;
    ">
      ${kpis.map(k => `
        <div style="
          background: #F4F1EC;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
        ">
          <div style="font-size:22px;font-weight:700;color:${k.color||'#2C2416'};line-height:1;">${k.value}</div>
          <div style="font-size:9px;color:#9C9080;margin-top:4px;">${k.label}</div>
          ${k.delta ? `<div style="font-size:9px;color:${k.delta.startsWith('+') ? '#2A5A30' : '#8C3030'};margin-top:2px;">${k.delta}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Tableau simple pour les rapports
 */
export function pdfTable(headers, rows, opts = {}) {
  return `
    <table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:16px;">
      <thead>
        <tr style="background:#F4F1EC;">
          ${headers.map(h => `
            <th style="
              padding:6px 8px;text-align:left;
              font-weight:600;color:#6B6050;
              border-bottom:2px solid #C9921A;
              font-size:9px;text-transform:uppercase;letter-spacing:.04em;
            ">${h}</th>
          `).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map((row, i) => `
          <tr style="background:${i % 2 === 0 ? 'white' : '#FAFAF8'};">
            ${row.map(cell => `
              <td style="
                padding:5px 8px;
                border-bottom:1px solid #E8E4DC;
                color:#2C2416;
              ">${cell ?? '—'}</td>
            `).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Section avec titre
 */
export function pdfSection(titre, content) {
  return `
    <div style="margin-bottom:16px;">
      <div style="
        font-size:9px;font-weight:600;color:#9C9080;
        text-transform:uppercase;letter-spacing:.06em;
        margin-bottom:8px;
      ">${titre}</div>
      ${content}
    </div>
  `;
}
