const CDN_BASE = 'https://cdn.jsdelivr.net/gh/nuqayah/qpc-fonts@master/mushaf-v2-woff2/';
const SURAH_NAMES = ['الفاتحة','البقرة','آل عمران','النساء','المائدة','الأنعام','الأعراف','الأنفال','التوبة','يونس','هود','يوسف','الرعد','إبراهيم','الحجر','النحل','الإسراء','الكهف','مريم','طه','الأنبياء','الحج','المؤمنون','النور','الفرقان','الشعراء','النمل','القصص','العنكبوت','الروم','لقمان','السجدة','الأحزاب','سبأ','فاطر','يس','الصافات','ص','الزمر','غافر','فصلت','الشورى','الزخرف','الدخان','الجاثية','الأحقاف','محمد','الفتح','الحجرات','ق','الذاريات','الطور','النجم','القمر','الرحمن','الواقعة','الحديد','المجادلة','الحشر','الممتحنة','الصف','الجمعة','المنافقون','التغابن','الطلاق','التحريم','الملك','القلم','الحاقة','المعارج','نوح','الجن','المزمل','المدثر','القيامة','الإنسان','المرسلات','النبأ','النازعات','عبس','التكوير','الانفطار','المطففين','الانشقاق','البروج','الطارق','الأعلى','الغاشية','الفجر','البلد','الشمس','الليل','الضحى','الشرح','التين','العلق','القدر','البينة','الزلزلة','العاديات','القارعة','التكاثر','العصر','الهمزة','الفيل','قريش','الماعون','الكوثر','الكافرون','النصر','المسد','الإخلاص','الفلق','الناس'];

let glyphById = new Map();
let locById = new Map();
let layout = null;
let currentPage = 1;
let ayahFirstPage = new Map();
let loadedFonts = new Set();

const $ = id => document.getElementById(id);
const pad3 = n => String(n).padStart(3, '0');

async function loadJson(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error(`Cannot load ${path}: ${res.status}`);
  return await res.json();
}

async function loadPageFont(page){
  const n = pad3(page);
  const family = `QCF_P${n}`;
  if(loadedFonts.has(family)) return family;

  const src = `url('fonts/${family}.woff2') format('woff2'), url('${CDN_BASE}${family}.woff2') format('woff2')`;
  try{
    const font = new FontFace(family, src, {display:'block'});
    const loaded = await font.load();
    document.fonts.add(loaded);
    loadedFonts.add(family);
  }catch(e){
    console.warn('Font loading failed:', family, e);
  }
  return family;
}

async function loadBasmalaFont(){
  if(loadedFonts.has('QCF_BSML')) return;
  const src = `url('fonts/QCF_BSML.woff2') format('woff2'), url('${CDN_BASE}QCF_BSML.woff2') format('woff2')`;
  try{
    const font = new FontFace('QCF_BSML', src, {display:'block'});
    const loaded = await font.load();
    document.fonts.add(loaded);
    loadedFonts.add('QCF_BSML');
  }catch(e){
    console.warn('Basmala font loading failed:', e);
  }
}

function buildIndexes(glyphDb){
  for(const key of Object.keys(glyphDb)){
    const item = glyphDb[key];
    const id = Number(item.id);
    glyphById.set(id, item.text || '');
    locById.set(id, item.location || key);
  }

  for(const [pageNo, lines] of Object.entries(layout.pages)){
    for(const line of lines){
      if(line.first_word_id && line.last_word_id){
        for(let id=line.first_word_id; id<=line.last_word_id; id++){
          const loc = locById.get(id);
          if(!loc) continue;
          const [s,a] = loc.split(':');
          const key = `${s}:${a}`;
          if(!ayahFirstPage.has(key)) ayahFirstPage.set(key, Number(pageNo));
        }
      }
    }
  }
}

function populateSurahSelect(){
  const select = $('surahSelect');
  SURAH_NAMES.forEach((name, i)=>{
    const opt = document.createElement('option');
    opt.value = String(i+1);
    opt.textContent = `${i+1} - ${name}`;
    select.appendChild(opt);
  });
}

function pageRange(lines){
  let first='', last='';
  for(const line of lines){
    if(line.first_word_id && !first) first = (locById.get(line.first_word_id)||'').split(':').slice(0,2).join(':');
    if(line.last_word_id) last = (locById.get(line.last_word_id)||'').split(':').slice(0,2).join(':');
  }
  return first && last ? `${first} إلى ${last}` : '';
}

function makeWordSpan(id){
  const span = document.createElement('span');
  span.className = 'gword';
  span.dataset.id = id;
  span.dataset.location = locById.get(id) || '';
  span.textContent = glyphById.get(id) || '';
  return span;
}

