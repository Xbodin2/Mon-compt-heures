/* =====================================================================
   Mon compt'heures — logique de l'application
   Stockage local (localStorage) :
     ch_settings -> { theme, inputMode, hourFormat, weeklyGoal }
       theme: 'auto' | 'carnet-clair' | 'carnet-sombre' | 'atelier' | 'grille'
       inputMode: 'direct' (nombre d'heures) | 'shift' (début - fin)
     ch_data -> { "YYYY-MM": { "1": {h, c, start, end, pause}, ... } }
       h: heures décimales (toujours recalculées automatiquement en mode 'shift')
       start/end: "HH:MM" (mode 'shift'), pause: minutes (mode 'shift')
   ===================================================================== */

const JOURS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];

const DEFAULT_SETTINGS = { theme:'auto', inputMode:'direct', hourFormat:'decimal', weeklyGoal: null };

/* ---------------------------- état ---------------------------- */
const today = new Date();
let state = {
  year: today.getFullYear(),
  month: today.getMonth(), // 0-11
};

let settings = loadSettings();
let data = loadData();

function loadSettings(){
  try{
    const raw = localStorage.getItem('ch_settings');
    if(raw){
      const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      // migration : les anciennes valeurs 'light'/'dark' correspondent aux thèmes carnet
      if(parsed.theme === 'light') parsed.theme = 'carnet-clair';
      if(parsed.theme === 'dark') parsed.theme = 'carnet-sombre';
      return parsed;
    }
  }catch(e){}
  return { ...DEFAULT_SETTINGS };
}
function saveSettings(){
  localStorage.setItem('ch_settings', JSON.stringify(settings));
}
function loadData(){
  try{
    const raw = localStorage.getItem('ch_data');
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return {};
}
function saveData(){
  localStorage.setItem('ch_data', JSON.stringify(data));
}

function monthKey(y,m){ return `${y}-${String(m+1).padStart(2,'0')}`; }

/* ------------------------- thème ------------------------- */
function resolveThemeName(){
  if(settings.theme === 'auto'){
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'carnet-sombre' : 'carnet-clair';
  }
  return settings.theme;
}
function applyTheme(){
  const root = document.documentElement;
  root.setAttribute('data-theme-name', resolveThemeName());
  const meta = $('#theme-color-meta');
  if(meta){
    const cs = getComputedStyle(root);
    meta.setAttribute('content', cs.getPropertyValue('--paper').trim());
  }
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if(settings.theme === 'auto') applyTheme();
});

/* ------------------------- formatage heures ------------------------- */
// Stockage toujours en nombre décimal d'heures (float).
function parseHoursInput(str){
  if(str == null) return null;
  str = String(str).trim();
  if(str === '') return null;
  str = str.replace(',', '.');
  // format "7h30" / "7h" / "7:30"
  let m = str.match(/^(\d{1,2})\s*[h:]\s*(\d{1,2})?\s*m?$/i);
  if(m){
    const h = parseInt(m[1],10) || 0;
    const mi = m[2] ? parseInt(m[2],10) : 0;
    return h + mi/60;
  }
  const f = parseFloat(str);
  return isNaN(f) ? null : f;
}
function formatHoursForInput(h){
  if(h == null || isNaN(h)) return '';
  if(settings.hourFormat === 'hm'){
    const total = Math.round(h*60);
    const hh = Math.floor(total/60);
    const mm = total % 60;
    return mm === 0 ? `${hh}h` : `${hh}h${String(mm).padStart(2,'0')}`;
  }
  // décimal : jusqu'à 2 décimales, sans zéros inutiles
  return (Math.round(h*100)/100).toString().replace('.', ',');
}
function formatTotal(h){
  if(settings.hourFormat === 'hm'){
    const total = Math.round(h*60);
    const hh = Math.floor(total/60);
    const mm = total % 60;
    return `${hh}h${String(mm).padStart(2,'0')}`;
  }
  return (Math.round(h*100)/100).toLocaleString('fr-FR', {minimumFractionDigits: (h%1!==0)?2:0});
}
function renderMeterDigits(str){
  return [...str].map(ch => {
    if(/\d/.test(ch)) return `<span class="digit">${ch}</span>`;
    return `<span class="sep">${ch}</span>`;
  }).join('');
}

