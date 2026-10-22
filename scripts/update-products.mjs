// Daily store product update. Runs on GitHub Actions (see .github/workflows/update-products.yml).
// For each ingredient the app knows, it searches each readable store and keeps the best match:
// brand, product name, pack size, price and a link. The result is written to products.json,
// which the app reads. Stores that can't be read keep the typical products built into the app.
//
// Usage: node scripts/update-products.mjs [--only=Frisco,Auchan] [--limit=10]
import fs from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const ONLY = args.only ? args.only.split(',') : null;
const LIMIT = args.limit ? +args.limit : Infinity;
const TODAY = new Date().toISOString().slice(0, 10);
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- Ingredients (from index.html and meals.json) ---------- */
const html = fs.readFileSync('index.html', 'utf8');
const rawStart = html.indexOf('var ING_RAW=');
const ING_RAW = eval('(' + html.slice(rawStart + 12, html.indexOf('\n};', rawStart) + 2) + ')');
const ING = {};
for (const [k, r] of Object.entries(ING_RAW)) ING[k] = { pl: r[0], en: r[1], unit: r[3], pack: r[7] };
const catalog = JSON.parse(fs.readFileSync('meals.json', 'utf8'));
for (const [k, r] of Object.entries(catalog.ingredients)) ING[k] = { pl: r.pl, en: r.en, unit: r.unit, pack: r.pack };