async function showPage(page){
  page = Math.max(1, Math.min(604, Number(page)||1));
  currentPage = page;
  const family = await loadPageFont(page);
  document.documentElement.style.setProperty('--page-font', family);
  const pageEl = $('mushafPage');
  pageEl.style.setProperty('--page-font', family);
  pageEl.innerHTML = '';

  const watermark = document.createElement('div');
  watermark.className = 'page-watermark';
  watermark.textContent = page;
  pageEl.appendChild(watermark);

  const lines = layout.pages[String(page)] || [];
  for(const line of lines){
    const div = document.createElement('div');
    div.className = 'mline';

    if(line.line_type === 'surah_name'){
      const name = SURAH_NAMES[(line.surah_number||1)-1] || '';
      div.classList.add('surah-line');
      div.innerHTML = `<div class="surah-name">سورة ${name}</div>`;
    } else if(line.line_type === 'basmallah'){
      div.classList.add('basmallah');
      div.textContent = '﷽';
    } else if(line.first_word_id && line.last_word_id){
      for(let id=line.first_word_id; id<=line.last_word_id; id++) div.appendChild(makeWordSpan(id));
    }
    pageEl.appendChild(div);
  }

  $('pageInput').value = page;
  $('pageTitle').textContent = `صفحة ${page}`;
  $('pageRange').textContent = pageRange(lines);
  $('pageBadge').textContent = `Page ${page} / 604`;
  window.scrollTo(0,0);
}

function selectWord(el){
  document.querySelectorAll('.gword.selected').forEach(x=>x.classList.remove('selected'));
  el.classList.add('selected');
  const box = $('wordMeta');
  box.style.display = 'block';
  box.textContent = `ID: ${el.dataset.id} | Location: ${el.dataset.location}`;
}

function goToAyah(){
  const s = $('surahSelect').value;
  const a = $('ayahInput').value;
  if(s && a && ayahFirstPage.has(`${s}:${a}`)) showPage(ayahFirstPage.get(`${s}:${a}`));
}

function search(){
  document.querySelectorAll('.gword.hit').forEach(x=>x.classList.remove('hit'));
  const q = $('searchInput').value.trim();
  const results = $('searchResults');
  results.innerHTML = '';
  if(!q) return;

  const locSearch = /^\d+[:\-]\d+/.test(q);
  const prefix = q.replace('-', ':');
  const foundPages = [];

  for(const [pageNo, lines] of Object.entries(layout.pages)){
    let matched = false;
    for(const line of lines){
      if(!line.first_word_id || !line.last_word_id) continue;
      for(let id=line.first_word_id; id<=line.last_word_id; id++){
        const loc = locById.get(id) || '';
        const glyph = glyphById.get(id) || '';
        if((locSearch && loc.startsWith(prefix)) || (!locSearch && glyph.includes(q))){ matched = true; break; }
      }
      if(matched) break;
    }
    if(matched) foundPages.push(Number(pageNo));
    if(foundPages.length >= 80) break;
  }

  if(!foundPages.length){ results.innerHTML = '<div class="note">لا توجد نتائج</div>'; return; }
  showPage(foundPages[0]).then(()=>{
    document.querySelectorAll('.gword').forEach(w=>{
      if((locSearch && w.dataset.location.startsWith(prefix)) || (!locSearch && w.textContent.includes(q))) w.classList.add('hit');
    });
  });
  results.innerHTML = `<div class="note">النتائج: ${foundPages.length} صفحة / أول 80</div>` + foundPages.map(p=>`<button class="result" onclick="showPage(${p})">صفحة ${p}</button>`).join('');
}

async function init(){
  populateSurahSelect();
  await loadBasmalaFont();
  const [glyphDb, layoutDb] = await Promise.all([
    loadJson('data/qpc-v2.min.json'),
    loadJson('data/mushaf-layout.min.json')
  ]);
  layout = layoutDb;
  buildIndexes(glyphDb);

  $('goBtn').onclick = ()=>showPage($('pageInput').value);
  $('prevBtn').onclick = ()=>showPage(currentPage-1);
  $('nextBtn').onclick = ()=>showPage(currentPage+1);
  $('searchBtn').onclick = search;
  $('resetBtn').onclick = ()=>{ $('searchInput').value=''; $('searchResults').innerHTML=''; showPage(1); };
  $('fontSizeSelect').onchange = e=>document.documentElement.style.setProperty('--qsize', `${e.target.value}px`);
  $('surahSelect').onchange = goToAyah;
  $('ayahInput').addEventListener('keydown', e=>{ if(e.key==='Enter') goToAyah(); });
  $('searchInput').addEventListener('keydown', e=>{ if(e.key==='Enter') search(); });
  $('mushafPage').addEventListener('click', e=>{ if(e.target.classList.contains('gword')) selectWord(e.target); });

  await showPage(1);
}

window.showPage = showPage;
init().catch(err=>{
  console.error(err);
  document.body.insertAdjacentHTML('afterbegin', `<div style="direction:ltr;background:#fee;color:#900;padding:12px;border:1px solid #c00">${err.message}<br>Run this from a web server/GitHub Pages. Direct file opening may block JSON loading.</div>`);
});