/* ---- conversions pour les champs horaires natifs (input type="time") ---- */
function decimalToHHMM(h){
  if(h == null || isNaN(h)) return '';
  const total = Math.max(0, Math.min(23*60+59, Math.round(h*60)));
  return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
}
function parseHHMM(str){
  const m = String(str||'').match(/^(\d{1,2}):(\d{2})$/);
  if(!m) return null;
  return parseInt(m[1],10) + parseInt(m[2],10)/60;
}
function timeStrToMinutes(str){
  const m = String(str||'').match(/^(\d{1,2}):(\d{2})$/);
  if(!m) return null;
  return parseInt(m[1],10)*60 + parseInt(m[2],10);
}
function clampHours(v){ return Math.max(0, Math.min(24, v)); }
// Durée = fin − début − pause. Si fin < début, on bascule sur le jour suivant (équipe de nuit).
function computeShiftHours(startStr, endStr, pauseMin){
  const startMin = timeStrToMinutes(startStr);
  let endMin = timeStrToMinutes(endStr);
  if(startMin == null || endMin == null) return null;
  if(endMin < startMin) endMin += 24*60;
  let total = endMin - startMin - (pauseMin || 0);
  if(total < 0) total = 0;
  return clampHours(total/60);
}

/* ------------------------------ rendu ------------------------------ */
function daysInMonth(y,m){ return new Date(y, m+1, 0).getDate(); }

function render(){
  // sélecteurs de période
  $('#month-select').value = state.month;
  $('#year-input').value = state.year;

  const key = monthKey(state.year, state.month);
  const monthData = data[key] || {};
  const nbJours = daysInMonth(state.year, state.month);

  let total = 0;
  const list = $('#day-list');
  list.innerHTML = '';
  const isCurrentRealMonth = (state.year === today.getFullYear() && state.month === today.getMonth());

  for(let d=1; d<=nbJours; d++){
    const dow = new Date(state.year, state.month, d).getDay(); // 0=dim
    const entry = monthData[d] || {};
    if(typeof entry.h === 'number') total += entry.h;

    const row = document.createElement('div');
    row.className = 'day-row';
    if(dow === 0 || dow === 6) row.classList.add('is-weekend');
    if(dow === 0) row.classList.add('is-sunday');
    if(isCurrentRealMonth && d === today.getDate()) row.classList.add('is-today');

    row.innerHTML = `
      <div class="day-id">
        <div class="day-name">${JOURS[dow]}</div>
        <div class="day-num">${d}</div>
      </div>
      ${dayFieldsHtml(d, entry)}
    `;
    list.appendChild(row);
  }

  $('#meter-window').innerHTML = renderMeterDigits(formatTotal(total));
  $('#period-label').textContent = `${MOIS[state.month]} ${state.year}`;
  updateGoalLine(total, nbJours);
}

function dayFieldsHtml(d, entry){
  if(settings.inputMode === 'shift'){
    return `
      <div class="day-fields shift-fields">
        <div class="shift-row">
          <input type="time" class="time-input" data-day="${d}" data-field="start" value="${entry.start || ''}">
          <span class="shift-arrow">→</span>
          <input type="time" class="time-input" data-day="${d}" data-field="end" value="${entry.end || ''}">
          <span class="pause-group">
            <input type="number" class="pause-input" inputmode="numeric" min="0" max="600" step="5" placeholder="0" data-day="${d}" data-field="pause" value="${entry.pause || ''}">
            <span class="pause-unit">min pause</span>
          </span>
          <span class="shift-duration" data-day-total="${d}">${entry.h != null ? formatHoursForInput(entry.h) : '—'}</span>
        </div>
        <div class="comment-wrap">
          <input class="comment-input" type="text" placeholder="Commentaire (optionnel)" data-day="${d}" data-field="c" value="${entry.c ? escapeAttr(entry.c) : ''}">
        </div>
      </div>
    `;
  }
  const isTimeWidget = settings.hourFormat === 'hm';
  const hoursField = isTimeWidget
    ? `<input class="hours-input time-input" type="time" data-day="${d}" data-field="h" value="${entry.h != null ? decimalToHHMM(entry.h) : ''}">`
    : `<input class="hours-input" type="text" inputmode="decimal" placeholder="0" data-day="${d}" data-field="h" value="${entry.h != null ? formatHoursForInput(entry.h) : ''}">`;
  return `
    <div class="day-fields">
      ${hoursField}
      <div class="comment-wrap">
        <input class="comment-input" type="text" placeholder="Commentaire (optionnel)" data-day="${d}" data-field="c" value="${entry.c ? escapeAttr(entry.c) : ''}">
      </div>
    </div>
  `;
}