// Search words per ingredient where the shelf name differs from the app's name.
// "must" words all have to appear in the product name; "not" words rule a product out.
const PL = {
  pomidor: { q: 'pomidory', not: ['suszon', 'koktajl', 'puszk', 'krojon', 'sok', 'przecier', 'passat'] },
  ogorek: { q: 'ogórek zielony', must: ['ogor'], not: ['kiszon', 'konserw', 'małosol'] },
  papryka: { q: 'papryka czerwona', not: ['słodka', 'mielon', 'konserw', 'grillow', 'chips'] },
  cebula: { q: 'cebula', not: ['czerwon', 'prażon', 'suszon', 'dymk'] },
  czosnek: { q: 'czosnek', not: ['koncentrat', 'granulow', 'suszon', 'niedźwiedz', 'pasta', 'sos'] },
  szpinak: { q: 'szpinak baby', must: ['szpinak'], not: ['mrożon', 'liście mrożon'] },
  marchew: { q: 'marchew', not: ['sok', 'mrożon', 'tart', 'baby'] },
  ziemniaki: { q: 'ziemniaki', not: ['frytki', 'chips', 'puree', 'kopytk'] },
  kapusta: { q: 'kapusta biała', must: ['kapust', 'biał'], not: ['kiszon'] },
  salata: { q: 'mix sałat', must: ['sała'] },
  banan: { q: 'banany', must: ['banan'], not: ['chips', 'suszon'] },
  jablko: { q: 'jabłka', must: ['jabł'], not: ['sok', 'chips', 'mus', 'suszon'] },
  cytryna: { q: 'cytryny', must: ['cytryn'], not: ['sok', 'herbat', 'woda'] },
  piers: { q: 'filet z piersi kurczaka', must: ['filet', 'kurczak'], not: ['parów', 'wędz', 'panier'] },
  indyk_mielone: { q: 'mięso mielone z indyka', must: ['indyk', 'mielon'] },
  indyk_filet: { q: 'filet z piersi indyka', must: ['indyk', 'filet'], not: ['paluszk', 'wędz', 'plastr'] },
  wolowina: { q: 'rostbef wołowy', must: ['rostbef'] },
  losos: { q: 'łosoś filet', must: ['łoso'], not: ['wędz'] },
  dorsz: { q: 'filet z dorsza', must: ['dorsz'], not: ['panier', 'wędz'] },
  szynka: { q: 'szynka z indyka', must: ['szynk', 'indyk'] },
  jajka: { q: 'jaja', must: ['jaj'], not: ['makaron', 'przepiórcz', 'czekolad'] },
  twarog: { q: 'twaróg półtłusty', must: ['twaróg', 'półtłust'] },
  skyr: { q: 'skyr naturalny', must: ['skyr'], not: ['truskaw', 'wanili', 'brzoskw', 'malin', 'jagod', 'pitny'] },
  jogurt: { q: 'jogurt naturalny', must: ['jogurt', 'natural'], not: ['grecki', 'pitny', 'kokos'] },
  serek: { q: 'serek wiejski', must: ['serek', 'wiejski'], not: ['lekki', 'ze szczypior'] },
  feta: { q: 'ser feta', must: ['feta'] },
  mleko: { q: 'mleko 2%', must: ['mleko', '2'], not: ['kokos', 'owsian', 'zagęszcz', 'proszk', 'czekolad', 'bez laktozy'] },
  kefir: { q: 'kefir', not: ['truskaw', 'smak'] },
  maslo: { q: 'masło extra', must: ['masło'], not: ['orzech', 'roślin', 'klarow', 'czosnk'] },
  chleb: { q: 'chleb żytni razowy', must: ['chleb', 'żytni'] },
  tortilla: { q: 'tortilla pełnoziarnista', must: ['tortill'] },
  platki: { q: 'płatki owsiane górskie', must: ['płatki', 'owsian'], not: ['błyskaw', 'czekolad', 'owoc'] },
  ryz: { q: 'ryż długoziarnisty', must: ['ryż'], not: ['brązow', 'wafl', 'jaśmin', 'basmati', 'pełnoziarn', 'mąka', 'makaron'] },
  gryczana: { q: 'kasza gryczana', must: ['kasza', 'gryczan'] },
  jeczmienna: { q: 'kasza jęczmienna pęczak', must: ['kasza', 'jęczm'] },
  makaron: { q: 'makaron pełnoziarnisty', must: ['makaron', 'pełnoziarn'] },
  soczewica: { q: 'soczewica czerwona', must: ['soczewic', 'czerwon'] },
  maka: { q: 'mąka pszenna razowa', must: ['mąka'] },
  tunczyk: { q: 'tuńczyk w sosie własnym', must: ['tuńczyk', 'własnym'] },
  pomidory_puszka: { q: 'pomidory krojone', must: ['pomidory', 'krojon'] },
  fasola: { q: 'fasola czerwona', must: ['fasol', 'czerwon'] },
  soja: { q: 'sos sojowy', must: ['sos', 'sojow'] },
  maliny: { q: 'maliny mrożone', must: ['malin', 'mroż'] },
  warzywa_mr: { q: 'warzywa na patelnię', must: ['patelni'] },
  fasolka: { q: 'fasolka szparagowa mrożona', must: ['fasolka', 'szparag'] },
  olej: { q: 'olej rzepakowy', must: ['olej', 'rzepak'] },
  oliwa: { q: 'oliwa z oliwek extra virgin', must: ['oliwa'] },
  odzywka: { q: 'odżywka białkowa whey wanilia', must: ['whey'] },
  pierogi: { q: 'pierogi ruskie', must: ['pierogi', 'rusk'] },
  ciecierzyca: { q: 'ciecierzyca konserwowa', must: ['ciecierzyc'], not: ['mąka', 'chips', 'pasta'] },
  fasola_biala: { q: 'fasola biała konserwowa', must: ['fasol', 'biał'] },
  kukurydza: { q: 'kukurydza konserwowa', must: ['kukurydz'], not: ['popcorn', 'chrupk', 'płatki', 'mąka'] },
  groszek: { q: 'groszek zielony mrożony', must: ['groszek', 'mroż'] },
  krewetki: { q: 'krewetki mrożone', must: ['krewetk'], not: ['ryż', 'masełk', 'danie'] },
  awokado: { q: 'awokado', not: ['pasta', 'guacamole', 'olej'] },
  pieczarki: { q: 'pieczarki', not: ['marynow', 'krojone mrożon', 'zupa', 'sos'] },
  ser_zolty: { q: 'ser gouda plastry', must: ['gouda'] },
  jogurt_grecki: { q: 'jogurt grecki', must: ['jogurt', 'grecki'] },
  twarog_chudy: { q: 'twaróg chudy', must: ['twaróg', 'chudy'] },
  napoj_sojowy: { q: 'napój sojowy bez cukru', must: ['sojow'] },
  mleczko_kokosowe: { q: 'mleczko kokosowe', must: ['mleczko', 'kokos'] },
  kapusta_kiszona: { q: 'kapusta kiszona', must: ['kapust', 'kiszon'] },
  ogorki_kiszone: { q: 'ogórki kiszone', must: ['ogór', 'kiszon'] },
  makaron_ryzowy: { q: 'makaron ryżowy', must: ['makaron', 'ryżow'] },
  wafle: { q: 'wafle ryżowe naturalne', must: ['wafle', 'ryżow'], not: ['czekolad', 'jogurt'] },
  grahamka: { q: 'bułka grahamka', must: ['grahamk'] },
  kielbasa: { q: 'kiełbasa śląska', must: ['kiełbas', 'śląsk'] },
  losos_wedz: { q: 'łosoś wędzony plastry', must: ['łoso', 'wędz'] },
  makrela: { q: 'makrela wędzona', must: ['makrel', 'wędz'] },
  sledz: { q: 'filety śledziowe matjas', must: ['śledz'] },
  ysa: { q: 'plamiak filet', must: ['plamiak'] },
  bleikja: { q: 'golec filet', must: ['golec'] },
  udka: { q: 'filet z uda kurczaka', must: ['ud', 'kurczak', 'filet'] },
  jagniecina: { q: 'udziec jagnięcy', must: ['jagni'], not: ['psów', 'psa', 'kot'] },
  rzodkiewki: { q: 'rzodkiewka', must: ['rzodkiew'], not: ['serek', 'twaro'] },
  wloskie: { q: 'orzechy włoskie', must: ['orzech', 'włosk'] },
  migdaly: { q: 'migdały', must: ['migdał'], not: ['płatki', 'mąka', 'napój', 'mleko'] },
  pestki: { q: 'pestki dyni', must: ['pestki', 'dyni'] },
  chia: { q: 'nasiona chia', must: ['nasion', 'chia'] },
  sezam: { q: 'sezam', must: ['sezam'], not: ['bajgiel', 'pieczyw', 'paluch', 'chałw', 'olej', 'pasta', 'tahini'] },
  slonecznik: { q: 'słonecznik łuskany', must: ['słonecznik'], not: ['olej', 'hummus', 'chleb'] },
  orzeszki: { q: 'orzeszki ziemne', must: ['orzesz', 'ziemn'] },
  nerkowce: { q: 'orzechy nerkowca', must: ['nerkow'] },
  mango: { q: 'mango mrożone', must: ['mango', 'mroż'] },
  owoce_lesne: { q: 'owoce leśne mrożone', must: ['leśn', 'mroż'] },
  jablko: { q: 'jabłka', must: ['jabł'], not: ['sok', 'chips', 'mus', 'suszon', 'prażon', 'occie'] },
  gruszka: { q: 'gruszki', must: ['grusz'], not: ['nashi', 'chińsk', 'occie', 'sok', 'mus', 'suszon'] },
  pomarancza: { q: 'pomarańcze', must: ['pomarańcz'], not: ['sok', 'napój', 'kulki'] },
  batat: { q: 'bataty', must: ['batat'], not: ['makaron', 'mrożon', 'pieczon', 'frytki', 'chips'] },
  imbir: { q: 'imbir świeży', must: ['imbir'], not: ['różow', 'mielon', 'marynow', 'herbat', 'shot', 'syrop'] },
  pietruszka: { q: 'natka pietruszki', must: ['natk'], not: ['suszon', 'żeberka', 'pomysł'] },
  cebula_czerwona: { q: 'cebula czerwona', must: ['cebul', 'czerwon'], not: ['konfitur', 'prażon'] },
  wolowina_mielona: { q: 'wołowina mielona', must: ['wołow', 'mielon'] },
  bleikja: { q: 'golec filet', must: ['golec'] },
  parmezan: { q: 'parmezan', must: ['parme'], not: ['sos', 'chips'] },
  passata: { q: 'passata pomidorowa', must: ['passat'], not: ['chili', 'pikant', 'bazyl'] },
  pesto: { q: 'pesto bazyliowe', must: ['pesto', 'bazyl'], not: ['makaron', 'pistacj', 'czerwon', 'rosso'] },
  ryba_puszka: { q: 'sardynki w sosie pomidorowym', must: ['sardyn', 'pomidor'] },
  pomidorki: { q: 'pomidory koktajlowe', must: ['pomidor', 'cherry|koktajl'] },
  limonka: { q: 'limonki', must: ['limonk'], not: ['sok', 'kulki', 'lemoniad'] },
  tost: { q: 'chleb tostowy pełnoziarnisty', must: ['tost'] },
  pita: { q: 'pita pełnoziarnista', must: ['pita|pitta'] },
  kakao: { q: 'kakao', must: ['kakao'], not: ['krówk', 'kulki', 'napój', 'baton', 'płatki', 'mleko'] },
  czekolada: { q: 'czekolada gorzka 70%', must: ['czekolad', 'gorzk'], not: ['skórk', 'w czekoladzie', 'lody', 'baton'] },
  daktyle: { q: 'daktyle suszone', must: ['daktyl'], not: ['krówk', 'baton', 'syrop', 'maśle'] },
  maslo_orzechowe: { q: 'masło orzechowe', must: ['masło', 'orzech'], not: ['daktyle'] },
  borowki: { q: 'borówka amerykańska', must: ['borówk'], not: ['lody', 'sorbet', 'dżem', 'jogurt', 'mrożon'] },
  truskawki: { q: 'truskawki', must: ['truskaw'], not: ['lody', 'sorbet', 'dżem', 'jogurt', 'mrożon', 'napój', 'konfitur'] },
  kiwi: { q: 'kiwi', not: ['napój', 'sok'] },
  koncentrat: { q: 'koncentrat pomidorowy 30%', must: ['koncentrat', 'pomidor'] },
  oliwki: { q: 'oliwki zielone', must: ['oliwki', 'zielon'], not: ['przekąsk', 'pasta'] },
  pasta_curry: { q: 'pasta curry czerwona', must: ['pasta', 'curry'], not: ['lody'] },
  smietana: { q: 'śmietana 12%', must: ['śmietan', '12'], not: ['lod', 'kanapk'] },
  serek_smietankowy: { q: 'serek śmietankowy light', must: ['serek', 'śmietank'] },
  ziemniaki: { q: 'ziemniaki', must: ['ziemniak'], not: ['frytki', 'chips', 'puree', 'kopytk', 'mąka', 'skrobia', 'placki'] },
  salata: { q: 'mix sałat', must: ['sałat'], not: ['sałatka', 'danie'] },
  cytryna: { q: 'cytryny', must: ['cytryn'], not: ['sok', 'herbat', 'woda', 'kwasek', 'lemoniad'] },
  mleko: { q: 'mleko 2%', must: ['mleko', '2'], not: ['kokos', 'owsian', 'zagęszcz', 'proszk', 'czekolad', 'bez laktozy', 'żelki', 'kakao'] },
  maslo: { q: 'masło extra', must: ['masło'], not: ['orzech', 'roślin', 'klarow', 'czosnk', 'maślan', 'gofr'] },
  ryz: { q: 'ryż długoziarnisty', must: ['ryż'], not: ['sushi', 'brązow', 'wafl', 'jaśmin', 'basmati', 'pełnoziarn', 'mąka', 'makaron', 'kurczak', 'danie'] },
  dynia: { q: 'dynia hokkaido', must: ['dyni', 'hokkaido'] },
  losos: { q: 'łosoś filet', must: ['łoso'], not: ['wędz', 'olej', 'pasta'] }
};
// Words that mark a processed product; ruled out unless the search itself uses them.
const PROCESSED = ['jogurt', 'lody', 'sorbet', 'żelki', 'napój', 'herbat', 'batonik', 'baton', 'krówk', 'kulki', 'konfitur', 'dżem', 'danie', 'przyprawa',
  'chips', 'kombucha', 'przysmak', 'dla psów', 'sos ', 'zupa', 'pasta ', 'hummus', 'serek', 'sałatka', 'kanapk', 'syrop', 'shot', 'kostk',
  'ocet', 'parówk', 'ciast', 'bułka', 'pieczywo', 'paprykarz', 'pizza', 'ravioli', 'sok ', 'grissini', 'paluszk', 'wafel'];
