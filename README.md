# Posiłki

Meal suggestions, meal prep and shopping lists for stores in Poland and Iceland.
Works as a Home Screen app on iPhone: https://randhood.github.io/posilki/

## Files

- `app/`: the app, built with Preact, Vite and TypeScript (the same setup as Polski B1)
  - `app/src/data/ingredients.json`: the built-in ingredients (macros per 100 g, pack sizes, picture colours)
  - `app/src/services/state.ts`: saved data, `DATA_VERSION` and its migrations
- `meals.json`: the meal catalog (meals, their ingredients, and extra ingredients with macros per 100 g and typical products)
- `products.json`: store products, pack sizes and prices, written every day by a GitHub job
- `scripts/`: the daily product job and the meals.json check

## Develop

```sh
cd app
npm install
npm run dev        # local server
npm test           # migration and share-link tests
npm run build      # production build in app/dist
```

## Updating

1. Make the change and bump `version` in `app/package.json` (it's shown in the side panel and Settings). Stay below 1.0.
2. If saved data changes shape, bump `DATA_VERSION` in `app/src/services/state.ts` and add a migration step, with a test.
3. Push to `main`. The `Deploy to GitHub Pages` workflow tests, builds and publishes within about two minutes (Pages uses Source: GitHub Actions). It also runs after the daily store job, so new prices go live the same morning.

The app picks up a new version the next time it's opened online. Saved data lives on each phone under the localStorage key `posilki` and is never stored in this repository.

## Meal catalog

`meals.json` holds every meal. Each meal lists ingredients as `[ingredient key, grams per portion]`, using keys from `app/src/data/ingredients.json` or from the catalog's own `ingredients` section. Calories and macros are worked out by the app, never stored. `tags` add hand-picked categories (`sweet`, `soup`, `nocook`, `mealprep`, `polish`, `icelandic`, `spicy`); high protein, low calorie, low carb, quick, vegetarian, vegan and fish are worked out from the numbers. Bump `updated` when the file changes so phones pick it up, and run `node scripts/check-meals.mjs` before committing (GitHub runs it too). New meals are added each week by a scheduled Claude task that looks at trending recipes.

## Stores

Only stores whose products the daily job can read are listed: Frisco and Wolt Market in Poland, and Krónan in Iceland. The `Update store products` workflow runs every morning, searches each store for each ingredient (Krónan through the public search on its website, with Icelandic search words), and commits `products.json`. If a store returns far fewer matches than the day before, the job keeps the previous day's data for it.