function computeMonthTotal(key){
  const monthData = data[key] || {};
  let total = 0;
  Object.values(monthData).forEach(en => { if(typeof en.h === 'number') total += en.h; });
  return total;
}

/* ------------------------- objectif hebdomadaire ------------------------- */
function updateGoalLine(total, nbJours){
  const el = $('#goal-line');
  const goal = settings.weeklyGoal;
  if(!goal || goal <= 0){
    el.classList.remove('visible');
    el.innerHTML = '';
    return;
  }
  const monthlyGoal = goal / 7 * nbJours;
  const diff = total - monthlyGoal;
  let msg;
  if(Math.abs(diff) < 0.01){
    msg = `Objectif atteint : <strong>${formatTotal(monthlyGoal)}</strong> ce mois (${formatTotal(goal)}/sem.)`;
  } else if(diff < 0){
    msg = `Objectif \u2248<strong>${formatTotal(monthlyGoal)}</strong> ce mois (${formatTotal(goal)}/sem.) \u00b7 reste <strong class="delta">${formatTotal(Math.abs(diff))}</strong>`;
  } else {
    msg = `Objectif \u2248<strong>${formatTotal(monthlyGoal)}</strong> ce mois (${formatTotal(goal)}/sem.) \u00b7 d\u00e9pass\u00e9 de <strong class="delta">${formatTotal(diff)}</strong>`;
  }
  el.innerHTML = msg;
  el.classList.add('visible');
  el.classList.toggle('over', diff >= 0);
}

function escapeAttr(s){
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
}

/* --------------------------- interactions --------------------------- */
function setEntry(day, field, value){
  const key = monthKey(state.year, state.month);
  if(!data[key]) data[key] = {};
  if(!data[key][day]) data[key][day] = {};
  const entry = data[key][day];

  if(field === 'h'){
    const parsed = settings.hourFormat === 'hm' ? parseHHMM(value) : parseHoursInput(value);
    if(parsed == null) delete entry.h;
    else entry.h = clampHours(parsed);
  } else if(field === 'c'){
    if(!value) delete entry.c;
    else entry.c = value;
  } else if(field === 'start' || field === 'end'){
    if(!value) delete entry[field];
    else entry[field] = value;
    recomputeShift(entry);
  } else if(field === 'pause'){
    const m = parseInt(value, 10);
    if(!value || isNaN(m) || m <= 0) delete entry.pause;
    else entry.pause = Math.max(0, Math.min(600, m));
    recomputeShift(entry);
  }

  if(Object.keys(data[key][day]).length === 0) delete data[key][day];
  if(Object.keys(data[key]).length === 0) delete data[key];
  saveData();
}
function recomputeShift(entry){
  const h = computeShiftHours(entry.start, entry.end, entry.pause);
  if(h == null) delete entry.h; else entry.h = h;
}

document.addEventListener('input', (e) => {
  const t = e.target;
  if(t.matches('.hours-input, .comment-input, .time-input, .pause-input')){
    const day = t.dataset.day, field = t.dataset.field;
    setEntry(day, field, t.value);
    if(field === 'h' || field === 'start' || field === 'end' || field === 'pause'){
      const key = monthKey(state.year, state.month);
      const total = computeMonthTotal(key);
      $('#meter-window').innerHTML = renderMeterDigits(formatTotal(total));
      updateGoalLine(total, daysInMonth(state.year, state.month));
      if(field !== 'h'){
        const entry = (data[key] && data[key][day]) || {};
        const badge = document.querySelector(`.shift-duration[data-day-total="${day}"]`);
        if(badge) badge.textContent = entry.h != null ? formatHoursForInput(entry.h) : '—';
      }
    }
  }
});
document.addEventListener('blur', (e) => {
  const t = e.target;
  if(t.matches('.hours-input') && t.type === 'text'){
    const key = monthKey(state.year, state.month);
    const entry = (data[key] && data[key][t.dataset.day]) || {};
    t.value = entry.h != null ? formatHoursForInput(entry.h) : '';
  }
}, true);

