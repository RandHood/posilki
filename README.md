# Posiłki

Meal suggestions, meal prep and shopping lists for stores in Poland and Iceland.
Works as a Home Screen app on iPhone.

## Files

- `index.html`: the app
- `meals.json`: the meal catalog (meals, their ingredients, and new ingredients with macros per 100 g and typical products)
- `products.json`: store products, pack sizes and prices, written every day by a GitHub job
- `scripts/`: the daily product job and the meals.json check
- `sw.js`: lets the app open offline and pick up updates
- `manifest.webmanifest`, `*.png`: app name and Home Screen icons

## Updating

1. Replace the changed files in this repository.
2. Bump `VERSION` in `sw.js` (the app version is shown in Settings).
3. The `Deploy to GitHub Pages` workflow publishes within about two minutes (Pages uses Source: GitHub Actions). It also runs after the daily store job. The app picks it up the next time it's opened online.

## Meal catalog

`meals.json` holds every meal. Each meal lists ingredients as `[ingredient key, grams per portion]`, using keys from `index.html` or from the catalog's own `ingredients` section. Calories and macros are worked out by the app, never stored. `tags` add hand-picked categories (`sweet`, `soup`, `nocook`, `mealprep`, `polish`, `icelandic`, `spicy`); high protein, low calorie, low carb, quick, vegetarian, vegan and fish are worked out from the numbers. Bump `updated` when the file changes so phones pick it up, and run `node scripts/check-meals.mjs` before committing (GitHub runs it too). New meals are added each week by a scheduled Claude task that looks at trending recipes.

## Stores

Only stores whose products the daily job can read are listed: Frisco and Wolt Market in Poland, and Krónan in Iceland. The `Update store products` workflow runs every morning, searches each store for each ingredient (Krónan through the public search on its website, with Icelandic search words), and commits `products.json`. If a store returns far fewer matches than the day before, the job keeps the previous day's data for it.

Saved data lives on each phone and is never stored in this repository.

## New app (in progress)

`app/` holds the next version of Posiłki, rebuilt with Preact, Vite and TypeScript (the same setup as Polski B1). It keeps the same saved data (localStorage key `posilki`, DATA_VERSION 5 and its migrations), the same look, the same `#recipe=` share links, and reads `meals.json` and `products.json` from the repo root.

While it's being tested it's published at https://randhood.github.io/posilki/next/ with its own storage key (`posilki-next`), so it never touches the real app's data. To try it with your data, export a backup in the current app and import it in the preview.

```sh
cd app
npm install
npm run dev        # local server
npm test           # migration and share-link tests
npm run build      # production build in app/dist
```
