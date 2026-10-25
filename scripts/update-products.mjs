// Daily store product update. Runs on GitHub Actions (see .github/workflows/update-products.yml).
// For each ingredient the app knows, it searches each readable store and keeps the best match:
// brand, product name, pack size, price and a link. The result is written to products.json,
// which the app reads. Stores that can't be read keep the typical products built into the app.
//
// Usage: node scripts/update-products.mjs [--only=Frisco,'Wolt Market',Krónan] [--limit=10]
import fs from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const ONLY = args.only ? args.only.split(',') : null;
const LIMIT = args.limit ? +args.limit : Infinity;
const TODAY = new Date().toISOString().slice(0, 10);
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- Ingredients (from the app's built-in list and meals.json) ---------- */
const ING_RAW = JSON.parse(fs.readFileSync('app/src/data/ingredients.json', 'utf8'));
const ING = {};
for (const [k, r] of Object.entries(ING_RAW)) ING[k] = { pl: r[0], en: r[1], unit: r[3], pack: r[7] };
const catalog = JSON.parse(fs.readFileSync('meals.json', 'utf8'));
for (const [k, r] of Object.entries(catalog.ingredients)) ING[k] = { pl: r.pl, en: r.en, unit: r.unit, pack: r.pack };

// Search words per ingredient where the shelf name differs from the app's name.
// "must" words all have to appear in the product name; "not" words rule a product out.
const PL = {
  pomidor: { q: 'pomidory', not: ['cherry', 'suszon', 'koktajl', 'puszk', 'krojon', 'sok', 'przecier', 'passat'] },
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
  orzeszki: { q: 'orzeszki ziemne', must: ['orzesz', 'ziemn'], not: ['panier'] },
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
  ryz: { q: 'ryż długoziarnisty', must: ['ryż'], not: ['meal', 'wieprzow', 'z ryżem', 'płatki', 'sushi', 'brązow', 'wafl', 'jaśmin', 'basmati', 'pełnoziarn', 'mąka', 'makaron', 'kurczak', 'danie'] },
  dynia: { q: 'dynia hokkaido', must: ['dyni', 'hokkaido'] },
  losos: { q: 'łosoś filet', must: ['łoso'], not: ['pstrąg', 'losow', 'wędz', 'olej', 'pasta'] }
};
// Words that mark a processed product; ruled out unless the search itself uses them.
const PROCESSED = ['jogurt', 'lody', 'sorbet', 'żelki', 'napój', 'herbat', 'batonik', 'baton', 'krówk', 'kulki', 'konfitur', 'dżem', 'danie', 'przyprawa',
  'chips', 'kombucha', 'przysmak', 'dla psów', 'sos ', 'zupa', 'pasta ', 'hummus', 'serek', 'sałatka', 'kanapk', 'syrop', 'shot', 'kostk',
  'ocet', 'parówk', 'ciast', 'bułka', 'pieczywo', 'paprykarz', 'pizza', 'ravioli', 'sok ', 'grissini', 'grossini', 'paluszk', 'wafel', 'wafle ', 'smalczyk', 'krokiet', 'kandyz', 'pierniki', 'krem '];
// Never food, whatever the search.
const NONFOOD = ['żel', 'szampon', 'prysznic', 'balsam', 'mydło', 'krem do', 'karma', 'dla kot', 'dla psa', 'wódka', 'likier', 'dezodorant', 'kosmetyk'];
function plQuery(k) {
  const o = PL[k] || {};
  const q = o.q || ING[k].pl.replace(/\(.*?\)/g, '').trim();
  const must = o.must || q.split(/\s+/).filter(w => w.length > 2 && !/^\d/.test(w)).slice(0, 3);
  const not = (o.not || []).concat(PROCESSED.filter(w => !fold(q).includes(fold(w).trim())), NONFOOD);
  return { q, must, not };
}

// Icelandic search words for Krónan. Ingredients without an entry keep the typical product built into the app.
const IS = {
  pomidor: { q: 'tómatar', must: ['tomat'], not: ['fotu', 'kirsuberja', 'konfekt', 'piccolo', 'snakk', 'nidursod', 'saxad', 'hakkad', 'purr', 'thurrk', 'solthurrk', 'mauk'] },
  ogorek: { q: 'agúrka', must: ['agurk|gurk'], not: ['gurkurel', 'edik', 'krakus', 'sur', 'sursad', 'smagurk'] },
  papryka: { q: 'paprika rauð', must: ['paprik', 'raud'], not: ['duft', 'mauk', 'krydd', 'grillud'] },
  cebula: { q: 'laukur', must: ['lauk'], not: ['steikt', 'duft', 'surs', 'sultu'] },
  czosnek: { q: 'hvítlaukur', must: ['hvitlauk'], not: ['hvitlauks', 'duft', 'mauk', 'smjor', 'olia', 'salt', 'braud', 'mulin', 'pressad'] },
  brokul: { q: 'spergilkál', must: ['spergilkal'], not: ['fros'] },
  szpinak: { q: 'spínat', must: ['spinat'], not: ['fros'] },
  marchew: { q: 'gulrætur', must: ['gulr'], not: ['rifn'] },
  ziemniaki: { q: 'kartöflur', must: ['kartofl'], not: ['franskar', 'mus', 'bata', 'sk' + 'ifur', 'saet', 'fros', 'forsod'] },
  kapusta: { q: 'hvítkál', must: ['hvitkal'] },
  cukinia: { q: 'kúrbítur', must: ['kurbit'] },
  dynia: { q: 'grasker', must: ['grasker'], not: ['skraut', 'halloween', 'fra'] },
  rzodkiewki: { q: 'radísur', must: ['radis'] },
  salata: { q: 'salatblanda', must: ['salat|klettasalat|lambhagasalat'], not: ['dressing', 'tunfisk', 'egg', 'raekju', 'kartoflu', 'kjukl', 'pasta'] },
  rukola: { q: 'klettasalat', must: ['klettasal'] },
  banan: { q: 'bananar', must: ['banan'], not: ['thurrk', 'skvis', 'bord'] },
  jablko: { q: 'epli', must: ['epli'], not: ['edik', 'mauk', 'thurrk', 'bit'] },
  cytryna: { q: 'sítrónur', must: ['sitron'], not: ['pipar', 'gras', 'sodavatn', 'kristal'] },
  szczypiorek: { q: 'graslaukur', must: ['graslauk'], not: ['ostur', 'smurost', 'thurrk'] },
  piers: { q: 'kjúklingabringur', must: ['kjuklingabring'], not: ['sous', 'rodizio', 'eldad', 'grillad', 'marin', 'aleg', 'reykt', 'sneid', 'kryddad', 'tikka', 'bbq'] },
  indyk_mielone: { q: 'kalkúnahakk', must: ['kalkunahakk|kalkunhakk'] },
  indyk_filet: { q: 'kalkúnabringa', must: ['kalkunabring|kalkunbring'], not: ['silkiskor', 'aleg', 'sneid', 'reykt', 'kryddad'] },
  wolowina: { q: 'nautalund', must: ['nautalund|nautafille|nautasteik|nautaribeye|ribeye'], not: ['hakk', 'borgar'] },
  losos: { q: 'laxaflök', must: ['lax'], not: ['limesmj', 'smjori', 'reykt', 'grafin', 'graf', 'hrogn', 'laxaolia', 'roll', 'sushi', 'bit', 'flogur'] },
  dorsz: { q: 'þorskflök', must: ['thorsk'], not: ['lifur', 'lysi', 'salt', 'hnakk', 'bollur', 'rasp', 'harðfisk', 'hardfisk', 'kinnar', 'bit'] },
  szynka: { q: 'skinka', must: ['skink'], not: ['pesto', 'pizza', 'salat', 'myrja', 'pasta'] },
  jajka: { q: 'egg', must: ['egg'], not: ['eggja', 'nudl', 'paska', 'hvit', 'kinder'] },
  twarog: { q: 'kvarg', must: ['kvarg'] },
  skyr: { q: 'skyr hreint', must: ['skyr', 'hrein'], not: ['drykk', 'protein'] },
  jogurt: { q: 'hrein jógúrt', must: ['jogurt', 'hrein'], not: ['grisk', 'drykk', 'kokos'] },
  serek: { q: 'kotasæla', must: ['kotasael'], not: ['ananas', 'graslauk'] },
  feta: { q: 'fetaostur', must: ['feta|salatost'] },
  mleko: { q: 'léttmjólk', must: ['lettmjolk'], not: ['kako', 'laktos', 'fernu', 'skyr', 'drykk'] },
  kefir: { q: 'ab mjólk', must: ['ab', 'mjolk'], not: ['sudr', 'avoxt', 'perum', 'jardarber', 'bragd', 'vanill', 'perur', 'ferskj'] },
  maslo: { q: 'smjör', must: ['smjor'], not: ['smjorvi', 'smjorlik', 'kex', 'deig', 'hvitlauk', 'brauð', 'braud', 'kokur', 'sosa', 'popp'] },
  chleb: { q: 'rúgbrauð', must: ['rugbraud'], not: ['kex', 'flatk'] },
  tortilla: { q: 'tortillur', must: ['tortill|vefj'], not: ['flogur', 'chips', 'snakk', 'nachos'] },
  platki: { q: 'haframjöl', must: ['hafr|solgrjon|tröllahafr|trollahafr'], not: ['mjolk', 'drykk', 'kex', 'stykk', 'klatt', 'graut', 'kok'] },
  ryz: { q: 'hrísgrjón', must: ['hrisgrjon'], not: ['butter', 'matsedil', 'hrisgrjonum', 'med', 'hrisgrjonan', 'hydis', 'brun', 'heilkorna', 'kok', 'mjolk', 'graut', 'nudl', 'risotto', 'sushi', 'villi', 'poki', 'sudupok', 'fljot'] },
  gryczana: { q: 'bókhveiti', must: ['bokhveit'], not: ['mjol', 'nudl', 'pasta'] },
  jeczmienna: { q: 'bankabygg', must: ['bygg|bankabygg'], not: ['mjol', 'braud', 'flogur'] },
  makaron: { q: 'heilhveiti pasta', must: ['heilhveit|heilkorn|fullkorn', 'pasta|penne|spaghetti|fusilli|skrufur'] },
  soczewica: { q: 'rauðar linsubaunir', must: ['linsubaun', 'raud'] },
  maka: { q: 'heilhveiti', must: ['heilhveit'], not: ['pasta', 'braud', 'kex', 'tortill', 'penne', 'spaghetti', 'skrufur', 'fusilli', 'vefj', 'pita', 'bollur', 'samloku'] },
  wloskie: { q: 'valhnetur', must: ['valhnet'] },
  migdaly: { q: 'möndlur', must: ['mondl'], not: ['mjolk', 'drykk', 'mjol', 'smjor', 'sukkulad', 'flog', 'kok'] },
  pestki: { q: 'graskersfræ', must: ['graskersfr'] },
  tunczyk: { q: 'túnfiskur í vatni', must: ['tunfisk'], not: ['oliu', 'olia', 'salat', 'sosa', 'pate', 'mauk', 'chili'] },
  pomidory_puszka: { q: 'hakkaðir tómatar', must: ['tomat', 'hakkad|saxad|nidursod|chopped'], not: ['basil', 'hvitlauk', 'chili', 'sosa'] },
  fasola: { q: 'nýrnabaunir', must: ['nyrnabaun|kidney'], not: ['chili'] },
  hummus: { q: 'hummus', must: ['hummus'], not: ['jalapeno', 'paprik', 'chili', 'rauðr', 'raudr', 'basil', 'pestó', 'pesto'] },
  soja: { q: 'sojasósa', must: ['sojasos|soy'], not: ['sweet', 'sæt', 'saet', 'teriyaki'] },
  maliny: { q: 'hindber frosin', must: ['hindber'], not: ['sult', 'skyr', 'jogurt', 'te ', 'drykk', 'safi', 'is '] },
  warzywa_mr: { q: 'wok blanda', must: ['wok|graenmetisbland|grænmetisbland'], not: ['sosa', 'nudl', 'olia', 'panna', 'pon'] },
  fasolka: { q: 'strengjabaunir', must: ['strengjabaun|haricot'] },
  olej: { q: 'repjuolía', must: ['repjuol|rapeseed|canola'] },
  oliwa: { q: 'ólífuolía extra virgin', must: ['olifuol', 'extra|virgin'], not: ['sprey', 'sprei', 'spray', 'chili', 'hvitlauk', 'basil', 'trufflu'] },
  ciecierzyca: { q: 'kjúklingabaunir', must: ['kjuklingabaun'], not: ['kjuklingabaunap', 'fusilli', 'mjol', 'snakk', 'hummus', 'pasta', 'ristad'] },
  fasola_biala: { q: 'hvítar baunir', must: ['baun', 'hvit|smjor|cannellini'], not: ['bakad', 'tomat', 'kaffi'] },
  kukurydza: { q: 'maískorn', must: ['maiskorn|mais'], not: ['popp', 'flog', 'snakk', 'stong', 'mjol', 'sterkj', 'tortill', 'kex', 'kolf', 'fros', 'vefj', 'flak'] },
  groszek: { q: 'grænar baunir', must: ['graen', 'baun'], not: ['soja', 'edamame', 'strengja', 'kaffi', 'nidursod'] },
  szpinak_mr: { q: 'spínat frosið', must: ['spinat', 'fros|frys'] },
  owoce_lesne: { q: 'berjablanda frosin', must: ['berjabl|skogarber|berjablond|bland'], not: ['sult', 'skyr', 'jogurt', 'drykk', 'safi', 'te ', 'mysli', 'muesli', 'hnetu', 'graenmet'] },
  mango: { q: 'mangó frosið', must: ['mango', 'fros|bit'], not: ['safi', 'drykk', 'chutney', 'skyr', 'thurrk'] },
  krewetki: { q: 'rækjur', must: ['raekj'], not: ['salat', 'sosa', 'snakk', 'flog', 'kex', 'chips'] },
  quinoa: { q: 'kínóa', must: ['kinoa|quinoa'], not: ['rice', 'mexican', 'flog', 'kex', 'mjol'] },
  kuskus: { q: 'kúskús', must: ['kuskus|couscous'] },
  bulgur: { q: 'bulgur', must: ['bulgur'] },
  ryz_brazowy: { q: 'brún hrísgrjón', must: ['hrisgrjon', 'brun|heilkorna|hydis'], not: ['kok', 'graut', 'nudl', 'sudupok'] },
  jaglana: { q: 'hirsi', must: ['hirsi|hirsigrjon|millet'] },
  makaron_ryzowy: { q: 'hrísgrjónanúðlur', must: ['hrisgrjonanud|nudl'], not: ['egg', 'ramen', 'instant', 'kjukl', 'nauta', 'bolli', 'kok', 'ediki', 'edik', 'mjolk', 'paper', 'papp'] },
  spaghetti: { q: 'spaghetti', must: ['spaghett|spagett'], not: ['sosa', 'bolognese', 'heilhveit', 'heilkorn'] },
  gnocchi: { q: 'gnocchi', must: ['gnocchi'] },
  bulka_tarta: { q: 'brauðrasp', must: ['braudrasp|rasp|panko'], not: ['fisk', 'thorsk', 'ysu', 'kjukl', 'i raspi'] },
  odzywka: { q: 'prótein duft vanillu', must: ['whey|protein|mysuprotein', 'vanill'], not: ['stykk', 'bar', 'drykk', 'ponnuk', 'skyr', 'bud', 'kex', 'is '] },
  maslo_orzechowe: { q: 'hnetusmjör', must: ['hnetusmjor|peanut'] },
  miod: { q: 'hunang', must: ['hunang|honey'], not: ['ristad', 'cheerios', 'morgunkorn', 'sinnep', 'kjukl', 'hnetur', 'te ', 'skinka', 'gljai'] },
  kakao: { q: 'kakó', must: ['kako|kakao|cocoa'], not: ['drykk', 'mjolk', 'kul', 'puff', 'smjor', 'nibs'] },
  czekolada: { q: 'súkkulaði 70%', must: ['sukkulad|chocolate', '70'], not: ['kex', 'drykk', 'is ', 'raesin', 'rusin'] },
  daktyle: { q: 'döðlur', must: ['dodl'], not: ['stykk', 'bar', 'sirop', 'kul'] },
  rodzynki: { q: 'rúsínur', must: ['rusin'], not: ['sukkulad', 'braud', 'kok'] },
  chia: { q: 'chia fræ', must: ['chia'], not: ['graut', 'drykk', 'bar', 'bud'] },
  sezam: { q: 'sesamfræ', must: ['sesam'], not: ['olia', 'oliu', 'bollur', 'braud', 'kex', 'tahini', 'stang', 'hrokk'] },
  slonecznik: { q: 'sólblómafræ', must: ['solblomafr'], not: ['hrokkbr', 'olia', 'braud'] },
  nerkowce: { q: 'kasjúhnetur', must: ['kasju|cashew'], not: ['smjor', 'sukkulad', 'drykk', 'mjolk'] },
  orzeszki: { q: 'jarðhnetur', must: ['jardhnet|peanuts'], not: ['karamell', 'callowfit', 'chili', 'oliu', 'hunangsrist', 'stokk', 'salsa', 'smjor', 'sukkulad', 'stykk', 'olia', 'snakk'] },
  wafle: { q: 'hrískökur', must: ['hriskok|hrisgrjonakok|hrisgrjonaskif|ricecake'], not: ['sukkulad', 'jogurt', 'karamell', 'mini'] },
  pita: { q: 'pítubrauð', must: ['pitubraud|pita'], not: ['sosa', 'krydd', 'flog'] },
  tost: { q: 'heilhveiti samlokubrauð', must: ['samlokubraud|heilhveitibraud|fjolkornabraud|heilkornabraud|toast'] },
  flatkaka: { q: 'flatkökur', must: ['flatkak|flatkok'] },
  batat: { q: 'sætar kartöflur', must: ['saet', 'kartofl'], not: ['franskar', 'fros', 'flog', 'mus', 'bat'] },
  pieczarki: { q: 'sveppir', must: ['svepp|fludasvepp|kastaniusvepp'], not: ['supa', 'sosa', 'thurrk', 'ostur', 'pate', 'sneid'] },
  awokado: { q: 'avókadó', must: ['avokado|avocado|lárpera|larper'], not: ['olia', 'mauk', 'guacamole'] },
  borowki: { q: 'bláber', must: ['blaber'], not: ['eldpipar', 'reaper', 'helvitis', 'bear', 'minis', 'hindber', 'yummies', 'blaberja', 'fros', 'skyr', 'sult', 'safi', 'jogurt', 'muffin', 'te ', 'drykk', 'thurrk'] },
  truskawki: { q: 'jarðarber', must: ['jardarber'], not: ['fros', 'skyr', 'jogurt', 'sult', 'safi', 'drykk', 'te ', 'thurrk', 'mjolk'] },
  gruszka: { q: 'perur', must: ['perur|pera'], not: ['safi', 'nidursod', 'mauk'] },
  pomarancza: { q: 'appelsínur', must: ['appelsin'], not: ['safi', 'djus', 'gos', 'drykk', 'marmelad', 'kex', 'thykkn', 'sukkulad'] },
  kiwi: { q: 'kiwi', must: ['kiwi'], not: ['safi', 'drykk', 'thurrk'] },
  burak: { q: 'rauðrófur', must: ['raudrof'], not: ['safi', 'flog', 'duft'] },
  cebula_czerwona: { q: 'rauðlaukur', must: ['raudlauk'], not: ['sult', 'steikt', 'surs', 'marmelad'] },
  por: { q: 'blaðlaukur', must: ['bladlauk|purrlauk'], not: ['supa'] },
  seler: { q: 'sellerí', must: ['selleri'], not: ['salt', 'safi', 'sellerirot'] },
  kalafior: { q: 'blómkál', must: ['blomkal'], not: ['fros', 'grjon', 'mus', 'hrisgrjon', 'pizza'] },
  baklazan: { q: 'eggaldin', must: ['eggaldin|eggplant'] },
  jarmuz: { q: 'grænkál', must: ['graenkal|kale'], not: ['buff', 'strong', 'snakk', 'flog', 'chips', 'safi'] },
  pomidorki: { q: 'kirsuberjatómatar', must: ['kirsuberjatomat|konfekttomat|snakktomat|piccolo|cherry'], not: ['passata', 'pastasos', 'solthurrk', 'thurrk', 'nidursod', 'sosa'] },
  limonka: { q: 'límóna', must: ['limon|lime'], not: ['dettol', 'alhreins', 'mintu', 'nocco', 'dos', 'safi', 'gos', 'drykk', 'sodavatn', 'limonad', 'lauf', 'kristal'] },
  imbir: { q: 'engifer', must: ['engifer'], not: ['skot', 'shot', 'safi', 'drykk', 'ol ', 'te ', 'duft', 'malad', 'krydd', 'surs', 'kex', 'sirop', 'kok', 'mauk', 'sukkulad'] },
  koperek: { q: 'dill', must: ['dill'], not: ['thurrk', 'krydd', 'sosa', 'gurk', 'graf'] },
  pietruszka: { q: 'steinselja', must: ['steinselj'], not: ['thurrk', 'krydd', 'rot'] },
  schab: { q: 'svínahryggur', must: ['svinahrygg|svinakotil|svinakotel|hryggsneid'], not: ['hangi', 'reykt', 'hamborgar', 'birkireykt'] },
  poledwiczka: { q: 'svínalund', must: ['svinalund'], not: ['fyllt'] },
  wolowina_mielona: { q: 'nautahakk', must: ['nautahakk|ungnautahakk'], not: ['borgar', 'sosa', 'bolognese', 'lasagna', 'bollur'] },
  udka: { q: 'úrbeinuð kjúklingalæri', must: ['kjuklingalaer|laeri|læri'], not: ['legg', 'vaeng', 'eldad', 'grillad', 'lamb', 'kryddad', 'bbq', 'tikka', 'marin'] },
  jagniecina: { q: 'lambalæri sneiðar', must: ['lamb'], not: ['hakk', 'pyls', 'bjugu', 'kraft', 'sod', 'hangikjot', 'svid', 'kaefa', 'lifur', 'hryggur', 'reykt', 'grillkrydd'] },
  kielbasa: { q: 'pylsur', must: ['pyls|bjugu'], not: ['braud', 'sinnep', 'tomatsos', 'pylsubraud', 'pyslubraud', 'pasta', 'pylsuostur'] },
  losos_wedz: { q: 'reyktur lax', must: ['reykt', 'lax'], not: ['salat', 'sosa', 'mauk', 'pate'] },
  makrela: { q: 'reyktur makríll', must: ['makril|makrill'], not: ['salat', 'mauk', 'pate'] },
  sledz: { q: 'síld', must: ['sild'], not: ['salat', 'lysi', 'olia'] },
  ysa: { q: 'ýsuflök', must: ['ysa|ysu|ysuflok'], not: ['bollur', 'rasp', 'reykt', 'plokk', 'salt', 'bit', 'hardfisk', 'kinnar'] },
  bleikja: { q: 'bleikja', must: ['bleikj'], not: ['tadreykt', 'reykt', 'graf'] },
  tofu: { q: 'tófú', must: ['tofu'], not: ['steikt', 'silken', 'silki', 'reykt', 'kryddad', 'marin'] },
  twarog_chudy: { q: 'kvarg hreint', must: ['kvarg'] },
  jogurt_grecki: { q: 'grísk jógúrt', must: ['grisk', 'jogurt'], not: ['hindber', 'jardarber', 'mango', 'blaber', 'ferskj', 'karamell', 'kaffi', 'sukkulad', 'vanill', 'kokos', 'hunang', 'jardarber', 'bragd', 'ferskj'] },
  mozzarella: { q: 'mozzarella', must: ['mozzarell'], not: ['rifinn', 'rifin', 'pizza', 'stang', 'sticks', 'perl', 'mini'] },
  parmezan: { q: 'parmesan', must: ['parmesan|parmigiano|grana|parmes'], not: ['violife', 'rifinn', 'julienne', 'sosa', 'flog'] },
  ser_zolty: { q: 'gouda sneiðar', must: ['gouda|ostur'], not: ['rifinn', 'rifin', 'smurost', 'kex', 'salat', 'raspur', 'mozzarell', 'cheddar', 'braud', 'pizza'] },
  serek_smietankowy: { q: 'rjómaostur', must: ['rjomaost|philadelph'], not: ['kex', 'sosa', 'kaka', 'kryddad', 'beikon', 'graslauk', 'hvitlauk', 'paprik', 'chili'] },
  ricotta: { q: 'ricotta', must: ['ricotta'] },
  halloumi: { q: 'halloumi', must: ['halloumi|grillost'], not: ['burger', 'fros', 'chili'] },
  smietana: { q: 'sýrður rjómi', must: ['syrdur|syrður|syrd', 'rjom'], not: ['oatly', 'idyfa', 'sosa', 'snakk', 'flog', 'lauk', 'graslauk', 'hvitlauk', 'salsa'] },
  napoj_sojowy: { q: 'sojadrykkur', must: ['sojadrykk|sojamjolk|soja|soy'], not: ['sosa', 'sosu', 'baun', 'jogurt', 'duft', 'kjot', 'hakk', 'sukkulad', 'kako', 'vanill', 'skyr', 'nudl'] },
  mleczko_kokosowe: { q: 'kókosmjólk', must: ['kokosmjolk|coconut'], not: ['drykk', 'jogurt', 'is ', 'vatn', 'flog'] },
  passata: { q: 'passata', must: ['passata'], not: ['basil', 'hvitlauk', 'chili'] },
  koncentrat: { q: 'tómatpúrra', must: ['tomatpurr|tomatmauk|tomatpaste|tomatpure|tomatthykkni'] },
  kapusta_kiszona: { q: 'súrkál', must: ['surkal|sauerkraut'] },
  ogorki_kiszone: { q: 'súrar gúrkur', must: ['gurk|agurk', 'sur|sursad|dill|pickl'], not: ['bread', 'saetsur', 'relish', 'salat', 'saet'] },
  oliwki: { q: 'grænar ólífur', must: ['olif|oliv', 'graen|green'], not: ['mondl', 'med', 'olia', 'mauk', 'pate', 'tapenade', 'fyllt'] },
  pesto: { q: 'pestó', must: ['pesto'], not: ['rautt', 'rosso', 'tomat', 'pasta', 'solthurrk', 'raud'] },
  pasta_curry: { q: 'red curry paste', must: ['curry|karri', 'paste|mauk'], not: ['graen', 'green', 'gult', 'yellow', 'massaman', 'sosa', 'sauce', 'korma', 'tikka'] },
  ryba_puszka: { q: 'sardínur', must: ['sardin'], not: ['olia', 'oliu'] }
};
// Words that mark a processed or non-food product at Krónan; ruled out unless the search itself uses them.
const IS_PROCESSED = ['snakk', 'flogur', 'nammi', 'sosa ', 'safi ', 'drykkur', 'djus', 'sulta', 'idyfa', 'kex ', 'kaka ', 'kokur ', 'stykki', 'pizza', 'supa ',
  'barnamatur', 'skvisa', 'krydd ', 'salat ', 'skyrdrykk', 'boost', 'smoothie', 'grautur', 'is ', 'brauðteningar', 'samloka', 'vefja ', 'rettur', 'tilbuin'];
const IS_NONFOOD = ['andlit', 'maski', 'dettol', 'hreinsi', 'alhreins', 'sjampo', 'sapa', 'krem ', 'harnaer', 'tannkrem', 'hundamatur', 'kattamatur', 'hunda', 'katta', 'gaeludyr', 'sturtu', 'thvottaefni', 'uppthvotta', 'kerti', 'ilm', 'blom ', 'plant', 'fraeposi', 'utsaedi'];
function isQuery(k) {
  const o = IS[k]; if (!o) return null;
  const q = o.q, must = o.must || [q.split(/\s+/)[0]];
  const not = (o.not || []).concat(IS_PROCESSED.filter(w => !fold(q).includes(fold(w).trim())), IS_NONFOOD);
  return { q, must, not };
}

/* ---------- Matching ---------- */
const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/æ/g, 'ae').replace(/ð/g, 'd').replace(/þ/g, 'th').replace(/ø/g, 'o');
// Loose word match that tolerates Polish endings: "kurczaka" matches "kurczak".
const stem = w => { const f = fold(w); return f.length <= 6 ? f : f.slice(0, Math.max(6, f.length - 2)); };
// Words must start a word in the name (a "not" word ending in a space must be a whole word), so "łoso" doesn't match "włosów".
const words = name => ' ' + fold(name).replace(/[^a-z0-9%]+/g, ' ') + ' ';
const has = (name, w) => w.split('|').some(alt => name.includes(' ' + stem(alt)));
function sizeOf(name) {
  const m = fold(name).replace(',', '.').match(/(\d+(?:\.\d+)?)\s*(kg|gr|g|ml|cl|dl|ltr|l)\b/);
  if (!m) return null;
  const n = +m[1], u = { gr: 'g', ltr: 'l' }[m[2]] || m[2];
  if (u === 'cl' || u === 'dl') return { size: Math.round(n * (u === 'cl' ? 10 : 100)), unit: 'ml' };
  return u === 'kg' ? { size: n * 1000, unit: 'g' } : u === 'l' ? { size: n * 1000, unit: 'ml' } : { size: n, unit: u };
}
// Picks the best candidate: all "must" words present, no "not" words, then the pack size
// closest to the app's typical pack, then the shortest (least specific) name.
function pick(cands, query, ing) {
  const first = stem(query.must[0].split('|')[0]);
  const ok = cands.filter(c => {
    const n = words(c.name);
    return query.must.every(w => has(n, w)) && !query.not.some(w => n.includes(w.endsWith(' ') ? words(w.trim()) : words(w).trimEnd()));
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
  },
  async 'Krónan'(keys) {
    // Krónan's website search (backend.kronan.is) answers without a login.
    const items = {}; let shown = false;
    for (const k of keys) {
      const query = isQuery(k);
      try {
        const r = await fetch('https://backend.kronan.is/api/products/raw-search/', { method: 'POST',
          headers: { 'User-Agent': UA, Accept: 'application/json', 'Content-Type': 'application/json', Origin: 'https://kronan.is', Referer: 'https://kronan.is/' },
          body: JSON.stringify({ query: query.q }) });
        if (!r.ok) throw new Error(r.status);
        const d = await r.json();
        const hits = (d.results && d.results.hits) || [];
        if (!shown && hits[0]) { console.log('  Krónan sample hit:', JSON.stringify(hits[0]).slice(0, 900)); shown = true; }
        const cands = hits.filter(h => h.isPublished !== false && !h.temporaryShortage && h.price).map(h => {
          const size = sizeOf(String(h.priceInfo || '').split(' - ')[0]) || sizeOf(h.name) || {};
          return { brand: h.brand ? titleCase(String(h.brand)) : '', name: h.name, ...size, price: h.price, currency: 'ISK',
            url: h.slug ? 'https://kronan.is/vara/' + h.sku + '-' + h.slug : 'https://kronan.is/vara/' + h.sku };
        });
        const best = pick(cands, query, ING[k]);
        if (best) items[k] = best;
      } catch (e) { console.log('  Krónan', k, e.message); }
      await sleep(300);
    }
    console.log('  no match:', keys.filter(k => !items[k]).join(', '));
    return { source: 'kronan.is', items };
  }
};
const COUNTRY = { Frisco: 'PL', 'Wolt Market': 'PL', 'Krónan': 'IS' };

function titleCase(s) { return s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()); }

/* ---------- Run ---------- */
const prev = fs.existsSync('products.json') ? JSON.parse(fs.readFileSync('products.json', 'utf8')) : { stores: {} };
const out = { version: 1, updated: TODAY, note: 'Written by scripts/update-products.mjs. Products are matched by search, so check the label in the store.', stores: prev.stores || {} };
// Drop stores that are no longer checked.
for (const st of Object.keys(out.stores)) if (!STORES[st]) delete out.stores[st];
const keys = Object.keys(ING).slice(0, LIMIT);
for (const [store, fn] of Object.entries(STORES)) {
  if (ONLY && !ONLY.includes(store)) continue;
  console.log('Store:', store);
  try {
    const res = await fn(keys.filter(k => COUNTRY[store] === 'PL' || (COUNTRY[store] === 'IS' && IS[k])));
    const n = Object.keys(res.items).length;
    console.log('  matched', n, 'of', COUNTRY[store] === 'IS' ? keys.filter(k => IS[k]).length : keys.length);
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