$('#month-select').addEventListener('change', (e) => { state.month = parseInt(e.target.value,10); render(); });
$('#year-input').addEventListener('change', (e) => {
  let y = parseInt(e.target.value,10);
  if(isNaN(y)) y = today.getFullYear();
  y = Math.max(1970, Math.min(2200, y));
  state.year = y; render();
});
$('#prev-month').addEventListener('click', () => {
  state.month--; if(state.month<0){ state.month=11; state.year--; } render();
});
$('#next-month').addEventListener('click', () => {
  state.month++; if(state.month>11){ state.month=0; state.year++; } render();
});

/* ------------------------------ réglages ------------------------------ */
const overlay = $('#settings-overlay');
$('#open-settings').addEventListener('click', () => openSheet());
$('#close-settings').addEventListener('click', () => closeSheet());
overlay.addEventListener('click', (e) => { if(e.target === overlay) closeSheet(); });
function openSheet(){ overlay.classList.add('open'); syncSettingsUI(); }
function closeSheet(){ overlay.classList.remove('open'); }

function syncSettingsUI(){
  $$('.theme-option').forEach(b => b.classList.toggle('active', b.dataset.theme === settings.theme));
  $$('.seg-inputmode button').forEach(b => b.classList.toggle('active', b.dataset.v === settings.inputMode));
  $$('.seg-format button').forEach(b => b.classList.toggle('active', b.dataset.v === settings.hourFormat));
  $('#weekly-goal').value = settings.weeklyGoal != null ? settings.weeklyGoal : '';
}
$$('.theme-option').forEach(b => b.addEventListener('click', () => {
  settings.theme = b.dataset.theme; saveSettings(); applyTheme(); syncSettingsUI();
}));
$$('.seg-inputmode button').forEach(b => b.addEventListener('click', () => {
  settings.inputMode = b.dataset.v; saveSettings(); syncSettingsUI(); render();
}));
$$('.seg-format button').forEach(b => b.addEventListener('click', () => {
  settings.hourFormat = b.dataset.v; saveSettings(); syncSettingsUI(); render();
}));
$('#weekly-goal').addEventListener('input', (e) => {
  const v = parseFloat(String(e.target.value).replace(',', '.'));
  settings.weeklyGoal = isNaN(v) || v <= 0 ? null : v;
  saveSettings();
  const key = monthKey(state.year, state.month);
  updateGoalLine(computeMonthTotal(key), daysInMonth(state.year, state.month));
});

