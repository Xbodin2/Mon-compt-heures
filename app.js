/* =====================================================================
   Mon compt'heures — logique de l'application
   Stockage local (localStorage) :
     ch_settings -> { theme, accent, hourFormat }
     ch_data     -> { "YYYY-MM": { "1": {h: 7.5, c: "commentaire"}, ... } }
   ===================================================================== */

const JOURS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];

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
    if(raw) return { theme:'auto', accent:'laiton', hourFormat:'decimal', ...JSON.parse(raw) };
  }catch(e){}
  return { theme:'auto', accent:'laiton', hourFormat:'decimal' };
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

/* ------------------------- thème / accent ------------------------- */
function applyTheme(){
  const root = document.documentElement;
  let effective = settings.theme;
  if(effective === 'auto'){
    effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', effective);
  root.setAttribute('data-accent', settings.accent);
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
      <div class="day-fields">
        <input class="hours-input" type="text" inputmode="decimal" placeholder="${settings.hourFormat==='hm' ? '0h00' : '0'}" data-day="${d}" data-field="h" value="${entry.h!=null ? formatHoursForInput(entry.h) : ''}">
        <div class="comment-wrap">
          <input class="comment-input" type="text" placeholder="Commentaire (optionnel)" data-day="${d}" data-field="c" value="${entry.c ? escapeAttr(entry.c) : ''}">
        </div>
      </div>
    `;
    list.appendChild(row);
  }

  $('#meter-window').innerHTML = renderMeterDigits(formatTotal(total));
  $('#period-label').textContent = `${MOIS[state.month]} ${state.year}`;
}

function escapeAttr(s){
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
}

/* --------------------------- interactions --------------------------- */
function setEntry(day, field, value){
  const key = monthKey(state.year, state.month);
  if(!data[key]) data[key] = {};
  if(!data[key][day]) data[key][day] = {};
  if(field === 'h'){
    const parsed = parseHoursInput(value);
    if(parsed == null) delete data[key][day].h;
    else data[key][day].h = Math.max(0, Math.min(24, parsed));
  } else if(field === 'c'){
    if(!value) delete data[key][day].c;
    else data[key][day].c = value;
  }
  if(Object.keys(data[key][day]).length === 0) delete data[key][day];
  if(Object.keys(data[key]).length === 0) delete data[key];
  saveData();
}

document.addEventListener('input', (e) => {
  const t = e.target;
  if(t.matches('.hours-input, .comment-input')){
    const day = t.dataset.day, field = t.dataset.field;
    setEntry(day, field, t.value);
    if(field === 'h'){
      const key = monthKey(state.year, state.month);
      const monthData = data[key] || {};
      let total = 0;
      Object.values(monthData).forEach(en => { if(typeof en.h === 'number') total += en.h; });
      $('#meter-window').innerHTML = renderMeterDigits(formatTotal(total));
    }
  }
});
document.addEventListener('blur', (e) => {
  const t = e.target;
  if(t.matches('.hours-input')){
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
  $$('.seg-theme button').forEach(b => b.classList.toggle('active', b.dataset.v === settings.theme));
  $$('.seg-format button').forEach(b => b.classList.toggle('active', b.dataset.v === settings.hourFormat));
  $$('.swatch').forEach(s => s.classList.toggle('active', s.dataset.a === settings.accent));
}
$$('.seg-theme button').forEach(b => b.addEventListener('click', () => {
  settings.theme = b.dataset.v; saveSettings(); applyTheme(); syncSettingsUI();
}));
$$('.seg-format button').forEach(b => b.addEventListener('click', () => {
  settings.hourFormat = b.dataset.v; saveSettings(); syncSettingsUI(); render();
}));
$$('.swatch').forEach(s => s.addEventListener('click', () => {
  settings.accent = s.dataset.a; saveSettings(); applyTheme(); syncSettingsUI();
}));

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
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }
}
init();