// Never food, whatever the search.
const NONFOOD = ['żel', 'szampon', 'prysznic', 'balsam', 'mydło', 'krem do', 'karma', 'dla kot', 'dla psa', 'wódka', 'likier', 'dezodorant', 'kosmetyk'];
function plQuery(k) {
  const o = PL[k] || {};
  const q = o.q || ING[k].pl.replace(/\(.*?\)/g, '').trim();
  const must = o.must || q.split(/\s+/).filter(w => w.length > 2 && !/^\d/.test(w)).slice(0, 3);
  const not = (o.not || []).concat(PROCESSED.filter(w => !fold(q).includes(fold(w).trim())), NONFOOD);
  return { q, must, not };
}

/* ---------- Matching ---------- */
const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');
// Loose word match that tolerates Polish endings: "kurczaka" matches "kurczak".
const stem = w => { const f = fold(w); return f.length <= 6 ? f : f.slice(0, Math.max(6, f.length - 2)); };
// Words must start a word in the name (a "not" word ending in a space must be a whole word), so "łoso" doesn't match "włosów".
const words = name => ' ' + fold(name).replace(/[^a-z0-9%]+/g, ' ') + ' ';
const has = (name, w) => w.split('|').some(alt => name.includes(' ' + stem(alt)));
function sizeOf(name) {
  const m = fold(name).replace(',', '.').match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/);
  if (!m) return null;
  const n = +m[1], u = m[2];
  return u === 'kg' ? { size: n * 1000, unit: 'g' } : u === 'l' ? { size: n * 1000, unit: 'ml' } : { size: n, unit: u };
}
// Picks the best candidate: all "must" words present, no "not" words, then the pack size
// closest to the app's typical pack, then the shortest (least specific) name.
function pick(cands, query, ing) {
  const first = stem(query.must[0].split('|')[0]);
  const ok = cands.filter(c => {
    const n = words(c.name);
    return query.must.every(w => has(n, w)) && !query.not.some(w => n.includes(w.endsWith(' ') ? words(w) : words(w).trimEnd()));
  });
  if (!ok.length) return null;
  const want = ing.pack || 0;
  // Lower is better: pack size close to typical, the main word early in the name,
  // not organic (usually a premium version), short name, cheaper per kg.
  const score = c => {
    const n = fold(c.name);
    const sz = c.size && want ? Math.abs(Math.log(c.size / want)) : 0.8;
    const pos = n.indexOf(first); const early = pos < 0 ? 0.6 : Math.min(pos, 30) / 50;
    const bio = /\b(bio|eko|organic)\b/.test(n + ' ' + fold(c.brand)) ? 0.5 : 0;
    const per = c.price && c.size ? c.price / c.size * 1000 : 0;
    return sz + early + bio + n.length / 400 + Math.min(per, 200) / 2000;
  };
  ok.sort((a, b) => score(a) - score(b));
  return ok[0];
}

