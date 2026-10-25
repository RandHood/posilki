// Checks meals.json before it is committed: ids, ingredient keys, fields and calorie ranges.
// Usage: node scripts/check-meals.mjs   (exits with 1 and lists the problems if anything is wrong)
import fs from 'node:fs';

const ING_RAW = JSON.parse(fs.readFileSync(new URL('../app/src/data/ingredients.json', import.meta.url), 'utf8'));
const cat = JSON.parse(fs.readFileSync(new URL('../meals.json', import.meta.url), 'utf8'));

const SHAPES = 'grain crumble curd round coin stick bit floret leaf chunk shred wedge herb slab strip slice egg mound cube bread wrap pasta nut seed bean berry mix sauce none'.split(' ');
const AISLES = ['produce', 'meat', 'dairy', 'bread', 'dry', 'cans', 'frozen', 'fats'];
const TAGS = ['sweet', 'soup', 'nocook', 'mealprep', 'polish', 'icelandic', 'spicy'];
const TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const RANGE = { breakfast: [250, 700], lunch: [300, 800], dinner: [350, 850], snack: [80, 400] };
const err = [];

if (!/^\d{4}-\d\d-\d\d$/.test(cat.updated || '')) err.push('updated must be a YYYY-MM-DD date');
const ING = {};
Object.keys(ING_RAW).forEach(k => { const r = ING_RAW[k]; ING[k] = { p: r[4], f: r[5], c: r[6] }; });
Object.entries(cat.ingredients || {}).forEach(([k, r]) => {
  if (ING_RAW[k]) err.push('ingredient already built in: ' + k);
  if (!/^[a-z0-9_]+$/.test(k)) err.push('bad ingredient key: ' + k);
  ['pl', 'en', 'aisle', 'unit', 'p', 'f', 'c', 'pack', 'packLabel', 'piece', 'color', 'shape', 'diet'].forEach(f => { if (!(f in r)) err.push(k + ' is missing ' + f); });
  if (AISLES.indexOf(r.aisle) < 0) err.push(k + ': unknown aisle ' + r.aisle);
  if (SHAPES.indexOf(r.shape) < 0) err.push(k + ': unknown shape ' + r.shape);
  if (['g', 'ml'].indexOf(r.unit) < 0) err.push(k + ': unit must be g or ml');
  if (r.color && !/^#[0-9A-Fa-f]{6}$/.test(r.color)) err.push(k + ': color must be #RRGGBB or empty');
  if (4 * r.p + 4 * r.c + 9 * r.f > 900) err.push(k + ': more than 900 kcal per 100 g');
  ING[k] = { p: r.p, f: r.f, c: r.c };
});
const ids = {};
(cat.meals || []).forEach(m => {
  const id = m.id;
  if (!/^[a-z0-9_]+$/.test(id || '')) err.push('bad meal id: ' + id);
  if (ids[id]) err.push('duplicate meal id: ' + id); ids[id] = 1;
  ['name', 'pl', 'desc'].forEach(f => { if (typeof m[f] !== 'string' || !m[f]) err.push(id + ' is missing ' + f); });
  if (!Array.isArray(m.types) || !m.types.length || m.types.some(t => TYPES.indexOf(t) < 0)) err.push(id + ': bad types');
  if (!(m.mins > 0)) err.push(id + ': mins must be a number');
  if (['plate', 'bowl'].indexOf(m.style) < 0) err.push(id + ': style must be plate or bowl');
  if (m.style === 'bowl' && m.base && !ING[m.base]) err.push(id + ': unknown base ' + m.base);
  if (!Array.isArray(m.tags) || m.tags.some(t => TAGS.indexOf(t) < 0)) err.push(id + ': tags must be from ' + TAGS.join(', '));
  if (!Array.isArray(m.steps) || !m.steps.length) err.push(id + ': needs steps');
  if (!/^\d{4}-\d\d-\d\d$/.test(m.added || '')) err.push(id + ': added must be a date');
  let p = 0, f = 0, c = 0;
  (m.ing || []).forEach(([k, g]) => {
    if (!ING[k]) { err.push(id + ': unknown ingredient ' + k); return; }
    if (!(g > 0)) err.push(id + ': ' + k + ' needs grams above 0');
    p += ING[k].p * g / 100; f += ING[k].f * g / 100; c += ING[k].c * g / 100;
  });
  const kcal = 4 * Math.round(p) + 4 * Math.round(c) + 9 * Math.round(f);
  if (Array.isArray(m.types) && m.types.every(t => RANGE[t])) {
    const lo = Math.min(...m.types.map(t => RANGE[t][0])), hi = Math.max(...m.types.map(t => RANGE[t][1]));
    if (kcal < lo || kcal > hi) err.push(`${id}: ${kcal} kcal is outside ${lo}-${hi} for ${m.types.join('/')}`);
  }
});
if (err.length) { console.log(err.join('\n')); process.exit(1); }
console.log(`meals.json OK: ${cat.meals.length} meals, ${Object.keys(cat.ingredients).length} extra ingredients, updated ${cat.updated}`);