/* ------------------------------ export CSV ------------------------------ */
function csvEscape(v){
  v = String(v ?? '');
  if(/[;"\n]/.test(v)) return '"' + v.replace(/"/g,'""') + '"';
  return v;
}
function buildCsv(monthsKeys){
  const rows = [['Date','Heures','Commentaire']];
  monthsKeys.sort().forEach(key => {
    const [y,m] = key.split('-').map(Number);
    const md = data[key];
    Object.keys(md).map(Number).sort((a,b)=>a-b).forEach(day => {
      const entry = md[day];
      const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const hStr = entry.h != null ? (Math.round(entry.h*100)/100).toString().replace('.', ',') : '';
      rows.push([dateStr, hStr, entry.c || '']);
    });
  });
  return rows.map(r => r.map(csvEscape).join(';')).join('\r\n');
}
function downloadCsv(filename, content){
  const blob = new Blob(['\ufeff' + content], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
$('#export-month').addEventListener('click', () => {
  const key = monthKey(state.year, state.month);
  if(!data[key]){ showToast('Aucune donnée à exporter pour ce mois.'); return; }
  downloadCsv(`compt-heures_${key}.csv`, buildCsv([key]));
  showToast('Export du mois effectué.');
});
/* ------------------------------ export PDF ------------------------------ */
$('#export-pdf').addEventListener('click', () => {
  const key = monthKey(state.year, state.month);
  const monthData = data[key] || {};
  const nbJours = daysInMonth(state.year, state.month);
  if(Object.keys(monthData).length === 0){ showToast('Aucune donnée à exporter pour ce mois.'); return; }
  if(!window.jspdf || !window.jspdf.jsPDF){
    showToast("L'export PDF nécessite une connexion internet (chargement du module la première fois).");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const title = `Mon compt'heures — ${MOIS[state.month]} ${state.year}`;

  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text('Récapitulatif mensuel des heures travaillées', 14, 24);
  doc.setTextColor(0);

  const body = [];
  let total = 0;
  for(let d=1; d<=nbJours; d++){
    const entry = monthData[d];
    const dow = new Date(state.year, state.month, d).getDay();
    if(entry && (entry.h != null || entry.c)){
      if(typeof entry.h === 'number') total += entry.h;
      body.push([
        JOURS[dow],
        String(d),
        entry.h != null ? formatHoursForInput(entry.h) : '',
        entry.c || ''
      ]);
    }
  }

  doc.autoTable({
    startY: 30,
    head: [['Jour', 'Date', 'Heures', 'Commentaire']],
    body,
    styles: { fontSize: 10, cellPadding: 2.4 },
    headStyles: { fillColor: [40, 48, 46], textColor: 255 },
    columnStyles: { 0:{cellWidth:22}, 1:{cellWidth:16}, 2:{cellWidth:22} },
    theme: 'grid',
  });

  const finalY = doc.lastAutoTable.finalY || 30;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(`Total du mois : ${formatTotal(total)}`, 14, finalY + 10);
  doc.setFont(undefined, 'normal');

  doc.save(`compt-heures_${key}.pdf`);
  showToast('PDF généré.');
});

$('#export-all').addEventListener('click', () => {
  const keys = Object.keys(data);
  if(keys.length === 0){ showToast('Aucune donnée enregistrée.'); return; }
  downloadCsv('compt-heures_complet.csv', buildCsv(keys));
  showToast('Export complet effectué.');
});

/* ------------------------------ import CSV ------------------------------ */
$('#import-btn').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const n = importCsv(reader.result);
      saveData(); render();
      showToast(`${n} jour(s) importé(s).`);
    }catch(err){
      showToast("Le fichier n'a pas pu être lu. Vérifiez le format CSV.");
    }
  };
  reader.readAsText(file, 'utf-8');
  e.target.value = '';
});
function parseCsvLine(line){
  const out = []; let cur=''; let inQ=false;
  for(let i=0;i<line.length;i++){
    const c = line[i];
    if(inQ){
      if(c === '"'){
        if(line[i+1] === '"'){ cur+='"'; i++; } else inQ=false;
      } else cur += c;
    } else {
      if(c === '"') inQ = true;
      else if(c === ';'){ out.push(cur); cur=''; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}
function importCsv(text){
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim() !== '');
  let count = 0;
  lines.forEach((line, idx) => {
    const cols = parseCsvLine(line);
    const dateStr = (cols[0]||'').trim();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return; // ignore en-tête / lignes invalides
    const [y,m,d] = dateStr.split('-').map(Number);
    const hRaw = (cols[1]||'').trim();
    const c = (cols[2]||'').trim();
    const key = monthKey(y, m-1);
    if(!data[key]) data[key] = {};
    const entry = {};
    if(hRaw !== ''){
      const h = parseHoursInput(hRaw);
      if(h != null) entry.h = h;
    }
    if(c) entry.c = c;
    if(Object.keys(entry).length){ data[key][d] = entry; count++; }
  });
  return count;
}

/* ------------------------------ divers ------------------------------ */
let toastTimer;
function showToast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

$('#reset-data').addEventListener('click', () => {
  if(confirm('Supprimer définitivement toutes les données enregistrées sur cet appareil ?')){
    data = {}; saveData(); render(); closeSheet();
    showToast('Toutes les données ont été supprimées.');
  }
});

/* ------------------------------ init ------------------------------ */
function init(){
  // remplir le sélecteur de mois
  const sel = $('#month-select');
  MOIS.forEach((m,i) => {
    const opt = document.createElement('option');
    opt.value = i; opt.textContent = m;
    sel.appendChild(opt);
  });
  applyTheme();
  render();

  if('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')){
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((reg) => {
      // Vérifie s'il existe une nouvelle version à chaque (ré)ouverture de l'appli.
      reg.update().catch(()=>{});
    }).catch(()=>{});
  }
}
init();