async function getJson(url, opts = {}) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json', 'Accept-Language': 'pl-PL,pl;q=0.9', ...(opts.headers || {}) } });
  if (!r.ok) throw new Error(r.status + ' ' + url);
  return r.json();
}
async function getText(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'pl-PL,pl;q=0.9' } });
  if (!r.ok) throw new Error(r.status + ' ' + url);
  return r.text();
}

/* ---------- Stores ---------- */
const STORES = {
  async Frisco(keys) {
    const items = {};
    for (const k of keys) {
      const query = plQuery(k);
      try {
        const d = await getJson('https://www.frisco.pl/app/commerce/api/v1/offer/products/query?purpose=Listing&pageIndex=1&search=' +
          encodeURIComponent(query.q) + '&includeFacets=false&deliveryMethod=Van&pageSize=24&language=pl');
        const cands = (d.products || []).map(x => x.product).filter(p => p && p.isAvailable !== false).map(p => {
          const name = [p.subbrand, p.name && p.name.pl].filter(Boolean).join(' ');
          const g = p.grammage, u = p.unitOfMeasure;
          const size = g ? (u === 'Kilogram' ? { size: Math.round(g * 1000), unit: 'g' } : u === 'Litre' ? { size: Math.round(g * 1000), unit: 'ml' } : null) : null;
          return { brand: titleCase(p.brand || ''), name, ...(size || sizeOf(name) || {}), price: p.price && p.price.price, currency: 'PLN',
            url: p.productUrl || ('https://www.frisco.pl/pid,' + p.productId + '/stn,product') };
        });
        const best = pick(cands, query, ING[k]);
        if (best) items[k] = best;
      } catch (e) { console.log('  Frisco', k, e.message); }
      await sleep(400);
    }
    return { source: 'frisco.pl', items };
  },
  async Auchan(keys) {
    const items = {};
    let fails = 0;
    for (const k of keys) {
      // Auchan sometimes answers scripts with a bot check page. Give up for today after a few in a row.
      if (fails >= 4) { console.log('  Auchan is blocking requests, stopping'); break; }
      const query = plQuery(k);
      try {
        let page = await getText('https://zakupy.auchan.pl/search?q=' + encodeURIComponent(query.q)).catch(e => e.message);
        if (!page.includes('__INITIAL_STATE__')) { await sleep(10000); page = await getText('https://zakupy.auchan.pl/search?q=' + encodeURIComponent(query.q)).catch(e => e.message); }
        if (!page.includes('__INITIAL_STATE__')) fails++; else fails = 0;
        const m = page.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/);
        if (!m) throw new Error('no state');
        const state = JSON.parse(m[1].replace(/\bundefined\b/g, 'null'));
        const ents = (state.data && state.data.products && state.data.products.productEntities) || findKey(state, 'productEntities') || {};
        const cands = Object.values(ents).filter(p => p && p.available !== false && p.name).map(p => ({
          brand: p.brand || '', name: p.name.replace(new RegExp('\\s*' + escapeRe(p.brand || '#none#') + '\\s*', 'i'), ' ').trim(),
          ...(sizeOf(p.name) || {}), price: p.price && p.price.current ? +p.price.current.amount : null, currency: 'PLN',
          url: 'https://zakupy.auchan.pl/products/' + slug(p.name) + '/' + p.retailerProductId
        }));
        const best = pick(cands, query, ING[k]);
        if (best) items[k] = best;
      } catch (e) { console.log('  Auchan', k, e.message); }
      await sleep(3000);
    }
    return { source: 'zakupy.auchan.pl', items };
  },
  async 'Wolt Market'(keys) {
    // Wolt has no public search, so read every category of one Wolt Market (Warsaw centre) once.
    const base = 'https://consumer-api.wolt.com/consumer-api/consumer-assortment/v1/venues/slug/wolt-market-centrum-2/assortment';
    const root = await getJson(base + '?language=pl');
    const all = [], cats = [];
    (function walk(list) { (list || []).forEach(c => { if (c.slug) cats.push(c); walk(c.subcategories); }); })(root.categories);
    console.log('  Wolt categories:', cats.length);
    const seen = new Set();
    for (const c of cats) {
      let token = null;
      for (let page = 0; page < 10; page++) {
        try {
          const d = await getJson(base + '/categories/slug/' + c.slug + '?language=pl' + (token ? '&page_token=' + encodeURIComponent(token) : ''));
          (d.items || []).forEach(x => { if (!seen.has(x.id)) { seen.add(x.id); all.push(x); } });
          token = d.metadata && d.metadata.next_page_token;
        } catch (e) { console.log('  Wolt', c.slug, e.message); break; }
        await sleep(300);
        if (!token) break;
      }
    }
    console.log('  Wolt items read:', all.length);
    const cands = all.filter(x => !x.disabled_info).map(x => ({ brand: '', name: x.name, ...(sizeOf(x.name) || {}), price: x.price / 100, currency: 'PLN',
      url: 'https://wolt.com/pl/pol/warsaw/venue/wolt-market-centrum-2' }));
    const items = {};
    for (const k of keys) { const best = pick(cands, plQuery(k), ING[k]); if (best) items[k] = best; }
    return { source: 'wolt.com', items };
  }
};
const COUNTRY = { Frisco: 'PL', Auchan: 'PL', 'Wolt Market': 'PL' };

function titleCase(s) { return s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()); }
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function slug(s) { return fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function findKey(o, key, depth = 0) {
  if (!o || typeof o !== 'object' || depth > 6) return null;
  if (key in o) return o[key];
  for (const v of Object.values(o)) { const r = findKey(v, key, depth + 1); if (r) return r; }
  return null;
}

/* ---------- Run ---------- */
const prev = fs.existsSync('products.json') ? JSON.parse(fs.readFileSync('products.json', 'utf8')) : { stores: {} };
const out = { version: 1, updated: TODAY, note: 'Written by scripts/update-products.mjs. Products are matched by search, so check the label in the store.', stores: prev.stores || {} };
const keys = Object.keys(ING).slice(0, LIMIT);
for (const [store, fn] of Object.entries(STORES)) {
  if (ONLY && !ONLY.includes(store)) continue;
  console.log('Store:', store);
  try {
    const res = await fn(keys.filter(k => COUNTRY[store] === 'PL'));
    const n = Object.keys(res.items).length;
    console.log('  matched', n, 'of', keys.length);
    // Keep yesterday's data if a store suddenly returns almost nothing (site change or outage).
    const old = out.stores[store];
    if (old && n < Object.keys(old.items || {}).length * 0.5) { console.log('  too few matches, keeping previous data'); continue; }
    if (n) out.stores[store] = { checked: TODAY, source: res.source, items: res.items };
  } catch (e) { console.log('  failed:', e.message); }
}
fs.writeFileSync('products.json', JSON.stringify(out, null, 1) + '\n');
for (const [s, v] of Object.entries(out.stores)) {
  console.log('\n' + s, v.checked);
  for (const [k, p] of Object.entries(v.items).slice(0, 400)) console.log('  ' + k.padEnd(18), (p.brand + ' | ' + p.name).slice(0, 70).padEnd(72), p.size ? p.size + ' ' + p.unit : '-', p.price);
}
